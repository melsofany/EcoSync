// تكوين PM2 لنظام قرطبة للتوريدات
module.exports = {
  apps: [{
    name: 'قرطبة',
    script: 'npm',
    args: 'run dev',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};