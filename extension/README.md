# Windsurf 自动注册扩展

Chrome 浏览器扩展，用于自动化 Windsurf 账号注册流程。

## 📦 安装方法

### 方法一：开发者模式加载（推荐）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本 `extension` 文件夹

### 方法二：打包安装

1. 在 `chrome://extensions/` 页面
2. 点击「打包扩展程序」
3. 选择 `extension` 文件夹
4. 生成 `.crx` 文件后拖入浏览器安装

## 🎯 核心文件说明

### 必需文件
- `manifest.json` - 扩展配置文件
- `background.js` - 后台服务脚本
- `content.js` - 页面内容脚本
- `auto-monitor.js` - 自动化监控逻辑
- `floating-panel.js` / `floating-panel.html` - 悬浮控制面板
- `popup.js` / `popup.html` - 扩展弹窗
- `options.js` / `options.html` - 设置页面
- `sidebar.js` / `sidebar.html` - 侧边栏
- `icons/` - 扩展图标

### 可选文件
- `generate-icons.js` - 图标生成工具（开发用）

## ⚙️ 配置后端

安装后首次使用需要配置后端地址：

1. 点击扩展图标
2. 进入「设置」
3. 输入后端地址：`https://your-backend.onrender.com`
4. 保存设置

## 🚀 使用方法

1. 访问 Windsurf 注册页面
2. 扩展会自动显示悬浮面板
3. 点击「开始注册」自动完成流程
4. 账号信息会自动保存到后端

## 📝 注意事项

- 需要配合后端服务使用
- 确保后端地址正确配置
- 首次使用建议在设置中检查配置

## 🔗 相关链接

- 后端部署：查看项目根目录的 `backend/` 文件夹
- 管理后台：访问后端地址即可查看已注册账号

## 📄 许可证

MIT License
