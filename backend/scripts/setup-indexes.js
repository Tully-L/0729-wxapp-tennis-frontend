const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 设置用户集合索引
async function setupUserIndexes() {
  console.log('🔧 设置用户集合索引...');
  
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  
  try {
    // 复合索引：状态和删除标记
    await usersCollection.createIndex(
      { status: 1, is_deleted: 1 },
      { name: 'status_deleted_idx' }
    );
    
    // 积分排序索引
    await usersCollection.createIndex(
      { total_points: -1 },
      { name: 'points_desc_idx' }
    );
    
    // 创建时间索引
    await usersCollection.createIndex(
      { created_at: -1 },
      { name: 'created_desc_idx' }
    );
    
    // 昵称文本搜索索引
    await usersCollection.createIndex(
      { nickname: 'text' },
      { name: 'nickname_text_idx' }
    );
    
    console.log('✅ 用户集合索引设置完成');
    
  } catch (error) {
    console.error('❌ 用户集合索引设置失败:', error);
  }
}

// 设置用户认证集合索引
async function setupUserAuthIndexes() {
  console.log('🔧 设置用户认证集合索引...');
  
  const db = mongoose.connection.db;
  const userAuthsCollection = db.collection('userauths');
  
  try {
    // 唯一复合索引：认证类型、认证ID和删除标记
    await userAuthsCollection.createIndex(
      { auth_type: 1, auth_id: 1, is_deleted: 1 },
      { unique: true, name: 'auth_unique_idx' }
    );
    
    // 用户ID索引
    await userAuthsCollection.createIndex(
      { user_id: 1 },
      { name: 'user_id_idx' }
    );
    
    // 过期时间索引
    await userAuthsCollection.createIndex(
      { expired_at: 1 },
      { name: 'expired_at_idx', sparse: true }
    );
    
    console.log('✅ 用户认证集合索引设置完成');
    
  } catch (error) {
    console.error('❌ 用户认证集合索引设置失败:', error);
  }
}

// 设置赛事集合索引
async function setupEventIndexes() {
  console.log('🔧 设置赛事集合索引...');
  
  const db = mongoose.connection.db;
  const eventsCollection = db.collection('events');
  
  try {
    // 文本搜索索引
    await eventsCollection.createIndex(
      { title: 'text', description: 'text', location: 'text' },
      { name: 'event_text_idx' }
    );
    
    // 复合索引：开始时间和状态
    await eventsCollection.createIndex(
      { start_time: 1, status: 1 },
      { name: 'start_time_status_idx' }
    );
    
    // 复合索引：状态和删除标记
    await eventsCollection.createIndex(
      { status: 1, is_deleted: 1 },
      { name: 'status_deleted_idx' }
    );
    
    // 分类索引
    await eventsCollection.createIndex(
      { category: 1 },
      { name: 'category_idx' }
    );
    
    // 创建时间索引
    await eventsCollection.createIndex(
      { created_at: -1 },
      { name: 'created_desc_idx' }
    );
    
    console.log('✅ 赛事集合索引设置完成');
    
  } catch (error) {
    console.error('❌ 赛事集合索引设置失败:', error);
  }
}

// 设置用户赛事关联集合索引
async function setupUserEventRelationIndexes() {
  console.log('🔧 设置用户赛事关联集合索引...');
  
  const db = mongoose.connection.db;
  const relationsCollection = db.collection('usereventrelations');
  
  try {
    // 唯一复合索引：用户ID、赛事ID和删除标记
    await relationsCollection.createIndex(
      { user_id: 1, event_id: 1, is_deleted: 1 },
      { unique: true, name: 'user_event_unique_idx' }
    );
    
    // 复合索引：赛事ID和报名状态
    await relationsCollection.createIndex(
      { event_id: 1, signup_status: 1 },
      { name: 'event_signup_status_idx' }
    );
    
    // 复合索引：用户ID和报名时间
    await relationsCollection.createIndex(
      { user_id: 1, signup_time: -1 },
      { name: 'user_signup_time_idx' }
    );
    
    // 签到时间索引
    await relationsCollection.createIndex(
      { signin_time: -1 },
      { name: 'signin_time_idx', sparse: true }
    );
    
    console.log('✅ 用户赛事关联集合索引设置完成');
    
  } catch (error) {
    console.error('❌ 用户赛事关联集合索引设置失败:', error);
  }
}

// 设置积分记录集合索引
async function setupPointsRecordIndexes() {
  console.log('🔧 设置积分记录集合索引...');
  
  const db = mongoose.connection.db;
  const pointsCollection = db.collection('pointsrecords');
  
  try {
    // 复合索引：用户ID和创建时间
    await pointsCollection.createIndex(
      { user_id: 1, created_at: -1 },
      { name: 'user_created_idx' }
    );
    
    // 赛事ID索引
    await pointsCollection.createIndex(
      { event_id: 1 },
      { name: 'event_id_idx' }
    );
    
    // 创建时间索引
    await pointsCollection.createIndex(
      { created_at: -1 },
      { name: 'created_desc_idx' }
    );
    
    console.log('✅ 积分记录集合索引设置完成');
    
  } catch (error) {
    console.error('❌ 积分记录集合索引设置失败:', error);
  }
}

// 主函数
async function setupIndexes() {
  console.log('🚀 开始设置数据库索引...');
  
  await connectDB();
  
  try {
    await setupUserIndexes();
    await setupUserAuthIndexes();
    await setupEventIndexes();
    await setupUserEventRelationIndexes();
    await setupPointsRecordIndexes();
    
    console.log('\n🎉 所有索引设置完成！');
    
    // 显示索引信息
    await showIndexInfo();
    
  } catch (error) {
    console.error('❌ 索引设置过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 显示索引信息
async function showIndexInfo() {
  console.log('\n📊 索引信息统计:');
  
  const db = mongoose.connection.db;
  const collections = ['users', 'userauths', 'events', 'usereventrelations', 'pointsrecords'];
  
  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`\n📋 ${collectionName} 集合索引 (${indexes.length}个):`);
      
      indexes.forEach(index => {
        const keys = Object.keys(index.key).map(key => 
          `${key}:${index.key[key]}`
        ).join(', ');
        console.log(`  - ${index.name}: {${keys}}`);
      });
      
    } catch (error) {
      console.log(`  ⚠️ ${collectionName} 集合不存在或无法访问`);
    }
  }
}

// 运行索引设置
if (require.main === module) {
  setupIndexes();
}

module.exports = { setupIndexes };
