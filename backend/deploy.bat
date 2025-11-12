@echo off
echo 正在提交修复...
git commit -m "restore-backend-files-and-fix-api-headers"
echo 正在推送到远程仓库...
git push origin main
echo 部署完成！
pause
