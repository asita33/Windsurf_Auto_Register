// API请求辅助函数
// 统一处理API密钥和错误处理

// 优先使用私有配置，否则使用CONFIG，最后使用您的实际密钥
const API_KEY = typeof PRIVATE_CONFIG !== 'undefined' ? PRIVATE_CONFIG.API_KEY : 
                (typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : 
                'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9');

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
            'x-api-key': API_KEY
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
