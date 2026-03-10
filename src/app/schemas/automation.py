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


class DocumentCompletenessRequest(BaseModel):
    document_type: str = Field(..., description="Type de dossier ou document a verifier")
    carrier_profile: str | None = Field(default="generic", description="Entreprise ou mutuelle cible")
    customer_id: str | None = Field(default=None, description="Identifiant client si connu")
    contract_id: str | None = Field(default=None, description="Reference dossier si connue")
    document_text: str = Field(..., description="Texte libre ou contexte du dossier")
    attached_documents: list[str] = Field(default_factory=list, description="Pieces deja declarees")
    message_tone: str = Field(default="neutral", description="Ton du message client a generer")
    output_channel: str = Field(default="email", description="Canal de sortie du message client")
    web_lookup_enabled: bool = Field(
        default=False,
        description="Active une recherche de guidance sur des sources web officielles autorisees",
    )
    provider: str | None = Field(default=None, description="Provider IA a utiliser")


class ClaimIntakeRequest(BaseModel):
    carrier_profile: str | None = Field(default="generic", description="Entreprise ou mutuelle cible")
    customer_id: str | None = Field(default=None, description="Identifiant client si connu")
    contract_id: str | None = Field(default=None, description="Reference contrat si connue")
    channel: str = Field(default="email", description="Canal d'entree")
    claim_text: str = Field(..., description="Demande ou signalement entrant")
    attached_documents: list[str] = Field(default_factory=list, description="Liste descriptive des pieces")
    web_lookup_enabled: bool = Field(
        default=False,
        description="Active une recherche de guidance sur des sources web officielles autorisees",
    )
    provider: str | None = Field(default=None, description="Provider IA a utiliser")


class ClaimIntakeBatchRequest(BaseModel):
    items: list[ClaimIntakeRequest] = Field(..., min_length=1, description="Liste des dossiers a traiter")


class FollowupAssistantRequest(BaseModel):
    carrier_profile: str | None = Field(default="generic", description="Entreprise cible")
    followup_type: str = Field(
        default="missing_document",
        description="Type de relance: invoice, quote, missing_document",
    )
    customer_id: str | None = Field(default=None, description="Identifiant client si connu")
    contract_id: str | None = Field(default=None, description="Reference dossier si connue")
    recipient_name: str | None = Field(default=None, description="Nom du destinataire si connu")
    channel: str = Field(default="email", description="Canal d'entree")
    context_text: str = Field(..., description="Contexte libre du dossier ou de la relance")
    attached_documents: list[str] = Field(default_factory=list, description="Pieces deja recues")
    expected_documents: list[str] = Field(default_factory=list, description="Pieces attendues si connues")
    outstanding_amount: float | None = Field(default=None, description="Montant en attente si pertinent")
    days_overdue: int | None = Field(default=None, description="Nombre de jours de retard")
    message_tone: str = Field(default="neutral", description="Ton du message client")
    output_channel: str = Field(default="email", description="Canal de sortie")
    provider: str | None = Field(default=None, description="Provider IA a utiliser")


class GammaBriefRequest(BaseModel):
    carrier_profile: str | None = Field(default="generic", description="Entreprise cible")
    title: str = Field(..., description="Titre du livrable a generer")
    audience: str = Field(default="direction", description="Audience cible")
    objective: str = Field(..., description="Objectif du livrable")
    source_module: str = Field(default="claims_intake", description="Module source")
    source_context: str = Field(..., description="Contexte ou resultat source")
    key_points: list[str] = Field(default_factory=list, description="Points cles a mettre en avant")
    output_type: str = Field(default="presentation", description="presentation, document ou webpage")
    provider: str | None = Field(default=None, description="Provider IA a utiliser pour enrichir le resume")


class OperatorActionLogEntry(BaseModel):
    timestamp: str
    action: str
    source: str
    caseRef: str
    detail: str


class OperatorStatePayload(BaseModel):
    manual_status_overrides: dict[str, dict[str, str]] = Field(default_factory=dict)
    action_log_entries: list[OperatorActionLogEntry] = Field(default_factory=list)
    last_batch_items: list[dict[str, object]] = Field(default_factory=list)
    selected_item_key: str = Field(default="")
