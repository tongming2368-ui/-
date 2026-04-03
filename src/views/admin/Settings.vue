<template>
  <div class="settings">
    <div class="settings-section glass-dark">
      <h3>基础设置</h3>
      <div v-if="loading" class="loading-state">加载中...</div>
      <div class="form-group">
        <label>网站标题</label>
        <input v-model="settings.siteTitle" type="text" placeholder="输入网站标题" />
      </div>
      <div class="form-group">
        <label>网站描述</label>
        <textarea v-model="settings.siteDescription" rows="3" placeholder="输入网站描述"></textarea>
      </div>
      <div class="form-group">
        <label>网站Logo</label>
        <div class="logo-preview">
          <span class="logo-icon">📷</span>
          <button class="btn-change">更换图标</button>
        </div>
      </div>
    </div>

    <div class="settings-section glass-dark">
      <h3>积分规则</h3>
      <div class="form-row">
        <div class="form-group">
          <label>每日签到积分（最小值）</label>
          <input v-model.number="settings.signMinPoints" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>每日签到积分（最大值）</label>
          <input v-model.number="settings.signMaxPoints" type="number" min="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>发布帖子奖励</label>
          <input v-model.number="settings.postReward" type="number" min="0" />
        </div>
        <div class="form-group">
          <label>评论奖励</label>
          <input v-model.number="settings.commentReward" type="number" min="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>每日签到上限次数</label>
          <input v-model.number="settings.maxSignPerDay" type="number" min="1" />
        </div>
        <div class="form-group">
          <label>连续签到额外奖励</label>
          <input v-model.number="settings.continuousBonus" type="number" min="0" />
        </div>
      </div>
    </div>

    <div class="settings-section glass-dark">
      <h3>等级设置</h3>
      <div class="level-table">
        <div class="level-row header">
          <span>等级</span>
          <span>所需积分</span>
          <span>特权说明</span>
        </div>
        <div class="level-row" v-for="level in levelConfig" :key="level.level">
          <span class="level-badge" :class="'level-' + level.level">Lv.{{ level.level }}</span>
          <span class="points">{{ level.required }}</span>
          <span class="privilege">{{ level.privilege }}</span>
        </div>
      </div>
    </div>

    <div class="settings-section glass-dark">
      <h3>其他设置</h3>
      <div class="form-group">
        <label class="toggle-label">
          <span>允许用户注册</span>
          <div class="toggle" :class="{ active: settings.allowRegister }" @click="settings.allowRegister = !settings.allowRegister">
            <div class="toggle-thumb"></div>
          </div>
        </label>
      </div>
      <div class="form-group">
        <label class="toggle-label">
          <span>开启邮件验证</span>
          <div class="toggle" :class="{ active: settings.emailVerify }" @click="settings.emailVerify = !settings.emailVerify">
            <div class="toggle-thumb"></div>
          </div>
        </label>
      </div>
      <div class="form-group">
        <label class="toggle-label">
          <span>开启评论审核</span>
          <div class="toggle" :class="{ active: settings.commentReview }" @click="settings.commentReview = !settings.commentReview">
            <div class="toggle-thumb"></div>
          </div>
        </label>
      </div>
      <div class="form-group">
        <label>背景图片透明度 ({{ Math.round(settings.bgOpacity * 100) }}%)</label>
        <input type="range" v-model.number="settings.bgOpacity" min="0" max="1" step="0.05" class="range-input" />
      </div>
      <div class="form-group">
        <label>雾化效果透明度 ({{ Math.round(settings.gauzeOpacity * 100) }}%)</label>
        <input type="range" v-model.number="settings.gauzeOpacity" min="0" max="1" step="0.05" class="range-input" />
      </div>

      <div class="form-group">
        <label>雾化效果模糊度 ({{ settings.gauzeBlur }}px)</label>
        <input type="range" v-model.number="settings.gauzeBlur" min="0" max="20" step="1" class="range-input" />
      </div>

      <h3 style="margin-top: 16px;">背景渐变色设置</h3>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">修改后点击"保存设置"生效，可实时预览</p>

      <div class="gradient-section">
        <h4>工具站模式</h4>
        <div class="color-row">
          <div class="color-input-group">
            <label>渐变色 1（左上）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.toolGradient1" class="color-input" />
              <span class="color-value">{{ settings.toolGradient1 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 2（中间）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.toolGradient2" class="color-input" />
              <span class="color-value">{{ settings.toolGradient2 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 3（右下）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.toolGradient3" class="color-input" />
              <span class="color-value">{{ settings.toolGradient3 }}</span>
            </div>
          </div>
        </div>
        <div class="gradient-preview" :style="{
          background: `linear-gradient(160deg, ${settings.toolGradient1} 0%, ${settings.toolGradient2} 40%, ${settings.toolGradient3} 100%)`
        }"></div>
      </div>

      <div class="gradient-section">
        <h4>摄影之家模式</h4>
        <div class="color-row">
          <div class="color-input-group">
            <label>渐变色 1（左上）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.photoGradient1" class="color-input" />
              <span class="color-value">{{ settings.photoGradient1 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 2（中间）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.photoGradient2" class="color-input" />
              <span class="color-value">{{ settings.photoGradient2 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 3（右下）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.photoGradient3" class="color-input" />
              <span class="color-value">{{ settings.photoGradient3 }}</span>
            </div>
          </div>
        </div>
        <div class="gradient-preview" :style="{
          background: `linear-gradient(160deg, ${settings.photoGradient1} 0%, ${settings.photoGradient2} 40%, ${settings.photoGradient3} 100%)`
        }"></div>
      </div>

      <div class="gradient-section">
        <h4>日间模式 - 工具站</h4>
        <div class="color-row">
          <div class="color-input-group">
            <label>渐变色 1（左上）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightToolGradient1" class="color-input" />
              <span class="color-value">{{ settings.lightToolGradient1 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 2（中间）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightToolGradient2" class="color-input" />
              <span class="color-value">{{ settings.lightToolGradient2 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 3（右下）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightToolGradient3" class="color-input" />
              <span class="color-value">{{ settings.lightToolGradient3 }}</span>
            </div>
          </div>
        </div>
        <div class="gradient-preview" :style="{
          background: `linear-gradient(160deg, ${settings.lightToolGradient1} 0%, ${settings.lightToolGradient2} 40%, ${settings.lightToolGradient3} 100%)`
        }"></div>
      </div>

      <div class="gradient-section">
        <h4>日间模式 - 摄影之家（解决发绿问题）</h4>
        <div class="color-row">
          <div class="color-input-group">
            <label>渐变色 1（左上）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightPhotoGradient1" class="color-input" />
              <span class="color-value">{{ settings.lightPhotoGradient1 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 2（中间）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightPhotoGradient2" class="color-input" />
              <span class="color-value">{{ settings.lightPhotoGradient2 }}</span>
            </div>
          </div>
          <div class="color-input-group">
            <label>渐变色 3（右下）</label>
            <div class="color-picker-wrap">
              <input type="color" v-model="settings.lightPhotoGradient3" class="color-input" />
              <span class="color-value">{{ settings.lightPhotoGradient3 }}</span>
            </div>
          </div>
        </div>
        <div class="gradient-preview" :style="{
          background: `linear-gradient(160deg, ${settings.lightPhotoGradient1} 0%, ${settings.lightPhotoGradient2} 40%, ${settings.lightPhotoGradient3} 100%)`
        }"></div>
      </div>
    </div>

    <!-- 器材配置管理 -->
    <div class="settings-section glass-dark">
      <h3>📷 器材配置管理</h3>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">
        管理分类、品牌、画幅、卡口选项。修改后所有前台页面自动同步。
      </p>

      <div class="equip-config-tabs">
        <button
          v-for="tab in equipConfigTabs"
          :key="tab.key"
          :class="{ active: activeEquipTab === tab.key }"
          @click="activeEquipTab = tab.key"
        >{{ tab.icon }} {{ tab.label }}</button>
      </div>

      <div v-if="activeEquipTab === 'categories'" class="equip-config-panel">
        <div class="config-list">
          <div v-for="(item, idx) in equipConfig.categories" :key="item.id" class="config-item">
            <input v-model="item.icon" class="config-icon-input" placeholder="图标" />
            <input v-model="item.name" class="config-input" placeholder="分类名称" />
            <input v-model="item.id" class="config-input small" placeholder="ID" />
            <button class="btn-remove-config" @click="equipConfig.categories.splice(idx, 1)">✕</button>
          </div>
        </div>
        <button class="btn-add-config" @click="equipConfig.categories.push({ id: '', name: '', icon: '📦' })">+ 添加分类</button>
      </div>

      <div v-if="activeEquipTab === 'brands'" class="equip-config-panel">
        <div class="config-list">
          <div v-for="(item, idx) in equipConfig.brands" :key="idx" class="config-item">
            <input v-model="item.value" class="config-input small" placeholder="英文值" />
            <input v-model="item.label" class="config-input" placeholder="中文名称" />
            <button class="btn-remove-config" @click="equipConfig.brands.splice(idx, 1)">✕</button>
          </div>
        </div>
        <button class="btn-add-config" @click="equipConfig.brands.push({ value: '', label: '' })">+ 添加品牌</button>
      </div>

      <div v-if="activeEquipTab === 'sensors'" class="equip-config-panel">
        <div class="config-list">
          <div v-for="(item, idx) in equipConfig.sensors" :key="idx" class="config-item">
            <input v-model="item.value" class="config-input small" placeholder="值" />
            <input v-model="item.label" class="config-input" placeholder="显示名称" />
            <button class="btn-remove-config" @click="equipConfig.sensors.splice(idx, 1)">✕</button>
          </div>
        </div>
        <button class="btn-add-config" @click="equipConfig.sensors.push({ value: '', label: '' })">+ 添加画幅</button>
      </div>

      <div v-if="activeEquipTab === 'mounts'" class="equip-config-panel">
        <div class="config-list">
          <div v-for="(item, idx) in equipConfig.mounts" :key="idx" class="config-item">
            <input v-model="item.value" class="config-input small" placeholder="值" />
            <input v-model="item.label" class="config-input" placeholder="显示名称" />
            <button class="btn-remove-config" @click="equipConfig.mounts.splice(idx, 1)">✕</button>
          </div>
        </div>
        <button class="btn-add-config" @click="equipConfig.mounts.push({ value: '', label: '' })">+ 添加卡口</button>
      </div>

      <div class="equip-config-actions">
        <button class="btn-secondary" @click="resetEquipConfig">恢复默认</button>
        <button class="btn-save-equip" @click="saveEquipConfig">保存配置</button>
        <span v-if="equipConfigSaved" class="save-success">✓ 已保存</span>
      </div>
    </div>

    <!-- Logo 管理 -->
    <div class="settings-section glass-dark">
      <h3>🖼️ Logo 管理</h3>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">上传 Logo 图片，用于器材库等位置的图标显示</p>

      <div class="logo-upload-grid">
        <div v-for="(logo, idx) in uploadedLogos" :key="idx" class="logo-item">
          <img :src="logo.url" class="logo-preview-img" />
          <span class="logo-name">{{ logo.name }}</span>
          <button class="btn-remove-logo" @click="removeLogo(idx)">✕</button>
        </div>
        <div class="logo-upload-card" @click="triggerLogoUpload">
          <span class="upload-icon">📷</span>
          <span class="upload-text">上传 Logo</span>
        </div>
      </div>
      <input ref="logoFileInput" type="file" accept="image/*" @change="handleLogoUpload" hidden />
    </div>

    <!-- 筛选栏配置 -->
    <div class="settings-section glass-dark">
      <h3>🔧 筛选栏配置</h3>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">
        按大分类管理各页面的筛选栏选项。点击大分类 → 子页面 → 编辑筛选组。
      </p>

      <div class="filter-config-layout">
        <div class="filter-col filter-col-cat">
          <div class="col-title">大分类</div>
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="col-item"
            :class="{ active: activeCatId === cat.id }"
            @click="selectCategory(cat.id)"
          >
            <span class="col-item-label">{{ cat.label }}</span>
            <span class="col-item-count">{{ cat.pageCount }}</span>
          </div>
        </div>

        <div class="filter-col filter-col-page">
          <div class="col-title">子页面</div>
          <template v-if="categoryPages.length">
            <div
              v-for="page in categoryPages"
              :key="page.id"
              class="col-item"
              :class="{ active: activePageId === page.id }"
              @click="selectPage(page.id)"
            >
              <span class="col-item-label">{{ page.label }}</span>
              <span class="col-item-count">{{ page.groupCount }} 组</span>
            </div>
          </template>
          <div v-else class="col-empty">← 选择大分类</div>
        </div>

        <div class="filter-col filter-col-detail">
          <div class="col-title">筛选组配置</div>
          <template v-if="activePageConfig">
            <div
              v-for="(group, gIdx) in activePageConfig.groups"
              :key="group.id"
              class="filter-group-editor"
              :class="{ expanded: expandedFilterGroup === gIdx }"
            >
              <div class="filter-group-header" @click="toggleFilterGroup(gIdx)">
                <div class="filter-group-title">
                  <span class="expand-arrow" :class="{ open: expandedFilterGroup === gIdx }">▶</span>
                  <span class="group-name">{{ group.label }}</span>
                  <span class="option-count">{{ group.options.length }} 项</span>
                </div>
                <button class="btn-icon btn-danger" @click.stop="removeFilterGroupUI(gIdx)" title="删除筛选组">🗑️</button>
              </div>

              <div v-show="expandedFilterGroup === gIdx" class="filter-group-body">
                <div class="filter-options-list">
                  <div
                    v-for="(opt, oIdx) in group.options"
                    :key="oIdx"
                    class="filter-option-row"
                  >
                    <input v-model="opt.value" class="inline-input small" placeholder="值" @change="onFilterChange" />
                    <input v-model="opt.label" class="inline-input" placeholder="显示名称" @change="onFilterChange" />
                    <button class="btn-icon btn-danger-sm" @click="removeFilterOptionUI(gIdx, oIdx)" title="删除">✕</button>
                  </div>
                  <button class="btn-add-option" @click="addFilterOptionUI(gIdx)">+ 添加选项</button>
                </div>
              </div>
            </div>

            <div class="add-filter-group-row">
              <input v-model="newGroupLabel" class="inline-input" placeholder="新筛选组名称" />
              <input v-model="newGroupId" class="inline-input small" placeholder="ID" />
              <button class="btn-add-group" @click="addFilterGroupUI">+ 添加筛选组</button>
            </div>
          </template>
          <div v-else class="col-empty">← 选择子页面</div>
        </div>
      </div>

      <div class="filter-config-actions">
        <button class="btn-secondary" @click="resetFilters">恢复默认</button>
        <span v-if="filterSaved" class="save-success">✓ 已保存</span>
      </div>
    </div>

    <div class="save-bar">
      <button class="btn-save" @click="saveSettings" :disabled="saving">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
      <span v-if="saved" class="save-success">✓ 设置已保存</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { loadEquipmentConfig, saveEquipmentConfig, defaultEquipmentConfig } from '@/config/equipmentConfig'
import { getSettings as apiGetSettings, saveSettings as apiSaveSettings } from '@/api/content'

const saved = ref(false)
const saving = ref(false)
const loading = ref(true)

// ===== 设置持久化 =====
const SETTINGS_KEY = 'phototool_settings_data'

const settings = reactive({
  siteTitle: '汇相-摄影之家',
  siteDescription: '为摄影师打造的在线工具平台，提供EXIF查看、色彩分析、构图辅助等多种实用工具。',
  signMinPoints: 5,
  signMaxPoints: 20,
  postReward: 10,
  commentReward: 2,
  maxSignPerDay: 1,
  continuousBonus: 5,
  allowRegister: true,
  emailVerify: false,
  commentReview: false,
  bgOpacity: 0.3,
  gauzeOpacity: 0.5,
  gauzeBlur: 0,
  toolGradient1: '#0a0e1a',
  toolGradient2: '#111827',
  toolGradient3: '#0f172a',
  photoGradient1: '#1a0f05',
  photoGradient2: '#1c1410',
  photoGradient3: '#160e08',
  lightToolGradient1: '#d8eaf5',
  lightToolGradient2: '#c8e0f0',
  lightToolGradient3: '#c0d8ea',
  lightPhotoGradient1: '#e8e0d0',
  lightPhotoGradient2: '#e0d8c8',
  lightPhotoGradient3: '#d8d0c0',
})

// 从 API 加载设置
const loadSavedSettings = async () => {
  loading.value = true
  try {
    const data = await apiGetSettings()
    if (data.settings) {
      Object.assign(settings, data.settings)
    }
  } catch (e) {
    console.warn('Failed to load settings from API, trying localStorage:', e)
    // fallback 到 localStorage
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY)
      if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings))
      }
    } catch {}
  } finally {
    loading.value = false
  }
}

loadSavedSettings()

const levelConfig = [
  { level: 1, required: 0, privilege: '基础功能' },
  { level: 2, required: 100, privilege: '解锁参数计算器' },
  { level: 3, required: 300, privilege: '解锁批量裁剪' },
  { level: 4, required: 600, privilege: '解锁焦点堆叠' },
  { level: 5, required: 1000, privilege: '解锁光线模拟器' },
  { level: 6, required: 1500, privilege: '专属标识' },
  { level: 7, required: 2500, privilege: '优先客服' },
  { level: 8, required: 4000, privilege: '高级功能全部解锁' },
  { level: 9, required: 6000, privilege: 'VIP专属通道' },
  { level: 10, required: 10000, privilege: '终身会员特权' },
]

const saveSettings = async () => {
  saving.value = true
  try {
    // 保存到 API
    await apiSaveSettings(settings)
    // 也保存到 localStorage 作为本地缓存
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  
    document.documentElement.style.setProperty('--bg-opacity', settings.bgOpacity)
    document.documentElement.style.setProperty('--gauze-opacity', settings.gauzeOpacity)
    document.documentElement.style.setProperty('--gauze-blur', settings.gauzeBlur + 'px')

    const toolStyle = document.getElementById('dynamic-gradient-style')
    if (!toolStyle) {
      const style = document.createElement('style')
      style.id = 'dynamic-gradient-style'
      document.head.appendChild(style)
    }

    const el = document.getElementById('dynamic-gradient-style')
    el.textContent = `
      .tool-mode {
        background: linear-gradient(160deg, ${settings.toolGradient1} 0%, ${settings.toolGradient2} 40%, ${settings.toolGradient3} 100%) !important;
      }
      .photo-mode {
        background: linear-gradient(160deg, ${settings.photoGradient1} 0%, ${settings.photoGradient2} 40%, ${settings.photoGradient3} 100%) !important;
      }
      body.light-theme .app-container.tool-mode {
        background: linear-gradient(160deg, ${settings.lightToolGradient1} 0%, ${settings.lightToolGradient2} 40%, ${settings.lightToolGradient3} 100%) !important;
      }
      body.light-theme .app-container.photo-mode {
        background: linear-gradient(160deg, ${settings.lightPhotoGradient1} 0%, ${settings.lightPhotoGradient2} 40%, ${settings.lightPhotoGradient3} 100%) !important;
      }
    `

    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

// ===== 筛选栏配置 =====
const { config: filterConfig, getAllCategories, getPagesByCategory, getFilterConfig, removeFilterGroup, addFilterGroup, resetToDefault } = useFilterConfig()

const categories = computed(() => getAllCategories())
const activeCatId = ref(null)
const activePageId = ref(null)
const filterSaved = ref(false)
const newGroupLabel = ref('')
const newGroupId = ref('')
const expandedFilterGroup = ref(null)

const categoryPages = computed(() => {
  if (!activeCatId.value) return []
  return getPagesByCategory(activeCatId.value)
})

const activePageConfig = computed(() => {
  if (!activeCatId.value || !activePageId.value) return null
  return getFilterConfig(activeCatId.value, activePageId.value)
})

const selectCategory = (catId) => {
  activeCatId.value = catId
  activePageId.value = null
  expandedFilterGroup.value = null
}

const selectPage = (pageId) => {
  activePageId.value = pageId
  expandedFilterGroup.value = null
}

const onFilterChange = () => {
  localStorage.setItem('filterConfigV2', JSON.stringify(filterConfig))
  filterSaved.value = true
  setTimeout(() => { filterSaved.value = false }, 2000)
}

const removeFilterGroupUI = (gIdx) => {
  const group = activePageConfig.value.groups[gIdx]
  if (confirm(`确定删除筛选组「${group.label}」？`)) {
    removeFilterGroup(activeCatId.value, activePageId.value, group.id)
    onFilterChange()
  }
}

const removeFilterOptionUI = (gIdx, oIdx) => {
  activePageConfig.value.groups[gIdx].options.splice(oIdx, 1)
  onFilterChange()
}

const addFilterOptionUI = (gIdx) => {
  activePageConfig.value.groups[gIdx].options.push({ value: 'new', label: '新选项' })
  onFilterChange()
}

const addFilterGroupUI = () => {
  if (!newGroupId.value || !newGroupLabel.value) return
  addFilterGroup(activeCatId.value, activePageId.value, {
    id: newGroupId.value,
    label: newGroupLabel.value,
    type: 'buttons',
    options: [{ value: 'all', label: '全部' }]
  })
  newGroupLabel.value = ''
  newGroupId.value = ''
  onFilterChange()
}

const toggleFilterGroup = (gIdx) => {
  expandedFilterGroup.value = expandedFilterGroup.value === gIdx ? null : gIdx
}

const resetFilters = () => {
  if (confirm('确定恢复所有筛选栏为默认配置？')) {
    resetToDefault()
    onFilterChange()
  }
}

// ===== Logo 管理 =====
const logoFileInput = ref(null)
const uploadedLogos = ref(JSON.parse(localStorage.getItem('uploadedLogos') || '[]'))

const triggerLogoUpload = () => {
  logoFileInput.value?.click()
}

const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    alert('Logo 文件不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    uploadedLogos.value.push({ name: file.name, url: ev.target.result })
    localStorage.setItem('uploadedLogos', JSON.stringify(uploadedLogos.value))
  }
  reader.readAsDataURL(file)
}

const removeLogo = (idx) => {
  uploadedLogos.value.splice(idx, 1)
  localStorage.setItem('uploadedLogos', JSON.stringify(uploadedLogos.value))
}

// ===== 器材配置管理 =====
const equipConfig = reactive(loadEquipmentConfig())
const activeEquipTab = ref('categories')
const equipConfigSaved = ref(false)

const equipConfigTabs = [
  { key: 'categories', label: '分类管理', icon: '📂' },
  { key: 'brands', label: '品牌管理', icon: '🏷️' },
  { key: 'sensors', label: '画幅管理', icon: '📐' },
  { key: 'mounts', label: '卡口管理', icon: '🔌' },
]

const saveEquipConfig = () => {
  saveEquipmentConfig(JSON.parse(JSON.stringify(equipConfig)))
  equipConfigSaved.value = true
  setTimeout(() => { equipConfigSaved.value = false }, 3000)
}

const resetEquipConfig = () => {
  if (confirm('确定恢复器材配置为默认值？')) {
    Object.assign(equipConfig, JSON.parse(JSON.stringify(defaultEquipmentConfig)))
    saveEquipmentConfig(JSON.parse(JSON.stringify(equipConfig)))
    equipConfigSaved.value = true
    setTimeout(() => { equipConfigSaved.value = false }, 3000)
  }
}
</script>

<style scoped>
.settings { display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
.glass-dark { background: #fff; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 24px; }
.settings-section h3 { color: #333; font-size: 16px; font-weight: 500; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.08); }
.loading-state { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; color: #333; font-size: 13px; margin-bottom: 8px; }
.form-group input, .form-group textarea { width: 100%; padding: 12px 14px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; color: #333; font-size: 14px; outline: none; transition: all 0.3s; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: rgba(94, 129, 244, 0.5); background: #f0f2f5; }
.form-group textarea { resize: vertical; min-height: 80px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.logo-preview { display: flex; align-items: center; gap: 16px; }
.logo-icon { font-size: 48px; width: 70px; height: 70px; background: #f5f7fa; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.btn-change { padding: 8px 16px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #6b7280; font-size: 13px; cursor: pointer; }
.level-table { display: flex; flex-direction: column; gap: 4px; }
.level-row { display: grid; grid-template-columns: 80px 100px 1fr; gap: 16px; padding: 10px 12px; border-radius: 8px; align-items: center; }
.level-row.header { color: #6b7280; font-size: 12px; font-weight: 500; }
.level-row:not(.header) { background: #fff; }
.level-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; text-align: center; }
.level-1, .level-2 { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
.level-3, .level-4 { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.level-5, .level-6 { background: rgba(94, 129, 244, 0.15); color: #5e81f4; }
.level-7, .level-8 { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.level-9, .level-10 { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.points { color: #fbbf24; font-size: 14px; }
.privilege { color: #6b7280; font-size: 13px; }
.toggle-label { display: flex !important; justify-content: space-between; align-items: center; cursor: pointer; }
.toggle-label span { color: #333; font-size: 14px; }
.toggle { width: 44px; height: 24px; background: #f0f2f5; border-radius: 12px; position: relative; cursor: pointer; transition: all 0.3s; }
.toggle.active { background: linear-gradient(135deg, #5e81f4, #8b5cf6); }
.toggle-thumb { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: all 0.3s; }
.toggle.active .toggle-thumb { left: 23px; }
.save-bar { display: flex; align-items: center; gap: 16px; }
.btn-save { padding: 12px 32px; background: linear-gradient(135deg, #5e81f4, #8b5cf6); border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(94, 129, 244, 0.4); }
.save-success { color: #4ade80; font-size: 14px; }
.range-input { width: 100%; height: 6px; -webkit-appearance: none; appearance: none; background: rgba(255, 255, 255, 0.15); border-radius: 3px; outline: none; }
.range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #5e81f4; cursor: pointer; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); }
.gradient-section { margin-bottom: 24px; padding: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.06); }
.gradient-section h4 { color: #6b7280; font-size: 13px; font-weight: 500; margin-bottom: 14px; }
.color-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.color-input-group label { font-size: 11px !important; margin-bottom: 6px !important; }
.color-picker-wrap { display: flex; align-items: center; gap: 8px; }
.color-input { width: 36px !important; height: 36px; padding: 2px !important; border-radius: 8px !important; cursor: pointer; background: transparent !important; border: 1px solid rgba(255, 255, 255, 0.15) !important; }
.color-input::-webkit-color-swatch-wrapper { padding: 2px; }
.color-input::-webkit-color-swatch { border: none; border-radius: 5px; }
.color-value { color: #9ca3af; font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace; }
.gradient-preview { height: 40px; border-radius: 8px; margin-top: 12px; border: 1px solid rgba(0,0,0,0.1); }
.logo-upload-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
.logo-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px; background: #f8f9fa; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08); position: relative; }
.logo-preview-img { width: 60px; height: 60px; object-fit: contain; border-radius: 6px; }
.logo-name { font-size: 11px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; text-align: center; }
.btn-remove-logo { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(239, 68, 68, 0.1); border: none; color: #e53e3e; border-radius: 50%; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-remove-logo:hover { background: rgba(239, 68, 68, 0.2); }
.logo-upload-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px; background: #fff; border: 2px dashed rgba(94, 129, 244, 0.3); border-radius: 10px; cursor: pointer; transition: all 0.2s; min-height: 100px; }
.logo-upload-card:hover { border-color: rgba(94, 129, 244, 0.6); background: rgba(94, 129, 244, 0.05); }
.upload-icon { font-size: 28px; }
.upload-text { font-size: 12px; color: #5e81f4; font-weight: 500; }
.filter-config-layout { display: grid; grid-template-columns: 180px 200px 1fr; gap: 0; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; min-height: 320px; }
.filter-col { display: flex; flex-direction: column; }
.filter-col-cat, .filter-col-page { border-right: 1px solid rgba(0,0,0,0.08); background: #f8f9fa; }
.filter-col-detail { background: #fff; padding: 0; overflow-y: auto; max-height: 500px; }
.col-title { padding: 10px 14px; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(0,0,0,0.06); background: #f0f2f5; }
.col-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: all 0.15s; border-bottom: 1px solid rgba(0,0,0,0.04); }
.col-item:hover { background: rgba(94, 129, 244, 0.06); }
.col-item.active { background: rgba(94, 129, 244, 0.12); color: #5e81f4; font-weight: 500; }
.col-item-label { font-size: 13px; color: #333; }
.col-item.active .col-item-label { color: #5e81f4; }
.col-item-count { font-size: 11px; color: #9ca3af; background: #e5e7eb; padding: 1px 8px; border-radius: 10px; }
.col-item.active .col-item-count { background: rgba(94, 129, 244, 0.15); color: #5e81f4; }
.col-empty { padding: 30px 14px; text-align: center; color: #bbb; font-size: 13px; }
.filter-col-detail .filter-group-editor { border: none; border-bottom: 1px solid rgba(0,0,0,0.06); border-radius: 0; margin-bottom: 0; }
.filter-group-editor { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; margin-bottom: 8px; overflow: hidden; transition: all 0.2s; }
.filter-group-editor.expanded { border-color: rgba(94, 129, 244, 0.3); box-shadow: 0 2px 8px rgba(94, 129, 244, 0.08); }
.filter-group-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; cursor: pointer; transition: background 0.2s; user-select: none; }
.filter-group-header:hover { background: #f8f9fa; }
.filter-group-title { display: flex; align-items: center; gap: 8px; }
.expand-arrow { font-size: 10px; color: #9ca3af; transition: transform 0.2s; display: inline-block; }
.expand-arrow.open { transform: rotate(90deg); color: #5e81f4; }
.group-name { font-size: 13px; font-weight: 600; color: #333; }
.option-count { font-size: 11px; color: #9ca3af; background: #f5f7fa; padding: 2px 8px; border-radius: 10px; }
.filter-group-body { padding: 0 14px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
.filter-group-body .filter-options-list { padding-top: 12px; }
.filter-options-list { display: flex; flex-direction: column; gap: 6px; }
.filter-option-row { display: flex; gap: 6px; align-items: center; }
.inline-input { padding: 5px 10px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; color: #333; font-size: 13px; outline: none; transition: all 0.2s; }
.inline-input:focus { border-color: rgba(94, 129, 244, 0.5); }
.inline-input.small { width: 100px; flex-shrink: 0; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 6px; transition: all 0.2s; }
.btn-icon:hover { background: rgba(255, 255, 255, 0.1); }
.btn-danger-sm { color: #6b7280; font-size: 12px; }
.btn-danger-sm:hover { color: #ef4444; }
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
.btn-add-option { background: none; border: 1px dashed rgba(0,0,0,0.12); border-radius: 6px; color: #6b7280; font-size: 12px; padding: 5px 10px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
.btn-add-option:hover { border-color: rgba(94, 129, 244, 0.4); color: #5e81f4; }
.add-filter-group-row { display: flex; gap: 8px; align-items: center; margin-top: 12px; padding: 14px; border-top: 1px solid rgba(0,0,0,0.06); }
.btn-add-group { padding: 6px 14px; background: rgba(94, 129, 244, 0.1); border: 1px solid rgba(94, 129, 244, 0.2); border-radius: 8px; color: #5e81f4; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-add-group:hover { background: rgba(94, 129, 244, 0.2); }
.filter-config-actions { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.btn-secondary { padding: 8px 16px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #6b7280; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: #f0f2f5; color: #333; }
.equip-config-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.equip-config-tabs button { padding: 8px 16px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: #f5f7fa; color: #6b7280; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.equip-config-tabs button.active { background: rgba(94, 129, 244, 0.12); border-color: #5e81f4; color: #5e81f4; font-weight: 500; }
.equip-config-tabs button:hover:not(.active) { background: #f0f2f5; color: #333; }
.equip-config-panel { background: #f8f9fa; border: 1px solid rgba(0,0,0,0.06); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
.config-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; max-height: 300px; overflow-y: auto; }
.config-item { display: flex; gap: 8px; align-items: center; }
.config-icon-input { width: 50px; padding: 6px 8px; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; font-size: 16px; text-align: center; background: #fff; outline: none; color: #333; }
.config-icon-input:focus { border-color: rgba(94, 129, 244, 0.5); }
.config-input { flex: 1; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; font-size: 13px; background: #fff; outline: none; color: #333; }
.config-input.small { width: 100px; flex-shrink: 0; }
.config-input:focus { border-color: rgba(94, 129, 244, 0.5); }
.btn-remove-config { width: 28px; height: 28px; border: none; background: rgba(239, 68, 68, 0.1); color: #e53e3e; border-radius: 6px; cursor: pointer; font-size: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.btn-remove-config:hover { background: rgba(239, 68, 68, 0.2); }
.btn-add-config { padding: 8px 14px; background: rgba(94, 129, 244, 0.08); border: 1px dashed rgba(94, 129, 244, 0.3); border-radius: 6px; color: #5e81f4; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.btn-add-config:hover { background: rgba(94, 129, 244, 0.15); }
.equip-config-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.btn-save-equip { padding: 8px 20px; background: linear-gradient(135deg, #5e81f4, #8b5cf6); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-save-equip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(94, 129, 244, 0.3); }
</style>
