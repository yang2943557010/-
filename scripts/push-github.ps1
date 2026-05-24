# Push to GitHub: .\scripts\push-github.ps1

Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$ghDir = "C:\Program Files\GitHub CLI"
if ((Test-Path "$ghDir\gh.exe") -and ($env:Path -notlike "*$ghDir*")) {
  $env:Path = "$ghDir;$env:Path"
}

function Get-GhExe {
  if (Test-Path "$ghDir\gh.exe") { return "$ghDir\gh.exe" }
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Show-TokenHelp {
  param([string]$User, [string]$Repo)
  Write-Host ""
  Write-Host "Manual steps:" -ForegroundColor Cyan
  Write-Host "  1. https://github.com/settings/tokens  (classic, repo)"
  Write-Host "  2. git push -u github main"
  Write-Host "     user: $User"
  Write-Host "     pass: paste TOKEN"
  Write-Host "  Repo: https://github.com/$User/$Repo"
  Write-Host ""
}

$repoName = (Get-Content (Join-Path $PSScriptRoot "repo-name.txt") -Raw -Encoding UTF8).Trim()
$user = "yang2943557010"
$httpsUrl = "https://github.com/$user/$repoName.git"

if (git remote get-url github 2>$null) {
  git remote set-url github $httpsUrl
} else {
  git remote add github $httpsUrl
}

Write-Host "Remote: $httpsUrl"
Write-Host "Pushing branch main ..."

git push -u github main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "OK: https://github.com/$user/$repoName" -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "Push failed (code $LASTEXITCODE)." -ForegroundColor Red
$gh = Get-GhExe
if ($gh) {
  & $gh auth status 2>&1
  Write-Host "Login:  `$t='TOKEN'; `$t | & '$gh' auth login --with-token" -ForegroundColor Yellow
}
Show-TokenHelp -User $user -Repo $repoName
exit $LASTEXITCODE
