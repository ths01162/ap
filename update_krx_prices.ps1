$ErrorActionPreference = "Stop"
$headers = @{"User-Agent"="Mozilla/5.0"}
$allStocks = @()
$seenCodes = New-Object 'System.Collections.Generic.HashSet[string]'

Write-Host "[1/3] KOSPI 실시간 시세 수집 중 (1~10 페이지)..." -ForegroundColor Cyan
for ($p = 1; $p -le 10; $p++) {
    $r = Invoke-RestMethod -Uri "https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page=$p&pageSize=100" -Headers $headers
    foreach ($s in $r.stocks) {
        if ($s.stockEndType -eq "stock" -and [int]$s.closePriceRaw -gt 0 -and -not $seenCodes.Contains($s.itemCode)) {
            [void]$seenCodes.Add($s.itemCode)
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
                m5 = @()
            }
        }
    }
}

Write-Host "[2/3] KOSDAQ 실시간 시세 수집 중 (1~8 페이지)..." -ForegroundColor Cyan
for ($p = 1; $p -le 8; $p++) {
    $r = Invoke-RestMethod -Uri "https://m.stock.naver.com/api/stocks/marketValue/KOSDAQ?page=$p&pageSize=100" -Headers $headers
    foreach ($s in $r.stocks) {
        if ($s.stockEndType -eq "stock" -and [int]$s.closePriceRaw -gt 0 -and -not $seenCodes.Contains($s.itemCode)) {
            [void]$seenCodes.Add($s.itemCode)
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
                m5 = @()
            }
        }
    }
}

Write-Host "[2.5/3] NXT(넥스트레이드) 상장 종목 실시간 거래대금/거래량 병렬 수집 및 합산 중..." -ForegroundColor Cyan
$chunkSize = 150
for ($i = 0; $i -lt $allStocks.Count; $i += $chunkSize) {
    $end = [math]::Min($i + $chunkSize, $allStocks.Count)
    $chunk = $allStocks[$i..($end - 1)]
    $codeStr = ($chunk | ForEach-Object { $_.c }) -join ','
    try {
        $pRes = Invoke-RestMethod -Uri "https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:$codeStr" -Headers $headers -TimeoutSec 6
        if ($pRes.result.areas[0].datas) {
            $pMap = @{}
            foreach ($d in $pRes.result.areas[0].datas) {
                $pMap[$d.cd] = $d
            }
            foreach ($stk in $chunk) {
                if ($pMap.ContainsKey($stk.c)) {
                    $d = $pMap[$stk.c]
                    $nxt = $d.nxtOverMarketPriceInfo
                    if ($nxt -and $nxt.accumulatedTradingValueRaw -and [double]$nxt.accumulatedTradingValueRaw -gt 0) {
                        $nxtTv = [math]::Round([double]$nxt.accumulatedTradingValueRaw / 100000000, 1)
                        $nxtV = [long]$nxt.accumulatedTradingVolumeRaw
                        $krxTv = $stk.tv
                        $krxV = $stk.v
                        $stk.tv = [math]::Round($krxTv + $nxtTv, 1)
                        $stk.v = $krxV + $nxtV
                        $stk | Add-Member -NotePropertyName "isNxt" -NotePropertyValue $true -Force
                        $stk | Add-Member -NotePropertyName "nxtTv" -NotePropertyValue $nxtTv -Force
                        $stk | Add-Member -NotePropertyName "nxtV" -NotePropertyValue $nxtV -Force
                        $stk | Add-Member -NotePropertyName "krxTv" -NotePropertyValue $krxTv -Force
                        $stk | Add-Member -NotePropertyName "krxV" -NotePropertyValue $krxV -Force
                    }
                }
            }
        }
    } catch {
        # Fallback to KRX alone
    }
}

Write-Host "[3/3] 전 종목($($allStocks.Count)개) 실제 KRX 5분봉 OHLCV 데이터 병렬 수집 중..." -ForegroundColor Cyan
$runspacePool = [runspacefactory]::CreateRunspacePool(1, 35)
$runspacePool.Open()
$jobs = @()

for ($i = 0; $i -lt $allStocks.Count; $i++) {
    $code = $allStocks[$i].c
    $ps = [powershell]::Create().AddScript({
        param($c, $idx)
        try {
            $candles = Invoke-RestMethod -Uri "https://api.stock.naver.com/chart/domestic/item/$c/minute5" -Headers @{"User-Agent"="Mozilla/5.0"} -TimeoutSec 6
            $arr = @()
            if ($candles -and $candles.Count -gt 0) {
                # 당일 날짜(가장 마지막 캔들의 앞 8자리 YYYYMMDD)만 필터링하고 15:30 이전 정규장 캔들만 추출
                $latestDate = $candles[$candles.Count - 1].localDateTime.Substring(0, 8)
                foreach ($bar in $candles) {
                    $dt = [string]$bar.localDateTime
                    if ($dt.StartsWith($latestDate)) {
                        $hhmm = $dt.Substring(8, 4)
                        if ([int]$hhmm -ge 900 -and [int]$hhmm -le 1530) {
                            $timeStr = "$($hhmm.Substring(0,2)):$($hhmm.Substring(2,2))"
                            $arr += ,@($timeStr, [int]$bar.openPrice, [int]$bar.highPrice, [int]$bar.lowPrice, [int]$bar.currentPrice, [long]$bar.accumulatedTradingVolume)
                        }
                    }
                }
            }
            return @{ idx = $idx; m5 = $arr }
        } catch {
            return @{ idx = $idx; m5 = @() }
        }
    }).AddArgument($code).AddArgument($i)
    $ps.RunspacePool = $runspacePool
    $jobs += @{ ps = $ps; handle = $ps.BeginInvoke() }
}

foreach ($j in $jobs) {
    $res = $j.ps.EndInvoke($j.handle)
    if ($res -and $res.m5.Count -gt 0) {
        $allStocks[$res.idx].m5 = $res.m5
    }
    $j.ps.Dispose()
}
$runspacePool.Close()

$json = $allStocks | ConvertTo-Json -Depth 6 -Compress
$nowStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$jsContent = "// Auto-generated real KRX stocks snapshot + real 5-minute OHLCV candles`nwindow.REAL_KRX_SNAPSHOT = $json;`nwindow.REAL_KRX_SNAPSHOT_TIME = `"$nowStr`";`n"
$destPath = Join-Path $PSScriptRoot "krxRealSnapshot.js"
[System.IO.File]::WriteAllText($destPath, $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "완료! 총 $($allStocks.Count)개 KRX 실제 종목 시세 + 실제 5분봉 차트가 krxRealSnapshot.js에 저장되었습니다. ($nowStr)" -ForegroundColor Green
