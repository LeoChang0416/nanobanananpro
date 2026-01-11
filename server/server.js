import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import imageRoutes from './routes/images.js'
import authRoutes from './routes/auth.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 确保存储目录存在
const STORAGE_DIR = path.join(__dirname, 'storage', 'images')
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

// 中间�?
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服�?
app.use('/storage', express.static(path.join(__dirname, 'storage')))

// 路由
app.use('/api', imageRoutes)
app.use('/api', authRoutes)

// 健康检�?
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})


