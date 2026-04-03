<template>
  <div class="manage-page">
    <div class="page-header"><h2>🎯 活动管理</h2><button class="btn-primary" @click="openAdd">+ 添加活动</button></div>
    <div class="item-list">
      <div v-for="item in items" :key="item.id" class="item-card">
        <span class="status-badge" :class="item.status">{{ item.status === 'ongoing' ? '进行中' : item.status === 'upcoming' ? '即将开始' : '已结束' }}</span>
        <div class="item-info"><h4>{{ item.title }}</h4><span class="item-meta">📅 {{ item.date }} · 👁️ {{ item.participants }}人参与</span></div>
        <div class="item-actions"><button class="btn-edit" @click="openEdit(item)">编辑</button><button class="btn-delete" @click="deleteItem(item)">删除</button></div>
      </div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editingItem.id ? '编辑活动' : '添加活动' }}</h3>
        <div class="form-group"><label>标题</label><input v-model="editingItem.title" /></div>
        <div class="form-group"><label>描述</label><textarea v-model="editingItem.description" rows="3"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>日期</label><input v-model="editingItem.date" type="date" /></div>
          <div class="form-group"><label>状态</label><select v-model="editingItem.status"><option value="ongoing">进行中</option><option value="upcoming">即将开始</option><option value="ended">已结束</option></select></div>
        </div>
        <div class="form-group"><label>奖励（逗号分隔）</label><input v-model="rewardsText" placeholder="积分奖励,精选展示" /></div>
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
const rewardsText = ref('')
const loading = ref(true)

const loadItems = async () => {
  loading.value = true
  try {
    const data = await getAdminList('activities')
    items.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      title: item.title,
      description: item.content || item.description || '',
      date: item.event_date || '',
      status: 'ongoing',
      participants: 0,
      rewards: item.rewards || []
    }))
  } catch (e) {
    console.error('Failed to load activities:', e)
  }
  loading.value = false
}

onMounted(() => loadItems())

const openAdd = () => { editingItem.value = { title: '', description: '', status: 'ongoing', date: new Date().toISOString().slice(0,10), participants: 0, rewards: [] }; rewardsText.value = ''; showModal.value = true }
const openEdit = (item) => { editingItem.value = { ...item }; rewardsText.value = (item.rewards || []).join(','); showModal.value = true }

const saveItem = async () => {
  if (!editingItem.value.title) return alert('请输入标题')
  editingItem.value.rewards = rewardsText.value.split(',').map(t => t.trim()).filter(Boolean)

  try {
    if (editingItem.value.id && typeof editingItem.value.id === 'number') {
      await updateAdminItem('activities', editingItem.value.id, {
        title: editingItem.value.title,
        content: editingItem.value.description,
        event_date: editingItem.value.date,
        rewards: editingItem.value.rewards,
      })
      const idx = items.value.findIndex(i => i.id === editingItem.value.id)
      if (idx > -1) items.value[idx] = { ...editingItem.value }
    } else {
      const data = await createAdminItem('activities', {
        title: editingItem.value.title,
        content: editingItem.value.description,
        event_date: editingItem.value.date,
        rewards: editingItem.value.rewards,
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
    await deleteAdminItem('activities', item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    alert('删除成功')
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}
</script>
<style scoped>
.manage-page{padding:24px;color:#1e2e3a}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.page-header h2{font-size:22px}.btn-primary{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.item-card{display:flex;align-items:center;gap:16px;padding:12px;background:rgba(255,255,255,0.8);border-radius:10px;margin-bottom:10px}.status-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;flex-shrink:0}.status-badge.ongoing{background:rgba(34,197,94,0.15);color:#22c55e}.status-badge.upcoming{background:rgba(59,130,246,0.15);color:#3b82f6}.status-badge.ended{background:rgba(156,163,175,0.2);color:#9ca3af}.item-info{flex:1}.item-info h4{font-size:14px;margin-bottom:2px}.item-meta{font-size:12px;color:#666}.item-actions{display:flex;gap:8px}.btn-edit{background:rgba(59,130,246,0.15);color:#3b82f6;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.btn-delete{background:rgba(239,68,68,0.15);color:#ef4444;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}.modal-card{background:#fff;border-radius:16px;padding:24px;width:520px;max-height:80vh;overflow-y:auto}.modal-card h3{margin-bottom:20px;color:#1e2e3a}.form-group{margin-bottom:14px}.form-group label{display:block;font-size:13px;color:#666;margin-bottom:4px}.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;color:#1e2e3a;box-sizing:border-box}.form-row{display:flex;gap:16px}.form-row .form-group{flex:1}.modal-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:20px}.btn-cancel{background:#f3f4f6;border:1px solid #ddd;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}.btn-save{background:linear-gradient(135deg,#5e81f4,#8b5cf6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}
</style>
