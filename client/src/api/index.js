import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API接口配置
export const imageAPI = {
  // 生成图片
  // params: { prompt, aspectRatio, imageSize, urls }
  generate: (params) => api.post('/generate', params),
  
  // 获取图片列表
  getList: (params) => api.get('/images', { params }),
  
  // 获取图片详情
  getDetail: (id) => api.get(`/images/${id}`),
  
  // 删除图片
  delete: (id) => api.delete(`/images/${id}`)
}

