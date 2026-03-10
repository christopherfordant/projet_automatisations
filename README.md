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
- `scripts/start_n8n_local.ps1`: lancement local de `n8n` sans Docker avec le runtime Node 22 du projet.
- `scripts/watch_claims_drop_folder.ps1`: surveillance locale d'un dossier pour envoyer automatiquement `.csv` et `.json` vers `n8n`.
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
- `document completeness`
- `missing info follow-up campaign`
- `full csv claims pipeline`

Canal d'entree local ajoute:

- `dossier surveille` pour deposer simplement des fichiers metier sans integrer un SI tout de suite
- `zone de depot graphique` dans l'interface web pour alimenter `dropzones/incoming` sans passer par l'explorateur

Helpers SQL ajoutes:

- schema coeur `claim_batches`, `claim_cases`, `operator_actions`, `document_checks`
- fonction `save_claim_batch(...)` pour inserer un batch complet depuis n8n
- fonction `save_document_check(...)` pour stocker une verification documentaire
- fonction `log_operator_action(...)` pour tracer les actions operateur
- vue `claim_cases_ready_for_followup` pour les campagnes de relance
- vues `operator_dashboard_metrics` et `operator_dashboard_worklist` pour un tableau operateur persistant

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

La stack Docker locale active aussi les `task runners` n8n via `N8N_RUNNERS_ENABLED=true`.

3. Option `Supabase local`:

```powershell
supabase start
```

## Demarrage local de n8n sans Docker

Si Docker n'est pas disponible sur la machine, tu peux lancer `n8n` directement avec le runtime Node 22 embarque dans le projet:

```powershell
.\scripts\start_n8n_local.ps1
```

Par defaut, l'interface sera disponible sur `http://127.0.0.1:5678`.

Le lanceur local active aussi les `task runners` n8n pour rester compatible avec les versions recentes.

Si `n8n` affiche une erreur de schema SQLite au premier acces, tu peux reinitialiser proprement ses donnees locales avec sauvegarde:

```powershell
.\scripts\start_n8n_local.ps1 -ResetLocalData
```

## Dossier surveille local

Pour simuler une mutuelle qui depose des fichiers sans integration complexe:

```powershell
.\scripts\watch_claims_drop_folder.ps1
```

Le script surveille:

- `dropzones/incoming`

Puis:

- archive les succes dans `dropzones/archive`
- deplace les erreurs dans `dropzones/error`

Formats pris en charge:

- `.csv` vers le pipeline CSV complet `n8n`
- `.json` batch avec `items`
- `.json` documentaire avec `document_type`
- `.json` unitaire `claims intake`

## Enrichissement web verifie

Les modules `claims intake` et `document completeness` peuvent maintenant, si active par requete ou depuis l'interface, aller chercher une guidance complementaire sur des sources web officielles autorisees.

Principes de cette couche:

- domaines autorises uniquement;
- horodatage `checked_at` dans le resultat;
- URL source et extrait restitues a l'operateur;
- usage cible: completer un dossier avec une guidance procedurale recente, pas inventer un identifiant client absent.

Configuration associee:

- `WEB_LOOKUP_TIMEOUT_SECONDS`
- `WEB_LOOKUP_ALLOWED_DOMAINS`

L'interface web propose aussi une zone `Depot surveille` qui:

- envoie des `.csv` et `.json` vers `dropzones/incoming`
- affiche `incoming`, `archive` et `error`
- sert de simulation visuelle du repertoire surveille par `n8n`

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
