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

// We need to read the code from logs since it's not returned in the API
import { exec } from 'child_process';

function execPromise(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => resolve(stdout));
  });
}

async function test() {
  // Step 1: Send code
  const send = await post('/api/auth/send-code', { email: 'hxmpost@qq.com', type: 'reset' });
  console.log('Send:', JSON.stringify(send));

  // Wait for log
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Read code from logs
  const log = await execPromise('tail -3 /tmp/server.log');
  console.log('Log:', log.trim());

  const match = log.match(/验证码:\s*(\d+)/);
  if (match) {
    const code = match[1];
    console.log('Code:', code);

    // Step 3: Reset password
    const reset = await post('/api/auth/reset-password', {
      email: 'hxmpost@qq.com',
      verifyCode: code,
      newPassword: 'test123456'
    });
    console.log('Reset:', JSON.stringify(reset));
  } else {
    console.log('Could not find code in logs');
  }
}

test();
