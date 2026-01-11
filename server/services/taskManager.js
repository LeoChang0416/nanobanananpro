import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_FILE = path.join(__dirname, '..', 'storage', 'tasks.json')
const TASKS_DIR = path.dirname(STORAGE_FILE)

// 确保存储目录存在
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true })
}

// 任务管理器 - 持久化任务状态
const tasks = new Map()

/**
 * 从磁盘加载任务
 */
const loadTasks = () => {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8')
      const loadedTasks = JSON.parse(data)
      loadedTasks.forEach(task => {
        if (!task.username) task.username = '匿名'
        // 恢复时，如果任务是 running 或 pending，标记为中断
        // (除非我们能实现真正的进程恢复，否则重启意味着中断)
        if (task.status === 'running' || task.status === 'pending') {
          task.status = 'failed'
          task.error = '服务重启，任务已中断'
          task.progress = 0
        }
        tasks.set(task.id, task)
      })
      console.log(`已从磁盘加载 ${tasks.size} 个任务`)
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }
}

/**
 * 保存任务到磁盘
 */
const saveTasks = () => {
  try {
    const data = JSON.stringify(Array.from(tasks.values()), null, 2)
    fs.writeFileSync(STORAGE_FILE, data)
  } catch (error) {
    console.error('保存任务失败:', error)
  }
}

// 初始化加载
loadTasks()

/**
 * 创建任务
 */
export const createTask = (taskId, params) => {
  const task = {
    id: taskId,
    username: params.username || '匿名',
    prompt: params.prompt,
    aspectRatio: params.aspectRatio || 'auto',
    imageSize: params.imageSize || '1K',
    hasReferenceImages: !!(params.urls && params.urls.length > 0),
    status: 'pending', // pending, running, succeeded, failed, cancelled
    progress: 0,
    error: null,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  tasks.set(taskId, task)
  saveTasks()
  return task
}

/**
 * 更新任务状态
 */
export const updateTask = (taskId, updates) => {
  const task = tasks.get(taskId)
  if (task) {
    Object.assign(task, updates, { updatedAt: Date.now() })
    saveTasks()
    
    // 任务结束（成功/失败/取消）时触发清理
    if (updates.status && ['succeeded', 'failed', 'cancelled'].includes(updates.status)) {
      cleanupTasks()
    }
    
    return task
  }
  return null
}

/**
 * 获取任务
 */
export const getTask = (taskId) => {
  return tasks.get(taskId) || null
}

/**
 * 获取所有任务
 */
export const getAllTasks = () => {
  return Array.from(tasks.values())
    .sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 获取活跃任务（pending 或 running）
 */
export const getActiveTasks = () => {
  return getAllTasks().filter(t => t.status === 'pending' || t.status === 'running')
}

/**
 * 删除任务
 */
export const deleteTask = (taskId) => {
  const result = tasks.delete(taskId)
  if (result) saveTasks()
  return result
}

/**
 * 检查任务是否被取消
 */
export const isTaskCancelled = (taskId) => {
  const task = tasks.get(taskId)
  return task?.status === 'cancelled'
}

/**
 * 取消任务
 */
export const cancelTask = (taskId) => {
  const task = tasks.get(taskId)
  if (task && (task.status === 'pending' || task.status === 'running')) {
    task.status = 'cancelled'
    task.updatedAt = Date.now()
    saveTasks()
    cleanupTasks()
    return true
  }
  return false
}

/**
 * 清理完成的任务（保留最近50个）
 */
export const cleanupTasks = () => {
  const allTasks = Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt)
  
  if (allTasks.length > 50) {
    const toKeep = allTasks.slice(0, 50)
    tasks.clear()
    toKeep.forEach(t => tasks.set(t.id, t))
    saveTasks()
  }
}

export default {
  createTask,
  updateTask,
  getTask,
  getAllTasks,
  getActiveTasks,
  deleteTask,
  isTaskCancelled,
  cancelTask,
  cleanupTasks
}
