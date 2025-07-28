@echo off
echo ========================================
echo 🚀 EXE 파일 실행기
echo ========================================

REM 현재 디렉토리 확인
echo 현재 디렉토리: %CD%

REM JSON 파일이 있는지 확인
if exist "*.json" (
    echo 📁 JSON 파일 발견:
    dir *.json
    echo.
    
    REM 가장 최근 JSON 파일 찾기
    for /f "delims=" %%i in ('dir /b /od *.json') do set "latest_json=%%i"
    echo 📄 사용할 JSON 파일: %latest_json%
    echo.
    
    REM EXE 파일 실행
    if exist "file_saver.exe" (
        echo ⚡ EXE 파일 실행 중...
        file_saver.exe --input "%latest_json%"
        echo ✅ EXE 실행 완료!
    ) else (
        echo ❌ file_saver.exe 파일을 찾을 수 없습니다!
        echo 📂 현재 폴더의 파일들:
        dir *.exe
    )
) else (
    echo ❌ JSON 파일을 찾을 수 없습니다!
    echo 💡 JSON 파일을 이 폴더에 다운로드하세요.
)

echo.
echo 아무 키나 누르면 종료됩니다...
pause > nul 