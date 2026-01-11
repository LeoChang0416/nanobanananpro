import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// 主API配置
const API_CONFIG = {
  host: process.env.API_HOST || 'https://grsai.dakka.com.cn',
  key: process.env.API_KEY || ''
}

// 备用API配置 (APImart)
const FALLBACK_API_CONFIG = {
  host: 'https://api.apimart.ai',
  key: 'sk-QDveW1X9IX9GAkWuQ9GbL9NAZSaJA9OfXQ5lbySqYe1zVAIV',
  model: 'gemini-3-pro-image-preview'
}

/**
 * 调用Nano Banana Pro生图API
 * @param {Object} params - 生图参数
 * @param {Function} onProgress - 进度回调 (progress, status)
 * @param {Function} isCancelled - 取消检查函数
 * @returns {Promise<Object>} API响应
 */
export const callNanoBananaAPI = async (params, onProgress, isCancelled) => {
  console.log('API配置:', { host: API_CONFIG.host, hasKey: !!API_CONFIG.key })
  
  if (!API_CONFIG.key) {
    console.warn('API_KEY未配置，使用模拟数据')
    return mockAPIResponse(params, onProgress, isCancelled)
  }

  try {
    return await callPrimaryAPI(params, onProgress, isCancelled)
  } catch (error) {
    // 如果是审核失败，尝试备用API
    if (error.message.includes('内容审核未通过')) {
      console.warn('⚠️ 主API审核失败，切换到备用API')
      try {
        return await callFallbackAPI(params, onProgress, isCancelled)
      } catch (fallbackError) {
        console.error('备用API也失败:', fallbackError)
        throw new Error('主备API均失败: ' + fallbackError.message)
      }
    }
    throw error
  }
}

/**
 * 调用主API (原Nano Banana API)
 */
const callPrimaryAPI = async (params, onProgress, isCancelled) => {
  try {
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    if (onProgress) onProgress(10, 'running')
    
    console.log('🔵 主API: 发起请求到:', `${API_CONFIG.host}/v1/draw/nano-banana`)
    
    const requestBody = {
      model: 'nano-banana-pro',
      prompt: params.prompt,
      aspectRatio: params.aspectRatio || 'auto',
      imageSize: params.imageSize || '1K',
      webHook: '-1'
    }
    
    if (params.urls && params.urls.length > 0) {
      requestBody.urls = params.urls.slice(0, 20)
      console.log('包含参考图数量:', requestBody.urls.length)
    }
    
    const response = await axios.post(
      `${API_CONFIG.host}/v1/draw/nano-banana`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    )

    if (response.data.code !== 0) {
      throw new Error(response.data.msg || '生图请求失败')
    }

    const taskId = response.data.data.id
    console.log('🔵 主API任务ID:', taskId)

    if (onProgress) onProgress(15, 'running')

    const result = await pollForResult(taskId, onProgress, isCancelled, 'primary')
    result.apiType = 'primary'
    console.log('🔵 主API完成')
    return result

  } catch (error) {
    console.error('🔵 主API失败:', error.message)
    throw error
  }
}

/**
 * 调用备用API (APImart)
 */
const callFallbackAPI = async (params, onProgress, isCancelled) => {
  try {
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    if (onProgress) onProgress(10, 'running')
    
    console.log('🟢 备用API: 发起请求到:', `${FALLBACK_API_CONFIG.host}/v1/images/generations`)
    
    // 转换参数格式
    const requestBody = {
      model: FALLBACK_API_CONFIG.model,
      prompt: params.prompt,
      size: params.aspectRatio === 'auto' ? '1:1' : params.aspectRatio,
      resolution: params.imageSize || '1K',
      n: 1
    }
    
    // 转换参考图格式
    if (params.urls && params.urls.length > 0) {
      requestBody.image_urls = params.urls.slice(0, 14).map(url => ({ url }))
      console.log('🟢 包含参考图数量:', requestBody.image_urls.length)
    }
    
    console.log('🟢 备用API请求体:', JSON.stringify(requestBody).substring(0, 200))
    
    const response = await axios.post(
      `${FALLBACK_API_CONFIG.host}/v1/images/generations`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${FALLBACK_API_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    )

    console.log('🟢 备用API响应:', JSON.stringify(response.data).substring(0, 300))

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '备用API请求失败')
    }

    const taskId = response.data.data[0].task_id
    console.log('🟢 备用API任务ID:', taskId)

    if (onProgress) onProgress(15, 'running')

    const result = await pollForFallbackResult(taskId, onProgress, isCancelled)
    result.apiType = 'fallback'
    console.log('🟢 备用API完成')
    return result

  } catch (error) {
    console.error('🟢 备用API失败:', error.message)
    console.error('🟢 备用API错误详情:', error.response?.data)
    throw error
  }
}

/**
 * 轮询备用API结果 (独立函数，避免与主API混淆)
 */
const pollForFallbackResult = async (taskId, onProgress, isCancelled, maxRetries = 150, interval = 2000) => {
  console.log(`🟢 开始轮询备用API任务 ${taskId}`)
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    try {
      const response = await axios.get(
        `${FALLBACK_API_CONFIG.host}/v1/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${FALLBACK_API_CONFIG.key}`
          },
          timeout: 10000
        }
      )
      
      const data = response.data.data || response.data
      console.log(`🟢 第${i + 1}次: status=${data.status}`)
      
      const apiProgress = data.progress || 0
      const mappedProgress = 15 + Math.round((apiProgress / 100) * 80)
      if (onProgress) onProgress(mappedProgress, 'running')

      // 成功
      if (data.status === 'succeeded' || data.status === 'completed' || data.status === 'success') {
        console.log('🟢 备用API任务成功!')
        console.log('🟢 备用API完整响应:', JSON.stringify(data, null, 2))
        if (onProgress) onProgress(100, 'succeeded')
        
        // 提取图片URL - APImart返回格式: data.output 是数组
        let images = []
        
        // 尝试多种可能的字段
        const outputData = data.output || data.images || data.results || []
        
        if (Array.isArray(outputData)) {
          images = outputData.map(img => ({
            url: typeof img === 'string' ? img : (img.url || img.image_url || img),
            content: ''
          }))
        } else if (typeof outputData === 'string') {
          images.push({ url: outputData, content: '' })
        }
        
        // 兜底：直接从data.url获取
        if (images.length === 0 && data.url) {
          images.push({ url: data.url, content: '' })
        }
        
        console.log('🟢 提取到的图片URLs:', images.map(img => img.url))
        
        if (images.length === 0) {
          throw new Error('备用API未返回图片URL')
        }
        
        return { images }
      }

      // 失败
      if (data.status === 'failed' || data.status === 'error') {
        const errorMsg = data.failure_reason || data.error || data.message || '生图失败'
        console.error('🟢 备用API任务失败:', errorMsg)
        throw new Error(errorMsg)
      }

    } catch (error) {
      if (error.message.includes('取消')) {
        throw error
      }
      
      console.error(`🟢 轮询出错 (第${i + 1}次):`, error.message)
      if (i === maxRetries - 1) {
        throw error
      }
    }
  }

  throw new Error('备用API生图超时')
}

/**
 * 轮询获取主API生图结果
 */
const pollForResult = async (taskId, onProgress, isCancelled, apiType = 'primary', maxRetries = 150, interval = 2000) => {
  console.log(`🔵 开始轮询主API任务 ${taskId}，最多重试${maxRetries}次`)
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.host}/v1/draw/result`,
        { id: taskId },
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )
      
      const data = response.data.data || response.data
      const apiProgress = data.progress || 0
      console.log(`🔵 第${i + 1}次: ${data.status}, 进度: ${apiProgress}%`)
      
      const mappedProgress = 15 + Math.round((apiProgress / 100) * 80)
      if (onProgress) onProgress(mappedProgress, 'running')

      // 处理成功状态
      if (data.status === 'succeeded') {
        console.log('🔵 主API任务成功完成!')
        if (onProgress) onProgress(100, 'succeeded')
        return {
          images: data.results.map(r => ({ url: r.url, content: r.content }))
        }
      }

      // 处理失败状态
      if (data.status === 'failed') {
        const errorMsg = data.failure_reason || data.error || '生图失败'
        
        if (errorMsg === 'output_moderation' || errorMsg === 'input_moderation') {
          console.error('🔵 主API内容审核失败:', errorMsg)
          throw new Error('内容审核未通过，请修改提示词或参考图')
        }
        
        if (errorMsg === 'error' && i < maxRetries - 1) {
          console.warn(`🔵 任务失败(error)，继续重试...`)
          continue
        }
        
        throw new Error(errorMsg)
      }

    } catch (error) {
      if (error.message.includes('取消') || error.message.includes('审核')) {
        throw error
      }
      
      console.error(`🔵 轮询出错 (第${i + 1}次):`, error.message)
      if (i === maxRetries - 1) {
        throw error
      }
    }
  }

  throw new Error('生图超时')
}

/**
 * 模拟API响应（开发测试用）
 */
const mockAPIResponse = async (params, onProgress, isCancelled) => {
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }
    
    const progress = Math.round((i / steps) * 100)
    if (onProgress) onProgress(progress, 'running')
  }
  
  return {
    images: [{
      url: 'https://via.placeholder.com/512',
      content: params.prompt
    }]
  }
}

