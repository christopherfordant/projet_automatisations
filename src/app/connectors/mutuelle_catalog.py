from app.connectors.base import ConnectorSpec


CONNECTOR_CATALOG = [
    ConnectorSpec(
        name="claims_intake",
        purpose="Qualification initiale et routage d'une demande",
        input_contract="texte libre, metadata client, documents",
        output_contract="priorite, categorie, resume, prochaine action",
    ),
    ConnectorSpec(
        name="document_structuring",
        purpose="Extraction structuree depuis contrats, devis et courriers",
        input_contract="document brut et contexte metier",
        output_contract="json normalise et points d'attention",
    ),
]

