# Nano Banana Pro - AIGC生图平台

## 安装依赖

```bash
npm run install:all
```

## 开发运行

```bash
npm run dev
```

前端运行在 http://localhost:5173
后端运行在 http://localhost:3000

## API配置

在 `server/` 目录下创建 `.env` 文件：

```
PORT=3000
API_HOST=https://grsai.dakka.com.cn
API_KEY=你的API密钥
```

API文档: https://grsai.ai/zh/dashboard/documents/nano-banana

## 目录结构

```
├── client/          # 前端Vue3应用
│   ├── src/
│   │   ├── api/     # API接口
│   │   ├── components/  # 组件
│   │   ├── stores/      # 状态管理
│   │   ├── styles/      # 样式
│   │   └── views/       # 页面
├── server/          # 后端Node.js应用
│   ├── controllers/ # 控制器
│   ├── routes/      # 路由
│   ├── services/    # 服务
│   └── storage/     # 图片存储
```

