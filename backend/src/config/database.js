const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const isAtlas = mongoUri.includes('mongodb+srv://');
  
  try {
    let options;
    
    if (isAtlas) {
      // MongoDB Atlas连接选项
      options = {
        maxPoolSize: 10, // 连接池最大连接数
        serverSelectionTimeoutMS: 30000, // 增加服务器选择超时时间到30秒
        socketTimeoutMS: 45000, // Socket超时时间
        connectTimeoutMS: 30000, // 连接超时时间
        bufferCommands: false, // 禁用mongoose缓冲命令
        maxIdleTimeMS: 30000, // 最大空闲时间
        family: 4, // 强制使用IPv4
        retryWrites: true, // 启用重试写入
        w: 'majority' // 写入关注点
      };
      console.log('🔄 Attempting to connect to MongoDB Atlas...');
    } else {
      // 本地MongoDB连接选项
      options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      };
      console.log('🔄 Attempting to connect to local MongoDB...');
    }

    console.log('📍 Connection URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // 应用终止时关闭数据库连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    
    // 在开发环境中，如果MongoDB不可用，我们仍然启动服务器
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ MongoDB connection failed, but server will continue in development mode');
      console.log('💡 Make sure MongoDB is running: mongod --dbpath /path/to/your/db');
    } else {
      console.error('🚨 MongoDB connection failed in production, exiting...');
      process.exit(1);
    }
  }
};

// 检查数据库连接状态
const checkConnection = () => {
  return mongoose.connection.readyState === 1;
};

// 获取数据库统计信息
const getDBStats = async () => {
  try {
    if (!checkConnection()) {
      return { connected: false };
    }

    const stats = await mongoose.connection.db.stats();
    return {
      connected: true,
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return { connected: false, error: error.message };
  }
};

module.exports = { connectDB, checkConnection, getDBStats }; 