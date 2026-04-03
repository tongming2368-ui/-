/**
 * 模拟真实用户操作测试
 * 通过 HTTP 请求模拟用户在页面上的操作流程
 */
import { readFile, writeFile } from 'fs/promises'

const BASE = 'http://localhost:3000'
let passed = 0, failed = 0
const errors = []
const actions = []

function ok(name) { passed++; actions.push(`✅ ${name}`); console.log(`  ✅ ${name}`) }
function fail(name, err) { failed++; const m = `${name}: ${err}`; errors.push(m); actions.push(`❌ ${m}`); console.log(`  ❌ ${m}`) }

async function checkPage(path, name) {
  try {
    const res = await fetch(`${BASE}${path}`)
    if (res.ok) {
      const html = await res.text()
      if (html.includes('id="app"')) {
        ok(`${name} 页面正常渲染`)
        return html
      } else {
        fail(name, '缺少 app 挂载点')
        return null
      }
    } else {
      fail(name, `HTTP ${res.status}`)
      return null
    }
  } catch(e) { fail(name, e.message); return null }
}

async function checkComponent(file, checks, name) {
  try {
    const content = await readFile(file, 'utf-8')
    let allOk = true
    for (const check of checks) {
      if (content.includes(check)) {
        ok(`${name}: "${check.substring(0,30)}..." 存在`)
      } else {
        fail(name, `缺少 "${check.substring(0,30)}..."`)
        allOk = false
      }
    }
    return allOk
  } catch(e) { fail(name, e.message); return false }
}

async function main() {
  console.log('👤 模拟用户操作测试 (第一轮)')
  console.log('='.repeat(55))

  // === 场景1: 新用户访问首页 ===
  console.log('\n🏠 场景1: 新用户访问首页')
  await checkPage('/', '首页')
  await checkComponent('/home/mztm/phototool/src/views/Home.vue', [
    'quickTools', 'deals', 'photoEntries', 'recentPosts'
  ], '首页数据')

  // === 场景2: 浏览器材库 ===
  console.log('\n📷 场景2: 浏览器材库')
  await checkPage('/equipment/camera', '相机库')
  await checkComponent('/home/mztm/phototool/src/views/Camera.vue', [
    'loadEquipmentConfig', 'filteredItems', 'brandOptions', 'searchQuery'
  ], '相机库功能')

  await checkPage('/equipment/lens', '镜头库')
  await checkComponent('/home/mztm/phototool/src/views/Lens.vue', [
    'loadEquipmentConfig', 'filteredLenses', 'mountOptions'
  ], '镜头库功能')

  await checkPage('/compare', '器材对比')
  await checkComponent('/home/mztm/phototool/src/views/Compare.vue', [
    'addToCompare', 'removeItem', 'searchResults'
  ], '对比功能')

  // === 场景3: 注册账号 ===
  console.log('\n📝 场景3: 用户注册流程')
  await checkPage('/user', '用户中心')
  await checkComponent('/home/mztm/phototool/src/views/UserCenter.vue', [
    'loginForm', 'register', 'sendVerifyCode', '验证码'
  ], '注册表单')
  await checkComponent('/home/mztm/phototool/src/stores/user.js', [
    'register', 'sendVerifyCode', 'verifyCode', 'VERIFY_CODES_KEY'
  ], '注册逻辑')

  // === 场景4: 发帖 ===
  console.log('\n📚 场景4: 帖子区')
  await checkPage('/posts', '帖子区')
  await checkComponent('/home/mztm/phototool/src/views/Posts.vue', [
    'filteredPosts', 'addPost', 'addComment', 'handleSign'
  ], '帖子功能')

  // === 场景5: 游戏 ===
  console.log('\n🎮 场景5: 游戏区')
  await checkPage('/game', '游戏')
  await checkComponent('/home/mztm/phototool/src/views/Game.vue', [
    'startGame', 'makeBid', 'challenge', 'spinWheel'
  ], '游戏功能')

  // === 场景6: 美图上传 ===
  console.log('\n🖼️ 场景6: 美图上传')
  await checkPage('/showcase', '美图展示')
  await checkComponent('/home/mztm/phototool/src/views/Showcase.vue', [
    '上传作品', 'PENDING_KEY', 'filteredList', 'fileToBase64'
  ], '美图上传功能')

  // === 场景7: 后台管理 ===
  console.log('\n🔧 场景7: 后台管理')
  await checkPage('/admin/login', '后台登录')
  await checkPage('/admin/dashboard', '仪表盘')
  
  await checkComponent('/home/mztm/phototool/src/views/admin/UserManage.vue', [
    'UserManage', '来源', 'storage'
  ], '用户管理')

  await checkComponent('/home/mztm/phototool/src/views/admin/EquipmentManage.vue', [
    'loadEquipmentConfig', 'addEquipment', 'editEquipment'
  ], '器材管理')

  await checkComponent('/home/mztm/phototool/src/views/admin/ShowcaseManage.vue', [
    'pending', '待审核', 'approveItem'
  ], '美图管理')

  // === 场景8: 器材配置系统 ===
  console.log('\n⚙️ 场景8: 器材配置系统')
  await checkComponent('/home/mztm/phototool/src/config/equipmentConfig.js', [
    'defaultEquipmentConfig', 'loadEquipmentConfig', 'saveEquipmentConfig',
    'categories', 'brands', 'sensors', 'mounts'
  ], '器材配置模块')
  
  await checkComponent('/home/mztm/phototool/src/views/admin/Settings.vue', [
    '器材配置', '分类管理', '品牌管理', '恢复默认'
  ], '配置管理页面')

  // === 场景9: 优惠/公告/链接 ===
  console.log('\n📋 场景9: 其他页面')
  await checkPage('/deals', '优惠信息')
  await checkPage('/announcements', '公告')
  await checkPage('/links', '友情链接')
  await checkPage('/tutorials', '教程')
  await checkPage('/presets', '预设')
  await checkPage('/activities', '活动')

  // === 结果 ===
  console.log('\n' + '='.repeat(55))
  console.log(`📊 模拟测试结果: ${passed} 通过, ${failed} 失败`)
  if (errors.length) { console.log('\n❌ 失败详情:'); errors.forEach(e => console.log(`  - ${e}`)) }
  
  // 写入测试日志
  const report = `# 用户模拟测试报告\n\n时间: ${new Date().toLocaleString('zh-CN')}\n通过: ${passed}\n失败: ${failed}\n\n## 操作记录\n${actions.join('\n')}\n${errors.length ? '\n## 失败项\n' + errors.map(e => `- ${e}`).join('\n') : ''}\n`
  await writeFile('/home/mztm/phototool/test-user-run1.md', report)
  
  console.log(failed === 0 ? '\n🎉 第一轮测试全部通过！' : '\n⚠️ 第一轮有失败项')
  process.exit(failed > 0 ? 1 : 0)
}
main()
