import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callNanoBananaAPI } from '../services/apiService.js'
import taskManager from '../services/taskManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_DIR = path.join(__dirname, '..', 'storage', 'images')
const METADATA_FILE = path.join(__dirname, '..', 'storage', 'metadata.json')

// 读取元数据
const readMetadata = () => {
  if (!fs.existsSync(METADATA_FILE)) {
    return []
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf-8')
  const parsed = JSON.parse(data)
  const list = Array.isArray(parsed) ? parsed : []
  return list.map(img => ({ ...img, username: img.username || '匿名' }))
}

// 写入元数据
const writeMetadata = (data) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2))
}

// 生成图片（异步，立即返回任务ID）
export const generateImage = async (req, res) => {
  try {
    const { prompt, aspectRatio = 'auto', imageSize = '1K', urls } = req.body
    const username = req.user?.username || '匿名'
    
    if (!prompt) {
      return res.status(400).json({ error: '缺少prompt参数' })
    }

    // 创建任务
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const task = taskManager.createTask(taskId, { prompt, aspectRatio, imageSize, urls, username })
    
    console.log('创建任务:', taskId, { prompt: prompt.substring(0, 50), aspectRatio, imageSize, urlsCount: urls?.length || 0 })

    // 立即返回任务ID
    res.json({
      success: true,
      taskId,
      task
    })

    // 异步执行生成
    executeGeneration(taskId, { prompt, aspectRatio, imageSize, urls, username })
    
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({ 
      error: '创建任务失败', 
      message: error.message 
    })
  }
}

// 异步执行生成任务
const executeGeneration = async (taskId, params) => {
  try {
    taskManager.updateTask(taskId, { status: 'running', progress: 5 })

    // 进度回调
    const onProgress = (progress, status) => {
      // 检查是否被取消
      if (taskManager.isTaskCancelled(taskId)) {
        throw new Error('任务已取消')
      }
      taskManager.updateTask(taskId, { progress, status: status || 'running' })
    }

    // 取消检查
    const isCancelled = () => taskManager.isTaskCancelled(taskId)

    console.log('开始执行任务:', taskId)
    const result = await callNanoBananaAPI(params, onProgress, isCancelled)
    console.log('任务完成:', taskId)

    // 保存图片到本地
    const images = []

    for (let i = 0; i < result.images.length; i++) {
      const imageData = result.images[i]
      const id = `${Date.now()}_${i}`
      const filename = `${id}.png`
      const filepath = path.join(STORAGE_DIR, filename)

      if (imageData.url) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 60000) // 60秒超时
          
          const response = await fetch(imageData.url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          })
          clearTimeout(timeout)
          
          if (!response.ok) throw new Error(`下载失败: ${response.status}`)
          const buffer = Buffer.from(await response.arrayBuffer())
          fs.writeFileSync(filepath, buffer)
          console.log(`✅ 图片下载成功: ${filename}`)
        } catch (downloadError) {
          console.error('下载图片失败:', downloadError)
          throw new Error('图片下载失败，请重试')
        }
      }

      const imageRecord = {
        id,
        username: params.username || '匿名',
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        referenceUrls: params.urls || [],
        apiType: result.apiType || 'unknown',
        filename,
        url: `/storage/images/${filename}`,
        remoteUrl: imageData.url,
        createdAt: Date.now()
      }

      images.push(imageRecord)
      
      // ✅ 每次保存后立即更新metadata，避免并发丢失
      const metadata = readMetadata()
      metadata.unshift(imageRecord)
      writeMetadata(metadata)
      
      console.log(`✅ 图片已保存并记录: ${filename}`)
    }

    taskManager.updateTask(taskId, {
      status: 'succeeded',
      progress: 100,
      result: { images }
    })

  } catch (error) {
    console.error('任务执行失败:', taskId, error.message)
    taskManager.updateTask(taskId, {
      status: error.message === '任务已取消' ? 'cancelled' : 'failed',
      progress: 0,
      error: error.message
    })
  }
}

// 获取所有任务
export const getTasks = (req, res) => {
  try {
    const tasks = taskManager.getAllTasks()
    res.json({
      success: true,
      tasks
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 获取单个任务状态
export const getTaskById = (req, res) => {
  try {
    const { id } = req.params
    const task = taskManager.getTask(id)
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }

    res.json({
      success: true,
      task
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 取消任务
export const cancelTask = (req, res) => {
  try {
    const { id } = req.params
    const success = taskManager.cancelTask(id)
    
    if (!success) {
      return res.status(400).json({ error: '任务无法取消（可能已完成或不存在）' })
    }

    res.json({
      success: true,
      message: '任务已取消'
    })
  } catch (error) {
    console.error('取消任务失败:', error)
    res.status(500).json({ error: '取消失败' })
  }
}

// 删除任务
export const deleteTaskById = (req, res) => {
  try {
    const { id } = req.params
    taskManager.deleteTask(id)
    res.json({ success: true, message: '任务已删除' })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({ error: '删除失败' })
  }
}

// 获取图片列表
export const getImages = (req, res) => {
  try {
    const metadata = readMetadata()
    res.json({
      success: true,
      images: metadata,
      total: metadata.length
    })
  } catch (error) {
    console.error('获取图片列表失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 获取图片详情
export const getImageById = (req, res) => {
  try {
    const { id } = req.params
    const metadata = readMetadata()
    const image = metadata.find(img => img.id === id)

    if (!image) {
      return res.status(404).json({ error: '图片不存在' })
    }

    res.json({
      success: true,
      image
    })
  } catch (error) {
    console.error('获取图片详情失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 删除图片
export const deleteImage = (req, res) => {
  try {
    const { id } = req.params
    const metadata = readMetadata()
    const imageIndex = metadata.findIndex(img => img.id === id)

    if (imageIndex === -1) {
      return res.status(404).json({ error: '图片不存在' })
    }

    const image = metadata[imageIndex]
    const filepath = path.join(STORAGE_DIR, image.filename)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    metadata.splice(imageIndex, 1)
    writeMetadata(metadata)

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除图片失败:', error)
    res.status(500).json({ error: '删除失败' })
  }
}
