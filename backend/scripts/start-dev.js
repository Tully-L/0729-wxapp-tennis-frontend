#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tennis Heat Backend in Development Mode...\n');

// 检查环境变量
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_here') {
  console.log('⚠️  Warning: JWT_SECRET is not set or using default value');
  console.log('💡 Please update your .env file with a secure JWT secret\n');
}

if (!process.env.MONGODB_URI) {
  console.log('⚠️  Warning: MONGODB_URI is not set');
  console.log('💡 Using default: mongodb://localhost:27017/tennis_heat\n');
}

// 启动nodemon
const nodemon = spawn('nodemon', ['src/app.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

nodemon.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
});

nodemon.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nodemon.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  nodemon.kill('SIGTERM');
});