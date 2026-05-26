module.exports = {
  apps: [
    {
      name: 'kirana-server',
      script: './server.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        MONGODB_URI: 'your-production-mongo-uri',
        JWT_SECRET: 'your-jwt-secret',
        FRONTEND_URL: 'https://yourdomain.com'
      }
    }
  ]
};
