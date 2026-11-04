$ErrorActionPreference = "Continue"

$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflaredPath)) {
    $found = Get-ChildItem "C:\Program Files\cloudflared", "C:\Program Files (x86)\cloudflared" -Filter "cloudflared.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $cloudflaredPath = $found.FullName }
}

$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
$ngrokPath = if ($ngrokCmd) { $ngrokCmd.Source } else { "ngrok" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   KHOI CHAY HE THONG TUNNELS CHO DU AN COURTS BOOKING" -ForegroundColor Cyan
Write-Host "   -> Frontend : NGROK (URL co dinh)" -ForegroundColor Green
Write-Host "   -> Backend  : CLOUDFLARE TUNNEL" -ForegroundColor Yellow
Write-Host "   -> Storage  : CLOUDFLARE TUNNEL" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Don dep tien trinh cu
Stop-Process -Name cloudflared, ngrok -Force -ErrorAction SilentlyContinue

$logDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$logFe = Join-Path $logDir "tunnel-frontend-ngrok.log"
$logBe = Join-Path $logDir "tunnel-backend.log"
$logStorage = Join-Path $logDir "tunnel-storage.log"

Remove-Item $logFe, $logBe, $logStorage -ErrorAction SilentlyContinue

# 1. Ham khoi tao Ngrok Tunnel cho Frontend (Port 3000)
function Start-NgrokTunnel([int]$port, [string]$logPath) {
    Write-Host "Dang khoi chay Ngrok Tunnel cho Frontend (Port $port)..." -ForegroundColor Yellow
    Remove-Item $logPath -ErrorAction SilentlyContinue
    
    $proc = Start-Process -FilePath $ngrokPath -ArgumentList "http $port --log=stdout" -RedirectStandardOutput $logPath -PassThru -NoNewWindow
    
    # Cho toi da 15 giay de lay link tu local API ngrok (http://127.0.0.1:4040)
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $tunnelsResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($tunnelsResponse -and $tunnelsResponse.tunnels) {
                $httpsTunnel = $tunnelsResponse.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
                $url = if ($httpsTunnel) { $httpsTunnel.public_url } else { $tunnelsResponse.tunnels[0].public_url }
                if ($url) {
                    Write-Host "  -> Frontend (Ngrok): Thanh cong!" -ForegroundColor Green
                    return $url
                }
            }
        } catch {
            # Dang cho ngrok api san sang
        }
        
        if ($proc.HasExited) {
            Write-Host "  [!] Ngrok process da thoat som. Kiem tra file log: $logPath" -ForegroundColor Red
            break
        }
    }
    return $null
}

# 2. Ham khoi tao Cloudflare Tunnel cho Backend va Storage
function Start-CloudflareTunnel([string]$name, [string]$targetUrl, [string]$logPath) {
    Write-Host "Dang ket noi Cloudflare Tunnel cho $name..." -ForegroundColor Yellow
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Remove-Item $logPath -ErrorAction SilentlyContinue
        $proc = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel --url $targetUrl" -RedirectStandardError $logPath -PassThru -NoNewWindow
        
        # Cho toi da 15 giay de lay link (bo qua api.trycloudflare.com)
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 1
            if (Test-Path $logPath) {
                $content = Get-Content $logPath -Raw -ErrorAction SilentlyContinue
                if ($content -match "https://([a-zA-Z0-9-]+)\.trycloudflare\.com" -and $matches[1] -ne "api") {
                    Write-Host "  -> ${name}: Thanh cong!" -ForegroundColor Green
                    return $matches[0]
                }
            }
            if ($proc.HasExited) {
                break
            }
        }
        
        if ($attempt -lt 3) {
            Write-Host "  [!] Ket noi $name chua duoc phan giai, dang thu lai (lan $($attempt + 1))..." -ForegroundColor DarkYellow
            if (-not $proc.HasExited) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
        }
    }
    return $null
}

# Khoi dong tuan tu
$urlFe = Start-NgrokTunnel 3000 $logFe
Start-Sleep -Seconds 1
$urlBe = Start-CloudflareTunnel "2. Backend API (Port 5067)" "http://127.0.0.1:5067" $logBe
Start-Sleep -Seconds 1
$urlStorage = Start-CloudflareTunnel "3. Storage SeaweedFS (Port 8888)" "http://127.0.0.1:8888" $logStorage

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "              CAC DUONG LINK CUA BAN:" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

if ($urlFe) {
    Write-Host "`n[1] FRONTEND (Ngrok - URL Co Dinh - Gui cho ban be mo web):" -ForegroundColor Cyan
    Write-Host "    $urlFe" -ForegroundColor White -BackgroundColor DarkGreen
} else {
    Write-Host "`n[1] FRONTEND (Ngrok): [LOI KHOI TAO - KIEM TRA LAI LOGS]" -ForegroundColor Red
}

if ($urlBe) {
    Write-Host "`n[2] BACKEND API (Cloudflare):" -ForegroundColor Cyan
    Write-Host "    $urlBe/api/v1" -ForegroundColor Yellow
} else {
    Write-Host "`n[2] BACKEND API (Cloudflare): [LOI KHOI TAO - KIEM TRA LAI LOGS]" -ForegroundColor Red
}

if ($urlStorage) {
    Write-Host "`n[3] STORAGE (SeaweedFS - Cloudflare):" -ForegroundColor Cyan
    Write-Host "    $urlStorage/buckets/courtbooking" -ForegroundColor Yellow
} else {
    Write-Host "`n[3] STORAGE (Cloudflare): [LOI KHOI TAO - KIEM TRA LAI LOGS]" -ForegroundColor Red
}

# Tu dong cap nhat vao frontend/.env neu backend va storage co link hop le
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
    Write-Host "`n--> DA TU DONG CAP NHAT 2 LINK BACKEND & STORAGE VAO frontend/.env THANH CONG!" -ForegroundColor Green
}

# Luu file tom tat ra thu muc goc
$summaryPath = Join-Path $PSScriptRoot "LINKS-CLOUDFLARE.txt"
$lines = @(
    "==========================================================",
    "THONG TIN CAC DUONG LINK TUNNELS (DANG HOAT DONG)",
    "Thoi gian tao: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')",
    "==========================================================",
    "",
    "1. LINK TRANG WEB (Frontend - Ngrok URL Co Dinh):",
    "   $(if ($urlFe) { $urlFe } else { '[LOI]' })",
    "",
    "2. LINK BACKEND API (.NET - Cloudflare):",
    "   $(if ($urlBe) { "$urlBe/api/v1" } else { '[LOI]' })",
    "",
    "3. LINK STORAGE (SeaweedFS - Cloudflare):",
    "   $(if ($urlStorage) { "$urlStorage/buckets/courtbooking" } else { '[LOI]' })",
    "",
    "Luu y: De cac link nay hoat dong, hay giu cua so nay dang chay!",
    "=========================================================="
)
Set-Content -Path $summaryPath -Value $lines

Write-Host "`nDa luu thong tin ra file: LINKS-CLOUDFLARE.txt" -ForegroundColor White
Write-Host "Giu cua so nay de duy tri tunnel!" -ForegroundColor Magenta
Write-Host "Nhan Ctrl+C de dung tat ca tunnel..." -ForegroundColor DarkGray

try {
    while ($true) {
        Start-Sleep -Seconds 3600
    }
} finally {
    Stop-Process -Name cloudflared, ngrok -Force -ErrorAction SilentlyContinue
}
