# Remove Firebase env vars from Vercel production
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $Root

$envNames = @(
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_STORAGE_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_FIREBASE_STORAGE_PUBLIC_BASE_URL"
)

Write-Host "Removing Firebase env from Vercel production..." -ForegroundColor Yellow
foreach ($name in $envNames) {
    Write-Host "  rm $name" -ForegroundColor DarkGray
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & npx --yes vercel env rm $name production --yes 2>&1 | Out-Null
    $ErrorActionPreference = $prev
}
Write-Host "Done." -ForegroundColor Green
