<template>
  <div class="ad-manage">
    <div class="toolbar">
      <button class="btn-add" @click="showAddModal = true">
        <span>+</span> 添加广告
      </button>
    </div>

    <div class="table-container glass-dark">
      <table class="data-table">
        <thead>
          <tr>
            <th>广告名称</th>
            <th>位置</th>
            <th>展示次数</th>
            <th>点击次数</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ad in ads" :key="ad.id">
            <td class="text-white">{{ ad.name }}</td>
            <td>
              <span class="position-badge">{{ ad.position }}</span>
            </td>
            <td class="views">{{ ad.impressions }}</td>
            <td class="clicks">{{ ad.clicks }}</td>
            <td>{{ ad.startTime }}</td>
            <td>{{ ad.endTime }}</td>
            <td>
              <span class="status-badge" :class="ad.enabled ? 'enabled' : 'disabled'">
                {{ ad.enabled ? '投放中' : '已暂停' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="editAd(ad)">编辑</button>
                <button 
                  class="btn-toggle"
                  :class="{ disable: ad.enabled }"
                  @click="toggleAd(ad)"
                >{{ ad.enabled ? '暂停' : '启用' }}</button>
                <button class="btn-delete" @click="deleteAd(ad)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal glass-dark">
        <h3>{{ editingAd ? '编辑广告' : '添加广告' }}</h3>
        <div class="form-group">
          <label>广告名称</label>
          <input v-model="formData.name" type="text" placeholder="输入广告名称" />
        </div>
        <div class="form-group">
          <label>广告位置</label>
          <select v-model="formData.position">
            <option>首页顶部</option>
            <option>首页侧边</option>
            <option>工具页底部</option>
            <option>帖子详情</option>
            <option>弹窗广告</option>
          </select>
        </div>
        <div class="form-group">
          <label>广告链接</label>
          <input v-model="formData.link" type="text" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label>开始时间</label>
          <input v-model="formData.startTime" type="date" />
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <input v-model="formData.endTime" type="date" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="saveAd">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminList, createAdminItem, updateAdminItem, deleteAdminItem } from '@/api/content'

const showAddModal = ref(false)
const editingAd = ref(null)

const formData = reactive({
  name: '',
  position: '首页顶部',
  link: '',
  startTime: '',
  endTime: ''
})

const ads = ref([])

const loadAds = async () => {
  try {
    const data = await getAdminList('ads')
    ads.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      name: item.title,
      position: item.position || '首页顶部',
      link: item.link || '',
      startTime: item.start_date || '',
      endTime: item.end_date || '',
      enabled: !!item.is_active,
      impressions: 0,
      clicks: 0,
    }))
  } catch (e) {
    console.error('Failed to load ads:', e)
  }
}

onMounted(() => loadAds())

const editAd = (ad) => {
  editingAd.value = ad
  formData.name = ad.name
  formData.position = ad.position
  formData.link = ad.link
  formData.startTime = ad.startTime
  formData.endTime = ad.endTime
  showAddModal.value = true
}

const saveAd = async () => {
  try {
    if (editingAd.value) {
      await updateAdminItem('ads', editingAd.value.id, {
        title: formData.name,
        position: formData.position,
        link: formData.link,
        start_date: formData.startTime,
        end_date: formData.endTime,
        is_active: editingAd.value.enabled ? 1 : 0,
      })
      const idx = ads.value.findIndex(a => a.id === editingAd.value.id)
      if (idx > -1) {
        ads.value[idx] = { ...ads.value[idx], ...formData }
      }
    } else {
      const data = await createAdminItem('ads', {
        title: formData.name,
        position: formData.position,
        link: formData.link,
        start_date: formData.startTime,
        end_date: formData.endTime,
        is_active: 0,
      })
      ads.value.unshift({
        id: data.item?.id || Date.now(),
        ...formData,
        impressions: 0,
        clicks: 0,
        enabled: false
      })
    }
    closeModal()
    alert('保存成功')
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}

const toggleAd = async (ad) => {
  try {
    await updateAdminItem('ads', ad.id, { is_active: ad.enabled ? 0 : 1 })
    ad.enabled = !ad.enabled
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

const deleteAd = async (ad) => {
  if (!confirm(`确定删除广告 "${ad.name}" 吗？`)) return
  try {
    await deleteAdminItem('ads', ad.id)
    ads.value = ads.value.filter(a => a.id !== ad.id)
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingAd.value = null
  formData.name = ''
  formData.position = '首页顶部'
  formData.link = ''
  formData.startTime = ''
  formData.endTime = ''
}
</script>

<style scoped>

.ad-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.btn-add {
  padding: 10px 20px;
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(94, 129, 244, 0.4);
}

.glass-dark {
  background: #fff;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  color: #333;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.data-table td {
  color: #6b7280;
  font-size: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.data-table tr:hover td {
  background: #fff;
}

.text-white {
  color: #333!important;
}

.position-badge {
  padding: 4px 10px;
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border-radius: 6px;
  font-size: 12px;
}

.views {
  color: #5e81f4 !important;
}

.clicks {
  color: #4ade80 !important;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.status-badge.enabled {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.status-badge.disabled {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.action-btns {
  display: flex;
  gap: 6px;
}

.action-btns button {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(94, 129, 244, 0.15);
  color: #5e81f4;
  border: 1px solid rgba(94, 129, 244, 0.3) !important;
}

.btn-toggle {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3) !important;
}

.btn-toggle.disable {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
  border-color: rgba(251, 146, 60, 0.3) !important;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 420px;
  padding: 24px;
}

.modal h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #333;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  outline: none;
}

.form-group select option {
  background: #f8f9fa;
}

.form-group input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
}

.btn-save {
  padding: 8px 20px;
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
}

</style>
