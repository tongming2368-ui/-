import { reactive } from 'vue'

const STORAGE_KEY = 'filterConfigV2'

// 默认筛选配置 — 按大分类 → 子页面 → 筛选组 层级组织
const defaultConfig = {
  // ===== 📸 穷三代 =====
  qionsandai: {
    label: '📸 穷三代',
    pages: {
      camera: {
        label: '📷 相机',
        groups: [
          { id: 'sensor', label: '一级筛选 · 画幅', type: 'buttons', options: [
            { value: 'all', label: '全部画幅' },
            { value: '全画幅', label: '全画幅' },
            { value: 'APSC', label: 'APS-C' },
            { value: 'M43', label: 'M43' },
            { value: 'other', label: '其他' },
          ]},
          { id: 'brand', label: '二级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部品牌' },
            { value: 'Sony', label: '索尼' },
            { value: 'Canon', label: '佳能' },
            { value: 'Nikon', label: '尼康' },
            { value: 'Fujifilm', label: '富士' },
            { value: 'Panasonic', label: '松下' },
            { value: 'other', label: '其他' },
          ]},
          { id: 'sort', label: '三级筛选 · 排序', type: 'buttons', options: [
            { value: 'default', label: '默认' },
            { value: 'price-asc', label: '价格↑' },
            { value: 'price-desc', label: '价格↓' },
            { value: 'date-desc', label: '最新' },
          ]},
        ]
      },
      lens: {
        label: '🔭 镜头',
        groups: [
          { id: 'mount', label: '一级筛选 · 卡口', type: 'buttons', options: [
            { value: 'all', label: '全部卡口' },
            { value: '索尼E口', label: '索尼E口' },
            { value: '佳能RF口', label: '佳能RF口' },
            { value: '尼康Z口', label: '尼康Z口' },
            { value: '富士X口', label: '富士X口' },
            { value: '松下L口', label: '松下L口' },
            { value: 'other', label: '其他' },
          ]},
          { id: 'brand', label: '二级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部品牌' },
            { value: 'Sony', label: '索尼' },
            { value: 'Canon', label: '佳能' },
            { value: 'Nikon', label: '尼康' },
            { value: 'Fujifilm', label: '富士' },
            { value: 'Tamron', label: '腾龙' },
            { value: 'other', label: '其他' },
          ]},
          { id: 'type', label: '三级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部类型' },
            { value: 'prime', label: '定焦' },
            { value: 'zoom', label: '变焦' },
          ]},
        ]
      },
      compare: {
        label: '⚖️ 参数对比',
        groups: [
          { id: 'compareType', label: '一级筛选 · 对比类型', type: 'buttons', options: [
            { value: 'camera', label: '相机对比' },
            { value: 'lens', label: '镜头对比' },
          ]},
        ]
      },
    }
  },

  // ===== 🎒 差生文具多 =====
  chashengwenju: {
    label: '🎒 差生文具多',
    pages: {
      tripod: {
        label: '🗼 三脚架',
        groups: [
          { id: 'material', label: '一级筛选 · 材质', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'carbon', label: '碳纤维' },
            { value: 'aluminum', label: '铝合金' },
          ]},
          { id: 'brand', label: '二级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部品牌' },
            { value: 'PeakDesign', label: 'Peak Design' },
            { value: 'Leofoto', label: '徕图' },
            { value: 'Benro', label: '百诺' },
            { value: 'other', label: '其他' },
          ]},
        ]
      },
      audio: {
        label: '🎙️ 音频设备',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'mic', label: '麦克风' },
            { value: 'monitor', label: '监听耳机' },
          ]},
          { id: 'brand', label: '二级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部品牌' },
            { value: 'Rode', label: 'Rode' },
            { value: 'DJI', label: 'DJI' },
            { value: 'other', label: '其他' },
          ]},
        ]
      },
      light: {
        label: '💡 灯光',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'flash', label: '闪光灯' },
            { value: 'led', label: 'LED常亮灯' },
            { value: 'portable', label: '便携补光' },
          ]},
          { id: 'brand', label: '二级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部品牌' },
            { value: 'Godox', label: '神牛' },
            { value: 'Profoto', label: 'Profoto' },
            { value: 'other', label: '其他' },
          ]},
        ]
      },
      accessory: {
        label: '🎒 其他配件',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'bag', label: '摄影包' },
            { value: 'filter', label: '滤镜' },
            { value: 'battery', label: '电池' },
            { value: 'memory', label: '存储卡' },
          ]},
        ]
      },
    }
  },

  // ===== 🎞️ 古典摄影 =====
  gudian: {
    label: '🎞️ 古典摄影',
    pages: {
      film: {
        label: '🎞️ 胶片',
        groups: [
          { id: 'format', label: '一级筛选 · 画幅', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: '135', label: '135' },
            { value: '120', label: '120' },
            { value: 'large', label: '大画幅' },
          ]},
          { id: 'type', label: '二级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'color_negative', label: '彩色负片' },
            { value: 'bw_negative', label: '黑白负片' },
            { value: 'slide', label: '反转片' },
          ]},
        ]
      },
      wetplate: {
        label: '🧪 湿版',
        groups: [
          { id: 'size', label: '一级筛选 · 尺寸', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: '4x5', label: '4×5' },
            { value: '8x10', label: '8×10' },
          ]},
        ]
      },
      'other-photo': {
        label: '📸 其他摄影',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'instant', label: '拍立得' },
            { value: 'pinhole', label: '针孔' },
          ]},
        ]
      },
    }
  },

  // ===== 📚 指手画脚 =====
  zhishouhuazhu: {
    label: '📚 指手画脚',
    pages: {
      tutorials: {
        label: '📖 教程',
        groups: [
          { id: 'category', label: '一级筛选 · 分类', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'basic', label: '入门' },
            { value: 'advanced', label: '进阶' },
            { value: 'post', label: '后期' },
            { value: 'gear', label: '器材' },
            { value: 'composition', label: '构图' },
          ]},
          { id: 'difficulty', label: '二级筛选 · 难度', type: 'buttons', options: [
            { value: '', label: '全部' },
            { value: 'beginner', label: '入门' },
            { value: 'intermediate', label: '进阶' },
            { value: 'advanced', label: '高级' },
          ]},
        ]
      },
      guides: {
        label: '📝 攻略',
        groups: [
          { id: 'category', label: '一级筛选 · 分类', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'buying', label: '购买指南' },
            { value: 'travel', label: '旅行攻略' },
            { value: 'technique', label: '技法' },
          ]},
        ]
      },
      manuals: {
        label: '📋 说明书',
        groups: [
          { id: 'brand', label: '一级筛选 · 厂商', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'Sony', label: '索尼' },
            { value: 'Canon', label: '佳能' },
            { value: 'Nikon', label: '尼康' },
            { value: 'Fujifilm', label: '富士' },
            { value: 'Panasonic', label: '松下' },
          ]},
          { id: 'type', label: '二级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'camera', label: '相机' },
            { value: 'lens', label: '镜头' },
            { value: 'accessory', label: '配件' },
          ]},
        ]
      },
    }
  },

  // ===== 🎨 千变万化 =====
  qianbianwanhua: {
    label: '🎨 千变万化',
    pages: {
      showcase: {
        label: '🖼️ 美图展示',
        groups: [
          { id: 'brand', label: '一级筛选 · 相机品牌', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'Sony', label: '索尼' },
            { value: 'Canon', label: '佳能' },
            { value: 'Fujifilm', label: '富士' },
            { value: 'Leica', label: '徕卡' },
            { value: 'other', label: '其他' },
          ]},
          { id: 'style', label: '二级筛选 · 风格', type: 'buttons', options: [
            { value: 'all', label: '全部风格' },
            { value: 'portrait', label: '人像' },
            { value: 'landscape', label: '风光' },
            { value: 'street', label: '街拍' },
            { value: 'macro', label: '微距' },
          ]},
        ]
      },
      presets: {
        label: '🎨 调色预设',
        groups: [
          { id: 'style', label: '一级筛选 · 风格', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'japanese', label: '🗾 日系' },
            { value: 'film', label: '🎞️ 胶片' },
            { value: 'cyber', label: '🌃 赛博' },
            { value: 'vintage', label: '📻 复古' },
            { value: 'fresh', label: '🌿 清新' },
            { value: 'bw', label: '⬛ 黑白' },
          ]},
          { id: 'software', label: '二级筛选 · 适用软件', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'lightroom', label: 'Lightroom' },
            { value: 'capture_one', label: 'Capture One' },
            { value: 'vsco', label: 'VSCO' },
          ]},
        ]
      },
    }
  },

  // ===== 📢 活动专区 =====
  huodong: {
    label: '📢 活动专区',
    pages: {
      activities: {
        label: '🎯 活动',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部活动' },
            { value: 'challenge', label: '📷 摄影赛' },
            { value: 'workshop', label: '👥 线下活动' },
            { value: 'online', label: '💻 线上活动' },
            { value: 'contest', label: '🎁 有奖征集' },
          ]},
        ]
      },
      'brand-activities': {
        label: '🏢 厂商活动',
        groups: [
          { id: 'brand', label: '一级筛选 · 品牌', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'Sony', label: '索尼' },
            { value: 'Canon', label: '佳能' },
            { value: 'Nikon', label: '尼康' },
            { value: 'other', label: '其他' },
          ]},
        ]
      },
      announcements: {
        label: '📢 活动公告',
        groups: [
          { id: 'type', label: '一级筛选 · 类型', type: 'buttons', options: [
            { value: 'all', label: '全部公告' },
            { value: 'system', label: '⚙️ 系统公告' },
            { value: 'activity', label: '🎯 活动通知' },
            { value: 'update', label: '🔄 更新日志' },
            { value: 'maintenance', label: '🔧 维护公告' },
          ]},
        ]
      },
    }
  },

  // ===== 📚 工具站板块 =====
  toolstation: {
    label: '📚 工具站板块',
    pages: {
      posts: {
        label: '📚 资源帖子区',
        groups: [
          { id: 'category', label: '一级筛选 · 分类', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'talk', label: '闲聊' },
            { value: 'share', label: '分享' },
            { value: 'question', label: '提问' },
            { value: 'resource', label: '资源' },
          ]},
        ]
      },
      deals: {
        label: '🐑 羊毛党',
        groups: [
          { id: 'category', label: '一级筛选 · 分类', type: 'buttons', options: [
            { value: 'all', label: '全部' },
            { value: 'camera', label: '相机' },
            { value: 'lens', label: '镜头' },
            { value: 'accessory', label: '配件' },
            { value: 'software', label: '软件' },
          ]},
          { id: 'tag', label: '二级筛选 · 标签', type: 'buttons', options: [
            { value: '', label: '全部' },
            { value: 'limited', label: '限时' },
            { value: 'newuser', label: '新人' },
            { value: 'regular', label: '常驻' },
          ]},
        ]
      },
    }
  },
}

// 从 localStorage 加载配置
function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load filter config:', e)
  }
  return JSON.parse(JSON.stringify(defaultConfig))
}

// 保存配置到 localStorage
function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// 全局响应式配置
const config = reactive(loadConfig())

// 监听 localStorage 变化，实时更新配置
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const newConfig = loadConfig()
      Object.keys(config).forEach(k => delete config[k])
      Object.assign(config, newConfig)
    }
  })
}

// 导出 composable
export function useFilterConfig() {

  // 获取所有大分类列表
  const getAllCategories = () => {
    return Object.entries(config).map(([catId, cat]) => ({
      id: catId,
      label: cat.label,
      pageCount: Object.keys(cat.pages).length,
    }))
  }

  // 获取某大分类下的子页面列表
  const getPagesByCategory = (catId) => {
    const cat = config[catId]
    if (!cat) return []
    return Object.entries(cat.pages).map(([pageId, page]) => ({
      id: pageId,
      label: page.label,
      groupCount: page.groups.length,
    }))
  }

  // 获取某页面的筛选组配置
  const getFilterConfig = (catId, pageId) => {
    const cat = config[catId]
    if (!cat) return null
    return cat.pages[pageId] || null
  }

  // 获取某页面某个筛选组的选项（新版：需指定 catId）
  const getFilterOptions = (catId, pageId, groupId) => {
    const page = getFilterConfig(catId, pageId)
    if (!page) return []
    const group = page.groups.find(g => g.id === groupId)
    return group ? group.options : []
  }

  // 兼容旧版 — 通过 pageId + groupId 获取选项（自动搜索分类）
  const getPageFilterOptions = (pageId, groupId) => {
    for (const [catId, cat] of Object.entries(config)) {
      if (cat.pages[pageId]) {
        const group = cat.pages[pageId].groups.find(g => g.id === groupId)
        if (group) return group.options
      }
    }
    return []
  }

  // 添加筛选组到某页面
  const addFilterGroup = (catId, pageId, group) => {
    if (!config[catId]) return
    if (!config[catId].pages[pageId]) {
      config[catId].pages[pageId] = { label: pageId, groups: [] }
    }
    config[catId].pages[pageId].groups.push(group)
    saveConfig(config)
  }

  // 删除筛选组
  const removeFilterGroup = (catId, pageId, groupId) => {
    const page = getFilterConfig(catId, pageId)
    if (!page) return
    page.groups = page.groups.filter(g => g.id !== groupId)
    saveConfig(config)
  }

  // 添加筛选选项
  const addFilterOption = (catId, pageId, groupId, option) => {
    const page = getFilterConfig(catId, pageId)
    if (!page) return
    const group = page.groups.find(g => g.id === groupId)
    if (group) {
      group.options.push(option)
      saveConfig(config)
    }
  }

  // 重置为默认配置
  const resetToDefault = () => {
    const defaults = JSON.parse(JSON.stringify(defaultConfig))
    Object.keys(defaults).forEach(key => {
      config[key] = defaults[key]
    })
    saveConfig(config)
  }

  // 兼容旧版 — 通过 pageId 模糊匹配查找（用于前端页面调用）
  const getPageFilterById = (pageId) => {
    for (const [catId, cat] of Object.entries(config)) {
      if (cat.pages[pageId]) {
        return cat.pages[pageId]
      }
    }
    return null
  }

  return {
    config,
    getAllCategories,
    getPagesByCategory,
    getFilterConfig,
    getFilterOptions,
    addFilterGroup,
    removeFilterGroup,
    addFilterOption,
    resetToDefault,
    getPageFilterById,
    getPageFilterOptions,
    // 兼容旧版 API
    getAllPages: () => {
      const pages = []
      for (const [catId, cat] of Object.entries(config)) {
        for (const [pageId, page] of Object.entries(cat.pages)) {
          pages.push({ id: pageId, name: page.name || page.label, groupCount: page.groups.length })
        }
      }
      return pages
    },
  }
}
