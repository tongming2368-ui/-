<template>
  <aside class="glass-sidebar" :class="{ 'photo-mode': modeStore.mode === 'photo' }">
    <!-- Logo -->
    <div class="sidebar-logo" @mouseenter="sidebarLogoHover = true" @mouseleave="sidebarLogoHover = false">
      <div class="logo-mark">
        <canvas ref="sidebarStaticCanvas" class="logo-gif" v-show="!sidebarLogoHover"></canvas>
        <img src="@/assets/logo.gif" class="logo-gif" v-show="sidebarLogoHover" alt="Logo" />
      </div>
      <div class="logo-text">
        <span v-if="modeStore.mode === 'tool'">工具站</span>
        <span v-else>汇相-摄影之家</span>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <template v-for="item in currentMenu" :key="item.id">
        <!-- 分组菜单 -->
        <div v-if="item.children" class="menu-group">
          <div class="menu-item" @click="toggleGroup(item.id)">
            <ion-icon :name="item.ionIcon || 'apps-outline'" class="menu-ion-icon"></ion-icon>
            <span class="menu-label">{{ item.label }}</span>
            <ion-icon
              name="chevron-down-outline"
              class="menu-arrow"
              :class="{ rotated: openGroups.includes(item.id) }"
            ></ion-icon>
          </div>
          <Transition name="submenu">
            <div v-show="openGroups.includes(item.id)" class="submenu">
              <router-link
                v-for="child in item.children"
                :key="child.id"
                :to="child.path"
                class="menu-item child"
                active-class="active"
              >
                <ion-icon :name="child.ionIcon || 'ellipse-outline'" class="menu-ion-icon"></ion-icon>
                <span class="menu-label">{{ child.label }}</span>
              </router-link>
            </div>
          </Transition>
        </div>

        <!-- 普通菜单 -->
        <router-link
          v-else
          :to="item.path"
          class="menu-item"
          active-class="active"
        >
          <ion-icon :name="item.ionIcon || 'ellipse-outline'" class="menu-ion-icon"></ion-icon>
          <span class="menu-label">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <!-- 底部 -->
    <div class="sidebar-bottom">
      <div class="sidebar-divider"></div>
      <!-- 模式切换 -->
      <div class="menu-item" @click="handleToggle">
        <ion-icon :name="modeStore.mode === 'tool' ? 'camera-outline' : 'construct-outline'" class="menu-ion-icon"></ion-icon>
        <span class="menu-label">{{ modeStore.mode === 'tool' ? '切换摄影' : '切换工具' }}</span>
      </div>
      <!-- 主题切换 -->
      <div class="menu-item" @click="toggleTheme">
        <ion-icon :name="isLight ? 'moon-outline' : 'sunny-outline'" class="menu-ion-icon"></ion-icon>
        <span class="menu-label">{{ isLight ? '夜间模式' : '日间模式' }}</span>
      </div>
      <!-- 聊天室 -->
      <div class="menu-item" @click="toggleChat">
        <ion-icon name="chatbubbles-outline" class="menu-ion-icon"></ion-icon>
        <span class="menu-label">在线聊天室</span>
      </div>
      <!-- 用户中心 -->
      <router-link to="/login" class="menu-item" active-class="active">
        <ion-icon name="person-outline" class="menu-ion-icon"></ion-icon>
        <span class="menu-label">用户中心</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useModeStore } from '@/stores/mode'
import { toolMenu, photoMenu } from '@/config/menu'
import { parseGIF, decompressFrames } from 'gifuct-js'
import logoGifUrl from '@/assets/logo.gif'

const modeStore = useModeStore()
const router = useRouter()
const openGroups = ref(['qionsandai'])
const isLight = ref(false)
const sidebarLogoHover = ref(false)
const sidebarStaticCanvas = ref(null)

const emit = defineEmits(['toggleChat'])


const toggleTheme = () => {
  isLight.value = !isLight.value
  document.body.classList.toggle('light-theme', isLight.value)
  localStorage.setItem('lightTheme', isLight.value)
}

const currentMenu = computed(() => {
  return modeStore.mode === 'tool' ? toolMenu : photoMenu
})

const toggleGroup = (id) => {
  const idx = openGroups.value.indexOf(id)
  if (idx >= 0) {
    openGroups.value.splice(idx, 1)
  } else {
    openGroups.value.push(id)
  }
}

const handleToggle = () => {
  modeStore.toggleMode()
  router.push('/')
}

const toggleChat = () => {
  emit('toggleChat')
}

onMounted(() => {
  const saved = localStorage.getItem('lightTheme')
  if (saved === 'true') {
    isLight.value = true
    document.body.classList.add('light-theme')
  }

  // Extract first frame from logo GIF for static display
  nextTick(async () => {
    try {
      const response = await fetch(logoGifUrl)
      const buffer = await response.arrayBuffer()
      const gif = parseGIF(buffer)
      const frames = decompressFrames(gif, true)
      if (frames.length > 0 && sidebarStaticCanvas.value) {
        const frame = frames[0]
        const canvas = sidebarStaticCanvas.value
        canvas.width = frame.dims.width
        canvas.height = frame.dims.height
        const ctx = canvas.getContext('2d')
        const imageData = ctx.createImageData(frame.dims.width, frame.dims.height)
        imageData.data.set(frame.patch)
        ctx.putImageData(imageData, 0, 0)
      }
    } catch (e) {
      console.warn('Failed to extract static logo frame:', e)
    }
  })
})
</script>

<style scoped>
.glass-sidebar {
  width: 5em;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  background: rgba(16, 18, 27, 0.88);
  backdrop-filter: blur(24px) saturate(1.3);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-sidebar.photo-mode {
  background: rgba(28, 22, 18, 0.88);
  border-right-color: rgba(255, 200, 140, 0.1);
}

.glass-sidebar:hover {
  width: 16em;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
  white-space: nowrap;
}

.logo-mark {
  font-size: 22px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-gif {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  opacity: 0;
  transition: opacity 0.3s ease 0.1s;
  white-space: nowrap;
}

.glass-sidebar:hover .logo-text {
  opacity: 1;
}

/* 导航 */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav::-webkit-scrollbar {
  width: 0;
}

/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--menu-color);
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.menu-item:hover {
  background: var(--menu-hover-bg, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  font-weight: 500;
}

.menu-item.child {
  padding-left: 24px;
  font-size: 13px;
}

.menu-ion-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  opacity: 0;
  transition: opacity 0.3s ease 0.1s;
  white-space: nowrap;
  overflow: hidden;
}

.glass-sidebar:hover .menu-label {
  opacity: 1;
}

.menu-arrow {
  font-size: 14px;
  margin-left: auto;
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.glass-sidebar:hover .menu-arrow {
  opacity: 1;
}

.menu-arrow.rotated {
  transform: rotate(180deg);
}

/* 子菜单 */
.submenu {
  overflow: hidden;
}

/* 底部 */
.sidebar-bottom {
  flex-shrink: 0;
  margin-top: auto;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 12px;
}

/* 子菜单过渡 */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 日间主题 */
body.light-theme .glass-sidebar {
  background: rgba(245, 248, 252, 0.88);
  border-right-color: rgba(255, 255, 255, 0.5);
}

body.light-theme .glass-sidebar.photo-mode {
  background: rgba(250, 248, 242, 0.88);
  border-right-color: rgba(255, 240, 220, 0.4);
}
</style>
