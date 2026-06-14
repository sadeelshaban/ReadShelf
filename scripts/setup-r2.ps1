# ReadShelf — Cloudflare R2 setup helper
# Run from project root: npm run setup:r2

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$EnvFile = Join-Path $Root ".env.local"

Set-Location $Root

Write-Host ""
Write-Host "=== ReadShelf — Cloudflare R2 Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "R2 gives ~10 GB free storage for your PDFs and covers." -ForegroundColor DarkGray
Write-Host "Supabase stays for login, database, and sync." -ForegroundColor DarkGray
Write-Host ""

Write-Host "Step 1/4: Cloudflare account" -ForegroundColor Yellow
Write-Host "  1. Open https://dash.cloudflare.com/sign-up (or log in)"
Write-Host "  2. Left menu -> R2 Object Storage"
Write-Host "  3. If asked, add a payment method (R2 free tier still applies)"
Write-Host ""
Read-Host "Press Enter when R2 is open in your browser"

Write-Host ""
Write-Host "Step 2/4: Create bucket" -ForegroundColor Yellow
Write-Host "  1. Click Create bucket"
Write-Host "  2. Name it: readshelf"
Write-Host "  3. Location: Automatic (default is fine)"
Write-Host "  4. Create bucket"
Write-Host ""
Read-Host "Press Enter after the bucket exists"

Write-Host ""
Write-Host "Step 3/4: CORS (required for uploads from the browser)" -ForegroundColor Yellow
Write-Host "  1. Open bucket readshelf -> Settings -> CORS policy"
Write-Host "  2. Paste this JSON and save:"
Write-Host ""
Write-Host @'
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
'@ -ForegroundColor White
Write-Host ""
Write-Host "  Later, add your live site URL too (e.g. https://your-app.vercel.app)"
Write-Host ""
Read-Host "Press Enter after CORS is saved"

Write-Host ""
Write-Host "Step 4/4: API token" -ForegroundColor Yellow
Write-Host "  1. R2 overview -> Manage R2 API Tokens -> Create API token"
Write-Host "  2. Permissions: Object Read & Write"
Write-Host "  3. Specify bucket: readshelf only (recommended)"
Write-Host "  4. Create token and copy:"
Write-Host "     - Access Key ID"
Write-Host "     - Secret Access Key"
Write-Host "  5. Account ID is on the R2 overview page (right sidebar)"
Write-Host ""

$accountId = Read-Host "Paste R2 Account ID"
$accessKeyId = Read-Host "Paste Access Key ID"
$secretKey = Read-Host "Paste Secret Access Key" -AsSecureString
$plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
)
$bucketName = Read-Host "Bucket name [readshelf]"
if (-not $bucketName.Trim()) { $bucketName = "readshelf" }

function Set-EnvVar {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Value
    )

    $lines = @()
    if (Test-Path $Path) {
        $lines = Get-Content $Path
    }

    $pattern = "^$([regex]::Escape($Name))="
    $filtered = @($lines | Where-Object { $_ -notmatch $pattern })
    $filtered += "$Name=$Value"
    Set-Content -Path $Path -Value $filtered -Encoding utf8
}

if (-not (Test-Path $EnvFile)) {
    Write-Host "Creating .env.local from example..." -ForegroundColor Yellow
    Copy-Item (Join-Path $Root ".env.local.example") $EnvFile
}

Set-EnvVar -Path $EnvFile -Name "R2_ACCOUNT_ID" -Value $accountId.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_ACCESS_KEY_ID" -Value $accessKeyId.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_SECRET_ACCESS_KEY" -Value $plainSecret.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_BUCKET_NAME" -Value $bucketName.Trim()

Write-Host ""
Write-Host "Saved R2 settings to .env.local" -ForegroundColor Green
Write-Host "Testing connection..." -ForegroundColor Yellow

node (Join-Path $Root "scripts/test-r2.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Connection test failed. Check your keys and bucket name." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "R2 is ready." -ForegroundColor Green
Write-Host "Restart the dev server (npm run dev), then upload a new PDF from /shelf/add." -ForegroundColor DarkGray
Write-Host ""
