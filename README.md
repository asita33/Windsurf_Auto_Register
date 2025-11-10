# Windsurf 自动注册助手

一个用于自动注册 Windsurf 账号的 Chrome 扩展，集成临时邮箱服务，实现全自动注册流程。

## 功能特点

- 🚀 **全自动注册** - 一键完成整个注册流程
- 📧 **临时邮箱** - 自动生成临时邮箱接收验证码
- 🔄 **智能填充** - 自动识别并填写表单字段
- 📱 **验证码识别** - 自动提取邮件中的验证码
- 💾 **状态保存** - 保存当前邮箱和注册状态
- 📊 **实时日志** - 显示详细的操作日志

## 项目结构

```
windsurf-auto-register/
├── backend/              # 后端服务
│   ├── server.js        # Express 服务器
│   └── package.json     # 后端依赖
└── extension/           # Chrome 扩展
    ├── manifest.json    # 扩展配置
    ├── popup.html       # 弹出窗口界面
    ├── popup.js         # 弹出窗口逻辑
    ├── content.js       # 内容脚本
    ├── background.js    # 后台脚本
    └── icons/           # 图标文件
```

## 安装步骤

### 1. 安装后端服务

```bash
cd backend
npm install
npm start
```

后端服务将运行在 `http://localhost:3000`

### 2. 安装 Chrome 扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extension` 文件夹

## 使用方法

### 方式一：全自动注册

1. 打开 Windsurf 注册页面
2. 点击扩展图标打开弹窗
3. 点击"开始自动注册"按钮
4. 等待自动完成注册流程

### 方式二：手动使用临时邮箱

1. 点击扩展图标
2. 点击"仅生成临时邮箱"
3. 复制生成的邮箱地址
4. 手动填写到注册表单
5. 点击"检查验证码"获取验证码

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

## 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web 框架
- **Axios** - HTTP 客户端
- **1secmail API** - 临时邮箱服务

### 前端
- **Chrome Extension API** - 扩展开发
- **Vanilla JavaScript** - 核心逻辑
- **CSS3** - 界面样式

## 配置选项

在扩展弹窗中可以配置：

- **后端服务地址** - 默认 `http://localhost:3000`
- 可根据需要修改为其他地址

## 注意事项

1. **后端服务必须运行** - 使用前确保后端服务已启动
2. **网络连接** - 需要稳定的网络连接
3. **页面适配** - 如果 Windsurf 更新了注册页面，可能需要更新选择器
4. **临时邮箱限制** - 1secmail 的邮箱有效期约为 1 小时
5. **验证码时效** - 验证码通常有时间限制，请及时使用

## 故障排除

### 后端服务无法启动

```bash
# 检查端口是否被占用
netstat -ano | findstr :3000

# 更换端口（修改 server.js 中的 PORT）
```

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

### 后端调试

```bash
# 使用 nodemon 自动重启
npm run dev

# 查看日志
# 日志会输出到控制台
```

### 扩展调试

1. 打开扩展弹窗，右键选择"检查"
2. 在网页上右键选择"检查"，查看 content script 日志
3. 访问 `chrome://extensions/`，点击"背景页"查看 background script 日志

## 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🎉 支持全自动注册
- 📧 集成临时邮箱服务
- 🔄 自动验证码识别

## 许可证

MIT License

## 免责声明

本工具仅供学习和研究使用，请遵守相关服务的使用条款。使用本工具产生的任何后果由使用者自行承担。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请提交 Issue。
