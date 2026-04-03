// 等级配置
export const levelConfig = [
  { level: 1, name: '萌新摄影师', minPoints: 0, privileges: ['basic'] },
  { level: 2, name: '业余爱好者', minPoints: 100, privileges: ['basic', 'hide_content'] },
  { level: 3, name: '进阶摄影师', minPoints: 500, privileges: ['basic', 'hide_content', 'advanced_tools'] },
  { level: 4, name: '资深达人', minPoints: 1500, privileges: ['basic', 'hide_content', 'advanced_tools', 'double_points'] },
  { level: 5, name: '摄影大师', minPoints: 5000, privileges: ['basic', 'hide_content', 'advanced_tools', 'vip_tools', 'no_review'] },
  { level: 6, name: '传奇领袖', minPoints: 15000, privileges: ['all'] },
]

// 权限映射
export const privilegeMap = {
  'basic': '基础权限',
  'hide_content': '可发布隐藏内容',
  'advanced_tools': '解锁进阶工具',
  'vip_tools': '解锁高级工具',
  'double_points': '发帖积分翻倍',
  'no_review': '免审核',
}

// 根据积分获取等级
export function getLevel(points) {
  let level = levelConfig[0]
  for (const l of levelConfig) {
    if (points >= l.minPoints) {
      level = l
    }
  }
  return level
}

// 检查是否有某个权限
export function hasPrivilege(level, privilege) {
  const levelInfo = levelConfig.find(l => l.level === level)
  if (!levelInfo) return false
  if (levelInfo.privileges.includes('all')) return true
  return levelInfo.privileges.includes(privilege)
}
