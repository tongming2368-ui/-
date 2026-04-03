<template>
  <div class="post-manage">
    <div class="toolbar">
      <div class="search-box">
        <select v-model="searchMode" class="search-mode-select">
          <option value="title">标题</option>
          <option value="userId">用户ID</option>
          <option value="author">作者名</option>
        </select>
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="searchPlaceholder" 
        />
        <span class="search-icon">🔍</span>
      </div>
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >{{ tab.label }}</button>
      </div>
    </div>

    <div class="table-container glass-dark">
      <table class="data-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>作者</th>
            <th>用户ID</th>
            <th>分类</th>
            <th>浏览量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in filteredPosts" :key="post.id">
            <td class="text-white post-title">{{ post.title }}</td>
            <td>
              <div class="author-cell">
                <span class="author-avatar">{{ post.authorAvatar }}</span>
                <span>{{ post.author }}</span>
              </div>
            </td>
            <td class="user-id" @click="searchByUserId(post.authorId)">#{{ post.authorId }}</td>
            <td>
              <span class="category-badge">{{ post.category }}</span>
            </td>
            <td class="views">{{ post.views }}</td>
            <td>
              <div class="status-cell">
                <span class="status-badge" :class="post.status">
                  {{ post.status === 'published' ? '已发布' : post.status === 'draft' ? '草稿' : '已封禁' }}
                </span>
                <span v-if="post.isEssence" class="essence-badge" title="精华帖">⭐ 精华</span>
              </div>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" @click="editPost(post)">编辑</button>
                <button 
                  class="btn-essence"
                  :class="{ essenced: post.isEssence }"
                  @click="toggleEssence(post)"
                >{{ post.isEssence ? '取消精华' : '加精' }}</button>
                <button 
                  class="btn-top" 
                  :class="{ topped: post.isTop }"
                  @click="toggleTop(post)"
                >{{ post.isTop ? '取消置顶' : '置顶' }}</button>
                <button 
                  class="btn-lock"
                  :class="{ locked: post.status === 'locked' }"
                  @click="toggleLock(post)"
                >{{ post.status === 'locked' ? '解封' : '封贴' }}</button>
                <button
                  v-if="(post.category === '活动专区' || post.category === 'activity_zone') && post.isHidden"
                  class="btn-approve"
                  @click="openApproveModal(post)"
                >审核通过</button>
                <button
                  v-if="(post.category === '优惠分享' || post.category === 'deals_zone') && post.isHidden"
                  class="btn-approve"
                  @click="openApproveModal(post)"
                >审核通过</button>
                <button class="btn-delete" @click="deletePost(post)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal glass-dark">
        <h3>编辑帖子</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="editingPost.title" type="text" />
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="editingPost.category">
            <option>人像摄影</option>
            <option>风景摄影</option>
            <option>街拍纪实</option>
            <option>器材评测</option>
            <option>后期教程</option>
            <option>活动交流</option>
          </select>
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="editingPost.status">
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-save" @click="savePost">保存</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPosts, updatePost, deletePost as apiDeletePost } from '@/api/content'

const searchQuery = ref('')
const searchMode = ref('title')
const activeTab = ref('all')
const showEditModal = ref(false)
const editingPost = ref({})
const loading = ref(true)

const searchPlaceholder = computed(() => {
  const map = { title: '搜索帖子标题...', userId: '输入用户ID...', author: '搜索作者名...' }
  return map[searchMode.value] || '搜索...'
})

const tabs = [
  { label: '全部', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '已封禁', value: 'locked' },
]

const posts = ref([])

// 从 API 加载帖子
const loadPosts = async () => {
  loading.value = true
  try {
    const data = await getPosts({ limit: 100 })
    posts.value = (data.posts || []).map(p => ({
      ...p,
      id: p.id,
      title: p.title,
      author: p.author_name || '未知',
      authorAvatar: p.author_avatar || '👤',
      authorId: p.author_id,
      category: p.category || '',
      views: p.view_count || 0,
      publishTime: p.created_at?.slice(0, 10) || '',
      status: p.status || 'published',
      isTop: !!p.is_sticky,
      isEssence: !!p.is_essence,
      isHidden: !!p.is_hidden,
    }))
  } catch (e) {
    console.error('Failed to load posts:', e)
  }
  loading.value = false
}

onMounted(() => {
  loadPosts()
})

const filteredPosts = computed(() => {
  let result = posts.value

  if (activeTab.value === 'published') {
    result = result.filter(p => p.status === 'published' && !p.isHidden)
  } else if (activeTab.value === 'locked') {
    result = result.filter(p => p.status === 'locked')
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    if (searchMode.value === 'title') {
      result = result.filter(p => p.title.toLowerCase().includes(query))
    } else if (searchMode.value === 'userId') {
      result = result.filter(p => String(p.authorId).includes(query.trim()))
    } else if (searchMode.value === 'author') {
      result = result.filter(p => (p.author || '').toLowerCase().includes(query))
    }
  }

  return result
})

const editPost = (post) => {
  editingPost.value = { ...post }
  showEditModal.value = true
}

const savePost = async () => {
  try {
    await updatePost(editingPost.value.id, {
      title: editingPost.value.title,
      category: editingPost.value.category,
      status: editingPost.value.status,
    })
    const idx = posts.value.findIndex(p => p.id === editingPost.value.id)
    if (idx > -1) {
      Object.assign(posts.value[idx], editingPost.value)
    }
    showEditModal.value = false
    alert('保存成功')
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}

const toggleTop = async (post) => {
  try {
    await updatePost(post.id, { isSticky: !post.isTop })
    post.isTop = !post.isTop
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

const toggleEssence = async (post) => {
  try {
    await updatePost(post.id, { isEssence: !post.isEssence })
    post.isEssence = !post.isEssence
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

const toggleLock = async (post) => {
  const newStatus = post.status === 'locked' ? 'published' : 'locked'
  if (newStatus === 'locked' && !confirm(`确定封禁帖子「${post.title}」？用户将无法查看和评论。`)) {
    return
  }
  try {
    await updatePost(post.id, { status: newStatus })
    post.status = newStatus
    if (newStatus === 'locked') post.isTop = false
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

const deletePost = async (post) => {
  if (!confirm(`确定删除帖子 "${post.title}" 吗？`)) return
  try {
    await apiDeletePost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
    alert('删除成功')
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

const searchByUserId = (userId) => {
  searchMode.value = 'userId'
  searchQuery.value = String(userId)
}
</script>

<style scoped>

.post-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  width: 400px;
}

.search-mode-select {
  padding: 10px 8px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-right: none;
  border-radius: 10px 0 0 10px;
  color: #333;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  min-width: 80px;
}

.search-box input {
  flex: 1;
  padding: 10px 36px 10px 12px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 0 10px 10px 0;
  color: #333;
  font-size: 14px;
  outline: none;
}

.search-box input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #fff;
  border-radius: 10px;
  padding: 4px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  background: rgba(94, 129, 244, 0.2);
  color: #333;
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

.post-title {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  font-size: 20px;
}

.user-id {
  font-family: monospace;
  font-size: 12px !important;
  color: #8b5cf6 !important;
  cursor: pointer;
}

.user-id:hover {
  text-decoration: underline;
}

.category-badge {
  padding: 4px 10px;
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
  border-radius: 6px;
  font-size: 12px;
}

.views {
  color: #4ade80 !important;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.essence-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
  color: #d97706;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.status-badge.published {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.status-badge.draft {
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

.btn-top {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3) !important;
}

.btn-essence {
  background: rgba(251, 191, 36, 0.15);
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.3) !important;
}

.btn-essence.essenced {
  background: rgba(251, 191, 36, 0.25);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.5) !important;
}

.btn-top.topped {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border-color: rgba(156, 163, 175, 0.3) !important;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.btn-lock {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.btn-lock:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-lock.locked {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3) !important;
}

.btn-lock.locked:hover {
  background: rgba(74, 222, 128, 0.25);
}

.btn-approve {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3) !important;
}

.btn-approve:hover {
  background: rgba(74, 222, 128, 0.25);
}

.status-badge.locked {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
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

.approve-post-title {
  color: #555;
  font-size: 14px;
  margin-bottom: 16px;
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
