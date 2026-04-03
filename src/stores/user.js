import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getLevel, hasPrivilege, levelConfig } from '@/config/level'
import { login as apiLogin, register as apiRegister, sendCode as apiSendCode, getMe, resetPassword as apiResetPassword } from '@/api/auth'
import { updateProfile as apiUpdateProfile, signIn as apiSignIn, getSignStatus } from '@/api/users'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || '')
  const isLoggedIn = computed(() => !!user.value)

  // ========== 登录 ==========
  const login = async (username, password) => {
    try {
      const data = await apiLogin({ username, password })
      token.value = data.token
      user.value = data.user
      localStorage.setItem('auth_token', data.token)
      return true
    } catch (e) {
      console.error('Login failed:', e.message)
      return false
    }
  }

  // ========== 发送邮箱验证码 ==========
  const resetPassword = async (email, verifyCode, newPassword) => {
        const data = await apiResetPassword({ email, verifyCode, newPassword })
        if (!data.ok) throw new Error(data.msg || '重置失败')
        return data
      }
      
      const sendVerifyCode = async (email, type = register) => {
    try {
      const data = await apiSendCode(email, type)
      return data.code || true
    } catch (e) {
      console.error('Send code failed:', e.message)
      throw e
    }
  }

  // ========== 注册 ==========
  const register = async (username, email, password, verifyCode) => {
    try {
      const data = await apiRegister({ username, email, password, verifyCode })
      token.value = data.token
      user.value = data.user
      localStorage.setItem('auth_token', data.token)
      return { ok: true, uid: data.uid }
    } catch (e) {
      return { ok: false, msg: e.message }
    }
  }

  // ========== 登出 ==========
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('auth_token')
  }

  // ========== 初始化（从 token 恢复用户） ==========
  const initUser = async () => {
    if (!token.value) return false
    try {
      const data = await getMe()
      user.value = data.user
      return true
    } catch {
      token.value = ''
      localStorage.removeItem('auth_token')
      return false
    }
  }

  // ========== 签到 ==========
  const sign = async () => {
    try {
      const data = await apiSignIn()
      if (user.value) {
        user.value.points = data.total
        user.value.sign_days = data.signDays
      }
      return data
    } catch (e) {
      return { points: 0, total: user.value?.points || 0, signDays: user.value?.sign_days || 0 }
    }
  }

  // 获取签到状态
  const fetchSignStatus = async () => {
    try {
      const data = await getSignStatus()
      return data.signed
    } catch {
      return false
    }
  }

  // ========== 修改资料 ==========
  const updateProfile = async (data) => {
    try {
      const result = await apiUpdateProfile(data)
      if (user.value) {
        Object.assign(user.value, result.user)
      }
      return true
    } catch (e) {
      console.error('Update profile failed:', e.message)
      return false
    }
  }

  // ========== 积分操作（本地更新） ==========
  const addPoints = (pts) => {
    if (user.value) {
      user.value.points = Math.max(0, (user.value.points || 0) + pts)
      user.value.level = getLevel(user.value.points).level
    }
  }

  // ========== 权限检查 ==========
  const checkPrivilege = (privilege) => {
    if (!user.value) return false
    return hasPrivilege(user.value.level, privilege)
  }

  // ========== 管理员认证 ==========
  const adminToken = ref(localStorage.getItem('admin_token') || '')
  const adminUser = ref(null)

  const adminLogin = async (username, password) => {
    try {
      const data = await apiLogin({ username, password })
      if (!data.user.is_admin) {
        return { ok: false, msg: '该账号不是管理员' }
      }
      adminToken.value = data.token
      adminUser.value = data.user
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      return { ok: true }
    } catch (e) {
      return { ok: false, msg: e.message }
    }
  }

  const adminLogout = () => {
    adminToken.value = ''
    adminUser.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  const isAdminLoggedIn = computed(() => !!adminToken.value)

  // 初始化管理员用户
  const initAdminUser = async () => {
    if (!adminToken.value) return false
    try {
      // 临时用 admin token 请求
      const oldToken = token.value
      token.value = adminToken.value
      const data = await getMe()
      token.value = oldToken
      if (data.user.is_admin) {
        adminUser.value = data.user
        return true
      }
      return false
    } catch {
      adminLogout()
      return false
    }
  }

  // ========== 等级信息 ==========
  const getNextLevelInfo = (points) => {
    for (const l of levelConfig) {
      if (points < l.minPoints) {
        return { level: l.level, name: l.name, minPoints: l.minPoints, needed: l.minPoints - points }
      }
    }
    return null
  }

  const levelInfo = computed(() => {
    if (!user.value) return null
    const info = getLevel(user.value.points || 0)
    return {
      ...info,
      nextLevel: getNextLevelInfo(user.value.points || 0),
    }
  })

  return {
    user, token, isLoggedIn, levelInfo,
    login, logout, initUser, checkPrivilege, sign, fetchSignStatus, updateProfile, addPoints,
    register, sendVerifyCode, resetPassword,
    // 管理员相关
    adminToken, adminUser, adminLogin, adminLogout, isAdminLoggedIn, initAdminUser
  }
})
