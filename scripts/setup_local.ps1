$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -e .[dev]

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

Write-Host "Local setup termine."
Write-Host "Active l'environnement avec: .\.venv\Scripts\Activate.ps1"
Write-Host "Puis lance: uvicorn app.main:app --reload --app-dir src"

