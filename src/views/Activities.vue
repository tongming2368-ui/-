<template>
  <div class="activities-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="page-header">
      <h1>🎯 活动专区</h1>
      <p class="subtitle">精彩摄影活动，等你来参与</p>
    </div>

    <div class="activities-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
      <div class="search-bar inline-search">
        <input v-model="searchQuery" placeholder="🔍 搜索活动..." />
      </div>
    </div>

    <div class="activities-grid">
      <GlassCard
        v-for="activity in filteredActivities"
        :key="activity.id"
        hoverable
        class="activity-card"
        @click="openActivityDetail(activity)"
      >
        <div class="activity-cover" :style="{ background: activity.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }">
          <span class="activity-status" :class="activity.status || 'ongoing'">{{ getStatusLabel(activity.status || 'ongoing') }}</span>
        </div>
        <div class="activity-content">
          <div class="activity-type">{{ activity.type || '活动' }}</div>
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-desc">{{ activity.description || activity.excerpt }}</p>
          <div class="activity-meta">
            <span class="meta-item">📅 {{ activity.date || '长期活动' }}</span>
            <span class="meta-item" v-if="activity.participants !== undefined">👥 {{ activity.participants }}人参与</span>
            <span class="meta-item" v-if="activity.location">📍 {{ activity.location }}</span>
          </div>
          <div class="activity-rewards" v-if="activity.rewards && activity.rewards.length">
            <span class="reward-label">奖励:</span>
            <span v-for="reward in activity.rewards" :key="reward" class="reward-tag">{{ reward }}</span>
          </div>
        </div>
        <div class="activity-footer">
          <button v-if="activity.status === 'ongoing' || !activity.status" class="join-btn" @click.stop="joinActivity(activity)">立即报名</button>
          <button v-else-if="activity.status === 'upcoming'" class="notify-btn" @click.stop="notifyActivity(activity)">提醒我</button>
          <button v-else class="ended-btn">已结束</button>
        </div>
      </GlassCard>
    </div>

    <!-- 帖子详情弹窗 -->
    <Modal v-model="showDetail" :title="currentActivity?.title" width="900px">
      <div v-if="currentActivity" class="post-detail">
        <div class="detail-header">
          <div class="detail-author">
            <div class="avatar large">{{ currentActivity.authorAvatar || '🎯' }}</div>
            <div>
              <div class="author-name">{{ currentActivity.author }}</div>
              <div class="author-info">Lv.{{ currentActivity.authorLevel || 10 }} · {{ formatTime(currentActivity.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div v-if="currentActivity.date || currentActivity.location" class="detail-meta-bar">
          <span v-if="currentActivity.date">📅 {{ currentActivity.date }}</span>
          <span v-if="currentActivity.location">📍 {{ currentActivity.location }}</span>
        </div>
        <div class="detail-body" v-html="renderContent(currentActivity.content)"></div>
        <div class="detail-actions">
          <button @click="likeActivity">👍 {{ currentActivity.likeCount || 0 }} 点赞</button>
          <button @click="collectActivity">⭐ {{ currentActivity.collectCount || 0 }} 收藏</button>
        </div>
        <div class="comments-section">
          <h3>💬 评论 ({{ currentActivity.commentCount || 0 }})</h3>
          <div class="comments-list" v-if="currentActivity._comments?.length">
            <div v-for="c in currentActivity._comments" :key="c.id" class="comment-item">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'
import { useUserStore } from '@/stores/user'

const { isLoggedIn, requireLogin } = useAccessControl()
const userStore = useUserStore()

const { getPageFilterOptions } = useFilterConfig()

const activeTab = ref('all')
const searchQuery = ref('')
const showDetail = ref(false)
const currentActivity = ref(null)
const commentText = ref('')

const tabs = getPageFilterOptions('activities', 'tab').length > 0
  ? getPageFilterOptions('activities', 'tab').map(o => ({ value: o.value, label: o.label, icon: '' }))
  : [
      { value: 'all', label: '全部', icon: '📋' },
      { value: 'challenge', label: '摄影赛', icon: '🏆' },
      { value: 'workshop', label: '线下活动', icon: '🎪' },
      { value: 'online', label: '线上活动', icon: '💻' },
      { value: 'contest', label: '有奖征集', icon: '🎁' }
    ]

const staticActivities = ref([
  {
    id: 1,
    title: '2024年度风光摄影大赛',
    description: '征集全国优秀风光摄影作品，奖金丰厚，诚邀各位风光摄影师参与。',
    type: '摄影赛',
    status: 'ongoing',
    date: '2024.01.01 - 2024.03.31',
    participants: 2345,
    location: '全国',
    rewards: ['奖金5000元', '官方证书', '器材赞助'],
    coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    title: '人像摄影线下 workshop',
    description: '著名人像摄影师带你 learn 人像布光与模特引导，限额30人。',
    type: '线下活动',
    status: 'upcoming',
    date: '2024.02.15',
    participants: 28,
    location: '北京·798艺术区',
    rewards: ['现场教学', '模特', '午餐'],
    coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    title: '手机摄影每日挑战',
    description: '每日主题拍摄挑战，用手机记录生活美好瞬间。',
    type: '线上活动',
    status: 'ongoing',
    date: '长期活动',
    participants: 8923,
    location: '线上',
    rewards: ['积分奖励', '精选展示'],
    coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 4,
    title: '我的2024春节故事 征集活动',
    description: '分享春节期间用相机/手机记录的团圆时刻，赢取新年好礼。',
    type: '有奖征集',
    status: 'upcoming',
    date: '2024.02.10 - 2024.02.20',
    participants: 0,
    location: '线上',
    rewards: ['红包', '器材', '周边'],
    coverGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 5,
    title: '星空摄影训练营',
    description: '专业导师带教，理论与实践结合，学习星空摄影技巧。',
    type: '线下活动',
    status: 'upcoming',
    date: '2024.03.01 - 2024.03.03',
    participants: 15,
    location: '青海·茶卡盐湖',
    rewards: ['专业指导', '住宿', '拍摄机会'],
    coverGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  {
    id: 6,
    title: '短视频剪辑大赛',
    description: '用你的视频剪辑作品展示摄影魅力，万元奖金池等你来。',
    type: '摄影赛',
    status: 'ended',
    date: '2023.10.01 - 2023.12.31',
    participants: 567,
    location: '全国',
    rewards: ['奖金', '平台推荐'],
    coverGradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  }
])

const ACTIVITIES_KEY = 'phototool_activities_data'
const POSTS_STORAGE_KEY = 'phototool_posts_data'
const USER_POSTS_KEY = 'phototool_user_posts'
const activitiesVersion = ref(0)

const loadAdminActivities = () => {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

// 从 localStorage 读取帖子数据，筛选活动帖子
const loadPostActivities = () => {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY)
    const userPostsRaw = localStorage.getItem(USER_POSTS_KEY)
    let allPosts = []
    if (raw) {
      const backendPosts = JSON.parse(raw)
      allPosts = [...allPosts, ...backendPosts.filter(p => p.status === 'published')]
    }
    if (userPostsRaw) {
      allPosts = [...allPosts, ...JSON.parse(userPostsRaw)]
    }
    // 筛选 activity_zone 分类且已通过审核的帖子
    return allPosts
      .filter(p => p.category === 'activity_zone' && p.isHidden === false)
      .map(p => ({
        ...p,
        description: p.description || p.excerpt || p.content?.substring(0, 100) || p.title,
        type: p.activityPlacement === 'brand' ? '品牌活动' : '活动',
        status: 'ongoing',
        participants: p.participants || p.commentCount || 0,
        coverGradient: p.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        _fromPost: true,
      }))
  } catch {
    return []
  }
}

const allActivities = computed(() => {
  activitiesVersion.value // 响应式依赖
  const adminActivities = loadAdminActivities()
  const postActivities = loadPostActivities()
  // 合并：帖子活动优先，然后是后台管理活动，最后是静态活动
  const staticIds = new Set([...adminActivities.map(a => a.id), ...postActivities.map(a => a.id)])
  const uniqueStatic = staticActivities.value.filter(a => !staticIds.has(a.id))
  return [...postActivities, ...adminActivities, ...uniqueStatic]
})

const filteredActivities = computed(() => {
  let filtered = activeTab.value === 'all' ? [...allActivities.value] : allActivities.value.filter(a => {
    const typeMap = {
      challenge: '摄影赛',
      workshop: '线下活动',
      online: '线上活动',
      contest: '有奖征集'
    }
    return a.type === typeMap[activeTab.value]
  })

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    )
  }

  return filtered
})

const getStatusLabel = (status) => {
  const map = { ongoing: '进行中', upcoming: '即将开始', ended: '已结束' }
  return map[status] || '进行中'
}

const formatTime = (time) => {
  if (!time) return ''
  const diff = Date.now() - new Date(time).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(time).toLocaleDateString()
}

const renderContent = (content) => {
  if (!content) return ''
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n/gim, '<br>')
}

const openActivityDetail = (activity) => {
  if (!requireLogin('登录后即可查看详情')) return
  currentActivity.value = activity
  showDetail.value = true
}

const likeActivity = () => {
  if (currentActivity.value) {
    currentActivity.value.likeCount = (currentActivity.value.likeCount || 0) + 1
  }
}

const collectActivity = () => {
  if (!requireLogin('登录后即可收藏')) return
  if (currentActivity.value) {
    currentActivity.value.collectCount = (currentActivity.value.collectCount || 0) + 1
  }
}

const submitComment = () => {
  if (!commentText.value.trim()) return
  if (!currentActivity.value) return
  currentActivity.value.commentCount = (currentActivity.value.commentCount || 0) + 1
  const commentList = currentActivity.value._comments ||= []
  commentList.push({
    id: Date.now(),
    author: userStore.user?.nickname || '匿名用户',
    avatar: userStore.user?.avatar || '👤',
    content: commentText.value,
    time: '刚刚'
  })
  commentText.value = ''
  userStore.addPoints(2)
}

const joinedActivities = ref([])
const joinActivity = (activity) => {
  if (!requireLogin('登录后即可报名')) return
  if (!joinedActivities.value.includes(activity.id)) {
    joinedActivities.value.push(activity.id)
    alert(`已报名「${activity.title}」`)
  }
}

const notifyActivity = (activity) => {
  if (!requireLogin('登录后即可设置提醒')) return
  alert(`已设置提醒：${activity.title}`)
}

onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === ACTIVITIES_KEY || e.key === POSTS_STORAGE_KEY || e.key === USER_POSTS_KEY) {
      activitiesVersion.value++
    }
  })
  setInterval(() => { activitiesVersion.value++ }, 5000)
})
</script>

<style scoped>
.activities-page {
  padding: 32px;
  color: var(--text-primary);
  min-height: 100%;
  position: relative;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.activities-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.inline-search {
  width: 100%;
  max-width: 220px;
}
.inline-search input {
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
.inline-search input:hover {
  border: 2px solid lightgrey;
  box-shadow: 0px 0px 20px -17px;
}
.inline-search input:active {
  transform: scale(0.95);
}
.inline-search input:focus {
  border: 2px solid grey;
  background: rgba(255, 255, 255, 0.1);
}
.inline-search input::placeholder {
  color: var(--text-muted);
}

.activities-tabs button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.activities-tabs button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.activities-tabs button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.activity-card {
  padding: 0 !important;
  overflow: hidden;
  cursor: pointer;
}

.activity-cover {
  height: 160px;
  position: relative;
}

.activity-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.activity-status.ongoing {
  background: rgba(72, 187, 120, 0.9);
  color: #fff;
}

.activity-status.upcoming {
  background: rgba(237, 137, 54, 0.9);
  color: #fff;
}

.activity-status.ended {
  background: rgba(128, 128, 128, 0.9);
  color: #fff;
}

.activity-content {
  padding: 20px;
}

.activity-type {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 12px;
}

.activity-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.activity-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.activity-rewards {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reward-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.reward-tag {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 12px;
}

.activity-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.join-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.join-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.notify-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
  border-radius: 10px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.ended-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 15px;
  cursor: not-allowed;
}

/* 未登录遮罩 */
.guest-content-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
  cursor: pointer;
  border-radius: 14px;
}

.guest-hint {
  background: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
}

/* 帖子详情弹窗 */
.post-detail {
  color: #000;
}

.detail-header {
  margin-bottom: 16px;
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

.author-info {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.avatar.large {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.detail-meta-bar {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
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
  border-top: 1px solid rgba(0, 0, 0, 0.1);
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
</style>
