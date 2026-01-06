# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装依赖
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# 复制所有源代码
COPY . .

# 构建前端
RUN cd client && npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 只复制必要的文件
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/package.json ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 创建存储目录
RUN mkdir -p /app/server/storage/images

# 启动后端服务
CMD ["node", "server/server.js"]

