param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 5678,
    [string]$UserFolder = ".n8n-local",
    [string]$NodeRuntime = "node-v22.19.0-win-x64\\node.exe",
    [switch]$ResetLocalData
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedNode = Join-Path $projectRoot $NodeRuntime
$resolvedUserFolder = Join-Path $projectRoot $UserFolder
$n8nEntrypoint = Join-Path $env:APPDATA "npm\\node_modules\\n8n\\bin\\n8n"
$n8nDataFolder = Join-Path $resolvedUserFolder ".n8n"

if (-not (Test-Path $resolvedNode)) {
    Write-Host "Runtime Node local introuvable: $resolvedNode" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $n8nEntrypoint)) {
    Write-Host "n8n n'est pas installe globalement sur cette machine." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $resolvedUserFolder)) {
    New-Item -ItemType Directory -Path $resolvedUserFolder | Out-Null
}

if ($ResetLocalData -and (Test-Path $n8nDataFolder)) {
    $backupRoot = Join-Path $projectRoot ".n8n-backups"
    if (-not (Test-Path $backupRoot)) {
        New-Item -ItemType Directory -Path $backupRoot | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = Join-Path $backupRoot "n8n-data-$timestamp"
    Move-Item -Path $n8nDataFolder -Destination $backupPath
    Write-Host "Donnees n8n locales sauvegardees dans: $backupPath" -ForegroundColor Yellow
}

$env:N8N_HOST = $BindHost
$env:N8N_PORT = "$Port"
$env:N8N_USER_FOLDER = $resolvedUserFolder
$env:N8N_RUNNERS_ENABLED = "false"

Write-Host "Demarrage de n8n sur http://$BindHost`:$Port" -ForegroundColor Cyan
Write-Host "Dossier n8n local: $resolvedUserFolder" -ForegroundColor Green

& $resolvedNode $n8nEntrypoint start
