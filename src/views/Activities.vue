<template>
  <div class="activities-page">
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="page-header">
      <h1>🎯 活动专区</h1>
      <p class="subtitle">精彩摄影活动，等你来参与</p>
    </div>

    <div class="activities-tabs">
      <button v-for="tab in tabs" :key="tab.value" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
        {{ tab.icon }} {{ tab.label }}
      </button>
      <div class="search-bar inline-search">
        <input v-model="searchQuery" placeholder="🔍 搜索活动..." />
      </div>
    </div>

    <div class="activities-grid">
      <div v-if="loading" class="loading-state">加载中...</div>
      <div v-else-if="filteredActivities.length === 0" class="empty-state">暂无活动</div>
      <GlassCard v-for="activity in filteredActivities" :key="activity.id" hoverable class="activity-card" @click="openDetail(activity)">
        <div class="activity-cover" :style="{ background: activity.cover_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }">
          <span class="activity-status" :class="activity.status">{{ getStatusLabel(activity.status) }}</span>
        </div>
        <div class="activity-content">
          <div class="activity-type">{{ activity.type || '活动' }}</div>
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-desc">{{ activity.description }}</p>
          <div class="activity-meta">
            <span class="meta-item">📅 {{ activity.event_date || '长期活动' }}</span>
            <span class="meta-item" v-if="activity.participants">👥 {{ activity.participants }}人参与</span>
            <span class="meta-item" v-if="activity.location">📍 {{ activity.location }}</span>
          </div>
        </div>
        <div class="activity-footer">
          <button v-if="activity.status === 'ongoing'" class="join-btn" @click.stop="joinActivity(activity)">立即报名</button>
          <button v-else-if="activity.status === 'upcoming'" class="notify-btn" @click.stop>提醒我</button>
          <button v-else class="ended-btn">已结束</button>
        </div>
      </GlassCard>
    </div>

    <Modal v-model="showDetail" :title="current?.title" width="900px">
      <div v-if="current" class="post-detail">
        <div v-if="current.event_date || current.location" class="detail-meta-bar">
          <span v-if="current.event_date">📅 {{ current.event_date }}</span>
          <span v-if="current.location">📍 {{ current.location }}</span>
        </div>
        <div class="detail-body" v-html="renderContent(current.content || current.description)"></div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()

const activeTab = ref('all')
const searchQuery = ref('')
const activities = ref([])
const loading = ref(true)
const showDetail = ref(false)
const current = ref(null)

const tabs = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'ongoing', label: '进行中', icon: '🔥' },
  { value: 'upcoming', label: '即将开始', icon: '⏰' },
  { value: 'ended', label: '已结束', icon: '✅' },
]

const loadActivities = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/activities')
    const data = await res.json()
    activities.value = data.items || []
  } catch (e) { console.error(e) }
  loading.value = false
}

const filteredActivities = computed(() => {
  let result = activities.value
  if (activeTab.value !== 'all') result = result.filter(a => a.status === activeTab.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a => (a.title || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q))
  }
  return result
})

const getStatusLabel = (s) => ({ ongoing: '进行中', upcoming: '即将开始', ended: '已结束' }[s] || '进行中')
const renderContent = (c) => c ? c.replace(/^# (.*$)/gim, '<h1>$1</h1>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>').replace(/\n/gim, '<br>') : ''
const openDetail = (a) => { if (!requireLogin('登录后可查看详情')) return; current.value = a; showDetail.value = true }
const joinActivity = (a) => { if (!requireLogin('登录后可报名')) return; alert('报名成功！') }

onMounted(loadActivities)
</script>

<style scoped>
.activities-page { padding: 32px; color: var(--text-primary); min-height: 100%; }
.guest-content-mask { position: relative; z-index: 10; }
.guest-hint { text-align: center; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 20px; cursor: pointer; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 8px; }
.subtitle { color: var(--text-secondary); font-size: 14px; }
.loading-state, .empty-state { text-align: center; color: var(--text-secondary); padding: 60px 0; }
.activities-tabs { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
.activities-tabs button { padding: 10px 20px; border: 1px solid rgba(255,255,255,0.12); border-radius: 25px; background: rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: all 0.2s; }
.activities-tabs button.active, .activities-tabs button:hover { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; color: #fff; }
.inline-search { margin-left: auto; }
.inline-search input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 8px 16px; color: var(--text-primary); font-size: 14px; outline: none; width: 200px; }
.activities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.activity-card { padding: 0 !important; overflow: hidden; cursor: pointer; }
.activity-cover { height: 120px; position: relative; display: flex; align-items: flex-start; justify-content: flex-end; padding: 12px; }
.activity-status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.activity-status.ongoing { background: rgba(67,233,123,0.3); color: #43e97b; }
.activity-status.upcoming { background: rgba(102,126,234,0.3); color: #667eea; }
.activity-status.ended { background: rgba(150,150,150,0.3); color: #999; }
.activity-content { padding: 16px 20px; }
.activity-type { font-size: 12px; color: #ffd700; margin-bottom: 6px; }
.activity-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.activity-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; }
.activity-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); flex-wrap: wrap; }
.activity-footer { padding: 0 20px 16px; }
.join-btn, .notify-btn, .ended-btn { width: 100%; padding: 10px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.join-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.notify-btn { background: rgba(102,126,234,0.2); color: #667eea; }
.ended-btn { background: rgba(150,150,150,0.2); color: #999; cursor: default; }
.post-detail { color: #000; }
.detail-meta-bar { display: flex; gap: 20px; padding: 12px 16px; background: rgba(0,0,0,0.04); border-radius: 10px; margin-bottom: 16px; font-size: 14px; color: #555; }
.detail-body { line-height: 1.8; font-size: 15px; color: #111; }
</style>
