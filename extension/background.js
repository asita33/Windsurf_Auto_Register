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
            backendUrl: 'https://windsurf-backend-loqezvjkv-oles-projects-8232c969.vercel.app'
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
