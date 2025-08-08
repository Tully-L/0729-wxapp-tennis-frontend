require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');

async function verifyAdmin() {
  try {
    await connectDB();
    
    // Find admin user
    const admin = await mongoose.connection.db.collection('users').findOne({
      email: 'admin@tennis.com'
    });
    
    if (admin) {
      console.log('✅ Admin account found:');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nickname:', admin.nickname);
      console.log('🎭 Role:', admin.role);
      console.log('📊 Status:', admin.status);
      console.log('🆔 OpenID:', admin.openid);
      console.log('🔑 Has Password:', !!admin.password);
      console.log('📅 Created:', admin.created_at);
    } else {
      console.log('❌ Admin account not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyAdmin();