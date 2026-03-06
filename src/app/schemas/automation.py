from pydantic import BaseModel, Field


class AutomationRequest(BaseModel):
    workflow_name: str = Field(..., description="Nom du workflow metier")
    customer_context: str = Field(..., description="Contexte client ou contrat")
    raw_input: str = Field(..., description="Texte ou instruction entrante")
    provider: str | None = Field(default=None, description="Provider IA a utiliser")


class DocumentAnalysisRequest(BaseModel):
    document_name: str
    document_text: str
    expected_output: str = Field(
        default="Resume, points critiques, donnees structurees",
        description="Format attendu de l'analyse",
    )
    provider: str | None = None

