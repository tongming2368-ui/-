import express from 'express'
import db from '../db.js'
import { authRequired, editorRequired } from '../middleware/auth.js'

const router = express.Router()

// GET /api/brand-activities - 获取厂商活动列表
router.get('/', (req, res) => {
  const { brand, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit

  let query = 'SELECT * FROM brand_activities WHERE status = ?'
  const params = ['active']

  if (brand && brand !== 'all') {
    query += ' AND brand = ?'
    params.push(brand)
  }

  query += ' ORDER BY is_highlight DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  const items = db.prepare(query).all(...params)
  let countQuery = 'SELECT COUNT(*) as count FROM brand_activities WHERE status = ?'
  const countParams = ['active']
  if (brand && brand !== 'all') {
    countQuery += ' AND brand = ?'
    countParams.push(brand)
  }
  const total_count = db.prepare(countQuery).get(...countParams).count

  res.json({ items, total: total_count, page: parseInt(page), limit: parseInt(limit) })
})

// GET /api/brand-activities/:id
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM brand_activities WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '活动不存在' })
  res.json(item)
})

// POST /api/brand-activities
router.post('/', editorRequired, (req, res) => {
  const { title, description, content, brand, brand_icon, category, event_date, location, link, cover_gradient, is_highlight } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })

  const result = db.prepare(
    'INSERT INTO brand_activities (title, description, content, brand, brand_icon, category, event_date, location, link, cover_gradient, is_highlight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', content || '', brand || '', brand_icon || '📸', category || '品牌活动', event_date || '', location || '', link || '', cover_gradient || '', is_highlight ? 1 : 0)

  res.json({ id: result.lastInsertRowid, ok: true })
})

// PUT /api/brand-activities/:id
router.put('/:id', editorRequired, (req, res) => {
  const item = db.prepare('SELECT * FROM brand_activities WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '活动不存在' })

  const fields = ['title', 'description', 'content', 'brand', 'brand_icon', 'category', 'event_date', 'location', 'link', 'cover_gradient', 'is_highlight', 'status']
  const updates = []
  const values = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      values.push(req.body[f])
    }
  }
  if (updates.length) {
    updates.push("updated_at = datetime('now')")
    values.push(req.params.id)
    db.prepare(`UPDATE brand_activities SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  res.json({ ok: true })
})

// DELETE /api/brand-activities/:id
router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM brand_activities WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
