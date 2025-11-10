# 🚀 Ruby + MailCatcher 安装指南

## 📋 完整步骤

### 步骤 1: 下载 Ruby (2 分钟)

**下载地址**:
```
https://rubyinstaller.org/downloads/
```

**选择版本**:
- 找到 **WITH DEVKIT** 区域
- 选择 **Ruby+Devkit 3.2.X (x64)** (粗体标记的推荐版本)
- 例如: `Ruby+Devkit 3.2.2-1 (x64)`

**直接下载链接** (如果上面的网站打不开):
```
https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.2.2-1/rubyinstaller-devkit-3.2.2-1-x64.exe
```

---

### 步骤 2: 安装 Ruby (5 分钟)

#### 1. 双击下载的安装程序

#### 2. 安装选项 (重要！)

**必须勾选**:
- ✅ **Add Ruby executables to your PATH**
- ✅ **Associate .rb and .rbw files with this Ruby installation**

**安装路径**:
- 默认即可: `C:\Ruby32-x64`

#### 3. 点击 Install

#### 4. 安装完成后

会弹出一个黑色窗口，显示:
```
 _____       _           _____           _        _ _         ___
|  __ \     | |         |_   _|         | |      | | |       |__ \
| |__) |   _| |__  _   _  | |  _ __  ___| |_ __ _| | | ___ _ __ ) |
|  _  / | | | '_ \| | | | | | | '_ \/ __| __/ _` | | |/ _ \ '__/ /
| | \ \ |_| | |_) | |_| |_| |_| | | \__ \ || (_| | | |  __/ | / /_
|_|  \_\__,_|_.__/ \__, |_____|_| |_|___/\__\__,_|_|_|\___|_||____|
                    __/ |
                   |___/

1 - MSYS2 base installation
2 - MSYS2 system update
3 - MSYS2 and MINGW development toolchain

Which components shall be installed? If unsure press ENTER [1,2,3]
```

**输入**: `1,2,3` 然后按 Enter

这会安装所有必要的开发工具，需要 3-5 分钟。

#### 5. 等待安装完成

看到类似这样的提示就完成了:
```
Install MSYS2 and MINGW development toolchain succeeded
```

按任意键关闭窗口。

---

### 步骤 3: 验证 Ruby 安装 (1 分钟)

**打开新的 PowerShell 窗口** (重要！必须是新窗口)

运行:
```powershell
ruby --version
```

应该显示:
```
ruby 3.2.2 (2023-03-30 revision e51014f9c0) [x64-mingw-ucrt]
```

运行:
```powershell
gem --version
```

应该显示:
```
3.4.x
```

如果都显示正常，说明 Ruby 安装成功！✅

---

### 步骤 4: 安装 MailCatcher (3 分钟)

#### 方法 1: 使用自动脚本 (推荐)

**双击运行**:
```
install-mailcatcher-ruby.bat
```

脚本会自动:
- 检查 Ruby
- 安装 MailCatcher
- 启动 MailCatcher
- 打开 Web 界面

---

#### 方法 2: 手动安装

**打开 PowerShell**，运行:
```powershell
gem install mailcatcher
```

等待安装完成 (约 2-3 分钟)。

看到类似这样的提示就完成了:
```
Successfully installed mailcatcher-0.8.2
1 gem installed
```

---

### 步骤 5: 启动 MailCatcher (1 分钟)

**运行**:
```powershell
mailcatcher
```

应该显示:
```
Starting MailCatcher
==> smtp://127.0.0.1:1025
==> http://127.0.0.1:1080
*** MailCatcher runs as a daemon by default. Go to the web interface to quit.
```

---

### 步骤 6: 访问 Web 界面

**打开浏览器**:
```
http://localhost:1080
```

你会看到 MailCatcher 的界面！✅

---

## 🎯 完成后告诉我

看到 MailCatcher 的 Web 界面后，告诉我 "安装完成"，我会:

1. ✅ 集成 MailCatcher 到后端系统
2. ✅ 在管理后台显示邮件
3. ✅ 自动提取验证码
4. ✅ 提供测试脚本

---

## ⚠️ 常见问题

### 问题 1: 找不到 ruby 命令

**原因**: 环境变量未生效

**解决**:
1. 关闭所有 PowerShell 窗口
2. 重新打开新的 PowerShell
3. 再次运行 `ruby --version`

---

### 问题 2: gem install 很慢

**原因**: 默认源在国外

**解决**: 使用国内镜像
```powershell
gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/
gem sources -l
```

然后再运行:
```powershell
gem install mailcatcher
```

---

### 问题 3: 安装 MailCatcher 报错

**常见错误**: 缺少编译工具

**解决**:
1. 重新运行 Ruby 安装程序
2. 选择 "Modify"
3. 确保勾选了 MSYS2 开发工具
4. 重新安装

---

### 问题 4: 端口被占用

**错误信息**: `Address already in use - bind(2)`

**解决**:
```powershell
# 查看占用端口的进程
netstat -ano | findstr :1080
netstat -ano | findstr :1025

# 结束进程 (PID 是上面命令显示的数字)
taskkill /PID <PID> /F
```

---

## 📝 快速命令参考

### 启动 MailCatcher
```powershell
mailcatcher
```

### 停止 MailCatcher
```powershell
# 方法 1: 访问 Web 界面，点击 Quit
# 方法 2: 任务管理器结束 ruby.exe
# 方法 3: 
taskkill /IM ruby.exe /F
```

### 查看 MailCatcher 版本
```powershell
mailcatcher --version
```

### 查看帮助
```powershell
mailcatcher --help
```

---

## 🎊 总结

**安装步骤**:
1. 下载 Ruby+Devkit
2. 安装 Ruby (勾选所有选项)
3. 运行 `gem install mailcatcher`
4. 运行 `mailcatcher`
5. 访问 http://localhost:1080

**总时间**: 约 10-15 分钟

**完成后**: 告诉我 "安装完成"！

---

## 🚀 现在开始

**第一步**: 下载 Ruby

**推荐链接**:
```
https://rubyinstaller.org/downloads/
```

**或直接下载**:
```
https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.2.2-1/rubyinstaller-devkit-3.2.2-1-x64.exe
```

**下载后**: 双击安装，勾选所有选项！

**安装过程中遇到问题？** 随时告诉我！
