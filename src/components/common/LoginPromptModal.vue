<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showLoginPrompt" class="login-prompt-overlay" @click.self="closeLoginPrompt">
        <div class="login-prompt-card">
          <div class="prompt-icon">🔒</div>
          <h3 class="prompt-title">需要登录</h3>
          <p class="prompt-message">{{ loginPromptMessage }}</p>
          <div class="prompt-actions">
            <button class="prompt-btn primary" @click="goToLogin">登录 / 注册</button>
            <button class="prompt-btn" @click="closeLoginPrompt">取消</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAccessControl } from '@/composables/useAccessControl'

const router = useRouter()
const { showLoginPrompt, loginPromptMessage, closeLoginPrompt } = useAccessControl()

const goToLogin = () => {
  closeLoginPrompt()
  router.push('/user')
}
</script>

<style scoped>
.login-prompt-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-prompt-card {
  background: rgba(20, 22, 32, 0.95);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 36px 32px;
  text-align: center;
  max-width: 340px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.prompt-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}

.prompt-message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 28px;
  line-height: 1.5;
}

.prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompt-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.prompt-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.prompt-btn.primary {
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  border: none;
  color: #fff;
}

.prompt-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(94, 129, 244, 0.4);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
