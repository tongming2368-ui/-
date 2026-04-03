import { Router } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import bcrypt from 'bcryptjs'
import { generateToken, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

// 生成随机UID
const genUID = () => String(Math.floor(100000 + Math.random() * 900000))

// 生成6位验证码
const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password, verifyCode } = req.body
  if (!username || !email || !password || !verifyCode) {
    return res.status(400).json({ error: '请填写完整信息' })
  }

  // 验证验证码
  const record = db.prepare(
    'SELECT * FROM verify_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?'
  ).get(email, verifyCode, 'register', Date.now())
  if (!record) return res.status(400).json({ error: '验证码错误或已过期' })

  // 标记验证码已使用
  db.prepare('UPDATE verify_codes SET used = 1 WHERE id = ?').run(record.id)

  // 检查用户名/邮箱
  const existUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)
  if (existUser) return res.status(400).json({ error: '用户名或邮箱已被注册' })

  const hash = bcrypt.hashSync(password, 10)
  const uid = genUID()
  const today = new Date().toISOString().slice(0, 10)

  const result = db.prepare(`
    INSERT INTO users (uid, username, nickname, email, password, join_date, is_registered, email_verified, points)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1, 100)
  `).run(uid, username, username, email, hash, today)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  const token = generateToken(user)

  res.json({
    token,
    user: formatUser(user)
  })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' })
  }

  const searchTerm = username.toLowerCase()
  const results = db.exec(
    `SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR LOWER(nickname) = ?`,
    [searchTerm, searchTerm, searchTerm]
  )
  const user = results[0]?.values[0] ? Object.fromEntries(results[0].columns.map((col, i) => [col, results[0].values[0][i]])) : null

  if (!user) return res.status(400).json({ error: '用户不存在' })
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: '密码错误' })
  }

  const token = generateToken(user)
  res.json({
    token,
    user: formatUser(user)
  })
})

// POST /api/auth/send-code
router.post('/send-code', async (req, res) => {
  const { email, type = 'register' } = req.body
  if (!email) return res.status(400).json({ error: '请输入邮箱' })

  // 检查60秒内是否已发送
  const recent = db.prepare(
    'SELECT * FROM verify_codes WHERE email = ? AND type = ? AND created_at > datetime("now", "-60 seconds")'
  ).get(email, type)
  if (recent) return res.status(429).json({ error: '请60秒后再试' })

  const code = genCode()
  const expires = Date.now() + 5 * 60 * 1000

  db.prepare(
    'INSERT INTO verify_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
  ).run(email, code, type, expires)

  // 发送真实邮件
  try {
    const { sendVerifyCode, sendResetCode } = await import('../utils/mailer.js')
    if (type === 'reset') {
      await sendResetCode(email, code)
    } else {
      await sendVerifyCode(email, code)
    }
    res.json({ message: '验证码已发送' })
  } catch (error) {
    console.error('发送邮件失败:', error.message)
    // 邮件发送失败也返回成功（避免暴露验证码），但记录日志
    res.json({ message: '验证码已发送' })
  }
})

// GET /api/auth/me - 获取当前用户信息
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id)
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ user: formatUser(user) })
  } catch {
    res.status(401).json({ error: '登录已过期' })
  }
})

// POST /api/auth/reset-password - 重置密码
router.post('/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: '请填写完整信息' })
  }

  // 验证验证码
  const record = db.prepare(
    'SELECT * FROM verify_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?'
  ).get(email.toLowerCase(), code, 'reset', Date.now())
  if (!record) return res.status(400).json({ error: '验证码错误或已过期' })

  // 标记验证码已使用
  db.prepare('UPDATE verify_codes SET used = 1 WHERE id = ?').run(record.id)

  // 查找用户
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email.toLowerCase())
  if (!user) return res.status(400).json({ error: '用户不存在' })

  // 更新密码
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hash, user.id)

  res.json({ message: '密码重置成功' })
})

// 格式化用户数据（去除密码）
function formatUser(user) {
  if (!user) return null
  const { password, ...rest } = user
  return {
    ...rest,
    medals: safeJSON(rest.medals, []),
    avatar: rest.avatar || '',
    bio: rest.bio || '',
    gender: rest.gender || '',
    location: rest.location || '',
    website: rest.website || '',
    phone: rest.phone || '',
  }
}

function safeJSON(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

export default router
