# 配置设置指南

## 🔐 设置私有API密钥

### 步骤1：创建私有配置文件

复制 `config.private.js.example` 为 `config.private.js`：

```bash
cp config.private.js.example config.private.js
```

### 步骤2：编辑私有配置

打开 `config.private.js` 并填入你的实际API密钥：

```javascript
const PRIVATE_CONFIG = {
    API_KEY: '你的实际API密钥',
    BACKEND_URL: 'https://windsurf-auto-register.onrender.com'
};
```

### 步骤3：重新加载扩展

1. 打开 `chrome://extensions/`
2. 找到 "Windsurf 自动注册" 扩展
3. 点击刷新图标 🔄

## ⚠️ 重要提示

- ❌ **不要**将 `config.private.js` 提交到GitHub
- ✅ 该文件已在 `.gitignore` 中排除
- ✅ 只在本地使用，不会上传到仓库
- 🔒 保护好你的API密钥

## 🔑 获取API密钥

你的API密钥应该与Render上设置的环境变量一致。

在Render Dashboard中查看：
1. 登录 https://dashboard.render.com
2. 选择你的服务
3. 进入 Environment 标签
4. 查看 `API_KEY` 的值
