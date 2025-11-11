// 默认后端URL
const DEFAULT_BACKEND_URL = 'https://windsurf-auto-register.onrender.com';

// 加载保存的设置
function loadSettings() {
    chrome.storage.sync.get(['backendUrl'], (result) => {
        const backendUrl = result.backendUrl || DEFAULT_BACKEND_URL;
        document.getElementById('backend-url').value = backendUrl;
    });
}

// 保存设置
function saveSettings() {
    const backendUrlInput = document.getElementById('backend-url');
    let backendUrl = backendUrlInput.value.trim();
    
    // 验证URL
    if (!backendUrl) {
        showStatus('请输入后端地址', 'error');
        return;
    }
    
    // 移除末尾的斜杠
    backendUrl = backendUrl.replace(/\/$/, '');
    
    // 验证URL格式
    try {
        new URL(backendUrl);
    } catch (e) {
        showStatus('URL格式不正确，请检查', 'error');
        return;
    }
    
    // 测试连接
    showStatus('正在测试连接...', 'info');
    testConnection(backendUrl);
}

// 测试后端连接
async function testConnection(backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/api/test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'windsurf-auto-register-2024-secure-key'
            }
        });
        
        if (response.ok) {
            // 连接成功，保存设置
            chrome.storage.sync.set({ backendUrl }, () => {
                showStatus('✅ 设置已保存！连接测试成功', 'success');
                console.log('Backend URL saved:', backendUrl);
            });
        } else {
            showStatus(`⚠️ 设置已保存，但连接测试失败（状态码：${response.status}）`, 'error');
            // 即使连接失败也保存，让用户决定
            chrome.storage.sync.set({ backendUrl });
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showStatus(`⚠️ 设置已保存，但无法连接到后端服务器`, 'error');
        // 即使连接失败也保存
        chrome.storage.sync.set({ backendUrl });
    }
}

// 显示状态消息
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // 3秒后自动隐藏（成功消息）
    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

// 重置为默认设置
function resetSettings() {
    if (confirm('确定要重置为默认设置吗？')) {
        document.getElementById('backend-url').value = DEFAULT_BACKEND_URL;
        chrome.storage.sync.set({ backendUrl: DEFAULT_BACKEND_URL }, () => {
            showStatus('✅ 已重置为默认设置', 'success');
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // 绑定事件
    document.getElementById('save').addEventListener('click', saveSettings);
    document.getElementById('reset').addEventListener('click', resetSettings);
    
    // 回车键保存
    document.getElementById('backend-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });
});
