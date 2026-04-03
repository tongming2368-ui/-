<template>
  <div class="guides-page">
    <div class="page-header">
      <h1>📝 摄影攻略</h1>
      <p class="subtitle">分享实用摄影技巧和拍摄心得</p>
    </div>

    <div class="guides-grid">
      <GlassCard
        v-for="guide in guides"
        :key="guide.id"
        hoverable
        class="guide-card"
        @click="openGuide(guide)"
      >
        <div class="guide-cover" :style="{ background: guide.coverGradient }"></div>
        <div class="guide-content">
          <span class="guide-tag">{{ guide.tag }}</span>
          <h3 class="guide-title">{{ guide.title }}</h3>
          <p class="guide-desc">{{ guide.description }}</p>
          <div class="guide-meta">
            <span class="author">✍️ {{ guide.author }}</span>
            <span class="views">👁️ {{ guide.views }}</span>
            <span class="likes">❤️ {{ guide.likes }}</span>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- 攻略详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail && currentGuide" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-content guide-detail">
          <div class="guide-cover-preview" :style="{ background: currentGuide.coverGradient }"></div>
          <h2>{{ currentGuide.title }}</h2>
          <div class="guide-meta-detail">
            <span>✍️ {{ currentGuide.author }}</span>
            <span>👁️ {{ currentGuide.views }}</span>
            <span>❤️ {{ currentGuide.likes }}</span>
            <span class="guide-tag-badge">{{ currentGuide.tag }}</span>
          </div>
          <p class="guide-full-desc">{{ currentGuide.description }}</p>
          <button class="close-btn" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'

const guides = ref([
  {
    id: 1,
    title: '人像摄影布光完全指南',
    description: '从单灯到多灯系统，详细讲解人像摄影中的各种布光技巧与方法。',
    author: '摄影师小王',
    views: 8923,
    likes: 234,
    tag: '布光技巧',
    coverGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a18cd1 100%)'
  },
  {
    id: 2,
    title: '星空摄影实战攻略',
    description: '拍摄银河的完整流程，包括前期规划、相机设置、后期处理。',
    author: '星空摄影师',
    views: 15234,
    likes: 567,
    tag: '星空摄影',
    coverGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  {
    id: 3,
    title: '新手入门相机选购指南',
    description: '帮助摄影新手选择适合自己的第一台相机，包含各价位推荐。',
    author: '数码评测员',
    views: 23456,
    likes: 890,
    tag: '器材选购',
    coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 4,
    title: ' Lightroom 调色进阶教程',
    description: '深入讲解色彩分离、曲线调色等高级技巧，让你的照片与众不同。',
    author: '修图大师',
    views: 18234,
    likes: 678,
    tag: '后期处理',
    coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 5,
    title: '街头摄影抓拍技巧',
    description: '如何 在街头摄影中抓住决定性瞬间，提升抓拍成功率。',
    author: '街拍老李',
    views: 9876,
    likes: 345,
    tag: '街头摄影',
    coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 6,
    title: '风光摄影构图法则',
    description: '讲解三分法、对称构图、引导线等经典构图技巧。',
    author: '风光大师',
    views: 15678,
    likes: 567,
    tag: '构图技巧',
    coverGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
])

const showDetail = ref(false)
const currentGuide = ref(null)

const openGuide = (guide) => {
  currentGuide.value = guide
  showDetail.value = true
}
</script>

<style scoped>
.guides-page {
  padding: 32px;
  color: var(--text-primary);
  min-height: 100%;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.guide-card {
  padding: 0 !important;
  overflow: hidden;
}

.guide-cover {
  width: 100%;
  height: 160px;
}

.guide-content {
  padding: 20px;
}

.guide-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

.guide-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.guide-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content.guide-detail {
  background: #fff;
  color: #333;
  border-radius: 16px;
  padding: 0;
  max-width: 480px;
  width: 90%;
  overflow: hidden;
}

.guide-cover-preview {
  width: 100%;
  height: 140px;
}

.modal-content.guide-detail h2 {
  font-size: 20px;
  margin: 20px 24px 12px;
  color: #111;
}

.guide-meta-detail {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin: 0 24px 16px;
  flex-wrap: wrap;
}

.guide-tag-badge {
  background: rgba(255, 215, 0, 0.2);
  color: #996600;
  padding: 2px 10px;
  border-radius: 10px;
}

.guide-full-desc {
  font-size: 15px;
  line-height: 1.6;
  color: #444;
  margin: 0 24px 24px;
}

.close-btn {
  width: calc(100% - 48px);
  margin: 0 24px 24px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}
</style>