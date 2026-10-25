$ErrorActionPreference = "Continue"

$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    $found = Get-ChildItem "C:\Program Files\cloudflared", "C:\Program Files (x86)\cloudflared" -Filter "cloudflared.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $cloudflaredPath = $found.FullName }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   KHOI CHAY 3 CLOUDFLARE TUNNELS CHO HE THONG" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Don dep tien trinh cu
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue

$logDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$logFe = Join-Path $logDir "tunnel-frontend.log"
$logBe = Join-Path $logDir "tunnel-backend.log"
$logStorage = Join-Path $logDir "tunnel-storage.log"

Remove-Item $logFe, $logBe, $logStorage -ErrorAction SilentlyContinue

Write-Host "1. Dang ket noi Cloudflare Tunnel cho Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --url http://localhost:3000" -RedirectStandardError $logFe -NoNewWindow

Write-Host "2. Dang ket noi Cloudflare Tunnel cho Backend API (Port 5067)..." -ForegroundColor Yellow
Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --url http://localhost:5067" -RedirectStandardError $logBe -NoNewWindow

Write-Host "3. Dang ket noi Cloudflare Tunnel cho Storage (Port 8888)..." -ForegroundColor Yellow
Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --url http://localhost:8888" -RedirectStandardError $logStorage -NoNewWindow

Write-Host "`nDang doi Cloudflare cap ten mien (khoang 5-8 giay)..." -ForegroundColor DarkGray

function Get-TunnelUrl([string]$logPath) {
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $logPath) {
            $content = Get-Content $logPath -Raw -ErrorAction SilentlyContinue
            if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
                return $matches[0]
            }
        }
    }
    return $null
}

$urlFe = Get-TunnelUrl $logFe
$urlBe = Get-TunnelUrl $logBe
$urlStorage = Get-TunnelUrl $logStorage

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "              CAC DUONG LINK CUA BAN:" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`n[1] FRONTEND (Gui link nay cho ban be mo web):" -ForegroundColor Cyan
Write-Host "    $urlFe" -ForegroundColor White -BackgroundColor DarkGreen

Write-Host "`n[2] BACKEND API:" -ForegroundColor Cyan
Write-Host "    $urlBe/api/v1" -ForegroundColor Yellow

Write-Host "`n[3] STORAGE (SeaweedFS):" -ForegroundColor Cyan
Write-Host "    $urlStorage/buckets/courtbooking" -ForegroundColor Yellow

# Tu dong cap nhat vao frontend/.env
$envPath = Join-Path $PSScriptRoot "frontend\.env"
if ((Test-Path $envPath) -and $urlBe -and $urlStorage) {
    $envLines = Get-Content $envPath
    $newLines = @()
    foreach ($line in $envLines) {
        if ($line -match "^VITE_API_BASE_URL=") {
            $newLines += "VITE_API_BASE_URL=$urlBe/api/v1"
        } elseif ($line -match "^VITE_STORAGE_BASE_URL=") {
            $newLines += "VITE_STORAGE_BASE_URL=$urlStorage/buckets/courtbooking"
        } else {
            $newLines += $line
        }
    }
    Set-Content -Path $envPath -Value $newLines
    Write-Host "`n--> DA TU DONG CAP NHAT 2 LINK VAO frontend/.env THANH CONG!" -ForegroundColor Green
}

# Luu file tom tat ra thu muc goc
$summaryPath = Join-Path $PSScriptRoot "LINKS-CLOUDFLARE.txt"
$lines = @(
    "==========================================================",
    "THONG TIN 3 DUONG LINK CLOUDFLARE TUNNEL (DANG HOAT DONG)",
    "Thoi gian tao: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')",
    "==========================================================",
    "",
    "1. LINK TRANG WEB (Frontend - Chia se cho ban be truy cap):",
    "   $urlFe",
    "",
    "2. LINK BACKEND API (.NET):",
    "   $urlBe/api/v1",
    "",
    "3. LINK STORAGE (SeaweedFS):",
    "   $urlStorage/buckets/courtbooking",
    "",
    "Luu y: De cac link nay hoat dong, hay giu cua so nay dang chay!",
    "=========================================================="
)
Set-Content -Path $summaryPath -Value $lines

Write-Host "`nDa luu thong tin ra file: LINKS-CLOUDFLARE.txt" -ForegroundColor White
Write-Host "Giu cua so nay de duy tri tunnel!" -ForegroundColor Magenta
Write-Host "Nhan Ctrl+C de dung tat ca tunnel..." -ForegroundColor DarkGray

while ($true) {
    Start-Sleep -Seconds 3600
}
