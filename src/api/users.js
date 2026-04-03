import api from './index.js'

export const getUser = (id) => api.get(`/users/${id}`)
export const updateProfile = (data) => api.put('/users/profile', data)
export const signIn = () => api.post('/users/sign')
export const getSignStatus = () => api.get('/users/sign/status')
export const getUsers = (params) => api.get('/users', { params })
