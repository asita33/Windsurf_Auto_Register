// MailCatcher 邮件服务
// 用于接收和管理本地开发环境的邮件

const axios = require('axios');

class MailCatcherService {
    constructor() {
        this.baseUrl = 'http://localhost:1080';
        this.smtpHost = 'localhost';
        this.smtpPort = 1025;
    }
    
    // 检查 MailCatcher 是否运行
    async isRunning() {
        try {
            await axios.get(`${this.baseUrl}/messages`);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // 获取所有邮件
    async getMessages() {
        try {
            console.log('[MailCatcher] 获取邮件列表...');
            const response = await axios.get(`${this.baseUrl}/messages`);
            
            const messages = response.data.map(msg => ({
                id: msg.id,
                from: msg.sender,
                to: msg.recipients.join(', '),
                subject: msg.subject,
                date: msg.created_at,
                size: msg.size
            }));
            
            console.log('[MailCatcher] 获取到', messages.length, '封邮件');
            return {
                success: true,
                messages: messages
            };
        } catch (error) {
            console.error('[MailCatcher] 获取邮件失败:', error.message);
            return {
                success: false,
                error: 'MailCatcher 未运行或无法访问'
            };
        }
    }
    
    // 获取邮件详情
    async getMessage(id) {
        try {
            console.log('[MailCatcher] 获取邮件详情:', id);
            const response = await axios.get(`${this.baseUrl}/messages/${id}.json`);
            const msg = response.data;
            
            // 获取邮件内容
            let textBody = '';
            let htmlBody = '';
            
            try {
                const plainResponse = await axios.get(`${this.baseUrl}/messages/${id}.plain`);
                textBody = plainResponse.data;
            } catch (e) {
                console.log('[MailCatcher] 无纯文本内容');
            }
            
            try {
                const htmlResponse = await axios.get(`${this.baseUrl}/messages/${id}.html`);
                htmlBody = htmlResponse.data;
            } catch (e) {
                console.log('[MailCatcher] 无HTML内容');
            }
            
            return {
                success: true,
                message: {
                    id: msg.id,
                    from: msg.sender,
                    to: msg.recipients.join(', '),
                    subject: msg.subject,
                    date: msg.created_at,
                    textBody: textBody,
                    htmlBody: htmlBody,
                    size: msg.size
                }
            };
        } catch (error) {
            console.error('[MailCatcher] 获取邮件详情失败:', error.message);
            return {
                success: false,
                error: '获取邮件详情失败'
            };
        }
    }
    
    // 删除邮件
    async deleteMessage(id) {
        try {
            console.log('[MailCatcher] 删除邮件:', id);
            await axios.delete(`${this.baseUrl}/messages/${id}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[MailCatcher] 删除邮件失败:', error.message);
            return {
                success: false,
                error: '删除邮件失败'
            };
        }
    }
    
    // 清空所有邮件
    async clearMessages() {
        try {
            console.log('[MailCatcher] 清空所有邮件...');
            await axios.delete(`${this.baseUrl}/messages`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[MailCatcher] 清空邮件失败:', error.message);
            return {
                success: false,
                error: '清空邮件失败'
            };
        }
    }
    
    // 提取验证码
    extractVerificationCode(content) {
        if (!content) return null;
        
        // 常见的验证码格式
        const patterns = [
            /验证码[：:]\s*([0-9]{4,8})/i,
            /verification code[：:]\s*([0-9]{4,8})/i,
            /code[：:]\s*([0-9]{4,8})/i,
            /\b([0-9]{6})\b/,
            /\b([0-9]{4})\b/
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
    
    // 获取 SMTP 配置
    getSmtpConfig() {
        return {
            host: this.smtpHost,
            port: this.smtpPort,
            secure: false,
            auth: null
        };
    }
}

module.exports = MailCatcherService;
