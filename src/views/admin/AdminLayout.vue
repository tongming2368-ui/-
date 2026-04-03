<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">📷</div>
        <span class="logo-text">汇相-摄影之家</span>
      </div>
      <nav class="sidebar-nav">
        <div v-for="group in menuGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label">{{ group.label }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>
      <div class="sidebar-footer">
        <button class="back-btn" @click="goToFront">
          <span>🏠</span>
          <span>返回前台</span>
        </button>
      </div>
    </aside>
    
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <div class="topbar-right">
          <div class="admin-info">
            <span class="admin-avatar">{{ adminInfo.avatar }}</span>
            <span class="admin-name">{{ adminInfo.nickname }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <span>退出</span>
          </button>
        </div>
      </header>
      
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 初始化管理员用户信息
onMounted(async () => {
  if (userStore.adminToken && !userStore.adminUser) {
    await userStore.initAdminUser()
  }
  // 如果没登录，跳转到登录页
  if (!userStore.adminToken) {
    router.push('/admin/login')
  }
})

// 全局样式覆盖 - 确保管理后台所有文字都是深色
const adminStyleEl = ref(null)
onMounted(() => {
  const style = document.createElement('style')
  style.id = 'admin-global-override'
  style.textContent = `
    /* 最高优先级覆盖 - 确保所有文字都是深色 */
    .admin-layout { color: #333 !important; }
    .admin-layout * { color: #333 !important; }
    .admin-layout *::before { color: inherit !important; }
    .admin-layout *::after { color: inherit !important; }
    
    /* 标题 */
    .admin-layout h1, .admin-layout h2, .admin-layout h3,
    .admin-layout h1 *, .admin-layout h2 *, .admin-layout h3 * {
      color: #111 !important;
    }
    
    /* 链接 */
    .admin-layout a { color: #3b5bdb !important; }
    .admin-layout a:hover { color: #2743b3 !important; }
    
    /* 表单 */
    .admin-layout input, .admin-layout select, .admin-layout textarea {
      color: #333 !important; background: #fff !important; border-color: rgba(0,0,0,0.15) !important;
    }
    .admin-layout input::placeholder { color: #999 !important; }
    
    /* 卡片 - 强制白底深字 */
    .admin-layout .glass-dark,
    .admin-layout .glass-dark *,
    .admin-layout .glass-card,
    .admin-layout .glass-card *,
    .admin-layout .stat-card,
    .admin-layout .stat-card *,
    .admin-layout .settings-section,
    .admin-layout .settings-section *,
    .admin-layout [class*="card"],
    .admin-layout [class*="card"] * {
      color: #333 !important;
    }
    .admin-layout .glass-dark, .admin-layout .glass-card, .admin-layout .stat-card,
    .admin-layout .settings-section, .admin-layout [class*="card"] {
      background-color: #fff !important;
      border-color: rgba(0,0,0,0.1) !important;
    }
    
    /* 按钮 */
    .admin-layout button { color: #333 !important; background: #fff !important; border-color: rgba(0,0,0,0.15) !important; }
    .admin-layout button[type="submit"], .admin-layout .btn-save, .admin-layout .login-btn,
    .admin-layout button.save-btn, .admin-layout .btn-primary { color: #fff !important; background: #5e81f4 !important; border-color: #5e81f4 !important; }
    .admin-layout .btn-danger { color: #e53e3e !important; background: rgba(239,68,68,0.1) !important; }
    
    /* 表格 */
    .admin-layout table th, .admin-layout table th * { color: #111 !important; }
    .admin-layout table td, .admin-layout table td * { color: #333 !important; }
    
    /* 标签 */
    .admin-layout label { color: #4a5568 !important; }
    
    /* 描述文字 */
    .admin-layout .text-muted { color: #6b7280 !important; }
  `
  document.head.appendChild(style)
  adminStyleEl.value = style
})
onUnmounted(() => {
  if (adminStyleEl.value) adminStyleEl.value.remove()
})

const menuGroups = [
  {
    label: '数据总览',
    items: [
      { path: '/admin/dashboard', label: '仪表盘', icon: '📊' },
    ]
  },
  {
    label: '用户管理',
    items: [
      { path: '/admin/users', label: '用户列表', icon: '👥' },
    ]
  },
  {
    label: '内容管理',
    items: [
      { path: '/admin/posts', label: '资源帖子', icon: '📝' },
      { path: '/admin/showcase', label: '美图作品', icon: '🖼️' },
      { path: '/admin/presets', label: '调色预设', icon: '🎨' },
      { path: '/admin/tutorials', label: '教程攻略', icon: '📖' },
    ]
  },
  {
    label: '器材与工具',
    items: [
      { path: '/admin/equipment', label: '摄影器材', icon: '📷' },
      { path: '/admin/tools', label: '在线工具', icon: '🔧' },
    ]
  },
  {
    label: '运营活动',
    items: [
      { path: '/admin/activities', label: '活动管理', icon: '🎯' },
      { path: '/admin/deals', label: '优惠信息', icon: '🐑' },
      { path: '/admin/announcements', label: '公告通知', icon: '📢' },
      { path: '/admin/ads', label: '广告位管理', icon: '📣' },
    ]
  },
  {
    label: '社区',
    items: [
      { path: '/admin/links', label: '友情链接', icon: '🔗' },
    ]
  },
  {
    label: '系统',
    items: [
      { path: '/admin/settings', label: '系统设置', icon: '⚙️' },
    ]
  },
]

// 展平用于查找当前页面标题
const menuItems = computed(() => menuGroups.flatMap(g => g.items))

const adminInfo = computed(() => {
  if (userStore.adminUser) {
    return {
      nickname: userStore.adminUser.nickname || userStore.adminUser.username || '管理员',
      avatar: userStore.adminUser.avatar || '👨‍💼',
      username: userStore.adminUser.username
    }
  }
  // fallback to localStorage
  const info = localStorage.getItem('admin_user')
  return info ? JSON.parse(info) : { nickname: '管理员', avatar: '👨‍💼' }
})

const currentPageTitle = computed(() => {
  const item = menuItems.find(i => i.path === route.path)
  return item ? item.label : '后台管理'
})

const goToFront = () => {
  router.push('/')
}

const handleLogout = () => {
  userStore.adminLogout()
  router.push('/admin/login')
}
</script>

<style scoped>

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
  color: #333;
}

.sidebar {
  width: 200px;
  background: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.logo {
  font-size: 28px;
}

.logo-text {
  color: #111;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  padding: 10px 12px 4px;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #4a5568;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 13px;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #111;
}

.nav-item.active {
  background: rgba(94, 129, 244, 0.12);
  color: #3b5bdb;
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: #4a5568;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #111;
}

.main-area {
  flex: 1;
  margin-left: 200px;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  color: #111;
  font-size: 18px;
  font-weight: 500;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-avatar {
  font-size: 24px;
}

.admin-name {
  color: #2d3748;
  font-size: 14px;
}

.logout-btn {
  padding: 6px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #e53e3e;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #c53030;
}

.content {
  flex: 1;
  padding: 24px;
  color: #2d3748;
}

</style>
