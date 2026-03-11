

param(
  [switch]$UseCi
)

# Run from repository root. This script starts npm install/ci in a detached cmd process
# and tails install.log so you can monitor progress without keeping the initiating shell open.

$repo = Split-Path -Path $PSScriptRoot -Parent
Set-Location $repo

$log = Join-Path $repo 'install.log'
if ($UseCi) {
  $cmd = 'npm ci --prefer-offline --no-audit --no-fund --no-optional > "' + $log + '" 2>&1'
} else {
  $cmd = 'npm install --no-audit --no-fund --no-optional > "' + $log + '" 2>&1'
}

Write-Output "Starting detached install (UseCi=$UseCi). Log: $log"
Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $cmd" -WindowStyle Hidden

# Wait for the log file to appear and tail it
Write-Output 'Waiting for install log...'
while (-not (Test-Path $log)) { Start-Sleep -Seconds 1 }
Write-Output 'Tailing install.log (press Ctrl+C to stop)'
Get-Content $log -Tail 50 -Wait
