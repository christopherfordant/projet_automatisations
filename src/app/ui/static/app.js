const form = document.getElementById("claims-form");
const fillExample = document.getElementById("fill-example");
const summary = document.getElementById("summary");
const missingList = document.getElementById("missing-list");
const operatorSummary = document.getElementById("operator-summary");
const rawOutput = document.getElementById("raw-output");
const claimText = form.claim_text;
const csvFileInput = document.getElementById("csv-file");
const csvRowSelect = document.getElementById("csv-row-select");
const csvStatus = document.getElementById("csv-status");
const csvPreview = document.getElementById("csv-preview");
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
            category: data.category,
            priority: data.priority,
            action: data.recommended_next_action,
        });
        renderMissing(data.missing_information);
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
    const [file] = event.target.files;
    if (!file) {
        csvStatus.textContent = "Aucun CSV charge.";
        csvPreview.textContent = "Aucun apercu disponible.";
        csvRowSelect.innerHTML = '<option value="">Aucune ligne chargee</option>';
        csvRows = [];
        return;
    }

    const content = await file.text();
    csvRows = parseCsv(content);

    if (csvRows.length === 0) {
        csvStatus.textContent = "Le fichier est vide ou invalide.";
        csvPreview.textContent = content;
        csvRowSelect.innerHTML = '<option value="">Aucune ligne exploitable</option>';
        return;
    }

    csvStatus.textContent = `${csvRows.length} ligne(s) detectee(s) dans ${file.name}.`;
    csvPreview.textContent = JSON.stringify(csvRows.slice(0, 3), null, 2);
    csvRowSelect.innerHTML = csvRows
        .map((row, index) => {
            const label = row.customer_id || row.contract_id || row.claim_text || `Ligne ${index + 1}`;
            return `<option value="${index}">Ligne ${index + 1} - ${escapeHtml(label).slice(0, 80)}</option>`;
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
    form.channel.value = normalizeChannel(row.channel);
    form.customer_id.value = row.customer_id || row.client_id || "";
    form.contract_id.value =
        row.contract_id || row.case_id || row.dossier_id || row.claim_id || "";
    form.provider.value = row.provider || "mock";
    form.claim_text.value = row.claim_text || row.message || row.description || "";
    form.attached_documents.value =
        row.attached_documents || row.documents || row.pieces_jointes || "";
    autofillIdentifiers();
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
