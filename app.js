#!/usr/bin/env node

// نظام قرطبة للتوريدات - Qortoba Supplies System
// تشغيل بسيط: node app.js أو pm2 start app.js

require('child_process').spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

console.log('✅ النظام يعمل على: http://localhost:5000');