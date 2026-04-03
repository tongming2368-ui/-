<template>
  <div class="presets-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="showcase-header">
      <h1>🎨 调色预设</h1>
      <p class="showcase-subtitle">一键调色，让你的照片与众不同</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filters">
      <div class="filter-group">
        <div class="filter-buttons">
          <button
            v-for="style in styles"
            :key="style.id"
            :class="{ active: activeStyle === style.id }"
            @click="activeStyle = style.id"
          >
            {{ style.icon }} {{ style.name }}
          </button>
        </div>
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索预设名称/标签..." />
        </div>
      </div>
    </div>

    <!-- 瀑布流 -->
    <div class="masonry-container">
      <div class="masonry-grid">
        <div
          v-for="preset in filteredPresets"
          :key="preset.id"
          class="masonry-card"
          @mousemove="handleTiltMove($event, preset.id)"
          @mouseleave="handleTiltLeave(preset.id)"
          :ref="el => { if (el) cardRefs[preset.id] = el }"
        >
          <div class="card-image-wrapper" :class="getAspectClass(preset)" @click="openPreset(preset)">
            <div class="color-strip" :style="{ background: preset.gradient }"></div>
            <div class="card-overlay">
              <span class="overlay-action">查看详情</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">{{ preset.name }}</h3>
            </div>
            <div class="preset-meta">
              <span class="preset-style-badge">{{ preset.styleLabel }}</span>
              <span class="preset-downloads">⬇ {{ formatDownloads(preset.downloads) }}</span>
            </div>
            <div class="preset-tags">
              <span v-for="tag in preset.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredPresets.length === 0" class="empty-state">
      <p>😔 没有找到匹配的预设</p>
    </div>

    <!-- 预设详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail && currentPreset" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-content preset-detail">
          <div class="preset-preview" :style="{ background: currentPreset.gradient }"></div>
          <h2>{{ currentPreset.name }}</h2>
          <div class="preset-meta-detail">
            <span class="preset-style-badge">{{ currentPreset.styleLabel }}</span>
            <span>⬇ {{ formatDownloads(currentPreset.downloads) }} 次下载</span>
          </div>
          <p class="preset-desc">{{ currentPreset.description }}</p>
          <div class="preset-tags-detail">
            <span v-for="tag in currentPreset.tags" :key="tag">#{{ tag }}</span>
          </div>
          <div class="preset-actions">
            <button class="download-btn" @click="downloadPreset(currentPreset)">⬇ 下载预设</button>
            <button class="close-btn" @click="showDetail = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'
import { getPresets as apiGetPresets } from '@/api/content'

const { isLoggedIn, requireLogin } = useAccessControl()

const { getPageFilterOptions } = useFilterConfig()

const activeStyle = ref('all')
const searchQuery = ref('')

const styles = ref(getPageFilterOptions('presets', 'style').length > 0
  ? getPageFilterOptions('presets', 'style').map(o => ({ id: o.value, name: o.label }))
  : [
      { id: 'all', name: '全部', icon: '🌈' },
      { id: 'japanese', name: '日系', icon: '🗾' },
      { id: 'film', name: '胶片', icon: '🎞️' },
      { id: 'cyber', name: '赛博', icon: '🌃' },
      { id: 'vintage', name: '复古', icon: '📻' },
      { id: 'fresh', name: '清新', icon: '🌿' },
      { id: 'bw', name: '黑白', icon: '⬛' },
    ]
)

const presets = ref([
  {
    id: 1,
    name: '北海道の夏',
    description: '清新淡雅的日系风格，低饱和度配合偏高亮画面，适合人像和风景',
    gradient: 'linear-gradient(90deg, #e6e9f0 0%, #eef1f5 25%, #d4e4ed 50%, #c5dff0 75%, #b8cce3 100%)',
    style: 'japanese',
    styleLabel: '日系',
    scenes: '人像/风景',
    downloads: 8923,
    tags: ['人像', '风景', '夏日'],
  },
  {
    id: 2,
    name: 'Kodak Gold 200',
    description: '经典 Kodak 金胶片质感，温暖的色调加上柔和的颗粒，极具复古感',
    gradient: 'linear-gradient(90deg, #f5e6c8 0%, #f0d9a3 25%, #e8c46a 50%, #d4a84b 75%, #c99542 100%)',
    style: 'film',
    styleLabel: '胶片',
    scenes: '人像/街拍',
    downloads: 12456,
    tags: ['胶片', '复古', '暖色'],
  },
  {
    id: 3,
    name: '赛博霓虹',
    description: '高对比度冷色调，暗部偏青高光偏紫，营造未来科技感',
    gradient: 'linear-gradient(90deg, #0f0c29 0%, #302b63 33%, #24243e 66%, #1a1a2e 100%)',
    style: 'cyber',
    styleLabel: '赛博',
    scenes: '夜景/都市',
    downloads: 6734,
    tags: ['夜景', '科技', '冷色'],
  },
  {
    id: 4,
    name: '80s VHS',
    description: '80年代录像带风格，色彩偏移、噪点和扫描线，怀旧氛围拉满',
    gradient: 'linear-gradient(90deg, #ff9a9e 0%, #fecfef 25%, #a18cd1 50%, #fbc2eb 75%, #8fd3f4 100%)',
    style: 'vintage',
    styleLabel: '复古',
    scenes: '人像/怀旧',
    downloads: 9823,
    tags: ['VHS', '怀旧', '80s'],
  },
  {
    id: 5,
    name: '森系氧气',
    description: '清新的绿色系调色，模拟森林中的氧气感，适合春夏外景',
    gradient: 'linear-gradient(90deg, #d4fc79 0%, #96e6a1 25%, #84d5a3 50%, #6bcfaf 75%, #4fd1c5 100%)',
    style: 'fresh',
    styleLabel: '清新',
    scenes: '人像/风景',
    downloads: 10234,
    tags: ['森林', '绿色', '氧气'],
  },
  {
    id: 6,
    name: '传奇黑白',
    description: '经典黑白美学，反差适中灰阶丰富，让照片讲述故事',
    gradient: 'linear-gradient(90deg, #000000 0%, #333333 25%, #666666 50%, #999999 75%, #cccccc 100%)',
    style: 'bw',
    styleLabel: '黑白',
    scenes: '人像/街拍',
    downloads: 8234,
    tags: ['黑白', '经典', '人像'],
  },
  {
    id: 7,
    name: '昭和写真',
    description: '日本昭和时代的写真风格，柔光效果搭配柔和色彩',
    gradient: 'linear-gradient(90deg, #fff1eb 0%, #ace0f9 50%, #d4f1f9 100%)',
    style: 'film',
    styleLabel: '胶片',
    scenes: '人像/日常',
    downloads: 7456,
    tags: ['昭和', '柔光', '日常'],
  },
  {
    id: 8,
    name: '暗黑特警',
    description: '暗调电影感风格，神秘而酷感十足，适合情绪人像',
    gradient: 'linear-gradient(90deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    style: 'cyber',
    styleLabel: '赛博',
    scenes: '人像/夜景',
    downloads: 5678,
    tags: ['暗调', '电影感', '情绪'],
  },
])

const PRESETS_KEY = 'phototool_presets_data'
const presetsVersion = ref(0)
const apiPresetsData = ref([])

// 从 API 加载
const loadApiPresets = async () => {
  try {
    const data = await apiGetPresets({ limit: 100 })
    apiPresetsData.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      name: item.title,
      description: item.description || '',
      gradient: item.cover_image || 'linear-gradient(135deg, #667eea, #764ba2)',
      style: item.category || 'all',
      styleLabel: item.category || '其他',
      scenes: '',
      downloads: item.download_count || 0,
      tags: item.tags || [],
    }))
    presetsVersion.value++
  } catch (e) {
    console.error('Failed to load presets:', e)
  }
}

const loadAdminPresets = () => {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const filteredPresets = computed(() => {
  presetsVersion.value // 响应式依赖
  const adminPresets = loadAdminPresets()
  let list = [...apiPresetsData.value, ...adminPresets, ...presets.value]

  if (activeStyle.value !== 'all') {
    list = list.filter(p => p.style === activeStyle.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  return list
})

const cardRefs = ref({})

const handleTiltMove = (e, id) => {
  const el = cardRefs.value[id]
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -8
  const rotateY = ((x - centerX) / centerX) * 8
  el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`
  el.style.transition = 'transform 0.1s ease-out'
}

const handleTiltLeave = (id) => {
  const el = cardRefs.value[id]
  if (!el) return
  el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)'
  el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}

const aspectClasses = ['aspect-34', 'aspect-23', 'aspect-169', 'aspect-43', 'aspect-11']
const getAspectClass = (preset) => aspectClasses[preset.id % aspectClasses.length]

const formatDownloads = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

const showDetail = ref(false)
const currentPreset = ref(null)

const openPreset = (preset) => {
  currentPreset.value = preset
  showDetail.value = true
}

const downloadPreset = (preset) => {
  alert(`正在下载预设：${preset.name}`)
  preset.downloads++
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      const idx = list.findIndex(p => p.id === preset.id)
      if (idx > -1) { list[idx].downloads = preset.downloads }
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list))
    }
  } catch {}
}
</script>

<style scoped>
.presets-page {
  padding: 24px;
  color: var(--text-primary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.showcase-header {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.showcase-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.showcase-subtitle {
  font-size: 14px;
  color: var(--inactive-color);
}

/* 筛选栏 */
.filters {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-buttons button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-buttons button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.filter-buttons button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.search-bar {
  width: 100%;
  max-width: 220px;
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
}.search-bar input:hover {
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
}

.search-bar input:focus {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

/* 瀑布流容器 - 横向滚动 */
.masonry-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 16px 16px;
}

.masonry-grid {
  display: flex;
  gap: 14px;
  height: 100%;
  align-items: flex-start;
}

/* 卡片 */
.masonry-card {
  flex-shrink: 0;
  width: 180px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.35s ease, border-color 0.35s ease;
  will-change: transform;
  position: relative;
}

.masonry-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.masonry-card:hover {
  box-shadow: 0 0 25px 2px rgba(255, 255, 255, 0.12), 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.35);
}

/* 图片区域 */
.card-image-wrapper {
  position: relative;
  overflow: hidden;
}

.aspect-34 { aspect-ratio: 3 / 4; }
.aspect-23 { aspect-ratio: 2 / 3; }
.aspect-169 { aspect-ratio: 16 / 9; }
.aspect-43 { aspect-ratio: 4 / 3; }
.aspect-11 { aspect-ratio: 1 / 1; }

.color-strip {
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.masonry-card:hover .color-strip {
  transform: scale(1.08);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
  opacity: 0;
  transition: opacity 0.35s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
}

.masonry-card:hover .card-overlay {
  opacity: 1;
}

.overlay-action {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateY(8px);
  transition: transform 0.35s ease;
}

.masonry-card:hover .overlay-action {
  transform: translateY(0);
}

/* 卡片内容 */
.card-body {
  padding: 10px 12px;
}

.card-title-row {
  margin-bottom: 6px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.preset-style-badge {
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.preset-downloads {
  font-size: 11px;
  color: var(--text-muted);
}

.preset-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 10px;
  color: var(--text-secondary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--inactive-color);
  font-size: 15px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content.preset-detail {
  background: rgba(20,20,30,0.95);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 0;
  max-width: 420px;
  width: 90%;
  overflow: hidden;
  color: #f0f2f8;
}

.preset-preview {
  width: 100%;
  height: 120px;
}

.modal-content.preset-detail h2 {
  font-size: 20px;
  margin: 20px 24px 12px;
}

.preset-meta-detail {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin: 0 24px 16px;
}

.preset-desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.7);
  margin: 0 24px 16px;
}

.preset-tags-detail {
  display: flex;
  gap: 8px;
  margin: 0 24px 24px;
  color: #5e81f4;
  font-size: 13px;
}

.preset-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}

.download-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.close-btn {
  padding: 12px 24px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  background: transparent;
  color: #f0f2f8;
  font-size: 14px;
  cursor: pointer;
}
</style>
onMounted(() => {
  loadApiPresets()
})
