# 🔐 安全配置说明

## 已实施的安全措施

### 1. API密钥验证
所有API请求都需要提供有效的API密钥。

**配置方式：**
```env
API_KEY=your-secure-api-key-here
```

**默认密钥：** `windsurf-auto-register-2024-secure-key`

⚠️ **重要：** 部署到生产环境时，请务必修改此密钥！

### 2. 管理后台密码保护
访问管理后台需要输入管理员密码。

**配置方式：**
```env
ADMIN_PASSWORD=your-admin-password
```

**默认密码：** `admin123456`

⚠️ **重要：** 部署到生产环境时，请务必修改此密码！

### 3. 速率限制
- **时间窗口：** 15分钟
- **最大请求数：** 100次/IP
- 超过限制将返回429错误

### 4. CORS限制
只允许以下来源访问：
- Chrome扩展（`chrome-extension://*`）
- 后端域名（`https://windsurf-auto-register.onrender.com`）
- 本地开发（`http://localhost:3000`）

## 环境变量配置

在Render部署时，请设置以下环境变量：

```env
# Redis配置（必需）
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# 安全配置（强烈推荐修改）
API_KEY=your-custom-api-key-2024
ADMIN_PASSWORD=your-strong-admin-password

# 可选配置
PORT=3000
USE_MOCK_MODE=false
```

## 扩展配置

扩展中的API密钥需要与后端保持一致。

**文件位置：** `extension/config.js` 和 `extension/api-helper.js`

```javascript
const API_KEY = 'windsurf-auto-register-2024-secure-key';
```

⚠️ **注意：** 如果修改了后端的API_KEY，也需要同步修改扩展中的密钥，并重新打包扩展。

## 使用方法

### 扩展请求示例

```javascript
// 使用API辅助函数（自动添加API密钥）
const data = await apiPost(`${backendUrl}/api/generate-email`);

// 或手动添加
const response = await fetch(`${backendUrl}/api/generate-email`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
    }
});
```

### 访问管理后台

1. 访问：`https://windsurf-auto-register.onrender.com`
2. 输入管理员密码
3. 登录成功后可以管理账号和动态码

## 安全建议

### 生产环境部署清单

- [ ] 修改 `API_KEY` 为强随机字符串
- [ ] 修改 `ADMIN_PASSWORD` 为强密码
- [ ] 在Render中设置环境变量
- [ ] 更新扩展中的API密钥
- [ ] 重新打包并分发扩展
- [ ] 定期检查访问日志
- [ ] 定期更新密钥

### 密钥生成建议

```bash
# 生成强随机API密钥（32字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用在线工具
# https://www.random.org/strings/
```

### 密码强度要求

- 最少12个字符
- 包含大小写字母
- 包含数字
- 包含特殊符号

## 常见问题

### Q: 如何修改API密钥？

A: 
1. 在Render环境变量中修改 `API_KEY`
2. 在 `extension/config.js` 和 `extension/api-helper.js` 中修改
3. 重新部署后端
4. 重新打包扩展

### Q: 忘记管理员密码怎么办？

A: 
1. 登录Render控制台
2. 修改 `ADMIN_PASSWORD` 环境变量
3. 重启服务

### Q: 如何查看被限流的IP？

A: 查看Render日志，搜索"429"或"请求过于频繁"

### Q: 可以关闭API密钥验证吗？

A: 不建议。如果必须关闭，可以修改 `server.js` 中的中间件配置，但这会使API完全暴露。

## 监控和日志

### 查看访问日志

在Render控制台的Logs标签中可以查看：
- API请求记录
- 认证失败记录
- 速率限制触发记录

### 关键日志标识

- `[API]` - API请求
- `⚠️` - 警告信息
- `❌` - 错误信息
- `✅` - 成功操作

## 联系支持

如有安全问题或建议，请通过GitHub Issues反馈。
