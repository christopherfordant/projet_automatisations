# Workflow n8n et stockage Supabase

## Fichiers ajoutes

- `n8n/workflows/claims_intake_webhook.json`
- `n8n/workflows/claims_intake_batch_webhook.json`
- `n8n/workflows/document_completeness_webhook.json`
- `supabase/schema/001_mutuelle_core.sql`
- `supabase/schema/002_mutuelle_ingest_helpers.sql`

## Ce que fait le workflow n8n

Le workflow `claims_intake_webhook.json`:

1. recoit un `POST` sur un webhook n8n;
2. normalise le payload;
3. appelle `POST /automations/claims-intake` sur l'API FastAPI locale;
4. renvoie directement la reponse au caller.

Le workflow `claims_intake_batch_webhook.json`:

1. recoit un lot de dossiers en `POST`;
2. appelle `POST /automations/claims-intake/batch`;
3. prepare une charge exploitable pour stockage;
4. renvoie le JSON batch au caller.

Le workflow `document_completeness_webhook.json`:

1. recoit un dossier documentaire en `POST`;
2. appelle `POST /automations/document-completeness`;
3. renvoie la checklist et le message client genere;
4. peut ensuite etre branche vers `document_checks`.

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

## Usage cible

- `n8n` orchestre les entrees
- `FastAPI` calcule et qualifie
- `Supabase` stocke les resultats et l'historique
- `Qdrant` servira ensuite aux recherches documentaires et cas proches

## Prochaine suite logique

1. brancher le noeud `Postgres` ou `Supabase` apres le batch
2. brancher `document-completeness` sur `save_document_check(...)`
3. faire un workflow n8n de relance client en masse depuis les dossiers incomplets
