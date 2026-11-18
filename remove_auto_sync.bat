@echo off
chcp 65001 > nul
echo ========================================================
echo  [ALPHA PULSE] 윈도우 작업 스케줄러 자동 동기화 해제
echo ========================================================
echo.
schtasks /Delete /TN "AlphaPulse_KRX_LiveSync" /F
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [완료] 자동 스케줄러 작업이 정상적으로 삭제되었습니다.
) else (
    echo.
    echo 등록된 작업이 없거나 이미 삭제되었습니다.
)
echo.
pause
