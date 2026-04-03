import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import showcaseRoutes from './routes/showcase.js'
import presetRoutes from './routes/presets.js'
import tutorialRoutes from './routes/tutorials.js'
import equipmentRoutes from './routes/equipment.js'
import chatRoutes from './routes/chat.js'
import adminRoutes from './routes/admin.js'
import guidesRoutes from './routes/guides.js'
import brandActivitiesRoutes from './routes/brand-activities.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件（上传目录）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/showcase', showcaseRoutes)
app.use('/api/presets', presetRoutes)
app.use('/api/tutorials', tutorialRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/guides', guidesRoutes)
app.use('/api/brand-activities', brandActivitiesRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: '服务器内部错误' })
})

// 初始化数据库后启动服务
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to init database:', err)
  process.exit(1)
})

export default app
