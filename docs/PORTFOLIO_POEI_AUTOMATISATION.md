# Portfolio — Automatisation de processus administratifs

## Présentation

Je conçois des automatisations destinées à réduire les tâches répétitives, améliorer le suivi des dossiers et fiabiliser la circulation des informations entre les outils d’une entreprise.

Ce portfolio présente un projet pratique réalisé autour de la réception, du contrôle et de l’orientation de dossiers administratifs.

## Problématique métier

Lorsqu’une entreprise reçoit de nombreux dossiers par email, formulaire ou fichier CSV, les équipes doivent souvent :

- vérifier manuellement les informations reçues ;
- rechercher les documents manquants ;
- classer et prioriser les demandes ;
- éviter les doublons ;
- prévenir les collaborateurs ou les clients ;
- conserver un historique des actions.

Ces tâches consomment du temps et augmentent le risque d’erreur.

## Solution réalisée

Le système développé automatise le parcours suivant :

```text
Réception d’un dossier
        ↓
Analyse et enrichissement
        ↓
Contrôle de complétude
        ↓
Priorisation et orientation
        ↓
Stockage structuré
        ↓
Notification ou relance
```

## Technologies utilisées

- **n8n** : orchestration des workflows et connexion entre les services ;
- **FastAPI** : API et logique métier ;
- **Supabase/PostgreSQL** : stockage des dossiers, contrôles et historiques ;
- **Postman** : tests des endpoints et validation des réponses ;
- **Python** : traitement des données et automatisation ;
- **Webhooks et API REST** : échanges entre applications.

## Fonctionnalités démontrées

### Réception des données

- réception par webhook ;
- réception de dossiers JSON ;
- traitement de fichiers CSV ;
- transmission vers l’API métier.

### Contrôle des dossiers

- détection des informations manquantes ;
- calcul du taux de complétude ;
- identification des dossiers bloqués ;
- préparation d’un message de relance.

### Orientation

- classification des dossiers ;
- définition d’une priorité ;
- recommandation de l’action suivante ;
- distinction entre traitement normal et traitement nécessitant une attention particulière.

### Stockage et traçabilité

- enregistrement des lots reçus ;
- enregistrement des dossiers individuels ;
- stockage des contrôles documentaires ;
- historique des actions opérateur ;
- vues de suivi pour les équipes.

### Protection contre les doublons

Une clé d’idempotence permet de renvoyer le même dossier sans créer de nouvelle ligne dans la base. Le même identifiant de lot est retourné lors d’un nouvel envoi identique.

## Résultat observé

Le projet a permis de valider un flux complet :

- réception d’une requête ;
- analyse par FastAPI ;
- stockage dans Supabase ;
- contrôle documentaire ;
- journalisation de l’action ;
- vérification d’un second envoi sans création de doublon.

Les résultats présentés correspondent à un environnement de démonstration local et ne constituent pas encore des résultats de production chez un client.

## Compétences mobilisées

- analyse d’un besoin métier ;
- conception d’un workflow automatisé ;
- intégration d’API REST ;
- manipulation de JSON et CSV ;
- développement Python et FastAPI ;
- conception d’un schéma PostgreSQL ;
- configuration de credentials ;
- gestion des erreurs HTTP ;
- tests avec Postman ;
- traçabilité et prévention des doublons ;
- documentation et préparation d’un déploiement client.

## Méthode de déploiement proposée

Pour une entreprise, le projet peut commencer par un pilote limité :

1. analyser un processus précis ;
2. sélectionner un seul type de dossier ;
3. connecter un nombre limité d’outils ;
4. tester avec des données non sensibles ;
5. mesurer le temps gagné et les erreurs évitées ;
6. valider la solution avec l’équipe ;
7. étendre progressivement le périmètre.

## Garanties de cadrage

Le projet doit être adapté aux exigences de l’entreprise concernant :

- les accès et les credentials ;
- la confidentialité des données ;
- la conservation des informations ;
- les droits des utilisateurs ;
- les sauvegardes ;
- les procédures de support ;
- la conformité RGPD lorsque nécessaire.

## Limites actuelles et axes d’amélioration

Les prochaines améliorations prévues sont :

- renforcer les politiques d’accès et le RLS ;
- ajouter une surveillance des erreurs ;
- préparer un déploiement cloud ou serveur ;
- ajouter des notifications email ou Slack en production ;
- enrichir les tests automatisés ;
- créer une interface opérateur ;
- formaliser les sauvegardes et la maintenance.

## Proposition de POEI

Dans le cadre d’une POEI, ce projet peut servir de support pour développer les compétences suivantes :

- compréhension des processus d’entreprise ;
- automatisation no-code et low-code ;
- développement d’API Python ;
- intégration de bases de données ;
- tests et diagnostic d’erreurs ;
- documentation technique ;
- présentation d’une solution à un interlocuteur métier.

L’objectif est de transformer un besoin métier concret en solution automatisée testable, documentée et progressivement déployable.

## Coordonnées

**Nom :** Christopher Fordant  
**Adresse :** 8 Allée des hirondelles, 79230 Vouillé  
**Téléphone :** 07 50 92 84 03  
**Email :** à compléter  
**LinkedIn ou portfolio :** à compléter  
