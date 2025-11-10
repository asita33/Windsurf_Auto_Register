let currentEmail = null;
let currentPassword = null;
let backendUrl = 'https://windsurf-backend-loqezvjkv-oles-projects-8232c969.vercel.app';

// DOM 元素
const statusDiv = document.getElementById('status');
const emailDisplay = document.getElementById('emailDisplay');
const emailText = document.getElementById('emailText');
const passwordDisplay = document.getElementById('passwordDisplay');
const passwordText = document.getElementById('passwordText');
const startBtn = document.getElementById('startBtn');
const generateEmailBtn = document.getElementById('generateEmailBtn');
const checkCodeBtn = document.getElementById('checkCodeBtn');
const copyEmailBtn = document.getElementById('copyEmail');
const copyPasswordBtn = document.getElementById('copyPassword');
const backendUrlInput = document.getElementById('backendUrl');
const progressSteps = document.getElementById('progressSteps');
const logsDiv = document.getElementById('logs');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Popup] 初始化...');
    loadSettings();
    testBackendConnection();
    
    startBtn.addEventListener('click', startAutoRegister);
    generateEmailBtn.addEventListener('click', generateEmail);
    checkCodeBtn.addEventListener('click', checkVerificationCode);
    copyEmailBtn.addEventListener('click', copyEmail);
    copyPasswordBtn.addEventListener('click', copyPassword);
    backendUrlInput.addEventListener('change', saveSettings);
});

// 测试后端连接
async function testBackendConnection() {
    try {
        const response = await fetch(`${backendUrl}/api/test`);
        const data = await response.json();
        if (data.success) {
            console.log('[Popup] 后端连接正常');
            addLog('后端服务连接成功', 'success');
        }
    } catch (error) {
        console.error('[Popup] 后端连接失败:', error);
        updateStatus('警告: 无法连接后端服务', 'warning');
        addLog('后端服务连接失败，请确保服务已启动', 'error');
    }
}

// 加载设置
function loadSettings() {
    // 使用 sync 读取后端URL
    chrome.storage.sync.get(['backendUrl'], (syncResult) => {
        if (syncResult.backendUrl) {
            backendUrl = syncResult.backendUrl;
            backendUrlInput.value = backendUrl;
        }
        
        // 使用 local 读取临时数据
        chrome.storage.local.get(['currentEmail', 'currentPassword', 'registrationInProgress'], (result) => {
            if (result.currentEmail) {
                currentEmail = result.currentEmail;
                displayEmail(currentEmail);
                // 不显示恢复日志，保持界面简洁
            }
            if (result.currentPassword) {
                currentPassword = result.currentPassword;
                passwordText.textContent = currentPassword;
                passwordDisplay.style.display = 'block';
                document.getElementById('clearDataBtn').style.display = 'block';
                // 不显示恢复日志，保持界面简洁
            }
            if (result.registrationInProgress) {
                // 简化提示，不要太多警告
                updateStatus('上次数据已恢复', 'info');
            }
        });
    });
}

// 生成随机密码
function generatePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    // 确保至少有一个大写字母、小写字母、数字
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
    password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
    password += '0123456789'.charAt(Math.floor(Math.random() * 10));
    
    // 填充剩余字符
    for (let i = password.length; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// 保存设置
function saveSettings() {
    backendUrl = backendUrlInput.value;
    chrome.storage.sync.set({ backendUrl });
    addLog('设置已保存', 'success');
}

// 更新状态
function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

// 添加日志
function addLog(message, type = 'info') {
    logsDiv.style.display = 'block';
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    logsDiv.insertBefore(logEntry, logsDiv.firstChild);
    
    while (logsDiv.children.length > 20) {
        logsDiv.removeChild(logsDiv.lastChild);
    }
}

// 更新步骤状态
function updateStep(stepNumber, status) {
    const step = document.getElementById(`step${stepNumber}`);
    if (step) {
        step.className = `step ${status}`;
    }
}

// 显示邮箱
function displayEmail(email) {
    emailText.textContent = email;
    emailDisplay.style.display = 'block';
    checkCodeBtn.style.display = 'block';
    document.getElementById('clearDataBtn').style.display = 'block';
}

// 清除注册数据
function clearRegistrationData() {
    if (!confirm('确定要清除当前的邮箱和密码吗？')) {
        return;
    }
    
    currentEmail = null;
    currentPassword = null;
    
    chrome.storage.local.remove(['currentEmail', 'currentPassword', 'registrationInProgress', 'registrationStartTime', 'emailGeneratedTime']);
    
    emailDisplay.style.display = 'none';
    passwordDisplay.style.display = 'none';
    checkCodeBtn.style.display = 'none';
    document.getElementById('clearDataBtn').style.display = 'none';
    
    updateStatus('数据已清除', 'success');
    addLog('邮箱和密码已清除', 'success');
}

// 复制邮箱
function copyEmail() {
    navigator.clipboard.writeText(currentEmail).then(() => {
        copyEmailBtn.textContent = '已复制!';
        setTimeout(() => {
            copyEmailBtn.textContent = '复制';
        }, 2000);
    });
}

// 复制密码
function copyPassword() {
    navigator.clipboard.writeText(currentPassword).then(() => {
        copyPasswordBtn.textContent = '已复制!';
        setTimeout(() => {
            copyPasswordBtn.textContent = '复制';
        }, 2000);
    });
}

// 生成临时邮箱
async function generateEmail() {
    try {
        console.log('[Popup] 开始生成邮箱...');
        updateStatus('正在生成临时邮箱...', 'info');
        generateEmailBtn.disabled = true;
        addLog('开始生成临时邮箱...');
        
        const url = `${backendUrl}/api/generate-email`;
        console.log('[Popup] 请求URL:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[Popup] 响应状态:', response.status);
        const data = await response.json();
        console.log('[Popup] 响应数据:', data);
        
        if (data.success) {
            currentEmail = data.email;
            chrome.storage.local.set({ 
                currentEmail,
                emailGeneratedTime: Date.now()
            });
            displayEmail(currentEmail);
            updateStatus('临时邮箱生成成功!', 'success');
            addLog(`邮箱生成成功: ${currentEmail}`, 'success');
            addLog('💡 提示: 邮箱和密码会自动保存，关闭弹窗后仍然保留', 'info');
            console.log('[Popup] 邮箱生成成功:', currentEmail);
            return currentEmail;
        } else {
            throw new Error(data.error || '生成邮箱失败');
        }
    } catch (error) {
        console.error('[Popup] 生成邮箱失败:', error);
        updateStatus(`错误: ${error.message}`, 'error');
        addLog(`生成邮箱失败: ${error.message}`, 'error');
        return null;
    } finally {
        generateEmailBtn.disabled = false;
    }
}

// 检查验证码
async function checkVerificationCode() {
    if (!currentEmail) {
        updateStatus('请先生成邮箱', 'warning');
        return;
    }
    
    try {
        updateStatus('正在检查验证码...', 'info');
        checkCodeBtn.disabled = true;
        checkCodeBtn.innerHTML = '<span class="loading"></span>检查中...';
        addLog('开始检查验证码...');
        
        const response = await fetch(`${backendUrl}/api/get-messages/${encodeURIComponent(currentEmail)}`);
        const data = await response.json();
        
        if (data.success && data.messages.length > 0) {
            addLog(`收到 ${data.messages.length} 封邮件`);
            
            const latestMessage = data.messages[0];
            const detailResponse = await fetch(
                `${backendUrl}/api/get-message/${encodeURIComponent(currentEmail)}/${latestMessage.id}`
            );
            const detailData = await detailResponse.json();
            
            if (detailData.success && detailData.verificationCode) {
                updateStatus(`验证码: ${detailData.verificationCode}`, 'success');
                addLog(`找到验证码: ${detailData.verificationCode}`, 'success');
                
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'fillVerificationCode',
                            code: detailData.verificationCode
                        });
                    }
                });
            } else {
                updateStatus('未找到验证码', 'warning');
                addLog('邮件中未找到验证码', 'warning');
            }
        } else {
            updateStatus('暂无新邮件', 'info');
            addLog('暂无新邮件');
        }
    } catch (error) {
        updateStatus(`错误: ${error.message}`, 'error');
        addLog(`检查验证码失败: ${error.message}`, 'error');
    } finally {
        checkCodeBtn.disabled = false;
        checkCodeBtn.textContent = '检查验证码';
    }
}

// 开始自动注册
async function startAutoRegister() {
    try {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="loading"></span>注册中...';
        progressSteps.style.display = 'block';
        addLog('开始自动注册流程');
        
        updateStep(1, 'active');
        updateStatus('步骤1: 生成临时邮箱...', 'info');
        const email = await generateEmail();
        
        if (!email) {
            throw new Error('生成邮箱失败');
        }
        
        updateStep(1, 'completed');
        addLog('步骤1完成', 'success');
        
        updateStep(2, 'active');
        updateStatus('步骤2: 填写注册信息...', 'info');
        
        // 生成密码并显示
        currentPassword = generatePassword();
        passwordText.textContent = currentPassword;
        passwordDisplay.style.display = 'block';
        chrome.storage.local.set({ 
            currentPassword,
            registrationInProgress: true,
            registrationStartTime: Date.now()
        });
        addLog(`密码已生成: ${currentPassword}`);
        
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]) {
                throw new Error('未找到活动标签页');
            }
            
            const tab = tabs[0];
            addLog(`当前页面: ${tab.url}`);
            
            // 检查是否在注册页面
            if (!tab.url || !tab.url.includes('windsurf.com')) {
                updateStatus('错误: 请在Windsurf注册页面使用', 'error');
                addLog('错误: 不在Windsurf页面', 'error');
                startBtn.disabled = false;
                startBtn.textContent = '开始自动注册';
                return;
            }
            
            addLog('发送消息到content script...');
            
            chrome.tabs.sendMessage(tab.id, {
                action: 'startRegistration',
                email: email,
                password: currentPassword
            }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.error('消息发送失败:', chrome.runtime.lastError);
                    addLog(`消息发送失败: ${chrome.runtime.lastError.message}`, 'error');
                    
                    // 尝试重新注入content script
                    addLog('尝试重新注入content script...', 'warning');
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });
                        addLog('Content script已重新注入', 'success');
                        
                        // 等待一下再重试
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // 重试发送消息
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'startRegistration',
                            email: email,
                            password: currentPassword
                        }, (retryResponse) => {
                            if (chrome.runtime.lastError) {
                                updateStatus('错误: Content script无法加载', 'error');
                                addLog('重试失败，请刷新页面后再试', 'error');
                            } else {
                                handleRegistrationResponse(retryResponse);
                            }
                        });
                    } catch (injectError) {
                        updateStatus('错误: 无法注入脚本', 'error');
                        addLog(`注入失败: ${injectError.message}`, 'error');
                    }
                    
                    startBtn.disabled = false;
                    startBtn.textContent = '开始自动注册';
                    return;
                }
                
                handleRegistrationResponse(response);
            });
            
            // 处理注册响应的函数
            async function handleRegistrationResponse(response) {
                
                if (response && response.success) {
                    updateStep(2, 'completed');
                    
                    if (response.needsCaptcha) {
                        updateStep(3, 'active');
                        updateStatus('✅ 表单已填写，请完成人机验证', 'success');
                        addLog('✅ 已自动填写所有信息', 'success');
                        addLog('✅ 已自动点击 Continue 进入验证页面', 'success');
                        addLog('', 'info');
                        addLog('👉 请在页面上完成人机验证', 'warning');
                        addLog('👉 验证完成后点击下方"检查验证码"', 'warning');
                        
                        // 显示检查验证码按钮
                        checkCodeBtn.style.display = 'block';
                        checkCodeBtn.textContent = '检查验证码';
                    } else {
                        updateStep(3, 'active');
                        updateStatus('步骤3: 等待验证码...', 'info');
                        addLog('表单已填写，等待验证码...', 'success');
                    }
                } else {
                    updateStatus('警告: 表单填写可能失败', 'warning');
                    addLog(`响应: ${JSON.stringify(response)}`, 'warning');
                }
            }
        });
    } catch (error) {
        updateStatus(`错误: ${error.message}`, 'error');
        addLog(`注册失败: ${error.message}`, 'error');
        startBtn.disabled = false;
        startBtn.textContent = '开始自动注册';
    }
}
