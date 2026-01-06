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
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    )

    console.log('API响应状态码:', response.status)
    console.log('API响应数据:', JSON.stringify(response.data).substring(0, 500))

    if (response.data.code !== 0) {
      console.error('API返回错误:', response.data)
      throw new Error(response.data.msg || '生图请求失败')
    }

    const taskId = response.data.data.id
    console.log('获得任务ID:', taskId)

    // 轮询获取结果
    console.log('开始轮询结果...')
    const result = await pollForResult(taskId)
    console.log('轮询完成，获得结果')
    return result

  } catch (error) {
    console.error('API调用失败 - 完整错误:', error)
    console.error('错误消息:', error.message)
    console.error('错误响应:', error.response?.data)
    throw new Error('API调用失败: ' + error.message)
  }
}

/**
 * 轮询获取生图结果
 */
const pollForResult = async (taskId, maxRetries = 60, interval = 2000) => {
  console.log(`开始轮询任务 ${taskId}，最多重试${maxRetries}次`)
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    console.log(`第 ${i + 1}/${maxRetries} 次轮询...`)

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
      console.log(`任务状态: ${data.status}, 进度: ${data.progress}%`)

      if (data.status === 'succeeded') {
        console.log('任务成功完成!')
        return {
          images: data.results.map(r => ({
            url: r.url,
            content: r.content
          }))
        }
      }

      if (data.status === 'failed') {
        const errorMsg = data.failure_reason || data.error || '生图失败'
        console.error('任务失败，停止轮询:', errorMsg)
        throw new Error(errorMsg)
      }

    } catch (error) {
      // 如果是明确的失败状态，直接抛出不再重试
      if (error.message === 'output_moderation' || 
          error.message === 'input_moderation' || 
          error.message.includes('moderation')) {
        throw new Error('内容审核未通过，请修改提示词或参考图')
      }
      
      // 其他明确的错误类型也直接失败
      if (error.message === 'error' || 
          error.message.includes('生图失败') ||
          error.message.includes('Invalid')) {
        throw error
      }
      
      console.error(`轮询出错 (第${i + 1}次):`, error.message)
      if (i === maxRetries - 1) {
        throw error
      }
    }
  }

  console.error('轮询超时')
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

