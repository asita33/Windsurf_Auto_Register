// 真正可用的邮件接收服务
// 使用多个备用服务，确保至少有一个可用

const axios = require('axios');
const { Redis } = require('@upstash/redis');

class EmailService {
    constructor(kvClient = null) {
        this.services = [
            {
                name: 'NiMail',
                displayName: 'NiMail (推荐)',
                domain: '@nimail.cn',
                description: '中文服务，稳定快速，能接收验证码',
                generateEmail: this.nimailGenerateEmail.bind(this),
                getMessages: this.nimailGetMessages.bind(this),
                available: true,
                recommended: true
            }
        ];
        
        this.currentService = null;
        this.emailData = new Map(); // 内存缓存
        this.kv = kvClient; // Upstash Redis客户端，用于持久化
    }
    
    // 保存邮箱数据到Upstash
    async saveEmailData(email, data) {
        this.emailData.set(email, data);
        if (this.kv) {
            try {
                await this.kv.hset('email-data', { [email]: JSON.stringify(data) });
                console.log('[EmailService] 邮箱数据已保存到Upstash:', email);
            } catch (error) {
                console.error('[EmailService] 保存邮箱数据失败:', error);
            }
        }
    }
    
    // 从Upstash加载邮箱数据
    async loadEmailData(email) {
        // 先从内存缓存查找
        if (this.emailData.has(email)) {
            return this.emailData.get(email);
        }
        
        // 从Upstash加载
        if (this.kv) {
            try {
                const data = await this.kv.hget('email-data', email);
                if (data) {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    this.emailData.set(email, parsed);
                    console.log('[EmailService] 从Upstash加载邮箱数据:', email);
                    return parsed;
                }
            } catch (error) {
                console.error('[EmailService] 加载邮箱数据失败:', error);
            }
        }
        
        return null;
    }
    
    // 加载所有邮箱数据
    async loadAllEmailData() {
        if (this.kv) {
            try {
                const allData = await this.kv.hgetall('email-data');
                if (allData) {
                    for (const [email, dataStr] of Object.entries(allData)) {
                        const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
                        this.emailData.set(email, data);
                    }
                    console.log('[EmailService] 从Upstash加载了', this.emailData.size, '个邮箱');
                }
            } catch (error) {
                console.error('[EmailService] 加载所有邮箱数据失败:', error);
            }
        }
    }
    
    // 获取所有可用服务列表
    getAvailableServices() {
        return this.services.map(service => ({
            name: service.name,
            displayName: service.displayName,
            domain: service.domain,
            description: service.description,
            available: service.available,
            recommended: service.recommended
        }));
    }
    
    // === NiMail 服务 ===
    async nimailGenerateEmail() {
        try {
            console.log('[NiMail] 生成邮箱...');
            
            // 生成随机邮箱名
            const username = this.generateRandomString(8);
            const email = `${username}@nimail.cn`;
            
            // 申请邮箱
            const response = await axios.post('https://www.nimail.cn/api/applymail', 
                `mail=${encodeURIComponent(email)}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'accept-language': 'zh-CN',
                        'origin': 'https://www.nimail.cn',
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 10000
                }
            );
            
            console.log('[NiMail] API响应:', response.data);
            
            // 保存邮箱信息
            await this.saveEmailData(email, {
                service: 'NiMail',
                email: email,
                username: username,
                createdAt: Date.now()
            });
            
            console.log('[NiMail] 邮箱生成成功:', email);
            
            return {
                success: true,
                email: email,
                service: 'NiMail'
            };
        } catch (error) {
            console.error('[NiMail] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async nimailGetMessages(email) {
        try {
            console.log('[NiMail] 获取邮件:', email);
            
            const timestamp = Date.now();
            const response = await axios.post('https://www.nimail.cn/api/getmails',
                `mail=${encodeURIComponent(email)}&time=0&_=${timestamp}`,
                {
                    headers: {
                        'accept': 'application/json',
                        'accept-language': 'zh-CN,zh',
                        'origin': 'https://www.nimail.cn',
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 10000
                }
            );
            
            console.log('[NiMail] 完整响应:', JSON.stringify(response.data));
            
            // NiMail 的响应格式: {"to":"xxx@nimail.cn","mail":[],"success":"true","time":1762720901}
            if (response.data && response.data.mail && Array.isArray(response.data.mail)) {
                const mailList = response.data.mail;
                
                const messages = mailList.map(msg => ({
                    id: msg.id || msg.mailId || msg.mid,
                    from: msg.from || msg.sender || msg.fromAddress,
                    subject: msg.subject || msg.title || msg.mailSubject,
                    date: msg.date || msg.time || msg.mailDate,
                    body: msg.content || msg.body || msg.mailContent || msg.text,
                    excerpt: (msg.content || msg.body || msg.mailContent || msg.text || '').substring(0, 100)
                }));
                
                console.log('[NiMail] 获取到', messages.length, '封邮件');
                return { success: true, messages: messages };
            }
            
            console.log('[NiMail] 暂无邮件');
            return { success: true, messages: [] };
        } catch (error) {
            console.error('[NiMail] 获取邮件失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async nimailGetMessageBody(email, messageId) {
        try {
            // NiMail 的邮件内容已经在列表中返回了
            const messagesResult = await this.nimailGetMessages(email);
            if (messagesResult.success) {
                const message = messagesResult.messages.find(m => m.id == messageId);
                if (message) {
                    return {
                        success: true,
                        message: {
                            id: message.id,
                            from: message.from,
                            subject: message.subject,
                            body: message.body,
                            textBody: message.body,
                            date: message.date
                        }
                    };
                }
            }
            throw new Error('邮件不存在');
        } catch (error) {
            console.error('[NiMail] 获取邮件内容失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // === Maildrop 服务 ===
    async maildropGenerateEmail() {
        try {
            console.log('[Maildrop] 生成邮箱...');
            
            // Maildrop 不需要注册，直接生成邮箱名即可
            const username = this.generateRandomString(12);
            const email = `${username}@maildrop.cc`;
            
            // 保存邮箱信息
            this.emailData.set(email, {
                service: 'Maildrop',
                email: email,
                username: username,
                createdAt: Date.now(),
                webUrl: `https://maildrop.cc/inbox/${username}`
            });
            
            console.log('[Maildrop] 邮箱生成成功:', email);
            console.log('[Maildrop] 查看邮件: https://maildrop.cc/inbox/' + username);
            
            return {
                success: true,
                email: email,
                service: 'Maildrop',
                webUrl: `https://maildrop.cc/inbox/${username}`,
                info: '请访问网页查看邮件（完全公开）'
            };
        } catch (error) {
            console.error('[Maildrop] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async maildropGetMessages(email) {
        try {
            console.log('[Maildrop] 获取邮件:', email);
            
            const emailInfo = this.emailData.get(email);
            if (!emailInfo) {
                return { success: false, error: '邮箱不存在' };
            }
            
            // Maildrop 需要通过网页API获取
            const username = emailInfo.username;
            const response = await axios.get(`https://maildrop.cc/api/inbox/${username}`, {
                timeout: 10000
            });
            
            if (response.data && Array.isArray(response.data)) {
                const messages = response.data.map(msg => ({
                    id: msg.id,
                    from: msg.from,
                    subject: msg.subject,
                    date: msg.date,
                    excerpt: msg.excerpt || ''
                }));
                
                console.log('[Maildrop] 获取到', messages.length, '封邮件');
                return { 
                    success: true, 
                    messages: messages,
                    webUrl: emailInfo.webUrl
                };
            }
            
            return { 
                success: true, 
                messages: [],
                webUrl: emailInfo.webUrl
            };
        } catch (error) {
            console.error('[Maildrop] 获取邮件失败:', error.message);
            const emailInfo = this.emailData.get(email);
            return { 
                success: true, 
                messages: [],
                info: '请访问网页查看邮件',
                webUrl: emailInfo ? emailInfo.webUrl : null
            };
        }
    }
    
    async maildropGetMessageBody(email, messageId) {
        const emailInfo = this.emailData.get(email);
        return {
            success: false,
            error: 'Maildrop 需要通过网页查看邮件详情',
            webUrl: emailInfo ? emailInfo.webUrl : null
        };
    }
    
    // === TempMail 服务 ===
    async tempmailGenerateEmail() {
        try {
            console.log('[TempMail] 生成邮箱...');
            
            // 生成随机邮箱
            const username = this.generateRandomString(10);
            const email = `${username}@tempmail.plus`;
            
            // 保存邮箱信息
            this.emailData.set(email, {
                service: 'TempMail',
                email: email,
                username: username,
                createdAt: Date.now()
            });
            
            console.log('[TempMail] 邮箱生成成功:', email);
            
            return {
                success: true,
                email: email,
                service: 'TempMail'
            };
        } catch (error) {
            console.error('[TempMail] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async tempmailGetMessages(email) {
        try {
            console.log('[TempMail] 获取邮件:', email);
            
            // TempMail 的 API 可能需要特殊处理
            // 这里返回空列表，实际使用时需要实现具体API
            return {
                success: true,
                messages: [],
                info: '此服务需要通过网页查看'
            };
        } catch (error) {
            console.error('[TempMail] 获取邮件失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async tempmailGetMessageBody(email, messageId) {
        return {
            success: false,
            error: 'TempMail 需要通过网页查看邮件'
        };
    }
    
    // === 10MinuteMail 服务 ===
    async tenminutemailGenerateEmail() {
        try {
            console.log('[10MinuteMail] 生成邮箱...');
            
            const username = this.generateRandomString(10);
            const email = `${username}@10minutemail.com`;
            
            this.emailData.set(email, {
                service: 'TenMinuteMail',
                email: email,
                username: username,
                createdAt: Date.now()
            });
            
            console.log('[10MinuteMail] 邮箱生成成功:', email);
            
            return {
                success: true,
                email: email,
                service: 'TenMinuteMail',
                info: '邮箱有效期10分钟'
            };
        } catch (error) {
            console.error('[10MinuteMail] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async tenminutemailGetMessages(email) {
        return {
            success: true,
            messages: [],
            info: '此服务需要通过网页查看'
        };
    }
    
    async tenminutemailGetMessageBody(email, messageId) {
        return {
            success: false,
            error: '10MinuteMail 需要通过网页查看邮件'
        };
    }
    
    // === Zemail 服务 ===
    async zemailGenerateEmail() {
        try {
            console.log('[Zemail] 生成邮箱...');
            
            // Zemail 需要访问网页来获取邮箱
            // 这里我们使用一个简单的方法：生成随机邮箱名
            const username = this.generateRandomString(20);
            const email = `${username}@zemail.me`;
            
            // 保存邮箱信息
            this.emailData.set(email, {
                service: 'Zemail',
                email: email,
                username: username,
                createdAt: Date.now()
            });
            
            console.log('[Zemail] 邮箱生成成功:', email);
            console.log('[Zemail] 查看邮件: https://zemail.me/mailbox/' + username);
            
            return {
                success: true,
                email: email,
                service: 'Zemail',
                webUrl: 'https://zemail.me/mailbox/' + username
            };
        } catch (error) {
            console.error('[Zemail] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async zemailGetMessages(email) {
        try {
            console.log('[Zemail] 获取邮件:', email);
            
            // Zemail 没有公开的 API，需要通过网页访问
            // 返回提示信息
            return {
                success: true,
                messages: [],
                info: '请访问 https://zemail.me/mailbox 查看邮件'
            };
        } catch (error) {
            console.error('[Zemail] 获取邮件失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async zemailGetMessageBody(email, messageId) {
        return {
            success: false,
            error: 'Zemail 需要通过网页查看邮件'
        };
    }
    
    // === Guerrilla Mail 服务 ===
    async guerrillaGenerateEmail() {
        try {
            console.log('[GuerrillaMail] 生成邮箱...');
            
            // 获取新的邮箱地址
            const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
                params: {
                    f: 'get_email_address',
                    ip: '127.0.0.1',
                    agent: 'Mozilla/5.0'
                },
                timeout: 10000
            });
            
            if (response.data && response.data.email_addr) {
                const email = response.data.email_addr;
                const sid = response.data.sid_token;
                
                // 保存会话信息
                this.emailData.set(email, {
                    service: 'GuerrillaMail',
                    sid: sid,
                    email: email,
                    createdAt: Date.now()
                });
                
                console.log('[GuerrillaMail] 邮箱生成成功:', email);
                
                return {
                    success: true,
                    email: email,
                    service: 'GuerrillaMail'
                };
            }
            
            throw new Error('无法生成邮箱');
        } catch (error) {
            console.error('[GuerrillaMail] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async guerrillaGetMessages(email) {
        try {
            const emailInfo = this.emailData.get(email);
            if (!emailInfo || !emailInfo.sid) {
                throw new Error('邮箱信息不存在');
            }
            
            console.log('[GuerrillaMail] 获取邮件:', email);
            
            const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
                params: {
                    f: 'get_email_list',
                    offset: 0,
                    sid_token: emailInfo.sid
                },
                timeout: 10000
            });
            
            if (response.data && response.data.list) {
                const messages = response.data.list.map(msg => ({
                    id: msg.mail_id,
                    from: msg.mail_from,
                    subject: msg.mail_subject,
                    date: new Date(msg.mail_timestamp * 1000).toISOString(),
                    excerpt: msg.mail_excerpt
                }));
                
                console.log('[GuerrillaMail] 获取到', messages.length, '封邮件');
                return { success: true, messages: messages };
            }
            
            return { success: true, messages: [] };
        } catch (error) {
            console.error('[GuerrillaMail] 获取邮件失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async guerrillaGetMessageBody(email, messageId) {
        try {
            const emailInfo = this.emailData.get(email);
            if (!emailInfo || !emailInfo.sid) {
                throw new Error('邮箱信息不存在');
            }
            
            const response = await axios.get('https://api.guerrillamail.com/ajax.php', {
                params: {
                    f: 'fetch_email',
                    email_id: messageId,
                    sid_token: emailInfo.sid
                },
                timeout: 10000
            });
            
            if (response.data) {
                return {
                    success: true,
                    message: {
                        id: response.data.mail_id,
                        from: response.data.mail_from,
                        subject: response.data.mail_subject,
                        body: response.data.mail_body,
                        textBody: response.data.mail_body.replace(/<[^>]*>/g, ''), // 移除HTML标签
                        date: new Date(response.data.mail_timestamp * 1000).toISOString()
                    }
                };
            }
            
            throw new Error('无法获取邮件内容');
        } catch (error) {
            console.error('[GuerrillaMail] 获取邮件内容失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // === Mail.tm 服务 ===
    async mailtmGenerateEmail() {
        try {
            console.log('[Mail.tm] 生成邮箱...');
            
            // 获取可用域名
            const domainsResponse = await axios.get('https://api.mail.tm/domains', {
                timeout: 10000
            });
            
            if (!domainsResponse.data || !domainsResponse.data['hydra:member'] || domainsResponse.data['hydra:member'].length === 0) {
                throw new Error('无法获取域名');
            }
            
            const domain = domainsResponse.data['hydra:member'][0].domain;
            const username = this.generateRandomString(10);
            const password = this.generateRandomString(16);
            const email = `${username}@${domain}`;
            
            // 创建账号
            const accountResponse = await axios.post('https://api.mail.tm/accounts', {
                address: email,
                password: password
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            // 获取token
            const tokenResponse = await axios.post('https://api.mail.tm/token', {
                address: email,
                password: password
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            const token = tokenResponse.data.token;
            
            // 保存信息
            this.emailData.set(email, {
                service: 'MailTm',
                email: email,
                password: password,
                token: token,
                createdAt: Date.now()
            });
            
            console.log('[Mail.tm] 邮箱生成成功:', email);
            
            return {
                success: true,
                email: email,
                service: 'MailTm'
            };
        } catch (error) {
            console.error('[Mail.tm] 生成失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async mailtmGetMessages(email) {
        try {
            const emailInfo = this.emailData.get(email);
            if (!emailInfo || !emailInfo.token) {
                throw new Error('邮箱信息不存在');
            }
            
            console.log('[Mail.tm] 获取邮件:', email);
            
            const response = await axios.get('https://api.mail.tm/messages', {
                headers: {
                    'Authorization': `Bearer ${emailInfo.token}`
                },
                timeout: 10000
            });
            
            if (response.data && response.data['hydra:member']) {
                const messages = response.data['hydra:member'].map(msg => ({
                    id: msg.id,
                    from: msg.from.address,
                    subject: msg.subject,
                    date: msg.createdAt,
                    excerpt: msg.intro
                }));
                
                console.log('[Mail.tm] 获取到', messages.length, '封邮件');
                return { success: true, messages: messages };
            }
            
            return { success: true, messages: [] };
        } catch (error) {
            console.error('[Mail.tm] 获取邮件失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async mailtmGetMessageBody(email, messageId) {
        try {
            const emailInfo = this.emailData.get(email);
            if (!emailInfo || !emailInfo.token) {
                throw new Error('邮箱信息不存在');
            }
            
            const response = await axios.get(`https://api.mail.tm/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${emailInfo.token}`
                },
                timeout: 10000
            });
            
            if (response.data) {
                return {
                    success: true,
                    message: {
                        id: response.data.id,
                        from: response.data.from.address,
                        subject: response.data.subject,
                        body: response.data.html || response.data.text,
                        textBody: response.data.text,
                        date: response.data.createdAt
                    }
                };
            }
            
            throw new Error('无法获取邮件内容');
        } catch (error) {
            console.error('[Mail.tm] 获取邮件内容失败:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // === 通用方法 ===
    async generateEmail(serviceName = null) {
        // 如果指定了服务名称，只使用该服务
        if (serviceName) {
            const service = this.services.find(s => s.name === serviceName);
            if (service && service.available) {
                console.log(`[EmailService] 使用指定服务: ${service.name}`);
                const result = await service.generateEmail();
                if (result.success) {
                    this.currentService = service.name;
                }
                return result;
            } else {
                return {
                    success: false,
                    error: `服务 ${serviceName} 不可用`
                };
            }
        }
        
        // 否则尝试所有可用的服务
        for (const service of this.services) {
            if (!service.available) continue;
            
            console.log(`[EmailService] 尝试使用 ${service.name}...`);
            const result = await service.generateEmail();
            
            if (result.success) {
                this.currentService = service.name;
                return result;
            }
            
            // 如果失败，标记为不可用
            service.available = false;
        }
        
        return {
            success: false,
            error: '所有邮件服务都不可用'
        };
    }
    
    async getMessages(email) {
        // 先尝试从缓存或Upstash加载
        let emailInfo = await this.loadEmailData(email);
        if (!emailInfo) {
            return { success: false, error: '邮箱不存在' };
        }
        
        const service = this.services.find(s => s.name === emailInfo.service);
        if (!service) {
            return { success: false, error: '服务不可用' };
        }
        
        return await service.getMessages(email);
    }
    
    async getMessageBody(email, messageId) {
        const emailInfo = await this.loadEmailData(email);
        if (!emailInfo) {
            return { success: false, error: '邮箱不存在' };
        }
        
        const serviceName = emailInfo.service;
        
        if (serviceName === 'NiMail') {
            return await this.nimailGetMessageBody(email, messageId);
        } else if (serviceName === 'Zemail') {
            return await this.zemailGetMessageBody(email, messageId);
        } else if (serviceName === 'GuerrillaMail') {
            return await this.guerrillaGetMessageBody(email, messageId);
        } else if (serviceName === 'MailTm') {
            return await this.mailtmGetMessageBody(email, messageId);
        }
        
        return { success: false, error: '不支持的服务' };
    }
    
    async getAllEmails() {
        // 先从Upstash加载所有数据
        await this.loadAllEmailData();
        
        const emails = [];
        for (const [email, data] of this.emailData.entries()) {
            emails.push({
                email: email,
                service: data.service,
                createdAt: data.createdAt
            });
        }
        return emails;
    }
    
    deleteEmail(email) {
        return this.emailData.delete(email);
    }
    
    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // 提取验证码
    extractVerificationCode(content) {
        if (!content) return null;
        
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
    
    // 清空所有邮箱
    clearAll() {
        const count = this.emailData.size;
        this.emailData.clear();
        console.log(`[EmailService] 清空所有邮箱，共 ${count} 个`);
        return count;
    }
}

module.exports = EmailService;
