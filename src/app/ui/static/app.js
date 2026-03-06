const form = document.getElementById("claims-form");
const fillExample = document.getElementById("fill-example");
const summary = document.getElementById("summary");
const missingList = document.getElementById("missing-list");
const operatorSummary = document.getElementById("operator-summary");
const rawOutput = document.getElementById("raw-output");

fillExample.addEventListener("click", () => {
    form.channel.value = "email";
    form.customer_id.value = "";
    form.contract_id.value = "";
    form.provider.value = "mock";
    form.claim_text.value =
        "Bonjour, j'ai une relance urgente pour un remboursement de facture en retard. Je n'ai toujours pas de retour sur mon dossier.";
    form.attached_documents.value = "facture dentaire";
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

