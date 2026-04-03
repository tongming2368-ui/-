import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/AdminLogin.vue')
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UserManage.vue')
      },
      {
        path: 'equipment',
        name: 'AdminEquipment',
        component: () => import('@/views/admin/EquipmentManage.vue')
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('@/views/admin/PostManage.vue')
      },
      {
        path: 'tools',
        name: 'AdminTools',
        component: () => import('@/views/admin/ToolManage.vue')
      },
      {
        path: 'ads',
        name: 'AdminAds',
        component: () => import('@/views/admin/AdManage.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue')
      },
      {
        path: 'showcase',
        name: 'AdminShowcase',
        component: () => import('@/views/admin/ShowcaseManage.vue')
      },
      {
        path: 'presets',
        name: 'AdminPresets',
        component: () => import('@/views/admin/PresetsManage.vue')
      },
      {
        path: 'tutorials',
        name: 'AdminTutorials',
        component: () => import('@/views/admin/TutorialsManage.vue')
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: () => import('@/views/admin/ActivitiesManage.vue')
      },
      {
        path: 'announcements',
        name: 'AdminAnnouncements',
        component: () => import('@/views/admin/AnnouncementsManage.vue')
      },
      {
        path: 'deals',
        name: 'AdminDeals',
        component: () => import('@/views/admin/DealsManage.vue')
      },
      {
        path: 'links',
        name: 'AdminLinks',
        component: () => import('@/views/admin/LinksManage.vue')
      },
    ]
  },
  {
    path: '/equipment/:type',
    name: 'Equipment',
    component: () => import('@/views/Equipment.vue')
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/Tools.vue')
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('@/views/Posts.vue')
  },
  {
    path: '/deals',
    name: 'Deals',
    component: () => import('@/views/Deals.vue')
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('@/views/Game.vue')
  },
  {
    path: '/links',
    name: 'Links',
    component: () => import('@/views/Links.vue')
  },
  {
    path: '/camera',
    name: 'Camera',
    component: () => import('@/views/Camera.vue')
  },
  {
    path: '/lens',
    name: 'Lens',
    component: () => import('@/views/Lens.vue')
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/Compare.vue')
  },
  {
    path: '/showcase',
    name: 'Showcase',
    component: () => import('@/views/Showcase.vue')
  },
  {
    path: '/presets',
    name: 'Presets',
    component: () => import('@/views/Presets.vue')
  },
  {
    path: '/tutorials',
    name: 'Tutorials',
    component: () => import('@/views/Tutorials.vue')
  },
  {
    path: '/guides',
    name: 'Guides',
    component: () => import('@/views/Guides.vue')
  },
  {
    path: '/manuals',
    name: 'Manuals',
    component: () => import('@/views/Manuals.vue')
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('@/views/Activities.vue')
  },
  {
    path: '/brand-activities',
    name: 'BrandActivities',
    component: () => import('@/views/BrandActivities.vue')
  },
  {
    path: '/announcements',
    name: 'Announcements',
    component: () => import('@/views/Announcements.vue')
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: () => import('@/views/UserCenter.vue')
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      return '/admin/login'
    }
  }
})

export default router
