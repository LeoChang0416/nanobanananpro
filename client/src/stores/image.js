import { defineStore } from 'pinia'
import { ref } from 'vue'
import { imageAPI } from '../api'

export const useImageStore = defineStore('image', () => {
  const images = ref([])
  const loading = ref(false)
  const generating = ref(false)

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

  const generateImage = async (params) => {
    generating.value = true
    try {
      console.log('开始生成图片，参数:', params)
      const data = await imageAPI.generate(params)
      console.log('生成完成，返回数据:', data)
      
      if (data.images && data.images.length > 0) {
        // API返回的是images数组
        data.images.forEach(img => {
          images.value.unshift(img)
        })
      }
      return data
    } catch (error) {
      console.error('生成图片失败:', error)
      throw error
    } finally {
      generating.value = false
    }
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
    generating,
    fetchImages,
    generateImage,
    deleteImage
  }
})

