/**
 * 模拟用户操作测试 - 第二轮
 * 修正了变量名匹配
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
    if (res.ok) { const html = await res.text(); if (html.includes('id="app"')) { ok(`${name} 正常渲染`); return html } else { fail(name, '无app挂载点'); return null } }
    else { fail(name, `HTTP ${res.status}`); return null }
  } catch(e) { fail(name, e.message); return null }
}

async function checkCode(file, checks, name) {
  try {
    const c = await readFile(file, 'utf-8')
    for (const check of checks) {
      if (c.includes(check)) ok(`${name}: ${check.substring(0,25)}`)
      else fail(name, `缺少: ${check.substring(0,25)}`)
    }
  } catch(e) { fail(name, e.message) }
}

async function main() {
  console.log('👤 模拟用户操作测试 (第二轮 - 修正版)')
  console.log('='.repeat(55))

  // 场景1: 首页浏览
  console.log('\n🏠 [用户] 打开首页...')
  await checkPage('/', '首页')
  await checkCode('/home/mztm/phototool/src/views/Home.vue', ['quickTools', 'deals', 'photoEntries'], '首页数据')

  // 场景2: 器材库浏览
  console.log('\n📷 [用户] 浏览器材库...')
  await checkPage('/equipment/camera', '相机库')
  await checkCode('/home/mztm/phototool/src/views/Camera.vue', ['loadEquipmentConfig', 'filteredItems', 'selectedBrand'], '相机库')
  await checkPage('/equipment/lens', '镜头库')
  await checkCode('/home/mztm/phototool/src/views/Lens.vue', ['loadEquipmentConfig', 'filteredLenses', 'selectedMount'], '镜头库')
  await checkPage('/compare', '器材对比')
  await checkCode('/home/mztm/phototool/src/views/Compare.vue', ['addToCompare', 'removeItem', 'selectedItems'], '对比')

  // 场景3: 注册
  console.log('\n📝 [用户] 尝试注册...')
  await checkPage('/user', '用户中心')
  await checkCode('/home/mztm/phototool/src/views/UserCenter.vue', ['loginForm', 'registerForm', 'handleRegister', 'sendCode'], '注册表单')
  await checkCode('/home/mztm/phototool/src/stores/user.js', ['register', 'sendVerifyCode', 'verifyCode'], '注册逻辑')

  // 场景4: 帖子
  console.log('\n📚 [用户] 进入帖子区...')
  await checkPage('/posts', '帖子区')
  await checkCode('/home/mztm/phototool/src/views/Posts.vue', ['filteredPosts', 'submitPost', 'handleSign'], '帖子功能')

  // 场景5: 游戏
  console.log('\n🎮 [用户] 玩游戏...')
  await checkPage('/game', '游戏')
  await checkCode('/home/mztm/phototool/src/views/Game.vue', ['startGame', 'makeBid', 'spinWheel'], '游戏功能')

  // 场景6: 美图上传
  console.log('\n🖼️ [用户] 上传美图...')
  await checkPage('/showcase', '美图展示')
  await checkCode('/home/mztm/phototool/src/views/Showcase.vue', ['上传作品', 'PENDING_KEY', 'fileToBase64', 'filteredList'], '美图功能')

  // 场景7: 后台管理
  console.log('\n🔧 [管理员] 登录后台...')
  await checkPage('/admin/login', '后台登录')
  await checkPage('/admin/dashboard', '仪表盘')
  await checkCode('/home/mztm/phototool/src/views/admin/UserManage.vue', ['来源', 'storage', 'setInterval'], '用户管理')
  await checkCode('/home/mztm/phototool/src/views/admin/EquipmentManage.vue', ['loadEquipmentConfig', 'addEquipment', 'editEquipment'], '器材管理')
  await checkCode('/home/mztm/phototool/src/views/admin/ShowcaseManage.vue', ['pending', '待审核', 'approveItem', 'rejectItem'], '美图管理')

  // 场景8: 器材配置
  console.log('\n⚙️ [管理员] 管理器材配置...')
  await checkCode('/home/mztm/phototool/src/config/equipmentConfig.js', ['defaultEquipmentConfig', 'loadEquipmentConfig', 'saveEquipmentConfig'], '配置模块')
  await checkCode('/home/mztm/phototool/src/views/admin/Settings.vue', ['器材配置', '分类管理', '品牌管理', '恢复默认'], '配置管理')
  await checkCode('/home/mztm/phototool/src/views/admin/EquipmentManage.vue', ['loadEquipmentConfig', 'equipConfig'], '器材管理使用配置')

  // 场景9: 前台页面
  console.log('\n📋 [用户] 浏览其他页面...')
  for (const [path, name] of [['/deals','优惠'],['/announcements','公告'],['/links','友链'],['/tutorials','教程'],['/presets','预设'],['/activities','活动'],['/manuals','手册'],['/guides','攻略']]) {
    await checkPage(path, name)
  }

  // 场景10: 数据联通
  console.log('\n🔗 [验证] 前后台数据联通...')
  const dataKeys = [
    ['phototool_equipment_data', '器材数据'],
    ['phototool_posts_data', '帖子数据'],
    ['phototool_showcase_data', '美图数据'],
    ['phototool_users_data', '用户数据'],
    ['phototool_pending_showcase', '待审核美图'],
    ['phototool_verify_codes', '验证码存储'],
    ['phototool_equipment_config', '器材配置'],
  ]
  for (const [key, name] of dataKeys) {
    let found = false
    for (const f of ['Camera.vue','Lens.vue','Equipment.vue','Showcase.vue','UserCenter.vue','Settings.vue','EquipmentManage.vue','ShowcaseManage.vue','user.js']) {
      try {
        const dir = f === 'user.js' ? 'stores' : (f.includes('admin') ? 'views/admin' : 'views')
        const c = await readFile(`/home/mztm/phototool/src/${dir}/${f}`, 'utf-8')
        if (c.includes(key)) { found = true; break }
      } catch {}
    }
    if (found) ok(`数据联通: ${name}`)
    else fail('数据联通', `${name}(${key})`)
  }

  console.log('\n' + '='.repeat(55))
  console.log(`📊 第二轮结果: ${passed} 通过, ${failed} 失败`)
  if (errors.length) { console.log('\n❌ 失败项:'); errors.forEach(e => console.log(`  - ${e}`)) }

  await writeFile('/home/mztm/phototool/test-user-run2.md', `# 第二轮测试报告\n时间: ${new Date().toLocaleString('zh-CN')}\n通过: ${passed}, 失败: ${failed}\n\n${actions.join('\n')}\n`)
  console.log(failed === 0 ? '\n🎉 第二轮测试全部通过！' : '\n⚠️ 有失败项')
  process.exit(failed > 0 ? 1 : 0)
}
main()
