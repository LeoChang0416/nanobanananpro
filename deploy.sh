#!/bin/bash

# Nano Banana Pro 部署脚本

echo "====== Nano Banana Pro 部署脚本 ======"

# 1. 安装 Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 2. 克隆或更新代码
if [ -d "nanobanananpro" ]; then
    echo "更新代码..."
    cd nanobanananpro
    git pull origin main
else
    echo "克隆代码..."
    git clone https://github.com/LeoChang0416/nanobanananpro.git
    cd nanobanananpro
fi

# 3. 安装依赖
echo "安装依赖..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 4. 构建前端
echo "构建前端..."
cd client && npm run build && cd ..

# 5. 配置环境变量（请手动编辑 server/.env）
if [ ! -f "server/.env" ]; then
    echo "创建 .env 文件..."
    cat > server/.env << EOF
PORT=3000
API_HOST=https://grsai.dakka.com.cn
API_KEY=sk-4e5fa91a66d54303ba527d2b4b8e5e09
EOF
    echo "请编辑 server/.env 文件配置你的 API_KEY"
fi

# 6. 安装 PM2 (进程管理器)
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    sudo npm install -g pm2
fi

# 7. 启动服务
echo "启动服务..."
pm2 stop nano-banana-server 2>/dev/null || true
cd server
pm2 start server.js --name nano-banana-server
pm2 save
pm2 startup

echo "====== 部署完成 ======"
echo "服务运行在: http://localhost:3000"
echo "查看日志: pm2 logs nano-banana-server"
echo "重启服务: pm2 restart nano-banana-server"
echo "停止服务: pm2 stop nano-banana-server"

