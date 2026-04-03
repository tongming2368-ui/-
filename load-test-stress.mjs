import http from 'http';

const BASE = { hostname: 'localhost', port: 3001 };

function request(method, path, data, token) {
  return new Promise((resolve) => {
    const opts = { ...BASE, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ raw: body.substring(0, 100) }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  // Login
  const login = await request('POST', '/api/auth/login', { username: 'stressuser', password: 'test123' });
  if (!login.token) {
    console.log('Login failed:', login.error);
    return;
  }
  console.log('Login OK:', login.user.username);

  let pass = 0, fail = 0;

  // Run 100 requests
  for (let i = 0; i < 100; i++) {
    const ops = [
      request('GET', '/api/posts', null, login.token),
      request('GET', '/api/equipment', null, login.token),
      request('GET', '/api/tutorials', null, login.token),
      request('GET', '/api/deals', null, login.token),
      request('GET', '/api/chat/history?room=general&limit=5', null, login.token),
      request('POST', '/api/users/signin', {}, login.token),
      request('GET', '/api/auth/me', null, login.token),
      request('POST', '/api/chat/send', { message: 'Test message ' + i, room: 'general' }, login.token),
    ];
    
    if (i % 10 === 0) {
      ops.push(request('POST', '/api/posts', { title: 'Test post ' + i, content: 'Test content', category: 'discussion' }, login.token));
    }
    
    const results = await Promise.all(ops);
    results.forEach(r => { r.error ? fail++ : pass++; });
    
    if (i % 20 === 0) {
      console.log('Round ' + i + ': pass=' + pass + ', fail=' + fail);
    }
  }

  // Final stats
  const posts = await request('GET', '/api/posts');
  const equip = await request('GET', '/api/equipment');
  const tuts = await request('GET', '/api/tutorials');
  const chat = await request('GET', '/api/chat/history?room=general&limit=200');

  console.log('\nFinal: pass=' + pass + ', fail=' + fail + ', total=' + (pass + fail));
  console.log('Pass rate:', (pass / (pass + fail) * 100).toFixed(2) + '%');
  console.log('Posts:', posts.total || 0, '| Equipment:', equip.total || 0, '| Tutorials:', tuts.total || 0, '| Chat messages:', chat.messages?.length || 0);
}

runTest();
