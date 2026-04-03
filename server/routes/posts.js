import { Router } from 'express'
import db from '../db.js'
import { authRequired, optionalAuth, editorRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/posts - 帖子列表
router.get('/', (req, res) => {
  const { category, sort = 'hot', search, user_id, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let where = "WHERE status = 'published'"
  const params = []

  if (category && category !== 'all') {
    where += ' AND category = ?'
    params.push(category)
  }
  if (search) {
    where += ' AND (title LIKE ? OR author_name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (user_id) {
    where += ' AND author_id = ?'
    params.push(user_id)
  }

  let orderBy = 'view_count DESC'
  if (sort === 'latest') orderBy = 'created_at DESC'
  if (sort === 'reply') orderBy = 'comment_count DESC'

  const sql = `SELECT * FROM posts ${where} ORDER BY is_sticky DESC, ${orderBy} LIMIT ? OFFSET ?`
  params.push(Number(limit), Number(offset))

  const posts = db.prepare(sql).all(...params)
  const total = db.prepare(`SELECT COUNT(*) as count FROM posts ${where}`).get(...params.slice(0, -2)).count

  res.json({ posts, total, page: Number(page), limit: Number(limit) })
})

// GET /api/posts/zone/:zone - 活动专区/优惠专区帖子
router.get('/zone/:zone', (req, res) => {
  const { zone } = req.params
  const posts = db.prepare(
    "SELECT * FROM posts WHERE status = 'published' AND (activity_placement = ? OR placement = ? OR category = ?) ORDER BY is_sticky DESC, created_at DESC"
  ).all(zone, zone, zone)
  res.json({ posts })
})

// GET /api/posts/:id - 帖子详情
// GET /api/posts/hot-yesterday - 昨日最火（点赞50% + 评论50%）
router.get('/hot-yesterday', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 20)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().substring(0, 10)
  
  // 获取所有帖子
  const posts = db.prepare("SELECT * FROM posts WHERE status = 'published'").all()
  
  // 计算每个帖子的昨日热度
  const scored = posts.map(p => {
    const likes = db.prepare(
      "SELECT COUNT(*) as c FROM user_actions WHERE target_type = 'post' AND target_id = ? AND action_type = 'like' AND DATE(created_at) = ?"
    ).get(p.id, yesterdayStr)
    const comments = db.prepare(
      "SELECT COUNT(*) as c FROM comments WHERE post_id = ? AND DATE(created_at) = ?"
    ).get(p.id, yesterdayStr)
    return {
      ...p,
      yesterday_likes: likes.c,
      yesterday_comments: comments.c,
      score: likes.c * 0.5 + comments.c * 0.5
    }
  })
  .filter(p => p.yesterday_likes > 0 || p.yesterday_comments > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  
  res.json({ posts: scored, date: yesterdayStr })
router.get('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: '帖子不存在' })

  // 增加浏览量
  db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(post.id)
  post.view_count++

  res.json({ post })
})

// POST /api/posts - 发帖（需登录）
router.post('/', editorRequired, (req, res) => {
  const { title, content, category, hideType, hideValue, placement, activityPlacement } = req.body
  if (!title) return res.status(400).json({ error: '标题不能为空' })

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  db.prepare(`
    INSERT INTO posts (title, content, excerpt, author_id, author_name, author_avatar, author_level, category, hide_type, hide_value, placement, activity_placement)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, content,
    (content || '').substring(0, 100),
    user.id, user.nickname, user.avatar || '', user.level,
    category || 'talk',
    hideType || '', hideValue || 0,
    placement || '', activityPlacement || ''
  )

  // 更新帖子计数
  db.prepare('UPDATE users SET posts_count = posts_count + 1 WHERE id = ?').run(user.id)

  // 获取最新插入的帖子
  const post = db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT 1').get()
  res.json({ post })
})

// PUT /api/posts/:id - 编辑帖子
router.put('/:id', editorRequired, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: '帖子不存在' })
  if (post.author_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: '无权编辑' })
  }

  const { title, content, category, isSticky, isHidden, hideType, hideValue, status, isEssence } = req.body
  db.prepare(`
    UPDATE posts SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      category = COALESCE(?, category),
      is_sticky = COALESCE(?, is_sticky),
      is_hidden = COALESCE(?, is_hidden),
      hide_type = COALESCE(?, hide_type),
      hide_value = COALESCE(?, hide_value),
      is_essence = COALESCE(?, is_essence),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title, content, category, isSticky, isHidden, hideType, hideValue, isEssence, status, post.id)

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id)
  res.json({ post: updated })
})

// DELETE /api/posts/:id - 删除帖子
router.delete('/:id', editorRequired, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: '帖子不存在' })
  if (post.author_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: '无权删除' })
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id)
  if (post.author_id) {
    db.prepare('UPDATE users SET posts_count = MAX(0, posts_count - 1) WHERE id = ?').run(post.author_id)
  }
  res.json({ message: '删除成功' })
})

// POST /api/posts/:id/like - 点赞
router.post('/:id/like', authRequired, (req, res) => {
  const postId = Number(req.params.id)
  const userId = req.user.id

  const existing = db.prepare('SELECT * FROM user_actions WHERE user_id = ? AND target_type = ? AND target_id = ? AND action_type = ?').get(userId, 'post', postId, 'like')
  if (existing) {
    // 取消点赞
    db.prepare('DELETE FROM user_actions WHERE id = ?').run(existing.id)
    db.prepare('UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?').run(postId)
    res.json({ liked: false })
  } else {
    db.prepare('INSERT INTO user_actions (user_id, target_type, target_id, action_type) VALUES (?, ?, ?, ?)').run(userId, 'post', postId, 'like')
    db.prepare('UPDATE posts SET like_count = like_count + 1 WHERE id = ?').run(postId)
    res.json({ liked: true })
  }
})

// ========== 评论相关 API ==========

// GET /api/posts/:id/comments - 获取帖子评论（分页）
router.get('/:id/comments', (req, res) => {
  const postId = Number(req.params.id)
  const limit = Math.min(Number(req.query.limit) || 20, 50)
  const offset = Number(req.query.offset) || 0
  
  // 获取顶级评论（parent_id = 0），按时间正序（最早的在前=1楼）
  const comments = db.prepare(`
    SELECT c.*, 
      CASE WHEN c.parent_id > 0 THEN (
        SELECT author_name FROM comments WHERE id = c.parent_id
      ) ELSE NULL END as parent_author
    FROM comments c
    WHERE c.post_id = ? AND c.parent_id = 0
    ORDER BY c.created_at ASC
    LIMIT ? OFFSET ?
  `).all(postId, limit, offset)
  
  // 计算楼层号（从1开始）
  const totalBefore = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND parent_id = 0 AND created_at < (SELECT created_at FROM comments WHERE id = ?)').get(postId, comments[0]?.id || 0).count
  
  comments.forEach((c, i) => {
    c.floor = totalBefore + i + 1
  })
  
  // 倒序显示（最新的在前）
  comments.reverse()
  
  const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND parent_id = 0').get(postId).count
  res.json({ comments, total, hasMore: offset + comments.length < total })
})

// POST /api/posts/:id/comments - 发表评论
router.post('/:id/comments', authRequired, (req, res) => {
  const postId = Number(req.params.id)
  const { content, parent_id = 0 } = req.body
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '评论内容不能为空' })
  }
  
  // 检查帖子是否存在
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) return res.status(404).json({ error: '帖子不存在' })
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  
  db.prepare(`
    INSERT INTO comments (post_id, user_id, author_name, author_avatar, content, parent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(postId, req.user.id, user.nickname || user.username, user.avatar || '👤', content.trim(), parent_id)
  
  // 更新帖子评论数
  db.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').run(postId)
  
  res.json({ message: '评论成功' })
})

// POST /api/posts/:id/tip - 打赏帖子
router.post('/:id/tip', authRequired, (req, res) => {
  const postId = parseInt(req.params.id)
  const { amount } = req.body
  
  // 验证打赏金额
  const validAmounts = [50, 100, 200, 500]
  if (!validAmounts.includes(amount)) {
    return res.status(400).json({ error: '无效的打赏金额' })
  }
  
  // 检查帖子是否存在
  const post = db.prepare('SELECT id, author_id FROM posts WHERE id = ?').get(postId)
  if (!post) return res.status(404).json({ error: '帖子不存在' })
  
  // 不能打赏自己的帖子
  if (post.author_id === req.user.id) {
    return res.status(400).json({ error: '不能打赏自己的帖子' })
  }
  
  // 检查用户积分
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id)
  if (user.points < amount) {
    return res.status(400).json({ error: '积分不足' })
  }
  
  // 扣除打赏者积分
  db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(amount, req.user.id)
  
  // 增加帖子作者积分
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(amount, post.author_id)
  
  // 记录打赏
  db.prepare(`
    INSERT INTO user_actions (user_id, action_type, target_type, target_id, created_at)
    VALUES (?, 'tip', 'post', ?, datetime('now'))
  `).run(req.user.id, postId)
  
  // 更新帖子打赏总数
  db.prepare('UPDATE posts SET tip_count = COALESCE(tip_count, 0) + 1, tip_amount = COALESCE(tip_amount, 0) + ? WHERE id = ?').run(amount, postId)
  
  res.json({ message: '打赏成功', tip_count: 1, tip_amount: amount })
})

// POST /api/posts/:id/report - 举报帖子
router.post('/:id/report', authRequired, (req, res) => {
  const postId = Number(req.params.id)
  const { reason } = req.body
  
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: '请填写举报原因' })
  }
  
  // 检查帖子是否存在
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) return res.status(404).json({ error: '帖子不存在' })
  
  // 检查是否重复举报
  const existing = db.prepare(
    'SELECT * FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?'
  ).get(req.user.id, 'post', postId)
  if (existing) return res.status(400).json({ error: '您已举报过此帖子' })
  
  // 记录举报
  db.prepare(
    'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, 'post', postId, reason.trim())
  
  res.json({ message: '举报已提交，管理员将尽快处理' })
})

})

export default router
