import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// Nano Banana Pro API配置
const API_CONFIG = {
  host: process.env.API_HOST || 'https://grsai.dakka.com.cn',
  key: process.env.API_KEY || ''
}

/**
 * 调用Nano Banana Pro生图API
 * @param {Object} params - 生图参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.aspectRatio - 图片比例
 * @param {string} params.imageSize - 图片分辨率
 * @param {string[]} params.urls - 参考图URL或Base64数组（最多20张）
 * @returns {Promise<Object>} API响应
 */
export const callNanoBananaAPI = async (params) => {
  console.log('API配置:', { host: API_CONFIG.host, hasKey: !!API_CONFIG.key })
  
  if (!API_CONFIG.key) {
    console.warn('API_KEY未配置，使用模拟数据')
    return mockAPIResponse(params)
  }

  try {
    console.log('发起API请求到:', `${API_CONFIG.host}/v1/draw/nano-banana`)
    
    const requestBody = {
      model: 'nano-banana-pro',
      prompt: params.prompt,
      aspectRatio: params.aspectRatio || 'auto',
      imageSize: params.imageSize || '1K',
      webHook: '-1'
    }
    
    // 添加参考图urls（如果有）
    if (params.urls && params.urls.length > 0) {
      requestBody.urls = params.urls.slice(0, 20)
      console.log('包含参考图数量:', requestBody.urls.length)
    }
    
    // 发起生图请求，使用webHook="-1"立即返回任务ID
    const response = await axios.post(
      `${API_CONFIG.host}/v1/draw/nano-banana`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    if (response.data.code !== 0) {
      throw new Error(response.data.msg || '生图请求失败')
    }

    const taskId = response.data.data.id

    // 轮询获取结果
    const result = await pollForResult(taskId)
    return result

  } catch (error) {
    console.error('API调用失败:', error.message)
    throw new Error('API调用失败: ' + error.message)
  }
}

/**
 * 轮询获取生图结果
 */
const pollForResult = async (taskId, maxRetries = 60, interval = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))

    try {
      const response = await axios.post(
        `${API_CONFIG.host}/v1/draw/result`,
        { id: taskId },
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.key}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      const data = response.data.data || response.data

      if (data.status === 'succeeded') {
        return {
          images: data.results.map(r => ({
            url: r.url,
            content: r.content
          }))
        }
      }

      if (data.status === 'failed') {
        throw new Error(data.failure_reason || data.error || '生图失败')
      }

    } catch (error) {
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
const mockAPIResponse = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        images: [{
          url: 'https://via.placeholder.com/512',
          content: params.prompt
        }]
      })
    }, 1000)
  })
}

