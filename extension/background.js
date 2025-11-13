// Background service worker for Windsurf Auto Register

console.log('Windsurf Auto Register - Background Script Loaded');

// 监听扩展图标点击 - 显示悬浮面板
chrome.action.onClicked.addListener((tab) => {
    console.log('扩展图标被点击');
    // 发送消息给 content script 显示面板
    chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
});

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('扩展已安装');
        
        // 设置默认配置
        chrome.storage.sync.set({
            backendUrl: 'https://windsurf-auto-register.onrender.com'
        });
        chrome.storage.local.set({
            autoFill: true
        });
    }
});

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background收到消息:', request);
    
    if (request.action === 'getSettings') {
        chrome.storage.local.get(['backendUrl', 'autoFill'], (result) => {
            sendResponse(result);
        });
        return true;
    }
    
    if (request.action === 'saveSettings') {
        chrome.storage.local.set(request.settings, () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'notify') {
        // 显示通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: request.title || 'Windsurf Auto Register',
            message: request.message
        });
    }
    
    if (request.action === 'saveToken') {
        // 保存Token到后端
        saveTokenToBackend(request.token, sender.url).then((result) => {
            sendResponse(result);
        });
        return true;
    }
    
    if (request.action === 'openTokenPage') {
        // 打开Token页面
        chrome.tabs.create({
            url: 'https://windsurf.com/editor/show-auth-token?workflow=',
            active: true
        });
        return true;
    }
    
    return false;
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // 检查是否是Windsurf相关页面
        if (tab.url.includes('windsurf.com')) {
            console.log('检测到Windsurf页面:', tab.url);
        }
    }
});

// 保存Token到后端
async function saveTokenToBackend(token, pageUrl) {
    try {
        // 获取后端URL
        const settings = await chrome.storage.sync.get(['backendUrl']);
        const backendUrl = settings.backendUrl || 'https://windsurf-auto-register.onrender.com';
        
        console.log('🔓 准备保存Token到后端...');
        
        const response = await fetch(`${backendUrl}/api/save-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s6v9y2b5e8h1k4n7q0t3w6z9'
            },
            body: JSON.stringify({
                token: token,
                pageUrl: pageUrl,
                timestamp: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Token已保存到后端');
            return { success: true };
        } else {
            console.error('❌ Token保存失败:', data.error);
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('❌ 保存Token出错:', error);
        return { success: false, error: error.message };
    }
}
