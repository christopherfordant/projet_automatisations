const form = document.getElementById("claims-form");
const documentForm = document.getElementById("document-form");
const fillDocumentExample = document.getElementById("fill-document-example");
const carrierProfileSelect = document.getElementById("carrier-profile");
const carrierProfileReadonly = document.getElementById("carrier-profile-readonly");
const carrierBadge = document.getElementById("carrier-badge");
const carrierTitle = document.getElementById("carrier-title");
const carrierDescription = document.getElementById("carrier-description");
const carrierFocusList = document.getElementById("carrier-focus-list");
const carrierDocumentsList = document.getElementById("carrier-documents-list");
const carrierRulesList = document.getElementById("carrier-rules-list");
const fillExample = document.getElementById("fill-example");
const summary = document.getElementById("summary");
const documentSummary = document.getElementById("document-summary");
const documentRequestSummary = document.getElementById("document-request-summary");
const attentionSummary = document.getElementById("attention-summary");
const missingList = document.getElementById("missing-list");
const documentMissingList = document.getElementById("document-missing-list");
const documentPresentList = document.getElementById("document-present-list");
const frictionList = document.getElementById("friction-list");
const operatorSummary = document.getElementById("operator-summary");
const documentOutput = document.getElementById("document-output");
const documentRequestMessage = document.getElementById("document-request-message");
const copyDocumentMessageButton = document.getElementById("copy-document-message");
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
let csvRows = [];
let lastBatchItems = [];
let manualStatusOverrides = {};
let actionLogEntries = [];
let selectedItemKey = "";
const CARRIER_PROFILES = {
    generic: {
        badge: "Pole niortais",
        title: "Base commune MAAF, MACIF, MAIF",
        description: "Tronc commun pour tester l'analyse d'une demande dans l'ecosysteme mutualiste de Niort.",
        focus: [
            "Tri des demandes entrantes sante",
            "Verification des pieces et references adherent",
            "Routage vers le bon service de gestion",
        ],
        documents: ["Facture", "Numero adherent", "Reference dossier", "Canal d'origine"],
        rules: [
            "Prioriser les dossiers urgents",
            "Bloquer les dossiers incomplets",
            "Remonter les reclamations a revoir",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, client CL-2048, dossier DOS-7788, j'ai une relance urgente pour un remboursement de facture en retard. Je n'ai toujours pas de retour sur mon dossier.",
            attached_documents: "facture dentaire",
        },
    },
    maaf: {
        badge: "Mutuelle cible MAAF",
        title: "Remboursement et devis standardises",
        description: "Profil oriente remboursements, devis sante et suivi de pieces classiques.",
        focus: [
            "Suivi de remboursement",
            "Qualification de devis optique et dentaire",
            "Detection des relances client",
        ],
        documents: ["Facture acquittee", "Devis", "Numero adherent"],
        rules: [
            "Orienter vite les relances de remboursement",
            "Controler la presence d'une facture ou d'un devis",
            "Basculer les urgences en file prioritaire",
        ],
        sample: {
            channel: "portail",
            claim_text:
                "Bonjour, adherent MAAF CL-6721, dossier DOS-5510, je relance un remboursement optique urgent depose sur le portail avec un devis et une facture.",
            attached_documents: "devis optique, facture optique",
        },
    },
    macif: {
        badge: "Mutuelle cible MACIF",
        title: "Reclamations et suivi relation adherent",
        description: "Profil centre sur les reclamations de delai, la satisfaction et les cas a reviser.",
        focus: [
            "Reclamations de delai",
            "Demandes de suivi adherent",
            "Escalade des cas sensibles",
        ],
        documents: ["Courrier de reclamation", "Numero dossier", "Historique echanges"],
        rules: [
            "Faire remonter les reclamations en revue humaine",
            "Conserver la trace des delais annonces",
            "Identifier les demandes repetitives",
        ],
        sample: {
            channel: "email",
            claim_text:
                "Bonjour, client MACIF CL-8812, dossier REC-3201, je depose une reclamation car mon remboursement est en attente depuis trois semaines sans reponse.",
            attached_documents: "courrier reclamation, historique echanges",
        },
    },
    maif: {
        badge: "Mutuelle cible MAIF",
        title: "Accompagnement et traitement contextualise",
        description: "Profil utile pour les dossiers demandant plus de contexte, d'accompagnement et de coordination.",
        focus: [
            "Demandes contextualisees",
            "Hospitalisation et cas urgents",
            "Suivi de dossier avec plusieurs echanges",
        ],
        documents: ["Compte rendu", "Facture", "Reference contrat"],
        rules: [
            "Valoriser les signaux d'urgence",
            "Consolider les pieces disperses",
            "Verifier les references de contrat avant routage",
        ],
        sample: {
            channel: "telephone",
            claim_text:
                "Bonjour, assure MAIF CL-5504, dossier HOSP-8122, j'appelle pour une hospitalisation recente et une prise en charge a verifier rapidement.",
            attached_documents: "compte rendu hospitalisation, facture clinique",
        },
    },
    niort_lab: {
        badge: "Plateforme Niort Lab",
        title: "Orchestration avancee pour mutuelles niortaises",
        description: "Profil de demonstration pour une plateforme modulaire, batchable et exploitable par API au-dessus des besoins MAAF, MACIF et MAIF.",
        focus: [
            "Orchestration API par cas d'usage",
            "Traitement batch et routage intelligent",
            "Preparation a l'integration SI locale",
        ],
        documents: ["CSV source", "Identifiants client", "Pieces justificatives normalisees"],
        rules: [
            "Distinguer les besoins par mutuelle des l'entree",
            "Standardiser les sorties pour un usage API",
            "Permettre l'override operateur sans perdre la trace",
        ],
        sample: {
            channel: "courrier",
            claim_text:
                "Bonjour, client LAB-9031, dossier DOS-9902, merci de qualifier ce dossier complexe pour routage prioritaire et controle des pieces justificatives.",
            attached_documents: "facture, attestation, courrier client",
        },
    },
};
const STORAGE_KEYS = {
    overrides: "mutuelle_ai_platform.manual_status_overrides",
    actionLog: "mutuelle_ai_platform.action_log_entries",
};

loadPersistedState();
renderCarrierProfile();
renderActionLog();

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

carrierProfileSelect.addEventListener("change", () => {
    renderCarrierProfile();
});
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
csvDropzone.addEventListener("dragenter", activateDropzone);
csvDropzone.addEventListener("dragover", activateDropzone);
csvDropzone.addEventListener("dragleave", deactivateDropzone);
csvDropzone.addEventListener("drop", handleDrop);
copyDocumentMessageButton.addEventListener("click", () => {
    void copyToClipboard(documentRequestMessage.textContent, "Message documentaire copie.");
});

documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        document_type: documentForm.document_type.value,
        customer_id: documentForm.customer_id.value || null,
        contract_id: documentForm.contract_id.value || null,
        provider: documentForm.provider.value,
        message_tone: documentForm.message_tone.value,
        output_channel: documentForm.output_channel.value,
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
    renderDocumentRequestMessage(
        payload.message_tone,
        payload.output_channel,
        "-",
        "Generation du message en cours...",
    );
    documentMissingList.innerHTML = "<li>Verification en cours...</li>";
    documentPresentList.innerHTML = "<li>Verification en cours...</li>";
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
        renderDocumentLists(data);
        renderDocumentRequestMessage(
            data.message_tone,
            data.output_channel,
            data.client_request_subject,
            data.client_request_message,
        );
        documentOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        setDocumentSummary({
            type: payload.document_type,
            status: "Erreur",
            completion: "-",
        });
        renderDocumentRequestMessage(
            payload.message_tone,
            payload.output_channel,
            "-",
            "Impossible de generer le message client.",
        );
        documentMissingList.innerHTML = "<li>La verification a echoue.</li>";
        documentPresentList.innerHTML = "<li>Aucun resultat.</li>";
        documentOutput.textContent = String(error);
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        channel: form.channel.value,
        customer_id: form.customer_id.value || null,
        contract_id: form.contract_id.value || null,
        provider: form.provider.value,
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
    renderAttention({
        level: "-",
        score: "-",
        flags: ["Analyse en cours..."],
    });
    missingList.innerHTML = "<li>Analyse en cours...</li>";
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
        renderAttention({
            level: data.attention_level_label,
            score: data.attention_score,
            flags: data.friction_flag_labels,
        });
        renderMissing(data.missing_information_labels);
        operatorSummary.textContent = data.operator_summary;
        rawOutput.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        setSummary({
            status: "Erreur",
            category: "-",
            priority: "-",
            action: "-",
        });
        renderAttention({
            level: "-",
            score: "-",
            flags: ["La requete a echoue."],
        });
        missingList.innerHTML = "<li>La requete a echoue.</li>";
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
            row.carrier_profile || row.mutuelle || row.assureur || row.organisme || "generic",
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
                    <pre class="output action-message">${escapeHtml(item.client_request_message || "Aucun message genere.")}</pre>
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
        ? item.documents_received.join(", ")
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
                <span>Profil mutuelle</span>
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
            <pre class="output">${escapeHtml(item.operator_summary || "Aucun resume disponible.")}</pre>
        </div>
        <div>
            <span class="csv-status">Texte de la demande</span>
            <pre class="output">${escapeHtml(item.claim_text || "Texte non disponible.")}</pre>
        </div>
        <div>
            <span class="csv-status">Message client suggere</span>
            <pre class="output">${escapeHtml(item.client_request_message || "Aucun message genere.")}</pre>
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
    carrierProfileReadonly.value = profile.title;
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

function loadPersistedState() {
    try {
        const storedOverrides = localStorage.getItem(STORAGE_KEYS.overrides);
        const storedLog = localStorage.getItem(STORAGE_KEYS.actionLog);

        manualStatusOverrides = storedOverrides ? JSON.parse(storedOverrides) : {};
        actionLogEntries = storedLog ? JSON.parse(storedLog) : [];
    } catch {
        manualStatusOverrides = {};
        actionLogEntries = [];
    }
}

function persistOverrides() {
    try {
        localStorage.setItem(STORAGE_KEYS.overrides, JSON.stringify(manualStatusOverrides));
    } catch {}
}

function persistActionLog() {
    try {
        localStorage.setItem(STORAGE_KEYS.actionLog, JSON.stringify(actionLogEntries));
    } catch {}
}
