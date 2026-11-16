$ErrorActionPreference = "Stop"
$headers = @{"User-Agent"="Mozilla/5.0"}
$allStocks = @()

Write-Host "[1/2] KOSPI 실시간 시세 수집 중 (1~10 페이지)..." -ForegroundColor Cyan
for ($p = 1; $p -le 10; $p++) {
    $r = Invoke-RestMethod -Uri "https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page=$p&pageSize=100" -Headers $headers
    foreach ($s in $r.stocks) {
        if ($s.stockEndType -eq "stock" -and [int]$s.closePriceRaw -gt 0) {
            $cr = [double]$s.fluctuationsRatio
            $sign = if ($cr -gt 0) { 1 } elseif ($cr -lt 0) { -1 } else { 0 }
            $diff = [math]::Abs([int]$s.compareToPreviousClosePriceRaw) * $sign
            $allStocks += [PSCustomObject]@{
                c = $s.itemCode
                n = $s.stockName
                m = "KOSPI"
                p = [int]$s.closePriceRaw
                d = $diff
                cr = [math]::Round($cr, 2)
                v = [long]$s.accumulatedTradingVolumeRaw
                tv = [math]::Round([double]$s.accumulatedTradingValueRaw / 100000000, 1)
            }
        }
    }
}

Write-Host "[2/2] KOSDAQ 실시간 시세 수집 중 (1~8 페이지)..." -ForegroundColor Cyan
for ($p = 1; $p -le 8; $p++) {
    $r = Invoke-RestMethod -Uri "https://m.stock.naver.com/api/stocks/marketValue/KOSDAQ?page=$p&pageSize=100" -Headers $headers
    foreach ($s in $r.stocks) {
        if ($s.stockEndType -eq "stock" -and [int]$s.closePriceRaw -gt 0) {
            $cr = [double]$s.fluctuationsRatio
            $sign = if ($cr -gt 0) { 1 } elseif ($cr -lt 0) { -1 } else { 0 }
            $diff = [math]::Abs([int]$s.compareToPreviousClosePriceRaw) * $sign
            $allStocks += [PSCustomObject]@{
                c = $s.itemCode
                n = $s.stockName
                m = "KOSDAQ"
                p = [int]$s.closePriceRaw
                d = $diff
                cr = [math]::Round($cr, 2)
                v = [long]$s.accumulatedTradingVolumeRaw
                tv = [math]::Round([double]$s.accumulatedTradingValueRaw / 100000000, 1)
            }
        }
    }
}

$json = $allStocks | ConvertTo-Json -Compress
$nowStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$jsContent = "// Auto-generated real KRX stocks snapshot (Naver Finance / KRX live prices)`nwindow.REAL_KRX_SNAPSHOT = $json;`nwindow.REAL_KRX_SNAPSHOT_TIME = `"$nowStr`";`n"
[System.IO.File]::WriteAllText("$PSScriptRoot\krxRealSnapshot.js", $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "완료! 총 $($allStocks.Count)개 KRX 실제 종목 시세가 krxRealSnapshot.js에 반영되었습니다. ($nowStr)" -ForegroundColor Green
