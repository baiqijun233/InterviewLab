$ErrorActionPreference = "Stop"

$connection = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue

if (-not $connection) {
    Write-Host "No backend service is listening on port 8000."
    exit 0
}

$processId = $connection.OwningProcess
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

if (-not $process) {
    Write-Host "Port 8000 reports PID $processId, but the process has already exited."
    exit 0
}

Stop-Process -Id $processId -Force
Write-Host "Stopped backend process on port 8000. PID: $processId"
