import bcrypt from 'bcryptjs'
import { initDB } from './db.js'

await initDB()

// 导入 db proxy
import db from './db.js'

const hash = bcrypt.hashSync('admin123', 10)
db.run("INSERT OR IGNORE INTO users (uid, username, nickname, email, password, is_admin, points, level, avatar) VALUES ('100001', 'admin', '管理员', 'admin@phototool.local', ?, 1, 5000, 10, '👑')", [hash])

const user = db.get('SELECT id, uid, username, nickname, is_admin FROM users WHERE username = ?', ['admin'])
console.log('Admin user created:', user)

process.exit(0)
