import express from 'express'
import { createUser, getUserByUsername, verifyPassword } from '../services/userManager.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: '缺少参数' })

    const user = await createUser({ username, password })
    const token = signToken({ username: user.username })
    return res.json({ success: true, user, token })
  } catch (e) {
    if (e?.code === 'USERNAME_EXISTS') return res.status(400).json({ error: '用户名已存在' })
    return res.status(500).json({ error: '注册失败' })
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: '缺少参数' })

    const user = getUserByUsername(username)
    if (!user) return res.status(400).json({ error: '用户名或密码错误' })

    const ok = await verifyPassword(user, password)
    if (!ok) return res.status(400).json({ error: '用户名或密码错误' })

    const token = signToken({ username: user.username })
    return res.json({ success: true, user: { id: user.id, username: user.username }, token })
  } catch {
    return res.status(500).json({ error: '登录失败' })
  }
})

router.get('/auth/me', requireAuth, (req, res) => {
  return res.json({ success: true, user: { username: req.user.username } })
})

export default router

