import express from 'express'
import db from '../db.js'
import { authRequired, editorRequired } from '../middleware/auth.js'

const router = express.Router()

router.get('/', (req, res) => {
  const { brand, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM equipment WHERE status = ? AND description LIKE ?'
  const params = ['active', '%说明书%']
  if (brand) { query += ' AND brand = ?'; params.push(brand) }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))
  const items = db.prepare(query).all(...params)
  res.json({ items })
})

export default router
