$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $projectRoot 'browser-automation\logs'
$npmCache = Join-Path $projectRoot '.npm-cache'

New-Item -ItemType Directory -Force -Path $logPath | Out-Null
New-Item -ItemType Directory -Force -Path $npmCache | Out-Null

Write-Host 'Playwright MCP va se connecter à ton Edge déjà ouvert via l’extension.' -ForegroundColor Cyan
Write-Host 'Vérifie que l’extension est installée et que LinkedIn est ouvert dans un onglet.' -ForegroundColor Yellow
Write-Host 'Le processus doit s’arrêter avant toute publication.' -ForegroundColor Yellow

& npx.cmd --yes --cache $npmCache @playwright/mcp@0.0.80 `
  --extension `
  --caps vision `
  --allowed-hosts 'linkedin.com,www.linkedin.com'
