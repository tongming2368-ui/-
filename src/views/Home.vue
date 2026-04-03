<template>
  <div class="home-page">
    <!-- 欢迎语覆盖层 -->
    <Transition name="welcome">
      <div v-if="modeStore.showWelcome" class="welcome-overlay">
        <div class="welcome-content">
          <p class="welcome-text">{{ modeStore.mode === 'tool' ? '欢迎回来，工具达人。' : '欢迎摄影师，回家。' }}</p>
        </div>
      </div>
    </Transition>



    <!-- 中央 Logo 区域 -->
    <div class="hero-section">
      <div class="logo-wrapper">
        <button @click="handleModeToggle" class="hero-logo" :class="{ 'photo-mode': modeStore.mode === 'photo', 'shutter-close': isShutterAnim }"
                @mouseenter="logoHover = true" @mouseleave="logoHover = false">
          <span class="logo-inner">
            <canvas ref="staticLogoCanvas" class="custom-logo-img" v-show="!logoHover"></canvas>
            <img src="@/assets/logo.gif" class="custom-logo-img" v-show="logoHover" alt="logo" />
          </span>
        </button>
      </div>
    </div>

    <!-- 广告位 -->
    <div v-for="ad in activeAds.filter(a => a.position === '首页顶部')" :key="ad.id" class="ad-banner" @click="openAd(ad)">
      <span class="ad-label">广告</span>
      <span class="ad-name">{{ ad.name }}</span>
    </div>

    <!-- 工具站模式内容 -->
    <div v-if="modeStore.mode === 'tool'" class="tool-content">
      <!-- 快捷工具入口 -->
      <section class="section">
        <h2 class="section-title">常用工具</h2>
        <div class="tools-grid">
          <GlassCard
            v-for="tool in quickTools"
            :key="tool.id"
            hoverable
            class="tool-card"
            @click="$router.push(tool.path)"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            <span class="tool-name">{{ tool.name }}</span>
            <span class="tool-desc">{{ tool.desc }}</span>
          </GlassCard>
        </div>
      </section>

      <!-- 最新帖子 -->
      <section class="section">
        <h2 class="section-title">最新帖子</h2>
        <div class="posts-list">
          <GlassCard
            v-for="post in recentPosts"
            :key="post.id"
            hoverable
            class="post-item"
          >
            <span class="post-category">{{ getCategoryLabel(post.category) }}</span>
            <span class="post-title">{{ post.title }}</span>
            <span class="post-meta">{{ post.author }} · {{ formatTime(post.createdAt) }}</span>
          </GlassCard>
        </div>
      </section>

      <!-- 最新优惠 -->
      <section class="section">
        <h2 class="section-title">最新优惠</h2>
        <div class="deals-scroll">
          <GlassCard
            v-for="deal in deals"
            :key="deal.id"
            hoverable
            class="deal-card"
          >
            <p class="deal-title">{{ deal.title }}</p>
            <p class="deal-price">{{ deal.price }}</p>
            <p class="deal-shop">{{ deal.shop }}</p>
          </GlassCard>
        </div>
      </section>
    </div>

    <!-- 摄影之家模式内容 -->
    <div v-else class="photo-content">
      <section class="section">
        <div class="photo-grid">
          <GlassCard
            v-for="item in photoEntries"
            :key="item.id"
            hoverable
            class="photo-card"
            @click="$router.push(item.path)"
          >
            <span class="card-icon">{{ item.icon }}</span>
            <span class="card-label">{{ item.label }}</span>
            <span class="card-desc">{{ item.desc }}</span>
          </GlassCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useModeStore } from '@/stores/mode'
import { usePostsStore } from '@/stores/posts'
import { useUserStore } from '@/stores/user'
import GlassCard from '@/components/common/GlassCard.vue'
import { parseGIF, decompressFrames } from 'gifuct-js'
import logoGifUrl from '@/assets/logo.gif'
import { getAdminList } from '@/api/content'

// 广告数据
const activeAds = ref([])

const loadAds = async () => {
  try {
    const data = await getAdminList('ads')
    const allAds = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      name: item.title,
      position: item.position || '',
      link: item.link || '',
      enabled: !!item.is_active,
      startTime: item.start_date || '',
      endTime: item.end_date || '',
    }))
    activeAds.value = allAds.filter(ad => {
      if (!ad.enabled) return false
      const now = new Date()
      if (ad.startTime && new Date(ad.startTime) > now) return false
      if (ad.endTime && new Date(ad.endTime) < now) return false
      return true
    })
  } catch (e) {
    console.error('Failed to load ads:', e)
    activeAds.value = []
  }
}

const modeStore = useModeStore()
const postsStore = usePostsStore()
const userStore = useUserStore()

const isShutterAnim = ref(false)
const logoHover = ref(false)
const staticLogoCanvas = ref(null)

const handleModeToggle = () => {
  isShutterAnim.value = true
  setTimeout(() => {
    modeStore.toggleMode()
    isShutterAnim.value = false
  }, 400)
}

const quickTools = ref([
  { id: 'exif', name: 'EXIF查看器', icon: '📷', desc: '查看照片EXIF信息', path: '/tools' },
  { id: 'compress', name: '图片压缩', icon: '📦', desc: '压缩图片大小', path: '/tools' },
  { id: 'dof', name: '景深计算器', icon: '🔭', desc: '计算景深参数', path: '/tools' },
  { id: 'compare', name: '器材对比', icon: '⚖️', desc: '对比器材参数', path: '/compare' },
  { id: 'presets', name: '调色预设', icon: '🎨', desc: '下载调色预设', path: '/presets' },
  { id: 'showcase', name: '美图展示', icon: '🖼️', desc: '欣赏优秀作品', path: '/showcase' },
])

const recentPosts = ref([])

const deals = ref([
  { id: 1, title: 'Adobe 全家桶限时5折', price: '￥1498/年', shop: 'Adobe官网' },
  { id: 2, title: '域名注册 ￥1元起', price: '￥1/首年', shop: '阿里云' },
  { id: 3, title: '云服务器 2核4G 特惠', price: '￥99/月', shop: '腾讯云' },
  { id: 4, title: 'Sony A7C II 预售中', price: '￥13999', shop: '索尼官方' },
])

const photoEntries = ref([
  { id: 'camera', icon: '📷', label: '相机库', desc: '相机查看与对比', path: '/equipment/camera' },
  { id: 'lens', icon: '🔭', label: '镜头库', desc: '镜头查看与对比', path: '/equipment/lens' },
  { id: 'tripod', icon: '🗼', label: '三脚架', desc: '三脚架设备库', path: '/equipment/tripod' },
  { id: 'light', icon: '💡', label: '灯光设备', desc: '灯光设备库', path: '/equipment/light' },
  { id: 'audio', icon: '🎙️', label: '音频设备', desc: '麦克风与录音', path: '/equipment/audio' },
  { id: 'film', icon: '🎞️', label: '胶片', desc: '胶片相机与胶卷', path: '/equipment/film' },
  { id: 'compare', icon: '⚖️', label: '参数对比', desc: '器材参数对比', path: '/compare' },
  { id: 'tutorials', icon: '📖', label: '教程', desc: '摄影教程', path: '/tutorials' },
  { id: 'guides', icon: '📝', label: '攻略', desc: '摄影攻略分享', path: '/guides' },
  { id: 'showcase', icon: '🖼️', label: '美图展示', desc: '社区精选作品', path: '/showcase' },
  { id: 'presets', icon: '🎨', label: '调色预设', desc: 'LR/ACR预设下载', path: '/presets' },
  { id: 'activities', icon: '🎯', label: '活动专区', desc: '精彩活动', path: '/activities' },
])

const getCategoryLabel = (cat) => {
  const map = { talk: '闲聊', photo: '摄影', activity: '活动', resource: '资源', qa: '提问', tutorial: '教程' }
  return `[${map[cat] || cat}]`
}

const formatTime = (time) => {
  const diff = Date.now() - new Date(time).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(time).toLocaleDateString()
}
onMounted(async () => {
  loadAds()
    await postsStore.fetchPosts()
  recentPosts.value = postsStore.filteredPosts.slice(0, 5)

  // Extract first frame from logo GIF for static display
  nextTick(async () => {
    try {
      const response = await fetch(logoGifUrl)
      const buffer = await response.arrayBuffer()
      const gif = parseGIF(buffer)
      const frames = decompressFrames(gif, true)
      if (frames.length > 0 && staticLogoCanvas.value) {
        const frame = frames[0]
        const canvas = staticLogoCanvas.value
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

const openAd = (ad) => {
  if (ad.link) window.open(ad.link, '_blank')
}
</script>

<style scoped>

.home-page {
  position: relative;
  min-height: 100%;
  padding: 24px;
  color: var(--text-primary, #e8eaf0);
}

.hero-section {
  text-align: center;
  padding: 20px 0 16px;
}

.hero-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  transition: all 0.5s ease;
  animation: breathe 3s ease-in-out infinite;
}

.hero-logo.photo-mode {
  background: linear-gradient(135deg, rgba(255, 200, 140, 0.2), rgba(255, 150, 100, 0.2));
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 30px 10px rgba(102, 126, 234, 0.15);
  }
}

.hero-logo:hover {
  animation: none;
  transform: scale(1.1);
  box-shadow: 0 0 40px 15px rgba(102, 126, 234, 0.25);
}

.hero-logo.shutter-close {
  animation: shutterAnim 0.4s ease-in-out;
}

@keyframes shutterAnim {
  0% { transform: scale(1); clip-path: circle(100% at 50% 50%); }
  50% { transform: scale(0.85); clip-path: circle(30% at 50% 50%); }
  100% { transform: scale(1); clip-path: circle(100% at 50% 50%); }
}

.logo-wrapper {
  position: relative;
  display: inline-block;
}

.logo-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.custom-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.logo-upload-btn {
  display: none;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--theme-color);
}

.hero-hint {
  display: none;
}


.section {
  margin-bottom: 12px;
  margin-top: 0;
  padding: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  margin-top: 0;
  padding: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(6, 160px);
  gap: 14px;
  justify-content: center;
  max-width: 1100px;
  margin: 0 auto;
}

.tool-card {
  width: 160px;
  text-align: center;
  padding: 20px 12px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: var(--theme-bg-color);
  border: 1px solid rgba(255, 255, 255, 0.22);
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.15) 80%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

.tool-card:hover {
  background: var(--hover-menu-bg);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px 1px rgba(255, 255, 255, 0.1);
}

.tool-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.tool-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-color);
}

.tool-desc {
  font-size: 11px;
  color: var(--inactive-color);
  line-height: 1.4;
}

.posts-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-width: 1100px;
  margin: 0 auto;
}

.post-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px !important;
}

.post-category {
  font-size: 12px;
  color: var(--menu-color, rgba(255, 255, 255, 0.92));
  flex-shrink: 0;
}

.post-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  font-size: 12px;
  color: var(--inactive-color);
  flex-shrink: 0;
}

.deals-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1100px;
  margin: 0 auto;
}

.deal-card {
  min-width: 240px;
  flex-shrink: 0;
  padding: 20px !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--theme-bg-color) !important;
  border-color: var(--border-color) !important;
}

.deal-title {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deal-price {
  font-size: 20px;
  color: #ffd700;
  font-weight: 700;
}

.deal-shop {
  font-size: 12px;
  color: var(--inactive-color);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.photo-card {
  text-align: center;
  padding: 24px 16px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--theme-bg-color);
  border: 1px solid rgba(255, 255, 255, 0.22);
  position: relative;
  overflow: hidden;
}

.photo-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.15) 80%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

.photo-card:hover {
  background: var(--hover-menu-bg);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px 1px rgba(255, 255, 255, 0.1);
}

.card-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.photo-card:hover .card-icon {
  transform: scale(1.1);
}

.card-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-color);
}

.card-desc {
  font-size: 11px;
  color: var(--inactive-color);
  line-height: 1.4;
}

/* 广告位样式 */
.ad-banner {
  background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(168,85,247,0.1));
  border: 1px dashed rgba(59,130,246,0.3);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.ad-banner:hover {
  background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15));
}

.ad-label {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(59,130,246,0.2);
  color: #3b82f6;
  border-radius: 4px;
}

.ad-name {
  font-size: 13px;
  color: inherit;
}

/* 欢迎语覆盖层 */
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.welcome-content {
  text-align: center;
}

.welcome-text {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: 6px;
  color: #fff;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
}

.welcome-enter-active {
  animation: welcomeIn 0.5s ease-out;
}

.welcome-leave-active {
  animation: welcomeOut 0.5s ease-in;
}

@keyframes welcomeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
  0% .welcome-text { filter: blur(10px); opacity: 0; transform: scale(0.95); }
  100% .welcome-text { filter: blur(0); opacity: 1; transform: scale(1); }
}

@keyframes welcomeOut {
  0% { opacity: 1; filter: blur(0); }
  100% { opacity: 0; filter: blur(10px); }
}

</style>