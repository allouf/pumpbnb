# Test database connection with different SSL modes

$baseUrl = "postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb"

Write-Host "Testing database connections with different SSL modes..." -ForegroundColor Cyan

# Test 1: With sslmode=require
Write-Host "`n1. Testing with sslmode=require..." -ForegroundColor Yellow
$env:DATABASE_URL = "$baseUrl`?sslmode=require"
node test-db-connection.js

# Test 2: With sslmode=no-verify
Write-Host "`n2. Testing with sslmode=no-verify..." -ForegroundColor Yellow
$env:DATABASE_URL = "$baseUrl`?sslmode=no-verify"
node test-db-connection.js

# Test 3: Plain connection
Write-Host "`n3. Testing plain connection..." -ForegroundColor Yellow
$env:DATABASE_URL = $baseUrl
node test-db-connection.js

# Test 4: With ssl=true
Write-Host "`n4. Testing with ssl=true..." -ForegroundColor Yellow
$env:DATABASE_URL = "$baseUrl`?ssl=true"
node test-db-connection.js

Write-Host "`nAll tests complete!" -ForegroundColor Cyan
