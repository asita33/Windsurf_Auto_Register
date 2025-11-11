# Windsurf 自动注册助手

一个用于自动注册 Windsurf 账号的 Chrome 扩展，集成临时邮箱服务和动态激活码管理，实现全自动注册流程。

## ✨ 功能特点

- 🚀 **全自动注册** - 一键完成整个注册流程
- 📧 **临时邮箱** - 自动生成临时邮箱接收验证码
- 🔄 **智能填充** - 自动识别并填写表单字段
- 📱 **验证码识别** - 自动提取邮件中的验证码
- 🎟️ **动态激活码** - 支持生成和管理激活码
- 💾 **账号管理** - 后台管理已注册账号
- 📊 **实时监控** - 显示详细的操作日志
- 🌐 **在线部署** - 支持 Render/Vercel 等平台部署

## 📁 项目结构

```
windsurf-auto-register/
└── extension/                 # Chrome 扩展
    ├── manifest.json          # 扩展配置
    ├── background.js          # 后台服务
    ├── content.js             # 页面注入脚本
    ├── auto-monitor.js        # 自动化监控
    ├── floating-panel.js      # 悬浮控制面板
    ├── popup.js/html          # 扩展弹窗
    ├── options.js/html        # 设置页面
    ├── sidebar.js/html        # 侧边栏
    ├── api-helper.js          # API请求辅助
    ├── config.js              # 扩展配置
    └── icons/                 # 扩展图标
```

## 🔒 后端说明

- **后端服务已从公开仓库中移除**，以保护敏感信息和安全配置
- 扩展默认使用官方部署的后端服务：`https://windsurf-auto-register.onrender.com`
- 后端包含API密钥验证、速率限制、CORS保护等安全措施
- 如需自建后端服务，请联系项目维护者

## 🚀 快速开始

### 方式一：使用在线服务（推荐）

**后端已部署**：`https://windsurf-auto-register.onrender.com`

1. **安装扩展**
   - 下载本项目的 `extension` 文件夹
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `extension` 文件夹

2. **配置后端地址**
   - 点击扩展图标 → 设置
   - 后端地址：`https://windsurf-auto-register.onrender.com`
   - 保存设置

3. **开始使用**
   - 访问 Windsurf 注册页面
   - 点击「开始注册」自动完成

### 方式二：自定义后端（高级用户）

如果你需要自建后端服务，请联系项目维护者获取：
- 后端源代码
- 部署指南
- 安全配置说明
- API密钥配置方法

## 📖 使用方法

### 自动注册流程

1. **访问注册页面**
   - 打开 Windsurf 注册页面
   - 扩展会自动显示悬浮控制面板

2. **开始注册**
   - 点击「开始注册」按钮
   - 自动生成临时邮箱
   - 自动填写注册表单
   - 自动获取验证码
   - 自动完成注册

3. **查看结果**
   - 注册成功后账号自动保存
   - 访问管理后台查看所有账号
   - 管理后台：`https://windsurf-auto-register.onrender.com`

### 管理后台功能

访问后端地址即可使用管理后台：

- ✅ **账号管理** - 查看所有已注册账号（每页10条）
- ✅ **搜索功能** - 快速查找账号
- ✅ **批量删除** - 选择多个账号批量删除
- ✅ **导出CSV** - 导出账号列表
- ✅ **动态码管理** - 生成和管理激活码
- ✅ **状态筛选** - 按状态筛选动态码

## API 接口

### 生成临时邮箱

```http
POST /api/generate-email
```

**响应:**
```json
{
  "success": true,
  "email": "example@1secmail.com",
  "username": "example",
  "domain": "1secmail.com"
}
```

### 获取邮件列表

```http
GET /api/get-messages/:email
```

**响应:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 123456,
      "from": "noreply@windsurf.com",
      "subject": "Verification Code",
      "date": "2024-01-01 12:00:00"
    }
  ],
  "count": 1
}
```

### 获取邮件详情

```http
GET /api/get-message/:email/:messageId
```

**响应:**
```json
{
  "success": true,
  "message": {
    "id": 123456,
    "from": "noreply@windsurf.com",
    "subject": "Verification Code",
    "body": "Your verification code is: ABC123",
    "date": "2024-01-01 12:00:00"
  },
  "verificationCode": "ABC123"
}
```

### 等待验证码

```http
GET /api/wait-for-code/:email
```

**响应:**
```json
{
  "success": true,
  "code": "ABC123",
  "message": { ... }
}
```

## 🛠️ 技术栈

### Chrome 扩展
- **Chrome Extension Manifest V3** - 扩展开发
- **Vanilla JavaScript** - 核心逻辑
- **Modern CSS3** - 响应式界面
- **Fetch API** - 网络请求
- **API Helper** - 统一API请求管理

### 后端服务（私有）
- **Node.js** + **Express** - 服务器框架
- **Upstash Redis** - 数据存储
- **API密钥验证** - 安全保护
- **速率限制** - 防滥用
- **CORS保护** - 跨域安全
- **Render** - 部署平台

## ⚙️ 配置选项

### 扩展设置

在扩展的设置页面可以配置：

- **后端服务地址** - 默认 `https://windsurf-auto-register.onrender.com`
- **自动注册选项** - 开启/关闭自动化功能
- **日志级别** - 调整日志详细程度

### 扩展配置文件

**config.js** - 扩展配置
```javascript
const CONFIG = {
    API_KEY: 'your-api-key',
    DEFAULT_BACKEND_URL: 'https://windsurf-auto-register.onrender.com'
};
```

**api-helper.js** - API请求辅助
- 自动添加API密钥
- 统一错误处理
- 支持GET/POST/DELETE请求

## ⚠️ 注意事项

1. **后端服务** - 使用在线服务或确保本地后端已启动
2. **网络连接** - 需要稳定的网络连接
3. **人机验证** - 遇到人机验证需手动完成，扩展会自动继续
4. **临时邮箱** - 1secmail 邮箱有效期约 1 小时
5. **验证码时效** - 验证码有时间限制，请及时使用
6. **Render 冷启动** - 免费版 Render 服务可能需要 30-60 秒启动

## 故障排除

### 后端服务连接失败

1. 检查网络连接
2. 确认后端地址配置正确
3. 等待Render服务冷启动（约30-60秒）
4. 检查API密钥是否正确

### 扩展无法加载

1. 检查 manifest.json 格式是否正确
2. 确认所有文件路径正确
3. 查看 Chrome 扩展页面的错误信息

### 无法生成邮箱

1. 检查后端服务是否运行
2. 检查网络连接
3. 查看浏览器控制台错误信息

### 无法自动填充

1. 确认在正确的注册页面
2. 检查页面元素选择器是否需要更新
3. 查看 content.js 的控制台日志

## 开发调试

### 扩展调试

1. 打开扩展弹窗，右键选择"检查"
2. 在网页上右键选择"检查"，查看 content script 日志
3. 访问 `chrome://extensions/`，点击"背景页"查看 background script 日志

## 📝 更新日志

### v2.0.0 (2025-11-11)
- ✨ 添加管理后台分页功能（每页10条）
- 🔍 添加账号和动态码搜索功能
- 🗑️ 添加批量删除功能
- 📥 添加账号导出CSV功能
- 🎯 添加动态码状态筛选
- 🐛 修复显示不完全问题
- 🚀 优化性能，支持大数据量

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🎉 支持全自动注册
- 📧 集成临时邮箱服务
- 🔄 自动验证码识别
- 🎟️ 动态激活码管理

## 📄 许可证

MIT License

## ⚖️ 免责声明

本工具仅供学习和研究使用，请遵守相关服务的使用条款。使用本工具产生的任何后果由使用者自行承担。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请在 GitHub 提交 Issue。

## 🌟 Star History

如果这个项目对你有帮助，请给个 Star ⭐️
