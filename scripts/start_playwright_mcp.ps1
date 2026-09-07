$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$profilePath = Join-Path $projectRoot 'browser-automation\profile'
$logPath = Join-Path $projectRoot 'browser-automation\logs'

New-Item -ItemType Directory -Force -Path $profilePath, $logPath | Out-Null

Write-Host 'Playwright MCP va ouvrir un navigateur Edge visible.' -ForegroundColor Cyan
Write-Host 'Connecte-toi manuellement. Le profil est séparé du profil Edge habituel.' -ForegroundColor Yellow
Write-Host 'Le processus doit s’arrêter avant toute publication.' -ForegroundColor Yellow

& npx.cmd --yes @playwright/mcp@0.0.80 `
  --browser msedge `
  --headless=false `
  --caps vision `
  --user-data-dir $profilePath `
  --allowed-hosts 'linkedin.com,www.linkedin.com'
