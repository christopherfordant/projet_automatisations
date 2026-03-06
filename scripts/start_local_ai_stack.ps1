param(
    [string]$ComposeFile = "infra/docker-compose.local.yml",
    [string]$EnvFile = ".env.stack"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installe ou non disponible dans le PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $EnvFile)) {
    if (Test-Path ".env.stack.example") {
        Copy-Item ".env.stack.example" $EnvFile
        Write-Host "Fichier $EnvFile cree depuis .env.stack.example" -ForegroundColor Yellow
    } else {
        Write-Host "Fichier .env.stack.example introuvable." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Demarrage de la stack locale IA..." -ForegroundColor Cyan
docker compose --env-file $EnvFile -f $ComposeFile up -d

Write-Host ""
Write-Host "Services attendus:" -ForegroundColor Green
Write-Host "- n8n: http://localhost:5678"
Write-Host "- Ollama: http://localhost:11434"
Write-Host "- Qdrant: http://localhost:6333"
Write-Host "- Postgres: localhost:5432"
Write-Host ""
Write-Host "Etapes suivantes recommandees:" -ForegroundColor Green
Write-Host "1. lancer l'API metier FastAPI"
Write-Host "2. ouvrir n8n et construire les workflows"
Write-Host "3. lancer 'supabase start' si le CLI Supabase est installe"
