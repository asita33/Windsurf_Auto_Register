@echo off
chcp 65001 >nul
echo ===================================
echo   批量更新后端地址
echo ===================================
echo.
echo 当前后端地址: https://windsurf-backend.vercel.app
echo.

set /p new_url="请输入新的后端地址 (例如: https://xxx.railway.app): "

if "%new_url%"=="" (
    echo.
    echo ❌ 错误: 地址不能为空
    pause
    exit
)

echo.
echo 正在更新以下文件:
echo   [1/4] content.js
echo   [2/4] popup.js
echo   [3/4] auto-monitor.js
echo   [4/4] floating-panel.js
echo.

cd /d "%~dp0"

:: 替换 content.js
powershell -Command "(Get-Content content.js -Raw) -replace 'https://windsurf-backend\.vercel\.app', '%new_url%' | Set-Content content.js -NoNewline"
echo ✅ content.js 已更新

:: 替换 popup.js
powershell -Command "(Get-Content popup.js -Raw) -replace 'https://windsurf-backend\.vercel\.app', '%new_url%' | Set-Content popup.js -NoNewline"
echo ✅ popup.js 已更新

:: 替换 auto-monitor.js
powershell -Command "(Get-Content auto-monitor.js -Raw) -replace 'https://windsurf-backend\.vercel\.app', '%new_url%' | Set-Content auto-monitor.js -NoNewline"
echo ✅ auto-monitor.js 已更新

:: 替换 floating-panel.js
powershell -Command "(Get-Content floating-panel.js -Raw) -replace 'https://windsurf-backend\.vercel\.app', '%new_url%' | Set-Content floating-panel.js -NoNewline"
echo ✅ floating-panel.js 已更新

echo.
echo ===================================
echo   ✅ 所有文件更新完成！
echo ===================================
echo.
echo 新的后端地址: %new_url%
echo.
echo 📌 下一步:
echo 1. 重新加载 Chrome 扩展
echo    - 访问 chrome://extensions/
echo    - 点击扩展的刷新图标 🔄
echo.
echo 2. 测试新后端是否正常
echo    - 访问: %new_url%/api/health
echo    - 应该看到 {"status":"ok"}
echo.
pause
