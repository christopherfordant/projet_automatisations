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


class ClaimIntakeRequest(BaseModel):
    customer_id: str | None = Field(default=None, description="Identifiant client si connu")
    contract_id: str | None = Field(default=None, description="Reference contrat si connue")
    channel: str = Field(default="email", description="Canal d'entree")
    claim_text: str = Field(..., description="Demande ou signalement entrant")
    attached_documents: list[str] = Field(default_factory=list, description="Liste descriptive des pieces")
    provider: str | None = Field(default=None, description="Provider IA a utiliser")


class ClaimIntakeBatchRequest(BaseModel):
    items: list[ClaimIntakeRequest] = Field(..., min_length=1, description="Liste des dossiers a traiter")
