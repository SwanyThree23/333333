param (
    [string]$HostingerUser = "root",
    [string]$HostingerIP = "seewhylive.com",
    [string]$RemoteDir = "/var/www/seewhylive"
)

$ErrorActionPreference = "Stop"

Write-Host "[DEPLOY] Starting Deployment to Hostinger ($HostingerIP)..." -ForegroundColor Cyan

# 1. Archive the project
$ArchiveName = "deploy-archive.zip"
Write-Host "[PACK] Packaging project files into $ArchiveName..." -ForegroundColor Yellow
if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

# Exclude node_modules, .git, and .next to save bandwidth and time
Compress-Archive -Path "src", "prisma", "server", "package.json", "package-lock.json", "tsconfig.json", "tailwind.config.ts", "postcss.config.js", "next.config.js", "docker-compose.yml", "docker-compose.prod.yml", "Dockerfile", ".env" -DestinationPath $ArchiveName -Force

Write-Host "[REMOTE] Creating remote directory..." -ForegroundColor Yellow
ssh "${HostingerUser}@${HostingerIP}" "mkdir -p ${RemoteDir}"

# 2. Upload to Hostinger via SCP
Write-Host "[UPLOAD] Sending $ArchiveName to ${HostingerUser}@${HostingerIP}..." -ForegroundColor Yellow
scp $ArchiveName "${HostingerUser}@${HostingerIP}:${RemoteDir}/"

# 3. Execute Remote Commands
Write-Host "[SETUP] Extracting and setting up on remote server..." -ForegroundColor Yellow
$RemoteDirVar = $RemoteDir
$RemoteCommand = @'
    cd REMOTE_DIR_PLACEHOLDER
    unzip -o ARCHIVE_NAME_PLACEHOLDER
    rm ARCHIVE_NAME_PLACEHOLDER
    
    # Check if deploying via Docker Compose or native PM2
    if [ -f "docker-compose.yml" ]; then
        echo "Detected docker-compose.yml, spinning up containers..."
        docker compose down
        docker compose build
        docker compose up -d
    else
        echo "Running native npm install..."
        npm ci
        echo "Building the Next.js app..."
        npm run build
        echo "Restarting PM2 processes..."
        pm2 restart all || pm2 start npm --name "seewhylive" -- run dev:all
    fi
    echo "Remote setup complete!"
'@

$RemoteCommand = $RemoteCommand.Replace("REMOTE_DIR_PLACEHOLDER", $RemoteDirVar)
$RemoteCommand = $RemoteCommand.Replace("ARCHIVE_NAME_PLACEHOLDER", $ArchiveName)

# Convert CRLF to LF for bash
$RemoteCommand = $RemoteCommand.Replace("`r`n", "`n")

ssh "${HostingerUser}@${HostingerIP}" $RemoteCommand

# Clean up local archive
Write-Host "[CLEAN] Cleaning up local temporary files..." -ForegroundColor Yellow
Remove-Item $ArchiveName -Force

Write-Host "[SUCCESS] Deployment completed successfully! Application is live at https://seewhylive.com" -ForegroundColor Green
