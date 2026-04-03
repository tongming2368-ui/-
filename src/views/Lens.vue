<template>
  <div class="lens-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <h2>🔭 镜头库</h2>
      <div class="filter-row">
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索名称/品牌..." />
        </div>
        <div class="filter-group">
          <span class="filter-label">画幅</span>
          <div class="filter-pills">
            <button
              v-for="s in sensorOptions"
              :key="s.value"
              :class="{ active: selectedSensor === s.value }"
              @click="selectedSensor = s.value"
            >{{ s.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">类型</span>
          <div class="filter-pills">
            <button
              v-for="t in typeOptions"
              :key="t.value"
              :class="{ active: selectedType === t.value }"
              @click="selectedType = t.value"
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
          <span class="filter-label">卡口</span>
          <div class="filter-pills">
            <button
              v-for="m in dynamicMountOptions"
              :key="m.value"
              :class="{ active: selectedMount === m.value }"
              @click="selectedMount = m.value"
            >{{ m.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">排序</span>
          <div class="filter-pills">
            <button
              v-for="s in dynamicSortOptions"
              :key="s.value"
              :class="{ active: currentSort === s.value }"
              @click="currentSort = s.value"
            >{{ s.label }}</button>
          </div>
        </div>
      </div>
      <div class="result-count">共 {{ filteredLenses.length }} 支镜头</div>
    </div>

    <!-- 镜头卡片网格 -->
    <div class="card-grid">
      <GlassCard
        v-for="lens in filteredLenses"
        :key="lens.id"
        hoverable
        class="lens-card"
        @click="openDetail(lens)"
      >
        <div class="card-image">
          <img :src="lens.image" :alt="lens.name" />
          <span class="card-brand-logo">{{ lens.brandLogo }}</span>
        </div>
        <div class="card-body">
          <div class="card-brand">{{ lens.brand }}</div>
          <h3 class="card-name">{{ lens.name }}</h3>
          <div class="card-pills">
            <span class="pill focal">{{ lens.focalLength }}</span>
            <span class="pill aperture">{{ lens.aperture }}</span>
            <span class="pill mount">{{ lens.mount }}</span>
          </div>
          <div class="card-footer">
            <span class="card-price">¥{{ lens.price?.toLocaleString() }}</span>
            <span class="card-date">{{ formatDate(lens.releaseDate) }}</span>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredLenses.length === 0" class="empty-state">
      <p>没有找到符合条件的镜头</p>
    </div>

    <!-- 详情弹窗 -->
    <DetailModal v-model="showDetail" :item="currentLens" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'phototool_equipment_data'
const dataVersion = ref(0)
import GlassCard from '@/components/common/GlassCard.vue'
import DetailModal from '@/components/common/DetailModal.vue'
import { lenses as defaultLenses, sortOptions } from '@/config/equipment.js'
import { loadEquipmentConfig, EQUIPMENT_CONFIG_KEY } from '@/config/equipmentConfig'

// ===== 后台数据合并 =====

const loadBackendData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

const getDefaultBrandLogo = (brand) => {
  const logos = { Sony: '📸', Canon: '📷', Nikon: '🎞️', Fujifilm: '🌲', Sigma: '🔵', Tamron: '🟢', Laowa: '🌊' }
  return logos[brand] || '🔭'
}

const transformBackendItem = (item) => {
  const specs = {}
  if (item.params) {
    item.params.forEach(p => { if (p.label && p.value) specs[p.label] = p.value })
  }
  return {
    id: `backend_${item.id}`,
    name: item.name,
    brand: item.brand || '未知',
    brandLogo: item.logo || getDefaultBrandLogo(item.brand),
    sensor: specs['画幅'] || specs['类型'] || '',
    price: item.price || 0,
    focalLength: specs['焦距'] || '',
    aperture: specs['最大光圈'] || '',
    mount: specs['卡口'] || '',
    type: specs['类型'] === '定焦' ? 'prime' : specs['类型'] === '变焦' ? 'zoom' : '',
    image: `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(item.name)}`,
    releaseDate: specs['发布日期'] || '2024-01-01',
    specs,
    _overrideFor: item._overrideFor || null,
  }
}

const mergedLenses = computed(() => {
  dataVersion.value // 依赖版本号，使其具有响应性
  const backend = loadBackendData()
  const deletedIds = backend._deleted || []
  const userItems = (backend.lens || []).map(i => transformBackendItem(i))
  const defaultItems = defaultLenses
    .map(l => ({ ...l, _id: `default_${l.id}`, _source: 'default' }))
    .filter(l => !deletedIds.includes(l._id))
    .filter(l => !userItems.find(u => u._overrideFor === l._id))
  return [...userItems, ...defaultItems]
})

onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) dataVersion.value++
    if (e.key === EQUIPMENT_CONFIG_KEY) {
      equipConfig.value = loadEquipmentConfig()
    }
  })
  })
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()

const { getPageFilterOptions } = useFilterConfig()

// 从器材配置读取品牌和卡口
const equipConfig = ref(loadEquipmentConfig())
const dynamicBrandOptions = computed(() => {
  const configBrands = (equipConfig.value.brands || []).map(b => ({ value: b.value, label: b.label }))
  return [
    { value: 'all', label: '全部品牌' },
    ...configBrands,
    { value: 'other', label: '其他' },
  ]
})
const dynamicMountOptions = computed(() => {
  const configMounts = (equipConfig.value.mounts || []).map(m => ({ value: m.value, label: m.label }))
  return [
    { value: 'all', label: '全部卡口' },
    ...configMounts,
    { value: 'other', label: '其他' },
  ]
})

// 从后台配置读取画幅和类型选项
const sensorOptions = getPageFilterOptions('lens', 'sensor').length > 0
  ? getPageFilterOptions('lens', 'sensor')
  : [
      { value: 'all', label: '全部画幅' },
      { value: '全画幅', label: '全画幅' },
      { value: 'APSC', label: 'APS-C' },
    ]

const typeOptions = getPageFilterOptions('lens', 'type').length > 0
  ? getPageFilterOptions('lens', 'type')
  : [
      { value: 'all', label: '全部类型' },
      { value: 'prime', label: '定焦' },
      { value: 'zoom', label: '变焦' },
    ]

const dynamicSortOptions = getPageFilterOptions('lens', 'sort').length > 0
  ? getPageFilterOptions('lens', 'sort')
  : sortOptions

const selectedBrand = ref('all')
const selectedMount = ref('all')
const selectedSensor = ref('all')
const selectedType = ref('all')
const currentSort = ref('default')
const searchQuery = ref('')
const showDetail = ref(false)
const currentLens = ref(null)

const filteredLenses = computed(() => {
  let list = [...mergedLenses.value]

  if (selectedBrand.value !== 'all') {
    if (selectedBrand.value === 'other') {
      const mainBrands = (equipConfig.value.brands || []).map(b => b.value)
      list = list.filter(l => !mainBrands.includes(l.brand))
    } else {
      list = list.filter(l => l.brand === selectedBrand.value)
    }
  }

  if (selectedMount.value !== 'all') {
    if (selectedMount.value === 'other') {
      const mainMounts = (equipConfig.value.mounts || []).map(m => m.value)
      list = list.filter(l => !mainMounts.includes(l.mount))
    } else {
      list = list.filter(l => l.mount === selectedMount.value)
    }
  }

  if (selectedSensor.value !== 'all') {
    list = list.filter(l => l.sensor === selectedSensor.value)
  }

  if (selectedType.value !== 'all') {
    list = list.filter(l => l.type === selectedType.value)
  }

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

const openDetail = (lens) => {
  currentLens.value = lens
  showDetail.value = true
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}
</script>

<style scoped>

.lens-page {
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
  margin-bottom: 16px;
  
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
  color: var(--text-primary);
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

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.lens-card {
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

.pill.focal {
  background: rgba(245, 158, 11, 0.25);
}

.pill.aperture {
  background: rgba(239, 68, 68, 0.25);
}

.pill.mount {
  background: rgba(34, 197, 94, 0.25);
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

.card-date {
  font-size: 12px;
  color: var(--text-secondary);
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 16px;
}

</style>
