// Windsurf Token 查找器
// 在 windsurf.com 页面的控制台中运行此脚本

console.log('🔍 开始查找 Windsurf 登录 Token...\n');

// 1. 检查 LocalStorage
console.log('=== 📦 LocalStorage 检查 ===');
let foundTokens = [];

for(let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    
    // 检查可能的token关键词
    const tokenKeywords = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'user', 'login', 'bearer'];
    const isTokenKey = tokenKeywords.some(keyword => key.toLowerCase().includes(keyword));
    
    if (isTokenKey || (value && value.length > 50 && (value.startsWith('eyJ') || value.includes('.')))) {
        console.log(`🔑 可能的Token: ${key}`);
        console.log(`📄 值: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        console.log(`📏 长度: ${value.length}\n`);
        
        foundTokens.push({
            location: 'localStorage',
            key: key,
            value: value,
            length: value.length
        });
    }
}

// 2. 检查 SessionStorage
console.log('=== 🗂️ SessionStorage 检查 ===');
for(let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    
    const tokenKeywords = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'user', 'login', 'bearer'];
    const isTokenKey = tokenKeywords.some(keyword => key.toLowerCase().includes(keyword));
    
    if (isTokenKey || (value && value.length > 50 && (value.startsWith('eyJ') || value.includes('.')))) {
        console.log(`🔑 可能的Token: ${key}`);
        console.log(`📄 值: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        console.log(`📏 长度: ${value.length}\n`);
        
        foundTokens.push({
            location: 'sessionStorage',
            key: key,
            value: value,
            length: value.length
        });
    }
}

// 3. 检查 Cookies
console.log('=== 🍪 Cookies 检查 ===');
const cookies = document.cookie.split(';');
cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
        const tokenKeywords = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'user', 'login', 'bearer'];
        const isTokenKey = tokenKeywords.some(keyword => name.toLowerCase().includes(keyword));
        
        if (isTokenKey || (value.length > 50 && (value.startsWith('eyJ') || value.includes('.')))) {
            console.log(`🔑 可能的Token: ${name}`);
            console.log(`📄 值: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
            console.log(`📏 长度: ${value.length}\n`);
            
            foundTokens.push({
                location: 'cookies',
                key: name,
                value: value,
                length: value.length
            });
        }
    }
});

// 4. 检查网络请求中的认证头
console.log('=== 🌐 网络请求检查 ===');
console.log('请刷新页面或执行任何操作，然后检查 Network 标签页中的请求头...\n');

// 5. 总结结果
console.log('=== 📊 查找结果总结 ===');
if (foundTokens.length > 0) {
    console.log(`✅ 找到 ${foundTokens.length} 个可能的Token:`);
    foundTokens.forEach((token, index) => {
        console.log(`${index + 1}. 位置: ${token.location}`);
        console.log(`   键名: ${token.key}`);
        console.log(`   长度: ${token.length}`);
        console.log(`   值: ${token.value.substring(0, 50)}...`);
        console.log('');
    });
    
    // 返回最可能的token
    const likelyToken = foundTokens.find(t => 
        t.key.toLowerCase().includes('auth') || 
        t.key.toLowerCase().includes('token') ||
        t.value.startsWith('eyJ')
    ) || foundTokens[0];
    
    console.log('🎯 最可能的登录Token:');
    console.log(`位置: ${likelyToken.location}`);
    console.log(`键名: ${likelyToken.key}`);
    console.log(`完整值: ${likelyToken.value}`);
    
    // 复制到剪贴板
    if (navigator.clipboard) {
        navigator.clipboard.writeText(likelyToken.value).then(() => {
            console.log('📋 Token已复制到剪贴板！');
        });
    }
    
} else {
    console.log('❌ 未找到明显的Token');
    console.log('💡 建议：');
    console.log('1. 检查 Network 标签页中的 Authorization 头');
    console.log('2. 尝试登出再登录，观察网络请求');
    console.log('3. 检查是否有其他域名的存储');
}

console.log('\n🔍 Token查找完成！');
