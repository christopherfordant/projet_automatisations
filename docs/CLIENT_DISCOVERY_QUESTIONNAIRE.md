# Questionnaire de découverte client — Automatisation

## 1. Contexte de l’entreprise

- Nom de l’entreprise :
- Contact principal et fonction :
- Activité principale :
- Équipe concernée :
- Processus concerné :
- Pourquoi souhaitez-vous automatiser ce processus ?
- Quel problème doit être résolu en priorité ?

## 2. Processus actuel

- Comment le processus fonctionne-t-il aujourd’hui, étape par étape ?
- Qui reçoit les demandes entrantes ?
- Qui vérifie ou traite les données ?
- Qui prend la décision finale ?
- Combien de temps prend actuellement un dossier ?
- Quelles tâches sont répétitives ou manuelles ?
- Quelles erreurs se produisent le plus souvent ?
- À quels moments le processus est-il bloqué ?
- Existe-t-il des exceptions ou des cas particuliers ?

## 3. Données entrantes

- D’où viennent les données : formulaire, email, CSV, API, CRM, téléphone ?
- Quel est le format reçu : JSON, CSV, PDF, image, texte libre ?
- Quels champs sont obligatoires ?
- Quels champs sont facultatifs ?
- Les pièces jointes sont-elles nécessaires ?
- Quels documents doivent être contrôlés ?
- Comment reconnaît-on un dossier ou un client unique ?
- Quel identifiant doit servir de clé anti-doublon ?
- Combien de dossiers sont reçus par jour ou par mois ?
- Les volumes augmentent-ils à certaines périodes ?

## 4. Résultat attendu

- Que doit-il se passer après la réception d’un dossier ?
- Quelles données doivent être nettoyées ou enrichies ?
- Comment calculer le statut du dossier ?
- Comment calculer la priorité ?
- Quels dossiers doivent être bloqués ?
- Quels dossiers peuvent être orientés automatiquement ?
- Quels dossiers nécessitent une validation humaine ?
- Quel résultat doit recevoir le client final ?
- Quel résultat doit recevoir l’équipe interne ?

## 5. Règles métier

- Quelles conditions rendent un dossier complet ?
- Quels documents sont obligatoires par type de dossier ?
- Quels mots-clés indiquent une urgence ou une réclamation ?
- Quels critères déterminent la priorité ?
- Quelles situations nécessitent une escalade ?
- Quels statuts doivent exister ?
- Quelles actions correspondent à chaque statut ?
- Que doit faire le système en cas de donnée invalide ?
- Que doit faire le système en cas de doublon ?
- Quelles décisions doivent toujours rester humaines ?

## 6. Outils et connexions

- Quels outils utilisez-vous déjà ?
- Disposez-vous d’un CRM, ERP, tableur ou logiciel métier ?
- Quel outil reçoit les données ?
- Où doivent-elles être stockées ?
- Quel outil doit envoyer les notifications ?
- Faut-il connecter un email, Slack, Teams ou SMS ?
- Existe-t-il une API disponible ?
- Avez-vous la documentation de l’API ?
- Qui peut fournir les credentials ?
- Les credentials seront-ils dédiés à l’automatisation ?

## 7. Notifications et relances

- Qui doit être averti lorsqu’un dossier arrive ?
- Qui doit être averti lorsqu’un dossier est bloqué ?
- Qui doit recevoir les documents manquants ?
- Par quel canal : email, Slack, Teams, SMS ou autre ?
- Quel message doit être envoyé ?
- Le message doit-il être automatique ou validé par un opérateur ?
- Faut-il relancer après un délai ?
- Combien de relances doivent être envoyées ?
- Quand faut-il arrêter les relances ?

## 8. Sécurité et conformité

- Les données contiennent-elles des informations personnelles ou médicales ?
- Existe-t-il des obligations RGPD ou sectorielles ?
- Où les données peuvent-elles être hébergées ?
- Combien de temps doivent-elles être conservées ?
- Qui peut consulter les données ?
- Qui peut modifier ou supprimer les données ?
- Faut-il conserver un historique des actions ?
- Faut-il utiliser une authentification ou un contrôle d’accès ?
- Les données doivent-elles être chiffrées ?
- Existe-t-il une procédure de suppression ou d’export des données ?

## 9. Déploiement et maintenance

- Le client veut-il un hébergement cloud ou local ?
- Qui administrera n8n et la base de données ?
- Qui sera responsable des credentials ?
- Qui recevra les alertes techniques ?
- Quel niveau de disponibilité est attendu ?
- Faut-il prévoir une sauvegarde ?
- Faut-il prévoir un environnement de test séparé ?
- Comment les modifications seront-elles validées ?
- Qui peut demander une évolution ?
- Quel délai de support est attendu ?

## 10. Tests et validation

- Quel exemple réel peut servir de test ?
- Quel résultat est considéré comme réussi ?
- Quels cas incomplets faut-il tester ?
- Quels cas urgents faut-il tester ?
- Quels doublons faut-il tester ?
- Que doit-il se passer en cas d’erreur d’API ?
- Qui valide le résultat final ?
- Combien de jours de recette sont prévus ?
- Quels indicateurs permettront de mesurer le succès ?

## 11. Périmètre commercial

- Quelle est la priorité numéro un ?
- Qu’est-ce qui est inclus dans la première version ?
- Qu’est-ce qui est explicitement hors périmètre ?
- Quel est le budget prévu ?
- Quelle est la date souhaitée de mise en service ?
- Le client préfère-t-il un forfait ou un abonnement de maintenance ?
- Quelles évolutions pourront être proposées plus tard ?

## 12. Synthèse à remplir après l’entretien

- Problème principal :
- Processus choisi :
- Sources de données :
- Outils à connecter :
- Workflow modèle retenu :
- Champs obligatoires :
- Règles métier principales :
- Destinataires des notifications :
- Clé anti-doublon :
- Données sensibles :
- Stockage choisi :
- Tests à réaliser :
- Livrables prévus :
- Hors périmètre :
- Prochaine étape :
