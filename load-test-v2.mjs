import http from 'http';

const BASE = { hostname: 'localhost', port: 3001 };
let passCount = 0;
let failCount = 0;

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(action, result, error) {
  const s = error ? '❌' : '✅';
  console.log(`${s} ${action}: ${error || JSON.stringify(result).substring(0, 100)}`);
  if (error) failCount++; else passCount++;
}

async function runTest() {
  console.log('=== 压力测试 ===');
  const now = new Date().toLocaleString();
  console.log(`开始: ${now}`);
  
  // 步骤1: 顺序注册用户（每个间隔70秒避免限流）
  console.log('\n--- 注册阶段 ---');
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const username = `loadtest${i}`;
    const email = `loadtest${i}@test.com`;
    const password = 'test123';
    
    // 发送验证码
    const codeRes = await request('POST', '/api/auth/send-code', { email, type: 'register' });
    if (codeRes.error) {
      log(`用户${i} 发送验证码`, null, codeRes.error);
      if (i > 1) await sleep(65000); // 等待限流
      continue;
    }
    log(`用户${i} 发送验证码`, codeRes);
    await sleep(1000);
    
    // 注册（需要从服务器日志获取验证码，简化处理用最近的）
    const reg = await request('POST', '/api/auth/register', { username, email, password, verifyCode: '123456' });
    if (reg.error) {
      log(`用户${i} 注册`, null, reg.error);
    } else {
      log(`用户${i} 注册`, reg);
      users.push({ username, email, password });
    }
    
    if (i < 5) await sleep(65000); // 等待限流
  }
  
  // 步骤2: 登录测试用户
  console.log('\n--- 登录阶段 ---');
  const tokens = [];
  for (const user of users) {
    const loginRes = await request('POST', '/api/auth/login', { username: user.username, password: user.password });
    if (loginRes.error) {
      log(`登录 ${user.username}`, null, loginRes.error);
    } else {
      log(`登录 ${user.username}`, { token: loginRes.token.substring(0, 20) + '...' });
      tokens.push({ ...user, token: loginRes.token });
    }
    await sleep(500);
  }
  
  // 步骤3: 并发操作测试
  console.log('\n--- 并发操作测试 ---');
  const ops = [];
  for (const user of tokens) {
    ops.push(async () => {
      const t = user.token;
      
      // 获取帖子
      await request('GET', '/api/posts').then(r => log('获取帖子', r, r.error));
      await sleep(200);
      
      // 创建帖子
      const post = await request('POST', '/api/posts', { title: `压力测试帖子_${Date.now()}`, content: '压力测试内容', category: 'discussion' }, t);
      log('创建帖子', post, post.error);
      await sleep(200);
      
      // 点赞
      if (post.id) {
        const like = await request('POST', `/api/posts/${post.id}/like`, {}, t);
        log('点赞', like, like.error);
      }
      await sleep(200);
      
      // 获取攻略
      await request('GET', '/api/tutorials').then(r => log('获取攻略', r, r.error));
      await sleep(200);
      
      // 获取器材
      await request('GET', '/api/equipment').then(r => log('获取器材', r, r.error));
      await sleep(200);
      
      // 发送聊天
      const chat = await request('POST', '/api/chat/send', { message: `聊天消息_${Date.now()}`, room: 'general' }, t);
      log('发送聊天', chat, chat.error);
      await sleep(200);
      
      // 获取聊天记录
      await request('GET', '/api/chat/history?room=general&limit=5').then(r => log('获取聊天', r, r.error));
      await sleep(200);
      
      // 签到
      const sign = await request('POST', '/api/users/signin', {}, t);
      log('签到', sign, sign.error);
      await sleep(200);
      
      // 获取用户信息
      const info = await request('GET', '/api/auth/me', null, t);
      log('用户信息', info.user ? { points: info.user.points, level: info.user.level } : info, info.error);
      await sleep(200);
      
      // 修改资料
      const profile = await request('PUT', '/api/users/profile', { nickname: '压力测试用户' + Date.now() }, t);
      log('修改资料', profile, profile.error);
    });
  }
  
  // 执行3轮并发测试
  for (let round = 0; round < 3; round++) {
    console.log(`\n--- 第${round + 1}轮并发 ---`);
    await Promise.all(ops.map(op => op()));
    await sleep(2000);
  }
  
  // 步骤4: 获取最终统计
  console.log('\n--- 最终统计 ---');
  await request('GET', '/api/posts').then(r => log('帖子总数', { total: r.total || 0 }, r.error));
  await request('GET', '/api/tutorials').then(r => log('攻略总数', { total: r.total || 0 }, r.error));
  await request('GET', '/api/equipment').then(r => log('器材总数', { total: r.total || 0 }, r.error));
  await request('GET', '/api/chat/history?room=general&limit=100').then(r => log('聊天总数', { count: r.messages?.length || 0 }, r.error));
  
  console.log('\n=== 测试完成 ===');
  console.log(`结束: ${new Date().toLocaleString()}`);
  console.log(`通过: ${passCount}, 失败: ${failCount}, 总计: ${passCount + failCount}`);
  console.log(`通过率: ${(passCount / (passCount + failCount) * 100).toFixed(2)}%`);
}

runTest().catch(console.error);
