<template>
  <div class="gallery-view">
    <AppHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="gallery-header">
          <h1 class="title">作品集</h1>
          <p class="count">共 {{ store.images.length }} 张作品</p>
        </div>

        <div v-if="store.loading" class="loading">加载中...</div>
        
        <div v-else-if="store.images.length === 0" class="empty">
          <p class="empty-icon">🎨</p>
          <p class="empty-text">还没有作品</p>
          <router-link to="/" class="empty-link">去创作</router-link>
        </div>

        <div v-else class="image-grid">
          <ImageCard 
            v-for="image in store.images" 
            :key="image.id"
            :image="image"
            @view="handleView"
            @delete="handleDelete"
          />
        </div>
      </div>
    </main>

    <ImageModal 
      :visible="modalVisible" 
      :image="selectedImage" 
      @close="modalVisible = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useImageStore } from '../stores/image'
import AppHeader from '../components/AppHeader.vue'
import ImageCard from '../components/ImageCard.vue'
import ImageModal from '../components/ImageModal.vue'

const store = useImageStore()

const modalVisible = ref(false)
const selectedImage = ref(null)

const handleView = (image) => {
  selectedImage.value = image
  modalVisible.value = true
}

const handleDelete = async (id) => {
  if (confirm('确定要删除这张图片吗？')) {
    try {
      await store.deleteImage(id)
    } catch (error) {
      alert('删除失败')
    }
  }
}

onMounted(() => {
  store.fetchImages()
})
</script>

<style scoped>
.gallery-view {
  min-height: 100vh;
  background: var(--color-bg-page);
}

.main-content {
  padding: var(--spacing-2xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.gallery-header {
  margin-bottom: var(--spacing-xl);
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: var(--spacing-xs);
}

.count {
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.empty {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-link {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.empty-link:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}
</style>

