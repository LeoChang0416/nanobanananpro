import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callNanoBananaAPI } from '../services/apiService.js'

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
  return JSON.parse(data)
}

// 写入元数据
const writeMetadata = (data) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2))
}

// 生成图片
export const generateImage = async (req, res) => {
  try {
    const { prompt, aspectRatio = 'auto', imageSize = '1K' } = req.body
    console.log('收到生图请求:', { prompt, aspectRatio, imageSize })

    if (!prompt) {
      return res.status(400).json({ error: '缺少prompt参数' })
    }

    // 调用Nano Banana Pro API
    console.log('开始调用API...')
    const result = await callNanoBananaAPI({
      prompt,
      aspectRatio,
      imageSize
    })
    console.log('API返回结果:', result)

    // 保存图片到本地
    const images = []
    const metadata = readMetadata()

    for (let i = 0; i < result.images.length; i++) {
      const imageData = result.images[i]
      const id = `${Date.now()}_${i}`
      const filename = `${id}.png`
      const filepath = path.join(STORAGE_DIR, filename)

      // 下载图片并保存到本地
      if (imageData.url) {
        try {
          const response = await fetch(imageData.url)
          const buffer = Buffer.from(await response.arrayBuffer())
          fs.writeFileSync(filepath, buffer)
        } catch (downloadError) {
          console.error('下载图片失败:', downloadError)
        }
      }

      const imageRecord = {
        id,
        prompt,
        aspectRatio,
        imageSize,
        filename,
        url: `/storage/images/${filename}`,
        remoteUrl: imageData.url,
        createdAt: Date.now()
      }

      images.push(imageRecord)
      metadata.unshift(imageRecord)
    }

    writeMetadata(metadata)

    res.json({
      success: true,
      images,
      message: '生成成功'
    })
  } catch (error) {
    console.error('生成图片失败:', error)
    res.status(500).json({ 
      error: '生成失败', 
      message: error.message 
    })
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

    // 删除文件
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    // 删除元数据记录
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

