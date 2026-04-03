<template>
  <Modal v-model="visible" :width="'860px'" :maxHeight="'90vh'">
    <template #header>
      <div class="modal-header-custom">
        <h3>器材详情</h3>
      </div>
    </template>
    <div v-if="item" class="detail-modal">
      <!-- 头部：缩略图 + 基本信息 -->
      <div class="detail-header">
        <div class="detail-thumb">
          <img :src="item.image" :alt="item.name" />
        </div>
        <div class="detail-info">
          <div class="detail-brand">
            <span class="brand-logo">{{ item.brandLogo }}</span>
            <span class="brand-name">{{ item.brand }}</span>
          </div>
          <h2 class="detail-name">{{ item.name }}</h2>
          <div class="detail-follow">
            <span class="follow-count">{{ item.followers }} 人关注</span>
            <button class="follow-btn" :class="{ followed }" @click="followed = !followed">
              {{ followed ? '✅ 已关注' : '+ 关注' }}
            </button>
          </div>
          <p class="detail-desc">{{ item.description }}</p>
        </div>
      </div>

      <!-- 评分区 -->
      <div class="rating-section">
        <div class="rating-display">
          <span class="rating-score">{{ item.rating }}</span>
          <div class="rating-stars">
            <span
              v-for="star in 5"
              :key="star"
              class="star"
              :class="{ filled: star <= Math.round(item.rating), clickable: true }"
              @click="userRating = star"
            >
              {{ star <= (userRating || Math.round(item.rating)) ? '★' : '☆' }}
            </span>
            <span class="rating-count">{{ item.ratingCount }} 人评价</span>
          </div>
        </div>
      </div>

      <!-- 价格区 -->
      <div class="price-section">
        <span class="price-value">¥{{ item.price?.toLocaleString() }}</span>
        <div class="price-links">
          <a v-if="item.links?.jd" :href="item.links.jd" target="_blank" class="link-btn jd">京东</a>
          <a v-if="item.links?.tmall" :href="item.links.tmall" target="_blank" class="link-btn tmall">天猫</a>
          <a v-if="item.links?.official" :href="item.links.official" target="_blank" class="link-btn official">官网</a>
        </div>
      </div>

      <!-- 标签页切换 -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 参数页 -->
      <div v-if="activeTab === 'specs'" class="tab-content">
        <table class="specs-table" v-if="item.specs">
          <tr v-for="(value, key) in item.specs" :key="key">
            <td class="spec-key">{{ key }}</td>
            <td class="spec-value">{{ value }}</td>
          </tr>
        </table>
      </div>

      <!-- 评价页 -->
      <div v-else-if="activeTab === 'reviews'" class="tab-content">
        <div class="write-review">
          <div class="review-stars">
            <span
              v-for="star in 5"
              :key="star"
              class="star clickable"
              @click="reviewRating = star"
            >
              {{ star <= reviewRating ? '★' : '☆' }}
            </span>
          </div>
          <textarea v-model="reviewText" placeholder="写下你的使用体验..." rows="3"></textarea>
          <button class="submit-review" @click="submitReview">提交评价</button>
        </div>
        <div class="reviews-list" v-if="reviews.length">
          <div v-for="(r, i) in reviews" :key="i" class="review-item">
            <div class="review-header">
              <span>{{ r.avatar }} {{ r.user }}</span>
              <span class="review-stars-display">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
            </div>
            <p class="review-text">{{ r.text }}</p>
            <span class="review-time">{{ r.time }}</span>
          </div>
        </div>
        <p v-else class="no-reviews">暂无评价，来写第一条吧！</p>
      </div>

      <!-- 图文页 -->
      <div v-else-if="activeTab === 'photos'" class="tab-content">
        <div class="photos-grid">
          <div class="photo-placeholder" v-for="i in 6" :key="i">
            <img :src="`https://placehold.co/200x200/1a1a2e/ffffff?text=样片${i}`" :alt="`样片${i}`" />
          </div>
        </div>
      </div>

      <!-- 讨论页 -->
      <div v-else-if="activeTab === 'discuss'" class="tab-content">
        <div class="discuss-input">
          <input v-model="discussText" placeholder="发表你的看法..." />
          <button @click="submitDiscuss">发送</button>
        </div>
        <div class="discuss-list">
          <div class="discuss-item" v-for="(d, i) in discussions" :key="i">
            <span class="discuss-avatar">{{ d.avatar }}</span>
            <div class="discuss-body">
              <span class="discuss-user">{{ d.user }}</span>
              <p class="discuss-text">{{ d.text }}</p>
              <span class="discuss-time">{{ d.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: Boolean,
  item: Object
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const followed = ref(false)
const userRating = ref(0)
const activeTab = ref('specs')
const reviewRating = ref(0)
const reviewText = ref('')
const discussText = ref('')

const tabs = [
  { key: 'specs', label: '参数' },
  { key: 'reviews', label: '评价' },
  { key: 'photos', label: '图文' },
  { key: 'discuss', label: '讨论' }
]

const discussions = ref([
  { avatar: '📷', user: '摄影老王', text: '这个器材真的很不错，推荐入手！', time: '2小时前' },
  { avatar: '🎞️', user: '器材达人', text: '性价比很高，适合入门玩家。', time: '5小时前' },
  { avatar: '🌲', user: '扫街爱好者', text: '等降价了再买...', time: '1天前' }
])

const reviews = ref([])

const submitReview = () => {
  if (!reviewText.value.trim() || !reviewRating.value) return
  reviews.value.unshift({
    avatar: '👤',
    user: '当前用户',
    rating: reviewRating.value,
    text: reviewText.value,
    time: '刚刚'
  })
  reviewText.value = ''
  reviewRating.value = 0
}

const submitDiscuss = () => {
  if (!discussText.value.trim()) return
  discussions.value.unshift({
    avatar: '👤',
    user: '当前用户',
    text: discussText.value,
    time: '刚刚'
  })
  discussText.value = ''
}
</script>

<style scoped>

.modal-header-custom h3 {
  font-size: 18px;
  font-weight: 600;
}

.detail-modal {
  color: var(--text-primary);
}

.detail-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-thumb {
  width: 240px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
}

.detail-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.brand-logo {
  font-size: 20px;
}

.brand-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
}

.detail-follow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.follow-count {
  font-size: 13px;
  color: var(--text-primary);
}

.follow-btn {
  background: rgba(59, 130, 246, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 20px;
  padding: 4px 16px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: rgba(59, 130, 246, 0.6);
}

.follow-btn.followed {
  background: rgba(34, 197, 94, 0.4);
  border-color: rgba(34, 197, 94, 0.5);
}

.detail-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 评分区 */
.rating-section {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-score {
  font-size: 32px;
  font-weight: 700;
  color: #ffd700;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.star.filled {
  color: #ffd700;
}

.star.clickable {
  cursor: pointer;
}

.star.clickable:hover {
  color: #ffd700;
}

.rating-count {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 8px;
}

/* 价格区 */
.price-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.price-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffd700;
}

.price-links {
  display: flex;
  gap: 8px;
}

.link-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.link-btn.jd {
  background: rgba(239, 68, 68, 0.4);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.link-btn.jd:hover {
  background: rgba(239, 68, 68, 0.6);
}

.link-btn.tmall {
  background: rgba(245, 158, 11, 0.4);
  border: 1px solid rgba(245, 158, 11, 0.5);
}

.link-btn.tmall:hover {
  background: rgba(245, 158, 11, 0.6);
}

.link-btn.official {
  background: rgba(59, 130, 246, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.link-btn.official:hover {
  background: rgba(59, 130, 246, 0.6);
}

/* 标签页 */
.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
}

.tab-bar button {
  flex: 1;
  background: none;
  border: none;
  border-radius: 10px;
  padding: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-bar button.active {
  background: rgba(59, 130, 246, 0.4);
  color: var(--text-primary);
}

.tab-bar button:hover:not(.active) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

/* 参数表格 */
.tab-content {
  min-height: 120px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.specs-table tr:last-child {
  border-bottom: none;
}

.spec-key {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-primary);
  width: 120px;
  white-space: nowrap;
}

.spec-value {
  padding: 10px 16px;
  font-size: 14px;
}

/* 评价 */
.reviews-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-primary);
  font-size: 14px;
}

.write-review {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.review-stars {
  font-size: 24px;
}

.review-stars .star {
  cursor: pointer;
}

.write-review textarea {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  resize: vertical;
}

.submit-review {
  background: rgba(59, 130, 246, 0.5);
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.submit-review:hover {
  background: rgba(59, 130, 246, 0.7);
}

/* 图文 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-placeholder {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.2);
}

.photo-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 讨论 */
.discuss-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.discuss-input input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.discuss-input button {
  background: rgba(59, 130, 246, 0.5);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.discuss-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.discuss-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.discuss-body {
  flex: 1;
}

.discuss-user {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
}

.discuss-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

.discuss-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.reviews-list {
  margin-top: 16px;
}

.review-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 8px;
}

.review-stars-display {
  color: #ffd700;
  font-size: 12px;
}

.review-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.review-time {
  font-size: 11px;
  color: var(--text-muted);
}

.no-reviews {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

</style>
