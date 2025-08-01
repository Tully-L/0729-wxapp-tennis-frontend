@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 网球小程序快速部署脚本 (Windows版本)
REM Tennis WeChat Mini-Program Quick Deployment Script for Windows

echo 🎾 网球小程序部署脚本启动...
echo ==================================

REM 检查Node.js环境
echo 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装，请先安装Node.js
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js版本: !NODE_VERSION!
)

REM 检查npm环境
echo 检查npm环境...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm版本: !NPM_VERSION!
)

REM 安装后端依赖
echo 安装后端依赖...
if not exist "backend\package.json" (
    echo ❌ 未找到backend\package.json
    pause
    exit /b 1
)

cd backend
echo 正在安装依赖包...
npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    cd ..
    pause
    exit /b 1
) else (
    echo ✅ 后端依赖安装成功
)
cd ..

REM 配置环境变量
echo 配置环境变量...
if not exist "backend\.env" (
    echo 创建环境配置文件...
    (
        echo # 数据库配置
        echo MONGODB_URI=mongodb://localhost:27017/tennis-app
        echo DB_NAME=tennis-app
        echo.
        echo # 服务器配置
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # JWT配置
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # 微信小程序配置
        echo WECHAT_APP_ID=your-wechat-app-id
        echo WECHAT_APP_SECRET=your-wechat-app-secret
        echo.
        echo # 文件上传配置
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=5242880
        echo.
        echo # 日志配置
        echo LOG_LEVEL=info
        echo LOG_FILE=./logs/app.log
    ) > backend\.env
    echo ✅ 环境配置文件已创建
    echo ⚠️  请编辑 backend\.env 文件，填入正确的配置信息
) else (
    echo ✅ 环境配置文件已存在
)

REM 检查MongoDB
echo 检查MongoDB环境...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB正在运行
) else (
    echo ⚠️  MongoDB未运行，请手动启动MongoDB服务
    echo    或使用云数据库服务
)

REM 启动后端服务
echo 启动后端服务...
cd backend

REM 检查是否有PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo 使用npm启动服务...
    echo 正在后台启动服务...
    start /B npm run dev
    echo ✅ 后端服务已启动（开发模式）
) else (
    echo 使用PM2启动服务...
    pm2 start ecosystem.config.js
    pm2 save
    echo ✅ 后端服务已通过PM2启动
)

cd ..

REM 等待服务启动
echo 等待服务启动...
timeout /t 5 /nobreak >nul

REM 验证后端服务
echo 验证后端服务...
curl -f http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  后端服务可能未完全启动，请检查日志
) else (
    echo ✅ 后端服务运行正常
)

REM 检查前端文件
echo 检查前端文件...
set FRONTEND_OK=1

if not exist "frontend\app.js" (
    echo ❌ frontend\app.js 缺失
    set FRONTEND_OK=0
) else (
    echo ✅ frontend\app.js
)

if not exist "frontend\pages\match\match.js" (
    echo ❌ frontend\pages\match\match.js 缺失
    set FRONTEND_OK=0
) else (
    echo ✅ frontend\pages\match\match.js
)

if not exist "frontend\components\match-status\match-status.js" (
    echo ❌ frontend\components\match-status\match-status.js 缺失
    set FRONTEND_OK=0
) else (
    echo ✅ frontend\components\match-status\match-status.js
)

if not exist "frontend\utils\api.js" (
    echo ❌ frontend\utils\api.js 缺失
    set FRONTEND_OK=0
) else (
    echo ✅ frontend\utils\api.js
)

REM 生成部署报告
echo 生成部署报告...
set REPORT_FILE=deployment-report-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt
set REPORT_FILE=!REPORT_FILE: =0!

(
    echo 网球小程序部署报告
    echo ==================
    echo.
    echo 部署时间: %date% %time%
    echo 部署版本: v1.0.0
    echo.
    echo 环境信息:
    echo - Node.js: !NODE_VERSION!
    echo - npm: !NPM_VERSION!
    echo - 操作系统: Windows
    echo.
    echo 服务状态:
    echo - 后端服务: http://localhost:3000
    echo - 数据库: MongoDB
    echo - 前端: 微信开发者工具
    echo.
    echo 下一步操作:
    echo 1. 打开微信开发者工具
    echo 2. 导入 frontend 目录
    echo 3. 配置小程序AppID
    echo 4. 进行功能测试
    echo.
    echo 测试清单:
    echo □ 页面导航测试
    echo □ 分离式布局显示测试
    echo □ 比赛状态管理测试
    echo □ 报名功能测试
    echo □ 性能测试
    echo.
    echo 联系信息:
    echo 如有问题，请查看 DEPLOYMENT_GUIDE.md
) > "!REPORT_FILE!"

echo ✅ 部署报告已生成: !REPORT_FILE!

REM 显示后续步骤
echo.
echo ==================================
echo 🎉 部署完成！后续步骤：
echo ==================================
echo 1. 打开微信开发者工具
echo 2. 选择 '导入项目'
echo 3. 项目目录选择: %CD%\frontend
echo 4. 输入小程序AppID
echo 5. 开始功能测试
echo.
echo 测试地址:
echo 后端API: http://localhost:3000/api
echo 健康检查: http://localhost:3000/api/health
echo.
echo 重要文件:
echo 部署指南: DEPLOYMENT_GUIDE.md
echo 实现总结: IMPLEMENTATION_SUMMARY.md
echo 测试脚本: test-separated-layout.js
echo 用户测试清单: USER_TEST_CHECKLIST.md
echo.
echo 注意事项:
echo - 请在微信公众平台配置服务器域名
echo - 请更新 backend\.env 中的配置信息
echo - 建议先在开发环境充分测试
echo.
echo 🎾 部署脚本执行完成！

pause
