import { Router } from 'express'
import db from '../db.js'
import { adminRequired, editorRequired } from '../middleware/auth.js'

const router = Router()

function safeJSON(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

// GET /api/equipment
router.get('/', (req, res) => {
  const { category, brand, page = 1, limit = 50 } = req.query
  const offset = (page - 1) * limit
  let where = "WHERE status = 'active'"
  const params = []
  if (category) { where += ' AND category = ?'; params.push(category) }
  if (brand) { where += ' AND brand = ?'; params.push(brand) }

  const items = db.prepare(`SELECT * FROM equipment ${where} ORDER BY is_featured DESC, sort_order ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), Number(offset))
  const total = db.prepare(`SELECT COUNT(*) as count FROM equipment ${where}`).get(...params)?.count || 0
  res.json({ items: items.map(i => ({ ...i, specs: safeJSON(i.specs, {}), image_url: i.image_url || '' })), total, page: Number(page) })
})

// POST /api/equipment
router.post('/', editorRequired, (req, res) => {
  const { name, brand, category, imageUrl, specs, description, priceRange, sensor, mountType, releaseYear, isFeatured, sortOrder } = req.body
  const result = db.prepare(`
    INSERT INTO equipment (name, brand, category, image_url, specs, description, price_range, sensor, mount_type, release_year, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, brand, category, imageUrl || '', JSON.stringify(specs || {}), description || '', priceRange || '', sensor || '', mountType || '', releaseYear || null, isFeatured ? 1 : 0, sortOrder || 0)
  res.json({ item: db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid) })
})

// PUT /api/equipment/:id
router.put('/:id', editorRequired, (req, res) => {
  const { name, brand, category, imageUrl, specs, description, priceRange, sensor, mountType, releaseYear, isFeatured, sortOrder, status } = req.body
  db.prepare(`UPDATE equipment SET name = COALESCE(?, name), brand = COALESCE(?, brand), category = COALESCE(?, category), image_url = COALESCE(?, image_url), specs = COALESCE(?, specs), description = COALESCE(?, description), price_range = COALESCE(?, price_range), sensor = COALESCE(?, sensor), mount_type = COALESCE(?, mount_type), release_year = COALESCE(?, release_year), is_featured = COALESCE(?, is_featured), sort_order = COALESCE(?, sort_order), status = COALESCE(?, status) WHERE id = ?`)
    .run(name, brand, category, imageUrl, specs ? JSON.stringify(specs) : null, description, priceRange, sensor, mountType, releaseYear, isFeatured, sortOrder, status, req.params.id)
  res.json({ item: db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id) })
})

// DELETE /api/equipment/:id
router.delete('/:id', editorRequired, (req, res) => {
  db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

export default router
