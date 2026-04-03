module.exports = {
  apps: [{
    name: 'phototool-api',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      PORT: 3001,
      NODE_ENV: 'production'
    }
  }]
};
