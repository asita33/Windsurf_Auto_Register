# 📧 临时邮箱服务详细说明

## 🎯 当前使用的服务

### 主要服务：Guerrilla Mail

**官网**: https://www.guerrillamail.com/

**API 文档**: https://www.guerrillamail.com/GuerrillaMailAPI.html

**为什么选择它**:
- ✅ 完全免费
- ✅ 无需注册
- ✅ API 开放且稳定
- ✅ 可以接收真实邮件
- ✅ 支持查看邮件内容
- ✅ 没有严格的访问限制

---

## 🔧 API 接口说明

### 1. 生成邮箱

**请求**:
```http
GET https://api.guerrillamail.com/ajax.php?f=get_email_address&ip=127.0.0.1&agent=Mozilla/5.0
```

**响应**:
```json
{
  "email_addr": "abc123@guerrillamailblock.com",
  "email_timestamp": 1699999999,
  "alias": "abc123",
  "sid_token": "xxxxxxxxxxxx"
}
```

**重要字段**:
- `email_addr`: 生成的邮箱地址
- `sid_token`: 会话令牌（用于后续获取邮件）

---

### 2. 获取邮件列表

**请求**:
```http
GET https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=xxxxxxxxxxxx
```

**响应**:
```json
{
  "list": [
    {
      "mail_id": "123456",
      "mail_from": "noreply@example.com",
      "mail_subject": "Verification Code",
      "mail_excerpt": "Your code is...",
      "mail_timestamp": 1699999999
    }
  ]
}
```

---

### 3. 获取邮件详情

**请求**:
```http
GET https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=123456&sid_token=xxxxxxxxxxxx
```

**响应**:
```json
{
  "mail_id": "123456",
  "mail_from": "noreply@example.com",
  "mail_subject": "Verification Code",
  "mail_body": "<html>Your verification code is: 123456</html>",
  "mail_timestamp": 1699999999
}
```

---

## 💻 代码实现

### 在 `backend/email-service.js` 中的实现：

```javascript
// 生成邮箱
async guerrillaGenerateEmail() {
    const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
        params: {
            f: 'get_email_address',
            ip: '127.0.0.1',
            agent: 'Mozilla/5.0'
        },
        timeout: 10000
    });
    
    return {
        success: true,
        email: response.data.email_addr,
        sid: response.data.sid_token
    };
}

// 获取邮件列表
async guerrillaGetMessages(email) {
    const emailInfo = this.emailData.get(email);
    
    const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
        params: {
            f: 'get_email_list',
            offset: 0,
            sid_token: emailInfo.sid
        }
    });
    
    return {
        success: true,
        messages: response.data.list
    };
}

// 获取邮件内容
async guerrillaGetMessageBody(email, messageId) {
    const emailInfo = this.emailData.get(email);
    
    const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
        params: {
            f: 'fetch_email',
            email_id: messageId,
            sid_token: emailInfo.sid
        }
    });
    
    return {
        success: true,
        message: response.data
    };
}
```

---

## 🔄 备用服务：Mail.tm

**官网**: https://mail.tm/

**API 文档**: https://docs.mail.tm/

**特点**:
- ✅ 免费
- ✅ RESTful API
- ✅ 需要创建账号（通过API）
- ✅ 更现代的接口设计

**API 示例**:

```javascript
// 1. 获取域名
GET https://api.mail.tm/domains

// 2. 创建账号
POST https://api.mail.tm/accounts
{
  "address": "test@mail.tm",
  "password": "password123"
}

// 3. 获取 Token
POST https://api.mail.tm/token
{
  "address": "test@mail.tm",
  "password": "password123"
}

// 4. 获取邮件
GET https://api.mail.tm/messages
Headers: Authorization: Bearer {token}
```

---

## 📊 服务对比

| 特性 | Guerrilla Mail | Mail.tm | 1secmail |
|------|---------------|---------|----------|
| 免费 | ✅ | ✅ | ✅ |
| 无需注册 | ✅ | ❌ (需API创建) | ✅ |
| API 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (被限制) |
| 邮件接收 | ✅ | ✅ | ❌ (403错误) |
| 文档质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 访问限制 | 宽松 | 中等 | 严格 |
| 邮箱域名 | @guerrillamailblock.com | @mail.tm | @1secmail.com |

---

## 🎯 为什么不用其他服务

### 1secmail.com
```
❌ 问题: API 返回 403 错误
原因: 访问限制太严格
状态: 已弃用
```

### Temp-Mail.org
```
❌ 问题: 连接失败
原因: 需要付费或有其他限制
状态: 不可用
```

### 10MinuteMail
```
❌ 问题: 没有公开的 API
原因: 只能通过网页使用
状态: 无法集成
```

---

## 🔍 实际测试

### 测试 Guerrilla Mail API

```bash
# 1. 生成邮箱
curl "https://api.guerrillamail.com/ajax.php?f=get_email_address&ip=127.0.0.1&agent=Mozilla"

# 响应示例:
{
  "email_addr": "abc123@guerrillamailblock.com",
  "sid_token": "abc123def456"
}

# 2. 获取邮件（使用上面的 sid_token）
curl "https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=abc123def456"

# 响应示例:
{
  "list": [
    {
      "mail_id": "123",
      "mail_from": "welcome@guerrillamail.com",
      "mail_subject": "Welcome to Guerrilla Mail"
    }
  ]
}
```

---

## 📝 在你的项目中的使用

### 文件位置
```
backend/email-service.js  ← 邮件服务实现
backend/server.js         ← API 路由
```

### 关键代码

**在 `email-service.js` 中**:
```javascript
class EmailService {
    constructor() {
        this.services = [
            {
                name: 'GuerrillaMail',
                generateEmail: this.guerrillaGenerateEmail.bind(this),
                getMessages: this.guerrillaGetMessages.bind(this),
                available: true
            },
            {
                name: 'MailTm',
                generateEmail: this.mailtmGenerateEmail.bind(this),
                getMessages: this.mailtmGetMessages.bind(this),
                available: true
            }
        ];
    }
    
    // 自动选择可用的服务
    async generateEmail() {
        for (const service of this.services) {
            if (!service.available) continue;
            
            const result = await service.generateEmail();
            if (result.success) {
                return result;
            }
            
            service.available = false; // 失败则标记为不可用
        }
        
        return { success: false, error: '所有服务都不可用' };
    }
}
```

**在 `server.js` 中**:
```javascript
const EmailService = require('./email-service');
const emailService = new EmailService();

// 生成邮箱 API
app.post('/api/generate-email', async (req, res) => {
    const result = await emailService.generateEmail();
    res.json(result);
});

// 获取邮件 API
app.get('/api/get-messages/:email', async (req, res) => {
    const result = await emailService.getMessages(req.params.email);
    res.json(result);
});
```

---

## 🌐 API 端点总结

### Guerrilla Mail 的所有端点

| 功能 | 参数 `f` | 说明 |
|------|---------|------|
| 生成邮箱 | `get_email_address` | 创建新的临时邮箱 |
| 获取邮件列表 | `get_email_list` | 获取收件箱邮件 |
| 读取邮件 | `fetch_email` | 获取邮件完整内容 |
| 检查新邮件 | `check_email` | 检查是否有新邮件 |
| 删除邮件 | `del_email` | 删除指定邮件 |
| 忘记邮箱 | `forget_me` | 删除邮箱会话 |

**基础 URL**: `https://api.guerrillamail.com/ajax.php`

---

## 🔐 安全说明

### 注意事项

1. **临时性**: 邮箱有效期约 1 小时
2. **公开性**: 任何人都可以访问（如果知道邮箱地址）
3. **不保密**: 不要用于重要账号
4. **仅测试**: 仅用于测试和一次性注册

### 数据存储

```javascript
// 邮箱数据存储在内存中
this.emailData = new Map();

// 存储格式:
{
  email: "abc@guerrillamailblock.com",
  service: "GuerrillaMail",
  sid: "session_token",
  createdAt: 1699999999
}
```

---

## 📚 相关资源

### 官方文档
- Guerrilla Mail API: https://www.guerrillamail.com/GuerrillaMailAPI.html
- Mail.tm API: https://docs.mail.tm/

### 测试工具
- Postman Collection: 可以导入测试
- cURL 命令: 见上面的示例

### 替代方案
如果这些服务都不可用，可以考虑：
- Maildrop.cc
- Mailinator.com
- TempMail.plus

---

## 🎉 总结

**当前使用**: Guerrilla Mail (主要) + Mail.tm (备用)

**优点**:
- ✅ 完全免费
- ✅ API 稳定
- ✅ 能接收真实邮件
- ✅ 自动切换备用服务

**使用方式**:
1. 调用 API 生成邮箱
2. 使用邮箱注册
3. 调用 API 获取邮件
4. 提取验证码

**代码位置**:
- `backend/email-service.js` - 服务实现
- `backend/server.js` - API 路由

---

需要我展示具体的 API 调用示例或者代码细节吗？
