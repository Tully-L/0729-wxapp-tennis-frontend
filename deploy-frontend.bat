@echo off
chcp 65001 >nul
echo 🎾 Tennis Admin System - 前端部署脚本
echo =====================================

echo 📦 进入前端目录...
cd tennis-admin

echo 📋 检查依赖...
if not exist "node_modules" (
    echo 📥 安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo 🔧 构建生产版本...
npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo ✅ 构建完成！

echo 📁 构建文件位置: tennis-admin\dist
echo 🌐 现在可以部署到Netlify了！

echo.
echo 📋 部署步骤：
echo 1. 访问 https://www.netlify.com/
echo 2. 登录或注册账号
echo 3. 将 tennis-admin\dist 文件夹拖拽到部署区域
echo 4. 配置自定义域名（可选）
echo.

echo 🎯 测试地址：
echo 后端API: https://zero729-wxapp-tennis.onrender.com
echo 前端将部署到: your-site-name.netlify.app
echo.

echo 🔑 登录凭据：
echo 邮箱: admin@tennis.com
echo 密码: tennis2024
echo.

pause