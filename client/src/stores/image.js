import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { imageAPI, taskAPI } from '../api'

export const useImageStore = defineStore('image', () => {
  const images = ref([])
  const loading = ref(false)
  const tasks = ref([])
  let pollingTimer = null

  // 获取图片列表
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

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const data = await taskAPI.getAll()
      tasks.value = data.tasks || []
    } catch (error) {
      console.error('获取任务列表失败:', error)
    }
  }

  // 启动轮询
  const startPolling = () => {
    if (pollingTimer) return
    
    pollingTimer = setInterval(async () => {
      const activeTasks = tasks.value.filter(t => 
        t.status === 'pending' || t.status === 'running'
      )
      
      if (activeTasks.length === 0) return
      
      try {
        const data = await taskAPI.getAll()
        const newTasks = data.tasks || []
        
        // 更新任务状态
        newTasks.forEach(newTask => {
          const index = tasks.value.findIndex(t => t.id === newTask.id)
          if (index > -1) {
            const oldTask = tasks.value[index]
            
            // 如果状态变为成功，刷新图片列表
            if (oldTask.status !== 'succeeded' && newTask.status === 'succeeded') {
              fetchImages()
              // 3秒后自动移除成功的任务
              setTimeout(() => {
                removeTask(newTask.id)
              }, 3000)
            }
            
            tasks.value[index] = newTask
          } else {
            tasks.value.push(newTask)
          }
        })
        
        // 删除已不存在的任务
        tasks.value = tasks.value.filter(t => 
          newTasks.some(nt => nt.id === t.id) || 
          (t.status !== 'pending' && t.status !== 'running')
        )
      } catch (error) {
        console.error('轮询任务失败:', error)
      }
    }, 2000)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  // 创建任务
  const createTask = async (params) => {
    try {
      const data = await imageAPI.generate(params)
      
      if (data.task) {
        tasks.value.unshift(data.task)
      }
      
      // 确保轮询运行
      startPolling()
      
      return data.taskId
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  }

  // 取消任务
  const cancelTask = async (taskId) => {
    try {
      await taskAPI.cancel(taskId)
      
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.status = 'cancelled'
      }
    } catch (error) {
      console.error('取消任务失败:', error)
      throw error
    }
  }

  // 移除任务
  const removeTask = async (taskId) => {
    try {
      await taskAPI.delete(taskId)
    } catch (error) {
      // 忽略删除失败
    }
    
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
    }
  }

  // 重试任务
  const retryTask = async (taskId) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const params = {
      prompt: task.prompt,
      aspectRatio: task.aspectRatio,
      imageSize: task.imageSize
    }

    // 先移除旧任务
    await removeTask(taskId)
    
    // 创建新任务
    await createTask(params)
  }

  // 删除图片
  const deleteImage = async (id) => {
    try {
      await imageAPI.delete(id)
      images.value = images.value.filter(img => img.id !== id)
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    }
  }

  // 初始化
  const init = async () => {
    await Promise.all([fetchImages(), fetchTasks()])
    startPolling()
  }

  return {
    images,
    loading,
    tasks,
    fetchImages,
    fetchTasks,
    createTask,
    cancelTask,
    removeTask,
    retryTask,
    deleteImage,
    init,
    startPolling,
    stopPolling
  }
})
