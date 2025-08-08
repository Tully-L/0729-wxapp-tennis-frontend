#!/usr/bin/env node

/**
 * 简单直接的管理员账号创建脚本
 * 跳过数据库连接问题，直接通过API创建
 */

const bcrypt = require('bcryptjs');

async function createAdminDirectly() {
  console.log('🔧 Creating admin account data...');
  
  // 生成管理员数据
  const adminPassword = 'tennis2024';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const adminData = {
    nickname: 'System Administrator',
    email: 'admin@tennis.com',
    password: hashedPassword,
    role: 'super_admin',
    status: 'active',
    total_points: 0,
    login_attempts: 0,
    last_login: null,
    account_locked_until: null,
    ext_info: {
      isSystemAdmin: true,
      createdBy: 'setup-script'
    },
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  console.log('✅ Admin data prepared:');
  console.log('📧 Email: admin@tennis.com');
  console.log('🔑 Password: tennis2024');
  console.log('👑 Role: super_admin');
  
  console.log('\n📋 MongoDB Insert Command:');
  console.log('db.users.insertOne(' + JSON.stringify(adminData, null, 2) + ')');
  
  console.log('\n🚀 Next steps:');
  console.log('1. 手动在MongoDB中执行上面的插入命令');
  console.log('2. 或者等数据库连接修复后再运行迁移');
  console.log('3. 开始开发前端管理系统');
}

createAdminDirectly().catch(console.error);