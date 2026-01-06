import { defineStore } from 'pinia'
import { ref } from 'vue'
import { imageAPI } from '../api'

export const useImageStore = defineStore('image', () => {
  const images = ref([])
  const loading = ref(false)
  const tasks = ref([]) // 并发任务队列

  const fetchImages = async () => {
    loading.value = true
    try {
      const data = await imageAPI.getList()
      images.value = data.images || []
    } catch (error) {
      console.error('获取图片列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建任务并开始生成（支持多并发）
  const createTask = async (params) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const task = {
      id: taskId,
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      imageSize: params.imageSize,
      status: 'pending', // pending / running / succeeded / failed
      progress: 0,
      error: null,
      createdAt: Date.now()
    }
    
    tasks.value.unshift(task)
    
    // 异步执行，不阻塞
    executeTask(taskId, params)
    
    return taskId
  }

  // 执行任务
  const executeTask = async (taskId, params) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    task.status = 'running'
    task.progress = 5

    try {
      console.log('开始执行任务:', taskId)
      const data = await imageAPI.generate(params)
      console.log('任务完成:', taskId, data)

      task.status = 'succeeded'
      task.progress = 100

      if (data.images && data.images.length > 0) {
        data.images.forEach(img => {
          images.value.unshift(img)
        })
      }

      // 3秒后移除成功的任务卡片
      setTimeout(() => {
        removeTask(taskId)
      }, 3000)

    } catch (error) {
      console.error('任务失败:', taskId, error)
      task.status = 'failed'
      task.progress = 0
      task.error = error.response?.data?.message || error.message || '生成失败'
    }
  }

  // 移除任务
  const removeTask = (taskId) => {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
    }
  }

  // 重试任务
  const retryTask = (taskId) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || task.status !== 'failed') return

    const params = {
      prompt: task.prompt,
      aspectRatio: task.aspectRatio,
      imageSize: task.imageSize
    }

    task.status = 'pending'
    task.progress = 0
    task.error = null

    executeTask(taskId, params)
  }

  const deleteImage = async (id) => {
    try {
      await imageAPI.delete(id)
      images.value = images.value.filter(img => img.id !== id)
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    }
  }

  return {
    images,
    loading,
    tasks,
    fetchImages,
    createTask,
    removeTask,
    retryTask,
    deleteImage
  }
})
