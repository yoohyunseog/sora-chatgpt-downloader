@echo off
title 🚀 EXE 실행기 - 빠른 시작
color 0A

echo.
echo ========================================
echo 🚀 EXE 파일 실행기 - 빠른 시작
echo ========================================
echo.

echo 📂 현재 폴더: %CD%
echo.

echo 🔍 data 폴더의 JSON 파일 검색 중...
if exist "data\*.json" (
    echo ✅ data 폴더에서 JSON 파일 발견!
    dir data\*.json /b
    echo.
    
    echo 🔍 EXE 파일 검색 중...
    if exist "*.exe" (
        echo ✅ EXE 파일 발견!
        dir *.exe /b
        echo.
        
        echo ⚡ 자동 실행 시작...
        echo.
        
        REM data 폴더의 고정 JSON 파일 찾기
        set "json_file=data\auto_save_data.json"
        
        REM 가장 최근 EXE 파일 찾기
        for /f "delims=" %%i in ('dir /b /od *.exe') do set "exe_file=%%i"
        
        echo 📄 JSON 파일: %json_file%
        echo ⚡ EXE 파일: %exe_file%
        echo.
        
        echo 🚀 실행 중...
        "%exe_file%" --input "%json_file%"
        
        echo.
        echo ✅ 실행 완료!
        
    ) else (
        echo ❌ EXE 파일을 찾을 수 없습니다!
        echo 💡 EXE 파일을 이 폴더에 넣어주세요.
    )
) else (
    echo ❌ data 폴더에서 JSON 파일을 찾을 수 없습니다!
    echo 💡 Chrome Extension에서 JSON을 다운로드하세요.
    echo.
    echo 📁 data 폴더가 자동으로 생성됩니다.
)

echo.
echo ========================================
echo 🎯 사용법:
echo 1. Chrome Extension에서 JSON 다운로드
echo 2. 이 배치 파일 실행
echo 3. 자동으로 EXE 실행됨
echo 📁 저장 위치: data\auto_save_data.json
echo ========================================
echo.

pause 