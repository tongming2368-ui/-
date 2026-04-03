<template>
  <div class="posts-page" :class="{ 'guest-blur': !isLoggedIn }">
    <!-- 三栏布局 -->
    <div class="posts-layout">
      <!-- 左侧：社区动态 -->
      <aside class="left-sidebar">
        <div class="sidebar-card glass">
          <h3>🔥 昨日最火</h3>
          <div class="hot-list">
            <div v-for="(post, i) in hotPosts" :key="i" class="hot-item">
              <span class="rank">{{ i + 1 }}</span>
              <span class="hot-title">{{ post.title }}</span>
            </div>
          </div>
        </div>
        <div class="sidebar-card glass">
          <h3>📢 最近动态</h3>
          <div class="activity-list">
            <div v-for="(act, i) in activities" :key="i" class="activity-item">
              {{ act }}
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间：帖子列表 -->
      <div class="posts-main">
        <!-- 顶部操作栏 -->
        <div class="posts-header glass">
          <div class="header-top">
            <h2>📚 帖子区</h2>
            <span class="stats">今日: {{ todayCount }}帖 | {{ todayReplies }}回复</span>
            <button class="new-post-btn" @click="showNewPost = true">发布新帖</button>
          </div>
          <div class="search-bar">
            <input v-model="searchQuery" placeholder="🔍 搜索标题/作者..." />
          </div>
          <div class="category-tabs">
            <button
              v-for="cat in visibleCategories"
              :key="cat.value"
              :class="{ active: currentCategory === cat.value }"
              @click="currentCategory = cat.value"
            >
              {{ cat.label }}
            </button>
          </div>
          <div class="sort-tabs">
            <button
              v-for="sort in sorts"
              :key="sort.value"
              :class="{ active: currentSort === sort.value }"
              @click="currentSort = sort.value"
            >
              {{ sort.label }}
            </button>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div class="posts-list">
          <GlassCard
            v-for="post in filteredPosts"
            :key="post.id"
            hoverable
            class="post-card"
            @click="openPost(post)"
          >
            <div class="post-author">
              <div class="avatar">{{ post.authorAvatar || '👤' }}</div>
              <span class="author-name">{{ post.author }}</span>
              <span class="author-level">Lv.{{ post.authorLevel }}</span>
            </div>
            <div class="post-content">
              <div class="post-tags">
                <span v-if="post.isSticky" class="tag sticky">📌 置顶</span>
                <span class="tag category">{{ getCategoryLabel(post.category) }}</span>
              </div>
              <h3 class="post-title">{{ post.title }}</h3>
              <div class="post-meta">
                <span>{{ formatTime(post.createdAt) }}</span>
                <span v-if="post.isHidden" class="lock-tag">🔒 需{{ post.hideValue }}积分</span>
              </div>
            </div>
            <div class="post-stats">
              <span>🔥 {{ post.viewCount }}</span>
              <span>💬 {{ post.commentCount }}</span>
              <span>👍 {{ post.likeCount }}</span>
            </div>
          </GlassCard>
        </div>
      </div>

      <!-- 右侧：个人中心 -->
      <aside class="right-sidebar">
        <div class="sidebar-card glass">
          <h3>🚀 快捷操作</h3>
          <div class="quick-actions">
            <button @click="viewMyPosts">📝 我的帖子 <span v-if="showMyPostsBadge" class="red-dot"></span></button>
            <button @click="viewMyReplies">💬 我的回复 <span v-if="showMyRepliesBadge" class="red-dot"></span></button>
            <button @click="goUserCenter">⭐ 我的收藏</button>
            <button @click="viewNotifications">🔔 消息通知 <span v-if="showNotificationsBadge" class="red-dot"></span></button>
          </div>
        </div>
        <div class="sidebar-card glass">
          <h3>📅 每日签到</h3>
          <div class="sign-area">
            <p>连续签到 <strong>{{ signDays }}</strong> 天</p>
            <button class="sign-btn" @click="handleSign" :disabled="signed">
              {{ signed ? '✅ 已签到' : '签到领积分' }}
            </button>
          </div>
        </div>
        <div class="sidebar-card glass">
          <h3>🏆 排行榜</h3>
          <div class="rank-list">
            <div v-for="(user, i) in topUsers" :key="i" class="rank-item">
              <span class="rank" :class="{ 'top1': i === 0, 'top2': i === 1, 'top3': i === 2 }">{{ i + 1 }}</span>
              <span class="rank-name">{{ user.name }}</span>
              <span class="rank-points">{{ user.points }}分</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 帖子详情弹窗 -->
    <Modal v-model="showDetail" :title="currentPost?.title" width="900px">
      <div v-if="currentPost" class="post-detail">
        <div class="detail-header">
          <div class="detail-author">
            <div class="avatar large">{{ currentPost.authorAvatar || '👤' }}</div>
            <div>
              <div class="author-name">{{ currentPost.author }}</div>
              <div class="author-info">Lv.{{ currentPost.authorLevel }} · {{ formatTime(currentPost.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div class="detail-body" v-html="renderContent(currentPost.content)"></div>
        <div v-if="currentPost.isHidden && !currentPost._unlocked" class="hidden-content">
          <div class="lock-overlay">
            <p>🔒 此内容需 {{ currentPost.hideValue }} 积分解锁</p>
            <button class="unlock-btn" @click="unlockPost">立即解锁</button>
          </div>
        </div>
        <div class="detail-actions">
          <button @click="likePost">👍 {{ currentPost.likeCount }} 点赞</button>
          <button @click="collectPost">⭐ {{ currentPost.collectCount }} 收藏</button>
          <button @click="tipPost">💰 打赏</button>
          <button @click="reportPost">🚩 举报</button>
        </div>
        <div class="comments-section">
          <h3>💬 评论 ({{ currentPost.commentCount }})</h3>
          <div class="comments-list" v-if="currentPost._comments?.length">
            <div v-for="c in currentPost._comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">{{ c.avatar }}</div>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="comment-author">{{ c.author }}</span>
                  <span class="comment-time">{{ c.time }}</span>
                </div>
                <div class="comment-text">{{ c.content }}</div>
              </div>
            </div>
          </div>
          <div class="comment-input">
            <input v-model="commentText" placeholder="输入评论..." @keyup.enter="submitComment" />
            <button @click="submitComment">发表评论</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 发帖弹窗 -->
    <Modal v-model="showNewPost" title="发布新帖" width="700px">
      <div class="new-post-form">
        <select v-model="newPost.category">
          <option value="talk">闲聊</option>
          <option value="photo">摄影专区</option>
          <option value="activity">活动招纳</option>
          <option value="resource">资源中心</option>
          <option value="qa">提问·悬赏</option>
          <option value="tutorial">攻略教程</option>
          <option value="activity_zone">活动专区</option>
          <option value="deals_zone">优惠分享</option>
        </select>
        <input v-model="newPost.title" placeholder="标题" />
        <textarea v-model="newPost.content" placeholder="内容 (支持Markdown)..." rows="10"></textarea>
        <div class="form-actions">
          <button class="submit-btn" @click="submitPost">发布</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useUserStore } from '@/stores/user'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()
const router = useRouter()
const postsStore = usePostsStore()
const userStore = useUserStore()

const searchQuery = ref('')
const currentCategory = ref('all')
const currentSort = ref('hot')
const showDetail = ref(false)
const currentPost = ref(null)
const showNewPost = ref(false)
const commentText = ref('')
const signed = ref(false)
const signDays = ref(5)
// 新回复小红点
const showMyPostsBadge = ref(false)
const showMyRepliesBadge = ref(false)
const showNotificationsBadge = ref(false)

const newPost = ref({
  category: 'talk',
  title: '',
  content: ''
})

const categories = [
  { value: 'all', label: '全部' },
  { value: 'talk', label: '闲聊' },
  { value: 'photo', label: '摄影专区' },
  { value: 'activity', label: '活动招纳' },
  { value: 'resource', label: '资源中心' },
  { value: 'qa', label: '提问·悬赏' },
  { value: 'tutorial', label: '攻略教程' },
  { value: 'activity_zone', label: '活动专区', hidden: true },
  { value: 'deals_zone', label: '优惠分享', hidden: true },
]

// 用于标签页显示的分类（排除隐藏分类）
const visibleCategories = categories.filter(c => !c.hidden)

const sorts = [
  { value: 'hot', label: '🔥最热' },
  { value: 'latest', label: '🕒最新' },
  { value: 'reply', label: '💬最新回复' },
]

const hotPosts = ref([
  { title: '2026年度镜头推荐榜单' },
  { title: '索尼A7R5深度评测' },
  { title: '夜景拍摄从入门到精通' },
  { title: '聊聊胶片摄影的魅力' },
  { title: '风光摄影构图技巧' },
])

// 用户最近动态
const activities = computed(() => {
  if (!userStore.user) return ['登录后查看你的动态']
  const myPosts = postsStore.posts.filter(p => p.author === userStore.user.nickname)
  const recent = []
  // 最近发布的帖子
  myPosts.slice(0, 3).forEach(p => {
    recent.push(`${userStore.user.nickname} 发布了「${p.title}」`)
  })
  // 最近的评论
  myPosts.forEach(p => {
    const comments = p._comments || []
    comments.filter(c => c.author === userStore.user.nickname).slice(0, 2).forEach(c => {
      recent.push(`${userStore.user.nickname} 回复了「${p.title}」`)
    })
  })
  if (recent.length === 0) return ['还没有动态，快去发帖吧']
  return recent.slice(0, 5)
})

const topUsers = ref([
  { name: '摄影老王', points: 5280 },
  { name: '器材达人', points: 3890 },
  { name: '扫街爱好者', points: 2456 },
])

const todayCount = 12
const todayReplies = 48

const filteredPosts = computed(() => postsStore.filteredPosts)

const getCategoryLabel = (cat) => {
  const c = categories.find(c => c.value === cat)
  return c ? c.label : cat
}

const formatTime = (time) => {
  const diff = Date.now() - new Date(time).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(time).toLocaleDateString()
}

const renderContent = (content) => {
  if (!content) return ''
  // 简单的 Markdown 转 HTML
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n/gim, '<br>')
}

const openPost = (post) => {
  if (!requireLogin('登录后即可查看帖子详情')) return
  currentPost.value = post
  showDetail.value = true
}

const likePost = () => {
  if (currentPost.value) {
    currentPost.value.likeCount++
  }
}

const goUserCenter = () => {
  if (requireLogin('登录后查看')) {
    router.push('/user')
  }
}

const viewMyPosts = () => {
  showMyPostsBadge.value = false
  localStorage.setItem('posts_badge_checked', String(Date.now()))
  router.push('/user')
}

const viewMyReplies = () => {
  showMyRepliesBadge.value = false
  localStorage.setItem('posts_badge_checked', String(Date.now()))
  router.push('/user')
}

const viewNotifications = () => {
  showNotificationsBadge.value = false
  localStorage.setItem('notifications_badge_checked', String(Date.now()))
  router.push('/user')
}

// 检查新回复和通知提醒
const checkNewReplies = () => {
  if (!userStore.user) return
  const nickname = userStore.user.nickname
  const myPosts = postsStore.posts.filter(p => p.author === nickname)
  const postsChecked = parseInt(localStorage.getItem('posts_badge_checked') || Date.now())
  const notifChecked = parseInt(localStorage.getItem('notifications_badge_checked') || Date.now())
  let hasNewReply = false
  let hasNotif = false

  // 检查我的帖子的新评论
  myPosts.forEach(p => {
    ;(p._comments || []).forEach(c => {
      const cTime = c.createdAt || 0
      if (cTime > postsChecked && c.author !== nickname) {
        hasNewReply = true
        hasNotif = true
      }
    })
  })

  // 检查我评论过的帖子的新评论（回复提醒）
  postsStore.posts.forEach(p => {
    const comments = p._comments || []
    const iCommented = comments.some(c => c.author === nickname)
    if (iCommented) {
      comments.forEach(c => {
        const cTime = c.createdAt || 0
        if (cTime > notifChecked && c.author !== nickname) {
          hasNotif = true
        }
      })
    }
  })

  showMyPostsBadge.value = hasNewReply
  showMyRepliesBadge.value = hasNewReply
  showNotificationsBadge.value = hasNotif
}

const collectPost = () => {
  if (!requireLogin('登录后即可收藏')) return
  if (currentPost.value) {
    currentPost.value.collectCount++
  }
}

const tipPost = () => {
  if (!requireLogin('登录后即可打赏')) return
  if (currentPost.value && userStore.user) {
    if (userStore.user.points >= 5) {
      userStore.addPoints(-5)
      alert('打赏成功！')
    } else {
      alert('积分不足')
    }
  }
}

const reportPost = () => {
  alert('举报已提交，管理员将尽快处理')
}

const unlockPost = () => {
  if (!requireLogin('登录后即可解锁')) return
  if (!currentPost.value || !userStore.user) return
  const cost = currentPost.value.hideValue
  if (userStore.user.points >= cost) {
    userStore.addPoints(-cost)
    currentPost.value._unlocked = true
  } else {
    alert(`积分不足，需要 ${cost} 积分`)
  }
}

const handleSign = async () => {
  if (!requireLogin('登录后即可签到')) return
  const result = await userStore.sign()
  if (result.points > 0) {
    signed.value = true
    signDays.value = result.signDays
  }
}

const submitComment = () => {
  if (!commentText.value.trim()) return
  if (!currentPost.value) return
  // 添加评论到帖子
  currentPost.value.commentCount++
  // 在评论区底部追加显示
  const commentList = currentPost.value._comments ||= []
  commentList.push({
    id: Date.now(),
    author: userStore.user?.nickname || '匿名用户',
    avatar: userStore.user?.avatar || '👤',
    content: commentText.value,
    time: '刚刚',
    createdAt: Date.now()
  })
  commentText.value = ''
  checkNewReplies()
  // 给评论者加积分
  userStore.addPoints(2)
}

const submitPost = () => {
  if (!newPost.value.title.trim()) return
  // activity_zone / deals_zone 分类帖子默认待审核
  const isZonePending = ['activity_zone', 'deals_zone'].includes(newPost.value.category)
  // 添加到帖子列表顶部
  const newPostData = {
    id: Date.now(),
    title: newPost.value.title,
    content: newPost.value.content || newPost.value.title,
    excerpt: newPost.value.content?.substring(0, 100) || newPost.value.title,
    author: userStore.user?.nickname || '匿名用户',
    authorAvatar: userStore.user?.avatar || '👤',
    authorLevel: userStore.user?.level || 1,
    category: newPost.value.category,
    isSticky: false,
    isHidden: isZonePending,
    hideType: '',
    hideValue: 0,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    collectCount: 0,
    createdAt: new Date().toISOString(),
    _userCreated: true,
  }
  postsStore.posts.unshift(newPostData)
  postsStore.saveUserPosts(postsStore.posts)
  showNewPost.value = false
  newPost.value = { category: 'talk', title: '', content: '' }
  // 发帖加积分
  userStore.addPoints(10)
  if (isZonePending) {
    alert('活动帖子已提交，等待管理员审核')
  }
}

onMounted(() => {
  postsStore.fetchPosts()
  checkNewReplies()
  // 监听后台帖子数据变化
  window.addEventListener('storage', (e) => {
    if (e.key === 'phototool_posts_data') {
      postsStore.fetchPosts()
      checkNewReplies()
    }
  })
})
</script>

<style scoped>

.posts-page {
  padding: 24px;
  color: var(--text-primary, #e8eaf0);
  min-height: 100%;
}

.posts-page.guest-blur .main-content-area,
.posts-page.guest-blur .post-card {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
}

.posts-layout {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.left-sidebar, .right-sidebar {
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  padding: 16px !important;
}

.sidebar-card h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.95));
}

.hot-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.hot-item .rank {
  color: #ffd700;
  font-weight: 600;
  width: 16px;
}

.hot-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-item {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.85));
  padding: 4px 0;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-actions button {
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px;
  color: var(--text-primary, #e8eaf0);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.red-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #ff4757;
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

.quick-actions button:hover {
  background: var(--glass-hover-bg);
}

.sign-area {
  text-align: center;
}

.sign-area p {
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.85));
}

.sign-btn {
  background: rgba(34, 197, 94, 0.4);
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  color: var(--text-primary, #e8eaf0);
  font-size: 14px;
  cursor: pointer;
}

.sign-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.6);
}

.sign-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.rank-item .rank {
  color: #ffd700;
  width: 16px;
}

.rank-name {
  flex: 1;
}

.rank-points {
  color: var(--text-primary);
  font-size: 12px;
}

.posts-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.posts-header {
  padding: 16px 20px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.header-top h2 {
  font-size: 18px;
}

.stats {
  font-size: 13px;
  color: var(--text-primary);
}

.new-post-btn {
  margin-left: auto;
  background: rgba(59, 130, 246, 0.5);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-primary, #e8eaf0);
  font-size: 13px;
  cursor: pointer;
}

.new-post-btn:hover {
  background: rgba(59, 130, 246, 0.7);
}

.search-bar input {
  width: 100%;
  height: 45px;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid lightgrey;
  outline: none;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0px 0px 20px -18px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 13px;
}
.search-bar input:hover {
  border: 2px solid lightgrey;
  box-shadow: 0px 0px 20px -17px;
}
.search-bar input:active {
  transform: scale(0.95);
}
.search-bar input:focus {
  border: 2px solid grey;
  background: rgba(255, 255, 255, 0.1);
}
.search-bar input::placeholder {
  color: var(--text-muted);
}.category-tabs, .sort-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.category-tabs button, .sort-tabs button {
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.85));
  font-size: 12px;
  cursor: pointer;
}

.category-tabs button.active, .sort-tabs button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary, #e8eaf0);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px !important;
}

.post-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  width: 60px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.avatar.large {
  width: 50px;
  height: 50px;
  font-size: 24px;
}

.author-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.author-level {
  font-size: 10px;
  color: var(--text-secondary);
}

.post-content {
  flex: 1;
  min-width: 0;
}

.post-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--input-bg);
}

.tag.sticky {
  background: rgba(239, 68, 68, 0.3);
}

.tag.category {
  background: rgba(59, 130, 246, 0.3);
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.lock-tag {
  color: #f59e0b;
}

.post-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-primary);
  flex-shrink: 0;
}

/* 帖子详情 */
.post-detail {
  color: #000;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.detail-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-author .author-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.detail-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-info {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.detail-body {
  line-height: 1.8;
  font-size: 15px;
  color: #111;
}

.detail-body :deep(h1) {
  font-size: 24px;
  margin: 16px 0 8px;
}

.detail-body :deep(h2) {
  font-size: 20px;
  margin: 14px 0 6px;
}

.hidden-content {
  margin: 20px 0;
}

.lock-overlay {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
}

.lock-overlay p {
  font-size: 16px;
  margin-bottom: 16px;
}

.unlock-btn {
  background: rgba(245, 158, 11, 0.5);
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  color: var(--text-primary, #e8eaf0);
  font-size: 14px;
  cursor: pointer;
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.detail-actions button {
  background: rgba(0, 60, 120, 0.08);
  border: 1px solid rgba(0, 60, 120, 0.15);
  border-radius: 20px;
  padding: 8px 18px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-actions button:hover {
  background: rgba(0, 60, 120, 0.15);
  color: #0a2a3a;
}

.comments-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.comments-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #000;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.comment-input {
  display: flex;
  gap: 8px;
}

.comment-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 8px 12px;
  color: #000;
  font-size: 14px;
  outline: none;
}

.comment-input input::placeholder {
  color: #8899aa;
}

.comment-input button {
  background: rgba(0, 120, 180, 0.7);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.comment-input button:hover {
  background: rgba(0, 120, 180, 0.9);
}

/* 发帖表单 */
.new-post-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.new-post-form select,
.new-post-form input,
.new-post-form textarea {
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text-primary, #e8eaf0);
  font-size: 14px;
  outline: none;
}

.new-post-form textarea {
  resize: vertical;
  min-height: 200px;
}

.submit-btn {
  background: rgba(34, 197, 94, 0.5);
  border: none;
  border-radius: 8px;
  padding: 10px;
  color: var(--text-primary, #e8eaf0);
  font-size: 15px;
  cursor: pointer;
}

.submit-btn:hover {
  background: rgba(34, 197, 94, 0.7);
}

</style>
