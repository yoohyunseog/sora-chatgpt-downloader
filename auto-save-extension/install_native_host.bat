@echo off
echo Auto Save Extension - Native Messaging Host 설치
echo ================================================

REM 현재 디렉토리 경로 가져오기
set "CURRENT_DIR=%~dp0"
set "PYTHON_PATH=%CURRENT_DIR%file_saver.py"

REM Chrome Native Messaging Host 등록
echo Chrome Native Messaging Host를 등록합니다...

REM Windows 레지스트리에 등록
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.auto.save.extension" /ve /d "%CURRENT_DIR%native_messaging_host.json" /f

if %ERRORLEVEL% EQU 0 (
    echo Native Messaging Host 등록 성공!
    echo.
    echo 설치된 정보:
    echo - Python 스크립트: %PYTHON_PATH%
    echo - 매니페스트 파일: %CURRENT_DIR%native_messaging_host.json
    echo - 레지스트리 키: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.auto.save.extension
    echo.
    echo 이제 Chrome 확장 프로그램을 설치할 수 있습니다.
) else (
    echo Native Messaging Host 등록 실패!
    echo 관리자 권한으로 실행해보세요.
)

pause 