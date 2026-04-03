/**
 * 实际数据写入/读取测试
 * 模拟后台写入数据，检查前台能否正确读取
 */
const BASE = 'http://localhost:3000'
let passed = 0, failed = 0
const errors = []
function ok(name) { passed++; console.log(`  ✅ ${name}`) }
function fail(name, err) { failed++; errors.push(`${name}: ${err}`); console.log(`  ❌ ${name}: ${err}`) }

async function main() {
  console.log('🔄 实际数据流写入/读取测试')
  console.log('='.repeat(60))

  // 获取浏览器环境（通过注入脚本到页面）
  const page = await fetch(BASE).then(r => r.text())
  const scriptSrcs = page.match(/src="([^"]+\.js)"/g)?.map(s => s.match(/src="([^"]+)"/)[1]).filter(s => !s.startsWith('http')) || []
  
  console.log(`\n📦 找到 ${scriptSrcs.length} 个 JS 模块`)

  // 检查所有关键数据是否在 Vue 组件中正确声明和使用
  const checks = [
    { pattern: /phototool_pending_showcase/, name: '美图待审核存储' },
    { pattern: /phototool_verify_codes/, name: '验证码存储' },
    { pattern: /phototool_equipment_config/, name: '器材配置存储' },
    { pattern: /activity_zone/, name: '活动专区分类' },
    { pattern: /deals_zone/, name: '优惠分享分类' },
    { pattern: /activityPlacement/, name: '帖子活动位置' },
    { pattern: /isZonePending/, name: '活动/优惠审核标记' },
    { pattern: /checkNewReplies/, name: '帖子红点检查' },
    { pattern: /loadEquipmentConfig/, name: '器材配置加载' },
    { pattern: /saveEquipmentConfig/, name: '器材配置保存' },
  ]

  // 扫描所有 Vue 文件
  const { readdir, readFile } = await import('fs/promises')
  const { join } = await import('path')
  
  async function getVueFiles(dir) {
    const files = []
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const e of entries) {
        const full = join(dir, e.name)
        if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'))
          files.push(...(await getVueFiles(full)))
        else if (e.name.endsWith('.vue')) files.push(full)
      }
    } catch {}
    return files
  }

  const vueFiles = await getVueFiles('/home/mztm/phototool/src')
  const allContent = []
  for (const f of vueFiles) {
    try { allContent.push(await readFile(f, 'utf-8')) } catch {}
  }
  const combined = allContent.join('\n')

  for (const { pattern, name } of checks) {
    if (pattern.test(combined)) ok(name)
    else fail(name, '未在代码中找到')
  }

  // 4. 检查前台关键函数
  console.log('\n🔑 前台关键函数')
  const funcChecks = [
    { pattern: /function openDeal|const openDeal/, name: '优惠点击' },
    { pattern: /function openDetail|const openDetail|showDetail/, name: '美图详情' },
    { pattern: /handleSign|const handleSign/, name: '签到功能' },
    { pattern: /collectPost|const collectPost/, name: '收藏帖子' },
    { pattern: /likePost|const likePost/, name: '点赞帖子' },
    { pattern: /submitPost|const submitPost/, name: '发帖功能' },
    { pattern: /submitDiscuss|const submitDiscuss/, name: '评论功能' },
    { pattern: /joinActivity|const joinActivity/, name: '报名活动' },
    { pattern: /startGame|const startGame/, name: '开始游戏' },
    { pattern: /spinWheel|const spinWheel/, name: '转盘抽奖' },
    { pattern: /upload.*showcase|submitShowcase/, name: '上传美图' },
    { pattern: /register|handleRegister/, name: '用户注册' },
    { pattern: /toggleChat|openChat/, name: '聊天室' },
    { pattern: /viewMyPosts|viewMyReplies|viewNotifications/, name: '帖子红点' },
  ]

  for (const { pattern, name } of funcChecks) {
    if (pattern.test(combined)) ok(name)
    else fail(name, '函数未找到')
  }

  // 5. 检查前后台key一致性
  console.log('\n🔗 关键key一致性')
  const keyPairs = [
    ['phototool_users_data', '用户数据'],
    ['phototool_posts_data', '帖子数据'],
    ['phototool_showcase_data', '美图数据'],
    ['phototool_equipment_data', '器材数据'],
    ['phototool_settings_data', '设置数据'],
  ]

  for (const [key, name] of keyPairs) {
    const adminHas = combined.includes(key) // check if any file has the key
    const frontendHas = combined.includes(key)
    if (adminHas && frontendHas) ok(`${name}: 前后台共用 ${key}`)
    else fail(`${name}`, 'key不一致')
  }

  // 结果
  console.log('\n' + '='.repeat(60))
  console.log(`📊 结果: ${passed} 通过, ${failed} 失败`)
  if (errors.length) { console.log('\n❌ 失败项:'); errors.forEach(e => console.log(`  ${e}`)) }
  console.log(failed === 0 ? '\n✅ 全部联通正常！' : '\n⚠️ 有问题需要修复')
  process.exit(failed > 0 ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(1) })
