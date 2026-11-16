$codes = @('166480', '015860', '261780', '241710', '192440', '003230')
$headers = @{"User-Agent"="Mozilla/5.0"}
$url = "https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:" + ($codes -join ',')
$res = Invoke-RestMethod -Uri $url -Headers $headers
foreach ($d in $res.result.areas[0].datas) {
    $eok = [math]::Round([double]$d.aa / 100000000)
    Write-Host "$($d.nm) ($($d.cd)): nv=$($d.nv), aq=$($d.aq), aa=$($d.aa) -> $eok 억"
}
