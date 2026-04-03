<template>
  <div class="announcements-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="page-header">
      <h1>📢 活动公告</h1>
      <p class="subtitle">摄影站务公告与活动通知</p>
    </div>

    <div class="announcements-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
      <div class="search-bar inline-search">
        <input v-model="searchQuery" placeholder="🔍 搜索公告..." />
      </div>
    </div>

    <div class="announcements-list">
      <GlassCard
        v-for="announcement in filteredAnnouncements"
        :key="announcement.id"
        hoverable
        class="announcement-item"
      >
        <div class="announcement-header">
          <span class="announcement-type" :class="announcement.type">{{ getTypeLabel(announcement.type) }}</span>
          <span class="announcement-date">{{ announcement.date }}</span>
        </div>
        <h3 class="announcement-title">{{ announcement.title }}</h3>
        <p class="announcement-content">{{ announcement.content }}</p>
        <div class="announcement-footer">
          <span class="author">✍️ {{ announcement.author }}</span>
          <span class="views">👁️ {{ announcement.views }}</span>
          <span v-if="announcement.comments" class="comments">💬 {{ announcement.comments }}</span>
        </div>
      </GlassCard>
    </div>

    <div v-if="filteredAnnouncements.length === 0" class="empty-state">
      <p>暂无公告</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'
import { getAdminList } from '@/api/content'

const { isLoggedIn, requireLogin } = useAccessControl()

const { getPageFilterOptions } = useFilterConfig()

const activeTab = ref('all')
const searchQuery = ref('')

const tabs = getPageFilterOptions('announcements', 'tab').length > 0
  ? getPageFilterOptions('announcements', 'tab').map(o => ({ value: o.value, label: o.label, icon: '' }))
  : [
      { value: 'all', label: '全部', icon: '📋' },
      { value: 'system', label: '系统公告', icon: '📢' },
      { value: 'activity', label: '活动通知', icon: '🎯' },
      { value: 'update', label: '更新日志', icon: '🔄' },
      { value: 'maintenance', label: '维护公告', icon: '🔧' }
    ]

const announcements = ref([
  {
    id: 1,
    title: '🎉 摄影之家 v2.0 版本正式发布！',
    content: '全新界面设计，新增幸运大转盘功能，器材库全面升级，更多精彩功能等你来发现！',
    type: 'system',
    date: '2024-01-28',
    author: '管理员',
    views: 8934,
    comments: 156,
    category: '系统公告'
  },
  {
    id: 2,
    title: '📢春节期间服务安排公告',
    content: '春节期间论坛服务正常运营，客服可能会有延迟响应，请各位摄影师理解。祝大家新春快乐！',
    type: 'system',
    date: '2024-02-09',
    author: '管理员',
    views: 3456,
    comments: 23,
    category: '系统公告'
  },
  {
    id: 3,
    title: '🎯 新年摄影大赛正式开启！',
    content: '2024年度摄影大赛已开启投稿，主题：新年·团圆。多重大奖等你来拿，奖金池总计超过5万元！',
    type: 'activity',
    date: '2024-01-25',
    author: '活动组',
    views: 12345,
    comments: 234,
    category: '活动通知'
  },
  {
    id: 4,
    title: '🔄 v2.1.0 版本更新日志',
    content: '1. 新增幸运大转盘抽奖功能\n2. 优化器材库筛选性能\n3. 修复部分已知问题\n4. 提升页面加载速度',
    type: 'update',
    date: '2024-02-01',
    author: '开发组',
    views: 5678,
    comments: 45,
    category: '更新日志'
  },
  {
    id: 5,
    title: '🔧 系统维护通知',
    content: '为了提供更好的服务，我们将于2024年2月15日凌晨2:00-4:00进行系统维护，届时部分功能可能无法访问，感谢理解。',
    type: 'maintenance',
    date: '2024-02-12',
    author: '运维组',
    views: 2345,
    comments: 12,
    category: '维护公告'
  },
  {
    id: 6,
    title: '🎁 积分商城上线公告',
    content: '积分商城正式上线！签到、发帖、互动均可获得积分，积分可兑换精美周边、器材优惠券等好礼。',
    type: 'system',
    date: '2024-01-20',
    author: '管理员',
    views: 7890,
    comments: 89,
    category: '系统公告'
  },
  {
    id: 7,
    title: '🏆 社区内容激励计划',
    content: '为鼓励优质内容创作，社区推出内容激励计划。优质教程、攻略、器材评测均可获得额外积分奖励。',
    type: 'activity',
    date: '2024-02-05',
    author: '活动组',
    views: 4567,
    comments: 67,
    category: '活动通知'
  }
])

const ANNOUNCEMENTS_KEY = 'phototool_announcements_data'
const announcementsVersion = ref(0)
const apiAnnouncements = ref([])

// 从 API 加载
const loadApiAnnouncements = async () => {
  try {
    const data = await getAdminList('announcements')
    apiAnnouncements.value = (data.items || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content || '',
      type: item.type || 'system',
      date: item.created_at?.slice(0, 10) || '',
      author: '管理员',
      views: item.view_count || 0,
      comments: 0,
      category: { system: '系统公告', activity: '活动通知', update: '更新日志', maintenance: '维护公告' }[item.type] || '系统公告'
    }))
    announcementsVersion.value++
  } catch (e) {
    console.error('Failed to load announcements:', e)
  }
}

const loadAdminAnnouncements = () => {
  try { const raw = localStorage.getItem(ANNOUNCEMENTS_KEY); if (raw) return JSON.parse(raw) } catch {}
  return []
}

onMounted(() => {
  loadApiAnnouncements()
})

const filteredAnnouncements = computed(() => {
  announcementsVersion.value // 响应式依赖
  const list = [...apiAnnouncements.value, ...loadAdminAnnouncements(), ...announcements.value]
  let filtered = activeTab.value === 'all' ? [...list] : list.filter(a => {
    const typeMap = { system: 'system', activity: 'activity', update: 'update', maintenance: 'maintenance' }
    return a.type === typeMap[activeTab.value]
  })

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.summary && a.summary.toLowerCase().includes(q))
    )
  }

  return filtered
})

const getTypeLabel = (type) => {
  const map = {
    system: '系统公告',
    activity: '活动通知',
    update: '更新日志',
    maintenance: '维护公告'
  }
  return map[type]
}
</script>

<style scoped>
.announcements-page {
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

.announcements-tabs {
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

.announcements-tabs button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.announcements-tabs button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.announcements-tabs button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  padding: 20px 24px !important;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.announcement-type {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.announcement-type.system {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.announcement-type.activity {
  background: rgba(237, 100, 166, 0.2);
  color: #ed64a6;
}

.announcement-type.update {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.announcement-type.maintenance {
  background: rgba(237, 137, 54, 0.2);
  color: #ed8936;
}

.announcement-date {
  font-size: 13px;
  color: var(--text-muted);
}

.announcement-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.announcement-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-line;
  margin-bottom: 16px;
}

.announcement-footer {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  font-size: 16px;
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
</style>if (typeof window !== 'undefined') {
  onMounted(() => {
      })
}
