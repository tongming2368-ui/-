import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModeStore = defineStore('mode', () => {
  const mode = ref('tool') // 'tool' | 'photo'
  const showWelcome = ref(false)

  const toggleMode = () => {
    // 先显示快门动画
    showWelcome.value = true
    setTimeout(() => {
      mode.value = mode.value === 'tool' ? 'photo' : 'tool'
      localStorage.setItem('siteMode', mode.value)
    }, 300)
    // 欢迎语显示后消失
    setTimeout(() => {
      showWelcome.value = false
    }, 2000)
  }

  const initMode = () => {
    const saved = localStorage.getItem('siteMode')
    if (saved) mode.value = saved
  }

  return { mode, showWelcome, toggleMode, initMode }
})
