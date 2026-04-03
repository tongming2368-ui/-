<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="bottom-section">
      <div class="activity-card glass-dark">
        <h3>数据一览</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="overview-icon">🎞️</span>
            <span class="overview-label">调色预设</span>
            <span class="overview-value">{{ presetCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-icon">📖</span>
            <span class="overview-label">教程数量</span>
            <span class="overview-value">{{ tutorialCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-icon">🎯</span>
            <span class="overview-label">活动数量</span>
            <span class="overview-value">{{ activityCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-icon">🐑</span>
            <span class="overview-label">优惠信息</span>
            <span class="overview-value">{{ dealCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-icon">🔗</span>
            <span class="overview-label">友情链接</span>
            <span class="overview-value">{{ linkCount }}</span>
          </div>
          <div class="overview-item">
            <span class="overview-icon">📢</span>
            <span class="overview-label">公告通知</span>
            <span class="overview-value">{{ announcementCount }}</span>
          </div>
        </div>
      </div>

      <div class="quick-stats glass-dark">
        <h3>快速入口</h3>
        <div class="quick-links">
          <router-link to="/admin/users" class="quick-link">👥 用户管理</router-link>
          <router-link to="/admin/posts" class="quick-link">📝 帖子管理</router-link>
          <router-link to="/admin/equipment" class="quick-link">📷 器材管理</router-link>
          <router-link to="/admin/showcase" class="quick-link">🖼️ 美图管理</router-link>
          <router-link to="/admin/activities" class="quick-link">🎯 活动管理</router-link>
          <router-link to="/admin/settings" class="quick-link">⚙️ 系统设置</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard } from '@/api/content'

const dashboardData = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await getDashboard()
    dashboardData.value = data
  } catch (e) {
    console.error('Failed to load dashboard:', e)
  }
  loading.value = false
})

const stats = computed(() => {
  if (!dashboardData.value) {
    return [
      { icon: '👤', label: '注册用户', value: '...' },
      { icon: '📝', label: '帖子数量', value: '...' },
      { icon: '📷', label: '器材数量', value: '...' },
      { icon: '🖼️', label: '美图数量', value: '...' },
      { icon: '🔧', label: '工具数量', value: '...' },
      { icon: '📢', label: '公告数量', value: '...' },
    ]
  }
  const d = dashboardData.value
  return [
    { icon: '👤', label: '注册用户', value: String(d.users) },
    { icon: '📝', label: '帖子数量', value: String(d.posts) },
    { icon: '📷', label: '器材数量', value: String(d.equipment) },
    { icon: '🖼️', label: '美图数量', value: String(d.showcase) },
    { icon: '🔧', label: '工具数量', value: String(d.tools) },
    { icon: '📢', label: '公告数量', value: String(d.announcements) },
  ]
})

const presetCount = computed(() => dashboardData.value?.presets || 0)
const tutorialCount = computed(() => dashboardData.value?.tutorials || 0)
const activityCount = computed(() => dashboardData.value?.activities || 0)
const dealCount = computed(() => dashboardData.value?.deals || 0)
const linkCount = computed(() => dashboardData.value?.links || 0)
const announcementCount = computed(() => dashboardData.value?.announcements || 0)
</script>

<style scoped>

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(94, 129, 244, 0.3);
  box-shadow: 0 4px 20px rgba(94, 129, 244, 0.1);
}

.stat-icon {
  font-size: 36px;
  background: rgba(94, 129, 244, 0.1);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  color: #333;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  color: #6b7280;
  font-size: 13px;
  margin-top: 2px;
}

.stat-trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
}

.stat-trend.up {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.stat-trend.down {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

.bottom-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
}

.glass-dark {
  background: #fff;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px;
}

.glass-dark h3 {
  color: #333;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #fff;
}

.activity-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #6b7280;
  font-size: 14px;
}

.activity-time {
  color: #6b7280;
  font-size: 12px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.overview-icon {
  font-size: 20px;
}

.overview-label {
  color: #6b7280;
  font-size: 13px;
  flex: 1;
}

.overview-value {
  color: #333;
  font-size: 20px;
  font-weight: 700;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-link {
  display: block;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.quick-link:hover {
  background: rgba(94, 129, 244, 0.1);
  color: #5e81f4;
}

.overview-value.online {
  color: #4ade80;
}

.overview-value.warning {
  color: #fbbf24;
}

.overview-value.success {
  color: #4ade80;
}

</style>
