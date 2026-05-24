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

$user = "yang2943557010"
# GitHub 上当前仓库 slug 为 "-"（创建时中文名编码异常），代码已可正常推送
$repoSlug = "-"
$repoName = (Get-Content (Join-Path $PSScriptRoot "repo-name.txt") -Raw -Encoding UTF8).Trim()
$httpsUrl = "https://github.com/$user/$repoSlug.git"

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
  Write-Host "OK: https://github.com/$user/$repoSlug" -ForegroundColor Green
  Write-Host "     (可在 GitHub 仓库 Settings 中改名为: $repoName)" -ForegroundColor Gray
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
