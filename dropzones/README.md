Depose ici les fichiers surveilles en local.

Structure recommandee:

- `dropzones/incoming`: fichiers a traiter par le watcher
- `dropzones/archive`: fichiers traites avec succes
- `dropzones/error`: fichiers en erreur

Formats pris en charge par `scripts/watch_claims_drop_folder.ps1`:

- `.csv`: envoi vers le pipeline CSV complet `n8n`
- `.json` avec `items`: envoi vers le webhook batch
- `.json` avec `document_type`: envoi vers le webhook documentaire
- `.json` simple: envoi vers le webhook `claims intake`
