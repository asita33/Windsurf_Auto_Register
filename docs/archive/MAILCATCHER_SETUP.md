# 🚀 MailCatcher 快速安装指南

## 📋 方案说明

**MailCatcher** 是一个简单的 SMTP 服务器，可以捕获所有发送的邮件。

**特点**：
- ✅ 完全免费
- ✅ 本地运行
- ✅ 能接收所有邮件
- ✅ 有 Web 界面
- ✅ 提供 API

---

## 🎯 安装步骤

### 方法 1: 使用 Docker (推荐) ⭐

#### 步骤 1: 安装 Docker Desktop

**下载地址**：
```
https://www.docker.com/products/docker-desktop/
```

**安装步骤**：
1. 下载 Docker Desktop for Windows
2. 双击安装程序
3. 按照提示完成安装
4. 重启电脑
5. 启动 Docker Desktop

**验证安装**：
```powershell
docker --version
```

应该显示类似：`Docker version 24.0.0`

---

#### 步骤 2: 启动 MailCatcher

**运行命令**：
```powershell
docker run -d -p 1080:1080 -p 1025:1025 --name mailcatcher schickling/mailcatcher
```

**参数说明**：
- `-d`: 后台运行
- `-p 1080:1080`: Web 界面端口
- `-p 1025:1025`: SMTP 服务器端口
- `--name mailcatcher`: 容器名称

**验证运行**：
```powershell
docker ps
```

应该看到 mailcatcher 容器正在运行。

---

#### 步骤 3: 访问 Web 界面

**打开浏览器**：
```
http://localhost:1080
```

你会看到 MailCatcher 的 Web 界面，显示所有接收到的邮件。

---

### 方法 2: 不使用 Docker (备选)

如果不想安装 Docker，可以直接使用 Ruby 安装：

#### 步骤 1: 安装 Ruby

**下载地址**：
```
https://rubyinstaller.org/downloads/
```

选择 Ruby+Devkit 版本，下载并安装。

---

#### 步骤 2: 安装 MailCatcher

```powershell
gem install mailcatcher
```

---

#### 步骤 3: 启动 MailCatcher

```powershell
mailcatcher
```

---

## 🔧 配置说明

### SMTP 服务器配置

```
主机: localhost
端口: 1025
用户名: (无)
密码: (无)
加密: 无
```

### Web 界面

```
地址: http://localhost:1080
```

### API 端点

```
获取所有邮件: GET http://localhost:1080/messages
获取邮件详情: GET http://localhost:1080/messages/:id.json
获取邮件HTML: GET http://localhost:1080/messages/:id.html
删除邮件: DELETE http://localhost:1080/messages/:id
清空所有邮件: DELETE http://localhost:1080/messages
```

---

## 🎯 使用方法

### 1. 发送测试邮件

**使用 PowerShell**：
```powershell
# 需要安装 Send-MailMessage 模块
Send-MailMessage -SmtpServer localhost -Port 1025 -From "test@example.com" -To "user@example.com" -Subject "测试邮件" -Body "这是一封测试邮件"
```

**使用 Node.js**：
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false
});

transporter.sendMail({
  from: 'test@example.com',
  to: 'user@example.com',
  subject: '测试邮件',
  text: '这是一封测试邮件'
});
```

---

### 2. 查看邮件

**方法 1: Web 界面**
```
打开: http://localhost:1080
```

**方法 2: API**
```javascript
// 获取所有邮件
const response = await fetch('http://localhost:1080/messages');
const messages = await response.json();

// 获取邮件详情
const detail = await fetch(`http://localhost:1080/messages/${id}.json`);
const message = await detail.json();
```

---

## 🔗 集成到我们的系统

我已经准备好集成代码，安装完 Docker 后告诉我，我会：

1. ✅ 添加 MailCatcher 服务到后端
2. ✅ 在管理后台显示邮件
3. ✅ 自动提取验证码
4. ✅ 提供 API 接口

---

## 📝 常用命令

### Docker 命令

```powershell
# 启动 MailCatcher
docker start mailcatcher

# 停止 MailCatcher
docker stop mailcatcher

# 重启 MailCatcher
docker restart mailcatcher

# 查看日志
docker logs mailcatcher

# 删除容器
docker rm mailcatcher
```

---

## 🎯 下一步

### 1. 安装 Docker Desktop

**下载**: https://www.docker.com/products/docker-desktop/

**安装时间**: 约 5-10 分钟

---

### 2. 启动 MailCatcher

```powershell
docker run -d -p 1080:1080 -p 1025:1025 --name mailcatcher schickling/mailcatcher
```

---

### 3. 验证

```
打开: http://localhost:1080
```

---

### 4. 告诉我

安装完成后告诉我，我会立即集成到系统！

---

## 💡 优点

**MailCatcher 的优势**：

1. **完全免费**
   - 无需付费
   - 无限制使用

2. **本地运行**
   - 隐私安全
   - 不依赖外部服务

3. **简单易用**
   - 一条命令启动
   - Web 界面直观

4. **功能完整**
   - 捕获所有邮件
   - 提供完整 API
   - 支持 HTML 邮件

5. **开发友好**
   - 适合测试
   - 易于调试
   - 不会真正发送邮件

---

## ⚠️ 注意事项

1. **仅限本地使用**
   - MailCatcher 只能在本地访问
   - 不能接收外部邮件

2. **不适合生产环境**
   - 仅用于开发测试
   - 邮件不会真正发送

3. **需要 Docker**
   - 推荐使用 Docker 方式
   - 或者安装 Ruby

---

## 🎊 总结

**安装步骤**：
1. 安装 Docker Desktop
2. 运行一条命令
3. 打开 Web 界面
4. 开始使用

**时间**: 10 分钟搞定

**费用**: 完全免费

**难度**: ⭐ (非常简单)

---

## 📞 需要帮助？

安装过程中遇到问题？告诉我：

1. 安装 Docker 时的错误
2. 启动 MailCatcher 的问题
3. 访问 Web 界面的问题

我会立即帮你解决！

---

**现在就去安装 Docker Desktop，然后告诉我！** 🚀
