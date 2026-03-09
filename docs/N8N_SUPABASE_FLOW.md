# Workflow n8n et stockage Supabase

## Fichiers ajoutes

- `n8n/workflows/claims_intake_webhook.json`
- `n8n/workflows/claims_intake_batch_webhook.json`
- `n8n/workflows/document_completeness_webhook.json`
- `n8n/workflows/missing_info_followup_campaign.json`
- `n8n/workflows/full_csv_claims_pipeline.json`
- `supabase/schema/001_mutuelle_core.sql`
- `supabase/schema/002_mutuelle_ingest_helpers.sql`

## Ce que fait le workflow n8n

Le workflow `claims_intake_webhook.json`:

1. recoit un `POST` sur un webhook n8n;
2. appelle `POST /automations/claims-intake` sur l'API FastAPI locale;
3. renvoie directement la reponse du dernier noeud.

Le workflow `claims_intake_batch_webhook.json`:

1. recoit un lot de dossiers en `POST`;
2. appelle `POST /automations/claims-intake/batch`;
3. renvoie directement le JSON batch au caller.

Le workflow `document_completeness_webhook.json`:

1. recoit un dossier documentaire en `POST`;
2. appelle `POST /automations/document-completeness`;
3. renvoie directement la checklist et le message client genere.

Le workflow `missing_info_followup_campaign.json`:

1. declenche une campagne planifiee;
2. lit les dossiers incomplets depuis la base locale;
3. reutilise les messages client deja prepares;
4. journalise l'action dans `operator_actions`.

Le workflow `full_csv_claims_pipeline.json`:

1. recoit un CSV brut en webhook;
2. parse les lignes dans n8n;
3. appelle `POST /automations/claims-intake/batch`;
4. renvoie directement le resultat batch.

## Mode local simple recommande

Pour demarrer vite avec une mutuelle ou un POC interne:

- importer les workflows webhooks simplifies;
- faire repondre le `Webhook` avec le dernier noeud;
- garder `FastAPI` comme coeur metier;
- ajouter `Postgres/Supabase` seulement apres validation du flux.

Ce mode facilite l'integration par:

- webhook direct;
- payload JSON manuel;
- batch `items`;
- pipeline CSV brut.

## URL cible cote n8n

Dans Docker, le workflow pointe vers:

```text
http://host.docker.internal:8000/automations/claims-intake
```

Cette URL suppose que l'API FastAPI tourne sur la machine hote.

## Payload attendu par le webhook n8n

```json
{
  "channel": "email",
  "customer_id": "CL-2048",
  "contract_id": "DOS-7788",
  "provider": "mock",
  "claim_text": "Bonjour, j'ai une relance urgente pour un remboursement.",
  "attached_documents": ["facture dentaire"]
}
```

## Import du workflow

Dans n8n:

1. ouvrir l'interface `http://localhost:5678`
2. `Import from file`
3. choisir `n8n/workflows/claims_intake_webhook.json`
4. sauvegarder le workflow
5. l'activer si besoin

Si Docker n'est pas disponible, lancer d'abord:

```powershell
.\scripts\start_n8n_local.ps1
```

Si l'ecran d'inscription retourne une erreur SQL de type `User.role` ou `roleSlug`, reinitialiser les donnees locales `n8n`:

```powershell
.\scripts\start_n8n_local.ps1 -ResetLocalData
```

Pour le batch:

1. `Import from file`
2. choisir `n8n/workflows/claims_intake_batch_webhook.json`
3. sauvegarder le workflow
4. l'activer si besoin

Pour la completude documentaire:

1. `Import from file`
2. choisir `n8n/workflows/document_completeness_webhook.json`
3. sauvegarder le workflow
4. l'activer si besoin

Pour la campagne de relance:

1. `Import from file`
2. choisir `n8n/workflows/missing_info_followup_campaign.json`
3. associer le credential `Postgres`
4. sauvegarder le workflow
5. l'activer si besoin

Pour le pipeline CSV complet:

1. `Import from file`
2. choisir `n8n/workflows/full_csv_claims_pipeline.json`
3. sauvegarder le workflow
4. l'activer si besoin

## Schema Supabase local

Le schema SQL `supabase/schema/001_mutuelle_core.sql` cree:

- `claim_batches`
- `claim_cases`
- `operator_actions`
- `document_checks`

Le schema `supabase/schema/002_mutuelle_ingest_helpers.sql` ajoute:

- `save_claim_batch(...)`
- `save_document_check(...)`
- `log_operator_action(...)`
- vue `claim_cases_ready_for_followup`
- vue `operator_dashboard_metrics`
- vue `operator_dashboard_worklist`

## Application du schema

Si `Supabase local` est lance:

```powershell
supabase db reset
```

ou appliquer le SQL dans l'editeur SQL local.

## Fonction SQL de stockage batch

La fonction:

```sql
select public.save_claim_batch(
  'batch_csv_n8n',
  'n8n',
  :payload_jsonb
);
```

sert a inserer:

- une ligne dans `claim_batches`
- toutes les lignes dans `claim_cases`

`payload_jsonb` doit etre le JSON complet retourne par `POST /automations/claims-intake/batch`.

## Branchement recommande dans n8n

Ajouter apres le noeud HTTP batch:

1. un noeud `Postgres`
2. connexion vers la base locale `Supabase/Postgres`
3. requete:

```sql
select public.save_claim_batch(
  $1,
  $2,
  $3::jsonb
);
```

avec en parametres:

1. `source_name`
2. `imported_by`
3. le JSON batch complet

## Payload attendu pour le pipeline CSV complet

```json
{
  "source_name": "batch_niort_2026_03_06.csv",
  "imported_by": "n8n_csv_pipeline",
  "provider": "mock",
  "csv_content": "channel,customer_id,contract_id,claim_text,attached_documents\nemail,CL-2048,DOS-7788,\"Bonjour, relance remboursement\",\"facture dentaire\""
}
```

## Reponse du pipeline CSV complet

```json
{
  "batch_id": "uuid",
  "source_name": "batch_niort_2026_03_06.csv",
  "summary": {
    "total_items": 1
  },
  "item_count": 1
}
```

## Stockage des controles documentaires

Apres le noeud HTTP `document-completeness`, ajouter un noeud `Postgres`:

```sql
select public.save_document_check(
  $1::uuid,
  $2::jsonb
);
```

Parametres:

1. `claim_case_id`
2. le JSON complet retourne par `POST /automations/document-completeness`

## Journalisation des actions operateur

Pour tracer une action depuis n8n:

```sql
select public.log_operator_action(
  $1::uuid,
  $2,
  $3,
  $4
);
```

Parametres:

1. `claim_case_id`
2. `action_type`
3. `action_detail`
4. `actor_name`

## Selection des dossiers a relancer

La vue:

```sql
select * from public.claim_cases_ready_for_followup;
```

retourne les dossiers avec:

- informations manquantes
- message client deja genere
- references utiles pour une campagne de relance

## Tableau operateur persistant en base

Vue synthese:

```sql
select * from public.operator_dashboard_metrics;
```

Vue liste de travail:

```sql
select * from public.operator_dashboard_worklist;
```

Ces vues permettent a `Supabase`, `n8n` ou une future interface operateur de lire:

- les volumes a traiter
- les dossiers critiques
- les dossiers bloques
- les relances preparees
- les dossiers pret a router

## Usage cible

- `n8n` orchestre les entrees
- `FastAPI` calcule et qualifie
- `Supabase` stocke les resultats et l'historique
- `Qdrant` servira ensuite aux recherches documentaires et cas proches

## Prochaine suite logique

1. brancher le noeud `Postgres` ou `Supabase` apres le batch
2. brancher `document-completeness` sur `save_document_check(...)`
3. enrichir la campagne de relance avec envoi reel email ou sms
