# 🚀 MailCatcher 安装（无需 Docker）

## ⚠️ Docker 无法安装？

如果你的 Windows 版本不支持 Docker Desktop，有以下替代方案：

---

## 方案 1: 使用 Ruby 安装 MailCatcher ⭐ 推荐

### 步骤 1: 安装 Ruby

**下载地址**:
```
https://rubyinstaller.org/downloads/
```

**推荐版本**: Ruby+Devkit 3.2.X (x64)

**安装步骤**:
1. 下载 `rubyinstaller-devkit-3.2.x-x-x64.exe`
2. 双击安装
3. 勾选 "Add Ruby executables to your PATH"
4. 勾选 "Run 'ridk install'"
5. 安装完成后，在弹出的窗口选择 `1, 2, 3` 全部安装

**验证安装**:
```powershell
ruby --version
gem --version
```

---

### 步骤 2: 安装 MailCatcher

**打开 PowerShell 或 CMD**，运行:
```powershell
gem install mailcatcher
```

安装时间约 2-5 分钟。

---

### 步骤 3: 启动 MailCatcher

```powershell
mailcatcher
```

你会看到:
```
Starting MailCatcher
==> smtp://127.0.0.1:1025
==> http://127.0.0.1:1080
*** MailCatcher runs as a daemon by default. Go to the web interface to quit.
```

---

### 步骤 4: 访问 Web 界面

打开浏览器:
```
http://localhost:1080
```

---

## 方案 2: 使用 Python 的 aiosmtpd ⭐

如果你已经安装了 Python，可以使用这个方案：

### 步骤 1: 安装 Python

**下载地址**:
```
https://www.python.org/downloads/
```

**安装步骤**:
1. 下载 Python 3.x
2. 勾选 "Add Python to PATH"
3. 点击 Install

---

### 步骤 2: 安装 aiosmtpd

```powershell
pip install aiosmtpd
```

---

### 步骤 3: 创建简单的 SMTP 服务器

创建文件 `smtp-server.py`:
```python
import asyncio
from aiosmtpd.controller import Controller
from datetime import datetime

class MessageHandler:
    async def handle_DATA(self, server, session, envelope):
        print(f'\n=== 收到新邮件 ===')
        print(f'时间: {datetime.now()}')
        print(f'发件人: {envelope.mail_from}')
        print(f'收件人: {envelope.rcpt_tos}')
        print(f'内容:\n{envelope.content.decode("utf8", errors="replace")}')
        print('=' * 50)
        return '250 Message accepted for delivery'

if __name__ == '__main__':
    handler = MessageHandler()
    controller = Controller(handler, hostname='localhost', port=1025)
    controller.start()
    print('SMTP 服务器运行在 localhost:1025')
    print('按 Ctrl+C 停止')
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        controller.stop()
```

运行:
```powershell
python smtp-server.py
```

---

## 方案 3: 使用在线服务（最简单）⭐⭐⭐

### Ethereal Email (完全免费)

**网站**: https://ethereal.email/

**特点**:
- ✅ 完全免费
- ✅ 无需安装
- ✅ 提供 SMTP 配置
- ✅ 有 Web 界面
- ✅ 提供 API

**使用步骤**:

1. **访问网站**
   ```
   https://ethereal.email/create
   ```

2. **创建账号**
   - 点击 "Create Ethereal Account"
   - 自动生成账号信息

3. **获取 SMTP 配置**
   ```
   Host: smtp.ethereal.email
   Port: 587
   Username: (自动生成)
   Password: (自动生成)
   ```

4. **查看邮件**
   - 登录 https://ethereal.email/login
   - 查看所有接收的邮件

---

## 方案 4: 使用 Mailtrap (免费额度)

**网站**: https://mailtrap.io/

**特点**:
- ✅ 免费额度: 500 封/月
- ✅ 专业的邮件测试服务
- ✅ 有 Web 界面
- ✅ 提供 API

**使用步骤**:

1. **注册账号**
   ```
   https://mailtrap.io/register/signup
   ```

2. **获取 SMTP 配置**
   - 登录后进入 Inbox
   - 查看 SMTP 配置

3. **查看邮件**
   - 在 Web 界面查看
   - 或通过 API 获取

---

## 📊 方案对比

| 方案 | 费用 | 安装难度 | 功能 | 推荐度 |
|------|------|---------|------|--------|
| **Ruby + MailCatcher** | 免费 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Python + aiosmtpd** | 免费 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Ethereal Email** | 免费 | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mailtrap** | 免费额度 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 💡 我的推荐

### 最简单: Ethereal Email

**优点**:
- 无需安装任何软件
- 完全免费
- 立即可用

**步骤**:
1. 访问 https://ethereal.email/create
2. 创建账号
3. 获取 SMTP 配置
4. 告诉我配置信息，我帮你集成

---

### 最强大: Ruby + MailCatcher

**优点**:
- 本地运行
- 功能完整
- 有 Web 界面

**步骤**:
1. 安装 Ruby
2. 运行 `gem install mailcatcher`
3. 运行 `mailcatcher`
4. 访问 http://localhost:1080

---

## 🎯 立即可用的方案

### 使用 Ethereal Email (0 分钟)

我可以立即帮你:
1. 创建 Ethereal 账号
2. 集成到系统
3. 开始使用

**完全免费，无需安装！**

---

### 使用 Ruby + MailCatcher (10 分钟)

**步骤**:
1. 下载 Ruby: https://rubyinstaller.org/downloads/
2. 安装 Ruby (勾选所有选项)
3. 运行: `gem install mailcatcher`
4. 运行: `mailcatcher`
5. 访问: http://localhost:1080

---

## 📝 自动安装脚本

我已经为你准备了自动安装脚本！

### Ruby + MailCatcher 自动安装

运行 `install-mailcatcher-ruby.bat`

---

## 🎊 总结

**不需要 Docker 的方案**:

1. **Ethereal Email** - 最简单，0分钟可用
2. **Ruby + MailCatcher** - 最强大，10分钟可用
3. **Mailtrap** - 专业，有免费额度

**你想选择哪个？**

告诉我，我立即帮你实现！🚀
