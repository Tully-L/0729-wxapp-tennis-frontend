#!/usr/bin/env node

/**
 * Migration script to add admin-specific fields to existing User documents
 * This script safely updates existing users with new admin fields while preserving existing data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');

async function migrateUserAdminFields() {
  try {
    console.log('🚀 Starting User model migration for admin fields...');

    // Get count of users that need migration
    const usersNeedingMigration = await User.countDocuments({
      $or: [
        { role: { $exists: false } },
        { email: { $exists: false } },
        { last_login: { $exists: false } },
        { login_attempts: { $exists: false } },
        { account_locked_until: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${usersNeedingMigration} users that need migration`);

    if (usersNeedingMigration === 0) {
      console.log('✅ No users need migration. All users already have admin fields.');
      return;
    }

    // Update users in batches to add missing admin fields
    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { email: { $exists: false } },
          { last_login: { $exists: false } },
          { login_attempts: { $exists: false } },
          { account_locked_until: { $exists: false } }
        ]
      },
      {
        $set: {
          role: 'user', // Default role for existing users
          login_attempts: 0,
          last_login: null,
          account_locked_until: null
        },
        $setOnInsert: {
          email: null // Only set if field doesn't exist
        }
      },
      { 
        upsert: false,
        multi: true 
      }
    );

    console.log(`✅ Successfully migrated ${result.modifiedCount} users`);

    // Verify migration
    const verificationCount = await User.countDocuments({
      role: { $exists: true },
      login_attempts: { $exists: true }
    });

    console.log(`🔍 Verification: ${verificationCount} users now have admin fields`);

    // Show sample of migrated users (without sensitive data)
    const sampleUsers = await User.find({})
      .limit(3)
      .select('nickname role status created_at email')
      .lean();

    console.log('📋 Sample migrated users:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.nickname}: role=${user.role}, status=${user.status}, email=${user.email || 'null'}`);
    });

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Create initial super admin if it doesn't exist
async function createInitialSuperAdmin() {
  try {
    console.log('👑 Checking for super admin account...');

    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists:', existingSuperAdmin.email || existingSuperAdmin.nickname);
      return;
    }

    console.log('🔧 Creating initial super admin account...');

    const superAdmin = new User({
      nickname: 'System Administrator',
      email: 'admin@tennis.com',
      password: 'tennis2024', // Will be hashed by pre-save hook
      role: 'super_admin',
      status: 'active',
      total_points: 0,
      openid: `admin_${Date.now()}`, // Add unique openid to avoid conflict
      ext_info: {
        isSystemAdmin: true,
        createdBy: 'migration-script',
        createdAt: new Date()
      }
    });

    await superAdmin.save();
    
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email: admin@tennis.com');
    console.log('🔑 Password: tennis2024');
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Connect to database once for all operations
    await connectDB();
    console.log('✅ Connected to MongoDB for all operations');
    
    // Run migration tasks
    await migrateUserAdminFields();
    await createInitialSuperAdmin();
    
    console.log('\n🎉 All migration tasks completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test admin login with: admin@tennis.com / tennis2024');
    console.log('2. Change the default admin password');
    console.log('3. Create additional admin accounts as needed');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migrateUserAdminFields,
  createInitialSuperAdmin
};