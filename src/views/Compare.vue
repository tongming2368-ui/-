<template>
  <div class="compare-page">
    <h2>⚖️ 参数对比</h2>

    <!-- 搜索区 -->
    <GlassCard class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索相机/镜头型号..."
      />
      <div v-if="searchQuery && searchResults.length > 0" class="search-results">
        <button
          v-for="item in searchResults"
          :key="item.id"
          class="search-tag"
          :class="{ disabled: isDisabled(item) }"
          @click="addToCompare(item)"
        >
          <span class="tag-icon">{{ item.brandLogo }}</span>
          <span class="tag-name">{{ item.name }}</span>
          <span class="tag-type">{{ isCamera(item) ? '相机' : '镜头' }}</span>
        </button>
      </div>
      <div v-else-if="searchQuery && searchResults.length === 0" class="search-empty">
        未找到匹配的设备
      </div>
    </GlassCard>

    <!-- 对比区 -->
    <div v-if="selectedItems.length > 0" class="compare-area">
      <div class="compare-cards">
        <GlassCard
          v-for="item in selectedItems"
          :key="item.id"
          class="compare-card"
        >
          <button class="remove-btn" @click="removeItem(item.id)">✕</button>
          <div class="compare-card-img">
            <img :src="item.image" :alt="item.name" />
          </div>
          <div class="compare-card-name">{{ item.name }}</div>
        </GlassCard>
        <div v-for="n in (4 - selectedItems.length)" :key="'empty-' + n" class="compare-card-placeholder">
          <GlassCard class="placeholder-card">
            <span class="placeholder-text">+</span>
            <span class="placeholder-label">添加设备</span>
          </GlassCard>
        </div>
      </div>
    </div>

    <!-- 参数对比表 -->
    <GlassCard v-if="selectedItems.length >= 2" class="table-section">
      <h3 class="table-title">{{ compareType === 'camera' ? '📷 相机参数对比' : '🔭 镜头参数对比' }}</h3>
      <div class="table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="param-col">参数</th>
              <th v-for="item in selectedItems" :key="item.id" class="device-col">
                {{ item.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in currentParams" :key="param.key">
              <td class="param-name">{{ param.label }}</td>
              <td v-for="item in selectedItems" :key="item.id" class="param-value">
                {{ getSpecValue(item, param.key) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </GlassCard>

    <!-- 空状态提示 -->
    <div v-if="selectedItems.length === 0" class="empty-hint">
      <p>搜索并选择设备开始对比</p>
      <p class="hint-sub">最多可选择 4 个同类设备进行对比</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'phototool_equipment_data'
const dataVersion = ref(0)
import GlassCard from '@/components/common/GlassCard.vue'
import { cameras as defaultCameras, lenses as defaultLenses } from '@/config/equipment.js'
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
  const logos = { Sony: '📸', Canon: '📷', Nikon: '🎞️', Fujifilm: '🌲', Panasonic: '🎬', Godox: '💡' }
  return logos[brand] || '📷'
}

const transformBackendItem = (item, type) => {
  const specs = {}
  if (item.params) {
    item.params.forEach(p => { if (p.label && p.value) specs[p.label] = p.value })
  }
  return {
    id: `backend_${item.id}`,
    name: item.name,
    brand: item.brand || '未知',
    brandLogo: item.logo || getDefaultBrandLogo(item.brand),
    sensor: specs['画幅'] || '',
    price: item.price || 0,
    image: `https://placehold.co/400x300/1a1a2e/ffffff?text=${encodeURIComponent(item.name)}`,
    releaseDate: specs['发布日期'] || '2024-01-01',
    specs,
    _overrideFor: item._overrideFor || null,
    type,
  }
}

const mergedCameras = computed(() => {
  dataVersion.value // 响应式依赖
  const backend = loadBackendData()
  const deletedIds = backend._deleted || []
  const userItems = (backend.camera || []).map(i => transformBackendItem(i, 'camera'))
  const defaultItems = defaultCameras
    .map(c => ({ ...c, _id: `default_${c.id}`, _source: 'default', type: 'camera' }))
    .filter(c => !deletedIds.includes(c._id))
    .filter(c => !userItems.find(u => u._overrideFor === c._id))
  return [...userItems, ...defaultItems]
})

const mergedLenses = computed(() => {
  dataVersion.value // 响应式依赖
  const backend = loadBackendData()
  const deletedIds = backend._deleted || []
  const userItems = (backend.lens || []).map(i => transformBackendItem(i, 'lens'))
  const defaultItems = defaultLenses
    .map(l => ({ ...l, _id: `default_${l.id}`, _source: 'default', type: 'lens' }))
    .filter(l => !deletedIds.includes(l._id))
    .filter(l => !userItems.find(u => u._overrideFor === l._id))
  return [...userItems, ...defaultItems]
})

// 器材配置
const equipConfig = ref(loadEquipmentConfig())

onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) dataVersion.value++
    if (e.key === EQUIPMENT_CONFIG_KEY) {
      equipConfig.value = loadEquipmentConfig()
    }
  })
  })

const allDevices = computed(() => {
  return [...mergedCameras.value, ...mergedLenses.value]
})

const searchQuery = ref('')
const selectedItems = ref([])
const compareType = ref(null)

const cameraParams = [
  { key: '有效像素', label: '有效像素' },
  { key: '视频规格', label: '视频规格' },
  { key: '感光度', label: '感光度范围' },
  { key: '快门速度', label: '快门速度' },
  { key: '对焦系统', label: '对焦点数' },
  { key: '重量', label: '重量' },
  { key: '防抖', label: '防抖' },
]

const lensParams = [
  { key: '焦距', label: '焦距' },
  { key: '最大光圈', label: '最大光圈' },
  { key: '卡口', label: '卡口' },
  { key: '重量', label: '重量' },
  { key: '滤镜口径', label: '滤镜口径' },
  { key: '最近对焦距离', label: '最近对焦距离' },
]

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return allDevices.value.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.brand.toLowerCase().includes(q)
  )
})

const currentParams = computed(() => {
  return compareType.value === 'camera' ? cameraParams : lensParams
})

function isCamera(item) {
  return mergedCameras.value.some(c => c.id === item.id)
}

function isDisabled(item) {
  if (selectedItems.value.length >= 4) return true
  if (selectedItems.value.some(s => s.id === item.id)) return true
  if (compareType.value && item.type !== compareType.value) return true
  return false
}

function addToCompare(item) {
  if (selectedItems.value.some(s => s.id === item.id)) return

  if (selectedItems.value.length >= 4) return

  if (compareType.value && item.type !== compareType.value) {
    alert('不能跨类对比')
    return
  }

  if (!compareType.value) {
    compareType.value = item.type
  }

  selectedItems.value.push(item)
  searchQuery.value = ''
}

function removeItem(id) {
  selectedItems.value = selectedItems.value.filter(s => s.id !== id)
  if (selectedItems.value.length === 0) {
    compareType.value = null
  }
}

function getSpecValue(item, key) {
  return item.specs?.[key] || '-'
}
</script>

<style scoped>

.compare-page {
  padding: 24px;
  color: var(--text-primary);
  min-height: 100%;
}

.compare-page h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

/* 搜索区 */
.search-section {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.search-results {
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-tag:hover:not(.disabled) {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.search-tag.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tag-icon {
  font-size: 14px;
}

.tag-name {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-type {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.search-empty {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 对比区 */
.compare-area {
  margin-bottom: 24px;
}

.compare-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.compare-card {
  position: relative;
  padding: 0 !important;
  overflow: hidden;
  text-align: center;
}

.compare-card-img {
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.compare-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compare-card-name {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1;
  backdrop-filter: blur(8px);
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.6);
  color: var(--text-primary);
}

.compare-card-placeholder .placeholder-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-style: dashed;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.3);
}

.placeholder-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

/* 参数对比表 */
.table-section {
  margin-bottom: 24px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.table-wrapper {
  overflow-x: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.compare-table th,
.compare-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  white-space: nowrap;
}

.compare-table th {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 13px;
}

.compare-table th.device-col {
  min-width: 160px;
  font-weight: 600;
  color: var(--text-primary);
}

.param-col {
  width: 120px;
  min-width: 100px;
}

.param-name {
  color: var(--text-primary);
  font-size: 13px;
}

.param-value {
  color: var(--text-primary);
  font-weight: 500;
}

.compare-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.04);
}

.compare-table tbody tr:last-child td {
  border-bottom: none;
}

/* 空状态提示 */
.empty-hint {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-hint p {
  font-size: 16px;
  margin-bottom: 8px;
}

.hint-sub {
  font-size: 13px !important;
  color: rgba(255, 255, 255, 0.3);
}

/* 响应式 */
@media (max-width: 900px) {
  .compare-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .compare-cards {
    grid-template-columns: 1fr;
  }

  .compare-page {
    padding: 16px;
  }
}

</style>
