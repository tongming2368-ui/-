<template>
  <div class="user-manage">
    <div class="toolbar">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索用户名或邮箱..."
          @input="handleSearch"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div class="table-container glass-dark">
      <table class="data-table">
        <thead>
          <tr>
            <th>昵称</th>
            <th>ID</th>
            <th>邮箱</th>
            <th>来源</th>
            <th>积分</th>
            <th>等级</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="text-white">{{ user.nickname }}</td>
            <td class="id-cell">{{ user.uid }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span class="source-badge" :class="user.isRegistered ? 'source-registered' : 'source-built-in'">
                {{ user.isRegistered ? '注册' : '内置' }}
              </span>
            </td>
            <td>
              <span class="points">{{ user.points }}</span>
            </td>
            <td>
              <span class="level-badge" :class="'level-' + user.level">
                Lv.{{ user.level }}
              </span>
            </td>
            <td>{{ user.registerTime }}</td>
            <td>
              <div class="action-btns">
                <button class="btn-view" @click="viewUserProfile(user)">查看资料</button>
                <button class="btn-manage" @click="openManage(user)">管理</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 用户管理弹窗 -->
    <div v-if="showManageModal" class="modal-overlay" @click.self="showManageModal = false">
      <div class="modal glass-dark manage-modal">
        <h3>🛠️ 用户管理</h3>
        <div class="manage-user-header">
          <div class="manage-avatar">
            <img v-if="manageUser?.avatar && manageUser.avatar.startsWith('/')" :src="manageUser.avatar" alt="" />
            <span v-else>{{ manageUser?.avatar }}</span>
          </div>
          <div class="manage-user-info">
            <span class="manage-name">{{ manageUser?.nickname }}</span>
            <span class="manage-uid">ID：{{ manageUser?.uid }}</span>
          </div>
        </div>

        <!-- 编辑资料 -->
        <div class="manage-section">
          <h4>📝 编辑资料</h4>
          <div class="manage-form-row">
            <div class="manage-form-group">
              <label>昵称</label>
              <input v-model="manageForm.nickname" type="text" />
            </div>
            <div class="manage-form-group">
              <label>等级</label>
              <select v-model="manageForm.level">
                <option v-for="n in 10" :key="n" :value="n">Lv.{{ n }}</option>
              </select>
            </div>
          </div>
          <div class="manage-form-group">
            <label>积分</label>
            <input v-model.number="manageForm.points" type="number" />
          </div>
          <button class="btn-save-manage" @click="saveManage">保存修改</button>
        </div>

        <!-- 打赏积分 -->
        <div class="manage-section">
          <h4>💰 打赏积分</h4>
          <div class="reward-row">
            <div class="reward-quick-btns">
              <button v-for="n in [10, 50, 100, 200, 500]" :key="n" class="reward-btn" :class="{ active: rewardAmount === n }" @click="rewardAmount = n">{{ n }}</button>
            </div>
            <div class="reward-custom">
              <input v-model.number="rewardAmount" type="number" placeholder="自定义" min="1" class="reward-custom-input" />
            </div>
          </div>
          <button class="btn-do-reward" @click="confirmReward">确认打赏</button>
        </div>

        <!-- 危险操作 -->
        <div class="manage-section danger-section">
          <h4>⚠️ 危险操作</h4>
          <button class="btn-do-delete" @click="confirmDelete">删除用户</button>
        </div>

        <button class="btn-close-manage" @click="showManageModal = false">关闭</button>
      </div>
    </div>
    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal glass-dark profile-modal">
        <h3>📋 用户资料</h3>
        <div class="profile-header-row">
          <div class="profile-avatar">
            <img v-if="profileUser?.avatar && profileUser.avatar.startsWith('/')" :src="profileUser.avatar" alt="" />
            <span v-else>{{ profileUser?.avatar }}</span>
          </div>
          <div class="profile-basic">
            <span class="profile-name">{{ profileUser?.nickname }}</span>
            <span class="profile-uid">ID：{{ profileUser?.uid }}</span>
          </div>
        </div>
        <div class="profile-section">
          <h4>📧 账号绑定</h4>
          <div class="profile-field">
            <span class="field-label">邮箱</span>
            <span class="field-value">{{ profileUser?.email || '未绑定' }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">手机号</span>
            <span class="field-value">{{ profileUser?.phone || '未绑定' }}</span>
          </div>
        </div>
        <div class="profile-section">
          <h4>🔗 社媒账号</h4>
          <div class="profile-field">
            <span class="field-label">微信</span>
            <span class="field-value">{{ profileUser?.wechat || '未绑定' }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">微博</span>
            <span class="field-value">{{ profileUser?.weibo || '未绑定' }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">QQ</span>
            <span class="field-value">{{ profileUser?.qq || '未绑定' }}</span>
          </div>
        </div>
        <div class="profile-section">
          <h4>ℹ️ 其他信息</h4>
          <div class="profile-field">
            <span class="field-label">生日</span>
            <span class="field-value">{{ profileUser?.birthday || '未设置' }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">个签</span>
            <span class="field-value">{{ profileUser?.bio || '未设置' }}</span>
          </div>
          <div class="profile-field">
            <span class="field-label">注册时间</span>
            <span class="field-value">{{ profileUser?.registerTime }}</span>
          </div>
        </div>
        <button class="btn-close-profile" @click="showProfileModal = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '@/api/content'

const searchQuery = ref('')
const showManageModal = ref(false)
const showProfileModal = ref(false)
const manageUser = ref(null)
const manageForm = ref({ nickname: '', level: 1, points: 0 })
const profileUser = ref(null)
const rewardAmount = ref(100)
const loading = ref(true)

const users = ref([])

// 从 API 加载用户
const loadUsers = async () => {
  loading.value = true
  try {
    const data = await getAdminUsers()
    users.value = (data.users || []).map(u => ({
      ...u,
      uid: u.uid || `U${String(u.id).padStart(5, '0')}`,
      nickname: u.nickname || u.username,
      avatar: u.avatar || '👤',
      email: u.email || '',
      phone: u.phone || '',
      birthday: u.birthday || '',
      bio: u.bio || '',
      points: u.points || 0,
      level: u.level || 1,
      registerTime: u.join_date || u.created_at?.slice(0, 10) || '',
      isMuted: false,
      muteUntil: '',
    }))
  } catch (e) {
    console.error('Failed to load users:', e)
  }
  loading.value = false
}

onMounted(() => {
  loadUsers()
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    (u.nickname || '').toLowerCase().includes(query) ||
    (u.email || '').toLowerCase().includes(query) ||
    String(u.uid).toLowerCase().includes(query)
  )
})

const handleSearch = () => {}

const openManage = (user) => {
  manageUser.value = user
  manageForm.value = { nickname: user.nickname, level: user.level, points: user.points }
  rewardAmount.value = 100
  showManageModal.value = true
}

const confirmReward = async () => {
  if (!rewardAmount.value || rewardAmount.value <= 0) return
  try {
    const newPoints = (manageUser.value.points || 0) + rewardAmount.value
    await updateAdminUser(manageUser.value.id, { points: newPoints })
    manageUser.value.points = newPoints
    alert(`已给「${manageUser.value.nickname}」打赏 ${rewardAmount.value} 积分`)
  } catch (e) {
    alert('操作失败：' + e.message)
  }
}

const confirmDelete = async () => {
  if (!confirm(`确定删除用户「${manageUser.value.nickname}」？此操作不可恢复。`)) return
  try {
    await deleteAdminUser(manageUser.value.id)
    users.value = users.value.filter(u => u.id !== manageUser.value.id)
    showManageModal.value = false
    alert('删除成功')
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

const viewUserProfile = (user) => {
  profileUser.value = user
  showProfileModal.value = true
}

const saveManage = async () => {
  try {
    await updateAdminUser(manageUser.value.id, {
      nickname: manageForm.value.nickname,
      level: manageForm.value.level,
      points: manageForm.value.points
    })
    const idx = users.value.findIndex(u => u.id === manageUser.value.id)
    if (idx > -1) {
      users.value[idx].nickname = manageForm.value.nickname
      users.value[idx].level = manageForm.value.level
      users.value[idx].points = manageForm.value.points
    }
    showManageModal.value = false
    alert('保存成功')
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}
</script>

<style scoped>

.user-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  color: #333;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: rgba(94, 129, 244, 0.5);
  background: #f0f2f5;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
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

.user-avatar {
  font-size: 28px;
}

.points {
  color: #fbbf24;
  font-weight: 500;
}

.level-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.level-1, .level-2 { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
.level-3, .level-4 { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.level-5, .level-6 { background: rgba(94, 129, 244, 0.15); color: #5e81f4; }
.level-7, .level-8 { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.level-9, .level-10 { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }

.source-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.source-registered {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.source-built-in {
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

.btn-view {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3) !important;
}

.btn-view:hover {
  background: rgba(74, 222, 128, 0.25);
}

.btn-manage {
  background: rgba(94, 129, 244, 0.15);
  color: #5e81f4;
  border: 1px solid rgba(94, 129, 244, 0.3) !important;
}

.btn-manage:hover {
  background: rgba(94, 129, 244, 0.25);
}

.id-cell {
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #9ca3af;
  font-size: 13px;
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
  width: 400px;
  padding: 24px;
}

.modal h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 20px;
}

.reward-info {
  color: #6b7280;
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
  color: #333;
}

/* 管理弹窗 */
.manage-modal {
  width: 480px;
  max-height: 85vh;
  overflow-y: auto;
}

.manage-user-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.manage-avatar {
  font-size: 40px;
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.manage-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.manage-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manage-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.manage-uid {
  font-size: 13px;
  color: #9ca3af;
  font-family: monospace;
}

.manage-section {
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.manage-section:last-of-type {
  border-bottom: none;
}

.manage-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.manage-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.manage-form-group {
  margin-bottom: 12px;
}

.manage-form-group label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.manage-form-group input,
.manage-form-group select {
  width: 100%;
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  outline: none;
}

/* 禁言 */
.mute-row {
  margin-bottom: 12px;
}

.mute-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.mute-option-btn {
  padding: 6px 14px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mute-option-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.mute-option-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.mute-custom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mute-custom-input {
  width: 100px;
  padding: 6px 12px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  outline: none;
}

.mute-custom-unit {
  font-size: 13px;
  color: #6b7280;
}

.btn-do-mute {
  padding: 8px 20px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-do-mute:hover {
  background: rgba(239, 68, 68, 0.2);
}

.mute-status {
  margin-top: 10px;
  font-size: 12px;
  color: #f59e0b;
}

/* 打赏 */
.reward-row {
  margin-bottom: 12px;
}

.reward-quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.reward-btn {
  padding: 6px 14px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reward-btn:hover {
  background: rgba(251, 191, 36, 0.08);
  color: #f59e0b;
}

.reward-btn.active {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: #d97706;
}

.reward-custom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reward-custom-input {
  width: 120px;
  padding: 6px 12px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  outline: none;
}

.btn-do-reward {
  padding: 8px 20px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  color: #d97706;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-do-reward:hover {
  background: rgba(251, 191, 36, 0.2);
}

/* 危险操作 */
.danger-section {
  border-bottom: none !important;
}

.btn-do-delete {
  padding: 8px 20px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-do-delete:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-close-manage {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-manage:hover {
  background: #e5e7eb;
  color: #333;
}

/* 用户资料弹窗 */
.profile-modal {
  width: 450px;
  max-height: 80vh;
  overflow-y: auto;
}

.profile-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.profile-avatar {
  font-size: 48px;
  width: 64px;
  height: 64px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-basic {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.profile-uid {
  font-size: 13px;
  color: #9ca3af;
  font-family: monospace;
}

.profile-section {
  margin-bottom: 18px;
}

.profile-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.profile-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.profile-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 13px;
  color: #6b7280;
}

.field-value {
  font-size: 14px;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-close-profile {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: #f5f7fa;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-profile:hover {
  background: #e5e7eb;
  color: #333;
}

</style>
