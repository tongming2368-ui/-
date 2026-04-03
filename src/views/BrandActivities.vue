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
        @click="selectedBrand = brand.value; loadActivities()"
      >
        {{ brand.icon }} {{ brand.label }}
      </button>
    </div>

    <div class="activities-list">
      <div v-if="loading" class="loading-state">加载中...</div>
      <div v-else-if="activities.length === 0" class="empty-state">暂无活动</div>
      <GlassCard
        v-for="activity in activities"
        :key="activity.id"
        hoverable
        class="activity-item"
        @click="openDetail(activity)"
      >
        <div class="activity-brand-icon">{{ activity.brand_icon || '📸' }}</div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-brand">{{ activity.brand || '厂商' }}</span>
            <span class="activity-category">{{ activity.category || '品牌活动' }}</span>
          </div>
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-desc">{{ activity.description }}</p>
          <div class="activity-footer">
            <span class="activity-date">📅 {{ activity.event_date || '长期活动' }}</span>
            <span v-if="activity.link" class="activity-link">
              <a :href="activity.link" target="_blank" @click.stop>查看详情 →</a>
            </span>
          </div>
        </div>
        <div class="activity-highlight" v-if="activity.is_highlight">
          <span class="highlight-badge">热</span>
        </div>
      </GlassCard>
    </div>

    <!-- 详情弹窗 -->
    <Modal v-model="showDetail" :title="current?.title" width="900px">
      <div v-if="current" class="post-detail">
        <div v-if="current.event_date || current.location" class="detail-meta-bar">
          <span v-if="current.event_date">📅 {{ current.event_date }}</span>
          <span v-if="current.location">📍 {{ current.location }}</span>
        </div>
        <div class="detail-body" v-html="renderContent(current.content || current.description)"></div>
        <div class="detail-actions" v-if="current.link">
          <a :href="current.link" target="_blank" class="ext-link-btn">前往官网 →</a>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'

const selectedBrand = ref('all')
const activities = ref([])
const loading = ref(true)
const showDetail = ref(false)
const current = ref(null)

const brands = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'Sony', label: '索尼', icon: '📸' },
  { value: 'Canon', label: '佳能', icon: '📷' },
  { value: 'Nikon', label: '尼康', icon: '🎞️' },
  { value: 'Fujifilm', label: '富士', icon: '🌲' },
  { value: 'DJI', label: '大疆', icon: '🚁' },
  { value: 'Adobe', label: 'Adobe', icon: '🎨' }
]

const loadActivities = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (selectedBrand.value !== 'all') params.set('brand', selectedBrand.value)
    const res = await fetch(`/api/brand-activities?${params}`)
    const data = await res.json()
    activities.value = data.items || []
  } catch (e) {
    console.error('加载活动失败:', e)
  } finally {
    loading.value = false
  }
}

const renderContent = (content) => {
  if (!content) return ''
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n/gim, '<br>')
}

const openDetail = (activity) => {
  current.value = activity
  showDetail.value = true
}

onMounted(loadActivities)
</script>

<style scoped>
.brand-activities-page { padding: 32px; color: var(--text-primary); min-height: 100%; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 8px; }
.subtitle { color: var(--text-secondary); font-size: 14px; }
.loading-state, .empty-state { text-align: center; color: var(--text-secondary); padding: 60px 0; }
.brands-filter { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.brands-filter button { padding: 10px 20px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 25px; background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: all 0.2s; }
.brands-filter button.active, .brands-filter button:hover { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; color: #fff; }
.activities-list { display: flex; flex-direction: column; gap: 16px; }
.activity-item { display: flex; align-items: flex-start; gap: 20px; padding: 20px 24px !important; position: relative; cursor: pointer; }
.activity-brand-icon { font-size: 48px; flex-shrink: 0; }
.activity-content { flex: 1; }
.activity-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.activity-brand { font-size: 14px; font-weight: 600; color: #ffd700; }
.activity-category { padding: 3px 10px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; font-size: 12px; }
.activity-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.activity-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; }
.activity-footer { display: flex; justify-content: space-between; align-items: center; }
.activity-date { font-size: 13px; color: var(--text-secondary); }
.activity-link a { color: #4facfe; text-decoration: none; font-size: 14px; }
.activity-highlight { position: absolute; top: 16px; right: 16px; }
.highlight-badge { display: inline-block; padding: 4px 10px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 10px; font-size: 12px; font-weight: 600; color: #fff; }
.post-detail { color: #000; }
.detail-meta-bar { display: flex; gap: 20px; padding: 12px 16px; background: rgba(0, 0, 0, 0.04); border-radius: 10px; margin-bottom: 16px; font-size: 14px; color: #555; }
.detail-body { line-height: 1.8; font-size: 15px; color: #111; }
.detail-actions { margin-top: 20px; }
.ext-link-btn { display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border-radius: 10px; text-decoration: none; font-size: 14px; }
</style>
