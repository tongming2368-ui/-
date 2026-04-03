import { Router } from 'express'
import db from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

function safeJSON(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

// GET /api/showcase - 作品列表
router.get('/', (req, res) => {
  const { status = 'approved', page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let where = status === 'approved' ? "WHERE status = 'approved'" : ''

  const items = db.prepare(`SELECT * FROM showcase ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(Number(limit), Number(offset))
  const total = db.prepare(`SELECT COUNT(*) as count FROM showcase ${where}`).get()?.count || 0

  res.json({ items, total, page: Number(page) })
})

// POST /api/showcase - 提交作品
router.post('/', authRequired, (req, res) => {
  const { title, description, imageUrl, camera, lens, settings, tags } = req.body
  if (!title || !imageUrl) return res.status(400).json({ error: '标题和图片不能为空' })

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const result = db.prepare(`
    INSERT INTO showcase (title, description, image_url, author_id, author_name, author_avatar, camera, lens, settings, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(title, description, imageUrl, user.id, user.nickname, user.avatar || '', camera || '', lens || '', settings || '', JSON.stringify(tags || []))

  const item = db.prepare('SELECT * FROM showcase WHERE id = ?').get(result.lastInsertRowid)
  res.json({ item })
})

// PUT /api/showcase/:id - 审核/编辑
router.put('/:id', authRequired, (req, res) => {
  const item = db.prepare('SELECT * FROM showcase WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '作品不存在' })

  const { status, title, description } = req.body
  db.prepare('UPDATE showcase SET status = COALESCE(?, status), title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?')
    .run(status, title, description, item.id)

  res.json({ item: db.prepare('SELECT * FROM showcase WHERE id = ?').get(item.id) })
})

// DELETE /api/showcase/:id
router.delete('/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM showcase WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

export default router
