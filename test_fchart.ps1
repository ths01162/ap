$headers = @{"User-Agent"="Mozilla/5.0"}
$fc = Invoke-WebRequest -Uri "https://fchart.stock.naver.com/sise.nhn?symbol=005930&timeframe=minute&count=5&requestType=0" -Headers $headers
Write-Host $fc.Content
