@echo off
echo 正在解决合并冲突...
git commit -m "resolve-merge-conflict"
echo 正在推送到远程仓库...
git push origin main
echo 部署完成！
pause
