import { Router } from 'express'
import db from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/presets
router.get('/', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let where = ''
  const params = []
  if (category) { where = 'WHERE category = ?'; params.push(category) }

  const items = db.prepare(`SELECT * FROM presets ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset))
  const total = db.prepare(`SELECT COUNT(*) as count FROM presets ${where}`).get(...params)?.count || 0
  res.json({ items, total, page: Number(page) })
})

// POST /api/presets
router.post('/', authRequired, (req, res) => {
  const { title, description, coverImage, presetData, category, tags } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const result = db.prepare(`
    INSERT INTO presets (title, description, cover_image, preset_data, category, tags, author_id, author_name, author_avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, coverImage || '', JSON.stringify(presetData || {}), category || 'lightroom', JSON.stringify(tags || []), user.id, user.nickname, user.avatar || '')
  res.json({ item: db.prepare('SELECT * FROM presets WHERE id = ?').get(result.lastInsertRowid) })
})

// PUT /api/presets/:id
router.put('/:id', authRequired, (req, res) => {
  const { title, description, category, tags, coverImage } = req.body
  db.prepare(`UPDATE presets SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), tags = COALESCE(?, tags), cover_image = COALESCE(?, cover_image) WHERE id = ?`)
    .run(title, description, category, tags ? JSON.stringify(tags) : null, coverImage, req.params.id)
  res.json({ item: db.prepare('SELECT * FROM presets WHERE id = ?').get(req.params.id) })
})

// DELETE /api/presets/:id
router.delete('/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM presets WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

export default router
