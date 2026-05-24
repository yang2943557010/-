# 将本项目推送到 GitHub 仓库「网盘页面展示」
# 用法：在 PowerShell 中执行  .\scripts\push-github.ps1

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "请先安装 GitHub CLI: winget install GitHub.cli" -ForegroundColor Yellow
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "尚未登录 GitHub，正在打开设备授权..." -ForegroundColor Cyan
  gh auth login --hostname github.com --git-protocol https --web
}

$repoName = "网盘页面展示"
$exists = gh repo view "yang2943557010/$repoName" 2>$null
if (-not $exists) {
  Write-Host "创建仓库: $repoName" -ForegroundColor Green
  gh repo create $repoName --public --description "网盘分享链接生成、扫码落地页、资源搜索中转" --source . --remote github --push
} else {
  if (-not (git remote get-url github 2>$null)) {
    git remote add github "https://github.com/yang2943557010/$repoName.git"
  }
  git push -u github main
}

Write-Host "完成。仓库地址: https://github.com/yang2943557010/$repoName" -ForegroundColor Green
