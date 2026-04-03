<template>
  <div class="equipment-manage">
    <div class="page-header">
      <h2>📷 摄影器材项目管理</h2>
      <p class="desc">选择类目和器材，点击"设置参数"添加或编辑器材详情</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-if="error" class="error-state">{{ error }}</div>

    <!-- 选择区域 -->
    <div class="select-section" v-if="!loading">
      <div class="category-tabs">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-tab"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = selectedCategory === cat.id ? '' : cat.id"
        >
          <span class="tab-icon">{{ cat.icon }}</span>
          <span class="tab-name">{{ cat.name }}</span>
          <span class="tab-count">{{ (allData[cat.id] || []).length }}</span>
          <span class="tab-toggle">{{ selectedCategory === cat.id ? '▼' : '▶' }}</span>
        </div>
      </div>

      <div class="select-group" v-if="selectedCategory">
        <label>已有器材（点击编辑）</label>
        <div class="equipment-list">
          <div
            v-for="item in categoryItems"
            :key="item._id || item.id"
            class="equipment-item"
            @click="editEquipment(item)"
          >
            <div class="equip-icon-wrap">
              <img v-if="item.logo" :src="item.logo" class="equip-logo" />
              <span v-else class="equip-icon">{{ item.icon || '📷' }}</span>
            </div>
            <div class="equip-info">
              <span class="equip-name">{{ item.name }}</span>
              <span class="equip-brand">{{ item.brand }}</span>
              <span v-if="item.price" class="equip-price">¥{{ item.price }}</span>
            </div>
            <div class="equip-actions">
              <button class="btn-equip-edit" @click.stop="editEquipment(item)" title="编辑">✏️</button>
              <button class="btn-equip-params" @click.stop="editParams(item)" title="参数">⚙️</button>
              <button class="btn-equip-delete" @click.stop="deleteEquipment(item)" title="删除">🗑️</button>
            </div>
          </div>
          <div v-if="!categoryItems.length" class="empty-hint">暂无数据，点击下方按钮添加</div>
        </div>
      </div>

      <div class="select-group" v-if="selectedCategory">
        <label>添加新器材</label>
        <div class="add-form">
          <input v-model="newItem.name" placeholder="器材名称" class="form-input" />
          <select v-model="selectedBrandValue" class="form-select" @change="onBrandSelectChange">
            <option value="">选择品牌</option>
            <option v-for="b in brandOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
          <input v-if="selectedBrandValue === 'other'" v-model="newItem.brand" placeholder="输入品牌名称" class="form-input" />
          <input v-model.number="newItem.price" placeholder="价格（元）" class="form-input" type="number" />
          <div class="logo-select-group">
            <label class="logo-select-label">Logo（从 Logo 库选择）</label>
            <div class="logo-select-grid">
              <div
                v-for="(logo, idx) in availableLogos"
                :key="idx"
                class="logo-select-item"
                :class="{ selected: newItem.logo === logo.url }"
                @click="newItem.logo = newItem.logo === logo.url ? '' : logo.url"
              >
                <img :src="logo.url" :alt="logo.name" />
              </div>
              <div v-if="!availableLogos.length" class="logo-empty-hint">
                暂无 Logo，请先在「后台设置 → Logo 管理」中上传
              </div>
            </div>
          </div>
          <button class="add-btn" @click="addEquipment">+ 添加器材</button>
        </div>
      </div>
    </div>

    <!-- 快速入口 -->
    <div v-if="!selectedCategory && !loading" class="quick-grid">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="quick-card"
        @click="selectedCategory = cat.id"
      >
        <span class="quick-icon">{{ cat.icon }}</span>
        <span class="quick-name">{{ cat.name }}</span>
        <span class="quick-count">{{ getItemCount(cat.id) }} 项</span>
      </div>
    </div>

    <!-- 编辑器材弹窗 -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content params-modal">
          <h3 class="modal-title">✏️ 编辑器材</h3>

          <div class="edit-basic-form">
            <div class="edit-form-row">
              <div class="edit-form-group">
                <label>名称</label>
                <input v-model="editingItem.name" class="form-input" />
              </div>
              <div class="edit-form-group">
                <label>品牌</label>
                <select v-model="editingBrandValue" class="form-select" @change="onEditBrandSelectChange">
                  <option value="">选择品牌</option>
                  <option v-for="b in brandOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
                </select>
                <input v-if="editingBrandValue === 'other'" v-model="editingItem.brand" placeholder="输入品牌名称" class="form-input" style="margin-top: 6px;" />
              </div>
            </div>
            <div class="edit-form-group">
              <label>价格（元）</label>
              <input v-model.number="editingItem.price" type="number" class="form-input" />
            </div>
            <div class="edit-form-group">
              <label>Logo</label>
              <div class="logo-select-grid small">
                <div
                  v-for="(logo, idx) in availableLogos"
                  :key="idx"
                  class="logo-select-item"
                  :class="{ selected: editingItem.logo === logo.url }"
                  @click="editingItem.logo = editingItem.logo === logo.url ? '' : logo.url"
                >
                  <img :src="logo.url" :alt="logo.name" />
                </div>
              </div>
            </div>
          </div>

          <h4 class="params-section-title">⚙️ 参数设置</h4>
          <div class="params-form">
            <div class="param-group" v-for="(param, idx) in editingParams" :key="idx">
              <div class="param-row">
                <input v-model="param.label" placeholder="参数名称" class="param-label-input" />
                <input v-model="param.value" placeholder="参数值" class="param-value-input" />
                <button class="btn-remove-param" @click="removeParam(idx)" v-if="editingParams.length > basicParamsCount">✕</button>
              </div>
            </div>

            <button class="btn-add-param" @click="addCustomParam">+ 自定义添加参数</button>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="showEditModal = false">取消</button>
            <button class="submit-btn" @click="saveEdit" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { cameras, lenses, tripods, lights, audio, accessories, film, wetplate } from '@/config/equipment.js'
import { loadEquipmentConfig, EQUIPMENT_CONFIG_KEY } from '@/config/equipmentConfig'
import { getEquipment, createEquipment, updateEquipment, deleteEquipment as apiDeleteEquipment } from '@/api/content'

const selectedCategory = ref('')
const showEditModal = ref(false)
const editingItem = ref(null)
const editingParams = ref([])
const basicParamsCount = ref(0)
const editingBrandValue = ref('')
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const newItem = ref({
  name: '',
  brand: '',
  price: null,
  logo: '',
})

// 从 Settings 的 Logo 库读取（通过 localStorage 同步 Logo 列表）
const availableLogos = ref(JSON.parse(localStorage.getItem('uploadedLogos') || '[]'))

window.addEventListener('storage', () => {
  availableLogos.value = JSON.parse(localStorage.getItem('uploadedLogos') || '[]')
})

watch(selectedCategory, () => {
  newItem.value = { name: '', brand: '', price: null, logo: '' }
  availableLogos.value = JSON.parse(localStorage.getItem('uploadedLogos') || '[]')
})

const equipConfigData = ref(loadEquipmentConfig())
const categories = computed(() => equipConfigData.value.categories || [])

const brandOptions = computed(() => {
  const list = equipConfigData.value.brands || []
  return [...list, { value: 'other', label: '其他...' }]
})
const sensorOptions = computed(() => {
  const list = equipConfigData.value.sensors || []
  return [...list, { value: 'other', label: '其他...' }]
})
const mountOptions = computed(() => {
  const list = equipConfigData.value.mounts || []
  return [...list, { value: 'other', label: '其他...' }]
})

const selectedBrandValue = ref('')
const selectedSensorValue = ref('')
const selectedMountValue = ref('')

onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === EQUIPMENT_CONFIG_KEY) {
      equipConfigData.value = loadEquipmentConfig()
    }
  })
  window.addEventListener('equipment-config-changed', () => {
    equipConfigData.value = loadEquipmentConfig()
  })
  loadAllData()
})

// 基础参数模板
const basicParams = {
  camera: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '画幅', value: '' },
    { label: '像素', value: '' }, { label: '有效像素', value: '' }, { label: '传感器类型', value: '' },
    { label: 'ISO范围', value: '' }, { label: '对焦点数', value: '' }, { label: '连拍速度', value: '' },
    { label: '视频规格', value: '' }, { label: '机身重量', value: '' }, { label: '机身尺寸', value: '' },
    { label: '防抖', value: '' }, { label: '防水防尘', value: '' }, { label: '电池续航', value: '' },
    { label: '发布日期', value: '' },
  ],
  lens: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '焦距', value: '' },
    { label: '最大光圈', value: '' }, { label: '镜头结构', value: '' }, { label: '滤镜口径', value: '' },
    { label: '最近对焦距离', value: '' }, { label: '重量', value: '' }, { label: '防抖', value: '' },
    { label: '发布日期', value: '' },
  ],
  tripod: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '最大高度', value: '' },
    { label: '最低高度', value: '' }, { label: '折叠长度', value: '' }, { label: '承重', value: '' },
    { label: '自重', value: '' }, { label: '材质', value: '' }, { label: '云台类型', value: '' },
  ],
  audio: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '类型', value: '' },
    { label: '频率响应', value: '' }, { label: '灵敏度', value: '' }, { label: '指向性', value: '' },
    { label: '重量', value: '' }, { label: '接口类型', value: '' }, { label: '续航时间', value: '' },
  ],
  light: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '功率', value: '' },
    { label: '色温范围', value: '' }, { label: '亮度', value: '' }, { label: '显色指数', value: '' },
    { label: '重量', value: '' }, { label: '接口类型', value: '' }, { label: '电池续航', value: '' },
  ],
  accessory: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '类型', value: '' },
    { label: '规格', value: '' }, { label: '重量', value: '' },
  ],
  film: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: 'ISO', value: '' },
    { label: '张数', value: '' }, { label: '色彩风格', value: '' }, { label: '适合场景', value: '' },
  ],
  wetplate: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '类型', value: '' },
    { label: '尺寸', value: '' }, { label: '重量', value: '' },
  ],
  other: [
    { label: '品牌', value: '' }, { label: '型号', value: '' }, { label: '类型', value: '' },
    { label: '规格', value: '' },
  ],
}

// 用户自定义器材数据（来自 API）
const userData = ref({})
const deletedDefaultIds = ref([])

// 本地存储 key（仅用于删除记录，用户器材存 API）
const storageKey = 'phototool_equipment_data'
const allData = ref({})

const defaultDataMap = {
  camera: cameras, lens: lenses, tripod: tripods, audio: audio,
  light: lights, accessory: accessories, film: film, wetplate: wetplate, other: [],
}

// 将 equipment.js 的数据转成后台格式（带 params）
const convertDefaultItem = (item, category) => {
  const params = []
  if (item.specs) {
    Object.entries(item.specs).forEach(([key, value]) => {
      params.push({ label: key, value })
    })
  }
  if (item.brand && !params.find(p => p.label === '品牌')) params.unshift({ label: '品牌', value: item.brand })
  if (item.sensor && !params.find(p => p.label === '画幅')) params.push({ label: '画幅', value: item.sensor })
  if (item.pixels && !params.find(p => p.label === '有效像素')) params.push({ label: '有效像素', value: item.pixels })
  if (item.videoFormat && !params.find(p => p.label === '视频规格')) params.push({ label: '视频规格', value: item.videoFormat })
  if (item.focalLength && !params.find(p => p.label === '焦距')) params.push({ label: '焦距', value: item.focalLength })
  if (item.aperture && !params.find(p => p.label === '最大光圈')) params.push({ label: '最大光圈', value: item.aperture })
  if (item.mount && !params.find(p => p.label === '卡口')) params.push({ label: '卡口', value: item.mount })

  return {
    _id: `default_${item.id}`,
    name: item.name,
    brand: item.brand || '',
    price: item.price || null,
    logo: item.brandLogo || '',
    params,
    _source: 'default',
  }
}

// specs 对象 → params 数组
const specsToParams = (specs) => {
  if (!specs) return []
  if (Array.isArray(specs)) return specs
  return Object.entries(specs).map(([label, value]) => ({ label, value }))
}

// params 数组 → specs 对象
const paramsToSpecs = (params) => {
  const specs = {}
  for (const p of params) {
    if (p.label) specs[p.label] = p.value
  }
  return specs
}

// 从 API 加载用户器材数据
const loadAllData = async () => {
  loading.value = true
  error.value = ''
  try {
    // 先加载本地删除记录
    try {
      const raw = localStorage.getItem(storageKey)
      const localData = raw ? JSON.parse(raw) : {}
      deletedDefaultIds.value = localData._deleted || []
    } catch { deletedDefaultIds.value = [] }

    // 从 API 加载用户器材数据
    const res = await getEquipment({ limit: 200 })
    const apiItems = res.items || []

    // 按 category 分组
    const grouped = {}
    for (const item of apiItems) {
      const cat = item.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push({
        id: item.id,
        _id: `api_${item.id}`,
        name: item.name,
        brand: item.brand || '',
        price: item.price_range || null,
        logo: item.image_url || '',
        params: specsToParams(item.specs),
        _source: 'api',
        _apiId: item.id,
      })
    }
    userData.value = grouped
  } catch (e) {
    error.value = '加载器材数据失败: ' + e.message
    console.error(e)
    userData.value = {}
  } finally {
    loading.value = false
  }
}

// 合并默认数据 + API 用户数据
const mergedData = computed(() => {
  const result = {}
  const cats = ['camera', 'lens', 'tripod', 'audio', 'light', 'accessory', 'film', 'wetplate', 'other']

  cats.forEach(cat => {
    const userItems = userData.value[cat] || []
    const defaultItems = (defaultDataMap[cat] || [])
      .map(item => convertDefaultItem(item, cat))
      .filter(item => !deletedDefaultIds.value.includes(item._id))
    result[cat] = [...userItems, ...defaultItems]
  })
  return result
})

const categoryItems = computed(() => {
  if (!selectedCategory.value) return []
  return mergedData.value[selectedCategory.value] || []
})

const getItemCount = (catId) => {
  return (mergedData.value[catId] || []).length
}

const onBrandSelectChange = () => {
  if (selectedBrandValue.value !== 'other') {
    newItem.value.brand = selectedBrandValue.value
  } else {
    newItem.value.brand = ''
  }
}

const onEditBrandSelectChange = () => {
  if (editingBrandValue.value !== 'other') {
    editingItem.value.brand = editingBrandValue.value
  }
}

const addEquipment = async () => {
  if (!newItem.value.name || !selectedCategory.value) return

  const brand = selectedBrandValue.value === 'other' ? (newItem.value.brand || '') : selectedBrandValue.value
  const baseParams = (basicParams[selectedCategory.value] || basicParams.other).map(p => ({ label: p.label, value: '' }))

  saving.value = true
  try {
    const payload = {
      name: newItem.value.name,
      brand,
      category: selectedCategory.value,
      imageUrl: newItem.value.logo || '',
      specs: paramsToSpecs(baseParams),
      priceRange: newItem.value.price ? String(newItem.value.price) : '',
    }

    const res = await createEquipment(payload)
    if (res.item) {
      const apiItem = res.item
      const newItemData = {
        id: apiItem.id,
        _id: `api_${apiItem.id}`,
        name: apiItem.name,
        brand: apiItem.brand || '',
        price: apiItem.price_range || null,
        logo: apiItem.image_url || '',
        params: specsToParams(apiItem.specs),
        _source: 'api',
        _apiId: apiItem.id,
      }
      if (!userData.value[selectedCategory.value]) {
        userData.value[selectedCategory.value] = []
      }
      userData.value[selectedCategory.value].push(newItemData)
    }

    newItem.value = { name: '', brand: '', price: null, logo: '' }
    selectedBrandValue.value = ''
  } catch (e) {
    alert('添加失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const editEquipment = (item) => {
  editingItem.value = { ...item, _originalSource: item._source }
  editingParams.value = item.params.map(p => ({ ...p }))
  basicParamsCount.value = item.params.length
  const brandVal = item.brand || ''
  const match = (equipConfigData.value.brands || []).find(b => b.value === brandVal)
  editingBrandValue.value = match ? brandVal : (brandVal ? 'other' : '')
  showEditModal.value = true
}

const editParams = (item) => {
  editingItem.value = { ...item, _originalSource: item._source }
  editingParams.value = item.params.map(p => ({ ...p }))
  basicParamsCount.value = item.params.length
  showEditModal.value = true
}

const deleteEquipment = async (item) => {
  if (!confirm(`确定删除「${item.name}」？此操作不可恢复。`)) return
  const cat = selectedCategory.value

  try {
    if (item._source === 'default') {
      // 删除默认器材：添加到 "已删除" 列表（存本地）
      if (!deletedDefaultIds.value.includes(item._id)) {
        deletedDefaultIds.value.push(item._id)
      }
      // 保存删除记录到 localStorage
      const raw = localStorage.getItem(storageKey)
      const localData = raw ? JSON.parse(raw) : {}
      localData._deleted = deletedDefaultIds.value
      localStorage.setItem(storageKey, JSON.stringify(localData))
    } else if (item._source === 'api' && item._apiId) {
      // 删除 API 器材
      await apiDeleteEquipment(item._apiId)
      if (userData.value[cat]) {
        userData.value[cat] = userData.value[cat].filter(i => i._apiId !== item._apiId)
      }
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

const saveEdit = async () => {
  if (!editingItem.value) return
  saving.value = true

  const params = editingParams.value.filter(p => p.label)

  try {
    if (editingItem.value._source === 'api' && editingItem.value._apiId) {
      // 更新 API 器材
      const payload = {
        name: editingItem.value.name,
        brand: editingItem.value.brand,
        priceRange: editingItem.value.price ? String(editingItem.value.price) : '',
        imageUrl: editingItem.value.logo || '',
        specs: paramsToSpecs(params),
      }
      await updateEquipment(editingItem.value._apiId, payload)

      // 更新本地 userData
      const cat = selectedCategory.value
      const idx = (userData.value[cat] || []).findIndex(i => i._apiId === editingItem.value._apiId)
      if (idx > -1) {
        userData.value[cat][idx] = {
          ...userData.value[cat][idx],
          name: editingItem.value.name,
          brand: editingItem.value.brand,
          price: editingItem.value.price,
          logo: editingItem.value.logo,
          params,
        }
      }
    } else if (editingItem.value._source === 'default') {
      // 默认器材编辑后作为新 API 项保存
      const payload = {
        name: editingItem.value.name,
        brand: editingItem.value.brand,
        category: selectedCategory.value,
        imageUrl: editingItem.value.logo || '',
        specs: paramsToSpecs(params),
        priceRange: editingItem.value.price ? String(editingItem.value.price) : '',
      }
      const res = await createEquipment(payload)
      if (res.item) {
        const apiItem = res.item
        const newItemData = {
          id: apiItem.id,
          _id: `api_${apiItem.id}`,
          name: apiItem.name,
          brand: apiItem.brand || '',
          price: apiItem.price_range || null,
          logo: apiItem.image_url || '',
          params: specsToParams(apiItem.specs),
          _source: 'api',
          _apiId: apiItem.id,
          _overrideFor: editingItem.value._id,
        }
        if (!userData.value[selectedCategory.value]) {
          userData.value[selectedCategory.value] = []
        }
        userData.value[selectedCategory.value].push(newItemData)
      }
    }
    showEditModal.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const addCustomParam = () => {
  editingParams.value.push({ label: '', value: '' })
}

const removeParam = (idx) => {
  editingParams.value.splice(idx, 1)
}
</script>

<style scoped>
.equipment-manage { padding: 24px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 22px; color: #111; margin-bottom: 4px; }
.page-header p { font-size: 14px; color: #6b7280; }
.loading-state, .error-state { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.error-state { color: #ef4444; }
.select-section { display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px; }
.select-group label { display: block; font-size: 14px; font-weight: 500; color: #4a5568; margin-bottom: 8px; }
.form-select { width: 100%; max-width: 300px; padding: 10px 14px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; font-size: 14px; color: #333; background: #fff; outline: none; }
.form-select:focus { border-color: rgba(94, 129, 244, 0.6); box-shadow: 0 0 0 3px rgba(94, 129, 244, 0.1); }
.add-form { display: flex; gap: 10px; flex-wrap: wrap; }
.form-input { padding: 10px 14px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; font-size: 14px; color: #333; background: #fff; outline: none; min-width: 150px; }
.form-input:focus { border-color: rgba(94, 129, 244, 0.6); }
.add-btn { padding: 10px 20px; background: linear-gradient(135deg, #5e81f4, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(94, 129, 244, 0.3); }
.equipment-list { display: flex; flex-direction: column; gap: 8px; }
.equipment-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.equipment-item:hover { background: #f8f9fa; border-color: rgba(94, 129, 244, 0.3); transform: translateX(4px); }
.equip-icon-wrap { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(94, 129, 244, 0.08); border-radius: 10px; flex-shrink: 0; overflow: hidden; }
.equip-logo { width: 32px; height: 32px; object-fit: contain; }
.equip-icon { font-size: 24px; }
.equip-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.equip-name { font-size: 14px; font-weight: 500; color: #333; }
.equip-brand { font-size: 12px; color: #6b7280; }
.equip-price { font-size: 12px; color: #e53e3e; font-weight: 500; }
.equip-actions { display: flex; gap: 6px; flex-shrink: 0; }
.equip-actions button { width: 32px; height: 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-equip-edit { background: rgba(94, 129, 244, 0.1); }
.btn-equip-edit:hover { background: rgba(94, 129, 244, 0.25); }
.btn-equip-params { background: rgba(168, 85, 247, 0.1); }
.btn-equip-params:hover { background: rgba(168, 85, 247, 0.25); }
.btn-equip-delete { background: rgba(239, 68, 68, 0.1); }
.btn-equip-delete:hover { background: rgba(239, 68, 68, 0.25); }
.empty-hint { color: #9ca3af; font-size: 14px; padding: 20px; text-align: center; }
.quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.quick-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 16px; background: #fff; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center; }
.quick-card:hover { border-color: rgba(94, 129, 244, 0.3); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
.quick-icon { font-size: 32px; }
.quick-name { font-size: 14px; font-weight: 500; color: #333; }
.quick-count { font-size: 12px; color: #9ca3af; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; color: #333; border-radius: 14px; padding: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); }
.params-modal { max-width: 600px; width: 90vw; max-height: 80vh; overflow-y: auto; }
.params-form { display: flex; flex-direction: column; gap: 8px; }
.param-row { display: flex; gap: 8px; align-items: center; }
.param-label-input { width: 140px; padding: 8px 12px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; font-size: 13px; color: #333; background: #f8f9fa; outline: none; }
.param-value-input { flex: 1; padding: 8px 12px; border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; font-size: 13px; color: #333; background: #fff; outline: none; }
.param-label-input:focus, .param-value-input:focus { border-color: rgba(94, 129, 244, 0.6); }
.btn-remove-param { width: 28px; height: 28px; border: none; background: rgba(239, 68, 68, 0.1); color: #e53e3e; border-radius: 6px; cursor: pointer; font-size: 12px; flex-shrink: 0; }
.btn-remove-param:hover { background: rgba(239, 68, 68, 0.2); }
.btn-add-param { margin-top: 8px; padding: 10px; background: rgba(94, 129, 244, 0.08); border: 1px dashed rgba(94, 129, 244, 0.3); border-radius: 8px; color: #5e81f4; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-add-param:hover { background: rgba(94, 129, 244, 0.15); }
.modal-actions { display: flex; gap: 12px; margin-top: 20px; }
.cancel-btn { flex: 1; padding: 12px; background: #f3f4f6; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; color: #4a5568; font-size: 14px; cursor: pointer; }
.cancel-btn:hover { background: #e5e7eb; }
.submit-btn { flex: 1; padding: 12px; background: linear-gradient(135deg, #5e81f4, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(94, 129, 244, 0.3); }
.logo-select-group { width: 100%; }
.logo-select-label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.logo-select-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.logo-select-grid.small { gap: 6px; }
.logo-select-item { width: 44px; height: 44px; padding: 4px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: #f8f9fa; display: flex; align-items: center; justify-content: center; }
.logo-select-grid.small .logo-select-item { width: 36px; height: 36px; }
.logo-select-item img { width: 100%; height: 100%; object-fit: contain; }
.logo-select-item:hover { border-color: rgba(94, 129, 244, 0.5); background: rgba(94, 129, 244, 0.05); }
.logo-select-item.selected { border-color: #5e81f4; background: rgba(94, 129, 244, 0.1); box-shadow: 0 0 0 2px rgba(94, 129, 244, 0.3); }
.logo-empty-hint { color: #9ca3af; font-size: 12px; padding: 8px; }
.edit-basic-form { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(0,0,0,0.08); }
.edit-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.edit-form-group { margin-bottom: 12px; }
.edit-form-group label { display: block; font-size: 13px; font-weight: 500; color: #4a5568; margin-bottom: 6px; }
.edit-form-group .form-input { width: 100%; padding: 10px 14px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-size: 14px; color: #333; background: #fff; outline: none; }
.edit-form-group .form-input:focus { border-color: rgba(94, 129, 244, 0.6); }
.params-section-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; }
.category-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
.category-tab { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(255,255,255,0.8); border-radius: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
.category-tab:hover { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.2); }
.category-tab.active { background: rgba(59,130,246,0.08); border-color: #5e81f4; }
.tab-icon { font-size: 20px; }
.tab-name { font-size: 14px; font-weight: 600; color: #1e2e3a; }
.tab-count { font-size: 12px; color: #fff; background: #5e81f4; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.tab-toggle { font-size: 10px; color: #aaa; margin-left: 4px; }
</style>
