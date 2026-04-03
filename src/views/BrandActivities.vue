<template>
  <div class="brand-activities-page">
    <div class="page-header">
      <h1>🏢 厂商活动</h1>
      <p class="subtitle">各大相机厂商官方活动与新品发布</p>
    </div>

    <div class="brands-filter">
      <button
        v-for="brand in brands"
        :key="brand.value"
        :class="{ active: selectedBrand === brand.value }"
        @click="selectedBrand = brand.value"
      >
        {{ brand.icon }} {{ brand.label }}
      </button>
    </div>

    <div class="activities-list">
      <GlassCard
        v-for="activity in filteredActivities"
        :key="activity.id"
        hoverable
        class="activity-item"
        @click="openActivityDetail(activity)"
      >
        <div class="activity-brand-icon">{{ activity.brandIcon || '📸' }}</div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-brand">{{ activity.brand || '厂商' }}</span>
            <span class="activity-category">{{ activity.category || '品牌活动' }}</span>
          </div>
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-desc">{{ activity.description || activity.excerpt }}</p>
          <div class="activity-footer">
            <span class="activity-date">📅 {{ activity.date || '长期活动' }}</span>
            <span v-if="activity.link" class="activity-link">
              <a :href="activity.link" target="_blank">查看详情 →</a>
            </span>
          </div>
        </div>
        <div class="activity-highlight" v-if="activity.isHighlight">
          <span class="highlight-badge">热</span>
        </div>
      </GlassCard>
    </div>

    <!-- 帖子详情弹窗 -->
    <Modal v-model="showDetail" :title="currentActivity?.title" width="900px">
      <div v-if="currentActivity" class="post-detail">
        <div class="detail-header">
          <div class="detail-author">
            <div class="avatar large">{{ currentActivity.authorAvatar || '📸' }}</div>
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
import { useAccessControl } from '@/composables/useAccessControl'
import { useUserStore } from '@/stores/user'

const { isLoggedIn, requireLogin } = useAccessControl()
const userStore = useUserStore()

const selectedBrand = ref('all')
const showDetail = ref(false)
const currentActivity = ref(null)
const commentText = ref('')

const brands = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'Sony', label: '索尼', icon: '📸' },
  { value: 'Canon', label: '佳能', icon: '📷' },
  { value: 'Nikon', label: '尼康', icon: '🎞️' },
  { value: 'Fujifilm', label: '富士', icon: '🌲' },
  { value: 'DJI', label: '大疆', icon: '🚁' },
  { value: 'Adobe', label: 'Adobe', icon: '🎨' }
]

const staticActivities = ref([
  {
    id: 1,
    title: 'Sony α-logo 全球摄影展',
    brand: 'Sony',
    brandIcon: '📸',
    category: '品牌活动',
    description: '索尼α系列相机用户作品全球巡展，征集优秀摄影作品。',
    date: '2024.01.15 - 2024.03.01',
    link: 'https://www.sony.com',
    isHighlight: true
  },
  {
    id: 2,
    title: 'Canon EOS R5 Mark II 新品体验会',
    brand: 'Canon',
    brandIcon: '📷',
    category: '新品体验',
    description: '佳能新品R5 Mark II线下体验会，现场感受最新旗舰相机。',
    date: '2024.02.01 - 2024.02.28',
    link: 'https://www.canon.com.cn',
    isHighlight: true
  },
  {
    id: 3,
    title: 'Nikon Z9 firmware 3.0 升级发布',
    brand: 'Nikon',
    brandIcon: '🎞️',
    category: '固件更新',
    description: '尼康Z9迎来重大固件更新，带来全新对焦性能和视频功能。',
    date: '2024.01.20',
    link: 'https://www.nikon.com.cn'
  },
  {
    id: 4,
    title: 'Fujifilm X Summit 2024 峰会',
    brand: 'Fujifilm',
    brandIcon: '🌲',
    category: '行业峰会',
    description: '富士X Summit年度峰会，发布新一代X系列相机和镜头。',
    date: '2024.02.08',
    link: 'https://www.fujifilm.com.cn',
    isHighlight: true
  },
  {
    id: 5,
    title: 'DJI Mavic 3 Pro 新品发布会',
    brand: 'DJI',
    brandIcon: '🚁',
    category: '新品发布',
    description: '大疆新一代航拍无人机发布，影像性能再创新高。',
    date: '2024.04.25',
    link: 'https://www.dji.com'
  },
  {
    id: 6,
    title: 'Adobe MAX 创意大会',
    brand: 'Adobe',
    brandIcon: '🎨',
    category: '行业大会',
    description: 'Adobe MAX年度创意大会，展示最新AI图像处理技术。',
    date: '2024.10.15 - 2024.10.17',
    link: 'https://www.adobe.com'
  },
  {
    id: 7,
    title: 'Sony Imaging PRO 体验计划',
    brand: 'Sony',
    brandIcon: '📸',
    category: '租赁体验',
    description: '索尼专业影像设备租赁体验计划，专业摄影师可申请免费体验。',
    date: '长期活动',
    link: 'https://www.sony.com'
  },
  {
    id: 8,
    title: 'Canon 镜头免费清洁月',
    brand: 'Canon',
    brandIcon: '📷',
    category: '售后服务',
    description: '佳能官方镜头免费清洁服务月活动，持佳能镜头即可参与。',
    date: '2024.03.01 - 2024.03.31',
    link: 'https://www.canon.com.cn'
  }
])

const POSTS_STORAGE_KEY = 'phototool_posts_data'
const USER_POSTS_KEY = 'phototool_user_posts'
const dataVersion = ref(0)

// 从 localStorage 读取帖子数据，筛选品牌活动帖子
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
    // 筛选 activity_zone 分类、已通过审核、且放置位置为 brand 的帖子
    return allPosts
      .filter(p => p.category === 'activity_zone' && p.isHidden === false && p.activityPlacement === 'brand')
      .map(p => ({
        ...p,
        description: p.description || p.excerpt || p.content?.substring(0, 100) || p.title,
        brand: p.brand || '厂商',
        brandIcon: p.brandIcon || '📸',
        category: '品牌活动',
        link: p.link || '',
        _fromPost: true,
      }))
  } catch {
    return []
  }
}

const allActivities = computed(() => {
  dataVersion.value // 响应式依赖
  const postActivities = loadPostActivities()
  // 合并帖子活动与静态活动
  const postIds = new Set(postActivities.map(a => a.id))
  const uniqueStatic = staticActivities.value.filter(a => !postIds.has(a.id))
  return [...postActivities, ...uniqueStatic]
})

const filteredActivities = computed(() => {
  let result = allActivities.value
  if (selectedBrand.value !== 'all') {
    result = result.filter(a => a.brand === selectedBrand.value)
  }
  return result
})

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

onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === POSTS_STORAGE_KEY || e.key === USER_POSTS_KEY) {
      dataVersion.value++
    }
  })
  setInterval(() => { dataVersion.value++ }, 5000)
})
</script>

<style scoped>
.brand-activities-page {
  padding: 32px;
  color: var(--text-primary);
  min-height: 100%;
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

.brands-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.brands-filter button {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.brands-filter button.active,
.brands-filter button:hover {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px 24px !important;
  position: relative;
  cursor: pointer;
}

.activity-brand-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.activity-brand {
  font-size: 14px;
  font-weight: 600;
  color: #ffd700;
}

.activity-category {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 12px;
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
  margin-bottom: 12px;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.activity-link a {
  color: #4facfe;
  text-decoration: none;
  font-size: 14px;
}

.activity-highlight {
  position: absolute;
  top: 16px;
  right: 16px;
}

.highlight-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
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
