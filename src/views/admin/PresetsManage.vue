<template>
  <div class="manage-page">
    <div class="page-header">
      <h2>🎨 调色预设管理</h2>
      <button class="btn-primary" @click="openAdd">+ 添加预设</button>
    </div>
    <div class="filter-bar">
      <input v-model="searchQuery" placeholder="搜索预设名称..." class="search-input" />
    </div>
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-if="error" class="error-state">{{ error }}</div>
    <div v-if="!loading" class="item-list">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <div class="item-color" :style="{ background: item.gradient || item.cover_image || 'linear-gradient(135deg, #667eea, #764ba2)' }"></div>
        <div class="item-info">
          <h4>{{ item.name || item.title }}</h4>
          <span class="item-style">{{ item.styleLabel || item.category || '' }}</span>
          <span class="item-downloads">⬇ {{ item.downloads || 0 }}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" @click="openEdit(item)">编辑</button>
          <button class="btn-delete" @click="deleteItem(item)">删除</button>
        </div>
      </div>
      <div v-if="filteredItems.length === 0" class="empty-hint">暂无预设数据</div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editingItem.id ? '编辑预设' : '添加预设' }}</h3>
        <div class="form-group"><label>名称</label><input v-model="editingItem.name" /></div>
        <div class="form-row">
          <div class="form-group"><label>风格</label>
            <select v-model="editingItem.style">
              <option value="japanese">日系</option><option value="film">胶片</option>
              <option value="cyber">赛博</option><option value="vintage">复古</option>
              <option value="fresh">清新</option><option value="bw">黑白</option>
            </select>
          </div>
          <div class="form-group"><label>风格标签</label><input v-model="editingItem.styleLabel" /></div>
        </div>
        <div class="form-group"><label>渐变色</label><input v-model="editingItem.gradient" placeholder="linear-gradient(...)" /></div>
        <div class="form-group"><label>描述</label><textarea v-model="editingItem.description" rows="2"></textarea></div>
        <div class="form-group"><label>标签（逗号分隔）</label><input v-model="tagsText" /></div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-save" @click="saveItem" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPresets, createPreset, updatePreset, deletePreset } from '@/api/content'

const items = ref([])
const searchQuery = ref('')
const showModal = ref(false)
const editingItem = ref({})
const tagsText = ref('')
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const loadItems = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getPresets({ limit: 100 })
    items.value = (res.items || []).map(item => ({
      ...item,
      name: item.title || item.name,
      styleLabel: item.category || item.styleLabel || '',
      gradient: item.cover_image || item.gradient || 'linear-gradient(135deg, #667eea, #764ba2)',
    }))
  } catch (e) {
    error.value = '加载预设列表失败: ' + e.message
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(i => (i.name || i.title || '').toLowerCase().includes(q))
})

const openAdd = () => { editingItem.value = { style: 'japanese', styleLabel: '日系', downloads: 0, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' }; tagsText.value = ''; showModal.value = true }
const openEdit = (item) => { editingItem.value = { ...item }; tagsText.value = (item.tags || []).join(','); showModal.value = true }

const saveItem = async () => {
  if (!editingItem.value.name) return alert('请输入名称')
  const tags = tagsText.value.split(',').map(t => t.trim()).filter(Boolean)

  saving.value = true
  try {
    const payload = {
      title: editingItem.value.name,
      description: editingItem.value.description || '',
      category: editingItem.value.style || 'japanese',
      tags,
      coverImage: editingItem.value.gradient || '',
      presetData: {
        styleLabel: editingItem.value.styleLabel || '',
        gradient: editingItem.value.gradient || '',
        downloads: editingItem.value.downloads || 0,
      },
    }

    if (editingItem.value.id) {
      await updatePreset(editingItem.value.id, payload)
    } else {
      await createPreset(payload)
    }
    await loadItems()
    showModal.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item) => {
  if (!confirm(`确定删除「${item.name || item.title}」？`)) return
  try {
    await deletePreset(item.id)
    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(() => loadItems())
</script>
<style scoped>
.manage-page{padding:24px;color:#1e2e3a}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.page-header h2{font-size:22px}.btn-primary{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.filter-bar{margin-bottom:16px}.search-input{width:100%;padding:10px 14px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;background:rgba(255,255,255,0.8)}.item-card{display:flex;align-items:center;gap:16px;padding:12px;background:rgba(255,255,255,0.8);border-radius:10px;margin-bottom:10px}.item-color{width:60px;height:40px;border-radius:8px;flex-shrink:0}.item-info{flex:1;min-width:0}.item-info h4{font-size:14px;margin-bottom:2px}.item-style{font-size:12px;color:#666;margin-right:8px}.item-downloads{font-size:12px;color:#888}.item-actions{display:flex;gap:8px}.btn-edit{background:rgba(59,130,246,0.15);color:#3b82f6;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.btn-delete{background:rgba(239,68,68,0.15);color:#ef4444;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}.modal-card{background:#fff;border-radius:16px;padding:24px;width:520px;max-height:80vh;overflow-y:auto}.modal-card h3{margin-bottom:20px}.form-group{margin-bottom:14px}.form-group label{display:block;font-size:13px;color:#666;margin-bottom:4px}.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;box-sizing:border-box}.form-row{display:flex;gap:16px}.form-row .form-group{flex:1}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}.btn-cancel{background:#f3f4f6;border:1px solid #ddd;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save:disabled{opacity:0.6;cursor:not-allowed}.loading-state,.error-state{text-align:center;padding:40px;color:#9ca3af;font-size:14px}.error-state{color:#ef4444}.empty-hint{text-align:center;padding:40px;color:#9ca3af;font-size:14px}
</style>
