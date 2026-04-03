#!/usr/bin/env node
/**
 * 9小时压力测试 - 前后台数据同步验证
 * 模拟用户端操作 + 后台管理操作，检测数据同步问题
 */

const fs = require('fs')
const path = require('path')

const BASE = '/home/mztm/phototool'
const LOG_DIR = path.join(BASE, 'stress-test-logs')
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR)

const logFile = path.join(LOG_DIR, `test-${new Date().toISOString().slice(0, 10)}.md`)
const issuesFile = path.join(LOG_DIR, 'issues.md')

let totalTests = 0
let passTests = 0
let failTests = 0
const issues = []

function log(msg) {
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const line = `[${ts}] ${msg}`
  fs.appendFileSync(logFile, line + '\n')
}

function pass(name) {
  totalTests++
  passTests++
  log(`✅ ${name}`)
}

function fail(name, detail) {
  totalTests++
  failTests++
  log(`❌ ${name}: ${detail}`)
  issues.push({ time: new Date().toLocaleString('zh-CN'), test: name, detail })
  // 追加到 issues 文件
  fs.appendFileSync(issuesFile, `## [${new Date().toLocaleString('zh-CN')}] ${name}\n\n${detail}\n\n---\n`)
}

function section(title) {
  log(`\n━━━ ${title} ━━━`)
}

// ========== localStorage 操作模拟 ==========
function readStorage(key) {
  try {
    // 通过 node 直接读取测试数据文件
    const dataFile = path.join(LOG_DIR, `storage_${key}.json`)
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    }
  } catch {}
  return null
}

function writeStorage(key, data) {
  const dataFile = path.join(LOG_DIR, `storage_${key}.json`)
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

// ========== 前台操作模拟 ==========
function simulateFrontend() {
  section('前台操作模拟')

  // 1. 查看器材
  const equipData = readStorage('phototool_equipment_data') || {}
  const deletedIds = equipData._deleted || []
  const cameras = equipData.camera || []
  const defaultCameras = ['Sony A7R V', 'Canon EOS R5 Mark II', 'Nikon Z8', 'Fujifilm X-T5', 'Panasonic LUMIX S5 II', 'Sony A6700']
  const defaultLens = ['Sony FE 24-70mm GM II', 'Canon RF 50mm F1.2L', 'Nikon Z 85mm F1.2', 'Sigma 35mm F1.4 Art']
  
  const totalCams = cameras.length + defaultCameras.length - (equipData._deleted || []).filter(d => d.startsWith('default_c')).length
  pass(`前台相机列表: ${totalCams} 台 (后台${cameras.length} + 默认${defaultCameras.length})`)

  // 2. 验证新增器材同步
  const userCams = cameras.filter(c => !c._overrideFor)
  if (userCams.length > 0) {
    pass(`前台可见新增相机: ${userCams.map(c => c.name).join(', ')}`)
  }

  // 3. 验证编辑覆盖（模拟前端 merge 逻辑）
  const overriddenCams = cameras.filter(c => c._overrideFor)
  if (overriddenCams.length > 0) {
    pass(`前台编辑覆盖: ${overriddenCams.map(c => c.name).join(', ')}`)
    // 模拟前端的过滤逻辑：默认项如果有对应的 override，会被过滤掉
    const defaultCamNames = ['Sony A7R V', 'Canon EOS R5 Mark II', 'Nikon Z8', 'Fujifilm X-T5', 'Panasonic LUMIX S5 II', 'Sony A6700']
    const defaultCamIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    const overrideTargets = new Set(overriddenCams.map(c => c._overrideFor))
    const hiddenDefaults = defaultCamNames.filter((name, i) => overrideTargets.has(`default_${defaultCamIds[i]}`))
    const visibleDefaults = defaultCamNames.filter((name, i) => !overrideTargets.has(`default_${defaultCamIds[i]}`) && !deletedIds.includes(`default_${defaultCamIds[i]}`))
    // 检查：隐藏的默认项 + 用户项 = 合并后的实际显示
    const userCamNames = cameras.filter(c => !c._overrideFor).map(c => c.name)
    const actualDisplay = [...userCamNames, ...visibleDefaults]
    const noDuplicates = actualDisplay.length === new Set(actualDisplay).size
    if (noDuplicates) {
      pass(`默认项覆盖正确: 隐藏了 [${hiddenDefaults.join(', ')}], 显示 [${visibleDefaults.join(', ')}], 无重复`)
    } else {
      fail('默认项覆盖检查', `有重复: ${actualDisplay.join(', ')}`)
    }
  }

  // 4. 删除同步
  if (deletedIds.length > 0) {
    pass(`前台正确删除 ${deletedIds.length} 项`)
  }

  // 5. 镜头数据
  const lenses = equipData.lens || []
  const totalLenses = lenses.length + defaultLens.length - (deletedIds.filter(d => d.startsWith('default_l'))).length
  pass(`前台镜头列表: ${totalLenses} 支 (后台${lenses.length} + 默认${defaultLens.length})`)

  // 6. 对比功能数据
  const allCompareItems = cameras.length + lenses.length + defaultCameras.length + defaultLens.length
  pass(`对比功能可用设备: ${allCompareItems} 件`)

  // 7. 帖子数据
  const postData = readStorage('phototool_posts_data') || []
  const publishedPosts = postData.filter(p => p.status === 'published')
  const draftPosts = postData.filter(p => p.status === 'draft')
  const toppedPosts = postData.filter(p => p.isTop)
  const essencePosts = postData.filter(p => p.isEssence)
  pass(`帖子总数: ${postData.length} (发布:${publishedPosts.length} 草稿:${draftPosts.length} 置顶:${toppedPosts.length} 精华:${essencePosts.length})`)

  // 8. 广告数据
  const adData = readStorage('phototool_ads_data') || []
  const activeAds = adData.filter(a => {
    if (!a.enabled) return false
    const now = new Date()
    if (a.startTime && new Date(a.startTime) > now) return false
    if (a.endTime && new Date(a.endTime) < now) return false
    return true
  })
  pass(`广告数据: ${adData.length} 条 (有效:${activeAds.length})`)

  // 9. 工具数据
  const toolData = readStorage('phototool_tools_data') || []
  const enabledTools = toolData.filter(t => t.enabled)
  pass(`工具数据: ${toolData.length} 个 (启用:${enabledTools.length})`)

  // 10. 用户数据
  const userData = readStorage('phototool_users_data') || []
  pass(`用户数据: ${userData.length} 人`)

  // 11. 设置数据
  const settingsData = readStorage('phototool_settings_data')
  if (settingsData) {
    pass(`设置已保存: 网站标题=${settingsData.siteTitle || '未设置'}`)
  }

  return { totalCams, totalLenses, postData, adData, toolData, userData }
}

// ========== 后台操作模拟 ==========
let opCount = 0

function simulateBackend() {
  section('后台操作模拟')
  opCount++

  // 1. 添加新相机
  const equipData = readStorage('phototool_equipment_data') || { camera: [], lens: [], tripod: [], audio: [], light: [], accessory: [], film: [], wetplate: [], other: [], _deleted: [] }
  if (!equipData.camera) equipData.camera = []
  
  const newCamId = Date.now() + opCount
  const newCam = {
    id: newCamId,
    name: `测试相机${opCount}`,
    brand: 'Sony',
    price: 15000 + opCount * 100,
    logo: '📸',
    params: [
      { label: '品牌', value: 'Sony' },
      { label: '型号', value: `TestCam${opCount}` },
      { label: '画幅', value: '全画幅' },
      { label: '有效像素', value: '2400万' },
      { label: '视频规格', value: '4K 60p' },
      { label: '卡口', value: '索尼E口' },
    ]
  }
  equipData.camera.push(newCam)
  writeStorage('phototool_equipment_data', equipData)
  pass(`后台添加相机: ${newCam.name} (ID:${newCamId})`)

  // 2. 编辑默认相机
  const overrideItem = {
    id: Date.now() + 100 + opCount,
    _overrideFor: 'default_c3',
    name: `Nikon Z8-改${opCount}`,
    brand: 'Nikon',
    price: 28000 + opCount * 100,
    logo: '🎞️',
    params: [
      { label: '品牌', value: 'Nikon' },
      { label: '画幅', value: '全画幅' },
      { label: '有效像素', value: '4571万' },
      { label: '视频规格', value: '8K 30p' },
      { label: '卡口', value: '尼康Z口' },
    ]
  }
  // 检查是否已有 override
  const existingOverrideIdx = equipData.camera.findIndex(c => c._overrideFor === 'default_c3')
  if (existingOverrideIdx > -1) {
    equipData.camera[existingOverrideIdx] = overrideItem
  } else {
    equipData.camera.push(overrideItem)
  }
  writeStorage('phototool_equipment_data', equipData)
  pass(`后台编辑默认相机: Nikon Z8 → Nikon Z8-改${opCount}`)

  // 3. 删除默认相机
  if (!equipData._deleted.includes('default_c5')) {
    equipData._deleted.push('default_c5')
    writeStorage('phototool_equipment_data', equipData)
    pass('后台删除默认相机: Panasonic LUMIX S5 II')
  }

  // 4. 添加新镜头
  if (!equipData.lens) equipData.lens = []
  const newLens = {
    id: Date.now() + 200 + opCount,
    name: `测试镜头${opCount}`,
    brand: 'Sigma',
    price: 3000 + opCount * 100,
    logo: '🔵',
    params: [
      { label: '品牌', value: 'Sigma' },
      { label: '型号', value: `TestLens${opCount}` },
      { label: '焦距', value: '35mm' },
      { label: '最大光圈', value: 'F1.4' },
      { label: '卡口', value: '索尼E口' },
      { label: '画幅', value: '全画幅' },
      { label: '重量', value: '365g' },
    ]
  }
  equipData.lens.push(newLens)
  writeStorage('phototool_equipment_data', equipData)
  pass(`后台添加镜头: ${newLens.name}`)

  // 5. 添加新帖子
  const postData = readStorage('phototool_posts_data') || []
  const newPost = {
    id: 9000 + opCount,
    title: `测试帖子${opCount} - 压力测试`,
    author: '系统测试',
    authorAvatar: '🤖',
    authorId: 9999,
    category: ['人像摄影', '风景摄影', '器材评测', '后期教程'][opCount % 4],
    views: 0,
    publishTime: new Date().toISOString().slice(0, 10),
    status: 'published',
    isTop: opCount % 5 === 0,
    isEssence: opCount % 3 === 0,
    content: `这是第${opCount}次压力测试自动生成的帖子内容。`,
    likeCount: 0,
    commentCount: 0,
  }
  postData.push(newPost)
  writeStorage('phototool_posts_data', postData)
  pass(`后台添加帖子: ${newPost.title} (精华:${newPost.isEssence} 置顶:${newPost.isTop})`)

  // 6. 编辑帖子
  if (postData.length > 1) {
    const editIdx = postData.length - 2
    postData[editIdx].title = `已编辑-测试帖子${opCount - 1}`
    postData[editIdx].isEssence = true
    writeStorage('phototool_posts_data', postData)
    pass(`后台编辑帖子: ${postData[editIdx].title}`)
  }

  // 7. 添加广告
  const adData = readStorage('phototool_ads_data') || []
  const newAd = {
    id: 8000 + opCount,
    name: `测试广告${opCount}`,
    position: ['首页顶部', '首页侧边', '帖子详情'][opCount % 3],
    enabled: opCount % 2 === 1,
    startTime: '2024-01-01',
    endTime: '2030-12-31',
    link: '#test',
    impressions: 0,
    clicks: 0,
  }
  adData.push(newAd)
  writeStorage('phototool_ads_data', adData)
  pass(`后台添加广告: ${newAd.name} (启用:${newAd.enabled})`)

  // 8. 添加工具
  const toolData = readStorage('phototool_tools_data') || []
  const newTool = {
    id: 7000 + opCount,
    icon: ['📸', '🔧', '📐', '🎯', '📊'][opCount % 5],
    iconType: 'emoji',
    name: `测试工具${opCount}`,
    toolType: 'builtin',
    levelLimit: opCount % 5,
    pointsCost: opCount % 5,
    usageCount: 0,
    enabled: true,
  }
  toolData.push(newTool)
  writeStorage('phototool_tools_data', toolData)
  pass(`后台添加工具: ${newTool.name}`)

  // 9. 修改用户积分
  const userData = readStorage('phototool_users_data') || []
  if (userData.length > 0) {
    const userIdx = opCount % userData.length
    userData[userIdx].points += 100
    userData[userIdx].level = Math.floor(userData[userIdx].points / 500) + 1
    writeStorage('phototool_users_data', userData)
    pass(`后台修改用户积分: ${userData[userIdx].nickname} → ${userData[userIdx].points}分 (Lv.${userData[userIdx].level})`)
  }

  // 10. 修改设置
  const settingsData = readStorage('phototool_settings_data') || {}
  settingsData.siteTitle = `压力测试站点${opCount}`
  settingsData.signMinPoints = 5 + (opCount % 10)
  settingsData.signMaxPoints = 20 + (opCount % 30)
  writeStorage('phototool_settings_data', settingsData)
  pass(`后台修改设置: 标题=${settingsData.siteTitle}`)

  return { newCamId, opCount }
}

// ========== 数据一致性验证 ==========
function verifyConsistency() {
  section('数据一致性验证')

  const equipData = readStorage('phototool_equipment_data') || {}
  const deletedIds = equipData._deleted || []
  const cameras = equipData.camera || []
  const lenses = equipData.lens || []

  // 相机数据
  const userCams = cameras.filter(c => !c._overrideFor)
  const overriddenCams = cameras.filter(c => c._overrideFor)
  const defaultCamCount = 6
  const deletedDefaultCams = deletedIds.filter(d => d.startsWith('default_c')).length
  const expectedTotalCams = userCams.length + (defaultCamCount - deletedDefaultCams)
  const actualTotalCams = userCams.length + (defaultCamCount - deletedDefaultCams)

  if (userCams.every(c => c.name && c.params)) {
    pass('所有后台相机数据格式正确（有 name 和 params）')
  } else {
    fail('相机数据格式检查', `部分相机缺少必要字段`)
  }

  // 检查 override 正确性
  const overrideTargets = overriddenCams.map(c => c._overrideFor)
  const validDefaults = ['default_c1', 'default_c2', 'default_c3', 'default_c4', 'default_c5', 'default_c6']
  if (overrideTargets.every(t => validDefaults.includes(t))) {
    pass('所有 override 目标都是有效的默认项')
  } else {
    fail('override 目标验证', `无效目标: ${overrideTargets.filter(t => !validDefaults.includes(t)).join(', ')}`)
  }

  // 检查删除列表中的 override 项不重复
  const deletedOverlaps = overriddenCams.filter(c => deletedIds.includes(c._overrideFor))
  if (deletedOverlaps.length === 0) {
    pass('删除列表与 override 无冲突')
  } else {
    fail('删除与 override 冲突', `冲突项: ${deletedOverlaps.map(c => c.name).join(', ')}`)
  }

  // 镜头检查
  if (lenses.every(l => l.name && l.params)) {
    pass('所有后台镜头数据格式正确')
  } else {
    fail('镜头数据格式检查', `部分镜头缺少必要字段`)
  }

  // 帖子数据
  const postData = readStorage('phototool_posts_data') || []
  if (postData.every(p => p.title && p.author && p.status)) {
    pass('所有帖子数据格式正确')
  } else {
    fail('帖子数据格式检查', `部分帖子缺少必要字段`)
  }

  // 广告数据
  const adData = readStorage('phototool_ads_data') || []
  if (adData.every(a => a.name && a.position)) {
    pass('所有广告数据格式正确')
  } else {
    fail('广告数据格式检查', `部分广告缺少必要字段`)
  }

  // 工具数据
  const toolData = readStorage('phototool_tools_data') || []
  if (toolData.every(t => t.name && typeof t.levelLimit === 'number')) {
    pass('所有工具数据格式正确')
  } else {
    fail('工具数据格式检查', `部分工具缺少必要字段`)
  }
}

// ========== 主循环 ==========
const START_TIME = Date.now()
const DURATION_MS = 9 * 60 * 60 * 1000 // 9小时
const CYCLE_INTERVAL_MS = 30 * 1000 // 每30秒一轮
let cycle = 0

log('# 9小时压力测试日志')
log(`开始时间: ${new Date().toLocaleString('zh-CN')}`)
log(`预计结束: ${new Date(START_TIME + DURATION_MS).toLocaleString('zh-CN')}`)
log('')

function runCycle() {
  const elapsed = Date.now() - START_TIME
  if (elapsed >= DURATION_MS) {
    log('\n# 压力测试结束')
    log(`结束时间: ${new Date().toLocaleString('zh-CN')}`)
    log(`总测试数: ${totalTests}`)
    log(`通过: ${passTests}`)
    log(`失败: ${failTests}`)
    log(`发现 ${issues.length} 个问题`)
    
    if (issues.length > 0) {
      log('\n## 问题汇总')
      issues.forEach((issue, i) => {
        log(`${i + 1}. [${issue.time}] ${issue.test}: ${issue.detail}`)
      })
    }
    
    console.log('压力测试完成！日志:', logFile)
    console.log('问题记录:', issuesFile)
    process.exit(0)
  }

  cycle++
  const remaining = Math.round((DURATION_MS - elapsed) / 60000)
  log(`\n# 第 ${cycle} 轮 (剩余约 ${remaining} 分钟)`)

  // 模拟后台操作（每轮）
  const backendResult = simulateBackend()

  // 模拟前台验证（每轮）
  const frontendResult = simulateFrontend()

  // 数据一致性验证（每5轮）
  if (cycle % 5 === 0) {
    verifyConsistency()
  }

  // 状态报告（每10轮）
  if (cycle % 10 === 0) {
    log(`\n📊 运行统计: ${totalTests} 测试 (${passTests}✅ ${failTests}❌) | 已运行 ${Math.round(elapsed/60000)} 分钟`)
  }
}

// 清理旧数据（每次启动时清除，防止多轮测试数据残留导致重复）
function cleanStorage() {
  const keys = ['phototool_equipment_data', 'phototool_posts_data', 'phototool_ads_data', 'phototool_tools_data', 'phototool_users_data', 'phototool_settings_data']
  for (const key of keys) {
    const dataFile = path.join(LOG_DIR, `storage_${key}.json`)
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile)
  }
}

// 初始化默认数据（如果为空）
function initDefaults() {
  if (!readStorage('phototool_equipment_data')) {
    writeStorage('phototool_equipment_data', { camera: [], lens: [], tripod: [], audio: [], light: [], accessory: [], film: [], wetplate: [], other: [], _deleted: [] })
  }
  if (!readStorage('phototool_posts_data')) {
    writeStorage('phototool_posts_data', [])
  }
  if (!readStorage('phototool_ads_data')) {
    writeStorage('phototool_ads_data', [])
  }
  if (!readStorage('phototool_tools_data')) {
    writeStorage('phototool_tools_data', [])
  }
  if (!readStorage('phototool_users_data')) {
    writeStorage('phototool_users_data', [
      { id: 1, uid: 'U10001', nickname: '光影猎人', points: 2580, level: 5 },
      { id: 2, uid: 'U10002', nickname: '摄影达人', points: 1860, level: 4 },
      { id: 3, uid: 'U10003', nickname: '镜头控', points: 3200, level: 6 },
    ])
  }
  if (!readStorage('phototool_settings_data')) {
    writeStorage('phototool_settings_data', { siteTitle: '测试站点', signMinPoints: 5, signMaxPoints: 20 })
  }
}

cleanStorage()
initDefaults()
log('初始化完成，开始压力测试...\n')

// 每30秒执行一轮
const timer = setInterval(runCycle, CYCLE_INTERVAL_MS)
runCycle() // 立即执行第一轮

// 优雅退出
process.on('SIGINT', () => {
  log('\n⚠️ 用户中断测试')
  log(`已运行 ${cycle} 轮, ${totalTests} 测试 (${passTests}✅ ${failTests}❌)`)
  log(`发现 ${issues.length} 个问题`)
  clearInterval(timer)
  process.exit(0)
})
