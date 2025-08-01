#!/bin/bash

# 网球小程序快速部署脚本
# Tennis WeChat Mini-Program Quick Deployment Script

echo "🎾 网球小程序部署脚本启动..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js环境
check_nodejs() {
    echo -e "${BLUE}检查Node.js环境...${NC}"
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js未安装，请先安装Node.js${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js版本: $NODE_VERSION${NC}"
}

# 检查MongoDB环境
check_mongodb() {
    echo -e "${BLUE}检查MongoDB环境...${NC}"
    if ! command -v mongod &> /dev/null; then
        echo -e "${YELLOW}⚠️  MongoDB未安装，将使用云数据库${NC}"
    else
        echo -e "${GREEN}✅ MongoDB已安装${NC}"
    fi
}

# 安装后端依赖
install_backend_deps() {
    echo -e "${BLUE}安装后端依赖...${NC}"
    cd backend
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 未找到backend/package.json${NC}"
        exit 1
    fi
    
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 后端依赖安装成功${NC}"
    else
        echo -e "${RED}❌ 后端依赖安装失败${NC}"
        exit 1
    fi
    
    cd ..
}

# 配置环境变量
setup_env() {
    echo -e "${BLUE}配置环境变量...${NC}"
    
    if [ ! -f "backend/.env" ]; then
        echo -e "${YELLOW}创建环境配置文件...${NC}"
        cat > backend/.env << EOF
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/tennis-app
DB_NAME=tennis-app

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF
        echo -e "${GREEN}✅ 环境配置文件已创建${NC}"
        echo -e "${YELLOW}⚠️  请编辑 backend/.env 文件，填入正确的配置信息${NC}"
    else
        echo -e "${GREEN}✅ 环境配置文件已存在${NC}"
    fi
}

# 初始化数据库
init_database() {
    echo -e "${BLUE}初始化数据库...${NC}"
    
    # 检查MongoDB是否运行
    if pgrep mongod > /dev/null; then
        echo -e "${GREEN}✅ MongoDB正在运行${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB未运行，尝试启动...${NC}"
        # 尝试启动MongoDB（根据系统不同可能需要调整）
        if command -v brew &> /dev/null; then
            # macOS with Homebrew
            brew services start mongodb-community
        elif command -v systemctl &> /dev/null; then
            # Linux with systemd
            sudo systemctl start mongod
        else
            echo -e "${YELLOW}⚠️  请手动启动MongoDB服务${NC}"
        fi
    fi
}

# 启动后端服务
start_backend() {
    echo -e "${BLUE}启动后端服务...${NC}"
    cd backend
    
    # 检查是否有PM2
    if command -v pm2 &> /dev/null; then
        echo -e "${BLUE}使用PM2启动服务...${NC}"
        pm2 start ecosystem.config.js
        pm2 save
        echo -e "${GREEN}✅ 后端服务已通过PM2启动${NC}"
    else
        echo -e "${BLUE}使用npm启动服务...${NC}"
        npm run dev &
        echo -e "${GREEN}✅ 后端服务已启动（开发模式）${NC}"
    fi
    
    cd ..
}

# 验证后端服务
verify_backend() {
    echo -e "${BLUE}验证后端服务...${NC}"
    sleep 3
    
    # 检查服务是否响应
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务可能未完全启动，请检查日志${NC}"
    fi
}

# 检查前端文件
check_frontend() {
    echo -e "${BLUE}检查前端文件...${NC}"
    
    # 检查关键文件
    FRONTEND_FILES=(
        "frontend/app.js"
        "frontend/app.json"
        "frontend/pages/match/match.js"
        "frontend/pages/match/match.wxml"
        "frontend/pages/match/match.wxss"
        "frontend/components/match-status/match-status.js"
        "frontend/utils/api.js"
    )
    
    for file in "${FRONTEND_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file${NC}"
        else
            echo -e "${RED}❌ $file 缺失${NC}"
        fi
    done
}

# 生成部署报告
generate_report() {
    echo -e "${BLUE}生成部署报告...${NC}"
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
网球小程序部署报告
==================

部署时间: $(date)
部署版本: v1.0.0

环境信息:
- Node.js: $(node --version)
- npm: $(npm --version)
- 操作系统: $(uname -s)

服务状态:
- 后端服务: http://localhost:3000
- 数据库: MongoDB
- 前端: 微信开发者工具

部署文件检查:
$(ls -la frontend/pages/match/)

下一步操作:
1. 打开微信开发者工具
2. 导入 frontend 目录
3. 配置小程序AppID
4. 进行功能测试

测试清单:
□ 页面导航测试
□ 分离式布局显示测试
□ 比赛状态管理测试
□ 报名功能测试
□ 性能测试

联系信息:
如有问题，请查看 DEPLOYMENT_GUIDE.md
EOF

    echo -e "${GREEN}✅ 部署报告已生成: $REPORT_FILE${NC}"
}

# 显示后续步骤
show_next_steps() {
    echo -e "${BLUE}=================================="
    echo -e "🎉 部署完成！后续步骤："
    echo -e "=================================="
    echo -e "${YELLOW}1. 打开微信开发者工具${NC}"
    echo -e "${YELLOW}2. 选择 '导入项目'${NC}"
    echo -e "${YELLOW}3. 项目目录选择: $(pwd)/frontend${NC}"
    echo -e "${YELLOW}4. 输入小程序AppID${NC}"
    echo -e "${YELLOW}5. 开始功能测试${NC}"
    echo ""
    echo -e "${BLUE}测试地址:${NC}"
    echo -e "后端API: ${GREEN}http://localhost:3000/api${NC}"
    echo -e "健康检查: ${GREEN}http://localhost:3000/api/health${NC}"
    echo ""
    echo -e "${BLUE}重要文件:${NC}"
    echo -e "部署指南: ${GREEN}DEPLOYMENT_GUIDE.md${NC}"
    echo -e "实现总结: ${GREEN}IMPLEMENTATION_SUMMARY.md${NC}"
    echo -e "测试脚本: ${GREEN}test-separated-layout.js${NC}"
    echo ""
    echo -e "${RED}注意事项:${NC}"
    echo -e "- 请在微信公众平台配置服务器域名"
    echo -e "- 请更新 backend/.env 中的配置信息"
    echo -e "- 建议先在开发环境充分测试"
}

# 主函数
main() {
    echo -e "${GREEN}开始部署网球小程序...${NC}"
    
    check_nodejs
    check_mongodb
    install_backend_deps
    setup_env
    init_database
    start_backend
    verify_backend
    check_frontend
    generate_report
    show_next_steps
    
    echo -e "${GREEN}🎾 部署脚本执行完成！${NC}"
}

# 错误处理
set -e
trap 'echo -e "${RED}❌ 部署过程中发生错误，请检查日志${NC}"' ERR

# 执行主函数
main "$@"
