import { Router } from 'express'
import db from '../db.js'
import { adminRequired } from '../middleware/auth.js'

const router = Router()

function safeJSON(str, fallback) { try { return JSON.parse(str) } catch { return fallback } }

// ========== 通用 CRUD 工厂 ==========
const tables = {
  tools: { defaults: { name: '', description: '', icon: '🔧', category: 'other', url: '', embed_code: '', is_external: 0, sort_order: 0 } },
  deals: { defaults: { title: '', content: '', cover_image: '', original_price: '', current_price: '', platform: '', link: '', expire_date: '', category: 'camera', is_sticky: 0 } },
  activities: { defaults: { title: '', content: '', cover_image: '', event_date: '', location: '', rewards: '[]', organizer: '', category: 'general', is_sticky: 0 } },
  announcements: { defaults: { title: '', content: '', type: 'info', is_sticky: 0 } },
  links: { defaults: { name: '', url: '', logo: '', description: '', category: 'friend', sort_order: 0 } },
  ads: { defaults: { title: '', image_url: '', link: '', position: 'banner', start_date: '', end_date: '', is_active: 1, sort_order: 0 } },
}

// 为每个表生成 CRUD 路由
for (const [table, config] of Object.entries(tables)) {
  // GET 列表
  router.get(`/${table}`, (req, res) => {
    const items = db.prepare(`SELECT * FROM ${table} ORDER BY is_sticky DESC, sort_order ASC, created_at DESC`).all()
    const parsed = items.map(i => {
      if (i.rewards) { try { i.rewards = JSON.parse(i.rewards) } catch {} }
      return i
    })
    res.json({ items: parsed })
  })

  // POST 新增
  router.post(`/${table}`, adminRequired, (req, res) => {
    const data = { ...config.defaults, ...req.body }
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const values = keys.map(k => {
      const v = data[k]
      return typeof v === 'object' ? JSON.stringify(v) : v
    })
    const result = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values)
    res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid) })
  })

  // PUT 更新
  router.put(`/${table}/:id`, adminRequired, (req, res) => {
    const updates = req.body
    const setClauses = []
    const values = []
    for (const [key, val] of Object.entries(updates)) {
      setClauses.push(`${key} = ?`)
      values.push(typeof val === 'object' ? JSON.stringify(val) : val)
    }
    values.push(req.params.id)
    db.prepare(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)
    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id)
    if (item?.rewards) { try { item.rewards = JSON.parse(item.rewards) } catch {} }
    res.json({ item })
  })

  // DELETE
  router.delete(`/${table}/:id`, adminRequired, (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id)
    res.json({ message: '删除成功' })
  })
}

// ========== 系统设置 ==========
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all()
  const settings = {}
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  res.json({ settings })
})

router.put('/settings', adminRequired, (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
  const tx = db.transaction((entries) => {
    for (const [key, value] of entries) {
      stmt.run(key, JSON.stringify(value))
    }
  })
  tx(Object.entries(req.body))
  res.json({ message: '保存成功' })
})

// ========== 仪表盘统计 ==========
router.get('/dashboard', adminRequired, (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    posts: db.prepare('SELECT COUNT(*) as count FROM posts').get().count,
    showcase: db.prepare('SELECT COUNT(*) as count FROM showcase').get().count,
    equipment: db.prepare('SELECT COUNT(*) as count FROM equipment').get().count,
    tools: db.prepare('SELECT COUNT(*) as count FROM tools').get().count,
    presets: db.prepare('SELECT COUNT(*) as count FROM presets').get().count,
    tutorials: db.prepare('SELECT COUNT(*) as count FROM tutorials').get().count,
    activities: db.prepare('SELECT COUNT(*) as count FROM activities').get().count,
    deals: db.prepare('SELECT COUNT(*) as count FROM deals').get().count,
    announcements: db.prepare('SELECT COUNT(*) as count FROM announcements').get().count,
    links: db.prepare('SELECT COUNT(*) as count FROM links').get().count,
    recentUsers: db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 5').all().map(u => ({ id: u.id, nickname: u.nickname, created_at: u.created_at })),
    recentPosts: db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 5').all(),
  }
  // 移除密码
  stats.recentUsers = stats.recentUsers.map(({ password, ...u }) => u)
  res.json(stats)
})

// ========== 用户管理 ==========
router.get('/users', adminRequired, (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  res.json({ users: users.map(({ password, ...u }) => ({ ...u, medals: safeJSON(u.medals, []) })) })
})

import bcrypt from 'bcryptjs'

router.put('/users/:id', adminRequired, (req, res) => {
  const updates = req.body
  const setClauses = []
  const values = []
  for (const [key, val] of Object.entries(updates)) {
    let v = val
    if (key === 'password' && v) {
      v = bcrypt.hashSync(v, 10)
    }
    setClauses.push(`${key} = ?`)
    values.push(typeof v === 'object' ? JSON.stringify(v) : v)
  }
  values.push(req.params.id)
  db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  const { password, ...rest } = user
  res.json({ user: rest })
})

router.delete('/users/:id', adminRequired, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

// ========== 举报管理 ==========

// GET /api/admin/reports - 获取举报列表
router.get('/reports', adminRequired, (req, res) => {
  const status = req.query.status || ''
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const offset = (page - 1) * limit

  let where = 'WHERE 1=1'
  const params = []
  
  if (status) {
    where += ' AND r.status = ?'
    params.push(status)
  }

  const reports = db.prepare(`
    SELECT r.*, 
      u.nickname as reporter_name,
      p.title as post_title, p.content as post_content
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
    LEFT JOIN posts p ON r.target_id = p.id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`SELECT COUNT(*) as count FROM reports r ${where}`).get(...params).count

  res.json({ reports, total, page, limit })
})

// PUT /api/admin/reports/:id - 处理举报
router.put('/reports/:id', adminRequired, (req, res) => {
  const reportId = Number(req.params.id)
  const { action } = req.body // 'ignore' | 'delete_post' | 'warn'

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId)
  if (!report) return res.status(404).json({ error: '举报不存在' })

  if (action === 'delete_post') {
    // 删除被举报的帖子
    db.prepare('DELETE FROM posts WHERE id = ?').run(report.target_id)
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('resolved', reportId)
    res.json({ message: '已删除帖子并处理举报' })
  } else if (action === 'warn') {
    // 警告用户
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('warned', reportId)
    res.json({ message: '已警告用户' })
  } else {
    // 忽略
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('ignored', reportId)
    res.json({ message: '已忽略举报' })
  }
})

export default router
