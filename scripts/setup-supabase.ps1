# ReadShelf — Supabase one-time setup
# Run from project root: npm run setup:supabase

$ErrorActionPreference = "Stop"
$ProjectName = "readshelf"
$Region = "eu-central-1"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

Set-Location $Root

Write-Host ""
Write-Host "=== ReadShelf Supabase Setup ===" -ForegroundColor Cyan
Write-Host ""

function Invoke-SupabaseCli {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$SupabaseArgs
    )

    if (-not $SupabaseArgs -or $SupabaseArgs.Count -eq 0) {
        throw "No Supabase CLI arguments provided."
    }

    $raw = & npx --yes supabase @SupabaseArgs 2>&1 | Out-String
    if ($raw.Trim()) {
        Write-Host $raw.TrimEnd()
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Supabase command failed: supabase $($SupabaseArgs -join ' ')"
    }

    return $raw
}

function Get-SupabaseJsonLine {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$SupabaseArgs
    )

    $cliArgs = @($SupabaseArgs) + @("--output-format", "json")
    $raw = & npx --yes supabase @cliArgs 2>&1 | Out-String

    $jsonLine = ($raw -split "`n" | Where-Object { $_.TrimStart().StartsWith("{") } | Select-Object -Last 1)
    if (-not $jsonLine) {
        if ($LASTEXITCODE -ne 0) {
            throw $raw
        }
        throw "No JSON output from: supabase $($SupabaseArgs -join ' ')"
    }

    return $jsonLine | ConvertFrom-Json
}

function Test-SupabaseLogin {
    try {
        $null = Get-SupabaseJsonLine orgs list
        return $true
    } catch {
        return $false
    }
}

# Step 1: Login
Write-Host "Step 1/5: Supabase login" -ForegroundColor Yellow
if (Test-SupabaseLogin) {
    Write-Host "Already logged in to Supabase CLI."
} else {
    Write-Host "If a browser opens, sign in with your Supabase account."
    Write-Host ""
    Invoke-SupabaseCli login | Out-Null
}

# Step 2: Organization
Write-Host ""
Write-Host "Step 2/5: Finding your organization..." -ForegroundColor Yellow
$orgsResponse = Get-SupabaseJsonLine orgs list
$orgs = @($orgsResponse.organizations)

if ($orgs.Count -eq 0) {
    throw "No Supabase organization found. Finish signup at https://supabase.com first."
}

$org = $orgs[0]
$orgId = $org.id
Write-Host "Using organization: $($org.name) ($orgId)"

# Step 3: Project
Write-Host ""
Write-Host "Step 3/5: Selecting Supabase project..." -ForegroundColor Yellow
$projectsResponse = Get-SupabaseJsonLine projects list
$projects = @($projectsResponse.projects)

$project = $projects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1

if (-not $project -and $projects.Count -gt 0) {
    $project = $projects[0]
    Write-Host "Using existing project: $($project.name)"
}

if (-not $project) {
    $dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Write-Host "Creating new project '$ProjectName'..."
    Invoke-SupabaseCli projects create $ProjectName --org-id $orgId --region $Region --db-password $dbPassword --yes | Out-Null
    Write-Host "Waiting 45s for project to provision..."
    Start-Sleep -Seconds 45
    $projectsResponse = Get-SupabaseJsonLine projects list
    $projects = @($projectsResponse.projects)
    $project = $projects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1
    if (-not $project) {
        throw "Project creation may still be provisioning. Wait 1-2 min and run this script again."
    }
    Write-Host "Database password (save this somewhere safe): $dbPassword"
}

$projectRef = $project.ref
if (-not $projectRef) { $projectRef = $project.id }
Write-Host "Project ref: $projectRef"

# Step 4: .env.local
Write-Host ""
Write-Host "Step 4/5: Writing .env.local..." -ForegroundColor Yellow
$keysResponse = Get-SupabaseJsonLine projects api-keys --project-ref $projectRef
$keys = @($keysResponse.keys)

$anonKey = ($keys | Where-Object { $_.name -eq "anon" -or $_.id -eq "anon" } | Select-Object -First 1).api_key
if (-not $anonKey) {
    $anonKey = ($keys | Where-Object { $_.type -eq "publishable" } | Select-Object -First 1).api_key
}

$url = "https://$projectRef.supabase.co"
if (-not $anonKey) { throw "Could not find anon/publishable API key." }

$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=$url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
"@

Set-Content -Path (Join-Path $Root ".env.local") -Value $envContent -Encoding UTF8
Write-Host "Created .env.local"

# Step 5: Link + migration
Write-Host ""
Write-Host "Step 5/5: Applying database schema..." -ForegroundColor Yellow
Invoke-SupabaseCli link --project-ref $projectRef --yes | Out-Null
Invoke-SupabaseCli db push --yes | Out-Null

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "1. Restart dev server: npm run dev"
Write-Host "2. Open http://localhost:3000/signup"
Write-Host "3. Sign up with your email on the deployed site."
Write-Host "4. Optional: Supabase Dashboard -> Authentication -> Email -> disable Confirm email"
Write-Host ""
