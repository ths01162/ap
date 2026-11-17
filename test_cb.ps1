$r = (Invoke-WebRequest -Uri 'https://api.stock.naver.com/chart/domestic/item/005930/minute5?callback=myCb' -Headers @{'User-Agent'='Mozilla/5.0'}).Content
Write-Host $r.Substring(0, 40)
