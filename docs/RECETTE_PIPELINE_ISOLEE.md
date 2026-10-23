# Recette locale isolee du pipeline CSV

Etat du 23 octobre 2026. Aucun import ou execution du workflow connecte, aucune
modification des credentials, des sources Python ou d'une base existante. Les
exports et la migration ci-dessous restent sur la branche de recette. Le CV
original a ete retabli dans le portfolio par un lot distinct explicitement demande.

## Decisions et sources

- `55e4774a` introduisait une fonction SQL a trois arguments ;
- `docs/N8N_SUPABASE_FLOW.md`, section Fonction SQL de stockage batch, decrit
  source_name, imported_by et le JSON complet retourne par FastAPI ;
- `f53560d9` ajoute un export a quatre arguments dont le dernier lit le nom du
  fichier, et un document portfolio annoncant le rejeu sans doublon. La migration
  correspondante n'a pas ete retrouvee dans l'historique SQL consulte ;
- le premier diagnostic a donc reproduit un ecart local sans conclure a une panne
  de la base installee ;
- apres la proposition de retirer un argument inutile, l'instruction utilisateur
  la plus recente exige une garantie d'idempotence. Le contrat retenu comporte
  donc **quatre arguments utiles**, avec une cle explicite distincte du fichier.

Le nom du fichier reste la metadonnee source_name du premier argument. Aucune
cle n'est derivee automatiquement du nom de fichier. Le client doit fournir une
cle stable pour les retries d'une meme sauvegarde.

## Contrat retenu dans la copie isolee

| Position | Valeur | Sens |
| --- | --- | --- |
| 1 | source_name normalise du noeud CSV | Nom du fichier ou repli csv_pipeline_import |
| 2 | n8n | Auteur technique existant |
| 3 | JSON.stringify de la reponse API complete | Payload de sauvegarde |
| 4 | idempotency_key explicite du webhook, validee | Identite stable de la sauvegarde, jamais le nom de fichier |

La variante avec sauvegarde contient maintenant cinq noeuds : Webhook, parseur
CSV, Require Idempotency Key, HTTP, Postgres. Le nouveau garde refuse une cle
absente, non textuelle, vide, avec espaces peripheriques ou depassant 200 caracteres,
avant l'appel HTTP. Aucun nouvel endpoint ou credential n'est ajoute. La variante
simple a trois noeuds reste distincte et n'offre pas de sauvegarde idempotente.
Le noeud Code CSV est identique dans les deux variantes.

`003_claim_batch_idempotency.sql` ajoute une surcharge a quatre arguments autour
du helper historique a trois arguments. Un registre a cle primaire unique est
insere puis verrouille dans la meme transaction que le lot :

- meme cle et memes valeurs JSONB/source/auteur : meme UUID retourne ;
- meme cle et document different : conflit explicite, aucune nouvelle sauvegarde ;
- echec de sauvegarde : rollback du lot et de la reservation de cle ;
- envois concurrents : attente sur le verrou, puis relecture du resultat commis ;
- aucune expiration ni purge automatique des cles.

La comparaison porte sur les valeurs JSONB completes, source et auteur compris,
pas sur leur ordre textuel de cles. L'ordre des tableaux reste significatif.
Une reponse IA regeneree et differente avec la meme cle provoque donc un conflit,
jamais une nouvelle ligne silencieuse. Il ne s'agit pas d'une deduplication globale
par contenu ni d'une garantie d'absence de facturation/appel IA repete.

Le role PUBLIC perd l'execution des deux signatures et l'acces au registre. La
nouvelle fonction SECURITY DEFINER a un search_path fixe et le registre active RLS.
Une autorisation de service explicite devra etre accordee au role reel, qui n'est
pas devine ici. Les privileges existants d'une base cible restent a auditer :
aucune validation globale Supabase/RLS ou du role de production n'est revendiquee.

**Portee de la garantie :** au plus un lot commis par cle, pour les appels a la
fonction a quatre arguments avec registre conserve et non modifie hors du
mecanisme. Les ecritures directes d'un administrateur, le helper legacy utilise
hors de ce contrat, les effets externes et le moteur n8n ne sont pas couverts.
Une transaction externe peut encore annuler un UUID retourne avant son commit.
Le registre ne doit pas etre purge ou ses cles reutilisees sans revoir la garantie.

## Correction CSV preservee

Le parseur lit le texte entier en maintenant l'etat des guillemets : LF/CRLF
internes conserves, virgules et guillemets doubles supportes, lignes vides ignorees
hors champ et conservees dedans. Mapping, alias et valeurs par defaut restent
identiques. CSV malforme : CSV_INVALID_FORMAT, aucune sortie partielle. La
propagation de cette erreur dans le moteur n8n n'a pas ete recettee.

## Suite hors base, sans services

Depuis la copie isolee, utiliser l'interpreteur existant du projet et Node :

```powershell
$env:PYTHONPATH=(Join-Path (Get-Location) 'src')
$env:PYTHONDONTWRITEBYTECODE='1'
python -m pytest tests/isolated_pipeline -q -rxXs -p no:cacheprovider
```

Resultat courant : **41 reussites, 1 test PostgreSQL ignore dans cette suite**.
Aucun echec attendu restant. Les deux anciens xfail CSV/SQL sont resolus dans la
copie par des modifications et des tests de comportement, pas par leur masquage.

Le vrai routeur/schema/service FastAPI est charge en memoire, le store disque
substitue et le fournisseur impose a mock. ASGITransport intercepte offline.invalid.
Connexions/DNS Python interdits pendant les tests ; une boucle asyncio Windows
cree son socketpair local interne avant le garde. Le code CSV, le garde de cle et
l'expression reelle des parametres sont executes dans une VM Node bornee, sans
require/process/fetch ni environnement utilisateur herite. Ce banc ne lance ni
n8n, ni API externe, ni Postgres. La VM n'est pas une sandbox pour du code arbitraire.

Couverture : CSV nominal/multiligne/alias/guillemets, rejet422 du vide, erreurs
fournisseur et timeout injectes, signalement intra-lot sans suppression, ordre et
format des quatre arguments, fallback source_name et rejet de cle avant HTTP.
Les tests de persistance memoire restent des illustrations, pas une preuve SQL.

## Preuve PostgreSQL reelle separee

`tests/isolated_pipeline/run_postgres_idempotency.py` est une recette opt-in, sans
installation ou demarrage automatique. Executee sur PostgreSQL **12.15** deja
installe, dans un cluster temporaire cree pour ce lot, lie uniquement a127.0.0.1,
base vide n8n_recipe_disposable et donnees synthetiques. Cluster arrete apres recette.
Aucune connexion a une base ou a un compte existant, aucun credential applicatif.

Le script exige --psql, --port et --confirm-disposable, refuse une base non vide,
ignore les configurations personnelles psql et n'herite pas des variables PG ou
des mots de passe. Il charge001/002/003 uniquement dans cette base jetable.
Ne pas le diriger vers une base existante ou Supabase.

Sept groupes de controles reussis :
1. rejeu identique et ordre textuel JSON different : meme UUID ;
2. meme cle avec contenu different : conflit ;
3. cle/payload invalides : rejet ;
4. echec de cast SQL : aucune reservation/lot residuel, retry corrige possible ;
5. **verrouillage concurrent reel observe** : deux envois identiques, conflit de
   contenu, puis annulation de la premiere transaction avec reprise du second ;
6. resultat commis ignore par le client puis rejeu : UUID enregistre retrouve ;
7. role de service explicitement autorise : fonction4 accessible, registre et
   helper3 directs refuses. Sept lots et sept cles finales, aucune cle incomplete.

Ce sont des tests finis et des contraintes transactionnelles locales, pas une
recette de production ou de tous les interleavings possibles. Le niveau d'isolation
READ COMMITTED par defaut a ete teste ; aux autres niveaux, des erreurs de
serialisation peuvent imposer une reprise avec la meme cle. Le script laisse les
preuves synthetiques dans la base jetable jusqu'a son archivage, sans les publier.
Le vieux postgres_recipe.sql reste un protocole legacy a trois arguments non
execute ; il n'est pas la preuve d'idempotence et ne charge pas la migration003.

## Livraison et prochaine etape

Rapports bruts et empreintes hors depot public. Seuls tests, migration, protocole
et correction de l'export deja suivi sont versionnes. Aucun import, activation,
fusion, deploiement du pipeline ou modification des notes.

Prochaine etape : revue de la migration et des privileges du role cible, puis
recette du moteur n8n dans un environnement sans effets externes avec une cle
stable. Ne pas annoncer cette garantie active sur le workflow connecte avant
migration/import/permissions/recette correspondants.
