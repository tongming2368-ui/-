<template>
  <div class="deals-page">
    <div class="page-header">
      <h1>🐑 羊毛党</h1>
      <p class="subtitle">摄影人的省钱秘笈</p>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-section">
      <div class="search-bar">
        <input v-model="searchQuery" placeholder="🔍 搜索优惠信息..." />
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
        <span class="filter-label">标签:</span>
        <div class="filter-btns">
          <button
            v-for="tag in tags"
            :key="tag.id"
            :class="{ active: activeTag === tag.id }"
            @click="activeTag = activeTag === tag.id ? '' : tag.id"
          >{{ tag.name }}</button>
        </div>
      </div>
    </div>

    <!-- 优惠列表 -->
    <div class="deals-grid">
      <GlassCard
        v-for="deal in filteredDeals"
        :key="deal.id"
        hoverable
        class="deal-card"
        @click="openDeal(deal)"
      >
        <div class="deal-header">
          <span class="deal-source">{{ deal.source }}</span>
          <span class="deal-tags">
            <span v-if="deal.isLimited" class="tag limited">限时</span>
            <span v-if="deal.isNewUser" class="tag newuser">新人</span>
            <span class="tag regular">长期</span>
          </span>
        </div>
        <h3 class="deal-title">{{ deal.title }}</h3>
        <p class="deal-desc">{{ deal.description }}</p>
        <div class="deal-footer">
          <div class="deal-price">
            <span class="price-current">¥{{ deal.price }}</span>
            <span v-if="deal.originalPrice" class="price-original">¥{{ deal.originalPrice }}</span>
            <span v-if="deal.discount" class="price-discount">{{ deal.discount }}折</span>
          </div>
          <span class="deal-expire">有效期: {{ deal.expireDate }}</span>
        </div>
        <a v-if="!deal._isPost && deal.url" :href="deal.url" target="_blank" class="deal-link">立即查看 →</a>
        <span v-if="deal._isPost" class="deal-link" @click.stop="openDeal(deal)">查看详情 →</span>
      </GlassCard>
    </div>

    <!-- 帖子详情弹窗 -->
    <Modal v-model="showPostDetail" :title="currentPost?.title" width="700px">
      <div v-if="currentPost" class="post-detail">
        <div class="post-meta">
          <span>{{ currentPost.author }}</span>
          <span>{{ currentPost.createdAt?.substring(0, 10) }}</span>
          <span>👍 {{ currentPost.likeCount }} | 💬 {{ currentPost.commentCount }}</span>
        </div>
        <div class="post-content" v-html="renderMarkdown(currentPost.content)"></div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'
import { useFilterConfig } from '@/composables/useFilterConfig'
import { marked } from 'marked'
import { getDeals } from '@/api/content'

const { getPageFilterOptions } = useFilterConfig()

const categories = ref(getPageFilterOptions('deals', 'category').length > 0
  ? getPageFilterOptions('deals', 'category').map(o => ({ id: o.value, name: o.label }))
  : [
      { id: 'all', name: '全部' },
      { id: 'software', name: '软件' },
      { id: 'hardware', name: '硬件' },
      { id: 'course', name: '课程' },
      { id: 'cloud', name: '云服务' },
    ]
)

const tags = ref(getPageFilterOptions('deals', 'tag').length > 0
  ? getPageFilterOptions('deals', 'tag').map(o => ({ id: o.value, name: o.label }))
  : [
      { id: 'limited', name: '限时' },
      { id: 'newuser', name: '新人专享' },
      { id: 'regular', name: '长期' },
    ]
)

const activeCategory = ref('all')
const activeTag = ref('')
const searchQuery = ref('')
const deals = ref([])

// API 获取优惠数据
const loadDealsFromAPI = async () => {
  try {
    const res = await getDeals()
    if (res.items && res.items.length > 0) {
      const apiDeals = res.items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.content || '',
        price: item.current_price || '0',
        originalPrice: item.original_price || '',
        discount: 0,
        source: item.platform || '',
        category: item.category || 'other',
        expireDate: item.expire_date || '',
        url: item.link || '',
        isLimited: !!item.expire_date,
        isNewUser: false,
      }))
      deals.value = [...apiDeals, ...deals.value]
    }
  } catch (e) {
    console.error('加载优惠数据失败:', e)
  }
}

const filteredDeals = computed(() => {
  return deals.value.filter(deal => {
    const catMatch = activeCategory.value === 'all' || deal.category === activeCategory.value
    const tagMatch = !activeTag.value ||
      (activeTag.value === 'limited' && deal.isLimited) ||
      (activeTag.value === 'newuser' && deal.isNewUser) ||
      (activeTag.value === 'regular' && !deal.isLimited && !deal.isNewUser)
    const searchMatch = !searchQuery.value.trim() ||
      deal.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase()) ||
      (deal.description && deal.description.toLowerCase().includes(searchQuery.value.trim().toLowerCase()))
    return catMatch && tagMatch && searchMatch
  })
})

const showPostDetail = ref(false)
const currentPost = ref(null)
const renderMarkdown = (content) => content ? marked(content) : ''

const openDeal = (deal) => {
  if (deal._isPost) {
    currentPost.value = deal._postData
    showPostDetail.value = true
  } else if (deal.url && deal.url !== '#') {
    window.open(deal.url, '_blank')
  }
}

onMounted(() => {
  loadDealsFromAPI()
})
</script>

<style scoped>
.deals-page {
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

.filter-section {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  font-size: 14px;
  color: var(--text-secondary);
}

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

.deals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.deal-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.deal-source {
  font-size: 12px;
  color: var(--text-secondary);
}

.deal-tags {
  display: flex;
  gap: 6px;
}

.tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.tag.limited {
  background: linear-gradient(135deg, #ff6b6b, #e53e3e);
  color: #fff;
}

.tag.newuser {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: #fff;
}

.tag.regular {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
}

.deal-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.deal-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}

.deal-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.deal-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.price-current {
  font-size: 22px;
  font-weight: 700;
  color: #ffd700;
}

.price-original {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.price-discount {
  font-size: 12px;
  color: #48bb78;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(72, 187, 120, 0.2);
  border-radius: 4px;
}

.deal-expire {
  font-size: 12px;
  color: var(--text-secondary);
}

.deal-link {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  text-decoration: none;
  text-align: center;
  font-size: 14px;
  transition: all 0.2s;
}

.deal-link:hover {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.post-content {
  line-height: 1.8;
  font-size: 15px;
}

.post-content h1, .post-content h2, .post-content h3 {
  margin: 16px 0 8px;
}

.post-content p {
  margin: 8px 0;
}
</style>