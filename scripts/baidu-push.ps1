# Baidu push API - usage: .\scripts\baidu-push.ps1
# Set token in .env.baidu (see .env.baidu.example)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

$site = '251800.xyz'
$token = $env:BAIDU_PUSH_TOKEN
if (-not $token -and (Test-Path '.env.baidu')) {
  Get-Content '.env.baidu' -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*BAIDU_PUSH_TOKEN\s*=\s*(.+)\s*$') { $token = $Matches[1].Trim().Trim('"').Trim("'") }
  }
}
if (-not $token) {
  Write-Error 'Missing BAIDU_PUSH_TOKEN in .env.baidu or environment.'
}

$urls = @(
  'https://251800.xyz/',
  'https://251800.xyz/pages/generator',
  'https://251800.xyz/pages/resources',
  'https://251800.xyz/pages/speed',
  'https://251800.xyz/pages/vip',
  'https://251800.xyz/pages/tools'
)

$body = ($urls -join "`n")
$api = "http://data.zz.baidu.com/urls?site=$site&token=$token"

$resp = Invoke-RestMethod -Uri $api -Method Post -Body $body -ContentType 'text/plain; charset=utf-8'
Write-Output ($resp | ConvertTo-Json -Compress)
