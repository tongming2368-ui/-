<template>
  <div class="guides-page">
    <div class="page-header">
      <h1>📝 摄影攻略</h1>
      <p class="subtitle">分享实用摄影技巧和拍摄心得</p>
    </div>

    <div class="guides-grid">
      <div v-if="loading" class="loading-state">加载中...</div>
      <div v-else-if="guides.length === 0" class="empty-state">暂无攻略</div>
      <GlassCard
        v-for="guide in guides"
        :key="guide.id"
        hoverable
        class="guide-card"
        @click="openGuide(guide)"
      >
        <div class="guide-cover" :style="{ background: guide.cover_gradient || guide.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"></div>
        <div class="guide-content">
          <span class="guide-tag">{{ guide.tag }}</span>
          <h3 class="guide-title">{{ guide.title }}</h3>
          <p class="guide-desc">{{ guide.description }}</p>
          <div class="guide-meta">
            <span class="author">✍️ {{ guide.author_name || '匿名' }}</span>
            <span class="views">👁️ {{ guide.view_count || 0 }}</span>
            <span class="likes">❤️ {{ guide.like_count || 0 }}</span>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- 攻略详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail && currentGuide" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-content guide-detail">
          <div class="guide-cover-preview" :style="{ background: currentGuide.cover_gradient || currentGuide.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"></div>
          <h2>{{ currentGuide.title }}</h2>
          <div class="guide-meta-detail">
            <span>✍️ {{ currentGuide.author_name || '匿名' }}</span>
            <span>👁️ {{ currentGuide.view_count || 0 }}</span>
            <span>❤️ {{ currentGuide.like_count || 0 }}</span>
            <span class="guide-tag-badge">{{ currentGuide.tag }}</span>
          </div>
          <div class="guide-body" v-html="renderContent(currentGuide.content || currentGuide.description)"></div>
          <button class="close-btn" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'

const guides = ref([])
const loading = ref(true)
const showDetail = ref(false)
const currentGuide = ref(null)

const loadGuides = async () => {
  try {
    const res = await fetch('/api/guides')
    const data = await res.json()
    guides.value = data.items || []
  } catch (e) {
    console.error('加载攻略失败:', e)
  } finally {
    loading.value = false
  }
}

const renderContent = (content) => {
  if (!content) return ''
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n/gim, '<br>')
}

const openGuide = (guide) => {
  currentGuide.value = guide
  showDetail.value = true
}

onMounted(loadGuides)
</script>

<style scoped>
.guides-page { padding: 32px; color: var(--text-primary); min-height: 100%; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 28px; margin-bottom: 8px; }
.subtitle { color: var(--text-secondary); font-size: 14px; }
.loading-state, .empty-state { text-align: center; color: var(--text-secondary); padding: 60px 0; }
.guides-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
.guide-card { padding: 0 !important; overflow: hidden; }
.guide-cover { width: 100%; height: 160px; }
.guide-content { padding: 20px; }
.guide-tag { display: inline-block; padding: 4px 12px; background: rgba(255, 215, 0, 0.15); color: #ffd700; border-radius: 12px; font-size: 12px; margin-bottom: 12px; }
.guide-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.guide-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.guide-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content.guide-detail { background: #fff; color: #333; border-radius: 16px; padding: 0; max-width: 480px; width: 90%; overflow: hidden; max-height: 80vh; overflow-y: auto; }
.guide-cover-preview { width: 100%; height: 140px; }
.modal-content.guide-detail h2 { font-size: 20px; margin: 20px 24px 12px; color: #111; }
.guide-meta-detail { display: flex; gap: 16px; font-size: 13px; color: #666; margin: 0 24px 16px; flex-wrap: wrap; }
.guide-tag-badge { background: rgba(255, 215, 0, 0.2); color: #996600; padding: 2px 10px; border-radius: 10px; }
.guide-body { font-size: 15px; line-height: 1.8; color: #444; margin: 0 24px 24px; }
.close-btn { width: calc(100% - 48px); margin: 0 24px 24px; padding: 12px; border: 1px solid #ddd; border-radius: 10px; background: #f5f5f5; color: #333; font-size: 14px; cursor: pointer; }
</style>
