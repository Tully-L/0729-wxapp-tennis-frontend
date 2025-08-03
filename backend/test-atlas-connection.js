require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 正在连接MongoDB Atlas...');
    console.log('📍 连接URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      bufferCommands: false,
      maxIdleTimeMS: 30000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB Atlas连接成功!');
    console.log('📊 数据库名称:', mongoose.connection.name);
    console.log('🌐 连接主机:', mongoose.connection.host);
    
    // 测试创建一个简单的集合
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'Hello Atlas!', timestamp: new Date() });
    console.log('✅ 测试数据写入成功!');
    
    // 读取测试数据
    const testDoc = await testCollection.findOne({ test: 'Hello Atlas!' });
    console.log('✅ 测试数据读取成功:', testDoc.test);
    
    // 清理测试数据
    await testCollection.deleteOne({ test: 'Hello Atlas!' });
    console.log('✅ 测试数据清理完成!');
    
    console.log('\n🎉 Atlas数据库连接和操作测试全部通过!');
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
  }
}

testConnection();
