<template>
  <div class="manage-page">
    <div class="page-header"><h2>📢 公告管理</h2><button class="btn-primary" @click="openAdd">+ 发布公告</button></div>
    <div class="item-list">
      <div v-for="item in items" :key="item.id" class="item-card">
        <span class="type-badge" :class="item.type">{{ typeLabels[item.type] || item.type }}</span>
        <div class="item-info"><h4>{{ item.title }}</h4><span class="item-meta">✍️ {{ item.author }} · 📅 {{ item.date }}</span></div>
        <div class="item-actions"><button class="btn-edit" @click="openEdit(item)">编辑</button><button class="btn-delete" @click="deleteItem(item)">删除</button></div>
      </div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editingItem.id ? '编辑公告' : '发布公告' }}</h3>
        <div class="form-group"><label>标题</label><input v-model="editingItem.title" /></div>
        <div class="form-group"><label>内容</label><textarea v-model="editingItem.content" rows="4"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>类型</label><select v-model="editingItem.type"><option value="system">系统公告</option><option value="activity">活动通知</option><option value="update">更新日志</option><option value="maintenance">维护公告</option></select></div>
          <div class="form-group"><label>作者</label><input v-model="editingItem.author" /></div>
        </div>
        <div class="modal-actions"><button class="btn-cancel" @click="showModal = false">取消</button><button class="btn-save" @click="saveItem">保存</button></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { getAdminList, createAdminItem, updateAdminItem, deleteAdminItem } from '@/api/content'

const items = ref([])
const showModal = ref(false)
const editingItem = ref({})
const typeLabels = { info: '⚙️ 系统', activity: '🎯 活动', update: '🔄 更新', maintenance: '🔧 维护' }

const loadItems = async () => {
  try {
    const data = await getAdminList('announcements')
    items.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      title: item.title,
      content: item.content || '',
      type: item.type || 'info',
      author: '管理员',
      date: item.created_at?.slice(0, 10) || '',
    }))
  } catch (e) {
    console.error('Failed to load announcements:', e)
  }
}

onMounted(() => loadItems())

const openAdd = () => { editingItem.value = { title: '', content: '', type: 'info', author: '管理员', date: new Date().toISOString().slice(0,10) }; showModal.value = true }
const openEdit = (item) => { editingItem.value = { ...item }; showModal.value = true }

const saveItem = async () => {
  if (!editingItem.value.title) return alert('请输入标题')
  try {
    if (editingItem.value.id && typeof editingItem.value.id === 'number') {
      await updateAdminItem('announcements', editingItem.value.id, {
        title: editingItem.value.title,
        content: editingItem.value.content,
        type: editingItem.value.type,
      })
      const idx = items.value.findIndex(i => i.id === editingItem.value.id)
      if (idx > -1) items.value[idx] = { ...editingItem.value }
    } else {
      const data = await createAdminItem('announcements', {
        title: editingItem.value.title,
        content: editingItem.value.content,
        type: editingItem.value.type,
      })
      items.value.unshift({ ...editingItem.value, id: data.item?.id || Date.now() })
    }
    showModal.value = false
    alert('保存成功')
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}

const deleteItem = async (item) => {
  if (!confirm(`确定删除「${item.title}」？`)) return
  try {
    await deleteAdminItem('announcements', item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    alert('删除成功')
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}
</script>
<style scoped>
.manage-page{padding:24px;color:#1e2e3a}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.page-header h2{font-size:22px}.btn-primary{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.item-card{display:flex;align-items:center;gap:16px;padding:12px;background:rgba(255,255,255,0.8);border-radius:10px;margin-bottom:10px}.type-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;flex-shrink:0}.type-badge.system{background:rgba(107,114,128,0.15);color:#6b7280}.type-badge.activity{background:rgba(59,130,246,0.15);color:#3b82f6}.type-badge.update{background:rgba(34,197,94,0.15);color:#22c55e}.type-badge.maintenance{background:rgba(245,158,11,0.15);color:#f59e0b}.item-info{flex:1}.item-info h4{font-size:14px;margin-bottom:2px}.item-meta{font-size:12px;color:#666}.item-actions{display:flex;gap:8px}.btn-edit{background:rgba(59,130,246,0.15);color:#3b82f6;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.btn-delete{background:rgba(239,68,68,0.15);color:#ef4444;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}.modal-card{background:#fff;border-radius:16px;padding:24px;width:520px;max-height:80vh;overflow-y:auto}.modal-card h3{margin-bottom:20px;color:#1e2e3a}.form-group{margin-bottom:14px}.form-group label{display:block;font-size:13px;color:#666;margin-bottom:4px}.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;box-sizing:border-box}.form-row{display:flex;gap:16px}.form-row .form-group{flex:1}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}.btn-cancel{background:#f3f4f6;border:1px solid #ddd;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}
</style>
