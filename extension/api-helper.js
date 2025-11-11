// API请求辅助函数
// 统一处理API密钥和错误处理

const API_KEY = 'windsurf-auto-register-2024-secure-key';

/**
 * 发送API请求（带API密钥）
 * @param {string} url - 完整的API URL
 * @param {object} options - fetch选项
 * @returns {Promise} - 响应数据
 */
async function apiRequest(url, options = {}) {
    // 默认配置
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        }
    };
    
    // 合并配置
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    try {
        console.log(`[API] 请求: ${url}`);
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API密钥无效或已过期');
            } else if (response.status === 429) {
                throw new Error('请求过于频繁，请稍后再试');
            } else {
                throw new Error(`请求失败: ${response.status} ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log(`[API] 响应:`, data);
        return data;
    } catch (error) {
        console.error(`[API] 错误:`, error);
        throw error;
    }
}

/**
 * GET请求
 */
async function apiGet(url) {
    return apiRequest(url, { method: 'GET' });
}

/**
 * POST请求
 */
async function apiPost(url, body = null) {
    const options = {
        method: 'POST'
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return apiRequest(url, options);
}

/**
 * DELETE请求
 */
async function apiDelete(url) {
    return apiRequest(url, { method: 'DELETE' });
}

// 导出函数
if (typeof window !== 'undefined') {
    window.apiRequest = apiRequest;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiDelete = apiDelete;
    window.API_KEY = API_KEY;
}
