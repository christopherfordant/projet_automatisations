# Recette locale isolee du pipeline CSV

Lot technique du 23 octobre 2026. Aucun changement du workflow connecte, des
credentials, des fichiers applicatifs existants, du portfolio, des notes ou du CV.
Pas de deploiement. Les resultats concernent les sources locales a la base Git
`d07f1da`, pas une fonction installee en base distante.

## Contrats compares

| Etape | Source locale | Contrat et conclusion |
| --- | --- | --- |
| CSV simple | `n8n/workflows/full_csv_claims_pipeline.json`, noeud Code | Trois noeuds : Webhook, Code, HTTP. Alias de champs, normalisation des en-tetes, virgules et guillemets echappes sur une ligne |
| Variante avec sauvegarde | `n8n/workflows/full_csv_claims_pipeline_supabase_idempotency.json` | Quatre noeuds ; appel SQL avec quatre arguments. Le nom du fichier ne prouve pas l'idempotence |
| API | `src/app/schemas/automation.py`, `src/app/api/routes/automations.py` | `items` non vide et `claim_text` non vide. Le test inclut le vrai routeur ASGI, pas une nouvelle implementation de la regle |
| Doublons | `src/app/services/automation_service.py` | Signalement intra-lot par contrat/categorie, puis client/categorie, sinon texte ; pas de suppression ni de registre inter-envois dans cette methode |
| Sauvegarde | `supabase/schema/002_mutuelle_ingest_helpers.sql` | Signature locale a trois arguments : source, auteur, JSON. Insertion d'un nouveau lot. Aucune preuve d'une surcharge a quatre arguments installee ailleurs |

La configuration importee du moteur local avait ete inspectee en lecture seule
dans le lot precedent : appel a quatre arguments. Aucun acces a cette instance ni
a sa base n'est necessaire pour executer cette suite. Les exports suivis dans Git
et la fonction SQL locale suffisent a reproduire leur divergence.

Le contrat de reference **local documente par le SQL** a trois arguments permet
de tester la sauvegarde locale. Il ne tranche pas l'intention du quatrieme argument
de la variante. Deux options restent distinctes : adapter une copie du workflow
au contrat a trois arguments, ou definir une fonction a quatre arguments avec une
semantique explicite. Ne pas supprimer cet argument ou inventer un verrou
d'idempotence automatiquement. Aucun correctif applicatif n'est livre ici.

## Execution sans services

Depuis une copie Git isolee, avec Python et Node deja presents :

```powershell
$env:PYTHONPATH=(Join-Path (Get-Location) 'src')
$env:PYTHONDONTWRITEBYTECODE='1'
python -m pytest tests/isolated_pipeline -q -rxXs -p no:cacheprovider
```

Utiliser l'interpreteur existant contenant les dependances de test du projet.
Aucune installation, demarrage de n8n, lecture de `.env`, connexion Postgres ou
requete vers un webhook n'est effectuee. L'URL `offline.invalid` est interceptee
par `httpx.ASGITransport` en memoire : aucune resolution DNS ni connexion HTTP.
Le store disque du routeur, inutile a ce parcours, est substitue avant import.
Les fonctions de connexion et de resolution reseau Python sont bloquees et toute
tentative fait echouer le test. Windows utilise un socketpair de boucle locale
pour reveiller sa boucle asyncio : cette boucle est creee une seule fois avant
le blocage ; les appels applicatifs restent bloques pendant les tests.

Le code CSV du noeud suivi dans Git est execute par Node dans un contexte VM sans
`require`, `process` ou `fetch`, avec des delais maximums. Le sous-processus ne
recoit pas les variables utilisateur, tokens ou options Node herites. C'est un
test de transformation, pas une execution du moteur n8n ou une barriere de
securite destinee a du code malveillant arbitraire.

## Resultats et leur portee

Recette executee : **14 reussites, 2 echecs attendus stricts, 1 test ignore**.
Les deux `xfail(strict=True)` documentent des defauts reproduits : ils ne sont
pas des tests reussis du comportement souhaite. Une correction les fait passer
en `XPASS`, ce qui oblige a reviser leur statut. La suite reste verte avec ces
limites connues ; cela ne constitue pas une recette complete du pipeline.

| Cas | Resultat observe | Portee |
| --- | --- | --- |
| CSV nominal, alias, canal, virgules/guillemets et pieces jointes | Reussite | Code CSV original extrait et schema/route API reels en memoire |
| Champ CSV multiligne | Echec attendu strict | Decoupage par ligne avant lecture des guillemets : deux elements au lieu d'un |
| Fichier vide, en-tete seul, texte vide | HTTP 422 | Rejet par le schema reel ; pas de notification ou sauvegarde |
| Canal inconnu | Repli sur email | Comportement constate, pas une nouvelle regle validee commercialement |
| Deux dossiers proches dans un lot | Deux elements conserves et marques suspects | Signalement intra-lot, pas suppression |
| Deux envois du meme lot d'un element | Deux reponses sans suspicion inter-lots | Un store memoire de test peut garder deux elements ; la base reelle n'est pas validee |
| Erreur fournisseur et timeout injectes | HTTP 500, un appel fournisseur, aucune sauvegarde par l'adaptateur de test | Substitut de fournisseur ; pas incident reel ni validation de la gestion d'erreur n8n |
| Timeout de sauvegarde avant/apres ecriture simulee | Deux situations reproduites, pas de relance automatique | Le substitut est connu du test ; un appelant reel ne peut pas deduire le commit depuis le timeout seul |
| Arguments workflow/SQL | Echec attendu strict | Quatre arguments dans l'export, trois dans la definition locale |
| SQL, transaction et rejeu reels | Ignore | Recette distincte ci-dessous, non executee |

Le fournisseur est impose a `mock` ou remplace par un echec synthetique. La
persistance est un substitut memoire controle. Il n'y a ni moteur n8n, ni noeud
HTTP n8n, ni noeud Postgres executes. Aucun test de charge, de concurrence reelle,
de RLS, de sauvegarde/restauration ou de base distante n'est revendique.

## Recette SQL separee, preparee mais non executee

`tests/isolated_pipeline/postgres_recipe.sql` est un protocole manuel autonome.
Il exige une **base locale vide et jetable** nommee `n8n_recipe_disposable`, refuse
un schema public existant ou une adresse serveur non locale, charge les deux
schemas suivis dans Git dans une transaction, puis verifie : signature locale,
sauvegarde nominale, deux insertions au rejeu et atomicite d'un echec de conversion.
La transaction finit par `ROLLBACK`. Si une assertion echoue, le client doit fermer
la connexion sans commit. Ce script n'est ni lance ni valide contre Postgres ici.

Dans un lot ulterieur explicitement autorise, utiliser un client `psql -X` avec
arret sur erreur, hote `127.0.0.1`, port local de cette base jetable et ce fichier
via `-f`. Ne reutiliser aucune connexion, base ou credential applicatif. Ne pas
faire pointer ce protocole vers Supabase ou une base locale contenant des donnees.

## Suite recommandee

1. Clarifier le contrat de sauvegarde voulu et l'intention du quatrieme argument.
2. Proposer un diff distinct du workflow ou du SQL, sans activation.
3. Corriger le CSV multiligne dans une copie et passer le test correspondant.
4. Recetter la base jetable seulement dans un lot autorise, puis le moteur n8n
   avec substituts avant toute connexion reelle.

Pas de hausse de note ou de nouvelle preuve publique de production issue de ce
lot. Les rapports bruts et empreintes de travail restent dans le dossier prive ;
seuls ce protocole et les tests synthetiques sont destines au versionnement.
