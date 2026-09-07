# Checklist de déploiement client

## 1. Préparer le client

- [ ] Confirmer le processus métier à automatiser.
- [ ] Lister les champs entrants et les statuts attendus.
- [ ] Identifier les outils du client : webhook, API, CRM, email, Slack.
- [ ] Définir un identifiant unique de dossier ou de lot.

## 2. Installer la base Supabase

- [ ] Créer un projet Supabase dédié au client.
- [ ] Exécuter `supabase/schema/001_mutuelle_core.sql`.
- [ ] Exécuter `supabase/schema/002_mutuelle_ingest_helpers.sql`.
- [ ] Ajouter la migration anti-doublon si le client utilise les imports batch.
- [ ] Vérifier les tables `claim_batches`, `claim_cases`, `document_checks` et `operator_actions`.

## 3. Installer n8n

- [ ] Importer le workflow n8n adapté depuis `n8n/workflows`.
- [ ] Recréer les credentials dans l’instance du client.
- [ ] Vérifier les URLs FastAPI et les URLs webhook.
- [ ] Vérifier les paramètres Postgres/Supabase.
- [ ] Publier le workflow.

## 4. Tester

- [ ] Envoyer un dossier de test depuis Postman.
- [ ] Vérifier la réponse HTTP 200.
- [ ] Vérifier la création d’une ligne dans `claim_batches`.
- [ ] Vérifier la création d’une ligne dans `claim_cases`.
- [ ] Renvoyer exactement le même dossier.
- [ ] Vérifier qu’aucun doublon n’est créé.
- [ ] Tester un dossier incomplet et vérifier `document_checks`.
- [ ] Vérifier l’historique dans `operator_actions`.

## 5. Sécurité et livraison

- [ ] Ne jamais partager les mots de passe, tokens ou chaînes de connexion.
- [ ] Utiliser un projet Supabase et des credentials propres au client.
- [ ] Activer et vérifier les politiques RLS adaptées.
- [ ] Exporter le workflow n8n après chaque modification importante.
- [ ] Remettre au client les URLs, prérequis et consignes de maintenance.

## Fichiers modèles

- Workflow batch : `n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json`
- Schéma principal : `supabase/schema/001_mutuelle_core.sql`
- Fonctions SQL : `supabase/schema/002_mutuelle_ingest_helpers.sql`
