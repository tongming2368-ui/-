import http from 'http';
import https from 'https';

const BASE = { hostname: 'localhost', port: 3001 };

let passCount = 0;
let failCount = 0;
const logs = [];

function request(method, path, data, token) {
  return new Promise((resolve) => {
    const opts = { ...BASE, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ raw: body.substring(0, 200) }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function log(action, result, error) {
  const status = error ? '❌' : '✅';
  const msg = `${status} ${action}: ${error || JSON.stringify(result).substring(0, 80)}`;
  logs.push(msg);
  if (error) failCount++; else passCount++;
  console.log(msg);
}

// 生成随机字符串
function randomStr(len = 8) {
  return Math.random().toString(36).substring(2, 2 + len);
}

// 模拟用户注册
async function registerUser(username, email, password) {
  // 发送验证码
  const code = await request('POST', '/api/auth/send-code', { email, type: 'register' });
  if (code.error) { log('发送注册验证码', null, code.error); return null; }
  
  // 从日志中获取验证码（简化处理）
  await sleep(500);
  
  // 注册
  const reg = await request('POST', '/api/auth/register', { username, email, password, verifyCode: '123456' });
  if (reg.error) { log('注册用户', null, reg.error); return null; }
  log('注册用户', reg);
  return reg;
}

// 模拟用户登录
async function loginUser(username, password) {
  const res = await request('POST', '/api/auth/login', { username, password });
  if (res.error) { log('用户登录', null, res.error); return null; }
  log('用户登录', { token: res.token?.substring(0, 20) + '...' });
  return res.token;
}

// 模拟创建帖子
async function createPost(token, title, content) {
  const categories = ['photo', 'discussion', 'question', 'gear'];
  const res = await request('POST', '/api/posts', {
    title, content,
    category: categories[Math.floor(Math.random() * categories.length)]
  }, token);
  if (res.error) { log('创建帖子', null, res.error); return null; }
  log('创建帖子', res);
  return res;
}

// 模拟创建攻略
async function createTutorial(token, title, content) {
  const res = await request('POST', '/api/tutorials', {
    title, content, category: 'tutorial',
    tags: ['测试', '教程']
  }, token);
  if (res.error) { log('创建攻略', null, res.error); return null; }
  log('创建攻略', res);
  return res;
}

// 模拟添加器材
async function addEquipment(token, name, category) {
  const res = await request('POST', '/api/equipment', {
    name, category, brand: '测试品牌', description: '压力测试添加',
    specs: {}, priceRange: '1000-5000'
  }, token);
  if (res.error) { log('添加器材', null, res.error); return null; }
  log('添加器材', res);
  return res;
}

// 模拟点赞
async function likePost(token, postId) {
  const res = await request('POST', `/api/posts/${postId}/like`, {}, token);
  if (res.error) { log('点赞帖子', null, res.error); return null; }
  log('点赞帖子', res);
  return res;
}

// 模拟获取帖子列表
async function getPosts() {
  const res = await request('GET', '/api/posts');
  if (res.error) { log('获取帖子列表', null, res.error); return null; }
  log('获取帖子列表', { total: res.total || 0 });
  return res;
}

// 模拟获取器材列表
async function getEquipment() {
  const res = await request('GET', '/api/equipment');
  if (res.error) { log('获取器材列表', null, res.error); return null; }
  log('获取器材列表', { total: res.total || 0 });
  return res;
}

// 模拟获取攻略列表
async function getTutorials() {
  const res = await request('GET', '/api/tutorials');
  if (res.error) { log('获取攻略列表', null, res.error); return null; }
  log('获取攻略列表', { total: res.total || 0 });
  return res;
}

// 模拟聊天发送
async function sendChat(token, message) {
  const res = await request('POST', '/api/chat/send', { message, room: 'general' }, token);
  if (res.error) { log('发送聊天', null, res.error); return null; }
  log('发送聊天', res);
  return res;
}

// 模拟获取聊天记录
async function getChatHistory() {
  const res = await request('GET', '/api/chat/history?room=general&limit=10');
  if (res.error) { log('获取聊天记录', null, res.error); return null; }
  log('获取聊天记录', { count: res.messages?.length || 0 });
  return res;
}

// 模拟签到
async function signIn(token) {
  const res = await request('POST', '/api/users/signin', {}, token);
  if (res.error) { log('每日签到', null, res.error); return null; }
  log('每日签到', res);
  return res;
}

// 模拟获取用户信息
async function getUserInfo(token) {
  const res = await request('GET', '/api/auth/me', null, token);
  if (res.error) { log('获取用户信息', null, res.error); return null; }
  log('获取用户信息', { points: res.user?.points, level: res.user?.level });
  return res;
}

// 模拟修改用户资料
async function updateProfile(token, data) {
  const res = await request('PUT', '/api/users/profile', data, token);
  if (res.error) { log('修改资料', null, res.error); return null; }
  log('修改资料', res);
  return res;
}

// 模拟获取积分记录
async function getSignHistory(token) {
  const res = await request('GET', '/api/users/sign-history', null, token);
  if (res.error) { log('获取签到记录', null, res.error); return null; }
  log('获取签到记录', { count: res.history?.length || 0 });
  return res;
}

// 模拟重置密码
async function resetPassword(email) {
  const sendRes = await request('POST', '/api/auth/send-code', { email, type: 'reset' });
  if (sendRes.error) { log('发送重置验证码', null, sendRes.error); return null; }
  log('发送重置验证码', sendRes);
  
  await sleep(500);
  
  const resetRes = await request('POST', '/api/auth/reset-password', {
    email, verifyCode: '654321', newPassword: 'newpass123'
  }, null);
  if (resetRes.error) { log('重置密码', null, resetRes.error); return null; }
  log('重置密码', resetRes);
  return resetRes;
}

// 模拟获取优惠信息
async function getDeals() {
  const res = await request('GET', '/api/deals');
  if (res.error) { log('获取优惠', null, res.error); return null; }
  log('获取优惠', { total: res.total || 0 });
  return res;
}

// 模拟获取公告
async function getAnnouncements() {
  const res = await request('GET', '/api/announcements');
  if (res.error) { log('获取公告', null, res.error); return null; }
  log('获取公告', { count: res.items?.length || 0 });
  return res;
}

// 模拟获取系统设置
async function getSettings() {
  const res = await request('GET', '/api/admin/settings');
  if (res.error) { log('获取系统设置', null, res.error); return null; }
  log('获取系统设置', res);
  return res;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟并发用户行为
async function simulateUser(userId, round) {
  const username = `testuser${userId}`;
  const email = `test${userId}@test.com`;
  const password = 'test123';

  console.log(`\n--- 用户${userId} 第${round}轮开始 ---`);
  
  // 1. 注册（如果第一次）
  if (round === 0) {
    await registerUser(username, email, password);
    await sleep(300);
  }

  // 2. 登录
  const token = await loginUser(username, password);
  if (!token) { console.log(`用户${userId}登录失败，跳过本轮`); return; }
  await sleep(300);

  // 3. 获取用户信息
  await getUserInfo(token);
  await sleep(200);

  // 4. 每日签到
  await signIn(token);
  await sleep(300);

  // 5. 修改资料
  await updateProfile(token, { nickname: `用户${userId}_${round}` });
  await sleep(200);

  // 6. 获取帖子列表
  await getPosts();
  await sleep(200);

  // 7. 创建帖子
  const post = await createPost(token, `测试帖子_${userId}_${round}`, `这是用户${userId}在第${round}轮发布的测试帖子内容。时间戳: ${Date.now()}`);
  await sleep(300);

  // 8. 点赞
  if (post?.id) {
    await likePost(token, post.id);
    await sleep(200);
  }

  // 9. 获取攻略列表
  await getTutorials();
  await sleep(200);

  // 10. 创建攻略
  if (round % 2 === 0) { // 每两轮创建一个攻略
    await createTutorial(token, `测试攻略_${userId}_${round}`, `这是用户${userId}在第${round}轮创建的测试攻略内容。时间戳: ${Date.now()}`);
    await sleep(300);
  }

  // 11. 获取器材列表
  await getEquipment();
  await sleep(200);

  // 12. 管理员添加器材（模拟）
  await addEquipment(token, `测试器材_${userId}_${round}`, 'camera');
  await sleep(200);

  // 13. 发送聊天
  await sendChat(token, `用户${userId}发送的消息_${round} - ${Date.now()}`);
  await sleep(200);

  // 14. 获取聊天记录
  await getChatHistory();
  await sleep(200);

  // 15. 获取优惠
  await getDeals();
  await sleep(200);

  // 16. 获取公告
  await getAnnouncements();
  await sleep(200);

  console.log(`--- 用户${userId} 第${round}轮结束 ---`);
}

// 主测试函数
async function runLoadTest() {
  console.log('=== 网站压力测试开始 ===');
  console.log(`开始时间: ${new Date().toLocaleString()}`);
  
  const numUsers = 5; // 并发用户数
  const roundsPerUser = 3; // 每个用户的轮数
  
  // 预热：先创建几个测试用户
  console.log('\n--- 预热阶段：创建测试用户 ---');
  for (let i = 1; i <= numUsers; i++) {
    const username = `testuser${i}`;
    const email = `test${i}@test.com`;
    const password = 'test123';
    
    // 发送验证码
    await request('POST', '/api/auth/send-code', { email, type: 'register' });
    await sleep(500);
    
    // 尝试注册（可能已经存在）
    await request('POST', '/api/auth/register', { username, email, password, verifyCode: '123456' });
    await sleep(500);
  }
  console.log('预热完成！\n');
  
  // 主测试阶段：并发用户模拟
  for (let round = 0; round < roundsPerUser; round++) {
    console.log(`\n========== 第${round + 1}轮测试 ==========`);
    
    const promises = [];
    for (let i = 1; i <= numUsers; i++) {
      promises.push(simulateUser(i, round));
    }
    await Promise.all(promises);
    
    console.log(`\n第${round + 1}轮完成，统计: 通过=${passCount}, 失败=${failCount}`);
    await sleep(1000); // 轮间休息
  }

  // 后清理：获取最终统计
  console.log('\n========== 最终统计 ==========');
  await getPosts();
  await getEquipment();
  await getTutorials();

  console.log('\n=== 测试完成 ===');
  console.log(`结束时间: ${new Date().toLocaleString()}`);
  console.log(`总计: 通过=${passCount}, 失败=${failCount}, 总计=${passCount + failCount}`);
  console.log(`通过率: ${(passCount / (passCount + failCount) * 100).toFixed(2)}%`);
}

runLoadTest().catch(console.error);
