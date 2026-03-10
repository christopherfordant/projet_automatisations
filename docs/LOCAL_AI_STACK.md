# Stack locale IA cible

## Objectif

Faire evoluer l'application actuelle vers une vraie infrastructure locale gratuite ou self-hosted, ou:

- `n8n` orchestre les workflows;
- `FastAPI` garde la logique metier mutuelle;
- `Ollama` sert les modeles IA en local;
- `Qdrant` gere la recherche vectorielle et la memoire documentaire;
- `Supabase local` sert de backend data principal;
- `Postgres` est deja prevu pour `n8n` et peut servir de secours local.

## Repartition des roles

- `n8n`: entree des flux, webhooks, horaires, routage, appels HTTP vers l'API metier.
- `FastAPI`: intelligence metier stable, scoring, checklist documentaire, generation de messages.
- `Ollama`: inference locale compatible API OpenAI.
- `Qdrant`: similarite documentaire, recherche de cas proches, RAG local.
- `Supabase`: tables operateur, historisation, auth, stockage documentaire, realtime si besoin.

## Base runnable laissee dans ce depot

- `infra/docker-compose.local.yml`
- `.env.stack.example`
- `scripts/start_local_ai_stack.ps1`
- `scripts/start_n8n_local.ps1`

Cette base demarre:

- `postgres`
- `n8n`
- `qdrant`
- `ollama`

Le mode Docker local active `N8N_RUNNERS_ENABLED=true` pour rester aligne avec les recommandations recentes de `n8n`.

Si Docker n'est pas disponible, `n8n` peut aussi etre lance en local avec:

```powershell
.\scripts\start_n8n_local.ps1
```

Ce lanceur active lui aussi les `task runners`.

En cas de conflit de schema SQLite entre deux versions de `n8n`, reinitialiser l'instance locale avec sauvegarde:

```powershell
.\scripts\start_n8n_local.ps1 -ResetLocalData
```

## Supabase local

La self-hosting `Supabase` complete est plus lourde que le reste de la stack. Pour rester pragmatique:

1. on garde `Postgres + n8n + Qdrant + Ollama` dans le compose local du depot;
2. on ajoute `Supabase local` via CLI sur la machine quand tu reviens.

Commande cible:

```powershell
supabase start
```

Ensuite:

- utiliser `supabase db push` pour le schema;
- brancher `n8n` et l'app FastAPI sur la base locale exposee.

## Flux cible recommande

1. Un CSV, un email ou un webhook entre dans `n8n`.
2. `n8n` appelle `POST /automations/claims-intake`.
3. Si dossier incomplet, `n8n` appelle la brique documentaire ou reutilise le message deja genere.
4. Le resultat est stocke dans `Supabase`.
5. Les pieces et embeddings sont indexes dans `Qdrant`.
6. Les files operateur ou relances partent depuis `n8n`.

## Mode d'adoption SI recommande

Pour faciliter l'adoption cote mutuelle:

1. commencer par un `dossier surveille` ou un `CSV`;
2. passer ensuite au batch automatise;
3. monter plus tard vers `API`, `SFTP`, `email` ou base partagee.

Le depot contient deja un mode simple `dossier surveille`:

```powershell
.\scripts\watch_claims_drop_folder.ps1
```

## Outils locaux gratuits conseilles

- `n8n`
- `Ollama`
- `Qdrant`
- `Supabase local`
- `Postgres`
- `LibreOffice` pour les CSV

## Sources officielles

- n8n self-hosting: https://docs.n8n.io/hosting/
- Supabase self-hosting/local: https://supabase.com/docs/guides/self-hosting
- Ollama API/OpenAI compatibility: https://docs.ollama.com/openai
