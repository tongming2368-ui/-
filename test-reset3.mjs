import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': d.length }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ raw: body.substring(0, 200) }); }
      });
    });
    req.on('error', reject);
    req.write(d);
    req.end();
  });
}

async function test() {
  const s = await post('/api/auth/send-code', { email: 'hxmpost@qq.com', type: 'reset' });
  console.log('Send:', JSON.stringify(s));
  if (s.code) {
    const r = await post('/api/auth/reset-password', { email: 'hxmpost@qq.com', verifyCode: s.code, newPassword: 'test123456' });
    console.log('Reset:', JSON.stringify(r));
  }
}

test();
