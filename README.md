# 网球热微信小程序项目

## 项目简介

网球热是一个专业的网球赛事管理微信小程序，提供赛事发布、报名、比赛记录、实时比分更新和社交分享等功能。

## 项目结构

```
0711-tennis-wxapp/
├── frontend/              # 微信小程序前端
│   ├── app.js            # 小程序入口文件
│   ├── app.json          # 小程序配置文件
│   ├── pages/            # 页面目录
│   ├── components/       # 组件目录
│   ├── utils/           # 工具函数
│   └── README.md        # 前端详细文档
├── backend/              # Node.js后端服务
│   ├── src/             # 源代码
│   ├── package.json     # 后端依赖
│   └── README.md        # 后端详细文档
└── README.md            # 项目总览（本文件）
```

## 技术栈

### 前端
- **框架**: 微信小程序 (WXML, WXSS, JavaScript)
- **UI设计**: Roland-Garros 风格，深绿色主题 (#0A4A39)
- **功能**: 赛事浏览、用户认证、实时比分、推送通知、支付功能

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB
- **实时通信**: Socket.io
- **认证**: JWT
- **支付**: 微信支付API
- **推送**: 微信统一服务消息

## 开发环境

### 前端开发
1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 在微信开发者工具中导入 `frontend/` 目录
3. 配置小程序AppID

### 后端开发
1. 安装Node.js (v16+)
2. 安装MongoDB
3. 进入 `backend/` 目录
4. 运行 `npm install`
5. 配置环境变量
6. 运行 `npm run dev`

## 功能特性

### 已实现功能
- ✅ 赛事浏览和筛选
- ✅ 用户注册和登录
- ✅ 个人比赛记录统计
- ✅ 响应式设计
- ✅ 骨架屏加载优化
- ✅ 空状态操作引导
- ✅ 缓存机制优化

### 待实现功能（需要后端支持）
- 🔄 实时比分更新
- 🔄 推送通知
- 🔄 真实支付功能
- 🔄 社交分享功能

## 部署说明

### 前端部署
1. 在微信开发者工具中上传代码
2. 提交审核并发布

### 后端部署
1. 配置生产环境变量
2. 使用PM2部署
3. 配置Nginx反向代理
4. 配置SSL证书

## 开发团队

- 前端开发：微信小程序
- 后端开发：Node.js + MongoDB
- UI设计：Roland-Garros 风格

## 许可证

MIT License 