# 🚀 网球赛事小程序 - 完整操作步骤

## 📋 当前状态确认
✅ **所有代码已完成并准备就绪**
- 数据库模型重构完成
- 后端API适配完成  
- 前端兼容性处理完成
- 数据格式适配层实现完成

## 🎯 操作目标
确保用户登录后看到的页面与当前展示**完全一致**，包括：
- 页面布局和排版风格
- 数据显示格式
- 所有视觉元素（颜色、字体、图标）

---

## 📝 第一步：数据库备份（必须先做）

### Windows PowerShell 命令：
```powershell
# 1. 创建备份目录
mkdir backup -ErrorAction SilentlyContinue

# 2. 生成时间戳
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 3. 备份数据库（如果MongoDB已安装）
mongodump --db tennis_heat --out "./backup/$timestamp"

# 4. 验证备份文件
dir ./backup/
```

### 如果mongodump命令不存在：
```powershell
# 选项1：安装MongoDB工具
# 下载MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools

# 选项2：使用MongoDB Compass导出数据
# 打开MongoDB Compass -> 连接数据库 -> 导出集合

# 选项3：跳过备份（仅用于测试环境）
echo "⚠️ 警告：跳过数据库备份，仅适用于测试环境"
```

**⚠️ 重要：** 在进行任何操作前，必须先完成数据库备份！

---

## 🔧 第二步：后端环境准备

### 2.1 安装依赖
```bash
cd backend
npm install
```

### 2.2 检查环境配置
```bash
# 检查.env文件是否存在
ls -la .env

# 验证关键配置项
cat .env | grep -E "(MONGODB_URI|JWT_SECRET|WECHAT_)"
```

### 2.3 验证数据库连接
```bash
# 测试数据库连接
node -e "
const { connectDB } = require('./src/config/database');
connectDB().then(() => {
  console.log('✅ 数据库连接成功');
  process.exit(0);
}).catch(err => {
  console.error('❌ 数据库连接失败:', err.message);
  process.exit(1);
});
"
```

---

## 🗄️ 第三步：数据库迁移

### 3.1 运行迁移脚本
```bash
cd backend
node src/migrations/migrate-to-new-structure.js
```

### 3.2 验证迁移结果
```bash
# 验证新集合是否创建成功
node -e "
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');

connectDB().then(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  const requiredCollections = ['users', 'userauths', 'events', 'usereventrelations', 'pointsrecords'];
  const missing = requiredCollections.filter(name => !collectionNames.includes(name));
  
  if (missing.length === 0) {
    console.log('✅ 所有必需的集合都已创建');
  } else {
    console.log('❌ 缺少集合:', missing);
  }
  
  process.exit(0);
}).catch(console.error);
"
```

---

## 🚀 第四步：启动后端服务

### 4.1 启动服务器
```bash
cd backend
npm start
```

### 4.2 验证服务状态
```bash
# 在新的终端窗口中测试
curl http://localhost:3000/health

# 测试事件列表API
curl http://localhost:3000/api/events
```

**期望结果：**
- 健康检查返回 `{"status": "ok"}`
- 事件API返回包含格式化数据的JSON响应

---

## 📱 第五步：前端部署

### 5.1 微信开发者工具操作
1. **打开项目**
   - 启动微信开发者工具
   - 选择项目目录：`d:\0711-tennis-wxapp\frontend`

2. **检查代码**
   - 确认无编译错误
   - 检查控制台无报错信息

3. **配置后端地址**
   - 检查 `frontend/utils/api.js` 中的 `BASE_URL`
   - 确保指向正确的后端服务地址

### 5.2 本地测试
1. **模拟器测试**
   - 在微信开发者工具中预览
   - 测试事件列表页面显示
   - 测试用户页面显示

2. **真机测试**
   - 生成预览二维码
   - 用微信扫码测试

---

## 🎨 第六步：前端样式一致性验证

### 6.1 关键检查点
- [ ] **事件列表页面**
  - 事件卡片样式与当前完全一致
  - 事件状态显示正确（published → "报名中"）
  - 日期格式显示正确
  - 参与者数量显示正确

- [ ] **事件详情页面**
  - 页面布局保持不变
  - 所有信息字段正确显示
  - 报名按钮功能正常

- [ ] **用户个人页面**
  - 头像和用户信息区域不变
  - M豆、优惠券、赛事数量显示正确
  - 功能快捷入口保持原样

- [ ] **整体视觉效果**
  - 所有图标、颜色、字体保持原样
  - 页面交互效果与当前相同
  - 无任何视觉差异

### 6.2 数据格式验证
- [ ] 事件标题显示：`item.title || item.name`
- [ ] 事件类型显示：`item.category || item.ext_info.eventType`
- [ ] 参与者数量：`item.currentParticipants || 0`
- [ ] 用户积分显示：`userStats.totalPoints`（不是etaPoints）

---

## 🧪 第七步：功能测试

### 7.1 用户登录流程
1. 微信授权登录
2. 获取用户信息
3. 显示用户统计数据

### 7.2 事件操作流程
1. 浏览事件列表
2. 查看事件详情
3. 报名/取消报名
4. 签到功能

### 7.3 数据一致性检查
1. 用户积分计算正确
2. 事件参与者统计准确
3. 用户等级显示正确

---

## 🔍 第八步：问题排查

### 8.1 常见问题及解决方案

**问题1：后端启动失败**
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 检查MongoDB连接
mongo --eval "db.runCommand('ping')"
```

**问题2：前端数据显示异常**
- 检查API返回的数据格式
- 验证前端字段映射是否正确
- 确认兼容性字段是否提供

**问题3：样式显示不一致**
- 确认CSS文件未被修改
- 检查数据绑定表达式
- 验证条件渲染逻辑

### 8.2 调试工具
```bash
# 查看API返回数据格式
curl -s http://localhost:3000/api/events | jq '.'

# 测试数据格式验证
node frontend-backend-format-test.js
```

---

## ✅ 第九步：部署完成确认

### 9.1 最终检查清单
- [ ] 数据库迁移成功
- [ ] 后端服务正常运行
- [ ] 前端代码无报错
- [ ] 所有页面样式与当前一致
- [ ] 用户登录流程正常
- [ ] 事件操作功能正常
- [ ] 数据显示格式正确

### 9.2 用户体验验证
- [ ] 用户登录后看到的页面与当前展示完全一致
- [ ] 所有数据显示格式与模拟数据相同
- [ ] 页面加载速度正常
- [ ] 所有功能操作流程保持不变

---

## 🎉 完成！

当所有检查项都通过后，您的网球赛事小程序就已经成功升级到新的数据库结构，同时保持了完全一致的用户体验！

**关键成果：**
- ✅ 数据库结构完全重构并优化
- ✅ 前端样式和用户体验完全保持不变
- ✅ 后端API与前端期望格式完美匹配
- ✅ 为未来功能扩展奠定了坚实基础

如果在任何步骤中遇到问题，请参考问题排查部分或寻求技术支持。
