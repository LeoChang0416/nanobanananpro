import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000 // 5分钟
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 图片API
export const imageAPI = {
  generate: (params) => api.post('/generate', params),
  getList: (params) => api.get('/images', { params }),
  getDetail: (id) => api.get(`/images/${id}`),
  delete: (id) => api.delete(`/images/${id}`)
}

// 任务API
export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  cancel: (id) => api.post(`/tasks/${id}/cancel`),
  delete: (id) => api.delete(`/tasks/${id}`)
}

