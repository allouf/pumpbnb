# BNB PumpFun - Local Development Environment Setup
param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Clean
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Header
Write-ColorOutput "`n================================================" "Cyan"
Write-ColorOutput "      BNB PUMPFUN - LOCAL DEVELOPMENT" "Cyan"
Write-ColorOutput "================================================" "Cyan"

# Get script directory - FIXED PATH HANDLING
if ($MyInvocation.MyCommand.Path) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $ScriptDir = $PWD.Path
}

# Check if we're in the right directory
if (-not (Test-Path "$ScriptDir\backend") -or -not (Test-Path "$ScriptDir\frontend")) {
    Write-ColorOutput "ERROR: Please run this script from the project root directory" "Red"
    Write-ColorOutput "Current directory: $ScriptDir" "Yellow"
    exit 1
}

Write-ColorOutput "Project root: $ScriptDir" "Gray"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if clean start requested
if ($Clean) {
    Write-ColorOutput "`nCleaning development environment..." "Yellow"
    
    # Clean backend
    if (Test-Path "$ScriptDir\backend\node_modules") {
        Write-ColorOutput "  - Removing backend node_modules..." "Gray"
        Remove-Item "$ScriptDir\backend\node_modules" -Recurse -Force
    }
    
    # Clean frontend
    if (Test-Path "$ScriptDir\frontend\node_modules") {
        Write-ColorOutput "  - Removing frontend node_modules..." "Gray"
        Remove-Item "$ScriptDir\frontend\node_modules" -Recurse -Force
    }
    
    # Clean build artifacts
    if (Test-Path "$ScriptDir\frontend\.next") {
        Write-ColorOutput "  - Removing frontend build cache..." "Gray"
        Remove-Item "$ScriptDir\frontend\.next" -Recurse -Force
    }
    
    if (Test-Path "$ScriptDir\backend\dist") {
        Write-ColorOutput "  - Removing backend build cache..." "Gray"
        Remove-Item "$ScriptDir\backend\dist" -Recurse -Force
    }
    
    Write-ColorOutput "Clean completed!" "Green"
}

# Install dependencies function
function Install-Dependencies {
    param([string]$Path, [string]$Name)
    
    if (-not (Test-Path "$Path\node_modules")) {
        Write-ColorOutput "`nInstalling $Name dependencies..." "Yellow"
        Set-Location $Path
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to install $Name dependencies!" "Red"
            exit 1
        }
        Write-ColorOutput "$Name dependencies installed!" "Green"
    } else {
        Write-ColorOutput "`n$Name dependencies already installed" "Green"
    }
}

# Check and install dependencies
if (-not $FrontendOnly) {
    Install-Dependencies "$ScriptDir\backend" "Backend"
}

if (-not $BackendOnly) {
    Install-Dependencies "$ScriptDir\frontend" "Frontend"
}

# Environment check
Write-ColorOutput "`nEnvironment Configuration:" "Magenta"

# Check backend .env
if (Test-Path "$ScriptDir\backend\.env") {
    $backendEnv = Get-Content "$ScriptDir\backend\.env" | Where-Object { $_ -match "DATABASE_URL=" }
    if ($backendEnv -match "render\.com") {
        Write-ColorOutput "  Backend: Connected to LIVE database (Render)" "Green"
    } else {
        Write-ColorOutput "  Backend: Using local database" "Yellow"
    }
} else {
    Write-ColorOutput "  Backend .env file missing!" "Red"
    exit 1
}

# Check frontend .env.local
if (Test-Path "$ScriptDir\frontend\.env.local") {
    $frontendEnv = Get-Content "$ScriptDir\frontend\.env.local" | Where-Object { $_ -match "NEXT_PUBLIC_API_URL=" }
    if ($frontendEnv -match "localhost:3001") {
        Write-ColorOutput "  Frontend: Configured for local backend" "Green"
    } else {
        Write-ColorOutput "  Frontend: Using production backend" "Yellow"
    }
} else {
    Write-ColorOutput "  Frontend .env.local file missing!" "Red"
    exit 1
}

# Function to start a service
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [string]$Color
    )
    
    Write-ColorOutput "`nStarting $Name..." $Color
    Write-ColorOutput "   Path: $Path" "Gray"
    Write-ColorOutput "   Command: $Command" "Gray"
    
    $job = Start-Job -ScriptBlock {
        param($path, $cmd)
        Set-Location $path
        Invoke-Expression $cmd
    } -ArgumentList $Path, $Command -Name $Name
    
    return $job
}

# Start services based on parameters
$jobs = @()

if (-not $FrontendOnly) {
    # Start Backend
    $backendJob = Start-Service "Backend API" "$ScriptDir\backend" "npm run dev" "Blue"
    $jobs += $backendJob
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
}

if (-not $BackendOnly) {
    # Start Frontend
    $frontendJob = Start-Service "Frontend" "$ScriptDir\frontend" "npm run dev" "Green"
    $jobs += $frontendJob
}

# Display running services
Write-ColorOutput "`nServices Status:" "Cyan"
foreach ($job in $jobs) {
    Write-ColorOutput "  $($job.Name): Running (Job ID: $($job.Id))" "White"
}

# Service URLs
Write-ColorOutput "`nApplication URLs:" "Magenta"
if (-not $BackendOnly) {
    Write-ColorOutput "  Frontend:  http://localhost:3000" "Green"
}
if (-not $FrontendOnly) {
    Write-ColorOutput "  Backend:   http://localhost:3001" "Blue"
    Write-ColorOutput "  API Health: http://localhost:3001/api/health" "Blue"
}

# Control instructions
Write-ColorOutput "`nDevelopment Controls:" "Yellow"
Write-ColorOutput "  Press [Ctrl+C] to stop all services" "White"
Write-ColorOutput "  Backend logs: Receive-Job -Id $($jobs[0].Id) -Keep" "Gray"
if ($jobs.Count -gt 1) {
    Write-ColorOutput "  Frontend logs: Receive-Job -Id $($jobs[1].Id) -Keep" "Gray"
}

Write-ColorOutput "`nLocal development environment is ready!" "Green"
Write-ColorOutput "================================================" "Cyan"

# Monitor jobs
try {
    while ($true) {
        $runningJobs = $jobs | Where-Object { $_.State -eq "Running" }
        
        if ($runningJobs.Count -eq 0) {
            Write-ColorOutput "`nAll services have stopped!" "Red"
            break
        }
        
        # Check for any job output (optional - can be removed if too verbose)
        foreach ($job in $runningJobs) {
            $output = Receive-Job -Id $job.Id -Keep
            if ($output) {
                Write-ColorOutput "[$($job.Name)] $output" "Gray"
            }
        }
        
        Start-Sleep -Seconds 2
    }
} catch {
    Write-ColorOutput "`nStopping all services..." "Yellow"
} finally {
    # Clean up jobs
    foreach ($job in $jobs) {
        if ($job.State -eq "Running") {
            Stop-Job -Id $job.Id
            Remove-Job -Id $job.Id -Force
        }
    }
    Write-ColorOutput "All services stopped!" "Green"
}