@echo off
chcp 65001 > nul
echo ========================================================
echo  [ALPHA PULSE] 윈도우 작업 스케줄러 평일 장중 자동 동기화 등록
echo ========================================================
echo.
echo 평일(월~금) 09:00 ~ 15:30 동안 10분마다 백그라운드에서
echo KRX 1,381개 종목 시세 및 5분봉 스냅샷을 자동 갱신합니다.
echo.

set SCRIPT_PATH=%~dp0update_krx_prices.ps1
schtasks /Create /TN "AlphaPulse_KRX_LiveSync" /TR "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\"" /SC MINUTE /MO 10 /ST 09:00 /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [성공] 자동 스케줄러 등록이 완료되었습니다!
    echo 이제 PC를 켜두시기만 하면 평일 장중에 10분마다 백그라운드에서 자동 갱신됩니다.
) else (
    echo.
    echo [오류] 관리자 권한으로 실행해 주세요. (우클릭 -> 관리자 권한으로 실행)
)
echo.
pause
