require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');

async function checkUserSchema() {
  try {
    await connectDB();
    
    // Get existing users to see their structure
    const users = await mongoose.connection.db.collection('users').find({}).limit(3).toArray();
    console.log('📋 Sample existing users:');
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, JSON.stringify(user, null, 2));
    });
    
    // Check indexes
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('\n📊 Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserSchema();