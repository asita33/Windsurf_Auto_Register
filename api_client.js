/**
 * Windsurf Auto Register API客户端
 * 用于从后端获取账号信息
 */

const fetch = require('node-fetch'); // 如果是Node.js环境需要安装: npm install node-fetch

class WindsurfAPIClient {
    /**
     * 初始化API客户端
     * @param {string} baseUrl - 后端服务器地址
     * @param {string} apiKey - API密钥
     */
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
        };
    }

    /**
     * 获取所有账号
     * @returns {Promise<Array>} 账号列表
     */
    async getAccounts() {
        try {
            const url = `${this.baseUrl}/api/accounts`;
            const response = await fetch(url, { headers: this.headers });
            const data = await response.json();
            
            if (data.success) {
                return data.accounts || [];
            } else {
                console.error('❌ 获取账号失败:', data.error || '未知错误');
                return [];
            }
        } catch (error) {
            console.error('❌ 请求失败:', error.message);
            return [];
        }
    }

    /**
     * 获取最新的一个账号
     * @returns {Promise<Object|null>} 最新账号信息
     */
    async getLatestAccount() {
        const accounts = await this.getAccounts();
        if (accounts.length > 0) {
            // 按创建时间排序，返回最新的
            const sorted = accounts.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            return sorted[0];
        }
        return null;
    }

    /**
     * 生成一个临时邮箱
     * @returns {Promise<string|null>} 邮箱地址
     */
    async generateEmail() {
        try {
            const url = `${this.baseUrl}/api/generate-email`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers
            });
            const data = await response.json();
            
            if (data.success) {
                return data.email;
            } else {
                console.error('❌ 生成邮箱失败:', data.error || '未知错误');
                return null;
            }
        } catch (error) {
            console.error('❌ 请求失败:', error.message);
            return null;
        }
    }

    /**
     * 获取邮箱的邮件列表
     * @param {string} email - 邮箱地址
     * @returns {Promise<Array>} 邮件列表
     */
    async getMessages(email) {
        try {
            const url = `${this.baseUrl}/api/get-messages/${email}`;
            const response = await fetch(url, { headers: this.headers });
            const data = await response.json();
            
            if (data.success) {
                return data.messages || [];
            }
            return [];
        } catch (error) {
            console.error('❌ 获取邮件失败:', error.message);
            return [];
        }
    }

    /**
     * 获取邮件中的验证码
     * @param {string} email - 邮箱地址
     * @param {string} messageId - 邮件ID
     * @returns {Promise<string|null>} 验证码
     */
    async getVerificationCode(email, messageId) {
        try {
            const url = `${this.baseUrl}/api/get-message/${email}/${messageId}`;
            const response = await fetch(url, { headers: this.headers });
            const data = await response.json();
            
            if (data.success) {
                return data.verificationCode;
            }
            return null;
        } catch (error) {
            console.error('❌ 获取验证码失败:', error.message);
            return null;
        }
    }

    /**
     * 保存账号到后端
     * @param {string} email - 邮箱地址
     * @param {string} password - 密码
     * @param {string} service - 服务名称，默认为Windsurf
     * @returns {Promise<boolean>} 是否保存成功
     */
    async saveAccount(email, password, service = 'Windsurf') {
        try {
            const url = `${this.baseUrl}/api/save-account`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ email, password, service })
            });
            const data = await response.json();
            
            return data.success || false;
        } catch (error) {
            console.error('❌ 保存账号失败:', error.message);
            return false;
        }
    }
}

// 使用示例
async function main() {
    // 初始化客户端
    const BASE_URL = 'https://windsurf-auto-register.onrender.com';
    const API_KEY = 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9';
    
    const client = new WindsurfAPIClient(BASE_URL, API_KEY);
    
    // 示例1：获取所有账号
    console.log('📋 获取所有账号...');
    const accounts = await client.getAccounts();
    console.log(`✅ 共有 ${accounts.length} 个账号`);
    accounts.forEach(account => {
        console.log(`  - ${account.email} | ${account.password}`);
    });
    
    // 示例2：获取最新账号
    console.log('\n🆕 获取最新账号...');
    const latest = await client.getLatestAccount();
    if (latest) {
        console.log(`✅ 最新账号: ${latest.email} | ${latest.password}`);
    } else {
        console.log('❌ 没有账号');
    }
    
    // 示例3：生成临时邮箱
    console.log('\n📧 生成临时邮箱...');
    const email = await client.generateEmail();
    if (email) {
        console.log(`✅ 生成邮箱: ${email}`);
    }
    
    // 示例4：保存账号
    console.log('\n💾 保存账号...');
    const success = await client.saveAccount('test@example.com', 'password123');
    if (success) {
        console.log('✅ 账号保存成功');
    } else {
        console.log('❌ 账号保存失败');
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
}

// 导出类
module.exports = WindsurfAPIClient;
