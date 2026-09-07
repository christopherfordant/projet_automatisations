$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$python = Join-Path $projectRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) {
    throw 'Environnement virtuel absent. Lance d’abord: python -m venv .venv'
}

Write-Host '1/5 Ruff lint' -ForegroundColor Cyan
& $python -m ruff check src tests

Write-Host '2/5 Ruff format' -ForegroundColor Cyan
& $python -m ruff format --check src tests

Write-Host '3/5 Tests Python' -ForegroundColor Cyan
& $python -m pytest -q

Write-Host '4/5 Workflows n8n JSON' -ForegroundColor Cyan
Get-ChildItem -LiteralPath (Join-Path $projectRoot 'n8n\workflows') -Filter '*.json' | ForEach-Object {
    Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json | Out-Null
}

Write-Host '5/5 Diff Git' -ForegroundColor Cyan
git diff --check

Write-Host 'Contrôles qualité réussis.' -ForegroundColor Green
