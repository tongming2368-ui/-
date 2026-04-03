<template>
  <div class="app-container" :class="[currentMode + '-mode', 'mode-transition', { 'mobile-menu-open': mobileMenuOpen }]">
    <!-- 背景层 -->
    <div v-if="!isAdminRoute" class="animated-bg">
      <div class="bg-image"></div>
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 移动端菜单按钮 -->
    <button v-if="!isAdminRoute" class="mobile-menu-btn" @touchstart.stop :class="{ hidden: mobileMenuOpen }" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
    
    <!-- 移动端遮罩 -->
    <div v-if="mobileMenuOpen && !isAdminRoute" class="mobile-overlay" @touchstart.stop @click="mobileMenuOpen = false"></div>

    <!-- 侧边栏 -->
    <AppSidebar v-if="!isAdminRoute" @toggleChat="toggleChat" :mobile-open="mobileMenuOpen" />

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>

    <!-- 页面切换 Loading 遮罩 -->
    <Transition name="loader-fade">
      <div v-if="showLoader" class="page-loader-overlay">
        <div class="bounce-loader">
          <div class="bounce-dot"></div>
          <div class="bounce-dot"></div>
          <div class="bounce-dot"></div>
        </div>
      </div>
    </Transition>

    <!-- 聊天室悬浮窗（全局） -->
    <ChatWidget v-model:isOpen="chatOpen" />

    <!-- 登录提示弹窗（全局） -->
    <LoginPromptModal v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useModeStore } from '@/stores/mode'
import { useUserStore } from '@/stores/user'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'
import LoginPromptModal from '@/components/common/LoginPromptModal.vue'

const route = useRoute()
const modeStore = useModeStore()
const userStore = useUserStore()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const currentMode = computed(() => modeStore.mode)
const showLoader = ref(false)

let loaderTimer = null

watch(() => route.path, () => {
  showLoader.value = true
  clearTimeout(loaderTimer)
  loaderTimer = setTimeout(() => {
    showLoader.value = false
  }, 500)
})

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('phototool_settings_data')
    if (saved) {
      const s = JSON.parse(saved)
      if (s.siteTitle) document.title = s.siteTitle
      // 应用 CSS 变量
      if (s.bgOpacity !== undefined) document.documentElement.style.setProperty('--bg-opacity', s.bgOpacity)
      if (s.gauzeOpacity !== undefined) document.documentElement.style.setProperty('--gauze-opacity', s.gauzeOpacity)
      if (s.gauzeBlur !== undefined) document.documentElement.style.setProperty('--gauze-blur', s.gauzeBlur + 'px')

      // 应用动态渐变色
      let dynamicStyle = document.getElementById('dynamic-gradient-style')
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style')
        dynamicStyle.id = 'dynamic-gradient-style'
        document.head.appendChild(dynamicStyle)
      }
      dynamicStyle.textContent = `
        .tool-mode .app-container { background: linear-gradient(160deg, ${s.toolGradient1 || '#0a0e1a'} 0%, ${s.toolGradient2 || '#111827'} 40%, ${s.toolGradient3 || '#0f172a'} 100%) !important; }
        .photo-mode .app-container { background: linear-gradient(160deg, ${s.photoGradient1 || '#1a0f05'} 0%, ${s.photoGradient2 || '#1c1410'} 40%, ${s.photoGradient3 || '#160e08'} 100%) !important; }
        body.light-theme .tool-mode .app-container { background: linear-gradient(160deg, ${s.lightToolGradient1 || '#d8eaf5'} 0%, ${s.lightToolGradient2 || '#c8e0f0'} 40%, ${s.lightToolGradient3 || '#c0d8ea'} 100%) !important; }
        body.light-theme .photo-mode .app-container { background: linear-gradient(160deg, ${s.lightPhotoGradient1 || '#e8e0d0'} 0%, ${s.lightPhotoGradient2 || '#e0d8c8'} 40%, ${s.lightPhotoGradient3 || '#d8d0c0'} 100%) !important; }
      `
    }
  } catch {}
}

onMounted(() => {
  modeStore.initMode()
  userStore.initUser()
  loadSettings()

  // 监听设置变化
  window.addEventListener('storage', (e) => {
    if (e.key === 'phototool_settings_data') loadSettings()
  })
})

const chatOpen = ref(false)
const mobileMenuOpen = ref(false)
const toggleChat = () => {
  chatOpen.value = !chatOpen.value
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  position: relative;
}

/* 动态渐变背景层 */
.animated-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.animated-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-image {
  position: absolute;
  inset: 0;
  background: url('./assets/bg.jpg') center/cover no-repeat;
  opacity: var(--bg-opacity, 0.3);
  filter: brightness(1.1) saturate(0);
  mix-blend-mode: luminosity;
}

.animated-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: var(--gauze-opacity, 0.5);
  backdrop-filter: blur(var(--gauze-blur, 0px));
  -webkit-backdrop-filter: blur(var(--gauze-blur, 0px));
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: calc(var(--gauze-opacity, 0.15) * 0.3);
  animation: float 25s ease-in-out infinite;
}

.tool-mode .orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.tool-mode .orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  bottom: -150px;
  right: -100px;
  animation-delay: -7s;
}

.tool-mode .orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

.photo-mode .orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  top: -200px;
  right: -100px;
  animation-delay: 0s;
}

.photo-mode .orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
  bottom: -150px;
  left: -100px;
  animation-delay: -7s;
}

.photo-mode .orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(15px, 15px) scale(1.02); }
}

.main-content {
  margin-left: 5em;
  flex: 1;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面切换过渡 */
.page-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-leave-active {
  transition: opacity 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
}

/* ===== Bounce Loader ===== */
.page-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.bounce-loader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bounce-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: bounce 0.6s ease-in-out infinite alternate;
}

.bounce-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.bounce-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0% {
    transform: translateY(0);
    opacity: 0.4;
  }
  100% {
    transform: translateY(-16px);
    opacity: 1;
  }
}

/* Loader 遮罩过渡 */
.loader-fade-enter-active {
  transition: opacity 0.15s ease;
}

.loader-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}

/* moved to non-scoped style below */

/* Mobile - Global */
.mobile-menu-btn { display: none; position: fixed; top: 12px; left: 12px; z-index: 1000; width: 44px; height: 44px; border: none; border-radius: 12px; background: rgba(16, 18, 27, 0.9); backdrop-filter: blur(10px); color: white; font-size: 24px; cursor: pointer; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.mobile-menu-btn.hidden { opacity: 0; pointer-events: none; }
.mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
@media (max-width: 768px) {
  .mobile-menu-btn { display: flex; }
  .main-content { margin-left: 0 !important; }
  .animated-bg { display: none; }
  .app-container:not(.mobile-menu-open) :deep(.glass-sidebar) { width: 0; padding: 0; }
  .app-container.mobile-menu-open :deep(.glass-sidebar) { width: 16em !important; padding: 16px 8px !important; }
}


</style>

