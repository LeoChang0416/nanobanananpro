import express from 'express'
import { generateImage, getImages, getImageById, deleteImage } from '../controllers/imageController.js'

const router = express.Router()

// 生成图片
router.post('/generate', generateImage)

// 获取图片列表
router.get('/images', getImages)

// 获取图片详情
router.get('/images/:id', getImageById)

// 删除图片
router.delete('/images/:id', deleteImage)

export default router

