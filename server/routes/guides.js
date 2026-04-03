import express from 'express'
import db from '../db.js'
import { authRequired, editorRequired } from '../middleware/auth.js'

const router = express.Router()

// GET /api/guides - 获取攻略列表
router.get('/', (req, res) => {
  const { tag, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit

  let query = 'SELECT * FROM guides WHERE status = ?'
  const params = ['published']

  if (tag) {
    query += ' AND tag = ?'
    params.push(tag)
  }

  query += ' ORDER BY is_sticky DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  const items = db.prepare(query).all(...params)
  let countQuery = 'SELECT COUNT(*) as count FROM guides WHERE status = ?'
  const countParams = ['published']
  if (tag) {
    countQuery += ' AND tag = ?'
    countParams.push(tag)
  }
  const total = db.prepare(countQuery).get(...countParams).count

  res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
})

// GET /api/guides/:id - 获取单个攻略
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM guides WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '攻略不存在' })

  // 增加浏览量
  db.prepare('UPDATE guides SET view_count = view_count + 1 WHERE id = ?').run(req.params.id)
  item.view_count++

  res.json(item)
})

// POST /api/guides - 创建攻略
router.post('/', editorRequired, (req, res) => {
  const { title, description, content, cover_gradient, cover_image, tag } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const result = db.prepare(
    'INSERT INTO guides (title, description, content, cover_gradient, cover_image, tag, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', content || '', cover_gradient || '', cover_image || '', tag || '', req.user.id, user.nickname || user.username)

  res.json({ id: result.lastInsertRowid, ok: true })
})

// PUT /api/guides/:id - 更新攻略
router.put('/:id', editorRequired, (req, res) => {
  const { title, description, content, cover_gradient, cover_image, tag, is_sticky, status } = req.body
  const item = db.prepare('SELECT * FROM guides WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '攻略不存在' })

  db.prepare(`UPDATE guides SET title = ?, description = ?, content = ?, cover_gradient = ?, cover_image = ?, tag = ?, is_sticky = ?, status = ?, updated_at = datetime('now') WHERE id = ?`).run(
    title || item.title, description ?? item.description, content ?? item.content,
    cover_gradient ?? item.cover_gradient, cover_image ?? item.cover_image,
    tag ?? item.tag, is_sticky ?? item.is_sticky, status ?? item.status, req.params.id
  )

  res.json({ ok: true })
})

// DELETE /api/guides/:id
router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM guides WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// POST /api/guides/:id/like
router.post('/:id/like', authRequired, (req, res) => {
  db.prepare('UPDATE guides SET like_count = like_count + 1 WHERE id = ?').run(req.params.id)
  const item = db.prepare('SELECT like_count FROM guides WHERE id = ?').get(req.params.id)
  res.json({ like_count: item?.like_count || 0 })
})

export default router
