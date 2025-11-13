// 悬浮面板控制脚本
(function() {
    'use strict';

    let panel = null;
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;

    // 当前状态
    let currentEmail = null;
    let currentPassword = null;
    let backendUrl = 'https://windsurf-auto-register.onrender.com';
    let isActivated = false;
    let usageCount = 0;

    // 初始化面板
    function initPanel() {
        // 检查是否已存在
        if (document.getElementById('windsurf-floating-panel')) {
            return;
        }

        // 加载 HTML
        fetch(chrome.runtime.getURL('floating-panel.html'))
            .then(response => response.text())
            .then(html => {
                const container = document.createElement('div');
                container.innerHTML = html;
                document.body.appendChild(container.firstElementChild);
                
                panel = document.getElementById('windsurf-floating-panel');
                
                // 添加调试日志
                console.log('✅ 悬浮窗已加载');
                console.log('Panel:', panel);
                
                setupEventListeners();
                loadSavedData();
            })
            .catch(error => {
                console.error('❌ 加载悬浮窗HTML失败:', error);
            });
    }

    // 设置事件监听
    function setupEventListeners() {
        console.log('🔧 开始设置事件监听...');
        
        const header = document.getElementById('panel-header');
        const minimizeBtn = document.getElementById('minimize-btn');
        const closeBtn = document.getElementById('close-btn');
        const startBtn = document.getElementById('start-register-btn');
        const checkCodeBtn = document.getElementById('check-code-btn');
        const clearDataBtn = document.getElementById('clear-data-btn');
        const copyEmailBtn = document.getElementById('copy-email-btn');
        const copyPasswordBtn = document.getElementById('copy-password-btn');
        
        console.log('按钮元素:', {
            startBtn,
            checkCodeBtn,
            clearDataBtn,
            copyEmailBtn,
            copyPasswordBtn
        });

        // 拖拽功能
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // 最小化
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('minimized');
        });

        // 恢复（点击最小化状态）
        panel.addEventListener('click', () => {
            if (panel.classList.contains('minimized')) {
                panel.classList.remove('minimized');
            }
        });

        // 关闭
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.style.display = 'none';
        });

        // 开始注册
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('🚀 开始注册按钮被点击！');
                startRegistration();
            });
            console.log('✅ 开始注册按钮事件已绑定');
        } else {
            console.error('❌ 找不到开始注册按钮！');
        }

        // 检查验证码
        checkCodeBtn.addEventListener('click', checkVerificationCode);


        // 清除数据
        clearDataBtn.addEventListener('click', clearData);

        // 复制按钮
        copyEmailBtn.addEventListener('click', () => copyToClipboard(currentEmail, '邮箱'));
        copyPasswordBtn.addEventListener('click', () => copyToClipboard(currentPassword, '密码'));
        
        // 验证激活码按钮
        const verifyCodeBtn = document.getElementById('verify-code-btn');
        if (verifyCodeBtn) {
            verifyCodeBtn.addEventListener('click', verifyActivationCode);
        }
    }

    // 拖拽相关函数
    function dragStart(e) {
        if (panel.classList.contains('minimized')) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target.id === 'panel-header' || e.target.closest('#panel-header')) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY);
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos) {
        panel.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // 加载保存的数据
    function loadSavedData() {
        try {
            // 强制使用最新的后端URL，不从storage读取旧URL
            backendUrl = 'https://windsurf-auto-register.onrender.com';
            console.log('✅ 使用最新后端URL:', backendUrl);
            
            // 同时更新storage中的URL
            chrome.storage.sync.set({ backendUrl: backendUrl }, () => {
                console.log('✅ 已更新storage中的后端URL');
            });
            
            // 使用 local 读取临时数据
            chrome.storage.local.get(['currentEmail', 'currentPassword'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('加载数据失败:', chrome.runtime.lastError);
                    return;
                }
                if (result.currentEmail) {
                    currentEmail = result.currentEmail;
                    showEmail(currentEmail);
                }
                if (result.currentPassword) {
                    currentPassword = result.currentPassword;
                    showPassword(currentPassword);
                    document.getElementById('clear-data-btn').style.display = 'block';
                }
                if (result.currentEmail || result.currentPassword) {
                    updateStatus('上次数据已恢复', 'info');
                }
            });
            
            // 确保backendUrl已设置后再加载二维码
            console.log('🔄 准备加载打赏二维码，当前backendUrl:', backendUrl);
            console.log('🔄 loadDonationQRCode函数类型:', typeof loadDonationQRCode);
            setTimeout(async () => {
                console.log('⏰ setTimeout触发，准备调用loadDonationQRCode');
                console.log('⏰ 当前backendUrl:', backendUrl);
                console.log('⏰ loadDonationQRCode是否存在:', typeof loadDonationQRCode === 'function');
                try {
                    await loadDonationQRCode();
                    console.log('✅ loadDonationQRCode执行完成');
                } catch (err) {
                    console.error('❌ loadDonationQRCode执行出错:', err);
                    console.error('❌ 错误详情:', err.message, err.stack);
                }
            }, 100);
        } catch (error) {
            console.error('加载数据异常:', error);
        }
    }
    
    // 加载打赏二维码
    async function loadDonationQRCode() {
        console.log('📥 [二维码加载] ===== 函数开始执行 =====');
        console.log('📥 [二维码加载] 后端URL:', backendUrl);
        
        try {
            const container = document.getElementById('donation-qr-container');
            console.log('📥 [二维码加载] 容器查找结果:', container ? '找到' : '未找到');
            
            if (!container) {
                console.error('❌ [二维码加载] 找不到容器元素 #donation-qr-container');
                console.log('📥 [二维码加载] 尝试查找所有可能的容器...');
                const allDivs = document.querySelectorAll('div[id*="donation"], div[id*="qr"]');
                console.log('📥 [二维码加载] 找到的相关元素:', allDivs.length, allDivs);
                return;
            }
            
            console.log('✅ [二维码加载] 找到容器元素，准备请求数据');
            const url = `${backendUrl}/api/get-donation-qrcode`;
            console.log('🌐 [二维码加载] 请求URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                }
            });
            console.log('📡 [二维码加载] 响应状态:', response.status);
            
            const data = await response.json();
            console.log('📦 [二维码加载] 响应数据:', {
                success: data.success,
                hasQRCode: !!data.qrCode,
                qrCodeLength: data.qrCode ? data.qrCode.length : 0
            });
            
            if (data.success && data.qrCode) {
                container.innerHTML = `<img src="${data.qrCode}" style="max-width: 100%; max-height: 100%; border-radius: 12px;">`;
                console.log('✅ [二维码加载] 二维码已显示');
            } else {
                container.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">暂无收款码</span>';
                console.log('ℹ️ [二维码加载] 数据库中没有二维码');
            }
        } catch (error) {
            console.error('❌ [二维码加载] 加载失败:', error);
            console.error('❌ [二维码加载] 错误堆栈:', error.stack);
            const container = document.getElementById('donation-qr-container');
            if (container) {
                container.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">加载失败</span>';
            }
        }
        
        console.log('📥 [二维码加载] ===== 函数执行结束 =====');
    }

    // 显示邮箱
    function showEmail(email) {
        const emailText = document.getElementById('email-text');
        const emailSection = document.getElementById('email-section');
        if (emailText && emailSection) {
            emailText.value = email;
            emailSection.style.display = 'block';
        }
    }

    // 显示密码
    function showPassword(password) {
        const passwordText = document.getElementById('password-text');
        const passwordSection = document.getElementById('password-section');
        const checkCodeBtn = document.getElementById('check-code-btn');
        const clearDataBtn = document.getElementById('clear-data-btn');
        
        if (passwordText && passwordSection) {
            passwordText.value = password;
            passwordSection.style.display = 'block';
        }
        if (checkCodeBtn) checkCodeBtn.style.display = 'block';
        if (clearDataBtn) clearDataBtn.style.display = 'block';
    }

    // 更新状态
    function updateStatus(message, type = 'info') {
        const statusText = document.getElementById('status-text');
        if (!statusText) {
            console.error('❌ 找不到status-text元素');
            return;
        }
        statusText.textContent = message;
    }
    
    // 暴露给其他脚本使用
    window.updatePanelStatus = updateStatus;
    window.addPanelLog = addLog;

    // 添加日志
    function addLog(message, type = 'info') {
        const logsContainer = document.getElementById('logs-container');
        if (!logsContainer) {
            console.log(`[${type}] ${message}`);
            return;
        }
        logsContainer.style.display = 'block';
        
        const logItem = document.createElement('div');
        logItem.style.padding = '5px 0';
        logItem.style.borderBottom = '1px solid #eee';
        
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        const colors = {
            info: '#666',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336'
        };
        
        logItem.innerHTML = `
            <span style="color: #999; font-size: 10px;">[${time}]</span>
            <span style="color: ${colors[type] || colors.info}; margin-left: 5px;">${message}</span>
        `;
        
        logsContainer.appendChild(logItem);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // 复制到剪贴板
    function copyToClipboard(text, label) {
        navigator.clipboard.writeText(text).then(() => {
            addLog(`${label}已复制`, 'success');
        });
    }

    // 生成密码
    function generatePassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        for (let i = 3; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // 检查是否需要激活（通过IP）
    async function checkActivationRequired() {
        try {
            // 先获取后端URL
            const config = await new Promise((resolve) => {
                chrome.storage.sync.get(['backendUrl'], (result) => {
                    resolve(result.backendUrl || 'https://windsurf-auto-register.onrender.com');
                });
            });
            backendUrl = config;
            
            // 检查IP使用次数
            const response = await fetch(`${backendUrl}/api/check-ip-usage`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                console.log('IP检查结果:', data);
                console.log(`IP: ${data.ip}, 使用次数: ${data.usageCount}, 是否激活: ${data.isActivated}`);
                
                usageCount = data.usageCount;
                isActivated = data.isActivated;
                
                // 需要激活：使用次数>=1且未激活
                return data.needActivation;
            }
            
            return false;
        } catch (error) {
            console.error('检查IP使用次数失败:', error);
            return false;
        }
    }
    
    // 显示激活区域
    function showActivationSection() {
        const section = document.getElementById('activation-section');
        if (section) {
            section.style.display = 'block';
            loadDonationQRCode();
        }
    }
    
    // 验证激活码
    async function verifyActivationCode() {
        const input = document.getElementById('activation-code-input');
        const code = input.value.trim();
        
        if (!code) {
            updateStatus('❌ 请输入激活码', 'error');
            return;
        }
        
        try {
            updateStatus('正在验证...', 'info');
            
            // 调用后端验证API
            const response = await fetch(`${backendUrl}/api/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                },
                body: JSON.stringify({ code })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 保存激活状态
                await chrome.storage.local.set({ 
                    isActivated: true,
                    activationCode: code,
                    activatedAt: new Date().toISOString()
                });
                
                isActivated = true;
                
                // 隐藏激活区域
                const section = document.getElementById('activation-section');
                if (section) {
                    section.style.display = 'none';
                }
                
                updateStatus('✅ 激活成功！可以继续使用', 'success');
                addLog('🎉 激活成功！', 'success');
                
                // 3秒后自动开始注册
                setTimeout(() => {
                    startRegistration();
                }, 3000);
            } else {
                updateStatus('❌ 激活码无效', 'error');
                addLog('验证失败: ' + (data.error || '激活码无效'), 'error');
            }
        } catch (error) {
            console.error('验证失败:', error);
            updateStatus('❌ 验证失败', 'error');
            addLog('验证失败: ' + error.message, 'error');
        }
    }
    
    // 开始注册
    async function startRegistration() {
        try {
            // 检查是否需要激活
            const needActivation = await checkActivationRequired();
            
            if (needActivation) {
                updateStatus('⚠️ 需要激活码', 'warning');
                // 不在日志区显示重复消息
                showActivationSection();
                return;
            }
            
            // 先获取最新的后端URL配置
            const config = await new Promise((resolve) => {
                chrome.storage.sync.get(['backendUrl'], (result) => {
                    resolve(result.backendUrl || 'https://windsurf-auto-register.onrender.com');
                });
            });
            backendUrl = config;
            console.log('悬浮窗使用后端URL:', backendUrl);
            
            updateStatus('正在生成邮箱...', 'info');
            addLog('开始自动注册流程', 'info');

            // 生成邮箱
            console.log('请求URL:', `${backendUrl}/api/generate-email`);
            const data = await apiPost(`${backendUrl}/api/generate-email`);

            if (data.success) {
                currentEmail = data.email;
                showEmail(currentEmail);
                addLog(`邮箱生成成功: ${currentEmail}`, 'success');

                // 记录IP使用（后端记录）
                try {
                    const recordResponse = await fetch(`${backendUrl}/api/record-ip-usage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                        },
                        body: JSON.stringify({ email: currentEmail })
                    });
                    const recordData = await recordResponse.json();
                    console.log('IP使用记录结果:', recordData);
                } catch (error) {
                    console.error('记录IP使用失败:', error);
                }
                
                // 保存邮箱到本地
                chrome.storage.local.set({ 
                    currentEmail, 
                    emailGeneratedTime: Date.now()
                });

                // 生成密码
                currentPassword = generatePassword();
                showPassword(currentPassword);
                addLog(`密码已生成`, 'success');

                // 保存密码
                chrome.storage.local.set({ 
                    currentPassword,
                    registrationInProgress: true,
                    registrationStartTime: Date.now()
                });

                document.getElementById('clear-data-btn').style.display = 'block';

                // 直接调用 content script 的函数开始填写
                updateStatus('正在填写表单...', 'info');
                addLog('开始自动填写表单', 'info');

                // 直接调用页面上的注册函数
                if (typeof window.startRegistration === 'function') {
                    const result = await window.startRegistration(currentEmail, currentPassword);
                    if (result && result.success) {
                        updateStatus('✅ 表单已填写，请完成人机验证', 'success');
                        addLog('✅ 已自动填写所有信息', 'success');
                        addLog('✅ 已自动点击 Continue 进入验证页面', 'success');
                        addLog('', 'info');
                        addLog('👉 请在页面上完成人机验证', 'warning');
                        addLog('💡 验证完成后会自动继续', 'info');
                        addLog('💡 验证码会自动获取并填写', 'info');
                        
                        // 显示检查验证码按钮
                        document.getElementById('check-code-btn').style.display = 'block';
                    } else {
                        updateStatus('表单填写可能失败', 'error');
                        addLog(`错误: ${result?.error || '未知错误'}`, 'error');
                    }
                } else {
                    updateStatus('启动失败', 'error');
                    addLog('启动失败，请重试', 'error');
                }
            } else {
                updateStatus('生成邮箱失败', 'error');
                addLog('生成邮箱失败，请重试', 'error');
            }
        } catch (error) {
            console.error('启动注册失败:', error);
            updateStatus('启动失败', 'error');
            addLog(`错误: ${error.message}`, 'error');
        }
    }

    // 检查验证码
    async function checkVerificationCode() {
        if (!currentEmail) {
            updateStatus('⚠️ 请先生成邮箱', 'warning');
            return;
        }

        try {
            // 获取最新的后端URL
            const config = await new Promise((resolve) => {
                chrome.storage.sync.get(['backendUrl'], (result) => {
                    resolve(result.backendUrl || 'https://windsurf-auto-register.onrender.com');
                });
            });
            backendUrl = config;
            
            // 不显示任何日志，静默执行
            const response = await fetch(`${backendUrl}/api/get-messages/${currentEmail}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                }
            });
            const data = await response.json();

            if (data.success && data.messages && data.messages.length > 0) {
                const latestMessage = data.messages[0];

                const detailResponse = await fetch(`${backendUrl}/api/get-message/${currentEmail}/${latestMessage.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'wsr-2024-7k9m2n5p8q1r4t6v9x2z5c8f1h4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9c2f5i8l1o4r7u0x3a6d9g2j5m8p1s4v7y0b3e6h9k2n5q8t1w4z7c0f3i6l9o2r5u8x1a4d7g0j3m6p9s2v5y8b1e4h7k0n3q6t9w2z5c8f1i4l7o0r3u6x9a2d5g8j1m4p7s0v3y6b9e2h5k8n1q4t7w0z3c6f9i2l5o8r1u4x7a0d3g6j9m2p5s8v1y4b7e0h3k6n9q2t5w8z1c4f7i0l3o6r9u2x5a8d1g4j7m0p3s6v9y2b5e8h1k4n7q0t3w6z9'
                    }
                });
                const detailData = await detailResponse.json();

                if (detailData.success && detailData.message) {
                    const body = detailData.message.body || detailData.message.html || detailData.message.text || '';
                    
                    if (body && typeof body === 'string') {
                        const code = extractVerificationCode(body);
                        if (code) {
                            // 只有找到验证码才显示
                            console.log('找到验证码:', code);
                            
                            // 验证码找到后，保存账号
                            saveAccountToBackend();
                        }
                    }
                }
            }
        } catch (error) {
            // 完全静默，只在控制台记录
            console.error('检查验证码出错:', error);
        }
    }


    // 保存注册成功的账号到后端
    async function saveAccountToBackend() {
        if (!currentEmail || !currentPassword) {
            return;
        }

        try {
            const saveResult = await apiPost(`${backendUrl}/api/auto-save-account`, {
                email: currentEmail,
                password: currentPassword,
                service: 'Windsurf'
            });
            
            if (saveResult.success) {
                console.log('✅ 账号保存成功');
            } else {
                console.warn('⚠️ 账号保存失败:', saveResult.error);
            }
        } catch (saveError) {
            console.error('❌ 保存账号出错:', saveError);
        }
    }

    // 提取验证码
    function extractVerificationCode(text) {
        try {
            // 类型检查
            if (!text || typeof text !== 'string') {
                console.log('文本无效，无法提取验证码');
                return null;
            }
            
            // 清理HTML标签
            const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
            
            const patterns = [
                /verification code is:?\s*([A-Z0-9]{6})/i,
                /code:?\s*([A-Z0-9]{6})/i,
                /([A-Z0-9]{6})/
            ];

            for (const pattern of patterns) {
                try {
                    const match = cleanText.match(pattern);
                    if (match && match[1]) {
                        return match[1];
                    }
                } catch (e) {
                    console.log('匹配失败:', e);
                    continue;
                }
            }
            return null;
        } catch (error) {
            console.error('提取验证码异常:', error);
            return null;
        }
    }

    // 清除数据
    function clearData() {
        if (!confirm('确定要清除当前的邮箱和密码吗？')) {
            return;
        }

        currentEmail = null;
        currentPassword = null;

        try {
            chrome.storage.local.remove([
                'currentEmail',
                'currentPassword',
                'registrationInProgress',
                'registrationStartTime',
                'emailGeneratedTime'
            ]);
        } catch (error) {
            console.error('清除存储失败:', error);
        }

        document.getElementById('email-section').style.display = 'none';
        document.getElementById('password-section').style.display = 'none';
        document.getElementById('check-code-btn').style.display = 'none';
        document.getElementById('clear-data-btn').style.display = 'none';
        document.getElementById('logs-container').innerHTML = '';
        document.getElementById('logs-container').style.display = 'none';

        updateStatus('数据已清除', 'success');
        addLog('邮箱和密码已清除', 'success');
    }

    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'showPanel') {
            if (panel) {
                panel.style.display = 'block';
                panel.classList.remove('minimized');
            } else {
                initPanel();
            }
        }
    });

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanel);
    } else {
        initPanel();
    }
})();
