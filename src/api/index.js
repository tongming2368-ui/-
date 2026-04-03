import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器：自动带 token
api.interceptors.request.use(config => {
  // 检查是否是管理员请求
  if (config.headers['X-Admin']) {
    const adminToken = localStorage.getItem('admin_token')
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }
    delete config.headers['X-Admin']
  } else {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || '网络错误'
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(new Error(msg))
  }
)

export default api
