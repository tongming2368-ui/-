import api from './index.js'

// 注册
export const register = (data) => api.post('/auth/register', data)
// 登录
export const login = (data) => api.post('/auth/login', data)
// 发送验证码
export const sendCode = (email, type = 'register') => api.post('/auth/send-code', { email, type })
// 获取当前用户
export const getMe = () => api.get('/auth/me')

// 重置密码
export const resetPassword = (data) => api.post('/auth/reset-password', data)
