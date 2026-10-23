# Recette locale isolee du pipeline CSV

Lot technique du 23 octobre 2026. Aucun changement du workflow connecte, des
credentials, des sources Python, du portfolio, des notes ou du CV. Seuls les
noeuds Code des deux exports dans la copie Git isolee ont ete corriges pour le
CSV multiligne, apres la recette initiale `aa6c6c4c`. Pas d'import ou de
deploiement. Ces resultats ne decrivent pas une fonction installee en base distante.

## Correction CSV multiligne dans la copie isolee

Le parseur lit maintenant le texte entier avec un etat de champ entre guillemets.
LF et CRLF terminent un enregistrement uniquement hors guillemets ; leur contenu
est conserve a l'interieur du champ. Les guillemets doubles echappes et les
virgules entre guillemets restent pris en charge. Les lignes vides hors champ
sont ignorees, les lignes vides dans un champ sont conservees. Les normalisations,
alias, valeurs par defaut et contrat de sortie sont preserves. Le meme parseur
est present dans les deux exports, qui gardent leurs trois et quatre noeuds.

Un guillemet non ferme, un guillemet dans un champ non cite ou du texte non blanc
apres une fermeture provoquent `CSV_INVALID_FORMAT`. Aucun lot partiel n'est
retourne, meme si des lignes valides precedent l'erreur. Les espaces autour d'un
champ cite restent toleres. Ce rejet explicite remplace une interpretation
silencieuse des CSV malformes ; il ne constitue pas une nouvelle regle metier.
La propagation de cette erreur dans le moteur n8n n'a pas ete recettee.

Le test multiligne n'est plus marque `xfail`. La divergence SQL reste inchangee
et conserve son echec attendu strict. Aucun chemin de webhook, credential,
parametre HTTP, appel SQL ou regle metier n'a ete modifie. Le diff depuis
`aa6c6c4c` est la proposition de correction exportable, pas une activation.

## Contrats compares

| Etape | Source locale | Contrat et conclusion |
| --- | --- | --- |
| CSV simple | `n8n/workflows/full_csv_claims_pipeline.json`, noeud Code | Trois noeuds : Webhook, Code, HTTP. Alias de champs, normalisation des en-tetes, virgules, guillemets echappes et champs multilignes |
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
d'idempotence automatiquement. Aucun correctif de sauvegarde n'est livre ici.

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

Recette actuelle executee : **26 reussites, 1 echec attendu strict, 1 test ignore**.
La recette initiale comptait 14 reussites, 2 echecs attendus et 1 test ignore.
Le `xfail(strict=True, raises=AssertionError)` restant documente l'ecart SQL :
ce n'est pas un test reussi du comportement souhaite. Sa correction donnera un
`XPASS`, obligeant a reviser son statut. La suite reste verte avec cette limite
connue ; cela ne constitue pas une recette complete du pipeline.

| Cas | Resultat observe | Portee |
| --- | --- | --- |
| CSV nominal, alias, canal, virgules/guillemets et pieces jointes | Reussite | Code CSV original extrait et schema/route API reels en memoire |
| Champ CSV multiligne LF/CRLF, guillemets, virgules et enregistrement suivant | Reussite | Transformation corrigee ; un champ multiligne reste un champ, route ASGI validee en memoire |
| Lignes vides et champs vides | Reussite | Lignes hors champ ignorees, ligne vide interne preservee, champ vide conserve avant validation API |
| CSV malforme, dont guillemets non fermes | Rejet explicite | Erreur CSV_INVALID_FORMAT, aucune sortie partielle ; pas une execution n8n |
| Fichier vide, en-tete seul, texte vide ou cite vide | HTTP 422 | Rejet par le schema reel ; pas de notification ou sauvegarde |
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
3. Faire une revue du diff CSV deja corrige dans cette copie, sans l'importer automatiquement.
4. Recetter la base jetable seulement dans un lot autorise, puis le moteur n8n
   avec substituts avant toute connexion reelle.

Pas de hausse de note ou de nouvelle preuve publique de production issue de ce
lot. Les rapports bruts et empreintes de travail restent dans le dossier prive ;
seuls ce protocole et les tests synthetiques sont destines au versionnement.
