module.exports = {
  apps: [
    {
      name: 'hash-visualizer',
      script: './deploy/start.sh',
      interpreter: 'bash',
      cwd: '/home/ubuntu/Work/www/hash',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOST: '0.0.0.0',
      },
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
    },
  ],
};
