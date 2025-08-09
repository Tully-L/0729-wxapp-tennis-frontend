# 🚀 Netlify部署步骤 - Tennis Admin System

## ✅ 构建已完成
前端已成功构建到 `tennis-admin/dist` 目录

## 📋 部署步骤

### 方法1: 拖拽部署（最简单，推荐）

1. **访问Netlify**
   - 打开 [https://www.netlify.com/](https://www.netlify.com/)
   - 登录或注册账号

2. **拖拽部署**
   - 在Netlify首页找到部署区域（通常有"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"）
   - 将整个 `tennis-admin/dist` 文件夹拖拽到该区域
   - 等待上传和部署完成

3. **获取临时域名**
   - 部署完成后，Netlify会给你一个临时域名，如：`amazing-site-123456.netlify.app`

### 方法2: Git连接部署

1. **新建站点**
   - 在Netlify点击 "New site from Git"
   - 选择GitHub
   - 选择仓库：`Tully-L/0729-wxapp-tennis-frontend`

2. **配置构建设置**
   ```
   Branch to deploy: feature/v2.0
   Base directory: tennis-admin
   Build command: npm run build
   Publish directory: tennis-admin/dist
   ```

3. **添加环境变量**
   在Site settings > Environment variables中添加：
   ```
   VITE_API_BASE_URL=https://zero729-wxapp-tennis.onrender.com/api
   VITE_APP_TITLE=网球管理系统
   VITE_APP_VERSION=1.0.0
   VITE_DEV_MODE=false
   ```

## 🔗 配置自定义域名（可选）

### 如果你有域名：

1. **在Netlify配置域名**
   - Site settings > Domain management
   - 点击 "Add custom domain"
   - 输入域名，如：`tennis-admin.yourdomain.com`

2. **配置DNS记录**
   在你的域名提供商处添加CNAME记录：
   ```
   类型: CNAME
   名称: tennis-admin
   值: your-site-name.netlify.app
   TTL: 自动或3600
   ```

3. **等待SSL证书**
   - Netlify会自动为你的域名配置SSL证书
   - 通常需要几分钟到几小时

## 🧪 部署后测试

### 访问你的管理系统：
- 临时域名：`your-site-name.netlify.app`
- 自定义域名：`tennis-admin.yourdomain.com`（如果配置了）

### 测试登录：
- 邮箱：`admin@tennis.com`
- 密码：`tennis2024`

### 测试功能：
- [ ] 登录功能正常
- [ ] Dashboard显示统计数据（11用户，10赛事）
- [ ] 用户管理页面正常加载
- [ ] 赛事管理页面正常加载
- [ ] 所有文本都是中文
- [ ] 响应式设计正常

## 🎉 部署完成！

部署成功后，你将拥有：
- ✅ 完全中文化的网球管理系统
- ✅ 通过域名访问的Web应用
- ✅ 自动HTTPS加密
- ✅ 全球CDN加速
- ✅ 连接到生产数据库的真实数据

## 📞 如果遇到问题

1. **白屏问题**：检查浏览器控制台是否有错误
2. **API连接失败**：确认后端服务正常运行
3. **登录失败**：检查网络连接和API地址
4. **404错误**：确认_redirects文件存在

## 🔄 后续更新

如果使用Git连接部署，每次推送代码到`feature/v2.0`分支，Netlify会自动重新部署。

---

**准备好了吗？现在就去Netlify部署你的Tennis Admin System吧！** 🚀