<template>
  <div class="manuals-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="page-header">
      <h1>📋 说明书</h1>
      <p class="subtitle">各类摄影器材官方说明书下载</p>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索设备名称/品牌..." />
        </div>
        <div class="filter-group">
          <span class="filter-label">厂商</span>
          <div class="filter-pills">
            <button
              v-for="brand in brands"
              :key="brand.value"
              :class="{ active: selectedBrand === brand.value }"
              @click="selectedBrand = brand.value"
            >{{ brand.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">类型</span>
          <div class="filter-pills">
            <button
              v-for="t in types"
              :key="t.value"
              :class="{ active: selectedType === t.value }"
              @click="selectedType = t.value"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="manuals-list">
      <GlassCard
        v-for="manual in filteredManuals"
        :key="manual.id"
        hoverable
        class="manual-item"
      >
        <div class="manual-icon">{{ manual.brandIcon }}</div>
        <div class="manual-info">
          <h3 class="manual-name">{{ manual.name }}</h3>
          <p class="manual-meta">{{ manual.brand }} · {{ manual.type }}</p>
          <p class="manual-desc">{{ manual.description }}</p>
        </div>
        <button class="download-btn" @click="downloadManual(manual)">
          <span>⬇ 下载</span>
        </button>
      </GlassCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()

const { getPageFilterOptions } = useFilterConfig()

const selectedBrand = ref('all')
const selectedType = ref('all')
const searchQuery = ref('')

const brands = getPageFilterOptions('manuals', 'brand').length > 0
  ? getPageFilterOptions('manuals', 'brand')
  : [
      { value: 'all', label: '全部' },
      { value: 'Sony', label: '索尼' },
      { value: 'Canon', label: '佳能' },
      { value: 'Nikon', label: '尼康' },
      { value: 'Fujifilm', label: '富士' },
      { value: 'other', label: '其他' }
    ]

const types = getPageFilterOptions('manuals', 'type').length > 0
  ? getPageFilterOptions('manuals', 'type')
  : [
      { value: 'all', label: '全部' },
      { value: 'camera', label: '相机' },
      { value: 'lens', label: '镜头' },
      { value: 'flash', label: '闪光灯' },
      { value: 'software', label: '软件' }
    ]

const manuals = ref([
  {
    id: 1,
    name: 'Sony A7R V 使用说明书',
    brand: 'Sony',
    brandIcon: '📸',
    type: '相机',
    description: '索尼A7R V微单相机完整使用手册，包含所有功能操作指南。'
  },
  {
    id: 2,
    name: 'Canon EOS R5 快速入门指南',
    brand: 'Canon',
    brandIcon: '📷',
    type: '相机',
    description: '佳能R5相机快速入门指南，帮助新用户快速上手。'
  },
  {
    id: 3,
    name: 'Nikon Z8 官方手册',
    brand: 'Nikon',
    brandIcon: '🎞️',
    type: '相机',
    description: '尼康Z8全画幅微单官方使用手册。'
  },
  {
    id: 4,
    name: 'Sony FE 24-70mm GM II 说明书',
    brand: 'Sony',
    brandIcon: '📸',
    type: '镜头',
    description: '索尼24-70mm F2.8 GM II镜头使用说明。'
  },
  {
    id: 5,
    name: 'Godox AD600Pro 使用手册',
    brand: 'Godox',
    brandIcon: '💡',
    type: '闪光灯',
    description: '神牛AD600Pro外拍闪光灯完整使用指南。'
  },
  {
    id: 6,
    name: 'Adobe Lightroom Classic 官方指南',
    brand: 'Adobe',
    brandIcon: '🎨',
    type: '软件',
    description: 'Lightroom Classic完整官方使用手册。'
  },
  {
    id: 7,
    name: 'Fujifilm X-T5 说明书',
    brand: 'Fujifilm',
    brandIcon: '🌲',
    type: '相机',
    description: '富士X-T5相机完整使用手册。'
  },
  {
    id: 8,
    name: 'Capture One Pro 使用教程',
    brand: 'Capture One',
    brandIcon: '📁',
    type: '软件',
    description: 'Capture One专业图像处理软件使用指南。'
  }
])

const filteredManuals = computed(() => {
  let list = [...manuals.value]
  if (selectedBrand.value !== 'all') {
    list = list.filter(m => m.brand === selectedBrand.value)
  }
  if (selectedType.value !== 'all') {
    list = list.filter(m => m.type.toLowerCase().includes(selectedType.value))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q)
    )
  }
  return list
})

const downloadManual = (manual) => {
  const content = `${manual.name}\n品牌: ${manual.brand}\n类型: ${manual.type}\n\n（此为占位说明书文件，请替换为实际资源）`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${manual.name}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.manuals-page {
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

.filter-bar {
  padding: 20px 24px;
  margin-bottom: 24px;
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

.filter-pills button.active,
.filter-pills button:hover {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.manuals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px !important;
}

.manual-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.manual-info {
  flex: 1;
}

.manual-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.manual-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.manual-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.download-btn {
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.download-btn:hover {
  background: rgba(59, 130, 246, 0.8);
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