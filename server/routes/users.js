import { Router } from 'express'
import db from '../db.js'
import bcrypt from 'bcryptjs'
import { authRequired } from '../middleware/auth.js'

const router = Router()

function safeJSON(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

function formatUser(user) {
  if (!user) return null
  const { password, ...rest } = user
  return {
    ...rest,
    medals: safeJSON(rest.medals, []),
  }
}

// 具体路由在下面定义,/:id 路由在最后

// PUT /api/users/profile - 修改资料(需登录)
router.put('/profile', authRequired, (req, res) => {
  const { nickname, bio, gender, location, website, avatar, phone, birthday, email, password, oldPassword, newPassword } = req.body

  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

  // 修改密码需要验证旧密码
  if (oldPassword && newPassword) {
    if (!password || !bcrypt.compareSync(password, currentUser.password)) {
      return res.status(400).json({ error: '当前密码错误,无法修改密码' })
    }
    const hash = bcrypt.hashSync(newPassword, 10)
    db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.user.id)
  }

  // 修改敏感信息(邮箱)需要验证密码
  if (email && email !== currentUser.email) {
    if (!password || !bcrypt.compareSync(password, currentUser.password)) {
      return res.status(400).json({ error: '当前密码错误,无法修改邮箱' })
    }
  }

  // 处理 undefined 值为 null
  const n = nickname || null
  const b = bio || null
  const g = gender || null
  const l = location || null
  const w = website || null
  const a = avatar || null
  const p = phone || null
  const bd = birthday || null
  const e = email || null

  db.prepare(`
    UPDATE users SET
      nickname = COALESCE(?, nickname),
      bio = COALESCE(?, bio),
      gender = COALESCE(?, gender),
      location = COALESCE(?, location),
      website = COALESCE(?, website),
      avatar = COALESCE(?, avatar),
      phone = COALESCE(?, phone),
      birthday = COALESCE(?, birthday),
      email = COALESCE(?, email),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(n, b, g, l, w, a, p, bd, e, req.user.id)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: formatUser(user) })
})

// POST /api/users/sign - 每日签到
router.post('/sign', authRequired, (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const userId = req.user.id

  // 检查今天是否已签到
  const existing = db.prepare('SELECT * FROM sign_records WHERE user_id = ? AND sign_date = ?').get(userId, today)
  if (existing) return res.status(400).json({ error: '今天已签到' })

  // 计算连续签到天数
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const yesterdaySign = db.prepare('SELECT * FROM sign_records WHERE user_id = ? AND sign_date = ?').get(userId, yesterday)
  const signDays = yesterdaySign ? (user.sign_days || 0) + 1 : 1

  // 计算积分
  const basePoints = Math.floor(Math.random() * 6) + 5
  const bonus = signDays >= 7 ? 10 : 0
  const totalEarned = basePoints + bonus

  // 写入签到记录
  db.prepare('INSERT INTO sign_records (user_id, sign_date, points_earned) VALUES (?, ?, ?)').run(userId, today, totalEarned)

  // 更新用户积分和连续签到
  const level = calcLevel(user.points + totalEarned)
  db.prepare('UPDATE users SET points = points + ?, sign_days = ?, level = ? WHERE id = ?').run(totalEarned, signDays, level, userId)

  res.json({
    points: totalEarned,
    total: user.points + totalEarned,
    signDays
  })
})

// GET /api/users/sign/status - 签到状态
router.get('/sign/status', authRequired, (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const record = db.prepare('SELECT * FROM sign_records WHERE user_id = ? AND sign_date = ?').get(req.user.id, today)
  res.json({ signed: !!record })
})

// GET /api/users - 用户列表(后台管理)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const offset = (page - 1) * limit
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset)
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  res.json({ users: users.map(formatUser), total, page, limit })
})

function calcLevel(points) {
  if (points >= 5000) return 10
  if (points >= 3000) return 8
  if (points >= 1500) return 6
  if (points >= 800) return 5
  if (points >= 400) return 4
  if (points >= 200) return 3
  if (points >= 100) return 2
  return 1
}

// GET /api/users/leaderboard - 积分排行榜
router.get('/leaderboard', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50)
  
  const users = db.prepare(`
    SELECT id, uid, nickname, avatar, points, level, sign_days,
      posts_count, followers_count
    FROM users
    WHERE points > 0
    ORDER BY points DESC
    LIMIT ?
  `).all(limit)
  
  res.json({ users })
})


// ========== 收藏功能 ==========
// POST /api/users/collect - 收藏/取消收藏
router.post('/collect', authRequired, (req, res) => {
  const { target_type, target_id } = req.body
  if (!target_type || !target_id) return res.status(400).json({ error: '参数不完整' })

  const existing = db.prepare('SELECT * FROM user_actions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action_type = ?').get(req.user.id, target_type, target_id, 'collect')

  if (existing) {
    // 取消收藏
    db.prepare('DELETE FROM user_actions WHERE id = ?').run(existing.id)
    db.prepare(`UPDATE ${target_type} SET collect_count = MAX(collect_count - 1, 0) WHERE id = ?`).run(target_id)
    res.json({ collected: false })
  } else {
    // 收藏
    db.prepare('INSERT INTO user_actions (user_id, target_type, target_id, action_type) VALUES (?, ?, ?, ?)').run(req.user.id, target_type, target_id, 'collect')
    try { db.prepare(`UPDATE ${target_type} SET collect_count = collect_count + 1 WHERE id = ?`).run(target_id) } catch (e) {}
    res.json({ collected: true })
  }
})

// GET /api/users/collections - 我的收藏列表
router.get('/collections', authRequired, (req, res) => {
  const { target_type = 'posts', page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  const actions = db.prepare('SELECT target_id FROM user_actions WHERE user_id = ? AND target_type = ? AND action_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, target_type, 'collect', parseInt(limit), parseInt(offset))

  const items = actions.map(a => {
    try { return db.prepare(`SELECT * FROM ${target_type} WHERE id = ?`).get(a.target_id) } catch { return null }
  }).filter(Boolean)

  res.json({ items })
})

// ========== 关注功能 ==========
// POST /api/users/follow - 关注/取消关注用户
router.post('/follow', authRequired, (req, res) => {
  const { target_id } = req.body
  if (!target_id || target_id === req.user.id) return res.status(400).json({ error: '参数无效' })

  const existing = db.prepare('SELECT * FROM user_actions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action_type = ?').get(req.user.id, 'user', target_id, 'follow')

  if (existing) {
    db.prepare('DELETE FROM user_actions WHERE id = ?').run(existing.id)
    db.prepare('UPDATE users SET following_count = MAX(following_count - 1, 0) WHERE id = ?').run(req.user.id)
    db.prepare('UPDATE users SET followers_count = MAX(followers_count - 1, 0) WHERE id = ?').run(target_id)
    res.json({ followed: false })
  } else {
    db.prepare('INSERT INTO user_actions (user_id, target_type, target_id, action_type) VALUES (?, ?, ?, ?)').run(req.user.id, 'user', target_id, 'follow')
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id)
    db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(target_id)
    res.json({ followed: true })
  }
})

// GET /api/users/followers - 粉丝列表
router.get('/followers', authRequired, (req, res) => {
  const actions = db.prepare('SELECT user_id FROM user_actions WHERE target_type = ? AND target_id = ? AND action_type = ? ORDER BY created_at DESC LIMIT 50').all('user', req.user.id, 'follow')
  const items = actions.map(a => db.prepare('SELECT id, uid, nickname, avatar, bio FROM users WHERE id = ?').get(a.user_id)).filter(Boolean)
  res.json({ items })
})

// GET /api/users/following - 关注列表
router.get('/following', authRequired, (req, res) => {
  const actions = db.prepare('SELECT target_id FROM user_actions WHERE user_id = ? AND target_type = ? AND action_type = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id, 'user', 'follow')
  const items = actions.map(a => db.prepare('SELECT id, uid, nickname, avatar, bio FROM users WHERE id = ?').get(a.target_id)).filter(Boolean)
  res.json({ items })
})

// ========== VIP 功能 ==========
// POST /api/users/vip/open - 开通VIP
router.post('/vip/open', authRequired, (req, res) => {
  const { months = 1 } = req.body
  const cost = 500 * months // 500积分/月
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

  if (user.points < cost) {
    return res.status(400).json({ error: '积分不足', needed: cost, current: user.points })
  }

  const now = new Date()
  let expireDate
  if (user.vip_expire && new Date(user.vip_expire) > now) {
    expireDate = new Date(new Date(user.vip_expire).getTime() + months * 30 * 24 * 60 * 60 * 1000)
  } else {
    expireDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000)
  }

  db.prepare('UPDATE users SET points = points - ?, vip_level = 1, vip_expire = ? WHERE id = ?').run(cost, expireDate.toISOString().split('T')[0], req.user.id)
  db.prepare('INSERT INTO points_history (user_id, points, description) VALUES (?, ?, ?)').run(req.user.id, -cost, `开通VIP ${months}个月`)

  res.json({ ok: true, vip_level: 1, vip_expire: expireDate.toISOString().split('T')[0], points: user.points - cost })
})

// GET /api/users/vip/status - VIP状态
router.get('/vip/status', authRequired, (req, res) => {
  const user = db.prepare('SELECT vip_level, vip_expire FROM users WHERE id = ?').get(req.user.id)
  const isVip = user.vip_level > 0 && user.vip_expire && new Date(user.vip_expire) > new Date()
  res.json({ vip_level: isVip ? user.vip_level : 0, vip_expire: user.vip_expire, is_vip: isVip })
})


export default router

// ========== 收藏相关 ==========

// GET /api/users/collections - 获取我的收藏
router.get('/collections', authRequired, (req, res) => {
  const collections = db.prepare(`
    SELECT ua.*,
      CASE ua.target_type
        WHEN 'post' THEN (SELECT title FROM posts WHERE id = ua.target_id)
        WHEN 'preset' THEN (SELECT title FROM presets WHERE id = ua.target_id)
        WHEN 'tutorial' THEN (SELECT title FROM tutorials WHERE id = ua.target_id)
        ELSE '未知'
      END as title,
      CASE ua.target_type
        WHEN 'post' THEN '/posts?id=' || ua.target_id
        WHEN 'preset' THEN '/presets'
        WHEN 'tutorial' THEN '/tutorials'
        ELSE '#'
      END as url
    FROM user_actions ua
    WHERE ua.user_id = ? AND ua.action_type = 'collect'
    ORDER BY ua.created_at DESC
  `).all(req.user.id)
  res.json({ collections })
})

// POST /api/users/collections - 添加收藏
router.post('/collections', authRequired, (req, res) => {
  const { target_type, target_id } = req.body
  if (!target_type || !target_id) {
    return res.status(400).json({ error: '参数不完整' })
  }

  // 检查是否已收藏
  const existing = db.prepare(
    'SELECT * FROM user_actions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action_type = ?'
  ).get(req.user.id, target_type, target_id, 'collect')
  if (existing) return res.status(400).json({ error: '已收藏' })

  db.prepare(
    'INSERT INTO user_actions (user_id, target_type, target_id, action_type) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, target_type, target_id, 'collect')

  // 更新用户收藏数
  db.prepare('UPDATE users SET collections_count = collections_count + 1 WHERE id = ?').run(req.user.id)

  // 更新帖子收藏数
  if (target_type === 'post') {
    db.prepare('UPDATE posts SET collect_count = collect_count + 1 WHERE id = ?').run(target_id)
  }

  res.json({ message: '收藏成功' })
})

// DELETE /api/users/collections/:targetType/:targetId - 取消收藏
router.delete('/collections/:targetType/:targetId', authRequired, (req, res) => {
  const { targetType, targetId } = req.params

  const result = db.prepare(
    'DELETE FROM user_actions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action_type = ?'
  ).run(req.user.id, targetType, targetId, 'collect')

  if (result.changes > 0) {
    db.prepare('UPDATE users SET collections_count = MAX(0, collections_count - 1) WHERE id = ?').run(req.user.id)
    // 更新帖子收藏数
    if (targetType === 'post') {
      db.prepare('UPDATE posts SET collect_count = MAX(0, collect_count - 1) WHERE id = ?').run(targetId)
    }
  }

  res.json({ message: '取消收藏成功' })
})

// ========== 站内信相关 ==========

// 私信保留期限:6个月(天数)
const MESSAGE_RETENTION_DAYS = 180

// 清理过期私信(延迟执行,等数据库初始化完成)
setTimeout(() => {
  try {
    const result = db.prepare(
      `DELETE FROM messages WHERE created_at < datetime('now', '-${MESSAGE_RETENTION_DAYS} days')`
    ).run()
    if (result.changes > 0) {
      console.log(`清理了 ${result.changes} 条过期私信`)
    }
  } catch (e) {
    console.log('清理过期私信失败:', e.message)
  }
}, 5000)

// 每天凌晨清理一次
setInterval(() => {
  try {
    db.prepare(
      `DELETE FROM messages WHERE created_at < datetime('now', '-${MESSAGE_RETENTION_DAYS} days')`
    ).run()
  } catch (e) { /* ignore */ }
}, 24 * 60 * 60 * 1000)

// GET /api/users/messages - 获取站内信(只保留6个月内的)
router.get('/messages', authRequired, (req, res) => {
  const userId = req.user.id
  // 先标记收到的未读消息为已读(前端显示用)
  const messages = db.prepare(`
    SELECT m.*,
      COALESCE((SELECT nickname FROM users WHERE id = m.sender_id), '系统') as sender_name
    FROM messages m
    WHERE m.recipient_id = ?
    AND m.created_at >= datetime('now', '-180 days')
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all(userId)

  const unreadCount = messages.filter(m => !m.is_read).length
  res.json({ messages, retention_days: MESSAGE_RETENTION_DAYS, unread_count: unreadCount })
})

// POST /api/messages - 发送站内信
router.post('/messages', authRequired, (req, res) => {
  const { to_id, recipient_id, title, content } = req.body
  const recipientId = to_id || recipient_id
  if (!recipientId || !content) {
    return res.status(400).json({ error: '参数不完整' })
  }

  db.prepare(
    'INSERT INTO messages (sender_id, recipient_id, title, content) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, recipientId, title || '', content)

  res.json({ message: '发送成功' })
})

// PUT /api/users/messages/:id/read - 标记站内信已读
router.put('/messages/:id/read', authRequired, (req, res) => {
  const msgId = Number(req.params.id)
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(msgId, req.user.id)
  res.json({ message: '已标记已读' })
})

// PUT /api/users/messages/read-all - 标记所有站内信已读
router.put('/messages/read-all', authRequired, (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE recipient_id = ?').run(req.user.id)
  res.json({ message: '全部已标记已读' })
})

// ========== 黑名单相关 ==========

// GET /api/users/blacklist - 获取黑名单
router.get('/blacklist', authRequired, (req, res) => {
  const blacklist = db.prepare(`
    SELECT b.*, u.username, u.nickname, u.avatar
    FROM user_blacklist b
    JOIN users u ON b.blocked_user_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id)
  res.json({ blacklist })
})

// POST /api/users/blacklist - 添加黑名单
router.post('/blacklist', authRequired, (req, res) => {
  const { user_id, reason } = req.body
  if (!user_id) return res.status(400).json({ error: '参数不完整' })

  const existing = db.prepare('SELECT * FROM user_blacklist WHERE user_id = ? AND blocked_user_id = ?').get(req.user.id, user_id)
  if (existing) return res.status(400).json({ error: '已在黑名单中' })

  db.prepare('INSERT INTO user_blacklist (user_id, blocked_user_id, reason) VALUES (?, ?, ?)').run(req.user.id, user_id, reason || '')
  res.json({ message: '已加入黑名单' })
})

// DELETE /api/users/blacklist/:userId - 移除黑名单
router.delete('/blacklist/:userId', authRequired, (req, res) => {
  db.prepare('DELETE FROM user_blacklist WHERE user_id = ? AND blocked_user_id = ?').run(req.user.id, req.params.userId)
  res.json({ message: '已移出黑名单' })
})

// ========== 积分记录相关 ==========

// GET /api/users/points-history - 获取积分记录
router.get('/points-history', authRequired, (req, res) => {
  const history = db.prepare(`
    SELECT * FROM points_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id)
  res.json({ history })
})

// ========== 用户资料(放在最后,避免匹配到其他路由) ==========

// GET /api/users/:id - 获取用户资料
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? OR uid = ?').get(req.params.id, req.params.id)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json({ user: formatUser(user) })
})
