<template>
  <div class="showcase-page">
    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-content-mask" @click="requireLogin('登录后即可查看详情与操作')">
      <div class="guest-hint">🔒 登录后可查看详情与操作</div>
    </div>
    <div class="showcase-header">
      <div class="header-top">
        <div>
          <h1>{{ title }}</h1>
          <p class="showcase-subtitle">精选摄影作品，灵感在此汇聚</p>
        </div>
        <div class="header-actions">
          <button v-if="isLoggedIn" class="upload-btn" @click="openUploadModal">
            <span class="upload-icon">📤</span> 上传作品
          </button>
          <div v-else class="upload-hint" @click="requireLogin('登录后即可上传作品')">
            🔒 登录后即可上传作品
          </div>
        </div>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <div class="filter-buttons">
          <button
            v-for="item in firstLevelOptions"
            :key="item.value"
            :class="{ active: firstLevel === item.value }"
            @click="onFirstLevelChange(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="🔍 搜索标题/作者..." />
        </div>
      </div>

      <div class="filter-group" v-if="firstLevel">
        <div class="filter-buttons">
          <button
            v-for="item in secondLevelOptions"
            :key="item.value"
            :class="{ active: secondLevel === item.value }"
            @click="onSecondLevelChange(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="filter-group" v-if="secondLevel">
        <div class="filter-buttons">
          <button
            v-for="item in sortOptions"
            :key="item.value"
            :class="{ active: sortBy === item.value }"
            @click="sortBy = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="masonry-container" ref="scrollContainer" @scroll="onScroll">
      <div class="masonry-grid">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="masonry-card"
      :style="getCardStyle(item.id)"
          @click="openDetail(item)"
          @mousemove="handleTiltMove($event, item.id)"
          @mouseleave="handleTiltLeave(item.id)"
          :ref="el => { if (el) cardRefs[item.id] = el }"
        >
          <div class="card-image-wrapper" :class="getAspectClass(item.id)">
            <img :src="item.images[0]" :alt="item.title" loading="lazy" />
            <div class="card-overlay">
              <span class="overlay-action">查看详情</span>
            </div>
            <span v-if="item.price" class="preset-tag">{{ item.price }}积分</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">{{ item.title }}</h3>
            <div class="card-footer">
              <div class="author-info">
                <span class="author-avatar">{{ item.authorAvatar }}</span>
                <span class="author-name">{{ item.author }}</span>
              </div>
              <button
                class="like-btn"
                :class="{ liked: likedItems.includes(item.id) }"
                @click.stop="toggleLike(item.id)"
              >
                <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="like-count">{{ formatCount(item.likeCount) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <Modal v-model="showDetail" :width="'860px'" :maxHeight="'90vh'" :maskClosable="true">
      <template #header>
        <div class="modal-header-custom">
          <h3>{{ selectedItem?.title }}</h3>
        </div>
      </template>
      <div v-if="selectedItem" class="detail-modal">
        <div class="image-gallery">
          <div class="main-image">
            <img :src="selectedItem.images[currentImageIndex]" :alt="selectedItem.title" />
          </div>
          <div class="thumbnails" v-if="selectedItem.images.length > 1">
            <div
              v-for="(img, index) in selectedItem.images"
              :key="index"
              class="thumb-item"
              :class="{ active: currentImageIndex === index }"
              @click="currentImageIndex = index"
            >
              <img :src="img" :alt="`thumb-${index}`" />
            </div>
          </div>
        </div>

        <div class="detail-content">
          <div class="author-section">
            <span class="detail-avatar">{{ selectedItem.authorAvatar }}</span>
            <span class="detail-author">{{ selectedItem.author }}</span>
            <span class="detail-brand">{{ selectedItem.brand }}</span>
            <span class="detail-style">{{ selectedItem.style }}</span>
          </div>

          <div class="content-text">
            <p>{{ selectedItem.content }}</p>
          </div>

          <div class="hidden-content" v-if="selectedItem.price">
            <div class="price-tag">
              <span class="price-label">预设价格：</span>
              <span class="price-value">{{ selectedItem.price }} 积分</span>
            </div>
          </div>

          <div class="comments-section">
            <h4>评论 ({{ selectedItem.comments.length }})</h4>
            <div class="comment-input">
              <input
                v-model="newComment"
                placeholder="发表你的看法..."
                @keyup.enter="submitComment"
              />
              <button @click="submitComment">发送</button>
            </div>
            <div class="comment-list">
              <div
                v-for="comment in selectedItem.comments"
                :key="comment.id"
                class="comment-item"
              >
                <span class="comment-avatar">{{ comment.avatar }}</span>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-user">{{ comment.user }}</span>
                    <span class="comment-time">{{ comment.time }}</span>
                  </div>
                  <p class="comment-text">{{ comment.text }}</p>
                  <div v-if="comment.replies && comment.replies.length" class="replies">
                    <div v-for="(reply, rIndex) in comment.replies" :key="rIndex" class="reply-item">
                      <span class="reply-user">{{ reply.user }}：</span>
                      <span class="reply-text">{{ reply.text }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!selectedItem.comments.length" class="no-comments">
                暂无评论，快来抢沙发吧！
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="action-buttons">
          <button
            class="action-btn like"
            :class="{ active: likedItems.includes(selectedItem?.id) }"
            @click="toggleLike(selectedItem?.id)"
          >
            <span class="heart">♥</span>
            {{ likedItems.includes(selectedItem?.id) ? '已点赞' : '点赞' }}
          </button>
          <button class="action-btn collect" @click="collectItem">
            <span>★</span> 收藏
          </button>
          <button class="action-btn reward" @click="rewardItem">
            <span>🎁</span> 打赏
          </button>
          <button class="action-btn report" @click="reportItem">
            <span>⚠️</span> 举报
          </button>
        </div>
      </template>
    </Modal>

    <!-- 上传作品弹窗 -->
    <Modal v-model="showUploadModal" :width="'560px'" :maxHeight="'90vh'" :maskClosable="true">
      <template #header>
        <h3>📤 上传作品</h3>
      </template>
      <div class="upload-form">
        <!-- 图片上传 -->
        <div class="form-group">
          <label>作品图片 <span class="required">*</span></label>
          <div
            class="upload-dropzone"
            :class="{ 'has-image': uploadPreview }"
            @click="triggerFileInput"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
            :style="dragOver ? 'border-color: #3b82f6; background: rgba(59,130,246,0.08)' : ''"
          >
            <img v-if="uploadPreview" :src="uploadPreview" class="upload-preview-img" />
            <div v-else class="upload-placeholder">
              <div class="upload-icon-large">📷</div>
              <p>点击或拖拽图片到此处</p>
              <p class="upload-tip">支持 JPG/PNG，最大 5MB</p>
            </div>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <!-- 标题 -->
        <div class="form-group">
          <label>作品标题 <span class="required">*</span></label>
          <input v-model="uploadForm.title" type="text" placeholder="给作品取个标题吧" />
        </div>

        <!-- 描述 -->
        <div class="form-group">
          <label>作品描述</label>
          <textarea v-model="uploadForm.description" rows="3" placeholder="描述一下这张作品...（选填）"></textarea>
        </div>

        <!-- 品牌选择 -->
        <div class="form-group">
          <label>相机品牌</label>
          <div class="select-buttons">
            <button
              v-for="opt in brandSelectOptions"
              :key="opt.value"
              :class="{ active: uploadForm.brand === opt.value }"
              @click="uploadForm.brand = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 风格选择 -->
        <div class="form-group">
          <label>拍摄风格</label>
          <div class="select-buttons">
            <button
              v-for="opt in styleSelectOptions"
              :key="opt.value"
              :class="{ active: uploadForm.style === opt.value }"
              @click="uploadForm.style = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 相机型号 -->
        <div class="form-group">
          <label>相机型号</label>
          <input v-model="uploadForm.camera" type="text" placeholder="例如：Sony A7R5（选填）" />
        </div>
      </div>
      <template #footer>
        <div class="upload-actions">
          <button class="btn-cancel" @click="showUploadModal = false">取消</button>
          <button class="btn-submit" @click="submitUpload" :disabled="uploading">
            {{ uploading ? '提交中...' : '提交审核' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { galleryData } from '@/config/gallery.js'
import { useAccessControl } from '@/composables/useAccessControl'
import { useUserStore } from '@/stores/user'
import { getShowcase as apiGetShowcase, createShowcase as apiCreateShowcase } from '@/api/content'

const { isLoggedIn, requireLogin } = useAccessControl()
const userStore = useUserStore()

// ========== 上传功能 ==========
const PENDING_KEY = 'phototool_pending_showcase'
const showUploadModal = ref(false)
const uploading = ref(false)
const uploadPreview = ref('')
const uploadImageData = ref('')
const dragOver = ref(false)
const fileInputRef = ref(null)

const uploadForm = ref({
  title: '',
  description: '',
  brand: '索尼',
  style: '风光',
  camera: ''
})

const brandSelectOptions = [
  { value: '索尼', label: '索尼' },
  { value: '佳能', label: '佳能' },
  { value: '尼康', label: '尼康' },
  { value: '富士', label: '富士' },
  { value: '松下', label: '松下' },
  { value: '其他', label: '其他' }
]

const styleSelectOptions = [
  { value: '风光', label: '风光' },
  { value: '人像', label: '人像' },
  { value: '人文', label: '人文' },
  { value: '街拍', label: '街拍' },
  { value: '建筑', label: '建筑' },
  { value: '微距', label: '微距' },
  { value: '其他', label: '其他' }
]

const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const validateAndSetFile = async (file) => {
  if (!file) return
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert('仅支持 JPG/PNG 格式图片')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB')
    return
  }
  uploadPreview.value = URL.createObjectURL(file)
  uploadImageData.value = await fileToBase64(file)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  validateAndSetFile(file)
}

const handleDrop = (e) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  validateAndSetFile(file)
}

const openUploadModal = () => {
  if (!requireLogin('登录后即可上传作品')) return
  uploadForm.value = { title: '', description: '', brand: '索尼', style: '风光', camera: '' }
  uploadPreview.value = ''
  uploadImageData.value = ''
  showUploadModal.value = true
}

const submitUpload = async () => {
  if (!uploadForm.value.title.trim()) {
    alert('请输入作品标题')
    return
  }
  if (!uploadImageData.value) {
    alert('请上传作品图片')
    return
  }

  uploading.value = true

  try {
    await apiCreateShowcase({
      title: uploadForm.value.title.trim(),
      description: uploadForm.value.description.trim(),
      imageUrl: uploadImageData.value,
      camera: uploadForm.value.camera.trim(),
      tags: [uploadForm.value.brand, uploadForm.value.style].filter(Boolean),
    })
    uploading.value = false
    showUploadModal.value = false
    alert('作品已提交审核，请等待管理员审批')
  } catch (e) {
    uploading.value = false
    alert('提交失败：' + e.message)
  }
}

const titles = {
  Showcase: '🖼️ 美图展示'
}
const title = ref(titles['Showcase'])

const firstLevel = ref('')
const secondLevel = ref('')
const sortBy = ref('')
const searchQuery = ref('')

const firstLevelOptions = [
  { value: 'brand', label: '相机品牌' },
  { value: 'style', label: '风格' }
]

const brandOptions = [
  { value: 'all', label: '全部品牌' },
  { value: '索尼', label: '索尼' },
  { value: '佳能', label: '佳能' },
  { value: '尼康', label: '尼康' },
  { value: '富士', label: '富士' },
  { value: '松下', label: '松下' }
]

const styleOptions = [
  { value: 'all', label: '全部风格' },
  { value: '风光', label: '风光' },
  { value: '人像', label: '人像' },
  { value: '人文', label: '人文' }
]

const sortOptions = [
  { value: 'hot', label: '热度↑' },
  { value: 'latest', label: '最新' }
]

const secondLevelOptions = computed(() => {
  if (firstLevel.value === 'brand') return brandOptions
  if (firstLevel.value === 'style') return styleOptions
  return []
})

const onFirstLevelChange = (value) => {
  firstLevel.value = value
  secondLevel.value = ''
  sortBy.value = ''
}

const onSecondLevelChange = (value) => {
  secondLevel.value = value
  sortBy.value = 'hot'
}

const SHOWCASE_KEY = 'phototool_showcase_data'
const showcaseVersion = ref(0)
const apiShowcaseData = ref([])

// 从 API 加载数据
const loadShowcaseData = async () => {
  try {
    const data = await apiGetShowcase({ status: 'approved', limit: 100 })
    apiShowcaseData.value = (data.items || []).map(item => ({
      ...item,
      id: item.id,
      images: [item.image_url].filter(Boolean),
      author: item.author_name || '匿名',
      authorAvatar: item.author_avatar || '👤',
      brand: item.camera || '',
      style: '',
      likeCount: item.like_count || 0,
      createdAt: item.created_at,
    }))
    showcaseVersion.value++
  } catch (e) {
    console.error('Failed to load showcase:', e)
  }
}

// 同时保留 localStorage 数据（管理员添加的）
const loadLocalShowcaseData = () => {
  try {
    const raw = localStorage.getItem(SHOWCASE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

const filteredList = computed(() => {
  showcaseVersion.value // 响应式依赖
  const adminData = loadLocalShowcaseData()
  let list = [...apiShowcaseData.value, ...adminData, ...galleryData]

  if (firstLevel.value === 'brand' && secondLevel.value && secondLevel.value !== 'all') {
    list = list.filter(item => item.brand === secondLevel.value)
  }

  if (firstLevel.value === 'style' && secondLevel.value && secondLevel.value !== 'all') {
    list = list.filter(item => item.style === secondLevel.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      (item.content && item.content.toLowerCase().includes(q))
    )
  }

  if (sortBy.value === 'hot') {
    list.sort((a, b) => b.likeCount - a.likeCount)
  } else if (sortBy.value === 'latest') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return list
})

const formatCount = (count) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count
}

const likedItems = ref([])
const cardRefs = ref({})

const handleTiltMove = (e, id) => {
  const el = cardRefs.value[id]
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -8
  const rotateY = ((x - centerX) / centerX) * 8
  el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`
  el.style.transition = 'transform 0.1s ease-out'
}

const handleTiltLeave = (id) => {
  const el = cardRefs.value[id]
  if (!el) return
  el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)'
  el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}

const getCardStyle = () => ({})

const aspectClasses = ['aspect-34', 'aspect-23', 'aspect-169', 'aspect-43', 'aspect-11']
const getAspectClass = (id) => aspectClasses[id % aspectClasses.length]
const toggleLike = (id) => {
  if (!id) return
  const index = likedItems.value.indexOf(id)
  if (index > -1) {
    likedItems.value.splice(index, 1)
  } else {
    likedItems.value.push(id)
  }
}

const showDetail = ref(false)
const selectedItem = ref(null)
const currentImageIndex = ref(0)
const newComment = ref('')

const openDetail = (item) => {
  selectedItem.value = item
  currentImageIndex.value = 0
  showDetail.value = true
}

const submitComment = () => {
  if (!newComment.value.trim() || !selectedItem.value) return
  selectedItem.value.comments.unshift({
    id: Date.now(),
    user: '当前用户',
    avatar: '👤',
    text: newComment.value,
    time: '刚刚',
    replies: []
  })
  newComment.value = ''
}

const collectedItems = ref([])
const collectItem = () => {
  if (!selectedItem.value) return
  const idx = collectedItems.value.indexOf(selectedItem.value.id)
  if (idx > -1) {
    collectedItems.value.splice(idx, 1)
  } else {
    collectedItems.value.push(selectedItem.value.id)
  }
}

const rewardItem = () => {
  alert('打赏成功！')
}

const reportItem = () => {
  alert('举报已提交，管理员将尽快处理')
}

const loading = ref(false)
const scrollContainer = ref(null)

const onScroll = () => {
  if (!scrollContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  if (scrollHeight - scrollTop - clientHeight < 200) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
}

onMounted(() => {
  loadShowcaseData()
})
</script>

<style scoped>
.showcase-page {
  padding: 24px;
  color: var(--text-primary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.showcase-header {
  margin-bottom: 20px;
}

.showcase-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.showcase-subtitle {
  font-size: 14px;
  color: var(--inactive-color);
}

/* 筛选栏 */
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-buttons button {
  background: var(--pill-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 6px 16px;
  color: var(--inactive-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.filter-buttons button:hover {
  background: var(--hover-menu-bg);
  color: var(--theme-color);
  border-color: rgba(113, 119, 144, 0.4);
}

.filter-buttons button.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--theme-color);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
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

/* 瀑布流容器 - 纵向滚动 */
.masonry-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px;
}

.masonry-grid {
  column-count: 4;
  column-gap: 14px;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .masonry-grid { column-count: 3; }
}

@media (max-width: 800px) {
  .masonry-grid { column-count: 2; }
}

@media (max-width: 500px) {
  .masonry-grid { column-count: 2; column-gap: 8px; }
}

/* 单张卡片 */
.masonry-card {
  break-inside: avoid;
  margin-bottom: 10px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.35s ease,
              border-color 0.35s ease;
  will-change: transform;
  position: relative;
}

/* 顶部高光线 */
.masonry-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.masonry-card:hover {
  box-shadow: 0 0 25px 2px rgba(255, 255, 255, 0.12), 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.35);
}

/* 图片区域 - 多种比例 */
.card-image-wrapper {
  position: relative;
  overflow: hidden;
}

.aspect-34 { aspect-ratio: 3 / 4; }
.aspect-23 { aspect-ratio: 2 / 3; }
.aspect-169 { aspect-ratio: 16 / 9; }
.aspect-43 { aspect-ratio: 4 / 3; }
.aspect-11 { aspect-ratio: 1 / 1; }

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.masonry-card:hover .card-image-wrapper img {
  transform: scale(1.08);
}

/* 图片悬浮遮罩 */
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
  opacity: 0;
  transition: opacity 0.35s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 16px;
}

.masonry-card:hover .card-overlay {
  opacity: 1;
}

.overlay-action {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateY(8px);
  transition: transform 0.35s ease;
}

.masonry-card:hover .overlay-action {
  transform: translateY(0);
}

.preset-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(220, 38, 38, 0.9);
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

/* 卡片内容区 */
.card-body {
  padding: 14px 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--theme-color);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-avatar {
  font-size: 16px;
}

.author-name {
  font-size: 12px;
  color: var(--inactive-color);
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--content-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 4px 10px;
  color: var(--inactive-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.like-btn:hover {
  background: rgba(255, 71, 87, 0.15);
  border-color: rgba(255, 71, 87, 0.3);
  color: #ff4757;
}

.like-btn.liked {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
  border-color: rgba(255, 71, 87, 0.3);
}

.heart-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.like-btn.liked .heart-icon {
  fill: #ff4757;
  stroke: #ff4757;
  animation: heartbeat 0.6s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  color: var(--inactive-color);
  font-size: 13px;
  flex-shrink: 0;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-top-color: var(--theme-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 详情弹窗 */
.modal-header-custom h3 {
  font-size: 18px;
  font-weight: 600;
}

.detail-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-image {
  width: 100%;
  max-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
}

.thumb-item {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.thumb-item.active,
.thumb-item:hover {
  opacity: 1;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-avatar {
  font-size: 24px;
}

.detail-author {
  font-size: 16px;
  font-weight: 600;
}

.detail-brand,
.detail-style {
  font-size: 12px;
  background: var(--content-bg);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: 12px;
  color: var(--inactive-color);
}

.content-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
}

.hidden-content {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 12px;
  padding: 12px 16px;
}

.price-tag {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.comments-section h4 {
  font-size: 16px;
  margin-bottom: 12px;
}

.comment-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.comment-input input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.comment-input input:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.comment-input button {
  background: rgba(59, 130, 246, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.comment-input button:hover {
  background: rgba(59, 130, 246, 0.6);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: var(--content-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.comment-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 13px;
  font-weight: 600;
}

.comment-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

.replies {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--border-color);
}

.reply-item {
  font-size: 13px;
  margin-bottom: 4px;
}

.reply-user {
  color: var(--text-secondary);
  font-weight: 600;
}

.reply-text {
  color: var(--text-primary);
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: var(--inactive-color);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--pill-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 8px 16px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-btn:hover {
  background: var(--hover-menu-bg);
}

.action-btn.like.active {
  color: #ff4757;
  border-color: rgba(255, 71, 87, 0.5);
  background: rgba(255, 71, 87, 0.15);
}

.action-btn.collect:hover {
  color: #ffd700;
}

.action-btn.reward:hover {
  color: #fbbf24;
}

.action-btn.report:hover {
  color: #ff6b6b;
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

/* Header top row */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(94, 129, 244, 0.3);
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(94, 129, 244, 0.4);
}

.upload-icon {
  font-size: 16px;
}

.upload-hint {
  font-size: 13px;
  color: var(--inactive-color);
  cursor: pointer;
  padding: 8px 16px;
  border: 1px dashed var(--border-color);
  border-radius: 10px;
  transition: all 0.25s ease;
}

.upload-hint:hover {
  border-color: rgba(59, 130, 246, 0.4);
  color: var(--theme-color);
}

/* Upload form */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-form label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #ef4444;
}

.upload-form input[type="text"],
.upload-form textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font-size: 14px;
  color: #1e2e3a;
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.upload-form input[type="text"]:focus,
.upload-form textarea:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.upload-dropzone {
  width: 100%;
  min-height: 160px;
  border: 2px dashed rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.02);
}

.upload-dropzone:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.04);
}

.upload-dropzone.has-image {
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.1);
  padding: 0;
}

.upload-preview-img {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  display: block;
}

.upload-placeholder {
  text-align: center;
  color: #9ca3af;
}

.upload-icon-large {
  font-size: 40px;
  margin-bottom: 8px;
}

.upload-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.upload-tip {
  font-size: 12px !important;
  color: #b0b5be !important;
}

/* Select buttons */
.select-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.select-buttons button {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-buttons button:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.select-buttons button.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #3b82f6;
  font-weight: 600;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
}

.btn-submit {
  background: linear-gradient(135deg, #5e81f4, #8b5cf6);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(94, 129, 244, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
