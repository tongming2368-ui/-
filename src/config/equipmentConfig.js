export const EQUIPMENT_CONFIG_KEY = 'phototool_equipment_config'

// 默认配置
export const defaultEquipmentConfig = {
  categories: [
    { id: 'camera', name: '相机', icon: '📷' },
    { id: 'lens', name: '镜头', icon: '🔭' },
    { id: 'tripod', name: '三脚架', icon: '🔩' },
    { id: 'audio', name: '收音设备', icon: '🎤' },
    { id: 'light', name: '灯光设备', icon: '💡' },
    { id: 'accessory', name: '配件', icon: '🎒' },
    { id: 'film', name: '胶片', icon: '🎞️' },
    { id: 'wetplate', name: '湿版器材', icon: '📸' },
    { id: 'other', name: '其他', icon: '📦' },
  ],
  brands: [
    { value: 'Sony', label: '索尼' },
    { value: 'Canon', label: '佳能' },
    { value: 'Nikon', label: '尼康' },
    { value: 'Fujifilm', label: '富士' },
    { value: 'Panasonic', label: '松下' },
    { value: 'Tamron', label: '腾龙' },
    { value: 'Sigma', label: '适马' },
    { value: 'Leica', label: '徕卡' },
    { value: 'Leofoto', label: '徕图' },
    { value: 'Manfrotto', label: '曼富图' },
    { value: 'Peak Design', label: 'Peak Design' },
    { value: 'Godox', label: '神牛' },
    { value: 'Aputure', label: '爱图仕' },
    { value: 'Nanlite', label: '南光' },
    { value: 'Rode', label: 'Rode' },
    { value: 'DJI', label: '大疆' },
    { value: 'Zoom', label: 'Zoom' },
    { value: 'Kodak', label: '柯达' },
    { value: 'Ilford', label: '伊尔福' },
    { value: 'B+W', label: 'B+W' },
    { value: 'ProGrade', label: 'ProGrade' },
  ],
  sensors: [
    { value: '全画幅', label: '全画幅' },
    { value: 'APSC', label: 'APS-C' },
    { value: 'M43', label: 'M43' },
    { value: '中画幅', label: '中画幅' },
  ],
  mounts: [
    { value: '索尼E口', label: '索尼E口' },
    { value: '佳能RF口', label: '佳能RF口' },
    { value: '尼康Z口', label: '尼康Z口' },
    { value: '富士X口', label: '富士X口' },
    { value: 'M43口', label: 'M43口' },
    { value: '松下L口', label: '松下L口' },
    { value: '佳能EF口', label: '佳能EF口' },
    { value: '尼康F口', label: '尼康F口' },
    { value: '徕卡M口', label: '徕卡M口' },
    { value: '徕卡L口', label: '徕卡L口' },
  ],
}

// 获取配置（从 localStorage 或返回默认值）
export function loadEquipmentConfig() {
  try {
    const raw = localStorage.getItem(EQUIPMENT_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return JSON.parse(JSON.stringify(defaultEquipmentConfig))
}

// 保存配置
export function saveEquipmentConfig(config) {
  localStorage.setItem(EQUIPMENT_CONFIG_KEY, JSON.stringify(config))
  // 触发 storage 事件让其他页面感知（同页面用 dispatchEvent）
  window.dispatchEvent(new Event('equipment-config-changed'))
}
