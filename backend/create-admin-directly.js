require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./src/config/database');

async function createAdminDirectly() {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await mongoose.connection.db.collection('users').findOne({
      $or: [
        { email: 'admin@tennis.com' },
        { role: 'super_admin' }
      ]
    });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email || existingAdmin.nickname);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('tennis2024', 12);
    
    // Create admin directly in database
    const adminData = {
      nickname: 'System Administrator',
      email: 'admin@tennis.com',
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      total_points: 0,
      openid: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique openid
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null,
      login_attempts: 0,
      account_locked_until: null,
      ext_info: {
        isSystemAdmin: true,
        createdBy: 'direct-creation-script',
        createdAt: new Date()
      }
    };
    
    const result = await mongoose.connection.db.collection('users').insertOne(adminData);
    
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email: admin@tennis.com');
    console.log('🔑 Password: tennis2024');
    console.log('🆔 Admin ID:', result.insertedId);
    console.log('⚠️  Please change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createAdminDirectly();