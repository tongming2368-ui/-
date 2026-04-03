import api from './index.js'

// ========== 帖子 ==========
export const getPosts = (params) => api.get('/posts', { params })
export const getPost = (id) => api.get(`/posts/${id}`)
export const createPost = (data) => api.post('/posts', data)
export const updatePost = (id, data) => api.put(`/posts/${id}`, data)
export const deletePost = (id) => api.delete(`/posts/${id}`)
export const likePost = (id) => api.post(`/posts/${id}/like`)
export const getZonePosts = (zone) => api.get(`/posts/zone/${zone}`)

// ========== 美图 ==========
export const getShowcase = (params) => api.get('/showcase', { params })
export const createShowcase = (data) => api.post('/showcase', data)
export const updateShowcase = (id, data) => api.put(`/showcase/${id}`, data)
export const deleteShowcase = (id) => api.delete(`/showcase/${id}`)

// ========== 预设 ==========
export const getPresets = (params) => api.get('/presets', { params })
export const createPreset = (data) => api.post('/presets', data)
export const updatePreset = (id, data) => api.put(`/presets/${id}`, data)
export const deletePreset = (id) => api.delete(`/presets/${id}`)

// ========== 教程 ==========
export const getTutorials = (params) => api.get('/tutorials', { params })
export const getTutorial = (id) => api.get(`/tutorials/${id}`)
export const createTutorial = (data) => api.post('/tutorials', data)
export const updateTutorial = (id, data) => api.put(`/tutorials/${id}`, data)
export const deleteTutorial = (id) => api.delete(`/tutorials/${id}`)

// ========== 器材 ==========
export const getEquipment = (params) => api.get('/equipment', { params })
export const createEquipment = (data) => api.post('/equipment', data)
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data)
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`)

// ========== 优惠 ==========
export const getDeals = (params) => api.get('/admin/deals', { params })

// ========== 友链 ==========
export const getLinks = (params) => api.get('/admin/links', { params })

// ========== 管理后台（需要 admin token） ==========
// 通用 CRUD
export const getAdminList = (table) => api.get(`/admin/${table}`, { headers: { 'X-Admin': 'true' } })
export const createAdminItem = (table, data) => api.post(`/admin/${table}`, data, { headers: { 'X-Admin': 'true' } })
export const updateAdminItem = (table, id, data) => api.put(`/admin/${table}/${id}`, data, { headers: { 'X-Admin': 'true' } })
export const deleteAdminItem = (table, id) => api.delete(`/admin/${table}/${id}`, { headers: { 'X-Admin': 'true' } })

// 仪表盘
export const getDashboard = () => api.get('/admin/dashboard', { headers: { 'X-Admin': 'true' } })

// 用户管理
export const getAdminUsers = () => api.get('/admin/users', { headers: { 'X-Admin': 'true' } })
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data, { headers: { 'X-Admin': 'true' } })
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`, { headers: { 'X-Admin': 'true' } })

// 设置
export const getSettings = () => api.get('/admin/settings', { headers: { 'X-Admin': 'true' } })
export const saveSettings = (data) => api.put('/admin/settings', data, { headers: { 'X-Admin': 'true' } })
