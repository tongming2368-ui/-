<template>
  <div class="equipment-page">
    <!-- 未登录主内容遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看器材详情')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>

    <div class="filter-bar">
      <h2>{{ pageTitle }}</h2>
      <div class="filter-row">
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索名称/品牌..." />
        </div>
        <div v-if="currentCategory === 'camera'" class="filter-group">
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
        <div v-if="currentCategory === 'light'" class="filter-group">
          <span class="filter-label">类型</span>
          <div class="filter-pills">
            <button
              v-for="t in lightTypeOptions"
              :key="t.value"
              :class="{ active: selectedLightType === t.value }"
              @click="selectedLightType = t.value"
            >{{ t.label }}</button>
          </div>
        </div>
        <div v-if="currentCategory === 'film'" class="filter-group">
          <span class="filter-label">胶片类型</span>
          <div class="filter-pills">
            <button
              v-for="t in filmTypeOptions"
              :key="t.value"
              :class="{ active: selectedFilmType === t.value }"
              @click="selectedFilmType = t.value"
            >{{ t.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">品牌</span>
          <div class="filter-pills">
            <button
              v-for="b in dynamicBrandOptions"
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
      <div class="result-count">共 {{ filteredItems.length }} 件器材</div>
    </div>

    <div class="card-grid">
      <GlassCard
        v-for="item in filteredItems"
        :key="item.id"
        hoverable
        class="equipment-card"
        @click="openDetail(item)"
      >
        <div class="card-image">
          <img :src="item.image" :alt="item.name" />
          <span class="card-brand-logo">{{ item.brandLogo }}</span>
        </div>
        <div class="card-body">
          <div class="card-brand">{{ item.brand }} · {{ item.category || item.sensor || item.type }}</div>
          <h3 class="card-name">{{ item.name }}</h3>
          <div class="card-pills">
            <span v-for="(val, key) in getDisplaySpecs(item)" :key="key" class="pill">{{ key }}: {{ val }}</span>
          </div>
          <div class="card-footer">
            <span v-if="item.price" class="card-price">¥{{ item.price?.toLocaleString() }}</span>
            <span v-if="item.rating" class="card-rating">⭐ {{ item.rating }} ({{ item.ratingCount }})</span>
          </div>
        </div>
      </GlassCard>
    </div>

    <div v-if="filteredItems.length === 0" class="empty-state">
      <p>没有找到符合条件的器材</p>
    </div>

    <DetailModal v-model="showDetail" :item="currentItem" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const STORAGE_KEY = 'phototool_equipment_data'
const dataVersion = ref(0)
import { useRoute } from 'vue-router'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()
import GlassCard from '@/components/common/GlassCard.vue'
import DetailModal from '@/components/common/DetailModal.vue'
import { cameras as defaultCameras, lenses as defaultLenses, tripods as defaultTripods, lights as defaultLights, audio as defaultAudio, accessories as defaultAccessories, film as defaultFilm, wetplate as defaultWetplate, sortOptions } from '@/config/equipment.js'
import { loadEquipmentConfig, EQUIPMENT_CONFIG_KEY } from '@/config/equipmentConfig'
import { getEquipment as apiGetEquipment } from '@/api/content'

// ===== 后台数据合并 =====

const loadBackendData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

const getDefaultBrandLogo = (brand) => {
  const logos = { Sony: '📸', Canon: '📷', Nikon: '🎞️', Fujifilm: '🌲', Panasonic: '🎬', Godox: '💡', Aputure: '🎥', Rode: '🎙️', DJI: '📡' }
  return logos[brand] || '📷'
}

const transformBackendItem = (item, category) => {
  const specs = {}
  if (item.params) {
    item.params.forEach(p => { if (p.label && p.value) specs[p.label] = p.value })
  }
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
    sensor, pixels, videoFormat, focalLength, aperture, mount,
    category: specs['类型'] || '',
    price: item.price || 0,
    releaseDate: specs['发布日期'] || specs['发布时间'] || '2024-01-01',
    image: `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(item.name)}`,
    followers: 0, rating: 0, ratingCount: 0, description: '',
    specs,
    _overrideFor: item._overrideFor || null,
    _source: item._source || null,
  }
}

const categoryMapping = {
  camera: 'camera', lens: 'lens', tripod: 'tripod', audio: 'audio',
  light: 'light', accessory: 'accessory', film: 'film',
  wetplate: 'wetplate', 'other-photo': 'other',
}

const defaultDataMap = {
  camera: defaultCameras, lens: defaultLenses, tripod: defaultTripods,
  audio: defaultAudio, light: defaultLights, accessory: defaultAccessories,
  film: defaultFilm, wetplate: defaultWetplate, 'other-photo': [],
}

const apiEquipmentData = ref([])

// 从 API 加载器材数据
const loadApiEquipment = async () => {
  try {
    const data = await apiGetEquipment({ limit: 100 })
    apiEquipmentData.value = (data.items || []).map(item => ({
      id: `api_${item.id}`,
      _id: `api_${item.id}`,
      name: item.name,
      brand: item.brand || '未知',
      brandLogo: '📷',
      sensor: item.sensor || '',
      pixels: '',
      videoFormat: '',
      focalLength: '',
      aperture: '',
      mount: item.mount_type || '',
      category: item.category || '',
      price: 0,
      releaseDate: item.release_year || '',
      image: item.image_url || `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(item.name)}`,
      followers: 0, rating: 0, ratingCount: 0,
      description: item.description || '',
      specs: item.specs || {},
      _source: 'api',
    }))
    dataVersion.value++
  } catch (e) {
    console.error('Failed to load equipment:', e)
  }
}

const mergedCategoryData = computed(() => {
  dataVersion.value // 响应式依赖
  const backend = loadBackendData()
  const deletedIds = backend._deleted || []
  const result = {}
  const allFrontCats = ['camera', 'lens', 'tripod', 'audio', 'light', 'accessory', 'film', 'wetplate', 'other-photo']

  allFrontCats.forEach(cat => {
    const backendCat = categoryMapping[cat]
    const userItems = (backend[backendCat] || []).map(i => transformBackendItem(i, backendCat))
    // API 数据
    const apiItems = apiEquipmentData.value.filter(item => {
      const itemCat = item.category?.toLowerCase()
      return itemCat === cat || itemCat === backendCat || itemCat?.includes(cat)
    })
    const defaultItems = (defaultDataMap[cat] || [])
      .map(item => {
        const converted = { ...item }
        converted._id = `default_${item.id}`
        converted._source = 'default'
        return converted
      })
      .filter(item => !deletedIds.includes(item._id))
      .filter(item => !userItems.find(ui => ui._overrideFor === item._id))
    result[cat] = [...apiItems, ...userItems, ...defaultItems]
  })

  return result
})

onMounted(() => {
  loadApiEquipment()
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) dataVersion.value++
    if (e.key === EQUIPMENT_CONFIG_KEY) {
      equipConfig.value = loadEquipmentConfig()
    }
  })
})

const categoryData = computed(() => mergedCategoryData.value)

const route = useRoute()
const currentCategory = computed(() => route.params.type || 'camera')
const selectedBrand = ref('all')
const selectedSensor = ref('all')
const selectedLightType = ref('all')
const selectedFilmType = ref('all')
const lightTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'flash', label: '闪光灯' },
  { value: 'continuous', label: '常亮灯' },
]
const filmTypeOptions = [
  { value: 'all', label: '全部胶片' },
  { value: '彩色负片', label: '彩色负片' },
  { value: '彩色反转片', label: '彩色反转片' },
  { value: '黑白负片', label: '黑白负片' },
]
const currentSort = ref('default')
const searchQuery = ref('')
const showDetail = ref(false)
const currentItem = ref(null)

// 从配置读取
const equipConfig = ref(loadEquipmentConfig())

// 动态品牌选项（根据当前分类的实际数据生成）
const dynamicBrandOptions = computed(() => {
  const catData = categoryData.value[currentCategory.value] || []
  const brandSet = new Set(catData.map(item => item.brand).filter(Boolean))
  const brandList = [...brandSet].sort().map(b => ({ value: b, label: b }))
  return [{ value: 'all', label: '全部品牌' }, ...brandList, { value: 'other', label: '其他' }]
})

// 动态画幅选项
const dynamicSensorOptions = computed(() => {
  const configSensors = (equipConfig.value.sensors || []).map(s => ({ value: s.value, label: s.label }))
  return [{ value: 'all', label: '全部画幅' }, ...configSensors, { value: 'other', label: '其他' }]
})

// 动态分类列表（用于 Equipment.vue 自身的分类标签显示）
const dynamicCategories = computed(() => {
  const cats = equipConfig.value.categories || []
  return cats.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
})

const pageTitles = {
  camera: '📷 相机',
  lens: '🔭 镜头',
  tripod: '🗼 三脚架',
  audio: '🎙️ 音频设备',
  light: '💡 灯光设备',
  accessory: '🎒 配件',
  film: '🎞️ 胶片',
  wetplate: '🧪 湿版',
  'other-photo': '📸 其他摄影'
}

const pageTitle = computed(() => pageTitles[currentCategory.value] || '器材库')

// categoryData 已在上面通过 mergedCategoryData computed 定义

const filteredItems = computed(() => {
  let list = [...(categoryData.value[currentCategory.value] || [])]

  if (selectedBrand.value !== 'all') {
    list = list.filter(c => c.brand === selectedBrand.value)
  }

  if (currentCategory.value === 'camera' && selectedSensor.value !== 'all') {
    if (selectedSensor.value === 'other') {
      const mainSensors = (equipConfig.value.sensors || []).map(s => s.value)
      list = list.filter(c => !mainSensors.includes(c.sensor))
    } else {
      list = list.filter(c => c.sensor === selectedSensor.value)
    }
  }

  if (currentCategory.value === 'light' && selectedLightType.value !== 'all') {
    if (selectedLightType.value === 'flash') {
      list = list.filter(c => (c.category || '').includes('闪光'))
    } else if (selectedLightType.value === 'continuous') {
      list = list.filter(c => (c.category || '').includes('常亮') || (c.category || '').includes('LED'))
    }
  }

  if (currentCategory.value === 'film' && selectedFilmType.value !== 'all') {
    list = list.filter(c => c.category === selectedFilmType.value)
  }

  if (currentSort.value === 'price-asc') {
    list.sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (currentSort.value === 'price-desc') {
    list.sort((a, b) => (b.price || 0) - (a.price || 0))
  } else if (currentSort.value === 'date-desc') {
    list.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
  } else if (currentSort.value === 'date-asc') {
    list.sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0))
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
  if (item.iso) specs['iso'] = item.iso
  if (item.frames) specs['张数'] = item.frames
  if (item.coating) specs['工艺'] = item.coating
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

watch(() => route.params.type, () => {
  selectedBrand.value = 'all'
  selectedSensor.value = 'all'
  currentSort.value = 'default'
})
</script>

<style scoped>

.equipment-page {
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.equipment-card {
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
  color: #ffd700;
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