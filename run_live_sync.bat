@echo off
chcp 65001 > nul
echo ========================================================
echo  [ALPHA PULSE PRO] KRX 1,381종목 실제 5분봉 시세 즉시 동기화
echo ========================================================
powershell -ExecutionPolicy Bypass -File .\update_krx_prices.ps1
echo.
pause
