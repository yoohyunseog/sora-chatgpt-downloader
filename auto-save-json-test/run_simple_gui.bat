@echo off
chcp 65001 >nul
echo ========================================
echo    Sora Auto Save 파일 정리 프로그램
echo           간단한 GUI 버전
echo ========================================
echo.

REM 현재 디렉토리로 이동
cd /d "%~dp0"

REM Python이 설치되어 있는지 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되어 있지 않습니다.
    echo Python을 설치한 후 다시 실행해주세요.
    pause
    exit /b 1
)

echo ✅ Python 확인됨
echo.

REM 간단한 GUI 실행
echo 🚀 간단한 GUI를 시작합니다...
python simple_gui.py

echo.
echo ========================================
echo GUI가 종료되었습니다.
echo ======================================== 