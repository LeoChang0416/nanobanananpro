<template>
  <div class="home-view">
    <AppHeader />
    
    <main class="main-content">
      <div class="container">
        <GeneratePanel 
          :loading="store.generating" 
          @generate="handleGenerate" 
        />
        
        <section v-if="store.images.length > 0" class="recent-section">
          <h3 class="section-title">最近生成</h3>
          <div class="image-grid">
            <ImageCard 
              v-for="image in recentImages" 
              :key="image.id"
              :image="image"
              @view="handleView"
              @delete="handleDelete"
            />
          </div>
        </section>
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
import { ref, computed, onMounted } from 'vue'
import { useImageStore } from '../stores/image'
import AppHeader from '../components/AppHeader.vue'
import GeneratePanel from '../components/GeneratePanel.vue'
import ImageCard from '../components/ImageCard.vue'
import ImageModal from '../components/ImageModal.vue'

const store = useImageStore()

const modalVisible = ref(false)
const selectedImage = ref(null)

const recentImages = computed(() => store.images.slice(0, 8))

const handleGenerate = async (params) => {
  try {
    await store.generateImage(params)
    alert('生成成功！')
  } catch (error) {
    console.error('生成失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '生成失败'
    alert(`生成失败：${errorMsg}\n\n${errorMsg.includes('审核') ? '建议：\n- 修改提示词避免敏感内容\n- 更换参考图\n- 简化描述' : '请稍后重试'}`)
  }
}

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
.home-view {
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

.recent-section {
  margin-top: var(--spacing-2xl);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: var(--spacing-lg);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}
</style>

