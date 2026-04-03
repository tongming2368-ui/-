// 工具站菜单
export const toolMenu = [
  { id: 'home', label: '首页', icon: '🏠', ionIcon: 'home-outline', path: '/' },
  { id: 'tools', label: '实用工具', icon: '🛠️', ionIcon: 'construct-outline', path: '/tools' },
  { id: 'posts', label: '资源帖子区', icon: '📚', ionIcon: 'book-outline', path: '/posts' },
  { id: 'deals', label: '羊毛党', icon: '🐑', ionIcon: 'pricetags-outline', path: '/deals' },
  { id: 'game', label: '休闲区', icon: '🎮', ionIcon: 'game-controller-outline', path: '/game' },
  { id: 'links', label: '友链专属', icon: '🔗', ionIcon: 'link-outline', path: '/links' },
]

// 摄影之家菜单
export const photoMenu = [
  {
    id: 'qionsandai',
    label: '穷三代',
    icon: '📸',
    ionIcon: 'camera-outline',
    children: [
      { id: 'camera', label: '相机', icon: '📷', ionIcon: 'camera-outline', path: '/equipment/camera' },
      { id: 'lens', label: '镜头', icon: '🔭', ionIcon: 'telescope-outline', path: '/equipment/lens' },
      { id: 'compare', label: '参数对比', icon: '⚖️', ionIcon: 'git-compare-outline', path: '/compare' },
    ]
  },
  {
    id: 'chashengwenju',
    label: '差生文具多',
    icon: '🎒',
    ionIcon: 'briefcase-outline',
    children: [
      { id: 'tripod', label: '三脚架', icon: '🗼', ionIcon: 'resize-outline', path: '/equipment/tripod' },
      { id: 'audio', label: '音频设备', icon: '🎙️', ionIcon: 'mic-outline', path: '/equipment/audio' },
      { id: 'light', label: '灯光', icon: '💡', ionIcon: 'bulb-outline', path: '/equipment/light' },
      { id: 'accessory', label: '其他配件', icon: '🎒', ionIcon: 'bag-outline', path: '/equipment/accessory' },
    ]
  },
  {
    id: 'gudian',
    label: '古典摄影',
    icon: '🎞️',
    ionIcon: 'film-outline',
    children: [
      { id: 'film', label: '胶片', icon: '🎞️', ionIcon: 'film-outline', path: '/equipment/film' },
      { id: 'wetplate', label: '湿版', icon: '🧪', ionIcon: 'flask-outline', path: '/equipment/wetplate' },
      { id: 'other-photo', label: '其他摄影', icon: '📸', ionIcon: 'aperture-outline', path: '/equipment/other-photo' },
    ]
  },
  {
    id: 'zhishouhuazhu',
    label: '指手画脚',
    icon: '📚',
    ionIcon: 'library-outline',
    children: [
      { id: 'tutorials', label: '教程', icon: '📖', ionIcon: 'school-outline', path: '/tutorials' },
      { id: 'guides', label: '攻略', icon: '📝', ionIcon: 'document-text-outline', path: '/guides' },
      { id: 'manuals', label: '说明书', icon: '📋', ionIcon: 'clipboard-outline', path: '/manuals' },
    ]
  },
  {
    id: 'qianbianwanhua',
    label: '千变万化',
    icon: '🎨',
    ionIcon: 'color-palette-outline',
    children: [
      { id: 'showcase', label: '美图展示', icon: '🖼️', ionIcon: 'image-outline', path: '/showcase' },
      { id: 'presets', label: '调色预设', icon: '🎨', ionIcon: 'color-filter-outline', path: '/presets' },
    ]
  },
  {
    id: 'huodong',
    label: '活动专区',
    icon: '📢',
    ionIcon: 'megaphone-outline',
    children: [
      { id: 'activities', label: '活动', icon: '🎯', ionIcon: 'flag-outline', path: '/activities' },
      { id: 'brand-activities', label: '厂商活动', icon: '🏢', ionIcon: 'business-outline', path: '/brand-activities' },
      { id: 'announcements', label: '活动公告', icon: '📢', ionIcon: 'notifications-outline', path: '/announcements' },
    ]
  },
]

// 底部固定菜单（两种模式通用）
export const bottomMenu = [
  { id: 'chat', label: '在线聊天室', icon: '💬', ionIcon: 'chatbubbles-outline', path: '/chat' },
  { id: 'user', label: '用户中心', icon: '👤', ionIcon: 'person-outline', path: '/user' },
]
