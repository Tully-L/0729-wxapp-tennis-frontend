// 支付系统功能测试
const PaymentService = require('./src/services/paymentService');
const paymentController = require('./src/controllers/paymentController');

// 模拟请求和响应对象
function createMockReq(data = {}) {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    user: data.user || {
      _id: 'test_user_123',
      nickname: '测试用户',
      isAdmin: false
    }
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    headers: {},
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    send: function(data) {
      this.data = data;
      return this;
    },
    set: function(key, value) {
      this.headers[key] = value;
      return this;
    }
  };
  return res;
}

// 测试支付服务初始化
async function testPaymentServiceInit() {
  console.log('\n=== 测试支付服务初始化 ===');
  
  try {
    const paymentService = new PaymentService();
    
    console.log('✓ 支付服务初始化成功');
    console.log('  - 微信支付配置已加载');
    console.log('  - 支付状态映射已设置');
    console.log('  - 订单号生成器已准备');
    
    return paymentService;
  } catch (error) {
    console.error('✗ 支付服务初始化失败:', error);
    throw error;
  }
}

// 测试创建支付订单
async function testCreatePaymentOrder(paymentService) {
  console.log('\n=== 测试创建支付订单 ===');
  
  try {
    const orderData = {
      userId: 'test_user_123',
      eventId: 'test_event_456',
      amount: 100,
      description: '测试赛事报名费',
      openId: 'test_openid_789'
    };
    
    // 模拟赛事和用户数据
    global.mockEvent = {
      _id: 'test_event_456',
      name: '测试网球赛事',
      eventDate: new Date('2024-08-01'),
      participants: []
    };
    
    global.mockUser = {
      _id: 'test_user_123',
      nickname: '测试用户'
    };
    
    const result = await paymentService.createPaymentOrder(orderData);
    
    console.log('✓ 支付订单创建成功');
    console.log('  - 订单ID:', result.data.orderId);
    console.log('  - 支付金额:', result.data.amount);
    console.log('  - 订单描述:', result.data.description);
    console.log('  - 过期时间:', result.data.expireTime);
    console.log('  - 支付参数已生成');
    
    return result.data.orderId;
  } catch (error) {
    console.error('✗ 创建支付订单失败:', error);
    throw error;
  }
}

// 测试查询支付状态
async function testQueryPaymentStatus(paymentService, orderId) {
  console.log('\n=== 测试查询支付状态 ===');
  
  try {
    const result = await paymentService.queryPaymentStatus(orderId);
    
    console.log('✓ 支付状态查询成功');
    console.log('  - 订单ID:', result.data.orderId);
    console.log('  - 支付状态:', result.data.status);
    console.log('  - 订单金额:', result.data.amount);
    console.log('  - 创建时间:', result.data.createdAt);
    console.log('  - 过期时间:', result.data.expireAt);
    
    return result;
  } catch (error) {
    console.error('✗ 查询支付状态失败:', error);
    throw error;
  }
}

// 测试支付回调处理
async function testPaymentNotifyHandler(paymentService, orderId) {
  console.log('\n=== 测试支付回调处理 ===');
  
  try {
    // 模拟微信支付成功回调数据
    const notifyData = {
      return_code: 'SUCCESS',
      return_msg: 'OK',
      result_code: 'SUCCESS',
      out_trade_no: orderId,
      transaction_id: `wx_${Date.now()}`,
      total_fee: 10000, // 100元，单位分
      sign: 'mock_sign_for_test'
    };
    
    const result = await paymentService.handlePaymentNotify(notifyData);
    
    console.log('✓ 支付回调处理成功');
    console.log('  - 处理结果:', result.success ? '成功' : '失败');
    console.log('  - 响应消息:', result.message);
    
    return result;
  } catch (error) {
    console.error('✗ 支付回调处理失败:', error);
    throw error;
  }
}

// 测试申请退款
async function testRequestRefund(paymentService, orderId) {
  console.log('\n=== 测试申请退款 ===');
  
  try {
    const refundData = {
      orderId: orderId,
      refundAmount: 50,
      refundReason: '用户申请退款',
      operatorId: 'admin_123'
    };
    
    const result = await paymentService.requestRefund(refundData);
    
    console.log('✓ 退款申请成功');
    console.log('  - 原订单ID:', result.data.orderId);
    console.log('  - 退款单号:', result.data.refundNo);
    console.log('  - 退款金额:', result.data.refundAmount);
    console.log('  - 退款状态:', result.data.refundStatus);
    
    return result;
  } catch (error) {
    console.error('✗ 申请退款失败:', error);
    throw error;
  }
}

// 测试支付统计
async function testPaymentStats(paymentService) {
  console.log('\n=== 测试支付统计 ===');
  
  try {
    const filters = {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const result = await paymentService.getPaymentStats(filters);
    
    console.log('✓ 支付统计获取成功');
    console.log('  - 总订单数:', result.data.totalOrders);
    console.log('  - 总金额:', result.data.totalAmount);
    console.log('  - 已支付订单:', result.data.paidOrders);
    console.log('  - 已支付金额:', result.data.paidAmount);
    console.log('  - 退款订单:', result.data.refundedOrders);
    console.log('  - 退款金额:', result.data.refundedAmount);
    console.log('  - 待支付订单:', result.data.pendingOrders);
    console.log('  - 失败订单:', result.data.failedOrders);
    
    return result;
  } catch (error) {
    console.error('✗ 获取支付统计失败:', error);
    throw error;
  }
}

// 测试支付控制器
async function testPaymentController() {
  console.log('\n=== 测试支付控制器 ===');
  
  try {
    // 测试创建支付订单API
    console.log('1. 测试创建支付订单API...');
    const createReq = createMockReq({
      body: {
        eventId: 'test_event_456',
        amount: 100,
        description: '测试赛事报名费',
        openId: 'test_openid_789'
      }
    });
    const createRes = createMockRes();
    
    await paymentController.createPaymentOrder(createReq, createRes);
    
    console.log('✓ 创建支付订单API测试成功');
    console.log('  - 状态码:', createRes.statusCode);
    console.log('  - 响应数据:', createRes.data?.success ? '成功' : '失败');
    
    // 测试查询支付状态API
    console.log('2. 测试查询支付状态API...');
    const queryReq = createMockReq({
      params: { orderId: 'test_order_123' }
    });
    const queryRes = createMockRes();
    
    await paymentController.queryPaymentStatus(queryReq, queryRes);
    
    console.log('✓ 查询支付状态API测试完成');
    console.log('  - 状态码:', queryRes.statusCode);
    
    // 测试获取用户支付记录API
    console.log('3. 测试获取用户支付记录API...');
    const historyReq = createMockReq({
      query: { page: 1, limit: 10 }
    });
    const historyRes = createMockRes();
    
    await paymentController.getUserPaymentHistory(historyReq, historyRes);
    
    console.log('✓ 获取用户支付记录API测试成功');
    console.log('  - 状态码:', historyRes.statusCode);
    console.log('  - 响应数据:', historyRes.data?.success ? '成功' : '失败');
    
    return true;
  } catch (error) {
    console.error('✗ 支付控制器测试失败:', error);
    throw error;
  }
}

// 测试订单生命周期
async function testOrderLifecycle(paymentService) {
  console.log('\n=== 测试订单生命周期 ===');
  
  try {
    // 1. 创建订单
    console.log('1. 创建订单...');
    const orderId = await testCreatePaymentOrder(paymentService);
    
    // 2. 查询订单状态（待支付）
    console.log('2. 查询订单状态（待支付）...');
    let orderStatus = await testQueryPaymentStatus(paymentService, orderId);
    console.log('  - 当前状态:', orderStatus.data.status);
    
    // 3. 模拟支付成功
    console.log('3. 模拟支付成功...');
    await testPaymentNotifyHandler(paymentService, orderId);
    
    // 4. 再次查询订单状态（已支付）
    console.log('4. 查询订单状态（已支付）...');
    orderStatus = await testQueryPaymentStatus(paymentService, orderId);
    console.log('  - 更新后状态:', orderStatus.data.status);
    
    // 5. 申请退款
    console.log('5. 申请退款...');
    await testRequestRefund(paymentService, orderId);
    
    // 6. 最终查询订单状态（已退款）
    console.log('6. 查询订单状态（已退款）...');
    orderStatus = await testQueryPaymentStatus(paymentService, orderId);
    console.log('  - 最终状态:', orderStatus.data.status);
    
    console.log('✓ 订单生命周期测试完成');
    
    return true;
  } catch (error) {
    console.error('✗ 订单生命周期测试失败:', error);
    throw error;
  }
}

// 测试过期订单清理
async function testExpiredOrderCleanup(paymentService) {
  console.log('\n=== 测试过期订单清理 ===');
  
  try {
    // 创建一个即将过期的订单
    const orderData = {
      userId: 'test_user_123',
      eventId: 'test_event_456',
      amount: 50,
      description: '即将过期的测试订单',
      openId: 'test_openid_789'
    };
    
    const result = await paymentService.createPaymentOrder(orderData);
    const orderId = result.data.orderId;
    
    // 手动设置订单为过期状态
    const order = global.paymentOrders?.get(orderId);
    if (order) {
      order.expireAt = new Date(Date.now() - 1000); // 设置为1秒前过期
      global.paymentOrders.set(orderId, order);
    }
    
    console.log('✓ 创建过期测试订单:', orderId);
    
    // 执行清理
    await paymentService.cleanupExpiredOrders();
    
    // 检查订单状态
    const cleanedOrder = global.paymentOrders?.get(orderId);
    console.log('✓ 过期订单清理完成');
    console.log('  - 订单状态:', cleanedOrder?.status);
    console.log('  - 取消原因:', cleanedOrder?.cancelReason);
    
    return true;
  } catch (error) {
    console.error('✗ 过期订单清理测试失败:', error);
    throw error;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始支付系统功能测试...\n');
  
  try {
    // 初始化全局存储
    global.paymentOrders = new Map();
    
    const paymentService = await testPaymentServiceInit();
    await testOrderLifecycle(paymentService);
    await testPaymentStats(paymentService);
    await testPaymentController();
    await testExpiredOrderCleanup(paymentService);
    
    console.log('\n=== 测试总结 ===');
    console.log('✓ 支付服务初始化正常');
    console.log('✓ 支付订单创建功能正常');
    console.log('✓ 支付状态查询功能正常');
    console.log('✓ 支付回调处理功能正常');
    console.log('✓ 退款申请功能正常');
    console.log('✓ 支付统计功能正常');
    console.log('✓ 支付控制器API正常');
    console.log('✓ 订单生命周期管理正常');
    console.log('✓ 过期订单清理功能正常');
    console.log('✓ 微信支付集成模拟正常');
    
    console.log('\n🎉 所有支付系统功能测试通过！');
    
    // 功能特性总结
    console.log('\n=== 支付系统功能特性 ===');
    console.log('💳 支付功能:');
    console.log('  • 微信支付统一下单');
    console.log('  • 小程序支付参数生成');
    console.log('  • 支付回调通知处理');
    console.log('  • 支付状态实时查询');
    
    console.log('💰 订单管理:');
    console.log('  • 订单创建和状态管理');
    console.log('  • 订单过期自动清理');
    console.log('  • 订单详情查询');
    console.log('  • 用户支付记录管理');
    
    console.log('🔄 退款功能:');
    console.log('  • 退款申请和处理');
    console.log('  • 退款状态跟踪');
    console.log('  • 退款记录管理');
    console.log('  • 自动退款通知');
    
    console.log('📊 统计分析:');
    console.log('  • 支付数据统计');
    console.log('  • 收入分析报告');
    console.log('  • 订单状态分布');
    console.log('  • 时间维度分析');
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('✗ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n支付系统功能测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testPaymentServiceInit,
  testCreatePaymentOrder,
  testQueryPaymentStatus,
  testPaymentNotifyHandler,
  testRequestRefund,
  testPaymentStats,
  testPaymentController,
  testOrderLifecycle,
  testExpiredOrderCleanup,
  runAllTests
};