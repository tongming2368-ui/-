import http from 'http';

const BASE = { hostname: 'localhost', port: 3001 };
let pass = 0, fail = 0;

function req(method, path, data, token) {
  return new Promise((resolve) => {
    const opts = { ...BASE, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({ raw: body.substring(0,100) }); } });
    });
    r.on('error', (e) => resolve({ error: e.message }));
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('=== 快速压力测试 ===');
  console.log('开始: ' + new Date().toLocaleString());
  
  // 登录已存在的用户
  const users = [];
  for (let i = 1; i <= 3; i++) {
    const login = await req('POST', '/api/auth/login', { username: 'loadtest' + i, password: 'test123' });
    if (login.token) {
      console.log('OK 登录 loadtest' + i);
      users.push({ username: 'loadtest' + i, token: login.token });
    } else {
      console.log('FAIL 登录 loadtest' + i + ': ' + (login.error || '未知'));
      fail++;
    }
    await sleep(200);
  }

  if (users.length === 0) {
    console.log('没有可测试的用户');
    return;
  }

  console.log('可用用户: ' + users.length);
  console.log('开始并发测试');

  // 10轮并发测试
  for (let round = 0; round < 10; round++) {
    const promises = [];
    for (const user of users) {
      promises.push(req('GET', '/api/posts', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('GET', '/api/equipment', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('GET', '/api/tutorials', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('GET', '/api/deals', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('GET', '/api/chat/history?room=general&limit=5', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('POST', '/api/users/signin', {}, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('GET', '/api/auth/me', null, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('POST', '/api/chat/send', { message: '测试消息_' + round + '_' + user.username, room: 'general' }, user.token).then(r => { r.error ? fail++ : pass++; }));
      promises.push(req('POST', '/api/posts', { title: '测试帖子_' + round + '_' + user.username, content: '压力测试内容', category: 'discussion' }, user.token).then(r => { r.error ? fail++ : pass++; }));
    }
    await Promise.all(promises);
    console.log('第' + (round+1) + '轮: 通过=' + pass + ', 失败=' + fail);
    await sleep(100);
  }

  // 最终统计
  console.log('最终统计:');
  const posts = await req('GET', '/api/posts');
  console.log('帖子总数: ' + (posts.total || 0));
  const equip = await req('GET', '/api/equipment');
  console.log('器材总数: ' + (equip.total || 0));
  const tuts = await req('GET', '/api/tutorials');
  console.log('攻略总数: ' + (tuts.total || 0));
  const chat = await req('GET', '/api/chat/history?room=general&limit=200');
  console.log('聊天消息: ' + (chat.messages ? chat.messages.length : 0));
  
  console.log('测试完成: ' + new Date().toLocaleString());
  console.log('总计: 通过=' + pass + ', 失败=' + fail + ', 总计=' + (pass+fail));
  if (pass+fail > 0) console.log('通过率: ' + (pass/(pass+fail)*100).toFixed(2) + '%');
}

run().catch(console.error);
