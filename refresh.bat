@echo off
copy /Y index.html www\index.html
xcopy /E /I /Y assets www\assets >nul
call npx cap sync android
echo.
echo ===== Synchronise ! Retourne dans Android Studio =====
pause