// PM2 Ecosystem Configuration for LiveKit Agent
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Save: pm2 save
// Auto-start on reboot: pm2 startup

module.exports = {
  apps: [
    {
      name: 'livekit-agent',
      script: 'livekit_agent.py',
      interpreter: 'python3',
      cwd: '/path/to/your/project',
      env: {
        LIVEKIT_URL: process.env.LIVEKIT_URL || 'wss://gemini-integration-pxcg6ngt.livekit.cloud',
        LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/livekit-agent-error.log',
      out_file: './logs/livekit-agent-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};

