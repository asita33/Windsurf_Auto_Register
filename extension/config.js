// 扩展配置文件
const CONFIG = {
    // API密钥 - 与后端保持一致
    API_KEY: 'windsurf-auto-register-2024-secure-key',
    
    // 默认后端地址
    DEFAULT_BACKEND_URL: 'https://windsurf-auto-register.onrender.com',
    
    // 请求头配置
    getHeaders: function() {
        return {
            'Content-Type': 'application/json',
            'X-API-Key': this.API_KEY
        };
    },
    
    // 获取完整的fetch配置
    getFetchConfig: function(method = 'GET', body = null) {
        const config = {
            method: method,
            headers: this.getHeaders()
        };
        
        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }
        
        return config;
    }
};

// 导出配置（用于ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
