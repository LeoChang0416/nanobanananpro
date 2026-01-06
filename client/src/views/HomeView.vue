<template>
  <div class="home-view">
    <AppHeader />
    
    <main class="main-content">
      <div class="container">
        <GeneratePanel @generate="handleGenerate" />
        
        <!-- 任务队列 -->
        <section v-if="store.tasks.length > 0" class="tasks-section">
          <h3 class="section-title">生成任务</h3>
          <div class="tasks-grid">
            <TaskCard 
              v-for="task in store.tasks" 
              :key="task.id"
              :task="task"
              @remove="store.removeTask"
              @retry="store.retryTask"
            />
          </div>
        </section>
        
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
import TaskCard from '../components/TaskCard.vue'

const store = useImageStore()

const modalVisible = ref(false)
const selectedImage = ref(null)

const recentImages = computed(() => store.images.slice(0, 8))

const handleGenerate = async (params) => {
  // 创建任务，不阻塞，直接返回
  store.createTask(params)
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

.tasks-section {
  margin-top: var(--spacing-xl);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: var(--spacing-lg);
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.recent-section {
  margin-top: var(--spacing-2xl);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}
</style>
