@echo off
echo 🚀 C드라이브에서 D드라이브로 변경된 파일들 동기화 중...
echo.

REM D드라이브 경로 설정 (여기를 본인의 D드라이브 경로로 수정하세요)
set "D_DRIVE_PATH=D:\dream-interpretation"

REM 필수 파일들 복사
echo 📋 설정 파일 복사 중...
copy /Y "vercel.json" "%D_DRIVE_PATH%\"
copy /Y "package.json" "%D_DRIVE_PATH%\"
copy /Y "package-lock.json" "%D_DRIVE_PATH%\"

echo 📁 클라이언트 파일 복사 중...
xcopy /Y /E "client" "%D_DRIVE_PATH%\client\" 

echo 📁 서버 파일 복사 중...
xcopy /Y /E "server" "%D_DRIVE_PATH%\server\"

echo 📄 문서 파일 복사 중...
copy /Y "README.md" "%D_DRIVE_PATH%\" 2>nul
copy /Y "SETUP_GUIDE.md" "%D_DRIVE_PATH%\" 2>nul
copy /Y ".gitignore" "%D_DRIVE_PATH%\" 2>nul

echo.
echo ✅ 동기화 완료!
echo 💡 이제 D드라이브에서 git add . && git commit && git push 하시면 됩니다
echo.
pause