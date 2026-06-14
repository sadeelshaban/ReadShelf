$ErrorActionPreference = "Stop"

$installDir = Join-Path $env:LOCALAPPDATA "Programs\ReadShelf"
$exePath = Join-Path $installDir "ReadShelf.exe"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "ReadShelf.lnk"

if (-not (Test-Path $exePath)) {
  Write-Error "ReadShelf is not installed at $installDir. Run the Setup installer first."
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "ReadShelf — personal PDF reading shelf"
$iconPath = Join-Path $installDir "ReadShelf.exe"
if (Test-Path $iconPath) {
  $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()

Write-Host "Desktop shortcut created:"
Write-Host $shortcutPath
Write-Host "Target:" $exePath
