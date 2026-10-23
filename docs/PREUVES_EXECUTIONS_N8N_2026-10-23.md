# Preuves d'execution n8n : historique et complement isole

Revue du 23 octobre 2026, sources applicatives au commit `724997b1`.
Cette recette complete `RECETTE_PIPELINE_ISOLEE.md`, sans remplacer ses preuves.
Aucune modification du workflow habituel, du portfolio, des notes ou du CV.

## Recherche historique en lecture seule

Sept emplacements SQLite pertinents ont ete consultes sans lancer les anciennes
instances ni lire les credentials. L'instance locale recente ne contient aucune
execution ; cela ne permettait pas de conclure a une absence de pratique.

- Ancienne instance de cours : **32 executions**, dont 24 reussies et 8 erreurs,
  reparties entre le pipeline CSV et un workflow documentaire distinct. Ce ne
  sont pas 32 tests CSV. Les preuves documentaires ne valident pas le CSV.
- Deux sauvegardes contiennent les **memes deux executions CSV** du 7 septembre :
  elles sont dedupliquees, pas comptees comme quatre executions.
- Les autres bases inspectees ne contiennent pas d'execution exploitable.
- Aucun historique Postman exporte probant pour le contrat actuel n'a ete retrouve
  dans les dossiers techniques recherches. Ce constat n'est pas une preuve
  d'absence de tests Postman ou d'autres historiques non consultes.

Les snapshots examines ne contiennent aucun noeud epingle. Les enregistrements
conservent etats, durees et sorties des noeuds ; aucun corps prive n'est publie.
Une execution manuelle peut reprendre des donnees precedentes : elle n'est pas
assimilee a un nouvel appel reseau webhook.

## Matrice des preuves

| Scenario | Preuve, date et version | Environnement / resultat observe | Applicabilite actuelle / complement |
| --- | --- | --- | --- |
| Webhook vers CSV puis API | Cours, execution 23, 04/09/2026, snapshot legacy a 3 noeuds | Mode webhook, trois noeuds reussis | Integration historique etablie ; ne couvre pas les changements recents |
| SQL ajoute au parcours | Cours, executions 24-26, 04/09/2026, snapshot legacy a 4 noeuds | Erreurs SQL 24-25 ; 26 reussie en mode manuel avec appel a 3 arguments | Ancien contrat uniquement ; pas une validation du contrat actuel |
| Parcours CSV avec sauvegarde et rejeu | Sauvegarde, executions 1-2, 07/09/2026 | Mode manuel, quatre noeuds reussis ; entrees et resultats SQL identiques, appel a 4 arguments legacy | Preuve historique de resultat de rejeu coherent ; ni inspection des lignes de l'ancienne base, ni garantie concurrente actuelle |
| CSV multiligne, expressions, schemas API | 41 tests reussis, 1 test PostgreSQL ignore, preuve de `724997b1` | VM Node bornee et FastAPI ASGI en memoire | Reutilises sans campagne complete ; fichiers applicatifs inchanges |
| Transactions, privileges et concurrence SQL | Sept groupes PostgreSQL 12.15, preuve de `724997b1` | Verrous effectivement observes, rollback, rejeu, conflits et permissions | Reutilises ; aucune nouvelle campagne SQL de concurrence |
| Nominal webhook vers CSV multiligne, API puis SQL | Recette moteur du 23/10, executions 1-2 | n8n 2.31.5, API mock locale et PostgreSQL 12.15 ; texte multiligne controle en base ; rejeu meme UUID, aucun ajout | Complete le raccordement du code actuel, pas la production |
| Cle absente ou invalide | Recette moteur, executions 3-4 | Echec dans le garde de cle, avant le noeud HTTP ; base inchangee | Version actuelle verifiee |
| Meme cle, document different | Recette moteur, execution 5 | Conflit dans le noeud SQL ; aucun ajout en base | Version actuelle verifiee |
| Deux envois identiques simultanes | Recette moteur, executions 6-7 | Deux reponses avec meme UUID ; un seul nouveau lot et une seule nouvelle cle | Raccordement concurrent verifie ; preuve des verrous SQL reutilisee, pas mesure exhaustive des entrelacements |
| Erreur API | Recette moteur, execution 9 | Erreur 503 injectee localement, echec au noeud HTTP ; reponse webhook 500 ; base inchangee | Propagation actuelle verifiee, pas incident fournisseur reel |
| Echec de sauvegarde | Recette moteur, execution 10 | Champ entier invalide injecte dans la reponse mock ; echec SQL et rollback ; base inchangee | Echec de cast teste ; ne couvre pas toutes les pannes reseau ou serveur |
| Resultat commis non utilise puis rejeu | Recette SQL anterieure de `724997b1` | Reponse ignoree par le client, UUID retrouve au rejeu | Reutilisee ; aucune coupure reseau n8n pendant COMMIT n'a ete provoquee |

## Perimetre du complement moteur

Une instance neuve, un dossier n8n distinct et une base jetable initialement vide
ont ete crees avec les outils installes. Aucun credential ou session existant
n'a ete copie. Le role de test n'a recu que l'acces au wrapper SQL a quatre
arguments. Schemas 001/002/003 charges dans la base jetable uniquement.

Seules adaptations de l'export pour la recette privee : identite du workflow,
chemin webhook, adresse API loopback et reference au credential SQL jetable.
Parseur, garde de cle, expressions SQL et code applicatif restent inchanges.
FastAPI charge les routes et services reels avec fournisseur impose a mock et
store disque substitue. Les erreurs API/SQL sont des injections explicites du
banc ; aucun service tiers n'a ete appele. Les connexions sortantes de l'API
etaient bloquees ; n8n avait un garde de connexions loopback. Une tentative de
rafraichissement du catalogue MCP n8n a ete bloquee par ce garde.

**Dix executions moteur conservees : cinq reussites et cinq erreurs attendues.**
Les cinq reussites comprennent un essai d'injection initial mal cible : le banc
utilisait source_name, que le noeud HTTP ne transmet pas a l'API. Cet essai a
normalement sauvegarde un troisieme lot et n'est pas revendique comme test
d'erreur. L'injection corrigee cible un identifiant synthetique present dans items.
Seuls les deux cas d'erreur restants ont ensuite ete executes, sans rejouer les
scenarios deja confirmes. Etat final : trois lots, trois dossiers, trois cles.
Un appel avant activation a recu 404 et n'a cree aucune
execution ; il n'est pas compte parmi les dix.

Les services temporaires n8n, API et PostgreSQL ont ete arretes apres verification.
Les rapports, snapshots, journaux, comptes jetables, empreintes et scripts du banc
restent dans le dossier prive de preuves, hors depot public. Aucun export de
compte, payload historique prive ou secret n'est ajoute ici.

## Limites et prochaine action

- Pas de validation de la base distante, des permissions du compte habituel,
  d'une API ou IA reelle, ni d'un deploiement.
- Pas de preuve d'exactly-once sur l'ensemble du pipeline : le contrat SQL porte
  sur une meme cle et un meme document de sauvegarde. Une reponse IA differente
  avec la meme cle peut produire un conflit, sans second lot.
- Aucun retry automatique apres resultat incertain et aucune purge du registre.
- La migration et l'export ne sont toujours pas actives dans l'instance habituelle.

Prochaine action : revue du plan d'integration et des privileges cibles, puis
decision explicite avant toute migration ou modification de l'instance habituelle.
La recette isolee ne justifie pas, a elle seule, une hausse des notes du portfolio.
