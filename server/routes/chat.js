import express from 'express'
import db from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// 聊天消息保留天数（24小时自动清空）
const MESSAGE_RETENTION_HOURS = 24

// 定时清理24小时前的聊天消息（每小时执行一次）
setInterval(() => {
  const cutoff = new Date(Date.now() - MESSAGE_RETENTION_HOURS * 60 * 60 * 1000).toISOString()
  db.prepare(`DELETE FROM chat_messages WHERE created_at < ?`).run(cutoff)
  console.log(`[Chat] 清理 ${MESSAGE_RETENTION_HOURS} 小时前的消息`)
}, 60 * 60 * 1000) // 每小时执行一次

// 启动时也清理一次
setTimeout(() => {
  const cutoff = new Date(Date.now() - MESSAGE_RETENTION_HOURS * 60 * 60 * 1000).toISOString()
  const result = db.prepare(`DELETE FROM chat_messages WHERE created_at < ?`).run(cutoff)
  console.log(`[Chat] 启动时清理 ${result.changes} 条过期消息`)
}, 5000)

// GET /api/chat/messages - 获取聊天消息
router.get('/messages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const before = req.query.before // 游标分页：返回此时间戳之前的消息
  
  let query = `
    SELECT cm.*, u.nickname as author_name, u.avatar 
    FROM chat_messages cm
    LEFT JOIN users u ON cm.user_id = u.id
  `
  const params = []
  
  if (before) {
    query += ` WHERE cm.created_at < ?`
    params.push(before)
  }
  
  query += ` ORDER BY cm.created_at DESC LIMIT ?`
  params.push(limit)
  
  const messages = db.prepare(query).all(...params)
  messages.reverse() // 按时间正序返回
  
  res.json({ messages })
})

// POST /api/chat/messages - 发送聊天消息
router.post('/messages', authRequired, (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }
  
  if (content.length > 500) {
    return res.status(400).json({ error: '消息内容过长（最多500字）' })
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  
  const result = db.prepare(`
    INSERT INTO chat_messages (user_id, author_name, author_avatar, content)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, user.nickname || user.username, user.avatar || '👤', content.trim())
  
  const message = db.prepare(`
    SELECT cm.*, u.nickname as author_name, u.avatar 
    FROM chat_messages cm
    LEFT JOIN users u ON cm.user_id = u.id
    WHERE cm.id = ?
  `).get(result.lastInsertRowid)
  
  res.json({ message })
})

export default router
