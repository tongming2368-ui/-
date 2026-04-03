<template>
  <div class="manage-page">
    <div class="page-header">
      <h2>🖼️ 美图管理</h2>
      <button class="btn-primary" @click="openAdd">+ 上传作品</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-if="error" class="error-state">{{ error }}</div>

    <!-- 标签页 -->
    <div class="tab-bar" v-if="!loading">
      <button
        :class="{ active: activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        已发布 ({{ items.length }})
      </button>
      <button
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'; loadPendingItems()"
      >
        待审核 ({{ pendingItems.length }})
      </button>
    </div>

    <!-- 已发布列表 -->
    <template v-if="activeTab === 'list' && !loading">
      <!-- 搜索筛选 -->
      <div class="filter-bar">
        <input v-model="searchQuery" placeholder="搜索标题/作者..." class="search-input" />
        <select v-model="filterStyle" class="filter-select">
          <option value="">全部风格</option>
          <option value="风光">风光</option>
          <option value="人像">人像</option>
          <option value="街拍">街拍</option>
          <option value="微距">微距</option>
          <option value="建筑">建筑</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div class="item-list">
        <div v-for="item in filteredItems" :key="item.id" class="item-card">
          <div class="item-thumb">
            <img :src="item.images?.[0] || item.image_url" :alt="item.title" />
            <span class="item-badge">{{ item.style || '作品' }}</span>
          </div>
          <div class="item-info">
            <h4>{{ item.title }}</h4>
            <p class="item-author">{{ item.authorAvatar || item.author_avatar }} {{ item.author || item.author_name }}</p>
            <div class="item-stats">
              <span>❤️ {{ item.likeCount || item.like_count || 0 }}</span>
              <span>💬 {{ item.comments?.length || 0 }}</span>
              <span v-if="item.price">💰 {{ item.price }}积分</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" @click="openEdit(item)">编辑</button>
            <button class="btn-delete" @click="deleteItem(item)">删除</button>
          </div>
        </div>
        <div v-if="filteredItems.length === 0" class="empty-hint">暂无已发布作品</div>
      </div>
    </template>

    <!-- 待审核列表 -->
    <template v-if="activeTab === 'pending' && !loading">
      <div class="item-list">
        <div v-for="item in pendingItems" :key="item.id" class="item-card pending-card">
          <div class="item-thumb">
            <img :src="item.image || item.image_url" :alt="item.title" />
            <span class="item-badge pending-badge">待审核</span>
          </div>
          <div class="item-info">
            <h4>{{ item.title }}</h4>
            <p class="item-author">👤 {{ item.author || item.author_name }}</p>
            <div class="item-meta">
              <span>{{ item.brand }} · {{ item.style }}</span>
              <span v-if="item.camera || item.lens"> · {{ item.camera }} {{ item.lens }}</span>
            </div>
            <p class="item-time">提交时间：{{ formatTime(item.created_at || item.createdAt) }}</p>
            <p v-if="item.description" class="item-desc">{{ item.description }}</p>
          </div>
          <div class="item-actions review-actions">
            <button class="btn-approve" @click="approveItem(item)">✅ 通过</button>
            <button class="btn-reject" @click="rejectItem(item)">❌ 拒绝</button>
          </div>
        </div>
        <div v-if="pendingItems.length === 0" class="empty-hint">🎉 暂无待审核作品</div>
      </div>
    </template>

    <!-- 编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editingItem.id ? '编辑作品' : '上传作品' }}</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="editingItem.title" type="text" />
        </div>
        <div class="form-group">
          <label>图片URL（每行一个）</label>
          <textarea v-model="imagesText" rows="3" placeholder="https://...&#10;https://..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>作者</label>
            <input v-model="editingItem.author" type="text" />
          </div>
          <div class="form-group">
            <label>风格</label>
            <select v-model="editingItem.style">
              <option value="风光">风光</option>
              <option value="人像">人像</option>
              <option value="街拍">街拍</option>
              <option value="微距">微距</option>
              <option value="建筑">建筑</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>品牌</label>
            <input v-model="editingItem.brand" type="text" />
          </div>
          <div class="form-group">
            <label>积分价格（0=免费）</label>
            <input v-model.number="editingItem.price" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label>内容描述</label>
          <textarea v-model="editingItem.content" rows="3"></textarea>
        </div>
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
import { getShowcase, createShowcase, updateShowcase, deleteShowcase } from '@/api/content'

const items = ref([])
const pendingItems = ref([])
const searchQuery = ref('')
const filterStyle = ref('')
const showModal = ref(false)
const editingItem = ref({})
const imagesText = ref('')
const activeTab = ref('list')
const loading = ref(true)
const error = ref('')
const saving = ref(false)

// 从 API 加载已发布作品
const loadItems = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getShowcase({ status: 'approved', limit: 100 })
    items.value = (res.items || []).map(item => ({
      ...item,
      images: item.images || (item.image_url ? [item.image_url] : []),
      style: item.style || '',
      brand: item.brand || '',
      price: item.price || null,
    }))
  } catch (e) {
    error.value = '加载作品列表失败: ' + e.message
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 从 API 加载待审核作品
const loadPendingItems = async () => {
  try {
    const res = await getShowcase({ status: 'pending', limit: 100 })
    pendingItems.value = (res.items || []).map(item => ({
      ...item,
      image: item.image || item.image_url || '',
      author: item.author || item.author_name || '',
      createdAt: item.created_at || item.createdAt,
    }))
  } catch (e) {
    console.error('加载待审核列表失败:', e)
  }
}

const filteredItems = computed(() => {
  let list = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(i => i.title.toLowerCase().includes(q) || (i.author || i.author_name || '').toLowerCase().includes(q))
  }
  if (filterStyle.value) {
    list = list.filter(i => i.style === filterStyle.value)
  }
  return list
})

const formatTime = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const openAdd = () => {
  editingItem.value = { style: '风光', price: 0, author: '管理员', authorAvatar: '👨💼' }
  imagesText.value = ''
  showModal.value = true
}

const openEdit = (item) => {
  editingItem.value = { ...item }
  imagesText.value = (item.images || []).join('\n')
  showModal.value = true
}

const saveItem = async () => {
  if (!editingItem.value.title) return alert('请输入标题')
  const images = imagesText.value.split('\n').filter(u => u.trim())
  if (images.length === 0) return alert('请至少添加一张图片')

  saving.value = true
  try {
    const payload = {
      title: editingItem.value.title,
      description: editingItem.value.content || editingItem.value.description || '',
      imageUrl: images[0],
      images: images,
      style: editingItem.value.style,
      brand: editingItem.value.brand,
      price: editingItem.value.price,
      camera: editingItem.value.camera || '',
      tags: editingItem.value.tags || [],
    }

    if (editingItem.value.id) {
      // 更新现有作品
      await updateShowcase(editingItem.value.id, payload)
    } else {
      // 创建新作品
      await createShowcase(payload)
    }
    await loadItems()
    showModal.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
    console.error(e)
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item) => {
  if (!confirm(`确定删除「${item.title}」？`)) return
  try {
    await deleteShowcase(item.id)
    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

// 审核通过
const approveItem = async (pending) => {
  if (!confirm(`确定通过「${pending.title}」？`)) return
  try {
    await updateShowcase(pending.id, { status: 'approved' })
    pendingItems.value = pendingItems.value.filter(i => i.id !== pending.id)
    // 刷新已发布列表
    await loadItems()
    alert('已通过并添加到美图展示')
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

// 审核拒绝
const rejectItem = async (pending) => {
  if (!confirm(`确定拒绝「${pending.title}」？`)) return
  try {
    await deleteShowcase(pending.id)
    pendingItems.value = pendingItems.value.filter(i => i.id !== pending.id)
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

onMounted(() => {
  loadItems()
  loadPendingItems()
  // 定时刷新待审核列表
  setInterval(() => {
    if (activeTab.value === 'pending') {
      loadPendingItems()
    }
  }, 15000)
})
</script>

<style scoped>
.manage-page { padding: 24px; color: #1e2e3a; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 22px; }
.btn-primary { background: linear-gradient(135deg, #5e81f4, #8b5cf6); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { flex: 1; padding: 10px 14px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-size: 14px; color: #1e2e3a; background: rgba(255,255,255,0.8); }
.filter-select { padding: 10px 14px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-size: 14px; color: #1e2e3a; background: rgba(255,255,255,0.8); }
.item-card { display: flex; align-items: center; gap: 16px; padding: 12px; background: rgba(255,255,255,0.8); border-radius: 10px; margin-bottom: 10px; }
.item-thumb { width: 80px; height: 60px; border-radius: 8px; overflow: hidden; position: relative; flex-shrink: 0; }
.item-thumb img { width: 100%; height: 100%; object-fit: cover; }
.item-badge { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.item-info { flex: 1; min-width: 0; }
.item-info h4 { font-size: 14px; margin-bottom: 4px; }
.item-author { font-size: 12px; color: #666; }
.item-stats { font-size: 12px; color: #888; display: flex; gap: 12px; margin-top: 4px; }
.item-actions { display: flex; gap: 8px; }
.btn-edit { background: rgba(59,130,246,0.15); color: #3b82f6; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; }
.btn-delete { background: rgba(239,68,68,0.15); color: #ef4444; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #fff; border-radius: 16px; padding: 24px; width: 520px; max-height: 80vh; overflow-y: auto; }
.modal-card h3 { margin-bottom: 20px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 13px; color: #666; margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-size: 14px; color: #1e2e3a; box-sizing: border-box; }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-cancel { background: #f3f4f6; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-save { background: linear-gradient(135deg, #5e81f4, #8b5cf6); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.loading-state, .error-state { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.error-state { color: #ef4444; }

/* Tab bar */
.tab-bar { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid rgba(0, 0, 0, 0.08); }
.tab-bar button { background: none; border: none; padding: 10px 20px; font-size: 14px; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s ease; }
.tab-bar button:hover { color: #3b82f6; }
.tab-bar button.active { color: #3b82f6; font-weight: 600; border-bottom-color: #3b82f6; }

/* Pending card */
.pending-card { border-left: 3px solid #f59e0b; }
.pending-badge { background: rgba(245, 158, 11, 0.9) !important; }
.item-meta { font-size: 12px; color: #888; margin-top: 2px; }
.item-time { font-size: 12px; color: #999; margin-top: 2px; }
.item-desc { font-size: 12px; color: #666; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px; }

/* Review actions */
.review-actions { flex-direction: column; gap: 6px; }
.btn-approve { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
.btn-approve:hover { background: rgba(16, 185, 129, 0.25); border-color: rgba(16, 185, 129, 0.5); }
.btn-reject { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
.btn-reject:hover { background: rgba(239, 68, 68, 0.25); border-color: rgba(239, 68, 68, 0.5); }
.empty-hint { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
</style>
