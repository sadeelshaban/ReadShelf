# ReadShelf - mostly automated Cloudflare R2 setup (uses Wrangler CLI)
# Run in an interactive terminal: npm run setup:r2:auto
#
# If login fails, run first: npx wrangler login

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$EnvFile = Join-Path $Root ".env.local"
$CorsFile = Join-Path $Root "scripts/r2-cors.json"
$BucketName = "readshelf"

Set-Location $Root

function Invoke-Wrangler {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$WranglerArgs
    )

    if (-not $WranglerArgs -or $WranglerArgs.Count -eq 0) {
        throw "No wrangler arguments provided."
    }

    $raw = & npx --yes wrangler @WranglerArgs 2>&1 | Out-String
    if ($raw.Trim()) { Write-Host $raw.TrimEnd() }

    if ($LASTEXITCODE -ne 0) {
        throw "wrangler $($WranglerArgs -join ' ') failed: $raw"
    }

    if ($raw -match "not authenticated|Not logged in|\[ERROR\]") {
        throw "wrangler $($WranglerArgs -join ' ') failed: $raw"
    }

    return $raw
}

function Test-WranglerAuth {
    $raw = & npx --yes wrangler whoami 2>&1 | Out-String
    if ($raw.Trim()) { Write-Host $raw.TrimEnd() }

    if ($LASTEXITCODE -ne 0) { return $false }
    if ($raw -match "not authenticated|Not logged in") { return $false }
    return $true
}

function Ensure-WranglerLogin {
    if (Test-WranglerAuth) {
        Write-Host "Cloudflare login OK." -ForegroundColor Green
        return
    }

    Write-Host ""
    Write-Host "Cloudflare login required." -ForegroundColor Yellow
    Write-Host "A browser window will open. Sign in and click Allow." -ForegroundColor DarkGray
    Write-Host ""

    & npx --yes wrangler login
    if ($LASTEXITCODE -ne 0) {
        throw "wrangler login failed. Run manually: npx wrangler login"
    }

    if (-not (Test-WranglerAuth)) {
        throw "Still not logged in after wrangler login."
    }

    Write-Host "Cloudflare login OK." -ForegroundColor Green
}

function Set-EnvVar {
    param([string]$Path, [string]$Name, [string]$Value)
    $lines = @()
    if (Test-Path $Path) { $lines = Get-Content $Path }
    $pattern = "^$([regex]::Escape($Name))="
    $filtered = @($lines | Where-Object { $_ -notmatch $pattern })
    $filtered += "$Name=$Value"
    Set-Content -Path $Path -Value $filtered -Encoding utf8
}

Write-Host ""
Write-Host "=== ReadShelf R2 auto setup ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1/3: Cloudflare login" -ForegroundColor Yellow
Ensure-WranglerLogin

Write-Host ""
Write-Host "Step 2/3: Bucket + CORS" -ForegroundColor Yellow
Write-Host "Creating bucket '$BucketName' (skip if it already exists)..." -ForegroundColor DarkGray
try {
    Invoke-Wrangler r2 bucket create $BucketName | Out-Null
} catch {
    $message = $_.Exception.Message
    if ($message -match "10042|enable R2") {
        Write-Host ""
        Write-Host "R2 is not enabled on your Cloudflare account yet." -ForegroundColor Red
        Write-Host "  1. Open: https://dash.cloudflare.com/?to=/:account/r2/overview" -ForegroundColor White
        Write-Host "  2. Click Get started / Enable R2 (payment method may be required)" -ForegroundColor White
        Write-Host "  3. Run again: npm run setup:r2:auto" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    if ($message -match "already exists|AlreadyExists|409") {
        Write-Host "Bucket already exists - continuing." -ForegroundColor DarkGray
    } else {
        throw
    }
}

Write-Host "Setting CORS for browser uploads..." -ForegroundColor DarkGray
Invoke-Wrangler r2 bucket cors set $BucketName --file $CorsFile | Out-Null
Write-Host "Bucket and CORS ready." -ForegroundColor Green

Write-Host ""
Write-Host "Step 3/3: R2 API keys (shown once by Cloudflare)" -ForegroundColor Yellow
Write-Host "  1. Open: https://dash.cloudflare.com/?to=/:account/r2/overview" -ForegroundColor White
Write-Host "  2. Manage R2 API Tokens -> Create API token" -ForegroundColor White
Write-Host "  3. Permission: Object Read & Write, bucket: $BucketName" -ForegroundColor White
Write-Host "  4. Copy Access Key ID + Secret Access Key + Account ID" -ForegroundColor White
Write-Host ""

$whoami = Invoke-Wrangler whoami
if ($whoami -match "Account ID:\s*([a-f0-9]+)") {
    $detectedAccount = $Matches[1]
    Write-Host "Detected Account ID: $detectedAccount" -ForegroundColor DarkGray
    $accountDefault = $detectedAccount
} else {
    $accountDefault = ""
}

$accountId = Read-Host "Paste Account ID [$accountDefault]"
if (-not $accountId.Trim() -and $accountDefault) { $accountId = $accountDefault }
$accessKeyId = Read-Host "Paste Access Key ID"
$secretKey = Read-Host "Paste Secret Access Key" -AsSecureString
$plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
)

if (-not (Test-Path $EnvFile)) {
    New-Item -Path $EnvFile -ItemType File -Force | Out-Null
}

Set-EnvVar -Path $EnvFile -Name "R2_ACCOUNT_ID" -Value $accountId.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_ACCESS_KEY_ID" -Value $accessKeyId.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_SECRET_ACCESS_KEY" -Value $plainSecret.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_BUCKET_NAME" -Value $BucketName
Set-EnvVar -Path $EnvFile -Name "STORAGE_PROVIDER" -Value "r2"

Write-Host ""
Write-Host "Testing R2 connection..." -ForegroundColor Yellow
node (Join-Path $Root "scripts/test-r2.mjs")
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "R2 is ready. Restart: npm run dev" -ForegroundColor Green
Write-Host ""
