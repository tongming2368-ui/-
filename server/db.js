import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'phototool.db')

// 北京时间函数
const beijingTimeStr = () => {
  const now = new Date()
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return beijing.toISOString().replace('T', ' ').substring(0, 19)
}

let db = null

// 初始化数据库
export async function initDB() {
  const SQL = await initSqlJs()

  // 如果有保存的文件就加载
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      nickname TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      points INTEGER DEFAULT 100,
      level INTEGER DEFAULT 1,
      sign_days INTEGER DEFAULT 0,
      medals TEXT DEFAULT '[]',
      join_date TEXT DEFAULT (date('now')),
      is_admin INTEGER DEFAULT 0,
      is_registered INTEGER DEFAULT 1,
      email_verified INTEGER DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      collections_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      excerpt TEXT DEFAULT '',
      author_id INTEGER,
      author_name TEXT,
      author_avatar TEXT DEFAULT '',
      author_level INTEGER DEFAULT 1,
      category TEXT DEFAULT 'talk',
      is_sticky INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      hide_type TEXT DEFAULT '',
      hide_value INTEGER DEFAULT 0,
      is_essence INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      placement TEXT DEFAULT '',
      activity_placement TEXT DEFAULT '',
      event_date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      rewards TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS showcase (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      thumbnail_url TEXT DEFAULT '',
      author_id INTEGER,
      author_name TEXT,
      author_avatar TEXT DEFAULT '',
      camera TEXT DEFAULT '',
      lens TEXT DEFAULT '',
      settings TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      preset_data TEXT DEFAULT '{}',
      category TEXT DEFAULT 'lightroom',
      tags TEXT DEFAULT '[]',
      author_id INTEGER,
      author_name TEXT,
      author_avatar TEXT DEFAULT '',
      download_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tutorials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      excerpt TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      category TEXT DEFAULT 'beginner',
      tags TEXT DEFAULT '[]',
      author_id INTEGER,
      author_name TEXT,
      author_avatar TEXT DEFAULT '',
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_sticky INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      specs TEXT DEFAULT '{}',
      description TEXT DEFAULT '',
      price_range TEXT DEFAULT '',
      sensor TEXT DEFAULT '',
      mount_type TEXT DEFAULT '',
      release_year INTEGER,
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 通用表
  const commonTables = ['tools', 'deals', 'activities', 'announcements', 'links', 'ads']
  for (const t of commonTables) {
    db.run(`CREATE TABLE IF NOT EXISTS ${t} (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT DEFAULT (datetime('now')))`)
  }

  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS verify_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, code TEXT NOT NULL, type TEXT DEFAULT 'register', expires_at INTEGER NOT NULL, used INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS user_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL, target_id INTEGER NOT NULL, action_type TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, author_name TEXT, author_avatar TEXT, content TEXT NOT NULL, likes INTEGER DEFAULT 0, parent_id INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS sign_records (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, sign_date TEXT NOT NULL, points_earned INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`)
  
  // 站内信表
  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER, recipient_id INTEGER NOT NULL, title TEXT DEFAULT '', content TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, author_name TEXT, author_avatar TEXT, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`)

  
  // 黑名单表
  db.run(`CREATE TABLE IF NOT EXISTS user_blacklist (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, blocked_user_id INTEGER NOT NULL, reason TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, blocked_user_id))`)
  
  // 积分记录表
  db.run(`CREATE TABLE IF NOT EXISTS points_history (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, points INTEGER NOT NULL, description TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`)

  // 攻略表
  db.run("CREATE TABLE IF NOT EXISTS guides (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '', content TEXT DEFAULT '', cover_gradient TEXT DEFAULT '', cover_image TEXT DEFAULT '', tag TEXT DEFAULT '', author_id INTEGER, author_name TEXT DEFAULT '', view_count INTEGER DEFAULT 0, like_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0, is_sticky INTEGER DEFAULT 0, status TEXT DEFAULT 'published', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))")

  // 厂商活动表
  db.run("CREATE TABLE IF NOT EXISTS brand_activities (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '', content TEXT DEFAULT '', brand TEXT DEFAULT '', brand_icon TEXT DEFAULT '📸', category TEXT DEFAULT '品牌活动', event_date TEXT DEFAULT '', location TEXT DEFAULT '', link TEXT DEFAULT '', cover_gradient TEXT DEFAULT '', is_highlight INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))")

  // VIP字段
  try { db.run("ALTER TABLE users ADD COLUMN vip_level INTEGER DEFAULT 0") } catch (e) {}
  try { db.run("ALTER TABLE users ADD COLUMN vip_expire TEXT DEFAULT NULL") } catch (e) {}
  
  // 举报表
  db.run(`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL, target_type TEXT NOT NULL, target_id INTEGER NOT NULL, reason TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`)
  
  // 添加is_editor字段（如果不存在）
  try {
    db.run('ALTER TABLE users ADD COLUMN is_editor INTEGER DEFAULT 0')
  } catch (e) { /* 字段已存在 */ }
  
  // 添加birthday字段（如果不存在）
  try {
    db.run('ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT NULL')
  } catch (e) { /* 字段已存在 */ }
  
  // 保存到磁盘
  saveDB()
  console.log('📦 Database initialized')
}

// 保存数据库到磁盘
export function saveDB() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

// ========== 包装层：兼容 better-sqlite3 风格 ==========

// 执行单条语句
function run(sql, params = []) {
  try {
    db.run(sql, params)
    saveDB()
    // 获取 lastInsertRowid
    const result = db.exec('SELECT last_insert_rowid() as id')
    return { lastInsertRowid: result[0]?.values[0][0] || 0, changes: db.getRowsModified() }
  } catch (e) {
    console.error('DB run error:', e.message, sql)
    throw e
  }
}

// 查询单条
function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    if (stmt.step()) {
      const row = {}
      const cols = stmt.getColumnNames()
      const vals = stmt.get()
      cols.forEach((c, i) => row[c] = vals[i])
      stmt.free()
      return row
    }
    stmt.free()
    return undefined
  } catch (e) {
    console.error('DB get error:', e.message, sql)
    return undefined
  }
}

// 查询多条
function all(sql, params = []) {
  try {
    const results = db.exec(sql, params)
    if (!results.length) return []
    const cols = results[0].columns
    return results[0].values.map(row => {
      const obj = {}
      cols.forEach((c, i) => obj[c] = row[i])
      return obj
    })
  } catch (e) {
    console.error('DB all error:', e.message, sql)
    return []
  }
}

// 事务
function transaction(fn) {
  return (...args) => {
    db.run('BEGIN TRANSACTION')
    try {
      const result = fn(...args)
      db.run('COMMIT')
      saveDB()
      return result
    } catch (e) {
      db.run('ROLLBACK')
      throw e
    }
  }
}

// 导出 db 对象，模拟 better-sqlite3 接口
const dbProxy = {
  run,
  get,
  all,
  transaction,
  prepare(sql) {
    return {
      run(...params) { return run(sql, params) },
      get(...params) { return get(sql, params) },
      all(...params) { return all(sql, params) },
    }
  },
  exec(sql, params = []) { return db.exec(sql, params) },
}

export default dbProxy
