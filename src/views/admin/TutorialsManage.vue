<template>
  <div class="manage-page">
    <div class="page-header"><h2>📖 教程管理</h2><button class="btn-primary" @click="openAdd">+ 添加教程</button></div>
    <div class="filter-bar"><input v-model="searchQuery" placeholder="搜索教程..." class="search-input" /></div>
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-if="error" class="error-state">{{ error }}</div>
    <div v-if="!loading" class="item-list">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <div class="item-color" :style="{ background: item.coverGradient || item.cover_image || 'linear-gradient(135deg, #667eea, #764ba2)' }"></div>
        <div class="item-info"><h4>{{ item.title }}</h4><span class="item-meta">{{ item.categoryLabel || '' }} · {{ item.difficultyLabel || '' }} · {{ item.readTime || '' }}</span></div>
        <div class="item-actions"><button class="btn-edit" @click="openEdit(item)">编辑</button><button class="btn-delete" @click="deleteItem(item)">删除</button></div>
      </div>
      <div v-if="filteredItems.length === 0" class="empty-hint">暂无教程数据</div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editingItem.id ? '编辑教程' : '添加教程' }}</h3>
        <div class="form-group"><label>标题</label><input v-model="editingItem.title" /></div>
        <div class="form-group"><label>摘要</label><textarea v-model="editingItem.summary" rows="2"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>分类</label><select v-model="editingItem.category"><option value="basic">入门</option><option value="advanced">进阶</option><option value="post">后期</option><option value="gear">器材</option><option value="composition">构图</option></select></div>
          <div class="form-group"><label>难度</label><select v-model="editingItem.difficulty"><option value="beginner">初级</option><option value="intermediate">中级</option><option value="expert">高级</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>作者</label><input v-model="editingItem.author" /></div>
          <div class="form-group"><label>阅读时间</label><input v-model="editingItem.readTime" placeholder="15分钟" /></div>
        </div>
        <div class="form-group"><label>封面渐变色</label><input v-model="editingItem.coverGradient" /></div>
        <div class="form-group"><label>标签（逗号分隔）</label><input v-model="tagsText" /></div>
        <div class="modal-actions"><button class="btn-cancel" @click="showModal = false">取消</button><button class="btn-save" @click="saveItem" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTutorials, createTutorial, updateTutorial, deleteTutorial } from '@/api/content'

const items = ref([])
const searchQuery = ref('')
const showModal = ref(false)
const editingItem = ref({})
const tagsText = ref('')
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const catLabels = { basic: '入门', advanced: '进阶', post: '后期', gear: '器材', composition: '构图' }
const diffLabels = { beginner: '初级', intermediate: '中级', expert: '高级' }

const loadItems = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getTutorials({ limit: 100 })
    items.value = (res.items || []).map(item => ({
      ...item,
      categoryLabel: item.categoryLabel || catLabels[item.category] || item.category || '',
      difficultyLabel: item.difficultyLabel || diffLabels[item.difficulty] || item.difficulty || '',
      readTime: item.read_time || item.readTime || '',
      coverGradient: item.cover_image || item.coverGradient || 'linear-gradient(135deg, #667eea, #764ba2)',
      likes: item.like_count || item.likes || 0,
    }))
  } catch (e) {
    error.value = '加载教程列表失败: ' + e.message
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(i => i.title.toLowerCase().includes(q))
})

const openAdd = () => { editingItem.value = { category: 'basic', difficulty: 'beginner', readTime: '10分钟', likes: 0, coverGradient: 'linear-gradient(135deg, #667eea, #764ba2)' }; tagsText.value = ''; showModal.value = true }
const openEdit = (item) => { editingItem.value = { ...item }; tagsText.value = (item.tags || []).join(','); showModal.value = true }

const saveItem = async () => {
  if (!editingItem.value.title) return alert('请输入标题')
  const tags = tagsText.value.split(',').map(t => t.trim()).filter(Boolean)

  saving.value = true
  try {
    const payload = {
      title: editingItem.value.title,
      content: editingItem.value.summary || editingItem.value.content || '',
      category: editingItem.value.category,
      tags,
      coverImage: editingItem.value.coverGradient || '',
    }

    if (editingItem.value.id) {
      await updateTutorial(editingItem.value.id, payload)
    } else {
      await createTutorial(payload)
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
  if (!confirm(`确定删除「${item.title}」？`)) return
  try {
    await deleteTutorial(item.id)
    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

onMounted(() => loadItems())
</script>
<style scoped>
.manage-page{padding:24px;color:#1e2e3a}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.page-header h2{font-size:22px}.btn-primary{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.filter-bar{margin-bottom:16px}.search-input{width:100%;padding:10px 14px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;background:rgba(255,255,255,0.8)}.item-card{display:flex;align-items:center;gap:16px;padding:12px;background:rgba(255,255,255,0.8);border-radius:10px;margin-bottom:10px}.item-color{width:80px;height:50px;border-radius:8px;flex-shrink:0}.item-info{flex:1}.item-info h4{font-size:14px;margin-bottom:2px}.item-meta{font-size:12px;color:#666}.item-actions{display:flex;gap:8px}.btn-edit{background:rgba(59,130,246,0.15);color:#3b82f6;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.btn-delete{background:rgba(239,68,68,0.15);color:#ef4444;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}.modal-card{background:#fff;border-radius:16px;padding:24px;width:520px;max-height:80vh;overflow-y:auto}.modal-card h3{margin-bottom:20px;color:#1e2e3a}.form-group{margin-bottom:14px}.form-group label{display:block;font-size:13px;color:#666;margin-bottom:4px}.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;box-sizing:border-box}.form-row{display:flex;gap:16px}.form-row .form-group{flex:1}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}.btn-cancel{background:#f3f4f6;border:1px solid #ddd;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save:disabled{opacity:0.6;cursor:not-allowed}.loading-state,.error-state{text-align:center;padding:40px;color:#9ca3af;font-size:14px}.error-state{color:#ef4444}.empty-hint{text-align:center;padding:40px;color:#9ca3af;font-size:14px}
</style>
