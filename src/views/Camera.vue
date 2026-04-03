<template>
  <div class="camera-page">
    <!-- 调试信息 -->

    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>

    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <h2>📷 器材库</h2>
      <div class="filter-row">
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索名称/品牌..." />
        </div>
        <div class="filter-group">
          <span class="filter-label">分类</span>
          <div class="filter-pills">
            <button
              v-for="c in categoryOptions"
              :key="c.value"
              :class="{ active: selectedCategory === c.value }"
              @click="selectedCategory = c.value"
            >{{ c.icon }} {{ c.label }}</button>
          </div>
        </div>
        <div v-if="selectedCategory === 'camera'" class="filter-group">
          <span class="filter-label">画幅</span>
          <div class="filter-pills">
            <button
              v-for="s in dynamicSensorOptions"
              :key="s.value"
              :class="{ active: selectedSensor === s.value }"
              @click="selectedSensor = s.value"
            >{{ s.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">品牌</span>
          <div class="filter-pills">
            <button
              v-for="b in currentBrandOptions"
              :key="b.value"
              :class="{ active: selectedBrand === b.value }"
              @click="selectedBrand = b.value"
            >{{ b.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">排序</span>
          <div class="filter-pills">
            <button
              v-for="s in sortOptions"
              :key="s.value"
              :class="{ active: currentSort === s.value }"
              @click="currentSort = s.value"
            >{{ s.label }}</button>
          </div>
        </div>
      </div>
      <div class="result-count">
      共 {{ filteredItems.length }} 件器材
    </div>
    </div>

    <!-- 卡片网格 -->
    <div class="card-grid">
      <GlassCard
        v-for="item in filteredItems"
        :key="item.id"
        hoverable
        class="camera-card"
        @click="openDetail(item)"
      >
        <div class="card-image">
          <img :src="item.image" :alt="item.name" />
          <span class="card-brand-logo">{{ item.brandLogo }}</span>
        </div>
        <div class="card-body">
          <div class="card-brand">{{ item.brand }} · {{ item.category || item.sensor }}</div>
          <h3 class="card-name">{{ item.name }}</h3>
          <div class="card-pills">
            <span v-for="(val, key) in getDisplaySpecs(item)" :key="key" class="pill">{{ key }}: {{ val }}</span>
          </div>
          <div class="card-footer">
            <span class="card-price">¥{{ item.price?.toLocaleString() }}</span>
            <span class="card-rating">⭐ {{ item.rating }} ({{ item.ratingCount }})</span>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredItems.length === 0" class="empty-state">
      <p>没有找到符合条件的器材</p>
    </div>

    <!-- 详情弹窗 -->
    <DetailModal v-model="showDetail" :item="currentItem" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import DetailModal from '@/components/common/DetailModal.vue'
import { useAccessControl } from '@/composables/useAccessControl'
import { loadEquipmentConfig, EQUIPMENT_CONFIG_KEY } from '@/config/equipmentConfig'

const { isLoggedIn, requireLogin } = useAccessControl()
import { cameras as defaultCameras, tripods as defaultTripods, lights as defaultLights, audio as defaultAudio, accessories as defaultAccessories, sortOptions } from '@/config/equipment.js'

// 从配置读取品牌和画幅选项
const equipConfig = ref(loadEquipmentConfig())
const dynamicBrandOptions = computed(() => {
  const list = equipConfig.value.brands || []
  return [{ value: 'all', label: '全部品牌' }, ...list.map(b => ({ value: b.value, label: b.label })), { value: 'other', label: '其他' }]
})
const dynamicSensorOptions = computed(() => {
  const list = equipConfig.value.sensors || []
  return [{ value: 'all', label: '全部画幅' }, ...list.map(s => ({ value: s.value, label: s.label })), { value: 'other', label: '其他' }]
})

const selectedCategory = ref('camera')
const selectedBrand = ref('all')
const selectedSensor = ref('all')
const currentSort = ref('default')
const searchQuery = ref('')
const showDetail = ref(false)
const currentItem = ref(null)

// 后台数据存储key（与 EquipmentManage 一致）
const STORAGE_KEY = 'phototool_equipment_data'

// 后台类目 → 前台类目映射
const categoryMapping = {
  camera: 'camera',
  lens: 'accessory',   // 镜头归到配件（前台没有单独镜头分类）
  tripod: 'tripod',
  audio: 'audio',
  light: 'light',
  accessory: 'accessory',
  film: 'accessory',   // 胶片也归到配件
  wetplate: 'accessory',
  other: 'accessory',
}

// 将后台数据转换为前台格式
const transformBackendItem = (item, category) => {
  // 从 params 提取 specs
  const specs = {}
  if (item.params) {
    item.params.forEach(p => {
      if (p.label && p.value) specs[p.label] = p.value
    })
  }

  // 提取关键字段
  const sensor = specs['画幅'] || specs['类型'] || category
  const pixels = specs['有效像素'] || specs['像素'] || ''
  const videoFormat = specs['视频规格'] || ''
  const focalLength = specs['焦距'] || ''
  const aperture = specs['最大光圈'] || ''
  const mount = specs['卡口'] || ''

  return {
    id: `backend_${item.id}`,
    name: item.name,
    brand: item.brand || '未知',
    brandLogo: item.logo || getDefaultBrandLogo(item.brand),
    sensor,
    pixels,
    videoFormat,
    focalLength,
    aperture,
    mount,
    category: specs['类型'] || getCategoryLabel(category),
    price: item.price || 0,
    releaseDate: specs['发布日期'] || specs['发布时间'] || '2024-01-01',
    image: `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(item.name)}`,
    followers: 0,
    rating: 0,
    ratingCount: 0,
    description: '',
    specs,
    _isBackend: true,
    _overrideFor: item._overrideFor || null,
    _source: item._source || null,
  }
}

const getDefaultBrandLogo = (brand) => {
  const logos = { Sony: '📸', Canon: '📷', Nikon: '🎞️', Fujifilm: '🌲', Panasonic: '🎬', Godox: '💡', Aputure: '🎥', Rode: '🎙️', DJI: '📡' }
  return logos[brand] || '📷'
}

const getCategoryLabel = (cat) => {
  const labels = { camera: '相机', tripod: '三脚架', audio: '音频', light: '灯光', accessory: '配件' }
  return labels[cat] || cat
}

// 从 localStorage 读取后台数据
const loadBackendData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// 合并后台数据与硬编码数据
const buildMergedData = () => {
  const backend = loadBackendData()
  const deletedIds = backend._deleted || []
  const result = {}

  // camera: 后台 camera 类目 → 前台 camera
  const backendCameras = (backend.camera || []).map(i => transformBackendItem(i, 'camera'))
  // 过滤被删除和被覆盖的默认项
  const filteredCameras = defaultCameras.filter(dc => {
    const defaultId = `default_${dc.id}`
    return !deletedIds.includes(defaultId) && !backend.camera?.find(bc => bc._overrideFor === defaultId)
  })
  result.camera = [...backendCameras, ...filteredCameras]

  // tripod
  const backendTripods = (backend.tripod || []).map(i => transformBackendItem(i, 'tripod'))
  const filteredTripods = defaultTripods.filter(dc => {
    const defaultId = `default_${dc.id}`
    return !deletedIds.includes(defaultId) && !backend.tripod?.find(bc => bc._overrideFor === defaultId)
  })
  result.tripod = [...backendTripods, ...filteredTripods]

  // light
  const backendLights = (backend.light || []).map(i => transformBackendItem(i, 'light'))
  const filteredLights = defaultLights.filter(dc => {
    const defaultId = `default_${dc.id}`
    return !deletedIds.includes(defaultId) && !backend.light?.find(bc => bc._overrideFor === defaultId)
  })
  result.light = [...backendLights, ...filteredLights]

  // audio
  const backendAudio = (backend.audio || []).map(i => transformBackendItem(i, 'audio'))
  const filteredAudio = defaultAudio.filter(dc => {
    const defaultId = `default_${dc.id}`
    return !deletedIds.includes(defaultId) && !backend.audio?.find(bc => bc._overrideFor === defaultId)
  })
  result.audio = [...backendAudio, ...filteredAudio]

  // accessory: 合并镜头、配件、胶片、湿版、其他
  const accessoryCategories = ['lens', 'accessory', 'film', 'wetplate', 'other']
  const backendAccessories = []
  accessoryCategories.forEach(cat => {
    if (backend[cat]) {
      backendAccessories.push(...backend[cat].map(i => transformBackendItem(i, cat)))
    }
  })
  const filteredAccessories = defaultAccessories.filter(dc => {
    const defaultId = `default_${dc.id}`
    if (deletedIds.includes(defaultId)) return false
    return !accessoryCategories.some(cat => backend[cat]?.find(bc => bc._overrideFor === defaultId))
  })
  result.accessory = [...backendAccessories, ...filteredAccessories]

  return result
}

// 响应式数据
const mergedData = ref(buildMergedData())

// 监听 storage 事件（跨标签页同步）
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    mergedData.value = buildMergedData()
  }
})

// 也监听当前页面内的数据变化（通过定时刷新）
onMounted(() => {
  mergedData.value = buildMergedData()
  // 监听后台数据变化
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      mergedData.value = buildMergedData()
    }
    if (e.key === EQUIPMENT_CONFIG_KEY) {
      equipConfig.value = loadEquipmentConfig()
    }
  })
  })

const categoryOptions = [
  { value: 'camera', label: '相机', icon: '📷' },
  { value: 'tripod', label: '三脚架', icon: '🗼' },
  { value: 'light', label: '灯光', icon: '💡' },
  { value: 'audio', label: '音频', icon: '🎙️' },
  { value: 'accessory', label: '配件', icon: '🎒' },
]

// 动态品牌选项（根据当前分类的实际数据生成）
const currentBrandOptions = computed(() => {
  const catData = categoryData.value[selectedCategory.value] || []
  const brandSet = new Set(catData.map(item => item.brand).filter(Boolean))
  const brandList = [...brandSet].sort().map(b => ({ value: b, label: b }))
  return [{ value: 'all', label: '全部品牌' }, ...brandList, { value: 'other', label: '其他' }]
})

const categoryData = computed(() => ({
  camera: mergedData.value.camera || [],
  tripod: mergedData.value.tripod || [],
  light: mergedData.value.light || [],
  audio: mergedData.value.audio || [],
  accessory: mergedData.value.accessory || [],
}))

const filteredItems = computed(() => {
  let list = [...(categoryData.value[selectedCategory.value] || [])]

  // Brand filter
  if (selectedCategory.value !== 'camera' && selectedBrand.value !== 'all') {
    list = list.filter(c => c.brand === selectedBrand.value)
  }

  // Sensor filter (cameras only)
  if (selectedCategory.value === 'camera' && selectedSensor.value !== 'all') {
    if (selectedSensor.value === 'other') {
      const mainSensors = (equipConfig.value.sensors || []).map(s => s.value)
      list = list.filter(c => !mainSensors.includes(c.sensor))
    } else {
      list = list.filter(c => c.sensor === selectedSensor.value)
    }
  }

  // Sort
  if (currentSort.value === 'price-asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (currentSort.value === 'price-desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (currentSort.value === 'date-desc') {
    list.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
  } else if (currentSort.value === 'date-asc') {
    list.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(item =>
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q))
    )
  }

  return list
})

const getDisplaySpecs = (item) => {
  const specs = {}
  if (item.sensor) specs['画幅'] = item.sensor
  if (item.pixels) specs['像素'] = item.pixels
  if (item.videoFormat) specs['视频'] = item.videoFormat
  if (item.focalLength) specs['焦距'] = item.focalLength
  if (item.aperture) specs['光圈'] = item.aperture
  if (item.mount) specs['卡口'] = item.mount
  if (item.category) specs['类型'] = item.category
  // For tripods/lights/audio, extract first 2 specs
  if (item.specs && Object.keys(specs).length === 0) {
    const entries = Object.entries(item.specs).slice(0, 2)
    entries.forEach(([k, v]) => specs[k] = v)
  }
  return specs
}

const openDetail = (item) => {
  currentItem.value = item
  showDetail.value = true
}
</script>

<style scoped>

.camera-page {
  padding: 24px;
  color: var(--text-primary);
  min-height: 100%;
}

.filter-bar {
  padding: 16px 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.filter-bar h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 14px;
  
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 36px;
  flex-shrink: 0;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-pills button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-pills button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.filter-pills button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.12);
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
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

.result-count {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.debug-info {
  color: #f59e0b;
  font-size: 11px;
  margin-left: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.camera-card {
  padding: 0 !important;
  overflow: hidden;
}

.card-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-brand-logo {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 22px;
  background: rgba(0, 0, 0, 0.4);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  backdrop-filter: blur(8px);
}

.card-body {
  padding: 14px 16px 16px;
}

.card-brand {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.pill {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-price {
  font-size: 18px;
  font-weight: 700;
  color: #e53e3e;
}

.card-rating {
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
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

</style>
