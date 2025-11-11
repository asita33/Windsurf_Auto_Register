const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const EmailService = require('./email-service');
const path = require('path');

// 使用Upstash Redis
const { Redis } = require('@upstash/redis');

console.log('🔍 检查Upstash环境变量:');
console.log('- UPSTASH_REDIS_REST_URL:', !!process.env.UPSTASH_REDIS_REST_URL);
console.log('- UPSTASH_REDIS_REST_TOKEN:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log('✅ Upstash Redis客户端初始化成功！');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全配置
const API_KEY = process.env.API_KEY || 'windsurf-auto-register-2024-secure-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟
const RATE_LIMIT_MAX_REQUESTS = 100; // 每个IP最多100次请求

// 速率限制存储
const rateLimitStore = new Map();

// 账号存储文件路径
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

// 使用新的邮件服务，传递kv客户端用于持久化
const emailService = new EmailService(kv);

// 存储临时邮箱和验证码（保留用于兼容）
const emailStore = new Map();

// CORS配置 - 只允许特定来源
const allowedOrigins = [
  'chrome-extension://*',
  'https://windsurf-auto-register.onrender.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // 允许没有origin的请求（如Postman）
    if (!origin) return callback(null, true);
    
    // 检查是否是chrome扩展
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    // 检查是否在白名单中
    if (allowedOrigins.some(allowed => origin === allowed || allowed === 'chrome-extension://*')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// 增加请求体大小限制，支持上传二维码图片（Base64编码）
app.use(express.json({ limit: '10mb' }));

// ==================== 安全中间件 ====================

// 速率限制中间件
function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // 清理过期记录
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.startTime > RATE_LIMIT_WINDOW) {
            rateLimitStore.delete(key);
        }
    }
    
    // 获取或创建IP记录
    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, {
            count: 1,
            startTime: now
        });
        return next();
    }
    
    const record = rateLimitStore.get(ip);
    
    // 检查是否超过限制
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - record.startTime)) / 1000 / 60);
        return res.status(429).json({
            success: false,
            error: `请求过于频繁，请在 ${timeLeft} 分钟后重试`
        });
    }
    
    // 增加计数
    record.count++;
    next();
}

// API密钥验证中间件
function verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({
            success: false,
            error: '未授权：无效的API密钥'
        });
    }
    
    next();
}

// 管理员密码验证中间件
function verifyAdminPassword(req, res, next) {
    const password = req.headers['x-admin-password'] || req.query.adminPassword;
    
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            error: '未授权：管理员密码错误'
        });
    }
    
    next();
}

// ==================== 静态文件和路由 ====================

// 提供静态文件服务 - 使用绝对路径
app.use(express.static(path.join(__dirname, 'public')));

// 根路由 - 提供 index.html（需要管理员密码）
app.get('/', (req, res, next) => {
    // 如果是API请求，跳过
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // 检查是否已登录（通过cookie或query参数）
    const adminPassword = req.query.password || req.headers['x-admin-password'];
    
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
        // 返回登录页面
        return res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台登录</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 90%;
            max-width: 400px;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 28px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .error {
            color: #e74c3c;
            text-align: center;
            margin-top: 10px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔐 管理后台</h1>
        <form id="loginForm">
            <div class="input-group">
                <label for="password">管理员密码</label>
                <input type="password" id="password" placeholder="请输入管理员密码" required>
            </div>
            <button type="submit">登录</button>
            <div class="error" id="error">密码错误，请重试</div>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            window.location.href = '/?password=' + encodeURIComponent(password);
        });
    </script>
</body>
</html>
        `);
    }
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 临时邮箱服务API配置
const TEMP_MAIL_API = 'https://www.1secmail.com/api/v1/';

// 模拟模式 - 用于测试（当外部API不可用时）
const USE_MOCK_MODE = process.env.USE_MOCK_MODE === 'true' || false;

// 可用的域名列表（备用）
const FALLBACK_DOMAINS = [
    '1secmail.com',
    '1secmail.org',
    '1secmail.net',
    'wwjmp.com',
    'esiix.com'
];

// ==================== API路由（需要API密钥和速率限制） ====================

// 为所有API路由添加速率限制和API密钥验证
app.use('/api/*', rateLimiter, verifyApiKey);

// 获取可用的邮箱服务列表
app.get('/api/services', (req, res) => {
    try {
        const services = emailService.getAvailableServices();
        res.json({
            success: true,
            services: services
        });
    } catch (error) {
        console.error('[API] 获取服务列表失败:', error.message);
        res.status(500).json({
            success: false,
            error: '获取服务列表失败'
        });
    }
});

/**
 * 生成随机临时邮箱 - 使用新的邮件服务
 * 支持指定服务类型
 */
app.post('/api/generate-email', async (req, res) => {
    try {
        const { service } = req.body;
        console.log('[API] 开始生成邮箱...', service ? `(指定服务: ${service})` : '(自动选择)');
        
        // 使用新的邮件服务，支持指定服务类型
        const result = await emailService.generateEmail(service);
        
        if (result.success) {
            // 同时保存到旧的存储中以保持兼容性
            emailStore.set(result.email, {
                email: result.email,
                service: result.service,
                createdAt: Date.now(),
                messages: [],
                webUrl: result.webUrl,
                info: result.info
            });
            
            console.log('[API] 邮箱生成成功:', result.email, '(服务:', result.service + ')');
            
            res.json({
                success: true,
                email: result.email,
                service: result.service,
                webUrl: result.webUrl,
                info: result.info
            });
        } else {
            throw new Error(result.error || '生成邮箱失败');
        }
    } catch (error) {
        console.error('[API] 生成邮箱失败:', error.message);
        res.status(500).json({
            success: false,
            error: '生成邮箱失败: ' + error.message
        });
    }
});

/**
 * 获取邮箱收到的邮件列表 - 使用新的邮件服务
 */
app.get('/api/get-messages/:email', async (req, res) => {
    try {
        const email = req.params.email;
        console.log('[API] 获取邮件列表:', email);
        
        // 使用新的邮件服务
        const result = await emailService.getMessages(email);
        
        if (result.success) {
            console.log('[API] 获取到', result.messages.length, '封邮件');
            res.json({
                success: true,
                messages: result.messages,
                count: result.messages.length
            });
        } else {
            throw new Error(result.error || '获取邮件失败');
        }
    } catch (error) {
        console.error('[API] 获取邮件失败:', error.message);
        res.status(500).json({
            success: false,
            error: '获取邮件失败: ' + error.message
        });
    }
});

/**
 * 获取邮件详细内容 - 使用新的邮件服务
 */
app.get('/api/get-message/:email/:messageId', async (req, res) => {
    try {
        const { email, messageId } = req.params;
        console.log('[API] 获取邮件详情:', email, messageId);
        
        // 使用新的邮件服务
        const result = await emailService.getMessageBody(email, messageId);
        
        if (result.success) {
            // 提取验证码
            const verificationCode = emailService.extractVerificationCode(
                result.message.textBody || result.message.body
            );
            
            console.log('[API] 邮件详情获取成功, 验证码:', verificationCode || '未找到');
            
            res.json({
                success: true,
                message: result.message,
                verificationCode: verificationCode
            });
        } else {
            throw new Error(result.error || '获取邮件详情失败');
        }
    } catch (error) {
        console.error('[API] 获取邮件详情失败:', error.message);
        res.status(500).json({
            success: false,
            error: '获取邮件详情失败: ' + error.message
        });
    }
});

/**
 * 轮询检查验证码
 */
app.get('/api/wait-for-code/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const emailData = emailStore.get(email);
        
        if (!emailData) {
            return res.status(404).json({
                success: false,
                error: '邮箱不存在'
            });
        }
        
        // 最多等待60秒
        const maxAttempts = 30;
        const interval = 2000; // 2秒检查一次
        
        for (let i = 0; i < maxAttempts; i++) {
            // 获取邮件列表
            const response = await axios.get(
                `${TEMP_MAIL_API}?action=getMessages&login=${emailData.username}&domain=${emailData.domain}`
            );
            
            const messages = response.data;
            
            if (messages && messages.length > 0) {
                // 获取最新邮件的详情
                const latestMessage = messages[0];
                const messageDetail = await axios.get(
                    `${TEMP_MAIL_API}?action=readMessage&login=${emailData.username}&domain=${emailData.domain}&id=${latestMessage.id}`
                );
                
                const verificationCode = extractVerificationCode(
                    messageDetail.data.body || messageDetail.data.textBody
                );
                
                if (verificationCode) {
                    return res.json({
                        success: true,
                        code: verificationCode,
                        message: messageDetail.data
                    });
                }
            }
            
            // 等待后继续检查
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        res.json({
            success: false,
            error: '超时未收到验证码'
        });
    } catch (error) {
        console.error('等待验证码失败:', error);
        res.status(500).json({
            success: false,
            error: '等待验证码失败'
        });
    }
});

/**
 * 生成随机用户名
 */
function generateRandomUsername() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < 10; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
}

/**
 * 从邮件内容中提取验证码
 */
function extractVerificationCode(content) {
    if (!content) return null;
    
    // 常见验证码模式
    const patterns = [
        /verification code[:\s]+([A-Z0-9]{4,8})/i,
        /code[:\s]+([A-Z0-9]{4,8})/i,
        /验证码[：:\s]+([A-Z0-9]{4,8})/i,
        /\b([A-Z0-9]{6})\b/,
        /\b([0-9]{4,8})\b/
    ];
    
    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        emailCount: emailStore.size
    });
});

// 测试端点
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '后端服务正常运行',
        timestamp: new Date().toISOString()
    });
});

// 获取所有邮箱列表 - 支持分页
app.get('/api/emails', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        
        let allEmails = await emailService.getAllEmails();
        
        // 搜索过滤
        if (search) {
            allEmails = allEmails.filter(e => e.email.includes(search));
        }
        
        // 排序（最新的在前面）- 降序
        allEmails.sort((a, b) => {
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            return timeB - timeA; // 降序：大的在前
        });
        
        // 计算分页
        const total = allEmails.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pagedEmails = allEmails.slice(start, end);
        
        // 获取邮件数量（只获取当前页的）
        const emails = [];
        for (const emailInfo of pagedEmails) {
            let messageCount = 0;
            try {
                const messagesResult = await emailService.getMessages(emailInfo.email);
                if (messagesResult.success) {
                    messageCount = messagesResult.messages.length;
                }
            } catch (error) {
                console.log('[API] 获取邮件数量失败:', emailInfo.email);
            }
            
            emails.push({
                email: emailInfo.email,
                service: emailInfo.service,
                createdAt: emailInfo.createdAt,
                messageCount: messageCount,
                webUrl: emailInfo.webUrl
            });
        }
        
        console.log(`[API] 返回第 ${page} 页，共 ${emails.length} 个邮箱（总计 ${total} 个）`);
        
        res.json({
            success: true,
            emails: emails,
            pagination: {
                page: page,
                pageSize: pageSize,
                total: total,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('[API] 获取邮箱列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取邮箱列表失败'
        });
    }
});

// 删除邮箱
app.delete('/api/delete-email/:email', (req, res) => {
    try {
        const email = req.params.email;
        console.log('[API] 尝试删除邮箱:', email);
        
        // 从两个存储中都删除
        const deletedFromStore = emailStore.delete(email);
        const deletedFromService = emailService.deleteEmail(email);
        
        if (deletedFromStore || deletedFromService) {
            console.log('[API] 邮箱删除成功:', email);
            res.json({
                success: true,
                message: '邮箱已删除'
            });
        } else {
            console.log('[API] 邮箱不存在:', email);
            res.status(404).json({
                success: false,
                error: '邮箱不存在'
            });
        }
    } catch (error) {
        console.error('[API] 删除邮箱失败:', error);
        res.status(500).json({
            success: false,
            error: '删除邮箱失败: ' + error.message
        });
    }
});

// 批量删除邮箱
app.post('/api/delete-emails', (req, res) => {
    try {
        const { emails } = req.body;
        
        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({
                success: false,
                error: '无效的邮箱列表'
            });
        }
        
        let deletedCount = 0;
        for (const email of emails) {
            const deleted1 = emailStore.delete(email);
            const deleted2 = emailService.deleteEmail(email);
            if (deleted1 || deleted2) {
                deletedCount++;
            }
        }
        
        console.log(`[API] 批量删除 ${deletedCount} 个邮箱`);
        
        res.json({
            success: true,
            message: `成功删除 ${deletedCount} 个邮箱`,
            deletedCount: deletedCount
        });
    } catch (error) {
        console.error('[API] 批量删除失败:', error);
        res.status(500).json({
            success: false,
            error: '批量删除失败'
        });
    }
});

// 清空所有邮箱
app.delete('/api/clear-all', (req, res) => {
    try {
        const count = emailService.getAllEmails().length;
        emailStore.clear();
        emailService.clearAll();
        
        console.log(`[API] 清空所有邮箱，共 ${count} 个`);
        
        res.json({
            success: true,
            message: `已清空 ${count} 个邮箱`,
            count: count
        });
    } catch (error) {
        console.error('[API] 清空失败:', error);
        res.status(500).json({
            success: false,
            error: '清空失败'
        });
    }
});

// 清理过期邮箱 (24小时)
setInterval(() => {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [email, data] of emailStore.entries()) {
        if (now - data.createdAt > expirationTime) {
            emailStore.delete(email);
            console.log(`[清理] 过期邮箱: ${email}`);
        }
    }
}, 60 * 60 * 1000); // 每小时检查一次

// ==================== 账号存储（使用Vercel KV）====================

// 加载账号
async function loadAccounts() {
    try {
        const accounts = await kv.get('accounts');
        return accounts || [];
    } catch (error) {
        console.error('从KV加载账号失败:', error);
        return [];
    }
}

// 保存单个账号
async function saveAccount(account) {
    try {
        const accounts = await loadAccounts();
        accounts.unshift(account);
        await kv.set('accounts', accounts);
        console.log('✅ 账号保存成功:', account.email);
        return true;
    } catch (error) {
        console.error('❌ 保存账号到KV失败:', error);
        return false;
    }
}

// 保存整个账号数组
async function saveAccounts(accounts) {
    try {
        await kv.set('accounts', accounts);
        console.log('✅ 账号数组保存成功，共', accounts.length, '个');
        return true;
    } catch (error) {
        console.error('❌ 保存账号数组到KV失败:', error);
        return false;
    }
}

// 保存账号信息
app.post('/api/save-account', async (req, res) => {
    try {
        const { email, password, service = 'Windsurf' } = req.body;
        
        console.log('📝 收到保存账号请求:', email, service);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '邮箱和密码不能为空'
            });
        }
        
        const accounts = await loadAccounts();
        console.log('📖 当前账号数量:', accounts.length);
        
        // 检查是否已存在
        const existingIndex = accounts.findIndex(acc => acc.email === email);
        
        const accountInfo = {
            email,
            password,
            service,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        if (existingIndex >= 0) {
            // 更新现有账号
            console.log('🔄 更新现有账号:', email);
            accounts[existingIndex] = {
                ...accounts[existingIndex],
                ...accountInfo
            };
        } else {
            // 添加新账号
            console.log('➕ 添加新账号:', email);
            accounts.push(accountInfo);
        }
        
        console.log('💾 开始保存到Upstash...');
        const saved = await saveAccounts(accounts);
        
        if (saved) {
            // 验证保存
            const savedAccounts = await loadAccounts();
            console.log('✅ 验证: 现在有', savedAccounts.length, '个账号');
            
            res.json({
                success: true,
                message: '账号已保存',
                account: accountInfo
            });
        } else {
            res.status(500).json({
                success: false,
                error: '保存失败'
            });
        }
    } catch (error) {
        console.error('❌ 保存账号失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取所有账号
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await loadAccounts();
        
        // 按创建时间降序排列
        accounts.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeB - timeA;
        });
        
        res.json({
            success: true,
            accounts,
            total: accounts.length
        });
    } catch (error) {
        console.error('获取账号列表失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 删除账号
app.delete('/api/accounts/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const accounts = await loadAccounts();
        const filteredAccounts = accounts.filter(acc => acc.email !== email);
        
        if (accounts.length === filteredAccounts.length) {
            return res.status(404).json({
                success: false,
                error: '账号不存在'
            });
        }
        
        await saveAccounts(filteredAccounts);
        
        res.json({
            success: true,
            message: '账号已删除'
        });
    } catch (error) {
        console.error('删除账号失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 更新账号状态
app.patch('/api/accounts/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { status, notes } = req.body;
        
        const accounts = await loadAccounts();
        const accountIndex = accounts.findIndex(acc => acc.email === email);
        
        if (accountIndex < 0) {
            return res.status(404).json({
                success: false,
                error: '账号不存在'
            });
        }
        
        if (status) accounts[accountIndex].status = status;
        if (notes !== undefined) accounts[accountIndex].notes = notes;
        accounts[accountIndex].updatedAt = new Date().toISOString();
        
        await saveAccounts(accounts);
        
        res.json({
            success: true,
            message: '账号已更新',
            account: accounts[accountIndex]
        });
    } catch (error) {
        console.error('更新账号失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== IP使用记录（使用Vercel KV）====================

// 加载IP使用记录
async function loadIPUsage() {
    try {
        const ipData = await kv.get('ip-usage');
        return ipData || {};
    } catch (error) {
        console.error('从KV加载IP使用记录失败:', error);
        return {};
    }
}

// 保存IP使用记录
async function saveIPUsage(ipData) {
    try {
        await kv.set('ip-usage', ipData);
        return true;
    } catch (error) {
        console.error('保存IP使用记录到KV失败:', error);
        return false;
    }
}

// 获取客户端真实IP
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

// 检查IP使用次数（增强版：支持黑白名单）
app.get('/api/check-ip-usage', async (req, res) => {
    try {
        const clientIP = getClientIP(req);
        
        // 检查黑白名单
        const whitelist = await kv.get('ip-whitelist') || [];
        const blacklist = await kv.get('ip-blacklist') || [];
        
        // 黑名单直接拒绝
        if (blacklist.includes(clientIP)) {
            console.log(`❌ IP ${clientIP} 在黑名单中`);
            return res.status(403).json({
                success: false,
                error: '该IP已被禁止访问',
                ip: clientIP,
                status: 'blacklisted',
                needActivation: false
            });
        }
        
        // 白名单无需激活
        if (whitelist.includes(clientIP)) {
            console.log(`✅ IP ${clientIP} 在白名单中`);
            return res.json({
                success: true,
                ip: clientIP,
                usageCount: 0,
                isActivated: true,
                needActivation: false,
                status: 'whitelisted',
                message: '白名单用户，无需激活'
            });
        }
        
        // 普通IP检查
        const ipUsage = await loadIPUsage();
        const ipData = ipUsage[clientIP] || {
            count: 0,
            activated: false,
            firstUse: null,
            lastUse: null
        };
        
        console.log(`IP ${clientIP} 使用记录:`, ipData);
        
        res.json({
            success: true,
            ip: clientIP,
            usageCount: ipData.count,
            isActivated: ipData.activated,
            needActivation: ipData.count >= 1 && !ipData.activated,
            status: 'normal'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 记录IP使用
app.post('/api/record-ip-usage', async (req, res) => {
    try {
        const clientIP = getClientIP(req);
        const ipUsage = await loadIPUsage();
        
        if (!ipUsage[clientIP]) {
            ipUsage[clientIP] = {
                count: 0,
                activated: false,
                firstUse: new Date().toISOString(),
                lastUse: new Date().toISOString()
            };
        }
        
        ipUsage[clientIP].count++;
        ipUsage[clientIP].lastUse = new Date().toISOString();
        
        await saveIPUsage(ipUsage);
        
        console.log(`IP ${clientIP} 使用次数: ${ipUsage[clientIP].count}`);
        
        res.json({
            success: true,
            usageCount: ipUsage[clientIP].count,
            needActivation: ipUsage[clientIP].count >= 2 && !ipUsage[clientIP].activated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== 动态码API（使用Vercel KV）====================

// 加载动态码
async function loadActivationCodes() {
    try {
        const codes = await kv.get('activation-codes');
        return codes || [];
    } catch (error) {
        console.error('从KV加载动态码失败:', error);
        return [];
    }
}

// 保存动态码
async function saveActivationCodes(codes) {
    try {
        await kv.set('activation-codes', codes);
        return true;
    } catch (error) {
        console.error('保存动态码到KV失败:', error);
        return false;
    }
}

// 验证动态码（增强版：支持有效期和使用次数）
app.post('/api/verify-code', async (req, res) => {
    try {
        const { code } = req.body;
        const clientIP = getClientIP(req);
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: '请输入动态码'
            });
        }
        
        // 检查黑白名单
        const whitelist = await kv.get('ip-whitelist') || [];
        const blacklist = await kv.get('ip-blacklist') || [];
        
        if (blacklist.includes(clientIP)) {
            console.log(`❌ IP ${clientIP} 在黑名单中`);
            return res.status(403).json({
                success: false,
                error: '该IP已被禁止访问'
            });
        }
        
        if (whitelist.includes(clientIP)) {
            console.log(`✅ IP ${clientIP} 在白名单中，自动激活`);
            // 白名单用户自动激活，无需验证码
            const ipUsage = await loadIPUsage();
            if (!ipUsage[clientIP]) {
                ipUsage[clientIP] = {
                    count: 0,
                    activated: false,
                    firstUse: new Date().toISOString(),
                    lastUse: new Date().toISOString()
                };
            }
            ipUsage[clientIP].activated = true;
            ipUsage[clientIP].activationCode = '白名单用户';
            ipUsage[clientIP].activatedAt = new Date().toISOString();
            await saveIPUsage(ipUsage);
            
            return res.json({
                success: true,
                message: '白名单用户，自动激活成功'
            });
        }
        
        // 从文件加载动态码列表
        const codes = await loadActivationCodes();
        
        // 查找动态码
        const codeIndex = codes.findIndex(c => c.code === code);
        
        if (codeIndex === -1) {
            console.log(`动态码不存在: ${code}`);
            return res.status(400).json({
                success: false,
                error: '动态码不存在或已失效'
            });
        }
        
        const codeData = codes[codeIndex];
        const now = new Date();
        
        // 检查是否过期
        if (codeData.expiresAt && new Date(codeData.expiresAt) < now) {
            console.log(`动态码已过期: ${code}`);
            return res.status(400).json({
                success: false,
                error: '此动态码已过期'
            });
        }
        
        // 初始化使用次数相关字段（兼容旧版本）
        if (codeData.maxUses === undefined) {
            codeData.maxUses = 1; // 旧版本默认只能用1次
        }
        if (codeData.usedCount === undefined) {
            codeData.usedCount = codeData.used ? 1 : 0;
        }
        if (!codeData.usedBy || !Array.isArray(codeData.usedBy)) {
            codeData.usedBy = codeData.usedBy ? [codeData.usedBy] : [];
        }
        
        // 检查使用次数是否已达上限
        if (codeData.maxUses > 0 && codeData.usedCount >= codeData.maxUses) {
            console.log(`动态码使用次数已达上限: ${code}, ${codeData.usedCount}/${codeData.maxUses}`);
            return res.status(400).json({
                success: false,
                error: `此动态码使用次数已达上限 (${codeData.usedCount}/${codeData.maxUses})`
            });
        }
        
        // 增加使用次数
        codes[codeIndex].usedCount = (codeData.usedCount || 0) + 1;
        codes[codeIndex].usedBy = [...(codeData.usedBy || []), clientIP];
        codes[codeIndex].usedAt = now.toISOString();
        
        // 如果达到最大使用次数，标记为已使用（兼容旧版本）
        if (codeData.maxUses > 0 && codes[codeIndex].usedCount >= codeData.maxUses) {
            codes[codeIndex].used = true;
        }
        
        await saveActivationCodes(codes);
        
        // 标记该IP已激活
        const ipUsage = await loadIPUsage();
        if (!ipUsage[clientIP]) {
            ipUsage[clientIP] = {
                count: 0,
                activated: false,
                firstUse: new Date().toISOString(),
                lastUse: new Date().toISOString()
            };
        }
        
        ipUsage[clientIP].activated = true;
        ipUsage[clientIP].activationCode = code;
        ipUsage[clientIP].activatedAt = new Date().toISOString();
        await saveIPUsage(ipUsage);
        
        console.log(`✅ IP ${clientIP} 激活成功，动态码: ${code}, 使用次数: ${codes[codeIndex].usedCount}/${codeData.maxUses === 0 ? '∞' : codeData.maxUses}`);
        
        res.json({
            success: true,
            message: '动态码验证成功',
            remainingUses: codeData.maxUses === 0 ? '无限' : codeData.maxUses - codes[codeIndex].usedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 保存动态码到服务器
app.post('/api/save-activation-codes', async (req, res) => {
    try {
        const { codes } = req.body;
        
        console.log('📝 收到保存动态码请求:', codes?.length, '个');
        
        if (!Array.isArray(codes)) {
            return res.status(400).json({
                success: false,
                error: '动态码格式错误'
            });
        }
        
        console.log('💾 开始保存到KV...');
        const saveResult = await saveActivationCodes(codes);
        console.log('✅ 保存结果:', saveResult);
        
        // 立即读取验证
        console.log('🔍 验证保存...');
        const savedCodes = await loadActivationCodes();
        console.log('✅ 读取到', savedCodes?.length, '个动态码');
        
        res.json({
            success: true,
            message: '动态码已保存',
            count: codes.length,
            verified: savedCodes?.length === codes.length,
        });
    } catch (error) {
        console.error('❌ 保存动态码失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取所有动态码
app.get('/api/get-activation-codes', async (req, res) => {
    try {
        console.log('📖 收到获取动态码请求');
        const codes = await loadActivationCodes();
        console.log('✅ 从KV加载到', codes?.length, '个动态码');
        res.json({
            success: true,
            codes: codes,
            count: codes?.length || 0,
        });
    } catch (error) {
        console.error('❌ 获取动态码失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取所有IP记录
app.get('/api/get-ip-records', async (req, res) => {
    try {
        const ipUsage = await loadIPUsage();
        
        res.json({
            success: true,
            records: ipUsage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 重置IP激活状态（管理员功能）
app.post('/api/reset-ip-activation', async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: '请提供IP地址'
            });
        }
        
        const ipUsage = await loadIPUsage();
        
        if (ipUsage[ip]) {
            ipUsage[ip].activated = false;
            ipUsage[ip].activationCode = null;
            ipUsage[ip].activatedAt = null;
            await saveIPUsage(ipUsage);
            
            console.log(`✅ 已重置IP ${ip} 的激活状态`);
            
            res.json({
                success: true,
                message: 'IP激活状态已重置'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'IP记录不存在'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 环境变量检查API
app.get('/api/check-env', (req, res) => {
    const envCheck = {
        REDIS_REST_API_URL: !!process.env.REDIS_REST_API_URL,
        REDIS_REST_API_TOKEN: !!process.env.REDIS_REST_API_TOKEN,
        STORAGE_REST_API_URL: !!process.env.STORAGE_REST_API_URL,
        STORAGE_REST_API_TOKEN: !!process.env.STORAGE_REST_API_TOKEN,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        REDIS_URL: !!process.env.REDIS_URL,
        allEnvKeys: Object.keys(process.env).filter(k => 
            k.includes('REDIS') || k.includes('KV') || k.includes('STORAGE')
        ),
    };
    
    res.json({
        success: true,
        kvInitialized: !!kv,
        environmentVariables: envCheck,
        message: envCheck.allEnvKeys.length > 0 
            ? '找到了相关环境变量' 
            : '❌ 没有找到任何KV相关的环境变量！',
    });
});

// KV读写测试API
app.get('/api/test-kv', async (req, res) => {
    try {
        const testKey = 'test-key-' + Date.now();
        const testValue = { message: 'Hello KV', timestamp: Date.now() };
        
        // 尝试写入
        console.log('🧪 测试写入KV:', testKey, testValue);
        const setResult = await kv.set(testKey, testValue);
        console.log('✅ 写入结果:', setResult);
        
        // 尝试读取
        console.log('🧪 测试读取KV:', testKey);
        const getValue = await kv.get(testKey);
        console.log('✅ 读取结果:', getValue);
        
        // 验证
        const success = getValue && getValue.message === testValue.message;
        
        res.json({
            success: success,
            test: {
                key: testKey,
                writeValue: testValue,
                readValue: getValue,
                match: success,
            },
            message: success ? '✅ KV读写测试成功！' : '❌ KV读写测试失败！',
        });
    } catch (error) {
        console.error('❌ KV测试失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            message: '❌ KV读写测试失败：' + error.message,
        });
    }
});

// 获取打赏二维码API
app.get('/api/get-donation-qrcode', async (req, res) => {
    try {
        console.log('📥 请求获取二维码');
        const qrCode = await kv.get('donation-qrcode');
        console.log('✅ 二维码获取', qrCode ? `成功(${qrCode.length}字节)` : '成功(无数据)');
        res.json({
            success: true,
            qrCode: qrCode || null
        });
    } catch (error) {
        console.error('❌ 获取二维码失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 保存打赏二维码API
app.post('/api/save-donation-qrcode', async (req, res) => {
    try {
        const { qrCode } = req.body;
        
        if (!qrCode) {
            return res.status(400).json({
                success: false,
                error: '二维码数据不能为空'
            });
        }
        
        console.log('📤 请求保存二维码，大小:', qrCode.length, '字节');
        
        await kv.set('donation-qrcode', qrCode);
        console.log('✅ 二维码保存到Upstash成功');
        
        // 立即读取验证
        const saved = await kv.get('donation-qrcode');
        console.log('🔍 验证保存:', saved ? `成功(${saved.length}字节)` : '失败');
        
        res.json({
            success: true,
            message: '二维码已保存',
            verified: !!saved
        });
    } catch (error) {
        console.error('❌ 保存二维码失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =========================
// IP黑白名单管理 API
// =========================

// 获取黑白名单
app.get('/api/get-ip-lists', async (req, res) => {
    try {
        const whitelist = await kv.get('ip-whitelist') || [];
        const blacklist = await kv.get('ip-blacklist') || [];
        
        res.json({
            success: true,
            whitelist,
            blacklist
        });
    } catch (error) {
        console.error('获取黑白名单失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 保存黑白名单
app.post('/api/save-ip-lists', async (req, res) => {
    try {
        const { whitelist, blacklist } = req.body;
        
        await kv.set('ip-whitelist', whitelist || []);
        await kv.set('ip-blacklist', blacklist || []);
        
        console.log('✅ 黑白名单已保存');
        console.log('白名单:', whitelist?.length || 0, '个');
        console.log('黑名单:', blacklist?.length || 0, '个');
        
        res.json({
            success: true,
            message: '黑白名单已保存'
        });
    } catch (error) {
        console.error('保存黑白名单失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 检查IP状态（白名单/黑名单/普通）
app.get('/api/check-ip-status/:ip', async (req, res) => {
    try {
        const { ip } = req.params;
        const whitelist = await kv.get('ip-whitelist') || [];
        const blacklist = await kv.get('ip-blacklist') || [];
        
        let status = 'normal'; // normal, whitelisted, blacklisted
        let needActivation = true;
        
        if (blacklist.includes(ip)) {
            status = 'blacklisted';
            needActivation = false; // 黑名单直接拒绝
        } else if (whitelist.includes(ip)) {
            status = 'whitelisted';
            needActivation = false; // 白名单无需激活
        }
        
        res.json({
            success: true,
            ip,
            status,
            needActivation: needActivation ? await checkIPNeedsActivation(ip) : false,
            message: status === 'blacklisted' ? '该IP已被禁止访问' : 
                     status === 'whitelisted' ? '欢迎白名单用户' : '普通用户'
        });
    } catch (error) {
        console.error('检查IP状态失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 检查IP是否需要激活（辅助函数）
async function checkIPNeedsActivation(ip) {
    try {
        const ipUsage = await kv.get(`ip-usage:${ip}`);
        if (!ipUsage) return false;
        
        const usageCount = ipUsage.count || 0;
        const isActivated = ipUsage.activated || false;
        
        // 首次使用免费，第二次需要激活码
        return usageCount >= 1 && !isActivated;
    } catch (error) {
        console.error('检查IP激活状态失败:', error);
        return false;
    }
}

// Vercel serverless function export
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // Local development
    app.listen(PORT, () => {
        console.log(`========================================`);
        console.log(`临时邮箱服务运行在 http://localhost:${PORT}`);
        console.log(`健康检查: http://localhost:${PORT}/health`);
        console.log(`测试接口: http://localhost:${PORT}/api/test`);
        console.log(`========================================`);
        console.log(`API endpoints:`);
        console.log(`  POST   /api/generate-email      - Generate a temporary email`);
        console.log(`  GET    /api/get-messages/:email - Get messages for an email`);
        console.log(`  GET    /api/get-message/:email/:id - Get specific message`);
        console.log(`  GET    /api/emails               - List all emails`);
        console.log(`  DELETE /api/emails/:email        - Delete an email`);
        console.log(`  POST   /api/save-account         - Save account credentials`);
        console.log(`  GET    /api/accounts             - Get all saved accounts`);
        console.log(`  DELETE /api/accounts/:email      - Delete a saved account`);
        console.log(`  GET    /api/get-donation-qrcode  - 获取打赏二维码`);
        console.log(`  POST   /api/save-donation-qrcode - 保存打赏二维码`);
    });
}
