$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
$workingDirectory = $PSScriptRoot
$stdoutLog = Join-Path $projectRoot "07_Logs\2026-06-25-backend-local-mock.out.log"
$stderrLog = Join-Path $projectRoot "07_Logs\2026-06-25-backend-local-mock.err.log"

if (-not (Test-Path $pythonPath)) {
    throw "Missing project virtual environment: $pythonPath"
}

$existingConnection = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existingConnection) {
    Write-Host "Port 8000 is already in use. PID: $($existingConnection.OwningProcess)"
    exit 0
}

$process = Start-Process `
    -FilePath $pythonPath `
    -ArgumentList "-m", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory $workingDirectory `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -WindowStyle Hidden `
    -PassThru

Start-Sleep -Seconds 4

$healthCheck = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/health" -TimeoutSec 5
Write-Host "Backend started. PID: $($process.Id)"
Write-Host "Health check: $($healthCheck.Content)"
