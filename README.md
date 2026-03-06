# Plateforme IA modulaire pour automatisations mutuelles

Base locale pour construire une infrastructure IA de niveau entreprise, orientee automatisation de processus mutuelle, connectable par API et extensible par modules.

## Positionnement

Le socle est pense pour:

- tourner en local au demarrage;
- brancher un moteur IA compatible API OpenAI en local, en priorite `Ollama`;
- separer les besoins par domaine: analyse documentaire, triage, extraction, orchestration, connecteurs SI;
- rester industrialisable vers un deploiement plus avance par la suite.

## Architecture

- `src/app/main.py`: point d'entree FastAPI.
- `src/app/api/routes`: endpoints sante, providers, automatisations.
- `src/app/core`: configuration et logging.
- `src/app/providers`: abstraction des moteurs IA.
- `src/app/services`: orchestration des cas d'usage.
- `src/app/connectors`: connecteurs vers services mutuelles.
- `scripts/setup_local.ps1`: bootstrap local.

## Choix techniques

- Backend: FastAPI
- Validation/configuration: Pydantic Settings
- Serveur local IA cible: Ollama via endpoint compatible OpenAI
- Packaging: `pyproject.toml`

## Demarrage local

1. Creer l'environnement virtuel:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Installer les dependances:

```powershell
pip install -e .[dev]
```

3. Copier la configuration:

```powershell
Copy-Item .env.example .env
```

4. Lancer l'API:

```powershell
uvicorn app.main:app --reload --app-dir src
```

## Endpoints initiaux

- `GET /health`
- `GET /providers`
- `POST /automations/intake`
- `POST /automations/document-analysis`

## Vision de modularisation

Exemples de modules metier a brancher ensuite:

- qualification de demandes entrantes;
- lecture et structuration de pieces contractuelles;
- comparaison garanties / exclusions / workflows;
- generation de syntheses operateur;
- supervision et traces d'execution.

## GitHub

Le depot local est pret pour des commits incrementaux. Le push GitHub demandera ensuite:

- une URL de depot distant;
- une authentification GitHub valide sur la machine.

