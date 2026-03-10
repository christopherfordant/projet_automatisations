from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CompanyWorkflowProfile:
    code: str
    label: str
    target_company: str
    positioning: str
    priority_workflows: list[str]
    workflow_labels: dict[str, str]


COMPANY_WORKFLOW_CATALOG: dict[str, CompanyWorkflowProfile] = {
    "generic": CompanyWorkflowProfile(
        code="generic",
        label="Pole mutuelles de Niort",
        target_company="Tronc commun",
        positioning="Socle commun pour reception, completude, priorisation et routage.",
        priority_workflows=[
            "shared_claims_intake",
            "shared_document_completeness",
            "shared_operator_supervision",
        ],
        workflow_labels={
            "shared_claims_intake": "Qualification reception mutualiste",
            "shared_document_completeness": "Controle de completude documentaire",
            "shared_operator_supervision": "Pilotage operateur transverse",
        },
    ),
    "maaf": CompanyWorkflowProfile(
        code="maaf",
        label="MAAF",
        target_company="MAAF",
        positioning="Accent sur prestations sante, remboursements et devis standardises.",
        priority_workflows=[
            "maaf_prestations_sante",
            "maaf_devis_optique_dentaire",
            "maaf_relances_remboursement",
        ],
        workflow_labels={
            "maaf_prestations_sante": "Pre-instruction prestations sante",
            "maaf_devis_optique_dentaire": "Controle devis optique et dentaire",
            "maaf_relances_remboursement": "Priorisation des relances remboursement",
        },
    ),
    "macif": CompanyWorkflowProfile(
        code="macif",
        label="MACIF",
        target_company="MACIF",
        positioning="Accent sur reclamations, delais de traitement et distribution des flux entrants.",
        priority_workflows=[
            "macif_reclamations_sensibles",
            "macif_distribution_flux_entrants",
            "macif_suivi_delais_sociataires",
        ],
        workflow_labels={
            "macif_reclamations_sensibles": "Triage des reclamations sensibles",
            "macif_distribution_flux_entrants": "Distribution des activites entrantes",
            "macif_suivi_delais_sociataires": "Suivi des retards et relances adherents",
        },
    ),
    "maif": CompanyWorkflowProfile(
        code="maif",
        label="MAIF",
        target_company="MAIF",
        positioning="Accent sur accompagnement contextualise, sinistres et coordination de dossiers complexes.",
        priority_workflows=[
            "maif_accompagnement_contextuel",
            "maif_dossiers_urgents_sante",
            "maif_coordination_multi_echanges",
        ],
        workflow_labels={
            "maif_accompagnement_contextuel": "Accompagnement contextuel du sociataire",
            "maif_dossiers_urgents_sante": "Prise en charge des dossiers urgents sante",
            "maif_coordination_multi_echanges": "Coordination des dossiers a echanges multiples",
        },
    ),
    "niort_lab": CompanyWorkflowProfile(
        code="niort_lab",
        label="Plateforme Niort Lab",
        target_company="Plateforme cible",
        positioning="Version plateforme multi-entreprise pour industrialiser plusieurs workflows cibles.",
        priority_workflows=[
            "niortlab_orchestration_multi_mutuelle",
            "niortlab_batch_supervision",
            "niortlab_connecteurs_entree_reels",
        ],
        workflow_labels={
            "niortlab_orchestration_multi_mutuelle": "Orchestration multi-mutuelle par workflow",
            "niortlab_batch_supervision": "Supervision batch et files operateur",
            "niortlab_connecteurs_entree_reels": "Connecteurs email, depot, API et SFTP",
        },
    ),
}


def get_company_workflow_profile(code: str | None) -> CompanyWorkflowProfile:
    normalized = (code or "generic").strip().lower()
    return COMPANY_WORKFLOW_CATALOG.get(normalized, COMPANY_WORKFLOW_CATALOG["generic"])
