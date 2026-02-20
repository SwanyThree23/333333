param (
    [string]$HostingerUser = "root",
    [string]$HostingerIP = "seewhylive.com",
    [string]$RemoteDir = "/var/www/seewhylive"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Deployment to Hostinger ($HostingerIP)..." -ForegroundColor Cyan

# 1. Archive the project
$ArchiveName = "deploy-archive.zip"
Write-Host "📦 Packaging project files into $ArchiveName..." -ForegroundColor Yellow
if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

# Exclude node_modules, .git, and .next to save bandwidth and time
Compress-Archive -Path "src", "public", "prisma", "server", "package.json", "package-lock.json", "tsconfig.json", "tailwind.config.ts", "postcss.config.js", "next.config.js", "docker-compose.yml", "docker-compose.prod.yml", ".env" -DestinationPath $ArchiveName -Force

Write-Host "📂 Creating remote directory if it doesn't exist..." -ForegroundColor Yellow
ssh "${HostingerUser}@${HostingerIP}" "mkdir -p ${RemoteDir}"

# 2. Upload to Hostinger via SCP
Write-Host "☁️ Uploading $ArchiveName to ${HostingerUser}@${HostingerIP}:${RemoteDir}..." -ForegroundColor Yellow
scp $ArchiveName "${HostingerUser}@${HostingerIP}:${RemoteDir}/"

# 3. Execute Remote Commands
Write-Host "🔧 Extracting and setting up on remote server..." -ForegroundColor Yellow
$RemoteCommand = @"
    cd $RemoteDir
    unzip -o $ArchiveName
    rm deploy-archive.zip
    
    # Check if deploying via Docker Compose or native PM2
    if [ -f "docker-compose.yml" ]; then
        echo "🐳 Detected docker-compose.yml, spinning up containers..."
        docker-compose down
        docker-compose build
        docker-compose up -d
    else
        echo "📦 Running native npm install..."
        npm ci
        echo "🔨 Building the Next.js app..."
        npm run build
        echo "🏃 Restarting PM2 processes..."
        pm2 restart all || pm2 start npm --name "seewhylive" -- run dev:all
    fi
    echo "✅ Remote setup complete!"
"@

$RemoteCommand = $RemoteCommand -replace "`r`n", "`n"
ssh "${HostingerUser}@${HostingerIP}" $RemoteCommand

# Clean up local archive
Write-Host "🧹 Cleaning up local temporary files..." -ForegroundColor Yellow
Remove-Item $ArchiveName -Force

Write-Host "🎉 Deployment completed successfully! Application is live at https://seewhylive.com" -ForegroundColor Green
