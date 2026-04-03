<template>
  <div class="tool-manage">
    <div class="toolbar">
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="搜索工具名称..." />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-if="error" class="error-state">{{ error }}</div>

    <div v-if="!loading" class="table-container glass-dark">
      <table class="data-table">
        <thead>
          <tr>
            <th>图标</th>
            <th>名称</th>
            <th>类型</th>
            <th>等级限制</th>
            <th>积分费用</th>
            <th>使用次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tool in filteredTools" :key="tool.id">
            <td>
              <div class="tool-icon">
                <img v-if="tool.iconType === 'image'" :src="tool.icon" class="tool-icon-img" />
                <span v-else>{{ tool.icon }}</span>
              </div>
            </td>
            <td class="text-white">{{ tool.name }}</td>
            <td>
              <span class="type-badge" :class="tool.toolType">
                {{ tool.toolType === 'builtin' ? '内置' : '外部' }}
              </span>
            </td>
            <td>
              <span class="level-badge" :class="tool.levelLimit > 0 ? 'limited' : 'free'">
                {{ tool.levelLimit > 0 ? `Lv.${tool.levelLimit}+` : '免费' }}
              </span>
            </td>
            <td>
              <span class="points-badge" :class="tool.pointsCost > 0 ? 'paid' : 'free'">
                {{ tool.pointsCost > 0 ? `${tool.pointsCost} 积分` : '免费' }}
              </span>
            </td>
            <td class="usage">{{ tool.usageCount || 0 }}</td>
            <td>
              <span class="status-badge" :class="tool.enabled ? 'enabled' : 'disabled'">
                {{ tool.enabled ? '启用' : '禁用' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="editTool(tool)">编辑</button>
                <button 
                  class="btn-toggle" 
                  :class="{ disable: tool.enabled }"
                  @click="toggleTool(tool)"
                >{{ tool.enabled ? '禁用' : '启用' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredTools.length === 0" class="empty-hint">暂无工具数据</div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal glass-dark">
        <h3>编辑工具</h3>
        <div class="form-group">
          <label>工具名称</label>
          <input v-model="editingTool.name" type="text" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="editingTool.description" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>类型</label>
          <select v-model="editingTool.toolType">
            <option value="builtin">内置工具</option>
            <option value="external">外部链接</option>
          </select>
        </div>
        <div class="form-group">
          <label>等级限制</label>
          <select v-model.number="editingTool.levelLimit">
            <option :value="0">免费（无限制）</option>
            <option v-for="n in 10" :key="n" :value="n">Lv.{{ n }}+</option>
          </select>
        </div>
        <div class="form-group">
          <label>积分费用（每次使用）</label>
          <div class="points-input-row">
            <input v-model.number="editingTool.pointsCost" type="number" min="0" placeholder="0" />
            <div class="points-quick-btns">
              <button v-for="n in [0, 1, 5, 10, 20, 50]" :key="n" 
                class="points-quick-btn"
                :class="{ active: editingTool.pointsCost === n }"
                @click="editingTool.pointsCost = n"
              >{{ n === 0 ? '免费' : n }}</button>
            </div>
          </div>
          <p class="icon-tip">设置为 0 表示免费使用，用户每次使用将消耗对应积分</p>
        </div>
        <div class="form-group">
          <label>图标</label>
          <div class="icon-selector">
            <span 
              v-for="icon in iconOptions" 
              :key="icon"
              class="icon-option"
              :class="{ selected: editingTool.icon === icon }"
              @click="editingTool.icon = icon"
            >{{ icon }}</span>
            <div 
              class="icon-option upload-btn"
              :class="{ selected: editingTool.iconType === 'image' }"
              @click="triggerUpload"
            >
              <span v-if="editingTool.iconType === 'image' && editingTool.icon">
                <img :src="editingTool.icon" class="uploaded-preview" />
              </span>
              <span v-else>➕</span>
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*" 
                class="hidden-input"
                @change="handleIconUpload"
              />
            </div>
          </div>
          <p class="icon-tip">点击 ➕ 上传自定义图标（支持 PNG/JPG/SVG，建议 64×64px）</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-save" @click="saveTool" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminList, createAdminItem, updateAdminItem, deleteAdminItem } from '@/api/content'

const searchQuery = ref('')
const showEditModal = ref(false)
const editingTool = ref({})
const fileInput = ref(null)
const tools = ref([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const iconOptions = ['📸', '🎨', '📐', '🔧', '📊', '🖼️', '✂️', '🔍', '💡', '🎯']

const loadTools = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getAdminList('tools')
    tools.value = (res.items || []).map(item => ({
      id: item.id,
      icon: item.icon || '🔧',
      iconType: item.icon && item.icon.startsWith('data:') ? 'image' : 'emoji',
      name: item.name || '',
      description: item.description || '',
      toolType: item.is_external ? 'external' : 'builtin',
      levelLimit: item.level_limit || 0,
      pointsCost: item.points_cost || 0,
      usageCount: item.usage_count || 0,
      enabled: item.enabled !== 0 && item.enabled !== false,
      sortOrder: item.sort_order || 0,
    }))
  } catch (e) {
    error.value = '加载工具列表失败: ' + e.message
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredTools = computed(() => {
  if (!searchQuery.value) return tools.value
  const query = searchQuery.value.toLowerCase()
  return tools.value.filter(t => t.name.toLowerCase().includes(query))
})

const editTool = (tool) => {
  editingTool.value = { ...tool }
  showEditModal.value = true
}

const saveTool = async () => {
  saving.value = true
  try {
    const payload = {
      name: editingTool.value.name,
      description: editingTool.value.description || '',
      icon: editingTool.value.icon || '🔧',
      is_external: editingTool.value.toolType === 'external' ? 1 : 0,
      level_limit: editingTool.value.levelLimit || 0,
      points_cost: editingTool.value.pointsCost || 0,
      enabled: editingTool.value.enabled ? 1 : 0,
      sort_order: editingTool.value.sortOrder || 0,
    }

    await updateAdminItem('tools', editingTool.value.id, payload)

    // 更新本地数据
    const idx = tools.value.findIndex(t => t.id === editingTool.value.id)
    if (idx > -1) {
      tools.value[idx] = { ...tools.value[idx], ...editingTool.value }
    }
    showEditModal.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const toggleTool = async (tool) => {
  try {
    const newState = !tool.enabled
    await updateAdminItem('tools', tool.id, { enabled: newState ? 1 : 0 })
    tool.enabled = newState
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleIconUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return }
  if (file.size > 2 * 1024 * 1024) { alert('图片大小不能超过 2MB'); return }

  const reader = new FileReader()
  reader.onload = (e) => {
    editingTool.value.icon = e.target.result
    editingTool.value.iconType = 'image'
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

onMounted(() => loadTools())
</script>

<style scoped>
.tool-manage { display: flex; flex-direction: column; gap: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.search-box { position: relative; width: 280px; }
.search-box input { width: 100%; padding: 10px 16px 10px 40px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; color: #333; font-size: 14px; outline: none; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); }
.loading-state, .error-state { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.error-state { color: #ef4444; }
.glass-dark { background: #fff; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 20px; }
.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { color: #333; font-size: 13px; font-weight: 500; text-align: left; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.08); }
.data-table td { color: #6b7280; font-size: 14px; padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
.data-table tr:hover td { background: #fff; }
.text-white { color: #333!important; }
.tool-icon { font-size: 28px; width: 48px; height: 48px; background: #f5f7fa; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.type-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.type-badge.builtin { background: rgba(94, 129, 244, 0.15); color: #5e81f4; }
.type-badge.external { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
.level-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.level-badge.free { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.level-badge.limited { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.points-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.points-badge.free { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.points-badge.paid { background: rgba(251, 191, 36, 0.15); color: #d97706; }
.usage { color: #4ade80 !important; }
.status-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.status-badge.enabled { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.status-badge.disabled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.action-btns { display: flex; gap: 6px; }
.action-btns button { padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; border: none; transition: all 0.2s; }
.btn-edit { background: rgba(94, 129, 244, 0.15); color: #5e81f4; border: 1px solid rgba(94, 129, 244, 0.3) !important; }
.btn-toggle { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3) !important; }
.btn-toggle.disable { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3) !important; }
.empty-hint { text-align: center; padding: 30px; color: #9ca3af; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 450px; padding: 24px; max-height: 90vh; overflow-y: auto; }
.modal h3 { color: #333; font-size: 18px; margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; color: #333; font-size: 13px; margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 14px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #333; font-size: 14px; outline: none; }
.form-group select option { background: #f8f9fa; }
.icon-selector { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-option { font-size: 24px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #f5f7fa; border: 2px solid transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.icon-option:hover { background: #f0f2f5; }
.icon-option.selected { border-color: #5e81f4; background: rgba(94, 129, 244, 0.15); }
.upload-btn { position: relative; overflow: hidden; }
.hidden-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }
.uploaded-preview { width: 28px; height: 28px; object-fit: contain; border-radius: 4px; }
.tool-icon-img { width: 32px; height: 32px; object-fit: contain; border-radius: 4px; }
.icon-tip { font-size: 12px; color: #9ca3af; margin-top: 6px; }
.points-input-row { display: flex; flex-direction: column; gap: 8px; }
.points-input-row input { width: 100%; padding: 10px 14px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #333; font-size: 14px; outline: none; }
.points-quick-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.points-quick-btn { padding: 5px 14px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #6b7280; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.points-quick-btn:hover { background: rgba(251, 191, 36, 0.08); color: #d97706; }
.points-quick-btn.active { background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.4); color: #d97706; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-cancel { padding: 8px 20px; background: #f5f7fa; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; color: #6b7280; cursor: pointer; }
.btn-save { padding: 8px 20px; background: linear-gradient(135deg, #5e81f4, #8b5cf6); border: none; border-radius: 8px; color: #fff; cursor: pointer; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
