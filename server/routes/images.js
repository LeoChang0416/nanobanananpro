import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { 
  generateImage, 
  getImages, 
  getImageById, 
  deleteImage,
  getTasks,
  getTaskById,
  cancelTask,
  deleteTaskById
} from '../controllers/imageController.js'

const router = express.Router()

// 生成图片
router.post('/generate', requireAuth, generateImage)

// 任务管理
router.get('/tasks', getTasks)
router.get('/tasks/:id', getTaskById)
router.post('/tasks/:id/cancel', cancelTask)
router.delete('/tasks/:id', deleteTaskById)

// 图片管理
router.get('/images', getImages)
router.get('/images/:id', getImageById)
router.delete('/images/:id', deleteImage)

export default router

