<template>
  <div class="tutorials-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="page-header">
      <h1>📚 教程攻略</h1>
      <p class="subtitle">从入门到进阶，系统学习摄影</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="search-bar">
        <input v-model="searchQuery" placeholder="🔍 搜索教程标题..." />
      </div>
      <div class="filter-group">
        <span class="filter-label">分类:</span>
        <div class="filter-btns">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >{{ cat.name }}</button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">难度:</span>
        <div class="filter-btns">
          <button 
            v-for="level in levels" 
            :key="level.id"
            :class="{ active: activeLevel === level.id }"
            @click="activeLevel = activeLevel === level.id ? '' : level.id"
          >{{ level.name }}</button>
        </div>
      </div>
    </div>

    <!-- 教程列表 -->
    <div class="tutorials-list">
      <GlassCard 
        v-for="tutorial in filteredTutorials" 
        :key="tutorial.id" 
        hoverable 
        class="tutorial-card"
      >
        <div class="tutorial-header">
          <span class="tutorial-category">{{ tutorial.categoryLabel }}</span>
          <span class="tutorial-difficulty" :class="`level-${tutorial.difficulty}`">
            {{ tutorial.difficultyLabel }}
          </span>
        </div>
        <h3 class="tutorial-title">{{ tutorial.title }}</h3>
        <p class="tutorial-summary">{{ tutorial.summary }}</p>
        <div class="tutorial-meta">
          <span class="meta-author">👤 {{ tutorial.author }}</span>
          <span class="meta-time">⏱ {{ tutorial.readTime }}</span>
          <span class="meta-likes">❤️ {{ tutorial.likes }}</span>
        </div>
        <div class="tutorial-footer">
          <div class="tutorial-tags">
            <span v-for="tag in tutorial.tags" :key="tag" class="tutorial-tag">{{ tag }}</span>
          </div>
          <button class="read-btn" @click="openTutorial(tutorial)">开始阅读 →</button>
        </div>
      </GlassCard>
    </div>

    <!-- 教程详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail && currentTutorial" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-content tutorial-detail">
          <h2>{{ currentTutorial.title }}</h2>
          <div class="detail-meta">
            <span>✍️ {{ currentTutorial.author }}</span>
            <span>⏱️ {{ currentTutorial.readTime }}</span>
            <span>❤️ {{ currentTutorial.likes }}</span>
          </div>
          <p class="detail-summary">{{ currentTutorial.summary }}</p>
          <div class="detail-tags">
            <span v-for="tag in currentTutorial.tags" :key="tag">#{{ tag }}</span>
          </div>
          <button class="close-btn" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { useAccessControl } from '@/composables/useAccessControl'
import { getTutorials as apiGetTutorials } from '@/api/content'

const { isLoggedIn, requireLogin } = useAccessControl()

const { getPageFilterOptions } = useFilterConfig()

const activeCategory = ref('all')
const activeLevel = ref('')
const searchQuery = ref('')

const categories = ref(getPageFilterOptions('tutorials', 'category').length > 0
  ? getPageFilterOptions('tutorials', 'category').map(o => ({ id: o.value, name: o.label }))
  : [
      { id: 'all', name: '全部' },
      { id: 'basic', name: '入门' },
      { id: 'advanced', name: '进阶' },
      { id: 'post', name: '后期' },
      { id: 'gear', name: '器材' },
      { id: 'composition', name: '构图' },
    ]
)

const levels = ref(getPageFilterOptions('tutorials', 'difficulty').length > 0
  ? getPageFilterOptions('tutorials', 'difficulty').map(o => ({ id: o.value, name: o.label }))
  : [
      { id: 'beginner', name: '初级' },
      { id: 'intermediate', name: '中级' },
      { id: 'expert', name: '高级' },
    ]
)

const tutorials = ref([
  {
    id: 1,
    title: '摄影入门完全指南',
    summary: '从相机选购到基本操作，手把手教你开启摄影之旅，包含光圈、快门、ISO三要素详解',
    category: 'basic',
    categoryLabel: '入门',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    author: '李涛',
    readTime: '15分钟',
    likes: '2341',
    tags: ['新手', '入门', '基础'],
  },
  {
    id: 2,
    title: '人像摄影布光实战',
    summary: '详解单灯、双灯、三灯布光技巧，室内外人像拍摄布光方案全解析',
    category: 'advanced',
    categoryLabel: '进阶',
    difficulty: 'intermediate',
    difficultyLabel: '中级',
    author: '顾俊',
    readTime: '25分钟',
    likes: '1823',
    tags: ['人像', '布光', '进阶'],
  },
  {
    id: 3,
    title: 'Photoshop CC 调色教程',
    summary: 'Photoshop调色核心技能教学，曲线、色阶、混合模式等工具的系统用法',
    category: 'post',
    categoryLabel: '后期',
    difficulty: 'intermediate',
    difficultyLabel: '中级',
    author: '老Preset',
    readTime: '40分钟',
    likes: '3456',
    tags: ['PS', '调色', '后期'],
  },
  {
    id: 4,
    title: '索尼A7M4完全上手指南',
    summary: '索尼A7M4深度评测与使用技巧，从菜单设置到实拍演示，全面掌握这台相机',
    category: 'gear',
    categoryLabel: '器材',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    author: '400mm',
    readTime: '30分钟',
    likes: '2104',
    tags: ['索尼', '器材', '评测'],
  },
  {
    id: 5,
    title: '构图黄金法则',
    summary: '经典构图法则详解：三分法、对称构图、引导线、框架构图等实用技巧',
    category: 'composition',
    categoryLabel: '构图',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    author: 'Thomas',
    readTime: '20分钟',
    likes: '1987',
    tags: ['构图', '技巧', '入门'],
  },
  {
    id: 6,
    title: 'Lightroom 预设制作教学',
    summary: '从零开始制作自己的Lightroom预设，统一风格提升后期效率',
    category: 'post',
    categoryLabel: '后期',
    difficulty: 'expert',
    difficultyLabel: '高级',
    author: 'Ryan',
    readTime: '35分钟',
    likes: '1432',
    tags: ['LR', '预设', '高级'],
  },
  {
    id: 7,
    title: '星空摄影完整攻略',
    summary: '星空银河拍摄指南，包括参数设置、地点选择、后期堆栈处理',
    category: 'advanced',
    categoryLabel: '进阶',
    difficulty: 'expert',
    difficultyLabel: '高级',
    author: '阿五',
    readTime: '45分钟',
    likes: '2567',
    tags: ['星空', '银河', '夜景'],
  },
  {
    id: 8,
    title: '手机摄影技巧大全',
    summary: '手机也能拍大片，教你用手机拍出专业级照片，Snapseed/Lightroom Mobile教程',
    category: 'basic',
    categoryLabel: '入门',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    author: '卷毛',
    readTime: '18分钟',
    likes: '3421',
    tags: ['手机', '技巧', '入门'],
  },
])

const TUTORIALS_KEY = 'phototool_tutorials_data'
const tutorialsVersion = ref(0)
const apiTutorialsData = ref([])

// 从 API 加载
const loadApiTutorials = async () => {
  try {
    const data = await apiGetTutorials({ limit: 100 })
    apiTutorialsData.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      title: item.title,
      description: item.excerpt || item.content?.substring(0, 100) || '',
      author: item.author_name || '未知',
      authorAvatar: item.author_avatar || '👤',
      category: item.category || 'beginner',
      difficulty: 'beginner',
      duration: '',
      views: item.view_count || 0,
      likes: item.like_count || 0,
      tags: item.tags || [],
      createdAt: item.created_at,
    }))
    tutorialsVersion.value++
  } catch (e) {
    console.error('Failed to load tutorials:', e)
  }
}

const loadAdminTutorials = () => {
  try {
    const raw = localStorage.getItem(TUTORIALS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const filteredTutorials = computed(() => {
  tutorialsVersion.value // 响应式依赖
  const list = [...apiTutorialsData.value, ...loadAdminTutorials(), ...tutorials.value]
  return list.filter(t => {
    const catMatch = activeCategory.value === 'all' || t.category === activeCategory.value
    const levelMatch = !activeLevel.value || t.difficulty === activeLevel.value
    const searchMatch = !searchQuery.value.trim() || t.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
    return catMatch && levelMatch && searchMatch
  })
})

const showDetail = ref(false)
const currentTutorial = ref(null)

const openTutorial = (tutorial) => {
  currentTutorial.value = tutorial
  showDetail.value = true
}
</script>

<style scoped>
.tutorials-page {
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

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.search-bar {
  width: 100%;
  max-width: 220px;
}
.search-bar input {
  width: 100%;
  height: 45px;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid lightgrey;
  outline: none;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0px 0px 20px -18px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 13px;
}
.search-bar input:hover {
  border: 2px solid lightgrey;
  box-shadow: 0px 0px 20px -17px;
}
.search-bar input:active {
  transform: scale(0.95);
}
.search-bar input:focus {
  border: 2px solid grey;
  background: rgba(255, 255, 255, 0.1);
}
.search-bar input::placeholder {
  color: var(--text-muted);
}.search-bar input:hover {
  border: 2px solid lightgrey;
  box-shadow: 0px 0px 20px -17px;
}
.search-bar input:active {
  transform: scale(0.95);
}
.search-bar input:focus {
  border: 2px solid grey;
  background: rgba(255, 255, 255, 0.1);
}
.search-bar input::placeholder {
  color: var(--text-muted);
}

.search-bar input:focus {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 标准筛选按钮样式 - 与其他页面统一 */
.filter-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btns button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 4px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btns button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.filter-btns button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text-primary);
}

.tutorials-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.tutorial-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tutorial-category {
  padding: 4px 10px;
  background: rgba(102, 126, 234, 0.2);
  color: #a3bffa;
  border-radius: 12px;
  font-size: 12px;
}

.tutorial-difficulty {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.tutorial-difficulty.level-beginner {
  background: rgba(72, 187, 120, 0.2);
  color: #9ae6b4;
}

.tutorial-difficulty.level-intermediate {
  background: rgba(237, 137, 54, 0.2);
  color: #fbd38d;
}

.tutorial-difficulty.level-expert {
  background: rgba(245, 101, 101, 0.2);
  color: #feb2b2;
}

.tutorial-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.tutorial-summary {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

.tutorial-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.tutorial-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.tutorial-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tutorial-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-secondary);
}

.read-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.read-btn:hover {
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 未登录遮罩 */
.guest-content-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
  cursor: pointer;
  border-radius: 14px;
}

.guest-hint {
  background: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content.tutorial-detail {
  background: #fff;
  color: #333;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
}

.modal-content.tutorial-detail h2 {
  font-size: 20px;
  margin-bottom: 16px;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.detail-summary {
  font-size: 15px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  color: #5e81f4;
  font-size: 14px;
}

.close-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}
</style>onMounted(() => {
  loadApiTutorials()
})
