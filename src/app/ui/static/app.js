const form = document.getElementById("claims-form");
const fillExample = document.getElementById("fill-example");
const summary = document.getElementById("summary");
const missingList = document.getElementById("missing-list");
const operatorSummary = document.getElementById("operator-summary");
const rawOutput = document.getElementById("raw-output");
const batchOutput = document.getElementById("batch-output");
const batchSummary = document.getElementById("batch-summary");
const batchTableBody = document.getElementById("batch-table-body");
const claimText = form.claim_text;
const csvFileInput = document.getElementById("csv-file");
const csvRowSelect = document.getElementById("csv-row-select");
const csvStatus = document.getElementById("csv-status");
const csvPreview = document.getElementById("csv-preview");
const runBatchButton = document.getElementById("run-batch");
const csvDropzone = document.getElementById("csv-dropzone");
const csvFileList = document.getElementById("csv-file-list");
let csvRows = [];

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
        batchOutput.textContent = JSON.stringify(data, null, 2);
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
        batchTableBody.innerHTML = '<tr><td colspan="7">Aucun resultat disponible.</td></tr>';
        return;
    }

    batchTableBody.innerHTML = items
        .map((item) => {
            const missing = item.missing_information_labels.length
                ? item.missing_information_labels.join(", ")
                : "Aucune";

            return `
                <tr>
                    <td>${escapeHtml(findSourceLabel(item))}</td>
                    <td>${escapeHtml(item.customer_id || "-")}</td>
                    <td>${escapeHtml(item.contract_id || "-")}</td>
                    <td>${escapeHtml(item.category_label)}</td>
                    <td><span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority_label)}</span></td>
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
    batchTableBody.innerHTML = '<tr><td colspan="7">Aucun batch lance.</td></tr>';
}
