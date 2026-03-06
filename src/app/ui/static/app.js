const form = document.getElementById("claims-form");
const fillExample = document.getElementById("fill-example");
const summary = document.getElementById("summary");
const missingList = document.getElementById("missing-list");
const operatorSummary = document.getElementById("operator-summary");
const rawOutput = document.getElementById("raw-output");
const batchOutput = document.getElementById("batch-output");
const batchSummary = document.getElementById("batch-summary");
const batchTableBody = document.getElementById("batch-table-body");
const exportBatchButton = document.getElementById("export-batch");
const filterPriority = document.getElementById("filter-priority");
const filterCategory = document.getElementById("filter-category");
const filterStatus = document.getElementById("filter-status");
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
const STORAGE_KEYS = {
    overrides: "mutuelle_ai_platform.manual_status_overrides",
    actionLog: "mutuelle_ai_platform.action_log_entries",
};

loadPersistedState();
renderActionLog();

fillExample.addEventListener("click", () => {
    form.channel.value = "email";
    form.customer_id.value = "";
    form.contract_id.value = "";
    form.provider.value = "mock";
    form.claim_text.value =
        "Bonjour, client CL-2048, dossier DOS-7788, j'ai une relance urgente pour un remboursement de facture en retard. Je n'ai toujours pas de retour sur mon dossier.";
    form.attached_documents.value = "facture dentaire";
    autofillIdentifiers();
});

claimText.addEventListener("input", autofillIdentifiers);
csvFileInput.addEventListener("change", handleCsvUpload);
csvRowSelect.addEventListener("change", applySelectedCsvRow);
runBatchButton.addEventListener("click", runBatchAnalysis);
exportBatchButton.addEventListener("click", exportBatchResults);
filterPriority.addEventListener("change", applyBatchFilters);
filterCategory.addEventListener("change", applyBatchFilters);
filterStatus.addEventListener("change", applyBatchFilters);
filterSearch.addEventListener("input", applyBatchFilters);
filterMissingOnly.addEventListener("change", applyBatchFilters);
batchTableBody.addEventListener("change", handleStatusOverrideChange);
clearLogButton.addEventListener("click", clearActionLog);
csvDropzone.addEventListener("dragenter", activateDropzone);
csvDropzone.addEventListener("dragover", activateDropzone);
csvDropzone.addEventListener("dragleave", deactivateDropzone);
csvDropzone.addEventListener("drop", handleDrop);

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
        items: csvRows.map(convertCsvRowToPayload),
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

        renderBatchSummary(data.summary);
        renderBatchTable(data.items);
        lastBatchItems = data.items;
        hydrateCategoryFilter(data.items);
        hydrateStatusFilter(data.items);
        exportBatchButton.disabled = data.items.length === 0;
        batchOutput.textContent = JSON.stringify(data, null, 2);
        applyBatchFilters();
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
        "customer_id",
        "contract_id",
        "category",
        "category_label",
        "priority",
        "priority_label",
        "business_status",
        "business_status_label",
        "manual_business_status",
        "manual_business_status_label",
        "recommended_next_action",
        "recommended_next_action_label",
        "missing_information",
        "missing_information_labels",
        "documents_received",
        "operator_summary",
        "ai_provider",
        "ai_model",
    ];

    const rows = lastBatchItems.map((item) => {
        const source = findSourceLabel(item);
        return [
            source,
            item.customer_id || "",
            item.contract_id || "",
            item.category || "",
            item.category_label || "",
            item.priority || "",
            item.priority_label || "",
            item.business_status || "",
            item.business_status_label || "",
            item.manual_business_status || "",
            item.manual_business_status_label || "",
            item.recommended_next_action || "",
            item.recommended_next_action_label || "",
            (item.missing_information || []).join(" | "),
            (item.missing_information_labels || []).join(" | "),
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
    `;
}

function renderBatchTable(items) {
    if (!items || items.length === 0) {
        batchTableBody.innerHTML = '<tr><td colspan="9">Aucun resultat disponible.</td></tr>';
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

            return `
                <tr
                    data-priority="${escapeHtml(item.priority)}"
                    data-category="${escapeHtml(item.category_label)}"
                    data-status="${escapeHtml(shownStatusLabel)}"
                    data-missing="${item.missing_information_labels.length > 0 ? "yes" : "no"}"
                    data-item-key="${escapeHtml(itemKey)}"
                    data-search="${escapeHtml(
                        [
                            findSourceLabel(item),
                            item.customer_id || "",
                            item.contract_id || "",
                            item.category_label || "",
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
                    <td><span class="badge ${escapeHtml(shownStatusValue)}">${escapeHtml(shownStatusLabel)}</span></td>
                    <td>
                        <select class="status-select" data-item-key="${escapeHtml(itemKey)}">
                            ${renderStatusOptions(item, override)}
                        </select>
                    </td>
                    <td>${escapeHtml(item.recommended_next_action_label)}</td>
                    <td>${escapeHtml(missing)}</td>
                </tr>
            `;
        })
        .join("");
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
    exportBatchButton.disabled = true;
    filterPriority.value = "";
    filterCategory.innerHTML = '<option value="">Toutes</option>';
    filterStatus.innerHTML = '<option value="">Tous</option>';
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
    `;
    batchTableBody.innerHTML = '<tr><td colspan="9">Aucun batch lance.</td></tr>';
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
    const searchTerm = filterSearch.value.trim().toLowerCase();
    const missingOnly = filterMissingOnly.checked;
    let visibleCount = 0;

    rows.forEach((row) => {
        const matchesPriority = !selectedPriority || row.dataset.priority === selectedPriority;
        const matchesCategory = !selectedCategory || row.dataset.category === selectedCategory;
        const matchesStatus = !selectedStatus || row.dataset.status === selectedStatus;
        const matchesMissing = !missingOnly || row.dataset.missing === "yes";
        const matchesSearch = !searchTerm || row.dataset.search.includes(searchTerm);
        const isVisible =
            matchesPriority && matchesCategory && matchesStatus && matchesMissing && matchesSearch;

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
    applyBatchFilters();
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
