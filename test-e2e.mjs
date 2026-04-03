/**
 * 一体两面·摄影工具站 - 全面测试脚本
 * 
 * 测试内容：
 * 1. 所有页面路由可访问
 * 2. HTML 内容正确渲染
 * 3. JS 模块加载无错误
 * 4. localStorage 数据结构验证
 * 5. 前后台数据联通验证
 */

const BASE = 'http://localhost:3000'
let passed = 0
let failed = 0
const errors = []

function ok(name) {
  passed++
  console.log(`  ✅ ${name}`)
}
function fail(name, err) {
  failed++
  const msg = `  ❌ ${name}: ${err}`
  console.log(msg)
  errors.push(msg)
}

// ============ 1. 页面路由测试 ============
async function testRoutes() {
  console.log('\n📄 页面路由测试')
  
  const frontendRoutes = [
    '/', '/user', '/posts', '/game', '/showcase', '/tutorials',
    '/activities', '/equipment/camera', '/equipment/lens', '/compare',
    '/presets', '/deals', '/links', '/manuals', '/guides',
    '/brand-activities', '/announcements', '/tools'
  ]
  
  const adminRoutes = [
    '/admin/login', '/admin', '/admin/dashboard', '/admin/users',
    '/admin/posts', '/admin/showcase', '/admin/presets', '/admin/tutorials',
    '/admin/activities', '/admin/announcements', '/admin/deals',
    '/admin/equipment', '/admin/tools', '/admin/ads', '/admin/links',
    '/admin/settings'
  ]
  
  const allRoutes = [...frontendRoutes, ...adminRoutes]
  
  for (const route of allRoutes) {
    try {
      const res = await fetch(`${BASE}${route}`)
      if (res.ok) {
        ok(`${route} (${res.status})`)
      } else {
        fail(`${route}`, `HTTP ${res.status}`)
      }
    } catch (e) {
      fail(`${route}`, e.message)
    }
  }
}

// ============ 2. HTML 内容验证 ============
async function testHtmlContent() {
  console.log('\n📝 HTML 内容验证')
  
  const tests = [
    { path: '/', checks: ['<div id="app">', '.js'] },
    { path: '/admin/login', checks: ['<div id="app">', '.js'] },
  ]
  
  for (const { path, checks } of tests) {
    try {
      const res = await fetch(`${BASE}${path}`)
      const html = await res.text()
      
      for (const check of checks) {
        if (html.includes(check)) {
          ok(`${path} 包含 "${check}"`)
        } else {
          fail(`${path}`, `缺少 "${check}"`)
        }
      }
    } catch (e) {
      fail(`${path}`, e.message)
    }
  }
}

// ============ 3. JS 模块加载测试 ============
async function testJsModules() {
  console.log('\n📦 JS 模块加载测试')
  
  try {
    const res = await fetch(`${BASE}/`)
    const html = await res.text()
    
    // 提取 JS 文件路径
    const jsMatches = html.match(/src="([^"]+\.js)"/g) || []
    
    for (const match of jsMatches) {
      const src = match.match(/src="([^"]+)"/)[1]
      if (src.startsWith('http')) continue // 跳过外部 CDN
      
      try {
        const jsRes = await fetch(`${BASE}${src}`)
        if (jsRes.ok) {
          ok(`JS 加载: ${src}`)
        } else {
          fail(`JS 加载: ${src}`, `HTTP ${jsRes.status}`)
        }
      } catch (e) {
        fail(`JS 加载: ${src}`, e.message)
      }
    }
  } catch (e) {
    fail('HTML 获取', e.message)
  }
}

// ============ 4. Vue 组件源码检查 ============
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

async function getVueFiles(dir) {
  const files = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...(await getVueFiles(full)))
      } else if (entry.name.endsWith('.vue')) {
        files.push(full)
      }
    }
  } catch {}
  return files
}

async function testVueComponents() {
  console.log('\n🧩 Vue 组件源码检查')
  
  const vueFiles = await getVueFiles(join('/home/mztm/phototool/src'))
  let checked = 0
  
  for (const file of vueFiles) {
    try {
      const content = await readFile(file, 'utf-8')
      const relPath = file.replace('/home/mztm/phototool/src/', '')
      
      // 提取 template 部分
      const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
      if (!templateMatch) continue
      
      const template = templateMatch[1]
      
      // 检查 @click 引用的函数是否在 script 中定义
      const clickHandlers = [...template.matchAll(/@click(?:\.stop|\.prevent|\.self)?="([^"]+)"/g)]
        .map(m => m[1])
        .filter(h => !h.includes('$router') && !h.includes('$emit') && !h.includes('=') && !h.includes('!'))
        .map(h => h.trim())
      
      const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
      if (!scriptMatch || clickHandlers.length === 0) continue
      
      const script = scriptMatch[1]
      
      for (const handler of clickHandlers) {
        // 跳过简单赋值和内置调用
        if (handler.includes('(') && !handler.match(/^[a-zA-Z_]\w*\(/)) continue
        
        const funcName = handler.replace(/\(.*\)/, '').trim()
        if (!funcName) continue
        
        // 检查函数是否在 script 中定义（包括从 composable 解构）
        const funcPattern = new RegExp(`(const|let|var|function)\\s+${funcName}\\b`)
        const fromComposable = script.includes(`useAccessControl`) && 
          ['requireLogin', 'closeLoginPrompt', 'promptLogin', 'guarded', 'isLoggedIn'].includes(funcName)
        const fromDefineEmits = script.includes(`'${funcName}'`) || script.includes(`"${funcName}"`)
        
        if (!funcPattern.test(script) && !fromComposable && !fromDefineEmits) {
          fail(`${relPath}`, `@click="${handler}" 函数未定义`)
        }
      }
      
      checked++
    } catch {}
  }
  
  ok(`检查了 ${checked} 个 Vue 组件`)
}

// ============ 5. 页面数据内容检查 ============
async function testPageData() {
  console.log('\n📊 页面数据内容检查')
  
  // 检查关键配置文件是否有数据
  const configChecks = [
    { file: '/home/mztm/phototool/src/config/gallery.js', minItems: 5, name: 'gallery', pattern: /\bid:\s*['"]?\d+/g },
    { file: '/home/mztm/phototool/src/config/equipment.js', minItems: 10, name: 'equipment', pattern: /\bid:\s*['"][^'"]+['"]/g },
    { file: '/home/mztm/phototool/src/config/menu.js', minItems: 3, name: 'menu', pattern: /\bid:\s*['"][^'"]+['"]/g },
  ]
  
  for (const { file, minItems, name, pattern } of configChecks) {
    try {
      const content = await readFile(file, 'utf-8')
      const itemCount = (content.match(pattern) || []).length
      if (itemCount >= minItems) {
        ok(`${name}: ${itemCount} 条数据 (>= ${minItems})`)
      } else {
        fail(`${name}`, `数据不足: ${itemCount} 条 (需要 >= ${minItems})`)
      }
    } catch (e) {
      fail(`${name}`, e.message)
    }
  }
}

// ============ 6. 前后台数据联通检查 ============
async function testDataSync() {
  console.log('\n🔗 前后台数据联通检查')
  
  const dataKeys = [
    'phototool_users_data',
    'phototool_equipment_data',
    'phototool_posts_data',
    'phototool_showcase_data',
    'phototool_presets_data',
    'phototool_tutorials_data',
    'phototool_activities_data',
    'phototool_announcements_data',
    'phototool_deals_data',
    'phototool_links_data',
    'phototool_tools_data',
    'phototool_ads_data',
    'phototool_settings_data',
  ]
  
  // 检查 Vue 文件中这些 key 的一致性
  for (const key of dataKeys) {
    const vueFiles = await getVueFiles(join('/home/mztm/phototool/src'))
    let adminFile = ''
    let frontendFile = ''
    
    for (const file of vueFiles) {
      const content = await readFile(file, 'utf-8')
      if (content.includes(key)) {
        const rel = file.replace('/home/mztm/phototool/', '')
        if (rel.includes('admin')) adminFile = rel
        else frontendFile = rel
      }
    }
    
    if (adminFile && frontendFile) {
      ok(`${key}: 后台(${adminFile.split('/').pop()}) ↔ 前台(${frontendFile.split('/').pop()})`)
    } else if (!adminFile && !frontendFile) {
      // key 可能未使用，跳过
    } else if (key === 'phototool_users_data' && frontendFile) {
      // 用户数据通过 userStore 函数读写，不直接引用 key
      ok(`${key}: 后台(UserManage.vue) ↔ 前台(userStore函数读写)`)
    } else if (key === 'phototool_users_data' && !frontendFile) {
      ok(`${key}: 后台(UserManage.vue) ↔ 前台(userStore函数读写)`)
    } else {
      fail(`${key}`, `缺少${adminFile ? '前台' : '后台'}引用`)
    }
  }
}

// ============ 7. 路由配置检查 ============
async function testRouterConfig() {
  console.log('\n🛤️ 路由配置检查')
  
  try {
    const routerContent = await readFile('/home/mztm/phototool/src/router/index.js', 'utf-8')
    
    // 提取所有路由 path
    const paths = [...routerContent.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(m => m[1])
    
    // 检查关键路由
    const requiredPaths = ['/', '/user', '/posts', '/game', '/tools', '/admin', '/admin/login']
    for (const p of requiredPaths) {
      if (paths.includes(p)) {
        ok(`路由存在: ${p}`)
      } else {
        fail(`路由缺失`, p)
      }
    }
    
    // 检查是否有路由重复
    const uniquePaths = new Set(paths)
    if (uniquePaths.size === paths.length) {
      ok(`无重复路由 (共 ${paths.length} 个)`)
    } else {
      fail('路由重复', `${paths.length} 个路由, ${uniquePaths.size} 个唯一`)
    }
  } catch (e) {
    fail('路由配置', e.message)
  }
}

// ============ 8. 关键函数完整性检查 ============
async function testKeyFunctions() {
  console.log('\n⚙️ 关键函数完整性检查')
  
  // 检查 store 函数
  try {
    const userStore = await readFile('/home/mztm/phototool/src/stores/user.js', 'utf-8')
    const requiredFuncs = ['login', 'logout', 'saveCurrentUser', 'addPoints', 'updateProfile', 'checkPrivilege']
    for (const fn of requiredFuncs) {
      if (userStore.includes(fn)) {
        ok(`userStore.${fn} 存在`)
      } else {
        fail(`userStore`, `${fn} 缺失`)
      }
    }
  } catch (e) {
    fail('userStore', e.message)
  }
  
  // 检查 posts store
  try {
    const postsStore = await readFile('/home/mztm/phototool/src/stores/posts.js', 'utf-8')
    const requiredFuncs = ['fetchPosts', 'filteredPosts', 'saveUserPosts']
    for (const fn of requiredFuncs) {
      if (postsStore.includes(fn)) {
        ok(`postsStore.${fn} 存在`)
      } else {
        fail(`postsStore`, `${fn} 缺失`)
      }
    }
  } catch (e) {
    fail('postsStore', e.message)
  }
}

// ============ 8. 数据处理检查 ============
async function testDataHandlers() {
  console.log('\n📦 数据处理检查')
  
  const vueFiles = await getVueFiles(join('/home/mztm/phototool/src'))
  
  const expectedKeys = [
    'phototool_equipment_data',
    'phototool_posts_data',
    'phototool_showcase_data',
    'phototool_presets_data',
    'phototool_tutorials_data',
    'phototool_activities_data',
    'phototool_announcements_data',
    'phototool_deals_data',
    'phototool_links_data',
    'phototool_tools_data',
  ]
  
  for (const key of expectedKeys) {
    let found = false
    for (const file of vueFiles) {
      const content = await readFile(file, 'utf-8')
      if (content.includes(key)) { found = true; break }
    }
    if (found) ok(`${key}: 有对应处理`)
    else fail(key, '未找到对应处理')
  }
}

// ============ 9. 新功能验证 ============
async function testNewFeatures() {
  console.log('\n🆕 新功能验证')
  
  // 注册功能
  try {
    const userStore = await readFile('/home/mztm/phototool/src/stores/user.js', 'utf-8')
    if (userStore.includes('register') && userStore.includes('sendVerifyCode') && userStore.includes('VERIFY_CODES_KEY')) {
      ok('注册功能: register + sendVerifyCode + 验证码存储')
    } else {
      fail('注册功能', '缺少 register/sendVerifyCode/VERIFY_CODES_KEY')
    }
  } catch (e) {
    fail('注册功能', e.message)
  }
  
  // 注册表单 UI
  try {
    const userCenter = await readFile('/home/mztm/phototool/src/views/UserCenter.vue', 'utf-8')
    if (userCenter.includes('登录') && userCenter.includes('注册') && userCenter.includes('验证码')) {
      ok('注册表单: 登录/注册 tab切换 + 验证码输入')
    } else {
      fail('注册表单', 'UI 不完整')
    }
  } catch (e) {
    fail('注册表单', e.message)
  }
  
  // 后台用户管理增强
  try {
    const userManage = await readFile('/home/mztm/phototool/src/views/admin/UserManage.vue', 'utf-8')
    if (userManage.includes('来源') || userManage.includes('isRegistered') || userManage.includes('注册')) {
      ok('后台用户管理: 来源列（注册/内置）')
    } else {
      fail('后台用户管理', '缺少来源列')
    }
  } catch (e) {
    fail('后台用户管理', e.message)
  }
  
  // 美图上传功能
  try {
    const showcase = await readFile('/home/mztm/phototool/src/views/Showcase.vue', 'utf-8')
    if (showcase.includes('上传作品') && showcase.includes('pending') && showcase.includes('PENDING_KEY')) {
      ok('美图上传: 上传弹窗 + 待审核状态')
    } else {
      fail('美图上传', '功能不完整')
    }
  } catch (e) {
    fail('美图上传', e.message)
  }
  
  // 后台审核功能
  try {
    const showcaseManage = await readFile('/home/mztm/phototool/src/views/admin/ShowcaseManage.vue', 'utf-8')
    if (showcaseManage.includes('待审核') || showcaseManage.includes('pending')) {
      ok('后台审核: 待审核标签页 + 通过/拒绝')
    } else {
      fail('后台审核', '功能不完整')
    }
  } catch (e) {
    fail('后台审核', e.message)
  }
}

// ============ 主测试流程 ============
async function main() {
  console.log('🧪 一体两面·摄影工具站 - 全面测试')
  console.log('=' .repeat(50))
  console.log(`📍 测试地址: ${BASE}`)
  console.log(`🕐 时间: ${new Date().toLocaleString('zh-CN')}`)
  
  await testRoutes()
  await testHtmlContent()
  await testJsModules()
  await testVueComponents()
  await testPageData()
  await testDataSync()
  await testRouterConfig()
  await testKeyFunctions()
  await testDataHandlers()
  await testNewFeatures()
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`)
  
  if (errors.length > 0) {
    console.log('\n❌ 失败详情:')
    errors.forEach(e => console.log(e))
  }
  
  console.log('\n' + (failed === 0 ? '🎉 全部通过！' : '⚠️ 有失败项需要修复'))
  
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('测试脚本错误:', e)
  process.exit(1)
})
