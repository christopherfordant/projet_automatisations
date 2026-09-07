# Règles de contribution

## Principe

Une réponse produite par un modèle ou une modification locale est une proposition, pas une preuve. Toute évolution doit être vérifiable par un test, une revue ou une démonstration reproductible.

## Avant toute modification

1. Décrire le besoin métier et le résultat attendu.
2. Identifier les données concernées et leur niveau de sensibilité.
3. Définir les cas nominaux, les erreurs et les cas limites.
4. Préciser ce qui doit rester sous validation humaine.

## Avant commit

Exécuter depuis la racine :

```powershell
.\scripts\quality_check.ps1
```

Le contrôle vérifie Ruff, les tests Python, le formatage, les workflows n8n JSON et l’état du diff Git.

## Règles de développement

- ne jamais mettre de secret ou de credential dans le code ou un workflow exporté ;
- utiliser des données fictives pour les tests ;
- conserver une séparation entre prototype local et déploiement client ;
- ajouter un test pour chaque règle métier importante ;
- documenter les décisions qui ont un impact d’architecture ou de sécurité ;
- ne pas publier automatiquement un message client ou une action sensible sans validation explicite ;
- préférer une modification petite, réversible et documentée.

## Revue humaine obligatoire

Une revue humaine est requise avant :

- l’envoi d’un message à un client ;
- la suppression ou modification de données ;
- le changement d’un credential ;
- le déploiement en production ;
- l’activation d’un workflow planifié ;
- l’utilisation de données personnelles réelles.
