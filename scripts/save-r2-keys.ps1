# Save R2 API keys to .env.local and test the connection.
# Run: npm run save:r2-keys

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$EnvFile = Join-Path $Root ".env.local"
$AccountId = "a94399fb61e383048e9aaaeed235dec5"
$BucketName = "readshelf"

Set-Location $Root

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
Write-Host "=== Save R2 keys ===" -ForegroundColor Cyan
Write-Host "Account ID (pre-filled): $AccountId" -ForegroundColor DarkGray
Write-Host ""

$accessKeyId = Read-Host "Paste Access Key ID"
$secretKey = Read-Host "Paste Secret Access Key" -AsSecureString
$plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
)

if (-not (Test-Path $EnvFile)) {
    New-Item -Path $EnvFile -ItemType File -Force | Out-Null
}

Set-EnvVar -Path $EnvFile -Name "R2_ACCOUNT_ID" -Value $AccountId
Set-EnvVar -Path $EnvFile -Name "R2_ACCESS_KEY_ID" -Value $accessKeyId.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_SECRET_ACCESS_KEY" -Value $plainSecret.Trim()
Set-EnvVar -Path $EnvFile -Name "R2_BUCKET_NAME" -Value $BucketName

Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow
node (Join-Path $Root "scripts/test-r2.mjs")
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done. Restart: npm run dev" -ForegroundColor Green
Write-Host ""
