import express from 'express'
import db from '../db.js'
import { authRequired, editorRequired } from '../middleware/auth.js'

const router = express.Router()

router.get('/', (req, res) => {
  const { category, status, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM activities WHERE 1=1'
  const params = []
  if (category) { query += ' AND category = ?'; params.push(category) }
  if (status) { query += ' AND status = ?'; params.push(status) }
  query += ' ORDER BY is_sticky DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))
  const items = db.prepare(query).all(...params)
  res.json({ items })
})

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '活动不存在' })
  res.json(item)
})

router.post('/', editorRequired, (req, res) => {
  const { title, content, description, category, event_date, location, rewards, status, cover_gradient } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })
  const result = db.prepare('INSERT INTO activities (title, content, description, category, event_date, location, rewards, status, cover_gradient) VALUES (?,?,?,?,?,?,?,?,?)').run(title, content||'', description||'', category||'general', event_date||'', location||'', rewards||'[]', status||'ongoing', cover_gradient||'')
  res.json({ id: result.lastInsertRowid, ok: true })
})

router.put('/:id', editorRequired, (req, res) => {
  const fields = ['title','content','description','category','event_date','location','rewards','status','cover_gradient','is_sticky']
  const updates = [], values = []
  for (const f of fields) { if (req.body[f] !== undefined) { updates.push(f+'=?'); values.push(req.body[f]) } }
  if (updates.length) { values.push(req.params.id); db.prepare('UPDATE activities SET '+updates.join(',')+' WHERE id=?').run(...values) }
  res.json({ ok: true })
})

router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
