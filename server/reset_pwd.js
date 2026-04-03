
const bcrypt = require('./node_modules/bcryptjs');
const db = require('./db.js');
const hash = bcrypt.hashSync('ceshi123', 10);
const result = db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, '2757896254@qq.com');
console.log('Updated:', result.changes, 'rows');
