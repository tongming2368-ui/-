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
  // Step 1: Send reset code
  const send = await post('/api/auth/send-code', { email: 'hxmpost@qq.com', type: 'reset' });
  console.log('Send:', JSON.stringify(send));
  
  if (send.code) {
    // Step 2: Reset password
    const reset = await post('/api/auth/reset-password', { email: 'hxmpost@qq.com', verifyCode: send.code, newPassword: 'test123456' });
    console.log('Reset:', JSON.stringify(reset));
  }
}

test();
