/**
 * 前后台数据联通深度排查
 * 检查每个后台写入是否能被前台正确读取
 */
import { readFile } from 'fs/promises'

let passed = 0, failed = 0
const errors = []
function ok(name) { passed++; console.log(`  ✅ ${name}`) }
function fail(name, err) { failed++; const m = `❌ ${name}: ${err}`; errors.push(m); console.log(`  ${m}`) }

async function main() {
  console.log('🔗 前后台数据联通深度排查')
  console.log('='.repeat(60))

  // 1. 后台管理页面写入检查
  console.log('\n📤 后台写入检查')
  
  const adminPages = [
    { file: 'UserManage.vue', key: 'phototool_users_data', desc: '用户管理' },
    { file: 'PostManage.vue', key: 'phototool_posts_data', desc: '帖子管理' },
    { file: 'ShowcaseManage.vue', key: 'phototool_showcase_data', desc: '美图管理' },
    { file: 'PresetsManage.vue', key: 'phototool_presets_data', desc: '预设管理' },
    { file: 'TutorialsManage.vue', key: 'phototool_tutorials_data', desc: '教程管理' },
    { file: 'ActivitiesManage.vue', key: 'phototool_activities_data', desc: '活动管理' },
    { file: 'AnnouncementsManage.vue', key: 'phototool_announcements_data', desc: '公告管理' },
    { file: 'DealsManage.vue', key: 'phototool_deals_data', desc: '优惠管理' },
    { file: 'LinksManage.vue', key: 'phototool_links_data', desc: '友链管理' },
    { file: 'ToolManage.vue', key: 'phototool_tools_data', desc: '工具管理' },
    { file: 'EquipmentManage.vue', key: 'phototool_equipment_data', desc: '器材管理' },
    { file: 'AdManage.vue', key: 'phototool_ads_data', desc: '广告管理' },
    { file: 'Settings.vue', key: 'phototool_settings_data', desc: '系统设置' },
  ]

  for (const { file, key, desc } of adminPages) {
    try {
      const content = await readFile(`/home/mztm/phototool/src/views/admin/${file}`, 'utf-8')
      const hasSetItem = content.includes(`localStorage.setItem('${key}'`) || content.includes(`localStorage.setItem("${key}"`)
      if (hasSetItem) ok(`${desc}: 写入 ${key}`)
      else fail(desc, `未找到 localStorage.setItem('${key}')`)
    } catch(e) { fail(desc, e.message) }
  }

  // 2. 前台读取检查
  console.log('\n📥 前台读取检查')
  
  const frontendPages = [
    { files: ['UserCenter.vue', 'stores/user.js'], key: 'phototool_users_data', desc: '用户中心' },
    { files: ['Camera.vue', 'Lens.vue', 'Equipment.vue'], key: 'phototool_equipment_data', desc: '器材页面' },
    { files: ['Posts.vue'], key: 'phototool_posts_data', desc: '帖子区' },
    { files: ['Showcase.vue'], key: 'phototool_showcase_data', desc: '美图展示' },
    { files: ['Presets.vue'], key: 'phototool_presets_data', desc: '调色预设' },
    { files: ['Tutorials.vue'], key: 'phototool_tutorials_data', desc: '教程攻略' },
    { files: ['Activities.vue'], key: 'phototool_activities_data', desc: '活动' },
    { files: ['Announcements.vue'], key: 'phototool_announcements_data', desc: '公告' },
    { files: ['Deals.vue'], key: 'phototool_deals_data', desc: '优惠信息' },
    { files: ['Links.vue'], key: 'phototool_links_data', desc: '友情链接' },
    { files: ['Tools.vue'], key: 'phototool_tools_data', desc: '工具' },
    { files: ['Home.vue'], key: 'phototool_ads_data', desc: '广告' },
    { files: ['App.vue'], key: 'phototool_settings_data', desc: '系统设置' },
  ]

  for (const { files, key, desc } of frontendPages) {
    let found = false
    for (const f of files) {
      const dirs = f.includes('/') ? [''] : ['views/', 'views/admin/', 'stores/', 'components/']
      for (const dir of dirs) {
        try {
          const content = await readFile(`/home/mztm/phototool/src/${dir}${f}`, 'utf-8')
          if (content.includes(key)) { found = true; break }
        } catch {}
        if (found) break
      }
      if (found) break
    }
    if (found) ok(`${desc}: 读取 ${key}`)
    else fail(desc, `未找到读取 ${key}`)
  }

  // 3. 审核数据流检查
  console.log('\n🔄 审核数据流检查')
  
  // 美图审核
  try {
    const sm = await readFile('/home/mztm/phototool/src/views/admin/ShowcaseManage.vue', 'utf-8')
    const sv = await readFile('/home/mztm/phototool/src/views/Showcase.vue', 'utf-8')
    if (sm.includes('phototool_pending_showcase') && sv.includes('phototool_pending_showcase'))
      ok('美图审核: pending → approve 数据流')
    else fail('美图审核', 'pending key 不一致')
    
    if (sm.includes('phototool_showcase_data') && sm.includes('approveItem'))
      ok('美图审核: 通过后写入 showcase_data')
    else fail('美图审核', '缺少通过后的写入逻辑')
  } catch(e) { fail('美图审核', e.message) }

  // 帖子审核
  try {
    const pm = await readFile('/home/mztm/phototool/src/views/admin/PostManage.vue', 'utf-8')
    if (pm.includes('activity_zone') && pm.includes('deals_zone') && pm.includes('approvePost'))
      ok('帖子审核: activity_zone + deals_zone 审核通过')
    else fail('帖子审核', '缺少审核逻辑')
    
    if (pm.includes('isHidden') && pm.includes('placement'))
      ok('帖子审核: 设置 isHidden + placement')
    else fail('帖子审核', '缺少 isHidden/placement 字段')
  } catch(e) { fail('帖子审核', e.message) }

  // 4. 前台消费审核数据检查
  console.log('\n📥 前台消费审核数据')
  
  // Activities 从帖子读取 activity_zone
  try {
    const av = await readFile('/home/mztm/phototool/src/views/Activities.vue', 'utf-8')
    if (av.includes('activity_zone') && av.includes('isHidden') && av.includes('phototool_posts_data'))
      ok('活动页: 从帖子读取 activity_zone 数据')
    else fail('活动页', '缺少帖子数据读取逻辑')
  } catch(e) { fail('活动页', e.message) }

  // BrandActivities 读取 activityPlacement === 'brand'
  try {
    const bv = await readFile('/home/mztm/phototool/src/views/BrandActivities.vue', 'utf-8')
    if (bv.includes('activityPlacement') && bv.includes('brand'))
      ok('品牌活动页: 读取 activityPlacement=brand')
    else fail('品牌活动页', '缺少 activityPlacement 筛选')
  } catch(e) { fail('品牌活动页', e.message) }

  // Deals 从帖子读取 deals_zone
  try {
    const dv = await readFile('/home/mztm/phototool/src/views/Deals.vue', 'utf-8')
    if (dv.includes('deals_zone') && dv.includes('isHidden') && dv.includes('phototool_posts_data'))
      ok('优惠页: 从帖子读取 deals_zone 数据')
    else fail('优惠页', '缺少帖子数据读取逻辑')
  } catch(e) { fail('优惠页', e.message) }

  // 5. 用户注册数据流
  console.log('\n👤 用户注册数据流')
  try {
    const us = await readFile('/home/mztm/phototool/src/stores/user.js', 'utf-8')
    if (us.includes('register') && us.includes('sendVerifyCode') && us.includes('phototool_verify_codes'))
      ok('注册: sendVerifyCode → verifyCode → register')
    else fail('注册', '缺少完整注册流程')
    
    const um = await readFile('/home/mztm/phototool/src/views/admin/UserManage.vue', 'utf-8')
    if (um.includes('来源') && um.includes('isRegistered'))
      ok('注册: 后台可识别注册用户')
    else fail('注册', '后台缺少来源字段')
  } catch(e) { fail('注册', e.message) }

  // 6. 器材配置数据流
  console.log('\n⚙️ 器材配置数据流')
  try {
    const ec = await readFile('/home/mztm/phototool/src/config/equipmentConfig.js', 'utf-8')
    if (ec.includes('saveEquipmentConfig') && ec.includes('equipment-config-changed'))
      ok('配置: saveEquipmentConfig 触发事件通知')
    else fail('配置', '缺少事件通知')

    const st = await readFile('/home/mztm/phototool/src/views/admin/Settings.vue', 'utf-8')
    if (st.includes('saveEquipmentConfig') && st.includes('器材配置'))
      ok('配置: 后台 Settings 可管理配置')
    else fail('配置', '后台缺少配置管理')
  } catch(e) { fail('配置', e.message) }

  // 结果
  console.log('\n' + '='.repeat(60))
  console.log(`📊 结果: ${passed} 通过, ${failed} 失败`)
  if (errors.length) { console.log('\n❌ 失败项:'); errors.forEach(e => console.log(`  ${e}`)) }
  console.log(failed === 0 ? '\n✅ 数据联通完整！' : '\n⚠️ 有联通问题需要修复')
  process.exit(failed > 0 ? 1 : 0)
}
main()
