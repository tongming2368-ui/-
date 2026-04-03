import { readFile } from 'fs/promises'

const BASE = 'http://localhost:3000'
let passed = 0, failed = 0
const errors = []

function ok(name) { passed++; console.log(`  ✅ ${name}`) }
function fail(name, err) { failed++; const m = `  ❌ ${name}: ${err}`; console.log(m); errors.push(m) }

async function main() {
  console.log('🔧 器材配置系统专项测试')
  console.log('='.repeat(50))

  // 1. 配置文件存在
  console.log('\n📁 配置文件检查')
  try {
    const cfg = await readFile('/home/mztm/phototool/src/config/equipmentConfig.js', 'utf-8')
    if (cfg.includes('defaultEquipmentConfig') && cfg.includes('loadEquipmentConfig') && cfg.includes('saveEquipmentConfig')) {
      ok('equipmentConfig.js 导出完整')
    }
    if (cfg.includes('categories') && cfg.includes('brands') && cfg.includes('sensors') && cfg.includes('mounts')) {
      ok('equipmentConfig.js 包含4类配置')
    }
  } catch(e) { fail('配置文件', e.message) }

  // 2. Settings 页面有配置管理
  console.log('\n⚙️ 后台配置管理')
  try {
    const settings = await readFile('/home/mztm/phototool/src/views/admin/Settings.vue', 'utf-8')
    if (settings.includes('器材配置') || settings.includes('equipmentConfig')) {
      ok('Settings.vue 包含器材配置管理')
    } else {
      fail('Settings', '缺少器材配置管理')
    }
    if (settings.includes('分类管理') && settings.includes('品牌管理')) {
      ok('Settings.vue 有分类/品牌管理面板')
    }
    if (settings.includes('恢复默认') || settings.includes('defaultEquipmentConfig')) {
      ok('Settings.vue 有恢复默认功能')
    }
  } catch(e) { fail('Settings', e.message) }

  // 3. EquipmentManage 使用配置
  console.log('\n📷 器材管理')
  try {
    const em = await readFile('/home/mztm/phototool/src/views/admin/EquipmentManage.vue', 'utf-8')
    if (em.includes('loadEquipmentConfig') || em.includes('equipmentConfig')) {
      ok('EquipmentManage 从配置读取分类')
    } else {
      fail('EquipmentManage', '未使用配置系统')
    }
    if (em.includes('brand') && (em.includes('select') || em.includes('option'))) {
      ok('EquipmentManage 品牌用下拉选择')
    }
  } catch(e) { fail('EquipmentManage', e.message) }

  // 4. Camera.vue 使用配置
  console.log('\n📷 相机页面')
  try {
    const cam = await readFile('/home/mztm/phototool/src/views/Camera.vue', 'utf-8')
    if (cam.includes('loadEquipmentConfig') || cam.includes('equipmentConfig')) {
      ok('Camera.vue 从配置读取筛选选项')
    } else {
      fail('Camera.vue', '未使用配置系统')
    }
    if (cam.includes('equipment-config-changed') || cam.includes('storage')) {
      ok('Camera.vue 监听配置变化')
    }
  } catch(e) { fail('Camera.vue', e.message) }

  // 5. Lens.vue 使用配置
  console.log('\n🔭 镜头页面')
  try {
    const lens = await readFile('/home/mztm/phototool/src/views/Lens.vue', 'utf-8')
    if (lens.includes('loadEquipmentConfig') || lens.includes('equipmentConfig')) {
      ok('Lens.vue 从配置读取筛选选项')
    } else {
      fail('Lens.vue', '未使用配置系统')
    }
    if (lens.includes('equipment-config-changed') || lens.includes('storage')) {
      ok('Lens.vue 监听配置变化')
    }
  } catch(e) { fail('Lens.vue', e.message) }

  // 6. Equipment.vue 使用配置
  console.log('\n📸 器材总览')
  try {
    const eq = await readFile('/home/mztm/phototool/src/views/Equipment.vue', 'utf-8')
    if (eq.includes('loadEquipmentConfig') || eq.includes('equipmentConfig')) {
      ok('Equipment.vue 从配置读取分类/筛选')
    } else {
      fail('Equipment.vue', '未使用配置系统')
    }
  } catch(e) { fail('Equipment.vue', e.message) }

  // 7. 页面路由
  console.log('\n📄 页面可访问')
  const routes = ['/', '/equipment/camera', '/equipment/lens', '/compare', '/admin/settings', '/admin/equipment']
  for (const r of routes) {
    try {
      const res = await fetch(`${BASE}${r}`)
      if (res.ok) ok(`${r} (${res.status})`)
      else fail(`${r}`, `HTTP ${res.status}`)
    } catch(e) { fail(`${r}`, e.message) }

  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 结果: ${passed} 通过, ${failed} 失败`)
  if (errors.length) { console.log('\n❌ 失败项:'); errors.forEach(e => console.log(e)) }
  console.log(failed === 0 ? '\n🎉 器材配置系统测试全部通过！' : '\n⚠️ 有失败项')
  process.exit(failed > 0 ? 1 : 0)
}
main()
