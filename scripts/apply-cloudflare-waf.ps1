# 一键为 251800.xyz 写入 WAF 自定义规则（需 CLOUDFLARE_API_TOKEN）
# 用法：
#   $env:CLOUDFLARE_API_TOKEN = '你的Token'
#   .\scripts\apply-cloudflare-waf.ps1
#
# Token 权限建议（自定义 Token）：
#   Zone - Zone - Read
#   Zone - WAF - Edit
#   Account - Account Rulesets - Edit（若 Zone WAF 不够）
# 区域资源：Include → Specific zone → 251800.xyz
# 创建地址：https://dash.cloudflare.com/profile/api-tokens

$ErrorActionPreference = 'Stop'
$zoneName = '251800.xyz'
$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
  Write-Error '请先设置环境变量 CLOUDFLARE_API_TOKEN'
}

$headers = @{
  Authorization = "Bearer $token"
  'Content-Type' = 'application/json'
}

function Invoke-CfApi {
  param([string]$Method, [string]$Uri, $Body = $null)
  $params = @{ Method = $Method; Uri = $Uri; Headers = $headers }
  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 30 -Compress)
  }
  $resp = Invoke-RestMethod @params
  if (-not $resp.success) {
    throw ("Cloudflare API failed: " + ($resp.errors | ConvertTo-Json -Compress))
  }
  return $resp
}

Write-Host "查询 Zone: $zoneName ..."
$zones = Invoke-CfApi -Method GET -Uri "https://api.cloudflare.com/client/v4/zones?name=$zoneName"
if (-not $zones.result -or $zones.result.Count -lt 1) {
  throw "找不到域名 $zoneName，请确认 Token 有该 Zone 权限"
}
$zoneId = $zones.result[0].id
Write-Host "Zone ID: $zoneId"

$allowExpr = @'
(cf.client.bot) and (http.user_agent contains "Googlebot" or http.user_agent contains "AdsBot-Google" or http.user_agent contains "Mediapartners-Google" or http.user_agent contains "bingbot" or http.user_agent contains "BingPreview" or http.user_agent contains "Baiduspider" or http.user_agent contains "Sogou" or http.user_agent contains "360Spider" or http.user_agent contains "YisouSpider")
'@

$aiBlockExpr = @'
(http.user_agent contains "Bytespider" or http.user_agent contains "ByteSpider" or http.user_agent contains "PetalBot" or http.user_agent contains "GPTBot" or http.user_agent contains "ChatGPT-User" or http.user_agent contains "OAI-SearchBot" or http.user_agent contains "ClaudeBot" or http.user_agent contains "anthropic-ai" or http.user_agent contains "Claude-Web" or http.user_agent contains "Amazonbot" or http.user_agent contains "CCBot" or http.user_agent contains "Diffbot" or http.user_agent contains "ImagesiftBot" or http.user_agent contains "Omgilibot" or http.user_agent contains "FacebookBot" or http.user_agent contains "meta-externalagent" or http.user_agent contains "Meta-ExternalAgent" or http.user_agent contains "Meta-ExternalFetcher" or http.user_agent contains "Applebot-Extended" or http.user_agent contains "Google-Extended" or http.user_agent contains "PerplexityBot" or http.user_agent contains "YouBot" or http.user_agent contains "cohere-ai" or http.user_agent contains "DataForSeoBot" or http.user_agent contains "magpie-crawler" or http.user_agent contains "TurnitinBot" or http.user_agent contains "ia_archiver" or http.user_agent contains "archive.org_bot")
'@

$scannerExpr = @'
(http.user_agent contains "sqlmap" or http.user_agent contains "nikto" or http.user_agent contains "nmap" or http.user_agent contains "masscan" or http.user_agent contains "zgrab" or http.user_agent contains "nuclei" or http.user_agent contains "dirbuster" or http.user_agent contains "gobuster" or http.user_agent contains "wfuzz" or http.user_agent contains "ffuf" or http.user_agent contains "OpenVAS" or http.user_agent contains "Nessus" or http.user_agent contains "Acunetix" or http.user_agent contains "libwww-perl" or http.user_agent contains "python-requests" or http.user_agent contains "python-urllib" or http.user_agent contains "aiohttp" or http.user_agent contains "Go-http-client" or http.user_agent contains "Scrapy" or http.user_agent eq "" or not len(http.user_agent) > 0)
'@

$shareChallengeExpr = @'
(http.request.uri.query contains "d=") and (not cf.client.bot)
'@

$apiBlockExpr = @'
(http.host eq "wx.251800.xyz") and (cf.client.bot or http.user_agent contains "bot" or http.user_agent contains "spider" or http.user_agent contains "crawler" or http.user_agent contains "Bytespider" or http.user_agent contains "python-requests" or http.user_agent contains "curl/" or http.user_agent eq "")
'@

# 读取现有入口规则集
$phaseUri = "https://api.cloudflare.com/client/v4/zones/$zoneId/rulesets/phases/http_request_firewall_custom/entrypoint"
$existingRules = @()
$rulesetId = $null
try {
  $existing = Invoke-CfApi -Method GET -Uri $phaseUri
  $rulesetId = $existing.result.id
  if ($existing.result.rules) { $existingRules = @($existing.result.rules) }
  Write-Host ("已有自定义规则集: {0}（{1} 条规则）" -f $rulesetId, $existingRules.Count)
} catch {
  Write-Host '尚无自定义入口规则集，将创建'
}

$ourRefs = @(
  'allow_search_engine_bots',
  'block_ai_and_bytedance_bots',
  'block_scanners_and_scripts',
  'challenge_share_landing_non_browser',
  'block_wx_api_bots'
)

$desiredRules = @(
  @{
    ref = 'allow_search_engine_bots'
    description = '放行 Google/百度/Bing 等正规搜索引擎'
    expression = ($allowExpr -replace "`r|`n", ' ').Trim()
    action = 'skip'
    action_parameters = @{ ruleset = 'current' }
    enabled = $true
  }
  @{
    ref = 'block_ai_and_bytedance_bots'
    description = '拦截 AI 爬虫与字节/Petal 爬虫'
    expression = ($aiBlockExpr -replace "`r|`n", ' ').Trim()
    action = 'block'
    enabled = $true
  }
  @{
    ref = 'block_scanners_and_scripts'
    description = '拦截漏洞扫描与批量脚本 UA'
    expression = ($scannerExpr -replace "`r|`n", ' ').Trim()
    action = 'block'
    enabled = $true
  }
  @{
    ref = 'challenge_share_landing_non_browser'
    description = '转链落地页(?d=)非搜索引擎走托管挑战'
    expression = ($shareChallengeExpr -replace "`r|`n", ' ').Trim()
    action = 'managed_challenge'
    enabled = $true
  }
  @{
    ref = 'block_wx_api_bots'
    description = '拦截 wx.251800.xyz 上的爬虫/脚本'
    expression = ($apiBlockExpr -replace "`r|`n", ' ').Trim()
    action = 'block'
    enabled = $true
  }
)

# 保留非本脚本管理的旧规则，再追加/覆盖我们的 5 条
$kept = @()
foreach ($r in $existingRules) {
  $ref = $r.ref
  if ($ref -and ($ourRefs -contains $ref)) { continue }
  $keptRule = @{
    expression = $r.expression
    action = $r.action
    description = $r.description
    enabled = $r.enabled
  }
  if ($r.ref) { $keptRule.ref = $r.ref }
  if ($r.action_parameters) { $keptRule.action_parameters = $r.action_parameters }
  if ($r.id) { $keptRule.id = $r.id }
  $kept += $keptRule
}

$finalRules = $desiredRules + $kept

$body = @{
  description = '251800 bot allow/block rules'
  rules = $finalRules
}

if ($rulesetId) {
  Write-Host '更新规则集...'
  $result = Invoke-CfApi -Method PUT -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/rulesets/$rulesetId" -Body $body
} else {
  Write-Host '创建规则集...'
  $createBody = @{
    name = 'default'
    kind = 'zone'
    phase = 'http_request_firewall_custom'
    description = '251800 bot allow/block rules'
    rules = $finalRules
  }
  $result = Invoke-CfApi -Method POST -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/rulesets" -Body $createBody
}

Write-Host ''
Write-Host '已写入规则：' -ForegroundColor Green
foreach ($r in $result.result.rules) {
  Write-Host (" - [{0}] {1} ({2})" -f $r.action, $r.description, $r.id)
}

# 尝试开启 Bot Fight Mode（免费）
try {
  Write-Host ''
  Write-Host '尝试开启 Bot Fight Mode...'
  $bfm = Invoke-CfApi -Method PUT -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/bot_management" -Body @{
    fight_mode = $true
  }
  Write-Host ('Bot Fight Mode: ' + $bfm.result.fight_mode) -ForegroundColor Green
} catch {
  Write-Host 'Bot Fight Mode 接口不可用或权限不足（可在控制台手动开启：安全性 → 机器人）' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '完成。请到：安全性 → WAF → 自定义规则 核对顺序与状态。' -ForegroundColor Cyan
