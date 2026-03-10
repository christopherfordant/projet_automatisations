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
        label="TPE/PME Niort",
        target_company="Tronc commun PME",
        positioning="Socle commun pour reception, completude, priorisation et relance des dossiers administratifs.",
        priority_workflows=[
            "shared_claims_intake",
            "shared_document_completeness",
            "shared_operator_supervision",
        ],
        workflow_labels={
            "shared_claims_intake": "Tri administratif entrant",
            "shared_document_completeness": "Controle de completude documentaire",
            "shared_operator_supervision": "Pilotage back-office transverse",
        },
    ),
    "service_b2b": CompanyWorkflowProfile(
        code="service_b2b",
        label="Services B2B",
        target_company="PME services",
        positioning="Accent sur mails entrants, pieces manquantes, reclamations client et priorisation des demandes SAV ou administratives.",
        priority_workflows=[
            "service_b2b_tri_demandes",
            "service_b2b_relances_pieces",
            "service_b2b_reclamations_clients",
        ],
        workflow_labels={
            "service_b2b_tri_demandes": "Tri des demandes clients et SAV",
            "service_b2b_relances_pieces": "Relances de pieces manquantes",
            "service_b2b_reclamations_clients": "Gestion des reclamations clients",
        },
    ),
    "immobilier_syndic": CompanyWorkflowProfile(
        code="immobilier_syndic",
        label="Immobilier / Syndic",
        target_company="Agence ou syndic",
        positioning="Accent sur dossiers locataires, devis, sinistres, pieces manquantes et suivi des echanges proprietaires ou locataires.",
        priority_workflows=[
            "immobilier_suivi_dossiers_locatifs",
            "immobilier_dossiers_incomplets",
            "immobilier_sinistres_urgents",
        ],
        workflow_labels={
            "immobilier_suivi_dossiers_locatifs": "Suivi des dossiers locatifs",
            "immobilier_dossiers_incomplets": "Relances sur dossiers incomplets",
            "immobilier_sinistres_urgents": "Priorisation des sinistres et urgences",
        },
    ),
    "negoce_adv": CompanyWorkflowProfile(
        code="negoce_adv",
        label="Negoce / ADV",
        target_company="PME commerce",
        positioning="Accent sur commandes, devis, facturation, litiges de livraison et coordination ADV.",
        priority_workflows=[
            "negoce_traitement_commandes",
            "negoce_suivi_facturation_clients",
            "negoce_litiges_commandes",
        ],
        workflow_labels={
            "negoce_traitement_commandes": "Preparation des commandes et demandes entrantes",
            "negoce_suivi_facturation_clients": "Suivi facturation et relances clients",
            "negoce_litiges_commandes": "Gestion des litiges commandes et livraisons",
        },
    ),
    "cabinet_gestion": CompanyWorkflowProfile(
        code="cabinet_gestion",
        label="Cabinet de gestion",
        target_company="Cabinet administratif",
        positioning="Accent sur preparation de dossiers, collecte de justificatifs, relances et priorisation administrative.",
        priority_workflows=[
            "cabinet_preparation_dossiers",
            "cabinet_pieces_comptables_manquantes",
            "cabinet_priorisation_dossiers",
        ],
        workflow_labels={
            "cabinet_preparation_dossiers": "Preparation des dossiers clients",
            "cabinet_pieces_comptables_manquantes": "Relances de justificatifs et pieces comptables",
            "cabinet_priorisation_dossiers": "Priorisation des dossiers a traiter",
        },
    ),
    "niort_lab": CompanyWorkflowProfile(
        code="niort_lab",
        label="Plateforme Niort Lab",
        target_company="Plateforme cible",
        positioning="Version plateforme multi-entreprise pour industrialiser plusieurs workflows back-office cibles.",
        priority_workflows=[
            "niortlab_orchestration_multi_entreprise",
            "niortlab_batch_supervision",
            "niortlab_connecteurs_entree_reels",
        ],
        workflow_labels={
            "niortlab_orchestration_multi_entreprise": "Orchestration multi-entreprise par workflow",
            "niortlab_batch_supervision": "Supervision batch et files operateur",
            "niortlab_connecteurs_entree_reels": "Connecteurs email, depot, API et SFTP",
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
}


def get_company_workflow_profile(code: str | None) -> CompanyWorkflowProfile:
    normalized = (code or "generic").strip().lower()
    return COMPANY_WORKFLOW_CATALOG.get(normalized, COMPANY_WORKFLOW_CATALOG["generic"])
