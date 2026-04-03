<template>
  <div class="login-page">
    <GlassCard class="login-card">
      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: authTab === 'login' }" @click="authTab = 'login'">登录</button>
        <button class="auth-tab" :class="{ active: authTab === 'register' }" @click="authTab = 'register'">注册</button>
      </div>

      <h2 class="login-title">{{ authTab === 'login' ? '欢迎回来' : '创建账号' }}</h2>

      <form v-if="authTab === 'login' && !showForgotHint" @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input v-model="loginForm.username" type="text" placeholder="用户名" class="form-input" />
        </div>
        <div class="form-group">
          <input v-model="loginForm.password" type="password" placeholder="密码" class="form-input" />
        </div>
        <button type="submit" class="login-btn" :disabled="loginLoading">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
        <a class="forgot-link" @click.prevent="showForgotHint = !showForgotHint">忘记密码？</a>
        <p v-if="loginError" class="error-text">{{ loginError }}</p>
        

      </form>

      <!-- Reset Password Form -->
      <form v-if="authTab === 'login' && showForgotHint" @submit.prevent="handleResetPassword" class="login-form">
        <h2 class="login-title">重置密码</h2>
        <div class="form-group">
          <input v-model="resetForm.email" type="email" placeholder="注册邮箱" class="form-input" />
        </div>
        <div class="form-group verify-row">
          <input v-model="resetForm.verifyCode" type="text" placeholder="验证码（6位）" class="form-input verify-input" maxlength="6" />
          <button type="button" class="verify-btn" :disabled="resetCountdown > 0" @click="handleSendResetCode">
            {{ resetCountdown > 0 ? resetCountdown + 's' : '发送验证码' }}
          </button>
        </div>
        <div v-if="verifyHint" class="verify-hint">
          <p class="verify-hint-msg">{{ verifyHint }}</p>
        </div>
        <div class="form-group">
          <input v-model="resetForm.newPassword" type="password" placeholder="新密码" class="form-input" />
        </div>
        <button type="submit" class="login-btn">重置密码</button>
        <p v-if="resetError" class="error-text">{{ resetError }}</p>
        <p v-if="resetSuccess" class="success-text">{{ resetSuccess }}</p>
        <a class="forgot-link" @click.prevent="showForgotHint = false">返回登录</a>
      </form>

      <form v-if="authTab === 'register'" @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <input v-model="registerForm.username" type="text" placeholder="用户名（必填）" class="form-input" />
        </div>
        <div class="form-group">
          <input v-model="registerForm.email" type="email" placeholder="邮箱（必填）" class="form-input" />
        </div>
        <div class="form-group">
          <input v-model="registerForm.password" type="password" placeholder="密码（必填）" class="form-input" />
        </div>
        <div class="form-group">
          <input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" class="form-input" />
        </div>
        <div class="form-group verify-row">
          <input v-model="registerForm.verifyCode" type="text" placeholder="邮箱验证码（6位）" class="form-input verify-input" maxlength="6" />
          <button type="button" class="verify-btn" :disabled="verifyCountdown > 0" @click="handleSendCode">
            {{ verifyCountdown > 0 ? verifyCountdown + 's' : '发送验证码' }}
          </button>
        </div>
        <div v-if="verifyHint" class="verify-hint">
          <p class="verify-hint-msg">{{ verifyHint }}</p>
          
        </div>
        <div v-if="registerError" class="register-error">{{ registerError }}</div>
        <button type="submit" class="login-btn" :disabled="registerLoading">
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
      </form>
    </GlassCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GlassCard from '@/components/common/GlassCard.vue'

const router = useRouter()
const userStore = useUserStore()

const authTab = ref('login')
const loginForm = ref({ username: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')
const showForgotHint = ref(false)
const resetForm = ref({ email: '', verifyCode: '', newPassword: '' })
const resetCountdown = ref(0)
const resetError = ref('')
const resetSuccess = ref('')
let resetTimer = null

const handleSendResetCode = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  if (!resetForm.value.email) { resetError.value = '请输入邮箱'; return }
  try {
    await userStore.sendVerifyCode(resetForm.value.email, 'reset')
    resetCountdown.value = 60
    if (resetTimer) clearInterval(resetTimer)
    resetTimer = setInterval(() => { resetCountdown.value--; if (resetCountdown.value <= 0) { clearInterval(resetTimer); resetTimer = null } }, 1000)
    resetSuccess.value = '验证码已发送'
  } catch (e) { resetError.value = e.message || '发送失败' }
}

const handleResetPassword = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  const { email, verifyCode, newPassword } = resetForm.value
  if (!email || !verifyCode || !newPassword) { resetError.value = '请填写所有字段'; return }
  if (verifyCode.length !== 6) { resetError.value = '验证码为6位'; return }
  try {
    const result = await userStore.resetPassword(email, verifyCode, newPassword)
    if (result.ok) {
      resetSuccess.value = '密码重置成功，请重新登录'
      showForgotHint.value = false
      resetForm.value = { email: '', verifyCode: '', newPassword: '' }
    } else {
      resetError.value = result.msg
    }
  } catch (e) { resetError.value = e.message || '重置失败' }
}

const registerForm = ref({ username: '', email: '', password: '', confirmPassword: '', verifyCode: '' })
const registerLoading = ref(false)
const registerError = ref('')
const verifyCountdown = ref(0)
const verifyHint = ref('')
const verifyCodeShow = ref('') // hidden
let verifyTimer = null

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const handleSendCode = async () => {
  registerError.value = ''
  if (!registerForm.value.email) { registerError.value = '请先输入邮箱'; return }
  if (!isValidEmail(registerForm.value.email)) { registerError.value = '邮箱格式不正确'; return }
  try {
    const code = await userStore.sendVerifyCode(registerForm.value.email, 'register')
    // verifyCodeShow.value = code // removed for production
    verifyHint.value = '验证码已发送'
    verifyCountdown.value = 60
    if (verifyTimer) clearInterval(verifyTimer)
    verifyTimer = setInterval(() => { verifyCountdown.value--; if (verifyCountdown.value <= 0) { clearInterval(verifyTimer); verifyTimer = null } }, 1000)
  } catch (e) { registerError.value = e.message || '发送验证码失败' }
}

const handleLogin = async () => {
  loginError.value = ''
  loginLoading.value = true
  try {
    await userStore.login(loginForm.value.username, loginForm.value.password)
    router.push('/user')
  } catch (e) { loginError.value = e.message || '登录失败' }
  loginLoading.value = false
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
  if (!result.ok) { registerError.value = result.msg; return }
  router.push('/user')
}

onMounted(() => {
  if (userStore.isLoggedIn) router.push('/user')
})
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
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

.verify-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.verify-row .verify-input { flex: 1; min-width: 0; }
.verify-row .verify-btn { flex-shrink: 0; width: auto; min-width: 100px; }
.verify-input { flex: 1; }
.verify-btn { padding: 0 16px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); font-size: 13px; white-space: nowrap; cursor: pointer; }
.verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.verify-hint {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 8px;
}

.verify-hint-msg { color: #4ade80; font-size: 13px; }
.verify-hint-code { color: #fbbf24; font-size: 12px; margin-top: 4px; }

.register-error { color: #f87171; font-size: 13px; text-align: center; margin-bottom: 12px; }
.error-text { color: #f87171; font-size: 13px; text-align: center; margin-top: 12px; }

.form-group { margin-bottom: 16px; }
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
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--text-secondary); background: rgba(255, 255, 255, 0.1); }
.form-input::placeholder { color: var(--text-secondary); }
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
.login-btn:hover:not(:disabled) { background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15)); transform: translateY(-2px); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.forgot-link { display: block; text-align: center; margin-top: 16px; color: var(--text-secondary); font-size: 13px; cursor: pointer; }
.forgot-link:hover { color: var(--text-primary); }
.forgot-hint { text-align: center; color: var(--text-secondary); font-size: 13px; margin-top: 8px; }

.reset-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.reset-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 16px; }
.success-text { color: #4ade80; font-size: 13px; text-align: center; margin-top: 8px; }
.verify-btn { width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 14px; cursor: pointer; margin-bottom: 16px; }
.verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
