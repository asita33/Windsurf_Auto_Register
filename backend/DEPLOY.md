# 🚀 一键部署指南

## 快速部署

### 步骤1：访问Vercel
打开: https://vercel.com/dashboard

### 步骤2：找到项目
找到项目名称: `windsurf-backend`

### 步骤3：重新部署
点击项目 → **"Redeploy"** → **"Redeploy"** 确认

### 步骤4：等待完成
等待约30秒-1分钟，部署完成后会自动生效

### 步骤5：清除缓存
打开后台页面，按 **Ctrl + F5** 强制刷新

---

## 验证部署成功

访问你的后台地址，应该看到：

✅ **导航栏**：紫色渐变图标 + "管理后台 v2.0"  
✅ **标签页**：6个标签（Dashboard/账号/邮箱/动态码/IP/支持）  
✅ **Dashboard**：4个彩色统计卡片  
✅ **按钮**：新的紫色渐变风格

---

## 如果部署失败

### 方法1：重新创建部署
1. Vercel Dashboard → 项目
2. Settings → General
3. 点击 "Delete" 删除项目
4. 重新导入项目

### 方法2：检查环境变量
确保这些环境变量已设置：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 方法3：查看部署日志
1. Vercel Dashboard → 项目
2. Deployments → 最新部署
3. 点击查看 Build Logs
4. 查找错误信息

---

## 🆘 需要帮助？

如果遇到问题，提供以下信息：
1. Vercel项目URL
2. 部署日志截图
3. 错误信息描述

---

**部署时间**: < 1分钟  
**生效时间**: 立即  
**数据影响**: 无（所有数据保留在Redis中）
