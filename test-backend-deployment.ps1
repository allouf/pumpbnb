# Backend Deployment Verification Script (PowerShell)
# Run this after Render deployment completes

$BACKEND_URL = "https://pumpbnb-backend.onrender.com"

Write-Host "🔍 Testing Backend Deployment..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Health Check:" -ForegroundColor Yellow
Write-Host "   GET $BACKEND_URL/health"
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "   Response: $($health | ConvertTo-Json -Compress)"
    if ($health.status -eq "ok") {
        Write-Host "   ✅ PASSED" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Tokens API (Previously Failing)
Write-Host "2️⃣ Tokens API (previously failing with filter error):" -ForegroundColor Yellow
Write-Host "   GET $BACKEND_URL/api/tokens"
try {
    $tokens = Invoke-RestMethod -Uri "$BACKEND_URL/api/tokens" -Method Get
    Write-Host "   Response: $($tokens | ConvertTo-Json -Compress)"
    if ($tokens.success -eq $true) {
        Write-Host "   ✅ PASSED - No more filter errors!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAILED - Still getting errors" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Trending Tokens
Write-Host "3️⃣ Trending Tokens API:" -ForegroundColor Yellow
Write-Host "   GET $BACKEND_URL/api/tokens/trending"
try {
    $trending = Invoke-RestMethod -Uri "$BACKEND_URL/api/tokens/trending" -Method Get
    Write-Host "   Response: $($trending | ConvertTo-Json -Compress)"
    if ($trending.success -eq $true) {
        Write-Host "   ✅ PASSED" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Recent Tokens
Write-Host "4️⃣ Recent Tokens API:" -ForegroundColor Yellow
Write-Host "   GET $BACKEND_URL/api/tokens/recent"
try {
    $recent = Invoke-RestMethod -Uri "$BACKEND_URL/api/tokens/recent" -Method Get
    Write-Host "   Response: $($recent | ConvertTo-Json -Compress)"
    if ($recent.success -eq $true) {
        Write-Host "   ✅ PASSED" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All Critical Tests Completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check Render logs for 'Started polling for new events'"
Write-Host "   2. Test frontend at: https://pumpbnb-frontend.onrender.com/tokens"
Write-Host "   3. Create a test token to verify indexing works"
Write-Host ""
