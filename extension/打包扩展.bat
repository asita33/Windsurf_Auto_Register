@echo off
echo ===================================
echo   打包 Chrome 扩展
echo ===================================
echo.

echo 正在打包扩展文件...

cd /d "%~dp0"

:: 创建临时文件夹
if exist "temp_package" rmdir /s /q temp_package
mkdir temp_package

:: 复制需要的文件
echo [1/5] 复制文件...
xcopy /s /y "icons" "temp_package\icons\" >nul
copy /y "manifest.json" "temp_package\" >nul
copy /y "*.html" "temp_package\" >nul
copy /y "*.js" "temp_package\" >nul

:: 删除已有的 ZIP
if exist "windsurf-extension-v1.0.0.zip" del "windsurf-extension-v1.0.0.zip"

:: 打包
echo [2/5] 压缩文件...
powershell -command "Compress-Archive -Path 'temp_package\*' -DestinationPath 'windsurf-extension-v1.0.0.zip' -Force"

:: 清理临时文件
echo [3/5] 清理临时文件...
rmdir /s /q temp_package

echo.
echo ===================================
echo   ✅ 打包完成！
echo ===================================
echo.
echo 文件位置: %~dp0windsurf-extension-v1.0.0.zip
echo.
echo 这个 ZIP 文件可以：
echo 1. 上传到 GitHub Release
echo 2. 分享给用户直接安装
echo 3. 提交到 Edge 商店
echo.
pause
