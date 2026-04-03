<template>
  <div class="links-page">
    <div class="page-header">
      <h1>🔗 友链专属</h1>
      <p class="subtitle">优质摄影资源一网打尽</p>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id; updateFilteredLinks()"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- 链接卡片 -->
    <div class="links-grid">
      <GlassCard 
        v-for="link in filteredLinks" 
        :key="link.id" 
        hoverable 
        class="link-card"
        @click="openLink(link.url)"
      >
        <div class="link-header">
          <span class="link-logo">{{ link.logo }}</span>
          <div class="link-meta">
            <h3 class="link-name">{{ link.name }}</h3>
            <p class="link-desc">{{ link.description }}</p>
          </div>
        </div>
        <div class="link-footer">
          <div class="link-tags">
            <span v-for="tag in link.tags" :key="tag" class="link-tag">{{ tag }}</span>
          </div>
          <span class="link-visitor">👁 {{ link.visitors }} 访问</span>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import { getLinks } from '@/api/content'

const activeCategory = ref('all')

const categories = ref([
  { id: 'all', name: '全部', icon: '🌐' },
  { id: 'community', name: '摄影社区', icon: '📷' },
  { id: 'tool', name: '工具网站', icon: '🛠' },
  { id: 'tutorial', name: '教程学习', icon: '📚' },
  { id: 'resource', name: '素材资源', icon: '🖼' },
  { id: 'blog', name: '博客', icon: '✍️' },
])

const links = ref([])
const filteredLinks = ref([])

// API 获取友链数据
const loadLinksFromAPI = async () => {
  try {
    const res = await getLinks()
    if (res.items && res.items.length > 0) {
      const apiLinks = res.items.map(item => ({
        id: item.id,
        name: item.name,
        logo: item.logo || '🔗',
        description: item.description || '',
        category: item.category || 'friend',
        tags: [],
        visitors: '0',
        url: item.url || '',
      }))
      links.value = [...apiLinks, ...links.value]
      updateFilteredLinks()
    }
  } catch (e) {
    console.error('加载友链数据失败:', e)
  }
}

const updateFilteredLinks = () => {
  if (activeCategory.value === 'all') {
    filteredLinks.value = links.value
  } else {
    filteredLinks.value = links.value.filter(link => link.category === activeCategory.value)
  }
}

const openLink = (url) => {
  window.open(url, '_blank')
}

onMounted(() => {
  loadLinksFromAPI()
})

// 初始化显示
updateFilteredLinks()
</script>

<style scoped>
.links-page {
  padding: 32px;
  color: var(--text-primary);
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-tabs button {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.category-tabs button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}

.category-tabs button.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.link-card {
  cursor: pointer;
}

.link-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.link-logo {
  font-size: 40px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  flex-shrink: 0;
}

.link-meta {
  flex: 1;
  min-width: 0;
}

.link-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.link-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.link-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.link-visitor {
  font-size: 12px;
  color: var(--text-muted);
}
</style>