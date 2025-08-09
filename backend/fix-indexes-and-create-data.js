const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Import models
const User = require('./src/models/User');
const Event = require('./src/models/Event');

async function fixIndexesAndCreateData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop problematic indexes
    try {
      await User.collection.dropIndex('openid_1');
      console.log('✅ Dropped openid_1 index');
    } catch (error) {
      console.log('ℹ️ openid_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('unionid_1');
      console.log('✅ Dropped unionid_1 index');
    } catch (error) {
      console.log('ℹ️ unionid_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('phone_1');
      console.log('✅ Dropped phone_1 index');
    } catch (error) {
      console.log('ℹ️ phone_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('region_1');
      console.log('✅ Dropped region_1 index');
    } catch (error) {
      console.log('ℹ️ region_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('customId_1');
      console.log('✅ Dropped customId_1 index');
    } catch (error) {
      console.log('ℹ️ customId_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('isActive_1');
      console.log('✅ Dropped isActive_1 index');
    } catch (error) {
      console.log('ℹ️ isActive_1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('lastLoginAt_-1');
      console.log('✅ Dropped lastLoginAt_-1 index');
    } catch (error) {
      console.log('ℹ️ lastLoginAt_-1 index not found or already dropped');
    }

    try {
      await User.collection.dropIndex('createdAt_-1');
      console.log('✅ Dropped createdAt_-1 index');
    } catch (error) {
      console.log('ℹ️ createdAt_-1 index not found or already dropped');
    }

    // Check existing data
    const existingUsers = await User.countDocuments();
    const existingEvents = await Event.countDocuments();
    
    console.log(`📊 Current data: ${existingUsers} users, ${existingEvents} events`);

    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@tennis.com' });
    if (!adminUser) {
      adminUser = new User({
        nickname: '系统管理员',
        email: 'admin@tennis.com',
        password: 'tennis2024',
        role: 'admin',
        status: 'active',
        total_points: 1000,
        ext_info: {
          level: 'professional',
          region: '北京'
        }
      });
      await adminUser.save();
      console.log('✅ Created admin user');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create test users
    const testUsers = [
      {
        nickname: '张三',
        status: 'active',
        total_points: 850,
        ext_info: { level: 'advanced', region: '上海' }
      },
      {
        nickname: '李四',
        status: 'active', 
        total_points: 650,
        ext_info: { level: 'intermediate', region: '广州' }
      },
      {
        nickname: '王五',
        status: 'active',
        total_points: 320,
        ext_info: { level: 'intermediate', region: '深圳' }
      },
      {
        nickname: '赵六',
        status: 'active',
        total_points: 120,
        ext_info: { level: 'beginner', region: '杭州' }
      },
      {
        nickname: '钱七',
        status: 'active',
        total_points: 45,
        ext_info: { level: 'beginner', region: '南京' }
      },
      {
        nickname: '孙八',
        status: 'active',
        total_points: 280,
        ext_info: { level: 'intermediate', region: '成都' }
      },
      {
        nickname: '周九',
        status: 'active',
        total_points: 520,
        ext_info: { level: 'advanced', region: '武汉' }
      },
      {
        nickname: '吴十',
        status: 'active',
        total_points: 95,
        ext_info: { level: 'beginner', region: '西安' }
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ nickname: userData.nickname });
        if (!existingUser) {
          await User.create(userData);
          console.log(`✅ Created user: ${userData.nickname}`);
        } else {
          console.log(`ℹ️ User ${userData.nickname} already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to create user ${userData.nickname}:`, error.message);
      }
    }

    // Create test events if needed
    const currentEventCount = await Event.countDocuments();
    if (currentEventCount < 10) {
      const testEvents = [
        {
          title: '2024年春季网球锦标赛',
          category: 'tennis',
          start_time: new Date('2024-03-15T09:00:00Z'),
          end_time: new Date('2024-03-15T18:00:00Z'),
          location: '北京国家网球中心',
          max_participants: 64,
          status: 'published',
          description: '春季网球锦标赛，欢迎各级别选手参加',
          ext_info: {
            eventType: '男子单打',
            registrationDeadline: '2024-03-01',
            organizer: { name: '北京网球协会' },
            surface: '硬地',
            prizePool: 10000,
            registrationFee: 200
          }
        },
        {
          title: '夏季青少年网球训练营',
          category: 'tennis',
          start_time: new Date('2024-07-01T08:00:00Z'),
          end_time: new Date('2024-07-07T17:00:00Z'),
          location: '上海网球俱乐部',
          max_participants: 32,
          status: 'ongoing',
          description: '为青少年提供专业网球训练',
          ext_info: {
            eventType: '训练营',
            registrationDeadline: '2024-06-15',
            organizer: { name: '上海青少年体育协会' },
            surface: '红土',
            prizePool: 0,
            registrationFee: 800
          }
        },
        {
          title: '企业网球友谊赛',
          category: 'tennis',
          start_time: new Date('2024-09-20T14:00:00Z'),
          end_time: new Date('2024-09-20T18:00:00Z'),
          location: '深圳湾体育中心',
          max_participants: 48,
          status: 'published',
          description: '企业间网球友谊赛，促进交流合作',
          ext_info: {
            eventType: '团体赛',
            registrationDeadline: '2024-09-10',
            organizer: { name: '深圳企业体育联盟' },
            surface: '硬地',
            prizePool: 5000,
            registrationFee: 100
          }
        }
      ];

      for (const eventData of testEvents) {
        try {
          const existingEvent = await Event.findOne({ title: eventData.title });
          if (!existingEvent) {
            await Event.create(eventData);
            console.log(`✅ Created event: ${eventData.title}`);
          } else {
            console.log(`ℹ️ Event ${eventData.title} already exists`);
          }
        } catch (error) {
          console.log(`⚠️ Failed to create event ${eventData.title}:`, error.message);
        }
      }
    }

    // Get final counts
    const finalUsers = await User.countDocuments();
    const finalEvents = await Event.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    
    console.log('📊 Final data:');
    console.log(`   - Total users: ${finalUsers} (${activeUsers} active)`);
    console.log(`   - Total events: ${finalEvents} (${publishedEvents} published)`);
    
    console.log('✅ Data setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixIndexesAndCreateData();