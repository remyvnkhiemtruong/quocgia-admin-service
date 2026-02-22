@echo off
set /p msg="Nhap noi dung commit (Enter de bo qua): "
if "%msg%"=="" set msg="Update code: %date% %time%"

echo --- 1. Dang kiem tra trang thai... ---
git add .

echo --- 2. Dang commit voi noi dung: %msg% ---
git commit -m "%msg%"

echo --- 3. Dang lay code moi nhat tu GitHub ve (Pull)... ---
git pull https://github.com/remyvnkhiemtruong/quocgia-admin-service.git main --rebase

echo --- 4. Dang day code len GitHub (Push)... ---
git push https://github.com/remyvnkhiemtruong/quocgia-admin-service.git main

echo --- Hoan tat! ---
pause