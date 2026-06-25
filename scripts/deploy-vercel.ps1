# ReadShelf — deploy to Vercel (production)
# Run from project root: npm run deploy:vercel
#
# First time only: the CLI will open a browser login (vercel login).

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $Root

$EnvFile = Join-Path $Root ".env.local"
if (-not (Test-Path $EnvFile)) {
    throw "Missing .env.local. Copy .env.local.example and fill in your keys first."
}

Write-Host ""
Write-Host "=== ReadShelf Vercel Deploy ===" -ForegroundColor Cyan
Write-Host ""

function Get-EnvValue {
    param([string]$Name)
    foreach ($line in Get-Content $EnvFile) {
        if ($line -match "^\s*$Name=(.*)$") {
            return $Matches[1].Trim().Trim('"')
        }
    }
    return $null
}

$required = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

foreach ($name in $required) {
    if (-not (Get-EnvValue $name)) {
        throw "Missing required env var in .env.local: $name"
    }
}

Write-Host "Checking Vercel login..." -ForegroundColor Yellow
& npx --yes vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Log in to Vercel (browser will open)..." -ForegroundColor Yellow
    & npx --yes vercel login
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel login failed."
    }
}

if (-not (Test-Path (Join-Path $Root ".vercel\project.json"))) {
    Write-Host "Linking project to Vercel..." -ForegroundColor Yellow
    & npx --yes vercel link --yes --project readshelf
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating new Vercel project 'readshelf'..." -ForegroundColor Yellow
        & npx --yes vercel deploy --prod --yes --name readshelf 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Could not create or link Vercel project."
        }
    }
}

function Set-VercelEnv {
    param([string]$Name, [string]$Value)
    if (-not $Value) { return }
    Write-Host "  env: $Name" -ForegroundColor DarkGray
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $Value | & npx --yes vercel env add $Name production --force 2>&1 | Out-Null
    $ErrorActionPreference = $prev
}

Write-Host "Syncing environment variables to Vercel..." -ForegroundColor Yellow
$envNames = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_STORAGE_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_FIREBASE_STORAGE_PUBLIC_BASE_URL"
)

foreach ($name in $envNames) {
    Set-VercelEnv -Name $name -Value (Get-EnvValue $name)
}

Write-Host ""
Write-Host "Deploying to production..." -ForegroundColor Yellow
$deployOutput = & npx --yes vercel deploy --prod --yes 2>&1 | Out-String
Write-Host $deployOutput.TrimEnd()

$url = ($deployOutput -split "`n" | Where-Object { $_ -match "https://.*\.vercel\.app" } | Select-Object -Last 1).Trim()
if ($url) {
    Write-Host ""
    Write-Host "Deployed: $url" -ForegroundColor Green
    Write-Host ""
    Write-Host "Supabase (required once):" -ForegroundColor Yellow
    Write-Host "  Authentication -> URL Configuration"
    Write-Host "  Site URL: $url"
    Write-Host "  Redirect URLs: $url/auth/callback"
    Write-Host ""
    Write-Host "Share this link with your friend. She can Sign up and use her own shelf." -ForegroundColor Cyan
}
