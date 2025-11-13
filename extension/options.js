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
                'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
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
