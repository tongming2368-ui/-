import express from 'express'
import db from '../db.js'
import { editorRequired } from '../middleware/auth.js'

const router = express.Router()

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM tools ORDER BY created_at DESC').all()
  res.json({ items })
})

router.post('/', editorRequired, (req, res) => {
  const { title, description, icon, url, category } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })
  const result = db.prepare('INSERT INTO tools (title, description, icon, url, category) VALUES (?,?,?,?,?)').run(title, description||'', icon||'🔧', url||'', category||'general')
  res.json({ id: result.lastInsertRowid, ok: true })
})

router.put('/:id', editorRequired, (req, res) => {
  const fields = ['title','description','icon','url','category']
  const updates = [], values = []
  for (const f of fields) { if (req.body[f] !== undefined) { updates.push(f+'=?'); values.push(req.body[f]) } }
  if (updates.length) { values.push(req.params.id); db.prepare('UPDATE tools SET '+updates.join(',')+' WHERE id=?').run(...values) }
  res.json({ ok: true })
})

router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
