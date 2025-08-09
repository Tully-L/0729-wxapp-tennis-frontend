# Tennis Admin System - Netlify部署指南

## 🎯 部署步骤

### 1. 构建前端项目
```bash
cd tennis-admin
npm run build
```

### 2. 配置Netlify部署

#### 方法1: 拖拽部署（最简单）
1. 访问 [Netlify](https://www.netlify.com/)
2. 登录或注册账号
3. 将 `tennis-admin/dist` 文件夹直接拖拽到Netlify部署区域
4. 等待部署完成

#### 方法2: Git连接部署（推荐）
1. 在Netlify中点击 "New site from Git"
2. 连接你的GitHub仓库
3. 配置构建设置：
   - **Base directory**: `tennis-admin`
   - **Build command**: `npm run build`
   - **Publish directory**: `tennis-admin/dist`

### 3. 配置环境变量
在Netlify的Site settings > Environment variables中添加：
```
VITE_API_BASE_URL=https://zero729-wxapp-tennis.onrender.com/api
VITE_APP_TITLE=网球管理系统
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

### 4. 配置自定义域名

#### 在Netlify中配置：
1. 进入Site settings > Domain management
2. 点击 "Add custom domain"
3. 输入你的域名，例如：`tennis-admin.yourdomain.com`
4. 按照提示配置DNS记录

#### DNS配置示例：
```
类型: CNAME
名称: tennis-admin
值: your-site-name.netlify.app
```

### 5. 配置重定向规则
创建 `tennis-admin/public/_redirects` 文件：
```
/*    /index.html   200
```

这确保Vue Router的单页应用路由正常工作。

## 🧪 测试清单

### 部署后测试项目：
- [ ] 访问域名能正常打开登录页面
- [ ] 使用 `admin@tennis.com` / `tennis2024` 能正常登录
- [ ] Dashboard显示正确的统计数据
- [ ] 用户管理页面能正常加载和显示数据
- [ ] 赛事管理页面能正常加载和显示数据
- [ ] 所有界面文本都是中文
- [ ] 响应式设计在移动端正常工作

## 🔧 常见问题解决

### 1. 404错误
确保 `_redirects` 文件配置正确

### 2. API连接失败
检查环境变量 `VITE_API_BASE_URL` 是否正确

### 3. 白屏问题
检查构建日志，确保没有构建错误

## 📱 推荐域名配置

### 建议的域名结构：
- 主域名：`yourdomain.com`
- 管理后台：`admin.yourdomain.com` 或 `tennis-admin.yourdomain.com`
- API后端：已部署在 `zero729-wxapp-tennis.onrender.com`

### SSL证书
Netlify会自动为你的自定义域名提供免费的SSL证书。

## 🎉 部署完成后

部署成功后，你将拥有：
1. ✅ 完全中文化的网球管理系统
2. ✅ 通过自定义域名访问
3. ✅ 自动HTTPS加密
4. ✅ 全球CDN加速
5. ✅ 自动部署（连接Git后）

## 🔗 有用链接

- [Netlify文档](https://docs.netlify.com/)
- [Vue.js部署指南](https://cli.vuejs.org/guide/deployment.html#netlify)
- [自定义域名配置](https://docs.netlify.com/domains-https/custom-domains/)