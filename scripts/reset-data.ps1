# Wipe all ReadShelf content on the linked Supabase project.
# Keeps your login account. Re-creates storage buckets if needed.
# Run from project root: npm run reset:data

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $Root

Write-Host ""
Write-Host "=== ReadShelf data reset ===" -ForegroundColor Cyan
Write-Host "This removes all books, highlights, notes, PDFs, and covers." -ForegroundColor Yellow
Write-Host ""

function Invoke-Supabase {
    param([string[]]$Args)
    $raw = & npx --yes supabase @Args 2>&1 | Out-String
    if ($raw.Trim()) { Write-Host $raw.TrimEnd() }
    if ($LASTEXITCODE -ne 0) { throw "Failed: supabase $($Args -join ' ')" }
    return $raw
}

function Clear-StorageBucket {
    param([string]$Bucket)

    $listing = Invoke-Supabase @("--experimental", "storage", "ls", "-r", "ss:///$Bucket", "--linked")
    $paths = @(
        $listing -split "`n" |
            ForEach-Object { $_.Trim() } |
            Where-Object {
                $_ -and
                $_ -notmatch '^Initialising login role' -and
                $_ -notmatch '^npm warn' -and
                $_ -notlike "$Bucket/" -and
                $_ -notlike "/$Bucket/" -and
                $_ -notmatch '/$'
            }
    )

    foreach ($path in $paths) {
        $normalized = $path.TrimStart("/")
        if ($normalized -like "$Bucket/*") {
            $objectPath = $normalized.Substring($Bucket.Length + 1)
        } else {
            $objectPath = $normalized
        }

        if (-not $objectPath) { continue }

        Write-Host "Removing ss:///$Bucket/$objectPath" -ForegroundColor DarkGray
        Invoke-Supabase @(
            "--experimental", "storage", "rm",
            "ss:///$Bucket/$objectPath",
            "--linked", "--yes"
        ) | Out-Null
    }
}

Write-Host "Clearing database tables..." -ForegroundColor Yellow
Invoke-Supabase @("db", "query", "--linked", "-f", "scripts/reset-all-data.sql") | Out-Null

Write-Host "Clearing PDF storage..." -ForegroundColor Yellow
Clear-StorageBucket -Bucket "book-pdfs"

Write-Host "Clearing cover storage..." -ForegroundColor Yellow
Clear-StorageBucket -Bucket "book-covers"

Write-Host "Ensuring storage buckets exist..." -ForegroundColor Yellow
Invoke-Supabase @("db", "query", "--linked", "-f", "scripts/ensure-storage-buckets.sql") | Out-Null

Write-Host ""
Write-Host "Done. Your account is still active — log in and upload fresh books." -ForegroundColor Green
Write-Host "Tip: clear browser localStorage for ReadShelf highlight color prefs if needed." -ForegroundColor DarkGray
Write-Host ""
