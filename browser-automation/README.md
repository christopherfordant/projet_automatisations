# Automatisation navigateur sécurisée

Ce dossier prépare Playwright MCP pour inspecter les champs d’un site via son arbre d’accessibilité, avec la vision comme capacité complémentaire.

## Installation et démarrage

Prérequis : Node.js 18 ou plus récent.

Depuis la racine du projet :

```powershell
.\scripts\start_playwright_mcp.ps1
```

Le navigateur Edge s’ouvre dans un profil séparé situé dans `browser-automation/profile/`. Ce profil est ignoré par Git et peut contenir une session connectée. Ne le partage jamais.

La configuration est épinglée sur Playwright MCP `0.0.80` afin d’éviter qu’une mise à jour inattendue ne modifie le comportement de l’outil.

Au premier démarrage, connecte-toi manuellement au site concerné. Aucun mot de passe n’est enregistré dans le projet et aucune publication ne doit être automatisée sans validation humaine.

## Principe de fonctionnement

1. Le navigateur est visible.
2. L’agent lit les labels et les rôles des champs.
3. Il remplit les sections demandées avec les textes préparés dans `docs/LINKEDIN_PROFILE_DRAFT.md`.
4. Il s’arrête avant l’enregistrement final ou la publication.
5. Tu vérifies le contenu et tu valides toi-même.

La capture d’écran n’est utilisée qu’en complément : l’identification principale se fait par les éléments accessibles de la page, ce qui est plus robuste que des coordonnées de pixels.

## Limites et sécurité

- Ne pas lancer l’outil avec ton profil Edge personnel habituel.
- Ne pas fournir de mot de passe à l’agent.
- Ne pas contourner les CAPTCHA, protections anti-abus ou règles du site.
- Ne pas automatiser l’envoi massif de demandes ou de messages.
- Fermer le navigateur et supprimer `browser-automation/profile/` si la session doit être révoquée.
