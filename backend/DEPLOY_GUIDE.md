# 🚀 Render 部署安全配置指南

## ⚠️ 重要：部署后立即配置

### 第一步：在Render设置环境变量

1. 登录 https://dashboard.render.com
2. 找到你的服务：`windsurf-auto-register`
3. 点击 **Environment** 标签
4. 添加以下环境变量：

```
API_KEY=生成一个32位随机字符串
ADMIN_PASSWORD=设置一个强密码
```

### 第二步：生成安全密钥

在本地运行以下命令生成随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

输出示例：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 第三步：更新扩展配置

修改以下两个文件中的API密钥（与Render中设置的保持一致）：

**文件1：** `extension/config.js`
```javascript
const CONFIG = {
    API_KEY: '你在Render中设置的API_KEY',
    // ...
};
```

**文件2：** `extension/api-helper.js`
```javascript
const API_KEY = '你在Render中设置的API_KEY';
```

### 第四步：重新部署

1. 提交代码更改
2. 在Render控制台点击 **Manual Deploy**
3. 等待部署完成

## 📝 完整的环境变量列表

```env
# Redis（必需）
UPSTASH_REDIS_REST_URL=你的Upstash Redis URL
UPSTASH_REDIS_REST_TOKEN=你的Upstash Redis Token

# 安全配置（强烈推荐修改）
API_KEY=你的32位随机密钥
ADMIN_PASSWORD=你的强密码

# 可选
PORT=3000
```

## 🔒 默认凭据（仅用于测试）

⚠️ **生产环境必须修改！**

- **API密钥：** `windsurf-auto-register-2024-secure-key`
- **管理员密码：** `admin123456`

## ✅ 验证配置

### 1. 测试管理后台

访问：`https://windsurf-auto-register.onrender.com`

- 应该看到登录页面
- 输入你设置的管理员密码
- 成功登录后可以看到管理界面

### 2. 测试API访问

使用扩展发起注册请求，检查是否正常工作。

## 🛡️ 安全特性

已启用的安全措施：

- ✅ **API密钥验证** - 所有API请求需要密钥
- ✅ **管理后台密码保护** - 需要登录才能访问
- ✅ **速率限制** - 15分钟内最多100次请求/IP
- ✅ **CORS限制** - 只允许特定来源访问

## 📞 需要帮助？

查看详细文档：`backend/SECURITY_CONFIG.md`
