# Test if database server is reachable at network level

$dbHost = "dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com"
$dbPort = 5432

Write-Host "Testing network connectivity to database..." -ForegroundColor Cyan
Write-Host "Host: $dbHost" -ForegroundColor White
Write-Host "Port: $dbPort" -ForegroundColor White
Write-Host ""

# Test 1: DNS Resolution
Write-Host "1. Testing DNS resolution..." -ForegroundColor Yellow
try {
    $ips = [System.Net.Dns]::GetHostAddresses($dbHost)
    Write-Host "   ✅ DNS resolved to: $($ips -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "   ❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: TCP Connection
Write-Host "`n2. Testing TCP connection to port $dbPort..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect($dbHost, $dbPort, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(5000, $false)

    if ($wait) {
        try {
            $tcpClient.EndConnect($connection)
            Write-Host "   ✅ TCP connection successful!" -ForegroundColor Green
            $tcpClient.Close()
        } catch {
            Write-Host "   ❌ TCP connection failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Connection timeout after 5 seconds" -ForegroundColor Red
        Write-Host "   This means the database is blocking connections or the IP allowlist isn't working" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Connection error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($tcpClient) {
        $tcpClient.Close()
    }
}

# Test 3: Check your public IP
Write-Host "`n3. Checking your public IP address..." -ForegroundColor Yellow
try {
    $myIp = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
    Write-Host "   Your public IP: $myIp" -ForegroundColor White
    Write-Host "   Make sure this IP is in the database allowlist!" -ForegroundColor Yellow
} catch {
    Write-Host "   ⚠️  Could not determine public IP" -ForegroundColor Yellow
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- If DNS works but TCP fails: Database IP allowlist is blocking you" -ForegroundColor White
Write-Host "- If both fail: Network/firewall issue" -ForegroundColor White
Write-Host "- Check Render dashboard that database status is 'Available'" -ForegroundColor White
