const form = document.getElementById("claims-form");
const documentForm = document.getElementById("document-form");
const followupForm = document.getElementById("followup-form");
const gammaForm = document.getElementById("gamma-form");
const fillDocumentExample = document.getElementById("fill-document-example");
const fillFollowupExample = document.getElementById("fill-followup-example");
const fillGammaExample = document.getElementById("fill-gamma-example");
const carrierProfileSelect = document.getElementById("carrier-profile");
const carrierProfileReadonly = document.getElementById("carrier-profile-readonly");
const carrierBadge = document.getElementById("carrier-badge");
const carrierTitle = document.getElementById("carrier-title");
const carrierDescription = document.getElementById("carrier-description");
const carrierFocusList = document.getElementById("carrier-focus-list");
const carrierDocumentsList = document.getElementById("carrier-documents-list");
const carrierRulesList = document.getElementById("carrier-rules-list");
const carrierWorkflowsList = document.getElementById("carrier-workflows-list");
const workflowGuideCards = document.getElementById("workflow-guide-cards");
const claimsModuleGuide = document.getElementById("claims-module-guide");
const documentModuleGuide = document.getElementById("document-module-guide");
const followupModuleGuide = document.getElementById("followup-module-guide");
const fillExample = document.getElementById("fill-example");
const refreshStackStatusButton = document.getElementById("refresh-stack-status");
const summary = document.getElementById("summary");
const workflowSummary = document.getElementById("workflow-summary");
const stackHealthSummary = document.getElementById("stack-health-summary");
const stackHealthGrid = document.getElementById("stack-health-grid");
const documentSummary = document.getElementById("document-summary");
const followupSummary = document.getElementById("followup-summary");
const documentWorkflowSummary = document.getElementById("document-workflow-summary");
const followupWorkflowSummary = document.getElementById("followup-workflow-summary");
const gammaSummary = document.getElementById("gamma-summary");
const documentRequestSummary = document.getElementById("document-request-summary");
const followupRequestSummary = document.getElementById("followup-request-summary");
const attentionSummary = document.getElementById("attention-summary");
const missingList = document.getElementById("missing-list");
const documentMissingList = document.getElementById("document-missing-list");
const documentPresentList = document.getElementById("document-present-list");
const frictionList = document.getElementById("friction-list");
const claimsWebSources = document.getElementById("claims-web-sources");
const operatorSummary = document.getElementById("operator-summary");
const documentOutput = document.getElementById("document-output");
const documentRequestMessage = document.getElementById("document-request-message");
const documentWebSources = document.getElementById("document-web-sources");
const followupMissingList = document.getElementById("followup-missing-list");
const copyDocumentMessageButton = document.getElementById("copy-document-message");
const copyFollowupMessageButton = document.getElementById("copy-followup-message");
const followupOperatorSummary = document.getElementById("followup-operator-summary");
const followupRequestMessage = document.getElementById("followup-request-message");
const followupOutput = document.getElementById("followup-output");
const gammaPrompt = document.getElementById("gamma-prompt");
const gammaMarkdown = document.getElementById("gamma-markdown");
const gammaOutput = document.getElementById("gamma-output");
const rawOutput = document.getElementById("raw-output");
const batchOutput = document.getElementById("batch-output");
const batchSummary = document.getElementById("batch-summary");
const operatorDashboardSummary = document.getElementById("operator-dashboard-summary");
const operatorCriticalList = document.getElementById("operator-critical-list");
const operatorBlockedList = document.getElementById("operator-blocked-list");
const operatorRoutingList = document.getElementById("operator-routing-list");
const batchTableBody = document.getElementById("batch-table-body");
const caseDetail = document.getElementById("case-detail");
const exportBatchButton = document.getElementById("export-batch");
const exportMissingActionsButton = document.getElementById("export-missing-actions");
const missingActionsPanel = document.getElementById("missing-actions-panel");
const filterPriority = document.getElementById("filter-priority");
const filterCategory = document.getElementById("filter-category");
const filterStatus = document.getElementById("filter-status");
const filterAttention = document.getElementById("filter-attention");
const filterSearch = document.getElementById("filter-search");
const filterMissingOnly = document.getElementById("filter-missing-only");
const batchFilterStatus = document.getElementById("batch-filter-status");
const actionLogBody = document.getElementById("action-log-body");
const clearLogButton = document.getElementById("clear-log");
const claimText = form.claim_text;
const csvFileInput = document.getElementById("csv-file");
const csvRowSelect = document.getElementById("csv-row-select");
const csvStatus = document.getElementById("csv-status");
const csvPreview = document.getElementById("csv-preview");
const runBatchButton = document.getElementById("run-batch");
const csvDropzone = document.getElementById("csv-dropzone");
const csvFileList = document.getElementById("csv-file-list");
const dropFolderFileInput = document.getElementById("drop-folder-file");
const dropFolderUploadButton = document.getElementById("drop-folder-upload");
const dropFolderRefreshButton = document.getElementById("drop-folder-refresh");
const dropFolderZone = document.getElementById("drop-folder-zone");
const dropFolderStatus = document.getElementById("drop-folder-status");
const dropFolderWatchPath = document.getElementById("drop-folder-watch-path");
const dropFolderArchivePath = document.getElementById("drop-folder-archive-path");
const dropFolderErrorPath = document.getElementById("drop-folder-error-path");
const dropFolderIncomingList = document.getElementById("drop-folder-incoming-list");
const dropFolderArchiveList = document.getElementById("drop-folder-archive-list");
const dropFolderErrorList = document.getElementById("drop-folder-error-list");
let csvRows = [];
let lastBatchItems = [];
let manualStatusOverrides = {};
let actionLogEntries = [];
let selectedItemKey = "";
const CARRIER_PROFILES = {
    generic: {
        badge: "Tissu PME niortais",
        title: "Base commune TPE/PME de Niort",
        description: "Tronc commun pour tester l'analyse d'une demande administrative, commerciale ou back-office dans l'ecosysteme niortais.",
        focus: [
            "Tri des demandes entrantes",
            "Verification des pieces et references",
            "Routage vers le bon interlocuteur ou service",
        ],
        documents: ["Facture ou devis", "Reference dossier", "Piece justificative", "Canal d'origine"],
        rules: [
            "Prioriser les dossiers urgents",
            "Bloquer les dossiers incomplets",
            "Remonter les reclamations a revoir",
        ],
        workflows: [
            "Tri administratif entrant",
            "Controle de completude documentaire",
            "Pilotage back-office transverse",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, client CL-2048, dossier DOS-7788, je relance une facture en attente de validation depuis plusieurs jours. Je n'ai toujours pas de retour.",
            attached_documents: "facture, bon de commande",
        },
    },
    service_b2b: {
        badge: "Profil Services B2B",
        title: "Support client et back-office services",
        description: "Profil centre sur le tri des mails clients, les pieces manquantes, le SAV et les relances administratives.",
        focus: [
            "Demandes clients et SAV",
            "Pieces manquantes",
            "Reclamations et relances",
        ],
        documents: ["Devis", "Facture", "Bon d'intervention", "Reference client"],
        rules: [
            "Aiguiller vite les mails entrants",
            "Relancer les pieces manquantes",
            "Remonter les demandes sensibles ou urgentes",
        ],
        workflows: [
            "Tri des demandes clients et SAV",
            "Relances de pieces manquantes",
            "Gestion des reclamations clients",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, client CL-6721, dossier DOS-5510, je relance l'etat de mon devis signe. Il manque peut-etre encore des pieces pour finaliser.",
            attached_documents: "devis signe",
        },
    },
    immobilier_syndic: {
        badge: "Profil Immobilier / Syndic",
        title: "Dossiers locatifs et suivi immeuble",
        description: "Profil adapte aux agences, syndics et gestionnaires avec devis, relances, sinistres et pieces de dossier.",
        focus: [
            "Dossiers locataires et proprietaires",
            "Sinistres et urgences",
            "Pieces manquantes sur les dossiers",
        ],
        documents: ["Etat des lieux", "Devis travaux", "Photo", "Bail ou reference lot"],
        rules: [
            "Prioriser les urgences techniques",
            "Relancer les dossiers incomplets",
            "Centraliser les echanges locataires et proprietaires",
        ],
        workflows: [
            "Suivi des dossiers locatifs",
            "Relances sur dossiers incomplets",
            "Priorisation des sinistres et urgences",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, dossier DOS-3201, le locataire signale une fuite urgente. Je joins le devis mais il manque encore des pieces pour lancer l'intervention.",
            attached_documents: "devis travaux, photo degat",
        },
    },
    negoce_adv: {
        badge: "Profil Negoce / ADV",
        title: "Commandes, devis et facturation clients",
        description: "Profil adapte aux PME de negoce, ADV et commerce B2B avec commandes, relances et litiges.",
        focus: [
            "Commandes et devis",
            "Facturation et relances",
            "Litiges de livraison",
        ],
        documents: ["Bon de commande", "Devis", "Facture", "BL ou preuve de livraison"],
        rules: [
            "Relancer les paiements ou validations",
            "Prioriser les litiges clients",
            "Verifier les references commande avant traitement",
        ],
        workflows: [
            "Preparation des commandes et demandes entrantes",
            "Suivi facturation et relances clients",
            "Gestion des litiges commandes et livraisons",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, client CL-5504, commande CMD-8122, je conteste une facture sur une livraison incomplete et j'attends un retour rapide.",
            attached_documents: "facture, bon de livraison",
        },
    },
    cabinet_gestion: {
        badge: "Profil Cabinet de gestion",
        title: "Preparation et relance de dossiers administratifs",
        description: "Profil adapte aux cabinets de gestion, assistance administrative ou comptable avec collecte de pieces et suivi de dossiers.",
        focus: [
            "Preparation des dossiers",
            "Justificatifs manquants",
            "Priorisation administrative",
        ],
        documents: ["Justificatif", "Facture", "RIB", "Reference client ou dossier"],
        rules: [
            "Standardiser les relances",
            "Prioriser les dossiers urgents ou anciens",
            "Verifier la presence des pieces avant instruction",
        ],
        workflows: [
            "Preparation des dossiers clients",
            "Relances de justificatifs et pieces comptables",
            "Priorisation des dossiers a traiter",
        ],
        sample: {
            channel: "courrier",
            claim_text:
                "Bonjour, dossier DOS-9902, il manque encore le RIB et une facture pour cloturer ce dossier client. Merci de preparer la relance.",
            attached_documents: "courrier client",
        },
    },
    niort_lab: {
        badge: "Plateforme Niort Lab",
        title: "Orchestration avancee pour TPE/PME niortaises",
        description: "Profil de demonstration pour une plateforme modulaire, batchable et exploitable par API au-dessus des besoins back-office de plusieurs entreprises.",
        focus: [
            "Orchestration API par cas d'usage",
            "Traitement batch et routage intelligent",
            "Preparation a l'integration SI locale",
        ],
        documents: ["CSV source", "Identifiants client", "Pieces justificatives normalisees"],
        rules: [
            "Distinguer les besoins par entreprise des l'entree",
            "Standardiser les sorties pour un usage API",
            "Permettre l'override operateur sans perdre la trace",
        ],
        workflows: [
            "Orchestration multi-entreprise par workflow",
            "Supervision batch et files operateur",
            "Connecteurs email, depot, API et SFTP",
        ],
        sample: {
            channel: "courrier",
            claim_text:
                "Bonjour, client LAB-9031, dossier DOS-9902, merci de qualifier ce dossier complexe pour routage prioritaire, controle des pieces justificatives et relance automatique si besoin.",
            attached_documents: "facture, attestation, courrier client",
        },
    },
};

const WORKFLOW_PLAYBOOKS = {
    generic: [
        {
            id: "generic-intake",
            module: "claims",
            title: "Trier une demande entrante",
            when: "Quand un mail, un message ou un dossier doit etre qualifie rapidement.",
            inputs: ["Canal", "Texte de la demande", "Pieces jointes si connues"],
            outputs: ["Categorie", "Priorite", "Action suivante", "Statut bloque ou non"],
        },
        {
            id: "generic-docs",
            module: "document",
            title: "Verifier un dossier incomplet",
            when: "Quand tu veux savoir s'il manque des pieces avant traitement humain.",
            inputs: ["Type de dossier", "Contexte", "Pieces deja recues"],
            outputs: ["Taux de completude", "Pieces manquantes", "Message client pret"],
        },
        {
            id: "generic-followup",
            module: "followup",
            title: "Preparer une relance administrative",
            when: "Quand une facture, un devis ou un justificatif reste sans retour.",
            inputs: ["Contexte", "Retard", "Pieces attendues", "Destinataire"],
            outputs: ["Urgence", "Statut de relance", "Sujet", "Message pret a envoyer"],
        },
    ],
    service_b2b: [
        {
            id: "service-sav",
            module: "claims",
            title: "Trier SAV et reclamations clients",
            when: "Quand un client relance, reclame ou attend un retour sur un devis.",
            inputs: ["Email entrant", "Reference client", "Pieces jointes"],
            outputs: ["Workflow cible SAV/reclamation", "Priorite", "Action immediate"],
        },
        {
            id: "service-docs",
            module: "document",
            title: "Verifier les pieces de validation",
            when: "Quand il faut confirmer qu'un dossier est complet avant execution.",
            inputs: ["Type de dossier", "Justificatifs recents", "Contexte client"],
            outputs: ["Pieces manquantes", "Dossier exploitable ou non", "Message de demande"],
        },
        {
            id: "service-followup",
            module: "followup",
            title: "Relancer un client pour piece ou devis",
            when: "Quand un devis signe ou une piece bloque la suite du dossier.",
            inputs: ["Retard", "Pieces attendues", "Contexte libre"],
            outputs: ["Relance prete a envoyer", "Urgence", "Workflow de suivi"],
        },
    ],
    immobilier_syndic: [
        {
            id: "immo-intake",
            module: "claims",
            title: "Prioriser un incident ou sinistre",
            when: "Quand un locataire ou coproprietaire signale un probleme urgent.",
            inputs: ["Canal", "Texte du signalement", "Devis ou photos"],
            outputs: ["Priorite", "Blocage documentaire", "Orientation du dossier"],
        },
        {
            id: "immo-docs",
            module: "document",
            title: "Verifier un dossier travaux",
            when: "Quand un devis, des photos ou des justificatifs doivent etre controles.",
            inputs: ["Contexte du dossier", "Pieces deja recues"],
            outputs: ["Completude", "Pieces manquantes", "Prochaine action"],
        },
        {
            id: "immo-followup",
            module: "followup",
            title: "Relancer sur pieces locatives",
            when: "Quand un dossier reste bloque faute de bail, devis ou justificatif.",
            inputs: ["Pieces recues", "Pieces attendues", "Retard"],
            outputs: ["Message de relance", "Urgence", "Statut du dossier"],
        },
    ],
    negoce_adv: [
        {
            id: "negoce-intake",
            module: "claims",
            title: "Trier litiges de commande et factures",
            when: "Quand une commande, une livraison ou une facture declenche une relance.",
            inputs: ["Texte client", "BL", "Facture", "Reference commande"],
            outputs: ["Workflow ADV cible", "Priorite", "File facture/litige"],
        },
        {
            id: "negoce-docs",
            module: "document",
            title: "Verifier la liasse commande",
            when: "Quand il faut controler BL, devis, facture et references avant traitement.",
            inputs: ["Documents de commande", "Contexte"],
            outputs: ["Pieces manquantes", "Dossier finalisable ou non"],
        },
        {
            id: "negoce-followup",
            module: "followup",
            title: "Relancer facture ou devis",
            when: "Quand un paiement, une validation ou un devis reste en attente.",
            inputs: ["Montant", "Retard", "Contexte"],
            outputs: ["Message de relance facture/devis", "Urgence", "Workflow cible"],
        },
    ],
    cabinet_gestion: [
        {
            id: "cabinet-intake",
            module: "claims",
            title: "Qualifier un dossier administratif",
            when: "Quand un dossier client arrive avec des justificatifs disperses.",
            inputs: ["Texte libre", "Reference dossier", "Pieces deja recues"],
            outputs: ["Resume operateur", "Pieces manquantes", "Action suivante"],
        },
        {
            id: "cabinet-docs",
            module: "document",
            title: "Verifier les justificatifs comptables",
            when: "Quand un RIB, une facture ou un document client manque pour cloture.",
            inputs: ["Contexte", "Pieces deja recues"],
            outputs: ["Controle de completude", "Message client pret"],
        },
        {
            id: "cabinet-followup",
            module: "followup",
            title: "Relancer sur piece comptable",
            when: "Quand un dossier reste en attente d'un RIB, justificatif ou facture.",
            inputs: ["Pieces attendues", "Destinataire", "Retard"],
            outputs: ["Relance exploitable", "Statut bloque ou pret"],
        },
    ],
    niort_lab: [
        {
            id: "lab-intake",
            module: "claims",
            title: "Orchestrer un cas multi-entreprise",
            when: "Quand il faut qualifier rapidement un cas avant routage API ou batch.",
            inputs: ["Profil entreprise", "Texte", "Pieces", "Canal"],
            outputs: ["Workflow cible", "Priorite", "Action standardisee"],
        },
        {
            id: "lab-docs",
            module: "document",
            title: "Standardiser le controle documentaire",
            when: "Quand plusieurs entreprises utilisent la meme logique de completude.",
            inputs: ["Type de dossier", "Pieces", "Contexte"],
            outputs: ["Etat documentaire", "Demande de pieces", "Sortie standardisee"],
        },
        {
            id: "lab-followup",
            module: "followup",
            title: "Produire une relance reutilisable",
            when: "Quand il faut industrialiser les relances par workflow.",
            inputs: ["Type de relance", "Retard", "Pieces attendues"],
            outputs: ["Relance prete", "Urgence", "Workflow de diffusion"],
        },
    ],
};
const STORAGE_KEYS = {
    overrides: "mutuelle_ai_platform.manual_status_overrides",
    actionLog: "mutuelle_ai_platform.action_log_entries",
};

renderCarrierProfile();
void initializeOperatorState();
void loadStackHealth();
void loadDropzoneStatus();

fillExample.addEventListener("click", () => {
    const profile = getCurrentCarrierProfile();
    form.channel.value = profile.sample.channel;
    form.customer_id.value = "";
    form.contract_id.value = "";
    form.provider.value = "mock";
    form.claim_text.value = profile.sample.claim_text;
    form.attached_documents.value = profile.sample.attached_documents;
    autofillIdentifiers();
});

fillDocumentExample.addEventListener("click", () => {
    documentForm.document_type.value = "reimbursement";
    documentForm.customer_id.value = "CL-2048";
    documentForm.contract_id.value = "DOS-7788";
    documentForm.provider.value = "mock";
    documentForm.message_tone.value = "neutral";
    documentForm.output_channel.value = "email";
    documentForm.document_text.value =
        "Bonjour, client CL-2048, dossier DOS-7788, je transmets une facture et mon numero adherent pour un remboursement en attente.";
    documentForm.attached_documents.value = "facture, numero adherent";
});

fillFollowupExample.addEventListener("click", () => {
    followupForm.followup_type.value = "missing_document";
    followupForm.customer_id.value = "CL-7001";
    followupForm.contract_id.value = "DOS-4512";
    followupForm.recipient_name.value = "Mme Martin";
    followupForm.outstanding_amount.value = "";
    followupForm.days_overdue.value = "7";
    followupForm.provider.value = "mock";
    followupForm.message_tone.value = "neutral";
    followupForm.output_channel.value = "email";
    followupForm.channel.value = "email";
    followupForm.attached_documents.value = "devis signe";
    followupForm.expected_documents.value = "bon de commande, RIB";
    followupForm.context_text.value =
        "Bonjour, le client attend une validation de dossier depuis une semaine et il manque encore le bon de commande signe et le RIB.";
});

fillGammaExample.addEventListener("click", () => {
    gammaForm.title.value = "Automatisation des relances back-office";
    gammaForm.audience.value = "direction PME";
    gammaForm.output_type.value = "presentation";
    gammaForm.provider.value = "mock";
    gammaForm.objective.value = "Montrer comment la plateforme reduit les blocages et les relances manuelles";
    gammaForm.source_context.value =
        "Le workflow detecte les pieces manquantes, genere les relances client et priorise les dossiers urgents pour le back-office.";
    gammaForm.key_points.value = "gain de temps, baisse des oublis, priorisation, relances automatisees";
});

carrierProfileSelect.addEventListener("change", () => {
    renderCarrierProfile();
});
workflowGuideCards.addEventListener("click", handleWorkflowGuideClick);
claimText.addEventListener("input", autofillIdentifiers);
csvFileInput.addEventListener("change", handleCsvUpload);
csvRowSelect.addEventListener("change", applySelectedCsvRow);
runBatchButton.addEventListener("click", runBatchAnalysis);
exportBatchButton.addEventListener("click", exportBatchResults);
exportMissingActionsButton.addEventListener("click", exportMissingActions);
filterPriority.addEventListener("change", applyBatchFilters);
filterCategory.addEventListener("change", applyBatchFilters);
filterStatus.addEventListener("change", applyBatchFilters);
filterAttention.addEventListener("change", applyBatchFilters);
filterSearch.addEventListener("input", applyBatchFilters);
filterMissingOnly.addEventListener("change", applyBatchFilters);
batchTableBody.addEventListener("change", handleStatusOverrideChange);
batchTableBody.addEventListener("click", handleBatchRowClick);
missingActionsPanel.addEventListener("click", handleMissingActionsClick);
clearLogButton.addEventListener("click", clearActionLog);
refreshStackStatusButton.addEventListener("click", () => {
    void loadStackHealth();
});
csvDropzone.addEventListener("dragenter", activateDropzone);
csvDropzone.addEventListener("dragover", activateDropzone);
csvDropzone.addEventListener("dragleave", deactivateDropzone);
csvDropzone.addEventListener("drop", handleDrop);
dropFolderUploadButton.addEventListener("click", uploadDropzoneFiles);
dropFolderRefreshButton.addEventListener("click", () => {
    void loadDropzoneStatus("Repertoires actualises.");
});
dropFolderZone.addEventListener("dragenter", activateDropFolderZone);
dropFolderZone.addEventListener("dragover", activateDropFolderZone);
dropFolderZone.addEventListener("dragleave", deactivateDropFolderZone);
dropFolderZone.addEventListener("drop", handleDropFolderDrop);
copyDocumentMessageButton.addEventListener("click", () => {
    void copyToClipboard(documentRequestMessage.textContent, "Message documentaire copie.");
});
copyFollowupMessageButton.addEventListener("click", () => {
    void copyToClipboard(followupRequestMessage.textContent, "Message de relance copie.");
});

gammaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        carrier_profile: carrierProfileSelect.value,
        title: gammaForm.title.value,
        audience: gammaForm.audience.value || "direction",
        objective: gammaForm.objective.value,
        source_module: "back_office_pitch",
        source_context: gammaForm.source_context.value,
        key_points: gammaForm.key_points.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        output_type: gammaForm.output_type.value,
        provider: gammaForm.provider.value,
    };

    gammaSummary.innerHTML = `
        <div><dt>Type</dt><dd>${escapeHtml(payload.output_type)}</dd></div>
        <div><dt>API Gamma</dt><dd>Preparation...</dd></div>
        <div><dt>Provider</dt><dd>${escapeHtml(payload.provider)}</dd></div>
    `;
    gammaPrompt.textContent = "Generation du prompt Gamma en cours...";
    gammaMarkdown.textContent = "Generation du markdown en cours...";
    gammaOutput.textContent = "Chargement...";

    try {
        const response = await fetch("/automations/gamma-brief", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(JSON.stringify(data, null, 2));
        }

        gammaSummary.innerHTML = `
            <div><dt>Type</dt><dd>${escapeHtml(data.gamma_output_type || "-")}</dd></div>
            <div><dt>API Gamma</dt><dd>${escapeHtml(data.gamma_api_configured ? "Configuree" : "Non configuree")}</dd></div>
            <div><dt>Provider</dt><dd>${escapeHtml(data.ai_provider || "-")}</dd></div>
        `;
        gammaPrompt.textContent = data.gamma_prompt || "Aucun prompt genere.";
        gammaMarkdown.textContent = data.gamma_import_markdown || "Aucun markdown genere.";
        gammaOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        gammaPrompt.textContent = "Erreur lors de la preparation du prompt Gamma.";
        gammaMarkdown.textContent = "Erreur lors de la preparation du markdown Gamma.";
        gammaOutput.textContent = String(error);
    }
});

documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        document_type: documentForm.document_type.value,
        customer_id: documentForm.customer_id.value || null,
        contract_id: documentForm.contract_id.value || null,
        provider: documentForm.provider.value,
        carrier_profile: carrierProfileSelect.value,
        message_tone: documentForm.message_tone.value,
        output_channel: documentForm.output_channel.value,
        web_lookup_enabled: documentForm.web_lookup_enabled.checked,
        document_text: documentForm.document_text.value,
        attached_documents: documentForm.attached_documents.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
    };

    setDocumentSummary({
        type: payload.document_type,
        status: "Analyse...",
        completion: "-",
    });
    setDocumentWorkflowSummary({
        company: getCurrentCarrierProfile().title,
        workflow: "Analyse...",
        logic: "-",
    });
    renderDocumentRequestMessage(
        payload.message_tone,
        payload.output_channel,
        "-",
        "Generation du message en cours...",
    );
    documentMissingList.innerHTML = "<li>Verification en cours...</li>";
    documentPresentList.innerHTML = "<li>Verification en cours...</li>";
    renderVerifiedWebSources(documentWebSources, []);
    documentOutput.textContent = "Chargement...";

    try {
        const response = await fetch("/automations/document-completeness", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data, null, 2));
        }

        setDocumentSummary({
            type: data.document_type_label,
            status: data.readiness_status_label,
            completion: `${data.completion_ratio}%`,
        });
        setDocumentWorkflowSummary({
            company: data.carrier_profile_label,
            workflow: data.target_workflow_label,
            logic: data.target_workflow_reason_display || data.target_workflow_reason,
        });
        renderDocumentLists(data);
        renderDocumentRequestMessage(
            data.message_tone,
            data.output_channel,
            data.client_request_subject,
            data.client_request_message_display || data.client_request_message,
        );
        renderVerifiedWebSources(documentWebSources, data.verified_web_sources || []);
        documentOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        setDocumentSummary({
            type: payload.document_type,
            status: "Erreur",
            completion: "-",
        });
        setDocumentWorkflowSummary({
            company: getCurrentCarrierProfile().title,
            workflow: "Erreur",
            logic: "-",
        });
        renderDocumentRequestMessage(
            payload.message_tone,
            payload.output_channel,
            "-",
            "Impossible de generer le message client.",
        );
        documentMissingList.innerHTML = "<li>La verification a echoue.</li>";
        documentPresentList.innerHTML = "<li>Aucun resultat.</li>";
        renderVerifiedWebSources(documentWebSources, []);
        documentOutput.textContent = String(error);
    }
});

followupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        followup_type: followupForm.followup_type.value,
        customer_id: followupForm.customer_id.value || null,
        contract_id: followupForm.contract_id.value || null,
        recipient_name: followupForm.recipient_name.value || null,
        outstanding_amount: followupForm.outstanding_amount.value ? Number(followupForm.outstanding_amount.value) : null,
        days_overdue: followupForm.days_overdue.value ? Number(followupForm.days_overdue.value) : null,
        provider: followupForm.provider.value,
        carrier_profile: carrierProfileSelect.value,
        message_tone: followupForm.message_tone.value,
        output_channel: followupForm.output_channel.value,
        channel: followupForm.channel.value,
        context_text: followupForm.context_text.value,
        attached_documents: followupForm.attached_documents.value.split(",").map((item) => item.trim()).filter(Boolean),
        expected_documents: followupForm.expected_documents.value.split(",").map((item) => item.trim()).filter(Boolean),
    };

    setFollowupSummary({ type: "-", urgency: "-", status: "Preparation..." });
    setFollowupWorkflowSummary({
        company: getCurrentCarrierProfile().title,
        workflow: "Analyse...",
        logic: "-",
    });
    followupMissingList.innerHTML = "<li>Preparation en cours...</li>";
    followupOperatorSummary.textContent = "Chargement...";
    renderFollowupRequestMessage(payload.message_tone, payload.output_channel, "-", "Generation du message en cours...");
    followupOutput.textContent = "Chargement...";

    try {
        const response = await fetch("/automations/followup-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(JSON.stringify(data, null, 2));
        }

        setFollowupSummary({
            type: data.followup_type_label,
            urgency: data.urgency_level_label,
            status: data.followup_status_label,
        });
        setFollowupWorkflowSummary({
            company: data.carrier_profile_label,
            workflow: data.target_workflow_label,
            logic: data.target_workflow_reason_display || data.target_workflow_reason,
        });
        renderFollowupMissing(data.missing_documents || []);
        followupOperatorSummary.textContent = data.operator_summary_display || data.operator_summary;
        renderFollowupRequestMessage(
            data.message_tone,
            data.output_channel,
            data.client_request_subject_display || data.client_request_subject,
            data.client_request_message_display || data.client_request_message,
        );
        followupOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        setFollowupSummary({ type: payload.followup_type, urgency: "-", status: "Erreur" });
        setFollowupWorkflowSummary({
            company: getCurrentCarrierProfile().title,
            workflow: "Erreur",
            logic: "-",
        });
        followupMissingList.innerHTML = "<li>La preparation a echoue.</li>";
        followupOperatorSummary.textContent = "Verifier que l'API tourne et que le provider choisi est disponible.";
        renderFollowupRequestMessage(
            payload.message_tone,
            payload.output_channel,
            "-",
            "Impossible de preparer la relance.",
        );
        followupOutput.textContent = String(error);
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        channel: form.channel.value,
        customer_id: form.customer_id.value || null,
        contract_id: form.contract_id.value || null,
        provider: form.provider.value,
        carrier_profile: carrierProfileSelect.value,
        web_lookup_enabled: form.web_lookup_enabled.checked,
        claim_text: form.claim_text.value,
        attached_documents: form.attached_documents.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
    };

    setSummary({
        status: "Execution...",
        category: "-",
        priority: "-",
        action: "-",
    });
    setWorkflowSummary({
        company: getCurrentCarrierProfile().title,
        workflow: "Analyse...",
        logic: "-",
    });
    renderAttention({
        level: "-",
        score: "-",
        flags: ["Analyse en cours..."],
    });
    missingList.innerHTML = "<li>Analyse en cours...</li>";
    renderVerifiedWebSources(claimsWebSources, []);
    operatorSummary.textContent = "Chargement...";
    rawOutput.textContent = "Chargement...";

    try {
        const response = await fetch("/automations/claims-intake", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data, null, 2));
        }

        setSummary({
            status: "Succes",
            category: data.category_label,
            priority: data.priority_label,
            action: data.recommended_next_action_label,
        });
        setWorkflowSummary({
            company: data.carrier_profile_label,
            workflow: data.target_workflow_label,
            logic: data.target_workflow_reason_display || data.target_workflow_reason,
        });
        renderAttention({
            level: data.attention_level_label,
            score: data.attention_score,
            flags: data.friction_flag_labels,
        });
        renderMissing(data.missing_information_labels);
        renderVerifiedWebSources(claimsWebSources, data.verified_web_sources || []);
        operatorSummary.textContent = data.operator_summary_display || data.operator_summary;
        rawOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        setSummary({
            status: "Erreur",
            category: "-",
            priority: "-",
            action: "-",
        });
        setWorkflowSummary({
            company: getCurrentCarrierProfile().title,
            workflow: "Erreur",
            logic: "-",
        });
        renderAttention({
            level: "-",
            score: "-",
            flags: ["La requete a echoue."],
        });
        missingList.innerHTML = "<li>La requete a echoue.</li>";
        renderVerifiedWebSources(claimsWebSources, []);
        operatorSummary.textContent = "Verifier que l'API tourne et que le provider choisi est disponible.";
        rawOutput.textContent = String(error);
    }
});

function setSummary({ status, category, priority, action }) {
    summary.innerHTML = `
        <div><dt>Statut</dt><dd>${escapeHtml(status)}</dd></div>
        <div><dt>Categorie</dt><dd>${escapeHtml(category)}</dd></div>
        <div><dt>Priorite</dt><dd>${escapeHtml(priority)}</dd></div>
        <div><dt>Action</dt><dd>${escapeHtml(action)}</dd></div>
    `;
}

function renderMissing(items) {
    if (!items || items.length === 0) {
        missingList.innerHTML = "<li>Aucune information manquante detectee.</li>";
        return;
    }

    missingList.innerHTML = items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
}

async function runBatchAnalysis() {
    if (csvRows.length === 0) {
        batchOutput.textContent = "Charge d'abord un CSV pour lancer un batch.";
        resetBatchVisuals();
        return;
    }

    batchOutput.textContent = "Traitement batch en cours...";
    resetBatchVisuals("Traitement...");
    const payload = {
        items: csvRows.map((row) => {
            const item = convertCsvRowToPayload(row);
            return {
                channel: item.channel,
                customer_id: item.customer_id,
                contract_id: item.contract_id,
                provider: item.provider,
                claim_text: item.claim_text,
                attached_documents: item.attached_documents,
            };
        }),
    };

    try {
        const response = await fetch("/automations/claims-intake/batch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data, null, 2));
        }

        data.items = data.items.map((item, index) => ({
            ...item,
            carrier_profile: convertCsvRowToPayload(csvRows[index] || {}).carrier_profile,
        }));

        renderBatchSummary(data.summary);
        renderOperatorDashboard(data.items);
        renderBatchTable(data.items);
        renderMissingActionsPanel(data.items);
        lastBatchItems = data.items;
        hydrateCategoryFilter(data.items);
        hydrateStatusFilter(data.items);
        exportBatchButton.disabled = data.items.length === 0;
        exportMissingActionsButton.disabled = !data.items.some((item) => item.missing_information.length);
        batchOutput.textContent = JSON.stringify(data, null, 2);
        applyBatchFilters();
        if (data.items[0]) {
            selectedItemKey = buildItemKey(data.items[0]);
            renderCaseDetail(data.items[0]);
            highlightSelectedRow();
        }
        addLogEntry({
            action: "Batch lance",
            source: `${csvRows.length} ligne(s)`,
            caseRef: `${data.summary.total_items} dossier(s)`,
            detail: `${data.summary.high_priority} prioritaire(s), ${data.summary.missing_information_cases} incomplet(s)`,
        });
    } catch (error) {
        resetBatchVisuals("Erreur");
        batchOutput.textContent = String(error);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function autofillIdentifiers() {
    const text = claimText.value;
    const customerMatch = text.match(
        /\b(?:client|adherent|adh[ée]rent|assur[ée]|id client)\s*[:#-]?\s*([A-Z0-9-]{4,})/i,
    );
    const contractMatch = text.match(
        /\b(?:dossier|num[ée]ro dossier|ref(?:erence)? dossier|sinistre)\s*[:#-]?\s*([A-Z0-9-]{4,})/i,
    );

    if (!form.customer_id.value && customerMatch) {
        form.customer_id.value = customerMatch[1].toUpperCase();
    }

    if (!form.contract_id.value && contractMatch) {
        form.contract_id.value = contractMatch[1].toUpperCase();
    }
}

async function handleCsvUpload(event) {
    const files = Array.from(event.target.files || []);
    await importCsvFiles(files);
}

function handleDrop(event) {
    event.preventDefault();
    deactivateDropzone();
    const files = Array.from(event.dataTransfer?.files || []);
    void importCsvFiles(files);
}

function activateDropzone(event) {
    event.preventDefault();
    csvDropzone.classList.add("is-active");
}

function deactivateDropzone(event) {
    if (event) {
        event.preventDefault();
    }
    csvDropzone.classList.remove("is-active");
}

function setWorkflowSummary({ company, workflow, logic }) {
    workflowSummary.innerHTML = `
        <div><dt>Entreprise</dt><dd>${escapeHtml(company)}</dd></div>
        <div><dt>Workflow</dt><dd>${escapeHtml(workflow)}</dd></div>
        <div><dt>Logique</dt><dd>${escapeHtml(logic)}</dd></div>
    `;
}

function setDocumentWorkflowSummary({ company, workflow, logic }) {
    documentWorkflowSummary.innerHTML = `
        <div><dt>Entreprise</dt><dd>${escapeHtml(company)}</dd></div>
        <div><dt>Workflow</dt><dd>${escapeHtml(workflow)}</dd></div>
        <div><dt>Logique</dt><dd>${escapeHtml(logic)}</dd></div>
    `;
}

function renderVerifiedWebSources(target, items) {
    if (!items || items.length === 0) {
        target.innerHTML = "<li>Aucune source consultee.</li>";
        return;
    }

    target.innerHTML = items
        .map(
            (item) => `
                <li>
                    <strong>${escapeHtml(item.title || item.url)}</strong><br>
                    ${item.title_display && item.title_display !== (item.title || item.url) ? `<span>${escapeHtml(item.title_display)}</span><br>` : ""}
                    <span>${escapeHtml(item.domain || "-")} • verifie le ${escapeHtml(formatCheckedAt(item.checked_at))}</span><br>
                    <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Ouvrir la source</a>
                    ${item.snippet_display ? `<br><span>${escapeHtml(item.snippet_display)}</span>` : ""}
                </li>
            `,
        )
        .join("");
}

function formatCheckedAt(value) {
    if (!value) {
        return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString("fr-FR");
}

async function loadStackHealth() {
    stackHealthSummary.innerHTML = `
        <div class="metric">
            <span>Statut global</span>
            <strong>Chargement...</strong>
        </div>
        <div class="metric">
            <span>Services actifs</span>
            <strong>-</strong>
        </div>
    `;
    stackHealthGrid.innerHTML = `
        <article class="stack-service-card">
            <div class="stack-service-head">
                <span class="stack-dot stack-dot-unknown"></span>
                <strong>Chargement...</strong>
            </div>
            <p class="hint">Verification en cours.</p>
        </article>
    `;

    try {
        const response = await fetch("/health/n8n-stack");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        const services = Object.entries(data.services || {});
        const upCount = services.filter(([, item]) => item.status === "up").length;

        stackHealthSummary.innerHTML = `
            <div class="metric">
                <span>Statut global</span>
                <strong>${escapeHtml(data.status || "-")}</strong>
            </div>
            <div class="metric">
                <span>Services actifs</span>
                <strong>${escapeHtml(`${upCount}/${services.length}`)}</strong>
            </div>
        `;

        stackHealthGrid.innerHTML = services
            .map(([name, item]) => {
                const isUp = item.status === "up";
                const dotClass = isUp ? "stack-dot-up" : "stack-dot-down";
                const detail = item.error || item.target || "-";
                return `
                    <article class="stack-service-card">
                        <div class="stack-service-head">
                            <span class="stack-dot ${dotClass}"></span>
                            <strong>${escapeHtml(name)}</strong>
                            <span class="stack-status-label">${escapeHtml(item.status || "-")}</span>
                        </div>
                        <p class="hint">${escapeHtml(detail)}</p>
                    </article>
                `;
            })
            .join("");
    } catch (error) {
        stackHealthSummary.innerHTML = `
            <div class="metric">
                <span>Statut global</span>
                <strong>Erreur</strong>
            </div>
            <div class="metric">
                <span>Services actifs</span>
                <strong>-</strong>
            </div>
        `;
        stackHealthGrid.innerHTML = `
            <article class="stack-service-card">
                <div class="stack-service-head">
                    <span class="stack-dot stack-dot-down"></span>
                    <strong>Verification impossible</strong>
                </div>
                <p class="hint">${escapeHtml(String(error))}</p>
            </article>
        `;
    }
}

function activateDropFolderZone(event) {
    event.preventDefault();
    dropFolderZone.classList.add("is-active");
}

function deactivateDropFolderZone(event) {
    if (event) {
        event.preventDefault();
    }
    dropFolderZone.classList.remove("is-active");
}

async function handleDropFolderDrop(event) {
    event.preventDefault();
    deactivateDropFolderZone();
    const files = Array.from(event.dataTransfer?.files || []);
    await uploadFilesToDropzone(files);
}

async function uploadDropzoneFiles() {
    const files = Array.from(dropFolderFileInput.files || []);
    await uploadFilesToDropzone(files);
}

async function uploadFilesToDropzone(files) {
    const supportedFiles = files.filter((file) => {
        const lowerName = file.name.toLowerCase();
        return lowerName.endsWith(".csv") || lowerName.endsWith(".json");
    });

    if (supportedFiles.length === 0) {
        dropFolderStatus.textContent = "Selectionne au moins un fichier .csv ou .json.";
        return;
    }

    const formData = new FormData();
    supportedFiles.forEach((file) => {
        formData.append("files", file);
    });

    dropFolderStatus.textContent = "Depot des fichiers en cours...";

    try {
        const response = await fetch("/ui/dropzone-upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || JSON.stringify(data));
        }

        dropFolderStatus.textContent = `${data.count} fichier(s) depose(s) dans le repertoire surveille.`;
        dropFolderFileInput.value = "";
        await loadDropzoneStatus();
    } catch (error) {
        dropFolderStatus.textContent = `Echec du depot: ${String(error)}`;
    }
}

async function loadDropzoneStatus(successMessage = "") {
    try {
        const response = await fetch("/ui/dropzone-status");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        dropFolderWatchPath.textContent = data.watch_path;
        dropFolderArchivePath.textContent = data.archive_path;
        dropFolderErrorPath.textContent = data.error_path;
        renderDropzoneFileList(dropFolderIncomingList, data.incoming, "Aucun fichier en attente.");
        renderDropzoneFileList(dropFolderArchiveList, data.archive, "Aucun fichier archive.");
        renderDropzoneFileList(dropFolderErrorList, data.error, "Aucun fichier en erreur.");
        dropFolderStatus.textContent =
            successMessage ||
            `${data.incoming.length} fichier(s) en attente, ${data.archive.length} archive(s), ${data.error.length} erreur(s).`;
    } catch (error) {
        dropFolderStatus.textContent = `Impossible de lire le repertoire surveille: ${String(error)}`;
    }
}

function renderDropzoneFileList(container, files, emptyMessage) {
    if (!files || files.length === 0) {
        container.innerHTML = `<li>${escapeHtml(emptyMessage)}</li>`;
        return;
    }

    container.innerHTML = files
        .map((file) => {
            const updatedAt = formatDropzoneDate(file.updated_at);
            return `<li>${escapeHtml(file.name)} - ${formatBytes(file.size_bytes)} - ${escapeHtml(updatedAt)}</li>`;
        })
        .join("");
}

function formatDropzoneDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString("fr-FR");
}

function formatBytes(value) {
    const size = Number(value || 0);
    if (size < 1024) {
        return `${size} o`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} Ko`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

async function importCsvFiles(files) {
    const csvFiles = files.filter((file) => file.name.toLowerCase().endsWith(".csv"));
    if (csvFiles.length === 0) {
        csvStatus.textContent = "Aucun CSV charge.";
        csvPreview.textContent = "Aucun apercu disponible.";
        csvRowSelect.innerHTML = '<option value="">Aucune ligne chargee</option>';
        csvFileList.innerHTML = "<li>Aucun fichier importe.</li>";
        csvRows = [];
        return;
    }

    csvRows = [];
    const importedFiles = [];

    for (const file of csvFiles) {
        const content = await file.text();
        const rows = parseCsv(content).map((row) => ({
            ...row,
            source_file: file.name,
        }));

        if (rows.length > 0) {
            importedFiles.push({
                name: file.name,
                rows: rows.length,
            });
            csvRows.push(...rows);
        }
    }

    if (csvRows.length === 0) {
        csvStatus.textContent = "Les CSV charges sont vides ou invalides.";
        csvPreview.textContent = "Aucun apercu disponible.";
        csvRowSelect.innerHTML = '<option value="">Aucune ligne exploitable</option>';
        csvFileList.innerHTML = "<li>Aucun fichier exploitable.</li>";
        return;
    }

    csvStatus.textContent = `${csvRows.length} ligne(s) detectee(s) dans ${importedFiles.length} fichier(s).`;
    csvPreview.textContent = JSON.stringify(csvRows.slice(0, 3), null, 2);
    csvFileList.innerHTML = importedFiles
        .map((file) => `<li>${escapeHtml(file.name)} - ${file.rows} ligne(s)</li>`)
        .join("");
    csvRowSelect.innerHTML = csvRows
        .map((row, index) => {
            const label =
                row.customer_id || row.contract_id || row.claim_text || `Ligne ${index + 1}`;
            const source = row.source_file ? `[${row.source_file}] ` : "";
            return `<option value="${index}">${source}Ligne ${index + 1} - ${escapeHtml(label).slice(0, 80)}</option>`;
        })
        .join("");

    csvRowSelect.value = "0";
    applyCsvRow(csvRows[0]);
}

function applySelectedCsvRow() {
    const index = Number(csvRowSelect.value);
    if (Number.isNaN(index) || !csvRows[index]) {
        return;
    }

    applyCsvRow(csvRows[index]);
}

function applyCsvRow(row) {
    const payload = convertCsvRowToPayload(row);
    carrierProfileSelect.value = resolveCarrierProfile(payload.carrier_profile);
    renderCarrierProfile();
    form.channel.value = payload.channel;
    form.customer_id.value = payload.customer_id || "";
    form.contract_id.value = payload.contract_id || "";
    form.provider.value = payload.provider;
    form.claim_text.value = payload.claim_text;
    form.attached_documents.value = payload.attached_documents.join(", ");
    autofillIdentifiers();
}

function convertCsvRowToPayload(row) {
    const attachedDocuments = (
        row.attached_documents ||
        row.documents ||
        row.pieces_jointes ||
        ""
    )
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    return {
        channel: normalizeChannel(row.channel),
        customer_id: row.customer_id || row.client_id || null,
        contract_id: row.contract_id || row.case_id || row.dossier_id || row.claim_id || null,
        carrier_profile:
            row.carrier_profile || row.profile || row.entreprise || row.secteur || row.mutuelle || row.assureur || row.organisme || "generic",
        provider: row.provider || "mock",
        claim_text: row.claim_text || row.message || row.description || "",
        attached_documents: attachedDocuments,
    };
}

function normalizeChannel(value) {
    const normalized = (value || "").trim().toLowerCase();
    if (["email", "telephone", "courrier", "portail"].includes(normalized)) {
        return normalized;
    }
    return "email";
}

function parseCsv(content) {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return [];
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);
    return lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header] = (values[index] || "").trim();
        });

        return row;
    });
}

function splitCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function normalizeHeader(header) {
    return header
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("-", "_");
}

function exportBatchResults() {
    if (!lastBatchItems.length) {
        return;
    }

    const headers = [
        "source_file",
        "carrier_profile",
        "carrier_profile_label",
        "customer_id",
        "contract_id",
        "category",
        "category_label",
        "priority",
        "priority_label",
        "attention_score",
        "attention_level",
        "attention_level_label",
        "business_status",
        "business_status_label",
        "manual_business_status",
        "manual_business_status_label",
        "recommended_next_action",
        "recommended_next_action_label",
        "missing_information",
        "missing_information_labels",
        "friction_flags",
        "friction_flag_labels",
        "duplicate_suspected",
        "duplicate_cluster_size",
        "documents_received",
        "operator_summary",
        "ai_provider",
        "ai_model",
    ];

    const rows = lastBatchItems.map((item) => {
        const source = findSourceLabel(item);
        const carrierProfile = CARRIER_PROFILES[resolveCarrierProfile(item.carrier_profile)];
        return [
            source,
            item.carrier_profile || "",
            carrierProfile.title,
            item.customer_id || "",
            item.contract_id || "",
            item.category || "",
            item.category_label || "",
            item.priority || "",
            item.priority_label || "",
            item.attention_score || "",
            item.attention_level || "",
            item.attention_level_label || "",
            item.business_status || "",
            item.business_status_label || "",
            item.manual_business_status || "",
            item.manual_business_status_label || "",
            item.recommended_next_action || "",
            item.recommended_next_action_label || "",
            (item.missing_information || []).join(" | "),
            (item.missing_information_labels || []).join(" | "),
            (item.friction_flags || []).join(" | "),
            (item.friction_flag_labels || []).join(" | "),
            item.duplicate_suspected ? "yes" : "no",
            item.duplicate_cluster_size || "",
            (item.documents_received || []).join(" | "),
            item.operator_summary || "",
            item.ai_provider || "",
            item.ai_model || "",
        ];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map(toCsvCell).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

    link.href = url;
    link.download = `claims-intake-batch-results-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportMissingActions() {
    const actionableItems = lastBatchItems.filter((item) => item.missing_information?.length);
    if (!actionableItems.length) {
        return;
    }

    const headers = [
        "source_file",
        "customer_id",
        "contract_id",
        "category_label",
        "missing_information_labels",
        "client_request_subject",
        "client_request_message",
    ];

    const rows = actionableItems.map((item) => [
        findSourceLabel(item),
        item.customer_id || "",
        item.contract_id || "",
        item.category_label || "",
        (item.missing_information_labels || []).join(" | "),
        item.client_request_subject || "",
        item.client_request_message || "",
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map(toCsvCell).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

    link.href = url;
    link.download = `claims-intake-missing-actions-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function copyToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text || "");
        addLogEntry({
            action: "Copie message",
            source: "Interface",
            caseRef: "Message client",
            detail: successMessage,
        });
    } catch {
        addLogEntry({
            action: "Copie echouee",
            source: "Interface",
            caseRef: "Message client",
            detail: "Le navigateur a refuse la copie automatique.",
        });
    }
}

function toCsvCell(value) {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
}

function renderBatchSummary(summaryData) {
    batchSummary.innerHTML = `
        <div class="metric">
            <span>Total dossiers</span>
            <strong>${escapeHtml(summaryData.total_items)}</strong>
        </div>
        <div class="metric">
            <span>Prioritaires</span>
            <strong>${escapeHtml(summaryData.high_priority)}</strong>
        </div>
        <div class="metric">
            <span>Incomplets</span>
            <strong>${escapeHtml(summaryData.missing_information_cases)}</strong>
        </div>
        <div class="metric">
            <span>Attention critique</span>
            <strong>${escapeHtml(summaryData.critical_attention)}</strong>
        </div>
        <div class="metric">
            <span>Doublons suspects</span>
            <strong>${escapeHtml(summaryData.duplicate_suspicions)}</strong>
        </div>
    `;
}

function renderOperatorDashboard(items) {
    const effectiveItems = (items || []).map((item) => {
        const override = manualStatusOverrides[buildItemKey(item)];
        return {
            ...item,
            effective_status: override?.value || item.business_status,
            effective_status_label: override?.label || item.business_status_label,
        };
    });

    const criticalItems = effectiveItems.filter((item) => item.attention_level === "critical");
    const blockedItems = effectiveItems.filter((item) => item.effective_status === "blocked");
    const followupItems = effectiveItems.filter((item) => item.missing_information?.length);
    const routingItems = effectiveItems.filter((item) =>
        ["ready_to_route", "ready_for_priority_queue", "validated"].includes(item.effective_status),
    );

    operatorDashboardSummary.innerHTML = `
        <div class="metric">
            <span>File critique</span>
            <strong>${escapeHtml(criticalItems.length || "-")}</strong>
        </div>
        <div class="metric">
            <span>Dossiers bloques</span>
            <strong>${escapeHtml(blockedItems.length || "-")}</strong>
        </div>
        <div class="metric">
            <span>Relances pretes</span>
            <strong>${escapeHtml(followupItems.length || "-")}</strong>
        </div>
        <div class="metric">
            <span>Pret a router</span>
            <strong>${escapeHtml(routingItems.length || "-")}</strong>
        </div>
    `;

    operatorCriticalList.innerHTML = renderOperatorLane(
        criticalItems,
        "Aucun dossier critique.",
        (item) =>
            `${item.contract_id || item.customer_id || "Sans reference"} • ${item.category_label} • ${item.attention_level_label}`,
    );
    operatorBlockedList.innerHTML = renderOperatorLane(
        blockedItems,
        "Aucun blocage actif.",
        (item) =>
            `${item.contract_id || item.customer_id || "Sans reference"} • ${item.missing_information_labels.join(", ") || "A revoir"}`,
    );
    operatorRoutingList.innerHTML = renderOperatorLane(
        routingItems,
        "Aucun dossier pret a router.",
        (item) =>
            `${item.contract_id || item.customer_id || "Sans reference"} • ${item.effective_status_label} • ${item.recommended_next_action_label}`,
    );
}

function renderOperatorLane(items, emptyLabel, formatter) {
    if (!items.length) {
        return `<li>${escapeHtml(emptyLabel)}</li>`;
    }

    return items
        .slice(0, 8)
        .map((item) => `<li>${escapeHtml(formatter(item))}</li>`)
        .join("");
}

function setDocumentSummary({ type, status, completion }) {
    documentSummary.innerHTML = `
        <div><dt>Type</dt><dd>${escapeHtml(type)}</dd></div>
        <div><dt>Etat</dt><dd>${escapeHtml(status)}</dd></div>
        <div><dt>Completude</dt><dd>${escapeHtml(completion)}</dd></div>
    `;
}

function setFollowupSummary({ type, urgency, status }) {
    followupSummary.innerHTML = `
        <div><dt>Type</dt><dd>${escapeHtml(type)}</dd></div>
        <div><dt>Urgence</dt><dd>${escapeHtml(urgency)}</dd></div>
        <div><dt>Statut</dt><dd>${escapeHtml(status)}</dd></div>
    `;
}

function setFollowupWorkflowSummary({ company, workflow, logic }) {
    followupWorkflowSummary.innerHTML = `
        <div><dt>Entreprise</dt><dd>${escapeHtml(company)}</dd></div>
        <div><dt>Workflow</dt><dd>${escapeHtml(workflow)}</dd></div>
        <div><dt>Logique</dt><dd>${escapeHtml(logic)}</dd></div>
    `;
}

function renderDocumentRequestMessage(tone, channel, subject, message) {
    const toneLabel = {
        neutral: "Neutre",
        commercial: "Plus commercial",
        direct: "Plus direct operateur",
    }[tone] || tone || "-";
    const channelLabel = {
        email: "Email",
        sms: "SMS",
        courrier: "Courrier",
    }[channel] || channel || "-";
    documentRequestSummary.innerHTML = `
        <div><dt>Ton</dt><dd>${escapeHtml(toneLabel)}</dd></div>
        <div><dt>Canal</dt><dd>${escapeHtml(channelLabel)}</dd></div>
        <div><dt>Sujet</dt><dd>${escapeHtml(subject || "-")}</dd></div>
    `;
    documentRequestMessage.textContent = message || "Le message client apparaitra ici.";
}

function renderFollowupRequestMessage(tone, channel, subject, message) {
    const toneLabel = {
        neutral: "Neutre",
        commercial: "Plus commercial",
        direct: "Plus direct operateur",
    }[tone] || tone || "-";
    const channelLabel = {
        email: "Email",
        sms: "SMS",
        courrier: "Courrier",
    }[channel] || channel || "-";
    followupRequestSummary.innerHTML = `
        <div><dt>Ton</dt><dd>${escapeHtml(toneLabel)}</dd></div>
        <div><dt>Canal</dt><dd>${escapeHtml(channelLabel)}</dd></div>
        <div><dt>Sujet</dt><dd>${escapeHtml(subject || "-")}</dd></div>
    `;
    followupRequestMessage.textContent = message || "Le message de relance apparaitra ici.";
}

function renderFollowupMissing(items) {
    if (!items || items.length === 0) {
        followupMissingList.innerHTML = "<li>Aucune piece manquante detectee.</li>";
        return;
    }

    followupMissingList.innerHTML = items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
}

function renderDocumentLists(data) {
    if (!data.missing_required_labels?.length) {
        documentMissingList.innerHTML = "<li>Aucune piece requise manquante.</li>";
    } else {
        documentMissingList.innerHTML = data.missing_required_labels
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("");
    }

    const presentDocuments = [
        ...(data.required_documents || []).filter((item) => item.present).map((item) => item.label),
        ...(data.optional_documents || []).filter((item) => item.present).map((item) => item.label),
    ];

    if (!presentDocuments.length) {
        documentPresentList.innerHTML = "<li>Aucune piece detectee.</li>";
        return;
    }

    documentPresentList.innerHTML = presentDocuments
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
}

function renderMissingActionsPanel(items) {
    const actionableItems = (items || []).filter((item) => item.missing_information?.length);
    if (!actionableItems.length) {
        missingActionsPanel.innerHTML =
            '<p class="csv-status">Aucune relance client a preparer sur ce batch.</p>';
        return;
    }

    missingActionsPanel.innerHTML = actionableItems
        .map((item) => {
            const itemKey = buildItemKey(item);
            const missing = item.missing_information_labels.join(", ");
            return `
                <article class="action-card">
                    <div class="action-card-head">
                        <div>
                            <strong>${escapeHtml(item.contract_id || item.customer_id || "Dossier sans reference")}</strong>
                            <p class="csv-status">${escapeHtml(findSourceLabel(item))} • ${escapeHtml(item.category_label)}</p>
                        </div>
                        <button type="button" class="secondary action-copy-button" data-item-key="${escapeHtml(itemKey)}">
                            Copier le message
                        </button>
                    </div>
                    <p class="hint">Informations a demander: ${escapeHtml(missing)}</p>
                    <pre class="output action-message">${escapeHtml(item.client_request_message_display || item.client_request_message || "Aucun message genere.")}</pre>
                </article>
            `;
        })
        .join("");
}

function renderBatchTable(items) {
    if (!items || items.length === 0) {
        batchTableBody.innerHTML = '<tr><td colspan="11">Aucun resultat disponible.</td></tr>';
        return;
    }

    batchTableBody.innerHTML = items
        .map((item) => {
            const missing = item.missing_information_labels.length
                ? item.missing_information_labels.join(", ")
                : "Aucune";
            const itemKey = buildItemKey(item);
            const override = manualStatusOverrides[itemKey];
            const shownStatusValue = override?.value || item.business_status;
            const shownStatusLabel = override?.label || item.business_status_label;
            const carrierProfile = CARRIER_PROFILES[resolveCarrierProfile(item.carrier_profile)];
            const friction = item.friction_flag_labels.length
                ? item.friction_flag_labels.join(", ")
                : "Aucune";

            return `
                <tr
                    data-priority="${escapeHtml(item.priority)}"
                    data-category="${escapeHtml(item.category_label)}"
                    data-status="${escapeHtml(shownStatusLabel)}"
                    data-attention="${escapeHtml(item.attention_level)}"
                    data-missing="${item.missing_information_labels.length > 0 ? "yes" : "no"}"
                    data-item-key="${escapeHtml(itemKey)}"
                    data-search="${escapeHtml(
                        [
                            findSourceLabel(item),
                            carrierProfile.title,
                            item.customer_id || "",
                            item.contract_id || "",
                            item.category_label || "",
                            item.attention_level_label || "",
                            friction,
                            shownStatusLabel || "",
                            item.recommended_next_action_label || "",
                        ].join(" ").toLowerCase(),
                    )}"
                >
                    <td>${escapeHtml(findSourceLabel(item))}</td>
                    <td>${escapeHtml(item.customer_id || "-")}</td>
                    <td>${escapeHtml(item.contract_id || "-")}</td>
                    <td>${escapeHtml(item.category_label)}</td>
                    <td><span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority_label)}</span></td>
                    <td><span class="badge attention-${escapeHtml(item.attention_level)}">${escapeHtml(item.attention_level_label)} (${escapeHtml(item.attention_score)})</span></td>
                    <td><span class="badge ${escapeHtml(shownStatusValue)}">${escapeHtml(shownStatusLabel)}</span></td>
                    <td>
                        <select class="status-select" data-item-key="${escapeHtml(itemKey)}">
                            ${renderStatusOptions(item, override)}
                        </select>
                    </td>
                    <td>${escapeHtml(item.recommended_next_action_label)}</td>
                    <td>${escapeHtml(friction)}</td>
                    <td>${escapeHtml(missing)}</td>
                </tr>
            `;
        })
        .join("");
    highlightSelectedRow();
}

function findSourceLabel(item) {
    const row = csvRows.find((candidate) => {
        const payload = convertCsvRowToPayload(candidate);
        return (
            payload.claim_text === item.claim_text &&
            (payload.customer_id || "") === (item.customer_id || "") &&
            (payload.contract_id || "") === (item.contract_id || "")
        );
    });
    return row?.source_file || "Formulaire";
}

function resetBatchVisuals(status = "-") {
    lastBatchItems = [];
    manualStatusOverrides = {};
    persistOverrides();
    selectedItemKey = "";
    void persistOperatorState();
    exportBatchButton.disabled = true;
    exportMissingActionsButton.disabled = true;
    filterPriority.value = "";
    filterCategory.innerHTML = '<option value="">Toutes</option>';
    filterStatus.innerHTML = '<option value="">Tous</option>';
    filterAttention.value = "";
    filterSearch.value = "";
    filterMissingOnly.checked = false;
    batchFilterStatus.textContent = "Aucun filtre actif.";
    batchSummary.innerHTML = `
        <div class="metric">
            <span>Total dossiers</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Prioritaires</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Incomplets</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Attention critique</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Doublons suspects</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
    `;
    batchTableBody.innerHTML = '<tr><td colspan="11">Aucun batch lance.</td></tr>';
    caseDetail.innerHTML = '<p class="csv-status">Clique sur une ligne du batch pour afficher le detail du dossier.</p>';
    missingActionsPanel.innerHTML = '<p class="csv-status">Lance un batch pour afficher les relances pretes a traiter.</p>';
    operatorDashboardSummary.innerHTML = `
        <div class="metric">
            <span>File critique</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Dossiers bloques</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Relances pretes</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
        <div class="metric">
            <span>Pret a router</span>
            <strong>${escapeHtml(status)}</strong>
        </div>
    `;
    operatorCriticalList.innerHTML = "<li>Aucun batch lance.</li>";
    operatorBlockedList.innerHTML = "<li>Aucun batch lance.</li>";
    operatorRoutingList.innerHTML = "<li>Aucun batch lance.</li>";
}

function hydrateCategoryFilter(items) {
    const categories = [...new Set(items.map((item) => item.category_label))].sort();
    filterCategory.innerHTML = '<option value="">Toutes</option>' +
        categories
            .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
            .join("");
}

function hydrateStatusFilter(items) {
    const statuses = [
        ...new Set([
            ...items.map((item) => item.business_status_label),
            "Valide",
            "Traite",
        ]),
    ].sort();
    filterStatus.innerHTML = '<option value="">Tous</option>' +
        statuses
            .map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`)
            .join("");
}

function applyBatchFilters() {
    const rows = Array.from(batchTableBody.querySelectorAll("tr"));
    if (rows.length === 0 || (rows.length === 1 && rows[0].children.length === 1)) {
        batchFilterStatus.textContent = "Aucun filtre actif.";
        return;
    }

    const selectedPriority = filterPriority.value;
    const selectedCategory = filterCategory.value;
    const selectedStatus = filterStatus.value;
    const selectedAttention = filterAttention.value;
    const searchTerm = filterSearch.value.trim().toLowerCase();
    const missingOnly = filterMissingOnly.checked;
    let visibleCount = 0;

    rows.forEach((row) => {
        const matchesPriority = !selectedPriority || row.dataset.priority === selectedPriority;
        const matchesCategory = !selectedCategory || row.dataset.category === selectedCategory;
        const matchesStatus = !selectedStatus || row.dataset.status === selectedStatus;
        const matchesAttention = !selectedAttention || row.dataset.attention === selectedAttention;
        const matchesMissing = !missingOnly || row.dataset.missing === "yes";
        const matchesSearch = !searchTerm || row.dataset.search.includes(searchTerm);
        const isVisible =
            matchesPriority &&
            matchesCategory &&
            matchesStatus &&
            matchesAttention &&
            matchesMissing &&
            matchesSearch;

        row.classList.toggle("batch-row-hidden", !isVisible);
        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (visibleCount === 0) {
        batchFilterStatus.textContent = "Aucun dossier ne correspond aux filtres.";
    } else {
        batchFilterStatus.textContent = `${visibleCount} dossier(s) affiches apres filtrage.`;
    }
}

function handleStatusOverrideChange(event) {
    const select = event.target.closest(".status-select");
    if (!select) {
        return;
    }

    const itemKey = select.dataset.itemKey;
    const value = select.value;
    const label = value ? select.options[select.selectedIndex].text : "";

    if (!value) {
        delete manualStatusOverrides[itemKey];
    } else {
        manualStatusOverrides[itemKey] = { value, label };
    }
    persistOverrides();

    lastBatchItems = lastBatchItems.map((item) => {
        if (buildItemKey(item) !== itemKey) {
            return item;
        }
        return {
            ...item,
            manual_business_status: value,
            manual_business_status_label: label,
        };
    });

    renderBatchTable(lastBatchItems);
    renderOperatorDashboard(lastBatchItems);
    applyBatchFilters();
    const updatedItem = lastBatchItems.find((item) => buildItemKey(item) === itemKey);
    if (updatedItem && selectedItemKey === itemKey) {
        renderCaseDetail(updatedItem);
    }
    addLogEntry({
        action: value ? "Statut modifie" : "Statut reinitialise",
        source: findSourceLabel(
            lastBatchItems.find((item) => buildItemKey(item) === itemKey) || {},
        ),
        caseRef: itemKey.split("::").slice(1, 3).filter(Boolean).join(" / ") || "Dossier inconnu",
        detail: value ? `Nouveau statut: ${label}` : "Retour au statut automatique",
    });
}

function renderStatusOptions(item, override) {
    const current = override?.value || "";
    return [
        `<option value="">Automatique (${escapeHtml(item.business_status_label)})</option>`,
        `<option value="blocked" ${current === "blocked" ? "selected" : ""}>Bloque</option>`,
        `<option value="to_review" ${current === "to_review" ? "selected" : ""}>A revoir</option>`,
        `<option value="ready_to_route" ${current === "ready_to_route" ? "selected" : ""}>Pret a router</option>`,
        `<option value="ready_for_priority_queue" ${current === "ready_for_priority_queue" ? "selected" : ""}>Pret pour file prioritaire</option>`,
        `<option value="validated" ${current === "validated" ? "selected" : ""}>Valide</option>`,
        `<option value="processed" ${current === "processed" ? "selected" : ""}>Traite</option>`,
    ].join("");
}

function buildItemKey(item) {
    return [
        findSourceLabel(item),
        item.customer_id || "",
        item.contract_id || "",
        item.claim_text || "",
    ].join("::");
}

function handleBatchRowClick(event) {
    if (event.target.closest(".status-select")) {
        return;
    }

    const row = event.target.closest("tr[data-item-key]");
    if (!row) {
        return;
    }

    selectedItemKey = row.dataset.itemKey;
    const item = lastBatchItems.find((candidate) => buildItemKey(candidate) === selectedItemKey);
    if (!item) {
        return;
    }

    renderCaseDetail(item);
    highlightSelectedRow();
    void persistOperatorState();
}

function handleMissingActionsClick(event) {
    const button = event.target.closest(".action-copy-button");
    if (!button) {
        return;
    }

    const item = lastBatchItems.find((candidate) => buildItemKey(candidate) === button.dataset.itemKey);
    if (!item) {
        return;
    }

    void copyToClipboard(
        item.client_request_message || "",
        `Relance client copiee pour ${item.contract_id || item.customer_id || "dossier"}.`,
    );
}

function highlightSelectedRow() {
    const rows = batchTableBody.querySelectorAll("tr[data-item-key]");
    rows.forEach((row) => {
        row.classList.toggle("is-selected", row.dataset.itemKey === selectedItemKey);
    });
}

function renderCaseDetail(item) {
    const override = manualStatusOverrides[buildItemKey(item)];
    const shownStatusValue = override?.value || item.business_status;
    const shownStatusLabel = override?.label || item.business_status_label;
    const carrierProfile = CARRIER_PROFILES[resolveCarrierProfile(item.carrier_profile)];
    const documents = item.documents_received?.length
        ? item.documents_received_display || item.documents_received.join(", ")
        : "Aucune piece declaree";
    const missing = item.missing_information_labels?.length
        ? item.missing_information_labels.join(", ")
        : "Aucune";
    const friction = item.friction_flag_labels?.length
        ? item.friction_flag_labels.join(", ")
        : "Aucune";
    const duplicateInfo = item.duplicate_suspected
        ? `Oui (${item.duplicate_cluster_size} dossier(s) proches dans le batch)`
        : "Non";

    caseDetail.innerHTML = `
        <div class="case-detail-grid">
            <div class="case-detail-item">
                <span>Source</span>
                <strong>${escapeHtml(findSourceLabel(item))}</strong>
            </div>
            <div class="case-detail-item">
                <span>Profil entreprise</span>
                <strong>${escapeHtml(carrierProfile.title)}</strong>
            </div>
            <div class="case-detail-item">
                <span>Client</span>
                <strong>${escapeHtml(item.customer_id || "-")}</strong>
            </div>
            <div class="case-detail-item">
                <span>Dossier</span>
                <strong>${escapeHtml(item.contract_id || "-")}</strong>
            </div>
            <div class="case-detail-item">
                <span>Categorie</span>
                <strong>${escapeHtml(item.category_label)}</strong>
            </div>
            <div class="case-detail-item">
                <span>Priorite</span>
                <strong><span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority_label)}</span></strong>
            </div>
            <div class="case-detail-item">
                <span>Attention</span>
                <strong><span class="badge attention-${escapeHtml(item.attention_level)}">${escapeHtml(item.attention_level_label)} (${escapeHtml(item.attention_score)})</span></strong>
            </div>
            <div class="case-detail-item">
                <span>Statut effectif</span>
                <strong><span class="badge ${escapeHtml(shownStatusValue)}">${escapeHtml(shownStatusLabel)}</span></strong>
            </div>
            <div class="case-detail-item">
                <span>Action recommandee</span>
                <strong>${escapeHtml(item.recommended_next_action_label)}</strong>
            </div>
            <div class="case-detail-item">
                <span>Informations manquantes</span>
                <strong>${escapeHtml(missing)}</strong>
            </div>
            <div class="case-detail-item">
                <span>Friction detectee</span>
                <strong>${escapeHtml(friction)}</strong>
            </div>
            <div class="case-detail-item">
                <span>Doublon suspect</span>
                <strong>${escapeHtml(duplicateInfo)}</strong>
            </div>
        </div>
        <div>
            <span class="csv-status">Pieces jointes</span>
            <pre class="output">${escapeHtml(documents)}</pre>
        </div>
        <div>
            <span class="csv-status">Resume operateur</span>
            <pre class="output">${escapeHtml(item.operator_summary_display || item.operator_summary || "Aucun resume disponible.")}</pre>
        </div>
        <div>
            <span class="csv-status">Texte de la demande</span>
            <pre class="output">${escapeHtml(item.claim_text_display || item.claim_text || "Texte non disponible.")}</pre>
        </div>
        <div>
            <span class="csv-status">Message client suggere</span>
            <pre class="output">${escapeHtml(item.client_request_message_display || item.client_request_message || "Aucun message genere.")}</pre>
        </div>
    `;
}

function renderAttention({ level, score, flags }) {
    attentionSummary.innerHTML = `
        <div><dt>Attention</dt><dd>${escapeHtml(level)}</dd></div>
        <div><dt>Score</dt><dd>${escapeHtml(score)}</dd></div>
    `;

    if (!flags || flags.length === 0) {
        frictionList.innerHTML = "<li>Aucun point de friction detecte.</li>";
        return;
    }

    frictionList.innerHTML = flags.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function getCurrentCarrierProfile() {
    return CARRIER_PROFILES[carrierProfileSelect.value] || CARRIER_PROFILES.generic;
}

function resolveCarrierProfile(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) {
        return "generic";
    }
    if (normalized.includes("service")) {
        return "service_b2b";
    }
    if (normalized.includes("immobilier") || normalized.includes("syndic")) {
        return "immobilier_syndic";
    }
    if (normalized.includes("negoce") || normalized.includes("adv") || normalized.includes("commerce")) {
        return "negoce_adv";
    }
    if (normalized.includes("cabinet") || normalized.includes("gestion")) {
        return "cabinet_gestion";
    }
    if (normalized.includes("maaf")) {
        return "maaf";
    }
    if (normalized.includes("macif")) {
        return "macif";
    }
    if (normalized.includes("maif")) {
        return "maif";
    }
    if (normalized.includes("niort") || normalized.includes("lab")) {
        return "niort_lab";
    }
    return "generic";
}

function renderCarrierProfile() {
    const profile = getCurrentCarrierProfile();
    carrierBadge.textContent = profile.badge;
    carrierTitle.textContent = profile.title;
    carrierDescription.textContent = profile.description;
    carrierFocusList.innerHTML = profile.focus.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    carrierDocumentsList.innerHTML = profile.documents
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    carrierRulesList.innerHTML = profile.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    carrierWorkflowsList.innerHTML = profile.workflows
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    carrierProfileReadonly.value = profile.title;
    renderWorkflowGuides();
    renderModuleGuides();
}

function renderWorkflowGuides() {
    const profileKey = carrierProfileSelect.value || "generic";
    const cards = WORKFLOW_PLAYBOOKS[profileKey] || WORKFLOW_PLAYBOOKS.generic;
    workflowGuideCards.innerHTML = cards
        .map(
            (card) => `
                <article class="workflow-guide-card">
                    <p class="section-kicker">${escapeHtml(getModuleLabel(card.module))}</p>
                    <h3>${escapeHtml(card.title)}</h3>
                    <p class="hint">${escapeHtml(card.when)}</p>
                    <p><strong>Entree minimale :</strong> ${escapeHtml(card.inputs.join(", "))}</p>
                    <p><strong>Resultat attendu :</strong> ${escapeHtml(card.outputs.join(", "))}</p>
                    <button type="button" class="secondary workflow-guide-button" data-workflow-id="${escapeHtml(card.id)}">
                        Utiliser ce workflow
                    </button>
                </article>
            `,
        )
        .join("");
}

function renderModuleGuides() {
    const profileKey = carrierProfileSelect.value || "generic";
    const cards = WORKFLOW_PLAYBOOKS[profileKey] || WORKFLOW_PLAYBOOKS.generic;
    renderModuleGuide(claimsModuleGuide, cards.find((item) => item.module === "claims"));
    renderModuleGuide(documentModuleGuide, cards.find((item) => item.module === "document"));
    renderModuleGuide(followupModuleGuide, cards.find((item) => item.module === "followup"));
}

function renderModuleGuide(container, card) {
    if (!card) {
        container.innerHTML = '<h3>Guide indisponible</h3><p class="hint">Aucun workflow guide pour ce module.</p>';
        return;
    }

    container.innerHTML = `
        <h3>${escapeHtml(card.title)}</h3>
        <p class="hint">${escapeHtml(card.when)}</p>
        <p><strong>Entree minimale :</strong> ${escapeHtml(card.inputs.join(", "))}</p>
        <p><strong>Sortie attendue :</strong> ${escapeHtml(card.outputs.join(", "))}</p>
    `;
}

function getModuleLabel(module) {
    if (module === "claims") {
        return "Claims intake";
    }
    if (module === "document") {
        return "Completude documentaire";
    }
    if (module === "followup") {
        return "Relance administrative";
    }
    return "Workflow";
}

function handleWorkflowGuideClick(event) {
    const button = event.target.closest(".workflow-guide-button");
    if (!button) {
        return;
    }

    const workflowId = button.dataset.workflowId || "";
    const profileKey = carrierProfileSelect.value || "generic";
    const cards = WORKFLOW_PLAYBOOKS[profileKey] || WORKFLOW_PLAYBOOKS.generic;
    const card = cards.find((item) => item.id === workflowId);
    const profile = getCurrentCarrierProfile();
    if (!card) {
        return;
    }

    if (card.module === "claims") {
        fillExample.click();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    if (card.module === "document") {
        fillDocumentExample.click();
        if (profileKey === "immobilier_syndic") {
            documentForm.document_type.value = "reimbursement";
            documentForm.document_text.value = profile.sample.claim_text;
            documentForm.attached_documents.value = profile.sample.attached_documents;
        }
        documentForm.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    if (card.module === "followup") {
        fillFollowupExample.click();
        if (profileKey === "negoce_adv") {
            followupForm.followup_type.value = "invoice";
            followupForm.context_text.value = profile.sample.claim_text;
            followupForm.attached_documents.value = profile.sample.attached_documents;
            followupForm.expected_documents.value = "bon de commande signe";
            followupForm.days_overdue.value = "12";
            followupForm.outstanding_amount.value = "245.90";
        } else if (profileKey === "cabinet_gestion") {
            followupForm.followup_type.value = "missing_document";
            followupForm.context_text.value = profile.sample.claim_text;
            followupForm.attached_documents.value = profile.sample.attached_documents;
            followupForm.expected_documents.value = "RIB, facture";
        }
        followupForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function addLogEntry({ action, source, caseRef, detail }) {
    actionLogEntries.unshift({
        timestamp: new Date().toLocaleString("fr-FR"),
        action,
        source,
        caseRef,
        detail,
    });
    actionLogEntries = actionLogEntries.slice(0, 200);
    persistActionLog();
    renderActionLog();
}

function renderActionLog() {
    if (actionLogEntries.length === 0) {
        actionLogBody.innerHTML = '<tr><td colspan="5">Aucune action journalisee.</td></tr>';
        return;
    }

    actionLogBody.innerHTML = actionLogEntries
        .map((entry) => `
            <tr>
                <td>${escapeHtml(entry.timestamp)}</td>
                <td>${escapeHtml(entry.action)}</td>
                <td>${escapeHtml(entry.source)}</td>
                <td>${escapeHtml(entry.caseRef)}</td>
                <td>${escapeHtml(entry.detail)}</td>
            </tr>
        `)
        .join("");
}

function clearActionLog() {
    actionLogEntries = [];
    persistActionLog();
    renderActionLog();
}

async function initializeOperatorState() {
    await loadPersistedState();
    renderActionLog();
    restoreOperatorState();
}

function restoreOperatorState() {
    if (!lastBatchItems.length) {
        return;
    }

    renderBatchSummary(buildBatchSummaryFromItems(lastBatchItems));
    renderOperatorDashboard(lastBatchItems);
    renderBatchTable(lastBatchItems);
    renderMissingActionsPanel(lastBatchItems);
    hydrateCategoryFilter(lastBatchItems);
    hydrateStatusFilter(lastBatchItems);
    exportBatchButton.disabled = lastBatchItems.length === 0;
    exportMissingActionsButton.disabled = !lastBatchItems.some((item) => item.missing_information.length);
    batchOutput.textContent = "Etat operateur restaure depuis le stockage local backend.";
    applyBatchFilters();

    const restoredItem =
        lastBatchItems.find((item) => buildItemKey(item) === selectedItemKey) || lastBatchItems[0];
    if (restoredItem) {
        selectedItemKey = buildItemKey(restoredItem);
        renderCaseDetail(restoredItem);
        highlightSelectedRow();
    }
}

function buildBatchSummaryFromItems(items) {
    return {
        total_items: items.length,
        high_priority: items.filter((item) => item.priority === "high").length,
        critical_attention: items.filter((item) => item.attention_level === "critical").length,
        missing_information_cases: items.filter((item) => item.missing_information?.length).length,
        duplicate_suspicions: items.filter((item) => item.duplicate_suspected).length,
    };
}

async function loadPersistedState() {
    try {
        const response = await fetch("/automations/operator-state");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const storedState = await response.json();
        manualStatusOverrides = storedState.manual_status_overrides || {};
        actionLogEntries = storedState.action_log_entries || [];
        lastBatchItems = storedState.last_batch_items || [];
        selectedItemKey = storedState.selected_item_key || "";
        persistLocalFallback();
        return;
    } catch {}

    try {
        const storedOverrides = localStorage.getItem(STORAGE_KEYS.overrides);
        const storedLog = localStorage.getItem(STORAGE_KEYS.actionLog);

        manualStatusOverrides = storedOverrides ? JSON.parse(storedOverrides) : {};
        actionLogEntries = storedLog ? JSON.parse(storedLog) : [];
        lastBatchItems = [];
        selectedItemKey = "";
    } catch {
        manualStatusOverrides = {};
        actionLogEntries = [];
        lastBatchItems = [];
        selectedItemKey = "";
    }
}

function persistOverrides() {
    persistLocalFallback();
    void persistOperatorState();
}

function persistActionLog() {
    persistLocalFallback();
    void persistOperatorState();
}

function persistLocalFallback() {
    try {
        localStorage.setItem(STORAGE_KEYS.overrides, JSON.stringify(manualStatusOverrides));
        localStorage.setItem(STORAGE_KEYS.actionLog, JSON.stringify(actionLogEntries));
    } catch {}
}

async function persistOperatorState() {
    try {
        await fetch("/automations/operator-state", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                manual_status_overrides: manualStatusOverrides,
                action_log_entries: actionLogEntries,
                last_batch_items: lastBatchItems,
                selected_item_key: selectedItemKey,
            }),
        });
    } catch {}
}
