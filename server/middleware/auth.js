import jwt from 'jsonwebtoken'
import db from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'phototool-secret-key-change-in-production'

// 生成 JWT
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, uid: user.uid, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// 验证 JWT 中间件
export const authRequired = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '请先登录' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

// 管理员权限中间件
export const adminRequired = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '请先登录' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded.is_admin) return res.status(403).json({ error: '需要管理员权限' })
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

// 可选登录（有就解析，没有也能通过）
export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET)
    } catch {}
  }
  next()
}

export { JWT_SECRET }

// 编辑权限检查（编辑或管理员）
export function editorRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id)
    if (!user) return res.status(401).json({ error: '用户不存在' })
    if (!user.is_admin && !user.is_editor) {
      return res.status(403).json({ error: '需要编辑权限' })
    }
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: '登录已过期' })
  }
}
