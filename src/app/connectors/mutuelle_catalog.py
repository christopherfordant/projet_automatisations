from app.connectors.base import ConnectorSpec


CONNECTOR_CATALOG = [
    ConnectorSpec(
        name="claims_intake",
        purpose="Qualification initiale, priorisation et routage d'une demande de gestion",
        input_contract="texte libre, metadata client, canal, reference dossier, documents",
        output_contract="priorite, categorie, resume, informations manquantes, prochaine action",
    ),
    ConnectorSpec(
        name="document_structuring",
        purpose="Extraction structuree depuis contrats, devis et courriers",
        input_contract="document brut et contexte metier",
        output_contract="json normalise et points d'attention",
    ),
]
