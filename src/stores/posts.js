import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPosts, createPost as apiCreatePost, deletePost as apiDeletePost, likePost as apiLikePost } from '@/api/content'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  const searchQuery = ref('')
  const currentCategory = ref('all')
  const currentSort = ref('hot')

  // 从后端获取帖子
  const fetchPosts = async () => {
    loading.value = true
    try {
      const data = await getPosts({
        category: currentCategory.value === 'all' ? undefined : currentCategory.value,
        sort: currentSort.value,
        search: searchQuery.value || undefined,
        limit: 100
      })
      posts.value = (data.posts || []).map(p => ({
        ...p,
        isSticky: !!p.is_sticky,
        isHidden: !!p.is_hidden,
        isEssence: !!p.is_essence,
        viewCount: p.view_count || 0,
        likeCount: p.like_count || 0,
        commentCount: p.comment_count || 0,
        collectCount: p.collect_count || 0,
        createdAt: p.created_at,
        author: p.author_name || '未知用户',
        authorAvatar: p.author_avatar || '',
        authorLevel: p.author_level || 1,
      }))
    } catch (e) {
      console.error('Fetch posts failed:', e.message)
    }
    loading.value = false
  }

  // 发帖
  const createPost = async (postData) => {
    try {
      const data = await apiCreatePost(postData)
      const p = data.post
      const newPost = {
        ...p,
        isSticky: !!p.is_sticky,
        isHidden: !!p.is_hidden,
        isEssence: !!p.is_essence,
        viewCount: p.view_count || 0,
        likeCount: p.like_count || 0,
        commentCount: p.comment_count || 0,
        collectCount: p.collect_count || 0,
        createdAt: p.created_at,
        author: p.author_name || '未知用户',
        authorAvatar: p.author_avatar || '',
        authorLevel: p.author_level || 1,
      }
      posts.value.unshift(newPost)
      return newPost
    } catch (e) {
      console.error('Create post failed:', e.message)
      throw e
    }
  }

  // 删除帖子
  const deletePost = async (id) => {
    try {
      await apiDeletePost(id)
      posts.value = posts.value.filter(p => p.id !== id)
      return true
    } catch (e) {
      console.error('Delete post failed:', e.message)
      return false
    }
  }

  // 点赞
  const toggleLike = async (postId) => {
    try {
      const data = await apiLikePost(postId)
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.likeCount = data.liked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1)
        post._liked = data.liked
      }
      return data.liked
    } catch (e) {
      console.error('Like post failed:', e.message)
      return false
    }
  }

  const filteredPosts = computed(() => {
    let result = [...posts.value].filter(p => p.category !== 'activity_zone' && p.category !== 'deals_zone')

    if (currentCategory.value !== 'all') {
      result = result.filter(p => p.category === currentCategory.value)
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.author || '').toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      if (currentSort.value === 'hot') return b.viewCount - a.viewCount
      if (currentSort.value === 'reply') return b.commentCount - a.commentCount
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    // 置顶优先
    result.sort((a, b) => (b.isSticky ? 1 : 0) - (a.isSticky ? 1 : 0))

    return result
  })

  const openPost = (post) => { currentPost.value = post }
  const closePost = () => { currentPost.value = null }

  return {
    posts, currentPost, loading, searchQuery,
    currentCategory, currentSort,
    fetchPosts, createPost, deletePost, toggleLike,
    filteredPosts, openPost, closePost
  }
})
