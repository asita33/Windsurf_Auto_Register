# 部署指南

## 本地开发部署

### 1. 后端服务部署

#### 安装依赖
```bash
cd backend
npm install
```

#### 启动服务
```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

服务将在 `http://localhost:3000` 运行

### 2. Chrome 扩展安装

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extension` 文件夹

## 生产环境部署

### 后端服务部署到云服务器

#### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name windsurf-backend

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs windsurf-backend

# 重启服务
pm2 restart windsurf-backend
```

#### 使用 Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

构建和运行：

```bash
# 构建镜像
docker build -t windsurf-backend .

# 运行容器
docker run -d -p 3000:3000 --name windsurf-backend windsurf-backend

# 查看日志
docker logs -f windsurf-backend
```

#### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 扩展发布到 Chrome Web Store

#### 1. 准备发布包

```bash
cd extension
zip -r windsurf-auto-register.zip *
```

#### 2. 创建开发者账号

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 支付一次性注册费用（$5）

#### 3. 上传扩展

1. 点击"新增项目"
2. 上传 zip 文件
3. 填写商店信息：
   - 详细说明
   - 图标和截图
   - 分类和语言
   - 隐私政策

#### 4. 提交审核

- 审核通常需要 1-3 个工作日
- 确保遵守 Chrome Web Store 政策

## 环境变量配置

### 后端环境变量

创建 `.env` 文件：

```env
PORT=3000
CORS_ORIGIN=*
TEMP_MAIL_API=https://www.1secmail.com/api/v1/
EMAIL_EXPIRATION_HOURS=24
LOG_LEVEL=info
CODE_WAIT_TIMEOUT=60
CODE_CHECK_INTERVAL=2000
```

### 扩展配置

修改 `extension/popup.js` 中的默认后端地址：

```javascript
let backendUrl = 'https://your-domain.com'; // 改为你的服务器地址
```

## 安全建议

### 1. 启用 HTTPS

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 2. 限制 CORS

在生产环境中限制 CORS 来源：

```javascript
// server.js
const corsOptions = {
    origin: ['chrome-extension://your-extension-id'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 3. 添加速率限制

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制100个请求
});

app.use('/api/', limiter);
```

### 4. 添加请求验证

```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/generate-email',
    body('email').isEmail().optional(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // 处理请求
    }
);
```

## 监控和日志

### 使用 Winston 记录日志

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### 健康检查端点

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

## 性能优化

### 1. 启用 Gzip 压缩

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. 添加缓存

```javascript
const cache = new Map();

app.get('/api/get-messages/:email', (req, res) => {
    const cacheKey = req.params.email;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 30000) {
        return res.json(cached.data);
    }
    
    // 获取数据并缓存
});
```

## 故障排查

### 查看服务状态

```bash
# PM2
pm2 status
pm2 logs

# Docker
docker ps
docker logs windsurf-backend

# 系统服务
systemctl status windsurf-backend
journalctl -u windsurf-backend -f
```

### 常见问题

1. **端口被占用**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   ```

3. **内存不足**
   ```bash
   # 增加 Node.js 内存限制
   node --max-old-space-size=4096 server.js
   ```

## 备份和恢复

### 备份数据

```bash
# 备份配置
cp .env .env.backup

# 备份日志
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### 恢复服务

```bash
# 停止服务
pm2 stop windsurf-backend

# 恢复代码
git pull origin main

# 安装依赖
npm install

# 重启服务
pm2 restart windsurf-backend
```

## 更新流程

1. 备份当前版本
2. 拉取最新代码
3. 安装新依赖
4. 运行测试
5. 重启服务
6. 验证功能

```bash
#!/bin/bash
# update.sh

echo "开始更新..."

# 备份
cp .env .env.backup

# 更新代码
git pull origin main

# 安装依赖
npm install

# 重启服务
pm2 restart windsurf-backend

echo "更新完成！"
```
