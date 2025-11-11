# 图标文件说明

请在此目录下放置以下尺寸的图标文件：

- icon16.png (16x16 像素)
- icon48.png (48x48 像素)
- icon128.png (128x128 像素)

## 图标设计建议

- 使用简洁的设计
- 主色调建议使用紫色系（与 Windsurf 品牌色相近）
- 可以使用邮件或自动化相关的图标元素
- 确保在不同尺寸下都清晰可见

## 在线图标生成工具

如果您没有设计工具，可以使用以下在线工具生成图标：

1. https://www.favicon-generator.org/
2. https://realfavicongenerator.net/
3. https://www.canva.com/

## 临时解决方案

如果暂时没有图标，可以创建简单的纯色图标：

```javascript
// 使用 Canvas 创建简单图标的示例代码
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// 绘制背景
const gradient = ctx.createLinearGradient(0, 0, 128, 128);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

// 绘制文字
ctx.fillStyle = 'white';
ctx.font = 'bold 60px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('W', 64, 64);
```
