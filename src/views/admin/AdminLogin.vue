<template>
  <div class="admin-login">
    <div class="login-bg"></div>
    <div class="login-container">
      <div class="glass-card">
        <div class="login-header">
          <div class="logo-icon">⚙️</div>
          <h1>后台管理系统</h1>
          <p>汇相-摄影之家 · 管理后台</p>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
        <div class="login-footer">
          <p>默认账号: admin / admin123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

// 如果已经登录，直接跳转
onMounted(async () => {
  if (userStore.adminToken) {
    const valid = await userStore.initAdminUser()
    if (valid) {
      router.push('/admin/dashboard')
    }
  }
})

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true

  const result = await userStore.adminLogin(username.value, password.value)
  if (result.ok) {
    router.push('/admin/dashboard')
  } else {
    errorMsg.value = result.msg || '用户名或密码错误'
  }
  loading.value = false
}
</script>

<style scoped>

.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #e8eef4 0%, #dce6ee 50%, #d0dff0 100%);
}

.login-bg::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(94, 129, 244, 0.2) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.login-bg::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
  bottom: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-header h1 {
  color: #111;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.login-header p {
  color: #9ca3af;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  color: #1e2e3a;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
}

.form-group input::placeholder {
  color: #9ca3af;
}

.form-group input:focus {
  border-color: rgba(94, 129, 244, 0.6);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(94, 129, 244, 0.15);
}

.error-msg {
  color: #e53e3e;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(94, 129, 244, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  color: #6b7280;
  font-size: 12px;
}

</style>
