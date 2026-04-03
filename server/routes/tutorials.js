import { Router } from 'express'
import db from '../db.js'
import { authRequired, editorRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/tutorials
router.get('/', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let where = "WHERE status = 'published'"
  const params = []
  if (category) { where += ' AND category = ?'; params.push(category) }

  const items = db.prepare(`SELECT * FROM tutorials ${where} ORDER BY is_sticky DESC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset))
  const total = db.prepare(`SELECT COUNT(*) as count FROM tutorials ${where}`).get(...params)?.count || 0
  res.json({ items, total, page: Number(page) })
})

// GET /api/tutorials/:id
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '教程不存在' })
  db.prepare('UPDATE tutorials SET view_count = view_count + 1 WHERE id = ?').run(item.id)
  res.json({ item })
})

// POST /api/tutorials
router.post('/', editorRequired, (req, res) => {
  const { title, content, coverImage, category, tags } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const result = db.prepare(`
    INSERT INTO tutorials (title, content, excerpt, cover_image, category, tags, author_id, author_name, author_avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, content, (content || '').substring(0, 100), coverImage || '', category || 'beginner', JSON.stringify(tags || []), user.id, user.nickname, user.avatar || '')
  res.json({ item: db.prepare('SELECT * FROM tutorials WHERE id = ?').get(result.lastInsertRowid) })
})

// PUT /api/tutorials/:id
router.put('/:id', editorRequired, (req, res) => {
  const { title, content, category, tags, isSticky, status, coverImage } = req.body
  db.prepare(`UPDATE tutorials SET title = COALESCE(?, title), content = COALESCE(?, content), category = COALESCE(?, category), tags = COALESCE(?, tags), is_sticky = COALESCE(?, is_sticky), status = COALESCE(?, status), cover_image = COALESCE(?, cover_image) WHERE id = ?`)
    .run(title, content, category, tags ? JSON.stringify(tags) : null, isSticky, status, coverImage, req.params.id)
  res.json({ item: db.prepare('SELECT * FROM tutorials WHERE id = ?').get(req.params.id) })
})

// DELETE /api/tutorials/:id
router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM tutorials WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

export default router
