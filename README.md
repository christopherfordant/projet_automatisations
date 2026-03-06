# Plateforme IA modulaire pour automatisations mutuelles

Base locale pour construire une infrastructure IA de niveau entreprise, orientee automatisation de processus mutuelle, connectable par API, extensible par modules, et desormais pensee pour s'integrer a une stack locale `n8n + Supabase + Ollama + outils self-hosted`.

## Positionnement

Le socle est pense pour:

- tourner en local au demarrage;
- brancher un moteur IA compatible API OpenAI en local, en priorite `Ollama`;
- s'orchestrer proprement depuis `n8n`;
- se connecter a `Supabase local` ou a un `Postgres` local;
- pouvoir ajouter une couche `Qdrant` pour la memoire documentaire;
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
- `scripts/start_local_ai_stack.ps1`: demarrage de la stack locale d'infrastructure.
- `infra/docker-compose.local.yml`: socle local `n8n + Postgres + Qdrant + Ollama`.
- `docs/LOCAL_AI_STACK.md`: architecture cible.
- `docs/N8N_SUPABASE_FLOW.md`: branchement `n8n + FastAPI + Supabase`.
- `n8n/workflows`: workflows importables dans n8n.
- `supabase/schema`: schema SQL local pour Supabase/Postgres.

## Choix techniques

- Backend: FastAPI
- Validation/configuration: Pydantic Settings
- Serveur local IA cible: Ollama via endpoint compatible OpenAI
- Orchestration cible: n8n self-hosted
- Backend data cible: Supabase local / Postgres local
- Recherche vectorielle cible: Qdrant
- Packaging: `pyproject.toml`

## Stack locale cible

Objectif d'architecture:

- `n8n` pour les workflows, webhooks, cron, routage et sorties;
- `FastAPI` pour la logique metier stable;
- `Ollama` pour l'IA locale;
- `Qdrant` pour la memoire documentaire et la recherche vectorielle;
- `Supabase local` pour les tables, traces, auth et stockage;
- `Postgres` deja present pour `n8n` et utilisable en mode local.

Voir aussi:

- [docs/LOCAL_AI_STACK.md](docs/LOCAL_AI_STACK.md)
- [docs/N8N_SUPABASE_FLOW.md](docs/N8N_SUPABASE_FLOW.md)

Workflows n8n ajoutes:

- `claims intake` unitaire
- `claims intake` batch

Helpers SQL ajoutes:

- schema coeur `claim_batches`, `claim_cases`, `operator_actions`, `document_checks`
- fonction `save_claim_batch(...)` pour inserer un batch complet depuis n8n

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

4. Demarrer Ollama et charger un modele:

```powershell
ollama serve
ollama pull qwen2.5:7b
```

5. Lancer l'API:

```powershell
uvicorn app.main:app --reload --app-dir src
```

## Demarrage de la stack d'infrastructure locale

1. Copier la configuration stack:

```powershell
Copy-Item .env.stack.example .env.stack
```

2. Demarrer les services locaux:

```powershell
.\scripts\start_local_ai_stack.ps1
```

Cette commande demarre:

- `n8n`
- `Postgres`
- `Qdrant`
- `Ollama`

3. Option `Supabase local`:

```powershell
supabase start
```

## Endpoints initiaux

- `GET /health`
- `GET /providers`
- `POST /automations/intake`
- `POST /automations/claims-intake`
- `POST /automations/claims-intake/batch`
- `POST /automations/document-analysis`
- `POST /automations/document-completeness`

## Vision de modularisation

Exemples de modules metier a brancher ensuite:

- qualification de demandes entrantes;
- lecture et structuration de pieces contractuelles;
- comparaison garanties / exclusions / workflows;
- generation de syntheses operateur;
- supervision et traces d'execution.

Le premier module concret fourni ici est `claims intake`, pour:

- classer une demande;
- estimer une urgence;
- lister les informations manquantes;
- proposer la prochaine action a lancer.

## GitHub

Le depot local est pret pour des commits incrementaux. Le push GitHub demandera ensuite:

- une URL de depot distant;
- une authentification GitHub valide sur la machine.
