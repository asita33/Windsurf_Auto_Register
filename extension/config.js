// 扩展配置文件
// 如果存在私有配置，优先使用私有配置
const CONFIG = typeof PRIVATE_CONFIG !== 'undefined' ? PRIVATE_CONFIG : {
    // API密钥 - 与后端保持一致（公开版本使用占位符）
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // 默认后端地址
    DEFAULT_BACKEND_URL: 'https://windsurf-auto-register.onrender.com',
    
    // 请求头配置
    getHeaders: function() {
        return {
            'Content-Type': 'application/json',
            'x-api-key': this.API_KEY
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
