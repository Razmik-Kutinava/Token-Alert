# Alert Engine Management Script for Windows PowerShell
# ===================================================

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "test", "help")]
    [string]$Command = "help"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BinaryPath = Join-Path $ProjectDir "bin\alert_engine.exe"
$ConfigPath = Join-Path $ProjectDir "config\alert_engine.conf"
$LogDir = Join-Path $ProjectDir "logs"
$DataDir = Join-Path $ProjectDir "data"
$PidFile = Join-Path $ProjectDir "alert_engine.pid"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Colors.Blue
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Success-Log {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

# Check if Alert Engine is running
function Test-EngineRunning {
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            return $true
        } else {
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    return $false
}

# Check dependencies
function Test-Dependencies {
    Write-Log "Checking dependencies..."
    
    $deps = @("curl", "sqlite3")
    $missingDeps = @()
    
    foreach ($dep in $deps) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Error-Log "Missing dependencies: $($missingDeps -join ', ')"
        Write-Host "Please install missing dependencies and try again."
        exit 1
    }
    
    Write-Success-Log "All dependencies found"
}

# Create required directories
function Initialize-Directories {
    Write-Log "Setting up directories..."
    
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    if (-not (Test-Path $DataDir)) {
        New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    }
    
    Write-Success-Log "Directories created"
}

# Build the project if binary doesn't exist
function Invoke-ProjectBuild {
    if (-not (Test-Path $BinaryPath)) {
        Write-Log "Binary not found. Building project..."
        
        Set-Location $ProjectDir
        
        # Check if make is available (MinGW/MSYS2)
        if (Get-Command make -ErrorAction SilentlyContinue) {
            $result = & make 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success-Log "Build completed successfully"
            } else {
                Write-Error-Log "Build failed"
                Write-Host $result
                exit 1
            }
        } else {
            Write-Error-Log "Make command not found. Please install MinGW/MSYS2 or build manually."
            exit 1
        }
    } else {
        Write-Log "Binary found at $BinaryPath"
    }
}

# Start Alert Engine
function Start-Engine {
    if (Test-EngineRunning) {
        $engineProcessId = Get-Content $PidFile
        Write-Warning-Log "Alert Engine is already running (PID: $engineProcessId)"
        return
    }
    
    Write-Log "Starting Alert Engine..."
    
    # Ensure directories exist
    Initialize-Directories
    
    # Build if necessary
    Invoke-ProjectBuild
    
    # Start the engine
    Set-Location $ProjectDir
    $startupLog = Join-Path $LogDir "startup.log"
    
    $process = Start-Process -FilePath $BinaryPath -ArgumentList "-c", $ConfigPath -NoNewWindow -PassThru -RedirectStandardOutput $startupLog -RedirectStandardError $startupLog
    
    # Save PID
    $process.Id | Out-File $PidFile -Encoding ASCII
    
    # Wait a moment and check if it's still running
    Start-Sleep 2
    if (-not $process.HasExited) {
        Write-Success-Log "Alert Engine started successfully (PID: $($process.Id))"
        Write-Log "HTTP API: http://localhost:8080"
        Write-Log "WebSocket: ws://localhost:8081"
        Write-Log "Logs: $(Join-Path $LogDir 'alert_engine.log')"
    } else {
        Write-Error-Log "Alert Engine failed to start"
        if (Test-Path $startupLog) {
            Write-Host "Startup log:"
            Get-Content $startupLog
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

# Stop Alert Engine
function Stop-Engine {
    if (-not (Test-EngineRunning)) {
        Write-Warning-Log "Alert Engine is not running"
        return
    }
    
    $engineProcessId = Get-Content $PidFile
    Write-Log "Stopping Alert Engine (PID: $engineProcessId)..."
    
    try {
        $process = Get-Process -Id $engineProcessId -ErrorAction Stop
        $process.Kill()
        $process.WaitForExit(30000)  # Wait up to 30 seconds
        
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        Write-Success-Log "Alert Engine stopped"
    } catch {
        Write-Error-Log "Failed to stop Alert Engine: $($_.Exception.Message)"
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

# Restart Alert Engine
function Restart-Engine {
    Write-Log "Restarting Alert Engine..."
    Stop-Engine
    Start-Sleep 2
    Start-Engine
}

# Show status
function Show-Status {
    if (Test-EngineRunning) {
        $engineProcessId = Get-Content $PidFile
        Write-Success-Log "Alert Engine is running (PID: $engineProcessId)"
        
        # Check if ports are listening
        try {
            $netstat = netstat -an | Select-String ":808[01]"
            if ($netstat) {
                Write-Host ""
                Write-Host "Listening ports:"
                $netstat | ForEach-Object { Write-Host $_.Line }
            }
        } catch {
            # netstat might not be available
        }
        
        # Show recent logs
        $logFile = Join-Path $LogDir "alert_engine.log"
        if (Test-Path $logFile) {
            Write-Host ""
            Write-Host "Recent logs:"
            Get-Content $logFile -Tail 10
        }
    } else {
        Write-Warning-Log "Alert Engine is not running"
    }
}

# Show logs
function Show-Logs {
    $logFile = Join-Path $LogDir "alert_engine.log"
    if (Test-Path $logFile) {
        Get-Content $logFile -Wait -Tail 10
    } else {
        Write-Error-Log "Log file not found: $logFile"
        exit 1
    }
}

# Test API endpoints
function Test-API {
    Write-Log "Testing API endpoints..."
    
    if (-not (Test-EngineRunning)) {
        Write-Error-Log "Alert Engine is not running"
        exit 1
    }
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success-Log "Health endpoint: OK"
        } else {
            Write-Error-Log "Health endpoint: HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Error-Log "Health endpoint: FAILED"
    }
    
    # Test alerts endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/alerts" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success-Log "Alerts endpoint: OK"
        } else {
            Write-Error-Log "Alerts endpoint: HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Error-Log "Alerts endpoint: FAILED"
    }
    
    # Test market data endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/market-data" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success-Log "Market data endpoint: OK"
        } else {
            Write-Warning-Log "Market data endpoint: HTTP $($response.StatusCode) (may be normal if no data yet)"
        }
    } catch {
        Write-Warning-Log "Market data endpoint: FAILED (may be normal if no data yet)"
    }
}

# Show help
function Show-Help {
    Write-Host "Alert Engine Management Script for Windows" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "Usage: .\alert_engine.ps1 [COMMAND]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor $Colors.White
    Write-Host "  start     Start the Alert Engine" -ForegroundColor $Colors.Green
    Write-Host "  stop      Stop the Alert Engine" -ForegroundColor $Colors.Green
    Write-Host "  restart   Restart the Alert Engine" -ForegroundColor $Colors.Green
    Write-Host "  status    Show current status" -ForegroundColor $Colors.Green
    Write-Host "  logs      Show live logs" -ForegroundColor $Colors.Green
    Write-Host "  test      Test API endpoints" -ForegroundColor $Colors.Green
    Write-Host "  help      Show this help message" -ForegroundColor $Colors.Green
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\alert_engine.ps1 start        # Start the engine" -ForegroundColor $Colors.Yellow
    Write-Host "  .\alert_engine.ps1 logs         # Follow logs in real-time" -ForegroundColor $Colors.Yellow
    Write-Host "  .\alert_engine.ps1 test         # Test if API is working" -ForegroundColor $Colors.Yellow
}

# Main command handling
switch ($Command) {
    "start" {
        Test-Dependencies
        Start-Engine
    }
    "stop" {
        Stop-Engine
    }
    "restart" {
        Test-Dependencies
        Restart-Engine
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "test" {
        Test-API
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error-Log "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}