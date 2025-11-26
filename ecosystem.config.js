const path = require('path');

module.exports = {
  apps: [
    {
      name: 'kaizen-backend',
      script: path.join(__dirname, 'node-backend', 'dist', 'server.js'),
      cwd: path.join(__dirname, 'node-backend'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: path.join(__dirname, 'logs', 'backend-error.log'),
      out_file: path.join(__dirname, 'logs', 'backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};

