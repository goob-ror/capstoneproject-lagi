module.exports = {
  apps: [{
    name: 'ibundacare',
    script: 'server/server.js',
    node_args: '--max-old-space-size=256',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
