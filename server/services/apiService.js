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
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    if (onProgress) onProgress(10, 'running')
    
    console.log('发起API请求到:', `${API_CONFIG.host}/v1/draw/nano-banana`)
    
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

    console.log('API响应状态码:', response.status)
    console.log('API响应数据:', JSON.stringify(response.data).substring(0, 500))

    if (response.data.code !== 0) {
      console.error('API返回错误:', response.data)
      throw new Error(response.data.msg || '生图请求失败')
    }

    const taskId = response.data.data.id
    console.log('获得任务ID:', taskId)

    if (onProgress) onProgress(15, 'running')

    console.log('开始轮询结果...')
    const result = await pollForResult(taskId, onProgress, isCancelled)
    console.log('轮询完成，获得结果')
    return result

  } catch (error) {
    console.error('API调用失败 - 完整错误:', error)
    console.error('错误消息:', error.message)
    console.error('错误响应:', error.response?.data)
    throw new Error(error.message.includes('取消') ? error.message : 'API调用失败: ' + error.message)
  }
}

/**
 * 轮询获取生图结果
 */
const pollForResult = async (taskId, onProgress, isCancelled, maxRetries = 150, interval = 2000) => {
  console.log(`开始轮询任务 ${taskId}，最多重试${maxRetries}次（约5分钟）`)
  
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    
    if (isCancelled && isCancelled()) {
      console.log('任务被取消')
      throw new Error('任务已取消')
    }
    
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
      const apiProgress = data.progress || 0
      console.log(`任务状态: ${data.status}, API进度: ${apiProgress}%`)
      
      const mappedProgress = 15 + Math.round((apiProgress / 100) * 80)
      if (onProgress) onProgress(mappedProgress, 'running')

      if (data.status === 'succeeded') {
        console.log('任务成功完成!')
        if (onProgress) onProgress(100, 'succeeded')
        return {
          images: data.results.map(r => ({
            url: r.url,
            content: r.content
          }))
        }
      }

      if (data.status === 'failed') {
        const errorMsg = data.failure_reason || data.error || '生图失败'
        
        if (errorMsg === 'output_moderation' || errorMsg === 'input_moderation') {
          console.error('内容审核失败，停止轮询:', errorMsg)
          throw new Error('内容审核未通过，请修改提示词或参考图')
        }
        
        if (errorMsg === 'error') {
          console.warn(`任务失败(error)，将重试... (第${i + 1}次)`)
          continue
        }
        
        console.error('任务失败，停止轮询:', errorMsg)
        throw new Error(errorMsg)
      }

    } catch (error) {
      if (error.message.includes('取消') || error.message.includes('审核')) {
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

