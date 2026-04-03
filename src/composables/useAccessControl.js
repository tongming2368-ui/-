import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'

// 登录提示弹窗状态
const showLoginPrompt = ref(false)
const loginPromptMessage = ref('请登录后继续操作')

export function useAccessControl() {
  const userStore = useUserStore()
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  // 显示登录提示
  const promptLogin = (message = '请登录后继续操作') => {
    loginPromptMessage.value = message
    showLoginPrompt.value = true
  }

  // 关闭登录提示
  const closeLoginPrompt = () => {
    showLoginPrompt.value = false
  }

  // 检查是否有权限，无权限则弹出提示
  const requireLogin = (message = '请登录后继续操作') => {
    if (!isLoggedIn.value) {
      promptLogin(message)
      return false
    }
    return true
  }

  // 装饰器：点击事件包装器，未登录弹提示
  const guarded = (action, message = '请登录后继续操作') => {
    return (...args) => {
      if (requireLogin(message)) {
        action(...args)
      }
    }
  }

  return {
    isLoggedIn,
    showLoginPrompt,
    loginPromptMessage,
    promptLogin,
    closeLoginPrompt,
    requireLogin,
    guarded,
  }
}
