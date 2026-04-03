<template>
  <div class="user-center-page">
<!-- 未登录时重定向 -->
<div v-if="!userStore.isLoggedIn" class="login-redirect">
  <p>请先登录，正在跳转...</p>
</div>

    <!-- 已登录状态 -->
    <div v-else class="user-content">
      <!-- 头部信息区 -->
      <GlassCard class="profile-header">
        <div class="avatar-section">
          <div class="avatar-wrapper" @click="openEditModal('avatar')">
            <div class="avatar">
              <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt="头像" />
              <span v-else class="avatar-placeholder">{{ userStore.user?.nickname?.[0] || '用' }}</span>
            </div>
            <div class="avatar-edit-hint">点击修改</div>
          </div>
          <div class="user-info">
            <div class="nickname-row">
              <span class="nickname" v-if="!editingNickname" @click="startEditNickname">
                {{ userStore.user?.nickname }}
                <span class="edit-icon">✏️</span>
              </span>
              <input
                v-else
                v-model="newNickname"
                @blur="saveNickname"
                @keyup.enter="saveNickname"
                class="nickname-input"
                ref="nicknameInputRef"
              />
            </div>
            <div class="id-row">
              <span class="id-text">ID：{{ userStore.user?.uid }}</span>
              <span class="level-badge">Lv.{{ userStore.levelInfo?.level }}</span>
              <button class="info-btn" @click="showAccountDetail = true" title="查看账号信息">ℹ️</button>
            </div>
            <div class="points-display">
              <span class="points-icon">💎</span>
              <span class="points-value">{{ userStore.user?.points }} 积分</span>
              <span class="points-detail" @click="showPointsDetail = true">明细</span>
            </div>
            <div class="membership-row">
              <span class="membership-tag">
                <span class="membership-icon">👑</span>
                会员：普通会员
                <span class="membership-expire">（无期限）</span>
              </span>
              <button class="vip-btn" @click="goVip">开通 VIP ›</button>
            </div>
          </div>
        </div>

        <!-- 我的勋章 -->
        <div class="medals-section" v-if="userStore.user?.medals?.length">
          <h3 class="section-subtitle">我的勋章</h3>
          <div class="medals-list">
            <span v-for="medal in userStore.user.medals" :key="medal" class="medal-item">
              {{ medal }}
            </span>
          </div>
        </div>
      </GlassCard>

      <!-- 设置入口 -->
      <div class="settings-entry-row">
        <GlassCard hoverable class="settings-entry-card" @click="openSettingsModal('profile')">
          <span class="settings-entry-icon">📝</span>
          <span class="settings-entry-label">资料设置</span>
        </GlassCard>
        <GlassCard hoverable class="settings-entry-card" @click="openSettingsModal('security')">
          <span class="settings-entry-icon">🔒</span>
          <span class="settings-entry-label">安全设置</span>
        </GlassCard>
      </div>

      <!-- 功能列表 -->
      <div class="menu-section">
        <GlassCard v-for="item in menuItems" :key="item.key" hoverable class="menu-item" @click="handleMenuClick(item)">
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
          <span v-if="menuBadges[item.key]" class="menu-badge">{{ menuBadges[item.key] }}</span>
          <span class="menu-arrow">›</span>
        </GlassCard>
      </div>

      <!-- 设置弹窗 -->
      <Teleport to="body">
        <div v-if="showSettingsModal" class="modal-overlay" @click.self="showSettingsModal = null">
          <GlassCard class="modal-content settings-modal">
            <h3 class="modal-title">{{ showSettingsModal === 'profile' ? '📝 资料设置' : '🔒 安全设置' }}</h3>

            <!-- 资料设置 -->
            <div v-if="showSettingsModal === 'profile'" class="settings-modal-body">
              <div class="setting-row" @click="openEditModal('avatar')">
                <span>头像</span>
                <div class="setting-row-right">
                  <span class="setting-current">{{ userStore.user?.avatar || '未设置' }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
              <div class="setting-row" @click="openEditModal('nickname')">
                <span>昵称</span>
                <div class="setting-row-right">
                  <span class="setting-current">{{ userStore.user?.nickname }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
              <div class="setting-row" @click="openEditModal('birthday')">
                <span>生日</span>
                <div class="setting-row-right">
                  <span class="setting-current">{{ userStore.user?.birthday || '未设置' }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
              <div class="setting-row" @click="openEditModal('bio')">
                <span>个签</span>
                <div class="setting-row-right">
                  <span class="setting-current setting-current-bio">{{ userStore.user?.bio || '未设置' }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
            </div>

            <!-- 安全设置 -->
            <div v-if="showSettingsModal === 'security'" class="settings-modal-body">
              <div class="setting-row" @click="openEditModal('email')">
                <span>邮箱</span>
                <div class="setting-row-right">
                  <span class="setting-current">{{ userStore.user?.email || '未绑定' }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
              <div class="setting-row" @click="openEditModal('phone')">
                <span>手机号</span>
                <div class="setting-row-right">
                  <span class="setting-current">{{ userStore.user?.phone || '未绑定' }}</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
              <div class="setting-row" @click="openEditModal('password')">
                <span>密码</span>
                <div class="setting-row-right">
                  <span class="setting-current">••••••••</span>
                  <span class="setting-arrow">›</span>
                </div>
              </div>
            </div>

            <button class="modal-close-btn" @click="showSettingsModal = null">关闭</button>
          </GlassCard>
        </div>
      </Teleport>

      <!-- 内容弹窗（相册/收藏/帖子/回复/站内信/黑名单） -->
      <Teleport to="body">
        <div v-if="showContentModal" class="modal-overlay" @click.self="showContentModal = null">
          <GlassCard class="modal-content content-modal">
            <h3 class="modal-title">{{ contentModalTitle }}</h3>

            <!-- 我的相册 -->
            <div v-if="showContentModal === 'albums'" class="content-list">
              <div v-for="item in mockAlbums" :key="item.id" class="content-item">
                <div class="content-item-img" :style="{ background: item.gradient }"></div>
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.title }}</span>
                  <span class="content-item-meta">{{ item.date }} · {{ item.count }}张</span>
                </div>
              </div>
              <div v-if="!mockAlbums.length" class="content-empty">暂无相册</div>
            </div>

            <!-- 收藏记录 -->
            <div v-if="showContentModal === 'favorites'" class="content-list">
              <div v-for="item in mockFavorites" :key="item.id" class="content-item" @click="openExternal(item.url)">
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.title }}</span>
                  <span class="content-item-meta">{{ item.date }} · {{ item.type }}</span>
                </div>
                <span class="content-item-arrow">›</span>
              </div>
              <div v-if="!mockFavorites.length" class="content-empty">暂无收藏</div>
            </div>

            <!-- 我的帖子 -->
            <div v-if="showContentModal === 'posts'" class="content-list">
              <div v-for="item in mockPosts" :key="item.id" class="content-item" @click="openExternal('/posts')">
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.title }}</span>
                  <span class="content-item-meta">{{ item.date }} · 💬{{ item.comments }} · 👍{{ item.likes }}</span>
                </div>
                <span class="content-item-arrow">›</span>
              </div>
              <div v-if="!mockPosts.length" class="content-empty">暂无帖子</div>
            </div>

            <!-- 我的回复 -->
            <div v-if="showContentModal === 'replies'" class="content-list">
              <div v-for="item in mockReplies" :key="item.id" class="content-item" @click="openExternal('/posts')">
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.content }}</span>
                  <span class="content-item-meta">回复自：{{ item.postTitle }} · {{ item.date }}</span>
                </div>
                <span class="content-item-arrow">›</span>
              </div>
              <div v-if="!mockReplies.length" class="content-empty">暂无回复</div>
            </div>

            <!-- 站内信 -->
            <div v-if="showContentModal === 'messages'" class="content-list">
              <div v-for="item in mockMessages" :key="item.id" class="content-item">
                <div class="content-item-avatar">{{ item.avatar }}</div>
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.title }}</span>
                  <span class="content-item-meta">{{ item.from }} · {{ item.date }}</span>
                </div>
              </div>
              <div v-if="!mockMessages.length" class="content-empty">暂无站内信</div>
            </div>

            <!-- 黑名单 -->
            <div v-if="showContentModal === 'blacklist'" class="content-list">
              <div v-for="item in mockBlacklist" :key="item.id" class="content-item">
                <div class="content-item-avatar">{{ item.avatar }}</div>
                <div class="content-item-info">
                  <span class="content-item-title">{{ item.name }}</span>
                  <span class="content-item-meta">{{ item.reason }}</span>
                </div>
                <button class="unblock-btn" @click.stop="mockBlacklist.splice(mockBlacklist.findIndex(b => b.id === item.id), 1)">移除</button>
              </div>
              <div v-if="!mockBlacklist.length" class="content-empty">暂无黑名单</div>
            </div>

            <button class="modal-close-btn" @click="showContentModal = null">关闭</button>
          </GlassCard>
        </div>
      </Teleport>

      <!-- 账号信息弹窗 -->
      <Teleport to="body">
        <div v-if="showAccountDetail" class="modal-overlay" @click.self="showAccountDetail = false">
          <GlassCard class="modal-content account-detail-modal">
            <h3 class="modal-title">📋 账号信息</h3>
            <div class="account-detail-list">
              <div class="account-detail-item">
                <span class="detail-label">绑定邮箱</span>
                <span class="detail-value">{{ userStore.user?.email || '未绑定' }}</span>
              </div>
              <div class="account-detail-item">
                <span class="detail-label">绑定手机</span>
                <span class="detail-value">{{ userStore.user?.phone || '未绑定' }}</span>
              </div>
              <div class="account-detail-item">
                <span class="detail-label">微信</span>
                <span class="detail-value">未绑定</span>
              </div>
              <div class="account-detail-item">
                <span class="detail-label">微博</span>
                <span class="detail-value">未绑定</span>
              </div>
              <div class="account-detail-item">
                <span class="detail-label">QQ</span>
                <span class="detail-value">未绑定</span>
              </div>
              <div class="account-detail-item">
                <span class="detail-label">注册时间</span>
                <span class="detail-value">{{ userStore.user?.joinDate || '2025-06-15' }}</span>
              </div>
            </div>
            <button class="modal-close-btn" @click="showAccountDetail = false">关闭</button>
          </GlassCard>
        </div>
      </Teleport>

      <!-- 站内规则 -->
      <div class="rules-section">
        <h3 class="section-subtitle">📋 站内规则</h3>

        <div class="rule-block" :class="{ open: openRules.includes('points') }">
          <h4 class="rule-title" @click="toggleRule('points')">
            <span>💎 积分规则</span>
            <span class="rule-toggle">{{ openRules.includes('points') ? '−' : '+' }}</span>
          </h4>
          <div class="rule-content">
            <ul class="rule-list">
              <li>每日签到：随机 5~15 积分</li>
              <li>连续签到 7 天以上：额外 +10 积分</li>
              <li>发布帖子：+10 积分</li>
              <li>评论：+2 积分</li>
              <li>帖子被点赞：+2 积分</li>
              <li>完成任务/参与活动：按活动说明发放</li>
            </ul>
          </div>
        </div>

        <div class="rule-block" :class="{ open: openRules.includes('level') }">
          <h4 class="rule-title" @click="toggleRule('level')">
            <span>🏅 等级与勋章</span>
            <span class="rule-toggle">{{ openRules.includes('level') ? '−' : '+' }}</span>
          </h4>
          <div class="rule-content">
            <ul class="rule-list">
              <li>Lv.1 萌新摄影师（0 积分）— 基础功能</li>
              <li>Lv.2 业余爱好者（100 积分）— 可发布隐藏内容</li>
              <li>Lv.3 进阶摄影师（500 积分）— 解锁进阶工具</li>
              <li>Lv.4 资深达人（1500 积分）— 发帖积分翻倍</li>
              <li>Lv.5 摄影大师（5000 积分）— 解锁高级工具、免审核</li>
              <li>Lv.6 传奇领袖（15000 积分）— 全部权限解锁</li>
            </ul>
            <p class="rule-note">勋章通过签到连续天数、发帖数、参与活动等条件自动获得。</p>
          </div>
        </div>

        <div class="rule-block" :class="{ open: openRules.includes('violation') }">
          <h4 class="rule-title" @click="toggleRule('violation')">
            <span>⚠️ 违规处罚</span>
            <span class="rule-toggle">{{ openRules.includes('violation') ? '−' : '+' }}</span>
          </h4>
          <div class="rule-content">
            <ul class="rule-list">
              <li>发布广告 / 引流内容：删除帖子 + 禁言 3 天</li>
              <li>恶意刷帖 / 刷积分：扣除违规所得 + 禁言 7 天</li>
              <li>人身攻击 / 侮辱他人：禁言 3~7 天</li>
              <li>传播违法内容：永久封禁</li>
              <li>盗用他人作品：删除内容 + 警告或封禁</li>
            </ul>
            <p class="rule-note">违规记录累计 3 次将自动升级处罚。如有异议可联系管理员申诉。</p>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = null">
        <GlassCard class="modal-content">
          <h3 class="modal-title">{{ editModalTitles[showEditModal] }}</h3>
          <div v-if="saveMessage" class="save-message">{{ saveMessage }}</div>
          <form @submit.prevent="handleEditSubmit">
            <div v-if="showEditModal === 'avatar'" class="form-group">
              <div class="avatar-upload-area" @click="$refs.avatarFileInput.click()">
                <input ref="avatarFileInput" type="file" accept="image/*" @change="handleAvatarFileSelect" hidden />
                <div v-if="avatarPreview" class="avatar-preview-img">
                  <img :src="avatarPreview" alt="预览" />
                </div>
                <div v-else class="avatar-upload-placeholder">
                  <span class="upload-icon">📷</span>
                  <span>点击选择图片</span>
                  <span class="upload-hint">支持 JPG/PNG/GIF，最大 5MB</span>
                </div>
              </div>
              <div v-if="avatarUploadError" class="upload-error">{{ avatarUploadError }}</div>
              <p class="form-hint">或输入图片 URL：</p>
              <input v-model="editForm.avatar" type="text" placeholder="https://example.com/avatar.jpg" class="form-input" />
            </div>
            <div v-if="showEditModal === 'nickname'" class="form-group">
              <input v-model="editForm.nickname" type="text" placeholder="输入新昵称" class="form-input" />
            </div>
            <div v-if="showEditModal === 'birthday'" class="form-group">
              <input v-model="editForm.birthday" type="date" class="form-input" />
            </div>
            <div v-if="showEditModal === 'bio'" class="form-group">
              <textarea v-model="editForm.bio" placeholder="输入个人签名" class="form-input" rows="3"></textarea>
            </div>
            <div v-if="showEditModal === 'email'" class="form-group">
              <input v-model="editForm.email" type="email" placeholder="输入新邮箱" class="form-input" />
            </div>
            <div v-if="showEditModal === 'phone'" class="form-group">
              <input v-model="editForm.phone" type="tel" placeholder="输入新手机号" class="form-input" />
            </div>
            <div v-if="showEditModal === 'password'" class="form-group">
              <input v-model="editForm.oldPassword" type="password" placeholder="当前密码" class="form-input" />
              <input v-model="editForm.newPassword" type="password" placeholder="新密码" class="form-input" />
              <input v-model="editForm.confirmPassword" type="password" placeholder="确认新密码" class="form-input" />
            </div>
            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="showEditModal = null">取消</button>
              <button type="submit" class="submit-btn">保存</button>
            </div>
          </form>
        </GlassCard>
      </div>
    </Teleport>

    <!-- 积分明细弹窗 -->
    <Teleport to="body">
      <div v-if="showPointsDetail" class="modal-overlay" @click.self="showPointsDetail = false">
        <GlassCard class="modal-content points-modal">
          <h3 class="modal-title">积分明细</h3>
          <div class="points-summary">
            <div class="points-total">
              <span class="points-big">{{ userStore.user?.points }}</span>
              <span class="points-label">当前积分</span>
            </div>
            <div class="level-info-mini">
              <span>Lv.{{ userStore.levelInfo?.level }} {{ userStore.levelInfo?.name }}</span>
              <span v-if="userStore.levelInfo?.nextLevel" class="next-level-hint">
                距 Lv.{{ userStore.levelInfo.nextLevel.level }} 还需 {{ userStore.levelInfo.nextLevel.needed }} 积分
              </span>
            </div>
          </div>
          <div class="points-history">
            <div v-for="record in pointsHistory" :key="record.id" class="history-item">
              <div class="history-info">
                <span class="history-desc">{{ record.desc }}</span>
                <span class="history-time">{{ record.time }}</span>
              </div>
              <span class="history-points" :class="record.points > 0 ? 'positive' : 'negative'">
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </span>
            </div>
          </div>
          <button class="close-btn" @click="showPointsDetail = false">关闭</button>
        </GlassCard>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GlassCard from '@/components/common/GlassCard.vue'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({ username: '', password: '' })
const loginLoading = ref(false)

// 注册相关
const authTab = ref('login')
const registerForm = ref({ username: '', email: '', password: '', confirmPassword: '', verifyCode: '' })
const registerLoading = ref(false)
const registerError = ref('')
const verifyCountdown = ref(0)
const verifyHint = ref('')
const verifyCodeShow = ref('')
const showRegisterSuccess = ref(false)
const registeredUid = ref('')
let verifyTimer = null

// 邮箱格式校验
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const handleSendCode = async () => {
  registerError.value = ''
  if (!registerForm.value.email) {
    registerError.value = '请先输入邮箱'
    return
  }
  if (!isValidEmail(registerForm.value.email)) {
    registerError.value = '邮箱格式不正确'
    return
  }
  try {
    // 发送验证码
    const code = await userStore.sendVerifyCode(registerForm.value.email)
    verifyCodeShow.value = code
    verifyHint.value = `验证码已发送到邮箱 ${registerForm.value.email}，有效期5分钟`
    // 60秒倒计时
    verifyCountdown.value = 60
    if (verifyTimer) clearInterval(verifyTimer)
    verifyTimer = setInterval(() => {
      verifyCountdown.value--
      if (verifyCountdown.value <= 0) {
        clearInterval(verifyTimer)
        verifyTimer = null
      }
    }, 1000)
  } catch (e) {
    registerError.value = e.message || '发送验证码失败'
  }
}

const handleRegister = async () => {
  registerError.value = ''
  const { username, email, password, confirmPassword, verifyCode } = registerForm.value

  if (!username) { registerError.value = '请输入用户名'; return }
  if (!email) { registerError.value = '请输入邮箱'; return }
  if (!isValidEmail(email)) { registerError.value = '邮箱格式不正确'; return }
  if (!password) { registerError.value = '请输入密码'; return }
  if (password !== confirmPassword) { registerError.value = '两次输入的密码不一致'; return }
  if (!verifyCode || verifyCode.length !== 6) { registerError.value = '请输入6位验证码'; return }

  registerLoading.value = true
  const result = await userStore.register(username, email, password, verifyCode)
  registerLoading.value = false
  if (!result.ok) {
    registerError.value = result.msg
  } else {
    // 注册成功，显示用户ID
    registeredUid.value = result.uid || userStore.user?.uid || ''
    showRegisterSuccess.value = true
  }
}
onMounted(() => {
  if (!userStore.isLoggedIn) router.push('/login')
})


const editingNickname = ref(false)
const newNickname = ref('')
const nicknameInputRef = ref(null)
const showPointsDetail = ref(false)
const showSettingsModal = ref(null)
const showAccountDetail = ref(false)
const avatarPreview = ref('')
const avatarUploadError = ref('')
const showContentModal = ref(null)
const contentModalTitle = ref('')

const openSettingsModal = (type) => {
  showSettingsModal.value = type
}

const handleAvatarFileSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return
  avatarUploadError.value = ''

  // 限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    avatarUploadError.value = '图片大小不能超过 5MB'
    return
  }

  // 只允许图片类型
  if (!file.type.startsWith('image/')) {
    avatarUploadError.value = '请选择图片文件'
    return
  }

  const reader = new FileReader()
  reader.onload = (ev) => {
    avatarPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

const showEditModal = ref(null)

const openEditModal = (type) => {
  editForm.value = { avatar: '', nickname: '', birthday: '', bio: '', email: '', phone: '', oldPassword: '', newPassword: '', confirmPassword: '' }
  avatarPreview.value = ''
  // 预填当前值
  if (userStore.user) {
    const u = userStore.user
    if (type === 'nickname') editForm.value.nickname = u.nickname || ''
    if (type === 'birthday') editForm.value.birthday = u.birthday || ''
    if (type === 'bio') editForm.value.bio = u.bio || ''
    if (type === 'email') editForm.value.email = u.email || ''
    if (type === 'phone') editForm.value.phone = u.phone || ''
  }
  showEditModal.value = type
}


const editForm = ref({
  avatar: '',
  nickname: '',
  birthday: '',
  bio: '',
  email: '',
  phone: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const editModalTitles = {
  avatar: '修改头像',
  nickname: '修改昵称',
  birthday: '修改生日',
  bio: '修改个签',
  email: '修改邮箱',
  phone: '修改手机号',
  password: '修改密码',
}

const menuItems = [
  { key: 'albums', icon: '📷', label: '我的相册' },
  { key: 'favorites', icon: '❤️', label: '收藏记录' },
  { key: 'posts', icon: '📝', label: '我的帖子' },
  { key: 'replies', icon: '💬', label: '我的回复' },
  { key: 'messages', icon: '✉️', label: '站内信' },
  { key: 'blacklist', icon: '🚫', label: '黑名单' },
]

const menuBadges = ref({
  messages: 3,
  replies: 5,
})

// 模拟数据
const mockAlbums = ref([
  { id: 1, title: '城市夜景', date: '2026-03-28', count: 24, gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
  { id: 2, title: '人像写真', date: '2026-03-20', count: 18, gradient: 'linear-gradient(135deg, #2d1b4e, #1a1a2e)' },
  { id: 3, title: '风光旅行', date: '2026-03-15', count: 42, gradient: 'linear-gradient(135deg, #0f2027, #203a43)' },
])

const mockFavorites = ref([
  { id: 1, title: 'Sony A7R5 深度评测', date: '2026-03-29', type: '帖子', url: '/posts' },
  { id: 2, title: '夜景人像调色教程', date: '2026-03-28', type: '教程', url: '/tutorials' },
  { id: 3, title: '赛博霓虹预设', date: '2026-03-27', type: '预设', url: '/presets' },
])

const mockPosts = ref([
  { id: 1, title: '分享一组城市夜景', date: '2026-03-29', comments: 12, likes: 45 },
  { id: 2, title: '新人求教构图技巧', date: '2026-03-25', comments: 8, likes: 23 },
])

const mockReplies = ref([
  { id: 1, content: '这个构图真不错，前景运用得很好！', postTitle: '分享一组城市夜景', date: '2分钟前' },
  { id: 2, content: '推荐用 35mm 焦段试试', postTitle: '新人求教构图技巧', date: '1小时前' },
  { id: 3, content: '后期调色用的什么软件？', postTitle: '分享一组城市夜景', date: '3小时前' },
])

const mockMessages = ref([
  { id: 1, title: '欢迎加入摄影之家', from: '系统通知', date: '今天', avatar: '🤖' },
  { id: 2, title: '您的帖子收到新评论', from: '系统通知', date: '昨天', avatar: '💬' },
  { id: 3, title: '恭喜升级 Lv.3', from: '系统通知', date: '3天前', avatar: '🎉' },
])

const mockBlacklist = ref([
  { id: 1, name: '广告君', avatar: '🤖', reason: '频繁发广告' },
  { id: 2, name: '键盘侠', avatar: '⌨️', reason: '恶意评论' },
])

const openExternal = (url) => {
  if (url) window.open(url, '_blank')
}

const pointsHistory = ref([
  { id: 1, desc: '每日签到', time: '今天 09:30', points: 8 },
  { id: 2, desc: '发布帖子', time: '昨天 15:20', points: 20 },
  { id: 3, desc: '帖子被点赞', time: '昨天 16:45', points: 2 },
  { id: 4, desc: '完成任务', time: '3天前', points: 50 },
])

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) return
  loginLoading.value = true
  await userStore.login(loginForm.value.username, loginForm.value.password)
  loginLoading.value = false
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

const goVip = () => {
  if (userStore.user?.isVip) {
    alert('您已经是 VIP 会员！')
    return
  }
  if (confirm('开通 VIP 会员（占位功能，消耗 500 积分）？')) {
    if ((userStore.user?.points || 0) < 500) {
      alert('积分不足，需要 500 积分')
      return
    }
    userStore.addPoints(-500)
    alert('🎉 VIP 开通成功！')
  }
}

const openRules = ref([])
const toggleRule = (key) => {
  const idx = openRules.value.indexOf(key)
  if (idx > -1) {
    openRules.value.splice(idx, 1)
  } else {
    openRules.value.push(key)
  }
}

const startEditNickname = () => {
  editingNickname.value = true
  newNickname.value = userStore.user?.nickname || ''
  nextTick(() => {
    nicknameInputRef.value?.focus()
  })
}

const saveNickname = async () => {
  if (newNickname.value && newNickname.value !== userStore.user?.nickname) {
    await userStore.updateProfile({ nickname: newNickname.value })
  }
  editingNickname.value = false
}

const handleMenuClick = (item) => {
  // 点击后清除对应徽标
  if (menuBadges.value[item.key]) {
    menuBadges.value[item.key] = 0
  }

  const modalTitles = {
    albums: '📷 我的相册',
    favorites: '❤️ 收藏记录',
    posts: '📝 我的帖子',
    replies: '💬 我的回复',
    messages: '✉️ 站内信',
    blacklist: '🚫 黑名单',
  }

  if (modalTitles[item.key]) {
    contentModalTitle.value = modalTitles[item.key]
    showContentModal.value = item.key
  }
}

const saveMessage = ref('')
const handleEditSubmit = async () => {
  const data = {}
  switch (showEditModal.value) {
    case 'avatar':
      if (editForm.value.avatar) {
        data.avatar = editForm.value.avatar
      } else if (avatarPreview.value) {
        data.avatar = avatarPreview.value
      }
      break
    case 'nickname':
      if (editForm.value.nickname) data.nickname = editForm.value.nickname
      break
    case 'birthday':
      if (editForm.value.birthday) data.birthday = editForm.value.birthday
      break
    case 'bio':
      data.bio = editForm.value.bio || ''
      break
    case 'email':
      if (editForm.value.email) data.email = editForm.value.email
      break
    case 'phone':
      if (editForm.value.phone) data.phone = editForm.value.phone
      break
    case 'password':
      if (!editForm.value.oldPassword || !editForm.value.newPassword) {
        saveMessage.value = '请填写完整密码信息'
        setTimeout(() => saveMessage.value = '', 2000)
        return
      }
      if (editForm.value.newPassword !== editForm.value.confirmPassword) {
        saveMessage.value = '两次输入的新密码不一致'
        setTimeout(() => saveMessage.value = '', 2000)
        return
      }
      // 模拟密码修改成功
      saveMessage.value = '密码修改成功'
      setTimeout(() => saveMessage.value = '', 2000)
      editForm.value = { avatar: '', nickname: '', birthday: '', bio: '', email: '', phone: '', oldPassword: '', newPassword: '', confirmPassword: '' }
      showEditModal.value = null
      return
  }
  if (Object.keys(data).length > 0) {
    await userStore.updateProfile(data)
    saveMessage.value = '保存成功'
    setTimeout(() => saveMessage.value = '', 2000)
  }
  editForm.value = { avatar: '', nickname: '', birthday: '', bio: '', email: '', phone: '', oldPassword: '', newPassword: '', confirmPassword: '' }
  showEditModal.value = null
}

onMounted(async () => {
  if (userStore.token && !userStore.user) {
    await userStore.initUser()
  }
})
</script>

<style scoped>

.user-center-page {
  min-height: 100%;
  padding: 32px;
  color: var(--text-primary);
}

/* 注册成功弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.register-success-modal .success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.register-success-modal h3 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
}

.register-success-modal .success-msg {
  color: #666;
  margin-bottom: 24px;
}

.uid-display {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.uid-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.uid-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #333;
  letter-spacing: 2px;
  font-family: monospace;
}

.uid-tip {
  display: block;
  font-size: 12px;
  color: #ff6b6b;
  margin-top: 4px;
}

.login-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.login-methods {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.login-methods li {
  font-size: 14px;
  color: #555;
  padding: 4px 0;
}

.login-methods li::before {
  content: "✓ ";
  color: #51cf66;
}

.register-success-modal .login-btn {
  width: 100%;
  padding: 12px;
  background: #333;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

/* 登录区域 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px !important;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 32px;
}

/* Auth tabs */
.auth-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px;
}

.auth-tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-tab.active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

/* Verify code */
.verify-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.verify-input {
  flex: 1;
}

.verify-btn {
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
}

.verify-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-hint {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 8px;
}

.verify-hint-msg {
  font-size: 12px;
  color: #4ade80;
  margin: 0;
}

.verify-hint-code {
  font-size: 13px;
  color: #fbbf24;
  font-weight: 600;
  margin: 4px 0 0;
}

.register-error {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
}

.form-group {
  margin-bottom: 16px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.1);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.login-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15));
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 用户内容区 */
.user-content {
  max-width: 600px;
  margin: 0 auto;
}

/* 头部信息区 */
.profile-header {
  margin-bottom: 24px;
  padding: 28px !important;
}

.avatar-section {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 36px;
  font-weight: 600;
}

.avatar-edit-hint {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--text-secondary);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-wrapper:hover .avatar-edit-hint {
  opacity: 1;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nickname-row {
  display: flex;
  align-items: center;
}

.nickname {
  font-size: 22px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-icon {
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nickname:hover .edit-icon {
  opacity: 1;
}

.nickname-input {
  font-size: 22px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 4px 12px;
  color: var(--text-primary);
  outline: none;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.id-text {
  font-size: 14px;
  color: #555;
  font-family: monospace;
}

.info-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  background: rgba(94, 129, 244, 0.1);
  border: 1px solid rgba(94, 129, 244, 0.3);
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.info-btn:hover {
  background: rgba(94, 129, 244, 0.2);
  transform: scale(1.1);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #333;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.points-icon {
  font-size: 16px;
}

.points-value {
  font-weight: 600;
}

.points-detail {
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  margin-left: 8px;
  text-decoration: underline;
}

.points-detail:hover {
  color: var(--text-primary);
}

.membership-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.membership-tag {
  font-size: 13px;
  color: var(--text-secondary);
}

.membership-icon {
  font-size: 14px;
}

.membership-expire {
  font-size: 12px;
  color: var(--text-muted);
}

.vip-btn {
  padding: 4px 12px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  border: none;
  border-radius: 12px;
  color: #333;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.vip-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.4);
}

/* 我的勋章 */
.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.medals-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;
}

.medal-item {
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  flex-shrink: 0;
}

/* 功能菜单 */
.menu-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 18px !important;
  gap: 10px;
  border-radius: 12px;
}

.menu-icon {
  font-size: 18px;
}

.menu-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.menu-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.menu-arrow {
  display: none;
}

/* 设置入口 */
.settings-entry-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.settings-entry-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px !important;
  cursor: pointer;
  border-radius: 12px;
}

.settings-entry-icon {
  font-size: 18px;
}

.settings-entry-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.settings-entry-card:hover .settings-entry-label {
  color: var(--text-primary);
}

/* 设置弹窗 */
.settings-modal {
  max-width: 400px;
  width: 90vw;
}

.settings-modal-body {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-row:hover {
  color: var(--text-primary);
}

.setting-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-current {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setting-current-bio {
  max-width: 140px;
}

.setting-arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.modal-close-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #333;
}

/* 账号信息弹窗 */
.account-detail-modal {
  max-width: 400px;
  width: 90vw;
}

.account-detail-list {
  display: flex;
  flex-direction: column;
}

.account-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.account-detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 退出按钮 */
.logout-btn {
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(255, 80, 80, 0.5);
  border-radius: 12px;
  background: rgba(255, 80, 80, 0.15);
  color: #ff6b6b;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 80, 80, 0.25);
  border-color: rgba(255, 80, 80, 0.7);
}

/* 站内规则 */
.rules-section {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
}

.rules-section .section-subtitle {
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.rule-block {
  margin-bottom: 4px;
  border-radius: 10px;
  overflow: hidden;
}

.rule-block:last-child {
  margin-bottom: 0;
}

.rule-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 12px 14px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
  margin-bottom: 0;
}

.rule-title:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rule-toggle {
  font-size: 16px;
  color: var(--text-muted);
  font-weight: 400;
}

.rule-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.35s ease;
  padding: 0 14px;
}

.rule-block.open .rule-content {
  max-height: 500px;
  padding: 0 14px 14px;
}

.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rule-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.rule-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--text-muted);
}

.rule-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  padding: 28px !important;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.save-message {
  text-align: center;
  padding: 8px 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  font-size: 14px;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--text-primary);
}

.submit-btn {
  border: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  color: var(--text-primary);
}

.submit-btn:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15));
}

/* 头像上传 */
.avatar-upload-area {
  width: 100%;
  padding: 30px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.avatar-upload-area:hover {
  border-color: rgba(94, 129, 244, 0.5);
  background: rgba(94, 129, 244, 0.05);
}

.avatar-preview-img {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.upload-icon {
  font-size: 28px;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.upload-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
  margin-bottom: 6px;
}

/* 内容弹窗 */
.content-modal {
  max-width: 480px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.content-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.content-item-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  flex-shrink: 0;
}

.content-item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.content-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.content-item-title {
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-item-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.content-item-arrow {
  color: var(--text-muted);
  font-size: 18px;
  flex-shrink: 0;
}

.content-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.unblock-btn {
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.unblock-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* 积分明细弹窗 */
.points-modal {
  max-height: 80vh;
  overflow-y: auto;
}

.points-summary {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.points-big {
  font-size: 48px;
  font-weight: 700;
  display: block;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.points-label {
  font-size: 14px;
  color: var(--text-primary);
}

.level-info-mini {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.next-level-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.points-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-desc {
  font-size: 14px;
}

.history-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-points {
  font-size: 16px;
  font-weight: 600;
}

.history-points.positive {
  color: #4caf50;
}

.history-points.negative {
  color: #ff6b6b;
}

.close-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 响应式 */
@media (max-width: 768px) {
  .user-center-page {
    padding: 16px;
  }

  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-info {
    align-items: center;
  }

  .points-detail {
    margin-left: 0;
    margin-top: 4px;
  }
}

</style>

/* 已登录提示 */
.already-logged {
  text-align: center;
  padding: 40px 20px;
}
.already-logged-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.already-logged h2 {
  font-size: 24px;
  margin-bottom: 8px;
}
.already-logged p {
  color: #666;
  margin: 4px 0;
}
.uid-hint {
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0 20px;
}
.logged-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.logout-btn {
  background: #666 !important;
}
