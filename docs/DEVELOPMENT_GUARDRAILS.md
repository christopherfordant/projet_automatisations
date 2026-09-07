# Garde-fous de développement

## Pourquoi

L’automatisation et l’IA accélèrent la production, mais elles ne garantissent ni la pertinence métier, ni la sécurité, ni la responsabilité. Ce projet applique donc une règle simple : toute modification importante doit être lisible, testée, traçable et validée par une personne.

## Cycle recommandé

```text
Besoin métier
    ↓
Règles et cas limites
    ↓
Implémentation minimale
    ↓
Tests automatisés
    ↓
Revue humaine
    ↓
Pilote limité
    ↓
Mesure et décision
```

## Les quatre protections

1. **Comprendre** : la demande, les données et les conséquences sont documentées.
2. **Vérifier** : les règles métier importantes ont un test reproductible.
3. **Tracer** : les décisions d’architecture, versions et changements sont conservés.
4. **Répondre de** : une personne valide les actions sensibles et le passage en production.

## Limites actuelles

Le projet reste une base de démonstration locale. Avant usage client, il faut compléter la gestion des rôles, les politiques RLS, la rotation des secrets, les sauvegardes, la supervision et l’analyse RGPD.
