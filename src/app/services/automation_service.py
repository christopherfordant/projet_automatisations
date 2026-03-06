import re

from app.connectors.mutuelle_catalog import CONNECTOR_CATALOG
from app.core.config import get_settings
from app.providers.base import PromptRequest
from app.providers.registry import get_provider
from app.schemas.automation import (
    AutomationRequest,
    ClaimIntakeBatchRequest,
    ClaimIntakeRequest,
    DocumentCompletenessRequest,
    DocumentAnalysisRequest,
)


class AutomationService:
    CATEGORY_LABELS = {
        "health_care_request": "Demande de soins",
        "reimbursement_followup": "Suivi de remboursement",
        "contract_change": "Changement de contrat",
        "complaint": "Reclamation",
        "general_intake": "Demande generale",
    }

    PRIORITY_LABELS = {
        "high": "Haute",
        "medium": "Moyenne",
        "normal": "Normale",
    }

    MISSING_INFO_LABELS = {
        "customer_id": "Numero client",
        "contract_id": "Numero dossier",
        "supporting_quote": "Devis justificatif",
        "invoice_copy": "Copie de facture",
    }

    ACTION_LABELS = {
        "request_missing_information": "Demander les informations manquantes",
        "route_to_complaints_team": "Acheminer vers le service reclamations",
        "escalate_to_priority_queue": "Passer en file prioritaire",
        "route_to_reimbursement_queue": "Acheminer vers le traitement remboursement",
        "route_to_standard_operations": "Acheminer vers les operations standard",
    }

    BUSINESS_STATUS_LABELS = {
        "blocked": "Bloque",
        "to_review": "A revoir",
        "ready_to_route": "Pret a router",
        "ready_for_priority_queue": "Pret pour file prioritaire",
    }

    FRICTION_FLAG_LABELS = {
        "missing_information": "Dossier incomplet",
        "relance_detected": "Relance detectee",
        "complaint_risk": "Risque de reclamation",
        "urgent_medical_context": "Contexte medical urgent",
        "duplicate_case": "Possible doublon batch",
    }

    ATTENTION_LEVEL_LABELS = {
        "critical": "Critique",
        "elevated": "Elevee",
        "standard": "Standard",
    }

    DOCUMENT_REQUIREMENTS = {
        "reimbursement": {
            "label": "Remboursement",
            "required_documents": ["facture", "numero adherent", "reference dossier"],
            "optional_documents": ["rib", "decompte secu", "feuille de soin"],
        },
        "optical_quote": {
            "label": "Devis optique",
            "required_documents": ["devis optique", "numero adherent", "ordonnance"],
            "optional_documents": ["monture", "reference contrat"],
        },
        "complaint": {
            "label": "Reclamation",
            "required_documents": ["courrier de reclamation", "numero dossier", "historique echanges"],
            "optional_documents": ["preuve de delai", "capture espace client"],
        },
        "hospitalization": {
            "label": "Hospitalisation",
            "required_documents": ["compte rendu", "facture clinique", "numero adherent"],
            "optional_documents": ["prise en charge", "bulletin hospitalisation"],
        },
    }

    async def run_intake(self, payload: AutomationRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        prompt = PromptRequest(
            system_prompt=(
                "Tu es un orchestrateur expert d'automatisation pour mutuelles. "
                "Tu qualifies la demande, identifies le module cible et proposes la prochaine action."
            ),
            user_prompt=(
                f"Workflow: {payload.workflow_name}\n"
                f"Contexte: {payload.customer_context}\n"
                f"Entree: {payload.raw_input}"
            ),
            model=settings.default_ai_model,
        )
        result = await provider.generate(prompt)
        return {
            "workflow_name": payload.workflow_name,
            "available_connectors": [item.name for item in CONNECTOR_CATALOG],
            "result": result,
        }

    async def run_claims_intake(self, payload: ClaimIntakeRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        normalized_text = payload.claim_text.lower()
        resolved_customer_id = payload.customer_id or self._extract_customer_id(payload.claim_text)
        resolved_contract_id = payload.contract_id or self._extract_contract_id(payload.claim_text)

        category = self._classify_claim_category(normalized_text)
        priority = self._classify_priority(normalized_text)
        missing_information = self._collect_missing_information(
            resolved_customer_id,
            resolved_contract_id,
            payload.attached_documents,
            normalized_text,
        )
        next_action = self._recommend_next_action(category, priority, missing_information)
        friction_flags = self._derive_friction_flags(
            category,
            priority,
            missing_information,
            normalized_text,
        )
        attention_score = self._compute_attention_score(priority, missing_information, friction_flags)

        prompt = PromptRequest(
            system_prompt=(
                "Tu assistes une mutuelle dans la qualification d'une demande entrante. "
                "Tu donnes un court resume operateur en francais."
            ),
            user_prompt=(
                f"Canal: {payload.channel}\n"
                f"Client: {resolved_customer_id or 'inconnu'}\n"
                f"Contrat: {resolved_contract_id or 'inconnu'}\n"
                f"Categorie calculee: {category}\n"
                f"Priorite calculee: {priority}\n"
                f"Texte de la demande:\n{payload.claim_text}"
            ),
            model=settings.default_ai_model,
        )

        ai_result = await provider.generate(prompt)
        result = {
            "module": "claims_intake",
            "customer_id": resolved_customer_id,
            "contract_id": resolved_contract_id,
            "claim_text": payload.claim_text,
            "category": category,
            "priority": priority,
            "missing_information": missing_information,
            "friction_flags": friction_flags,
            "attention_score": attention_score,
            "recommended_next_action": next_action,
            "documents_received": payload.attached_documents,
            "operator_summary": ai_result["content"],
            "ai_provider": ai_result["provider"],
            "ai_model": ai_result["model"],
        }
        return self._decorate_result(result)

    async def run_claims_intake_batch(
        self, payload: ClaimIntakeBatchRequest
    ) -> dict[str, object]:
        results: list[dict[str, object]] = []
        for item in payload.items:
            results.append(await self.run_claims_intake(item))

        self._annotate_batch_friction(results)

        summary = {
            "total_items": len(results),
            "high_priority": sum(1 for item in results if item["priority"] == "high"),
            "critical_attention": sum(1 for item in results if item["attention_level"] == "critical"),
            "missing_information_cases": sum(
                1 for item in results if item["missing_information"]
            ),
            "duplicate_suspicions": sum(1 for item in results if item["duplicate_suspected"]),
            "categories": self._count_by_key(results, "category_label"),
            "recommended_actions": self._count_by_key(results, "recommended_next_action_label"),
            "business_statuses": self._count_by_key(results, "business_status_label"),
            "attention_levels": self._count_by_key(results, "attention_level_label"),
        }

        return {
            "module": "claims_intake_batch",
            "summary": summary,
            "items": results,
        }

    async def run_document_analysis(self, payload: DocumentAnalysisRequest) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        prompt = PromptRequest(
            system_prompt=(
                "Tu analyses un document metier mutuelle et retournes une lecture exploitable par une API."
            ),
            user_prompt=(
                f"Document: {payload.document_name}\n"
                f"Sortie attendue: {payload.expected_output}\n"
                f"Contenu:\n{payload.document_text}"
            ),
            model=settings.default_ai_model,
        )
        result = await provider.generate(prompt)
        return {
            "document_name": payload.document_name,
            "result": result,
        }

    async def run_document_completeness(
        self, payload: DocumentCompletenessRequest
    ) -> dict[str, object]:
        settings = get_settings()
        provider = get_provider(payload.provider)
        profile = self.DOCUMENT_REQUIREMENTS.get(
            payload.document_type,
            {
                "label": payload.document_type,
                "required_documents": ["numero adherent", "reference dossier"],
                "optional_documents": ["piece justificative"],
            },
        )

        normalized_text = payload.document_text.lower()
        declared_documents = [item.strip().lower() for item in payload.attached_documents if item.strip()]
        available_tokens = " ".join([normalized_text, *declared_documents])

        required_status = [
            {
                "document": document,
                "label": document.title(),
                "present": self._document_present(document, available_tokens),
            }
            for document in profile["required_documents"]
        ]
        optional_status = [
            {
                "document": document,
                "label": document.title(),
                "present": self._document_present(document, available_tokens),
            }
            for document in profile["optional_documents"]
        ]

        missing_required = [item["document"] for item in required_status if not item["present"]]
        completion_ratio = int(
            round(
                (
                    sum(1 for item in required_status if item["present"])
                    / max(len(required_status), 1)
                )
                * 100
            )
        )
        readiness_status = self._derive_readiness_status(completion_ratio, missing_required)

        prompt = PromptRequest(
            system_prompt=(
                "Tu aides un gestionnaire mutuelle a verifier la completude documentaire d'un dossier. "
                "Tu proposes un bref resume operateur en francais."
            ),
            user_prompt=(
                f"Type de dossier: {profile['label']}\n"
                f"Client: {payload.customer_id or 'inconnu'}\n"
                f"Dossier: {payload.contract_id or 'inconnu'}\n"
                f"Pieces declarees: {', '.join(payload.attached_documents) or 'aucune'}\n"
                f"Texte libre:\n{payload.document_text}"
            ),
            model=settings.default_ai_model,
        )
        ai_result = await provider.generate(prompt)
        request_message = self._build_missing_documents_message(
            profile_label=profile["label"],
            customer_id=payload.customer_id,
            contract_id=payload.contract_id,
            missing_required_labels=[item.title() for item in missing_required],
            readiness_status=readiness_status,
            message_tone=payload.message_tone,
            output_channel=payload.output_channel,
        )

        return {
            "module": "document_completeness",
            "document_type": payload.document_type,
            "document_type_label": profile["label"],
            "customer_id": payload.customer_id,
            "contract_id": payload.contract_id,
            "required_documents": required_status,
            "optional_documents": optional_status,
            "missing_required_documents": missing_required,
            "missing_required_labels": [item.title() for item in missing_required],
            "completion_ratio": completion_ratio,
            "readiness_status": readiness_status,
            "readiness_status_label": self._format_readiness_status(readiness_status),
            "message_tone": payload.message_tone,
            "output_channel": payload.output_channel,
            "client_request_subject": request_message["subject"],
            "client_request_message": request_message["message"],
            "operator_summary": ai_result["content"],
            "ai_provider": ai_result["provider"],
            "ai_model": ai_result["model"],
        }

    @staticmethod
    def _classify_claim_category(normalized_text: str) -> str:
        if any(token in normalized_text for token in ("hospital", "chirurg", "soin", "devis")):
            return "health_care_request"
        if any(token in normalized_text for token in ("rembourse", "facture", "feuille de soin")):
            return "reimbursement_followup"
        if any(token in normalized_text for token in ("resili", "resiliation", "radiation")):
            return "contract_change"
        if any(token in normalized_text for token in ("reclam", "plainte", "litige")):
            return "complaint"
        return "general_intake"

    @staticmethod
    def _classify_priority(normalized_text: str) -> str:
        if any(token in normalized_text for token in ("urgent", "bloque", "immediat", "48h")):
            return "high"
        if any(token in normalized_text for token in ("relance", "attente", "retard")):
            return "medium"
        return "normal"

    @staticmethod
    def _collect_missing_information(
        customer_id: str | None,
        contract_id: str | None,
        attached_documents: list[str],
        normalized_text: str,
    ) -> list[str]:
        missing: list[str] = []
        if not customer_id:
            missing.append("customer_id")
        if not contract_id:
            missing.append("contract_id")
        if "devis" in normalized_text and not attached_documents:
            missing.append("supporting_quote")
        if "facture" in normalized_text and not attached_documents:
            missing.append("invoice_copy")
        return missing

    @staticmethod
    def _extract_customer_id(claim_text: str) -> str | None:
        match = re.search(
            r"\b(?:client|adherent|adh[ée]rent|assur[ée]|id client)\s*[:#-]?\s*([A-Z0-9-]{4,})",
            claim_text,
            flags=re.IGNORECASE,
        )
        return match.group(1).upper() if match else None

    @staticmethod
    def _extract_contract_id(claim_text: str) -> str | None:
        match = re.search(
            r"\b(?:dossier|num[ée]ro dossier|ref(?:erence)? dossier|sinistre)\s*[:#-]?\s*([A-Z0-9-]{4,})",
            claim_text,
            flags=re.IGNORECASE,
        )
        return match.group(1).upper() if match else None

    @staticmethod
    def _recommend_next_action(category: str, priority: str, missing_information: list[str]) -> str:
        if missing_information:
            return "request_missing_information"
        if category == "complaint":
            return "route_to_complaints_team"
        if priority == "high":
            return "escalate_to_priority_queue"
        if category == "reimbursement_followup":
            return "route_to_reimbursement_queue"
        return "route_to_standard_operations"

    @classmethod
    def _decorate_result(cls, result: dict[str, object]) -> dict[str, object]:
        missing_information = [
            cls.MISSING_INFO_LABELS.get(item, item) for item in result["missing_information"]
        ]
        friction_flags = [cls.FRICTION_FLAG_LABELS.get(item, item) for item in result["friction_flags"]]
        result["category_label"] = cls.CATEGORY_LABELS.get(result["category"], result["category"])
        result["priority_label"] = cls.PRIORITY_LABELS.get(result["priority"], result["priority"])
        result["missing_information_labels"] = missing_information
        result["friction_flag_labels"] = friction_flags
        result["recommended_next_action_label"] = cls.ACTION_LABELS.get(
            result["recommended_next_action"],
            result["recommended_next_action"],
        )
        result["business_status"] = cls._derive_business_status(
            result["priority"],
            result["missing_information"],
            result["category"],
        )
        result["business_status_label"] = cls.BUSINESS_STATUS_LABELS.get(
            result["business_status"],
            result["business_status"],
        )
        result["attention_level"] = cls._derive_attention_level(result["attention_score"])
        result["attention_level_label"] = cls.ATTENTION_LEVEL_LABELS.get(
            result["attention_level"],
            result["attention_level"],
        )
        result["duplicate_suspected"] = False
        result["duplicate_cluster_size"] = 1
        return result

    @staticmethod
    def _derive_business_status(
        priority: str,
        missing_information: list[str],
        category: str,
    ) -> str:
        if missing_information:
            return "blocked"
        if category == "complaint":
            return "to_review"
        if priority == "high":
            return "ready_for_priority_queue"
        return "ready_to_route"

    @staticmethod
    def _derive_friction_flags(
        category: str,
        priority: str,
        missing_information: list[str],
        normalized_text: str,
    ) -> list[str]:
        flags: list[str] = []
        if missing_information:
            flags.append("missing_information")
        if any(
            token in normalized_text
            for token in ("relance", "toujours pas", "sans retour", "aucune reponse", "deuxieme")
        ):
            flags.append("relance_detected")
        if category == "complaint" or any(
            token in normalized_text for token in ("insatisf", "plainte", "litige", "mediat")
        ):
            flags.append("complaint_risk")
        if priority == "high" and any(
            token in normalized_text for token in ("hospital", "chirurg", "prise en charge", "urgence")
        ):
            flags.append("urgent_medical_context")
        return flags

    @staticmethod
    def _compute_attention_score(
        priority: str,
        missing_information: list[str],
        friction_flags: list[str],
    ) -> int:
        score = 20
        if priority == "high":
            score += 25
        elif priority == "medium":
            score += 10
        if missing_information:
            score += 30
        if "relance_detected" in friction_flags:
            score += 15
        if "complaint_risk" in friction_flags:
            score += 20
        if "urgent_medical_context" in friction_flags:
            score += 20
        return min(score, 100)

    @staticmethod
    def _derive_attention_level(score: int) -> str:
        if score >= 80:
            return "critical"
        if score >= 45:
            return "elevated"
        return "standard"

    @classmethod
    def _annotate_batch_friction(cls, items: list[dict[str, object]]) -> None:
        duplicate_groups: dict[str, list[dict[str, object]]] = {}
        for item in items:
            key = cls._build_duplicate_key(item)
            duplicate_groups.setdefault(key, []).append(item)

        for group in duplicate_groups.values():
            if len(group) < 2:
                continue
            for item in group:
                if "duplicate_case" not in item["friction_flags"]:
                    item["friction_flags"].append("duplicate_case")
                item["duplicate_suspected"] = True
                item["duplicate_cluster_size"] = len(group)
                item["attention_score"] = min(int(item["attention_score"]) + 15, 100)
                item["attention_level"] = cls._derive_attention_level(int(item["attention_score"]))
                item["attention_level_label"] = cls.ATTENTION_LEVEL_LABELS[item["attention_level"]]
                item["friction_flag_labels"] = [
                    cls.FRICTION_FLAG_LABELS.get(flag, flag) for flag in item["friction_flags"]
                ]

    @staticmethod
    def _build_duplicate_key(item: dict[str, object]) -> str:
        contract_id = str(item.get("contract_id") or "").strip().lower()
        customer_id = str(item.get("customer_id") or "").strip().lower()
        category = str(item.get("category") or "").strip().lower()
        claim_text = str(item.get("claim_text") or "").strip().lower()
        if contract_id:
            return f"contract::{contract_id}::{category}"
        if customer_id:
            return f"customer::{customer_id}::{category}"
        return f"text::{category}::{claim_text[:80]}"

    @staticmethod
    def _document_present(document: str, available_tokens: str) -> bool:
        normalized_document = document.lower()
        variants = {
            "numero adherent": ["numero adherent", "adherent", "client cl-", "assure"],
            "reference dossier": ["reference dossier", "dossier", "sinistre", "contract_id"],
            "courrier de reclamation": ["courrier reclamation", "reclamation", "plainte"],
            "historique echanges": ["historique", "echanges", "email", "conversation"],
            "facture clinique": ["facture clinique", "facture", "clinique"],
            "compte rendu": ["compte rendu", "hospitalisation", "sortie"],
        }
        tokens = variants.get(normalized_document, [normalized_document])
        return any(token in available_tokens for token in tokens)

    @staticmethod
    def _derive_readiness_status(completion_ratio: int, missing_required: list[str]) -> str:
        if not missing_required and completion_ratio >= 100:
            return "ready"
        if completion_ratio >= 60:
            return "partial"
        return "blocked"

    @staticmethod
    def _format_readiness_status(status: str) -> str:
        labels = {
            "ready": "Pret a instruire",
            "partial": "A completer",
            "blocked": "Bloque documentaire",
        }
        return labels.get(status, status)

    @staticmethod
    def _build_missing_documents_message(
        profile_label: str,
        customer_id: str | None,
        contract_id: str | None,
        missing_required_labels: list[str],
        readiness_status: str,
        message_tone: str,
        output_channel: str,
    ) -> dict[str, str]:
        reference = contract_id or customer_id or "votre dossier"
        tone = message_tone.lower()
        channel = output_channel.lower()
        if channel == "sms":
            if not missing_required_labels:
                return {
                    "subject": "",
                    "message": (
                        f"Dossier {reference} complet pour {profile_label.lower()}. "
                        "Instruction en cours."
                    ),
                }
            return {
                "subject": "",
                "message": (
                    f"Dossier {reference}: merci d'envoyer "
                    f"{', '.join(missing_required_labels)}. "
                    f"{'Sans ces pieces, dossier bloque.' if readiness_status == 'blocked' else 'A reception, dossier finalisable.'}"
                ),
            }

        if not missing_required_labels:
            openings = {
                "neutral": "Bonjour,",
                "commercial": "Bonjour, merci pour votre envoi,",
                "direct": "Bonjour,",
            }
            closings = {
                "email": "Cordialement,\nService gestion",
                "courrier": "Veuillez agreer nos salutations distinguees.\nService gestion",
            }
            progress_lines = {
                "neutral": "Nos equipes peuvent poursuivre l'instruction.",
                "commercial": "Nos equipes vont pouvoir poursuivre le traitement dans les meilleures conditions.",
                "direct": "Le dossier peut maintenant etre instruit.",
            }
            return {
                "subject": f"Dossier complet - {reference}",
                "message": (
                    f"{openings.get(tone, openings['neutral'])}\n\n"
                    f"Votre dossier {reference} est considere comme complet pour le traitement "
                    f"de la demande de type {profile_label.lower()}.\n"
                    f"{progress_lines.get(tone, progress_lines['neutral'])}\n\n"
                    f"{closings.get(channel, closings['email'])}"
                ),
            }

        intro_by_tone = {
            "neutral": (
                "Bonjour,\n\n"
                f"Pour poursuivre le traitement de votre dossier {reference} "
                f"concernant {profile_label.lower()}, nous avons encore besoin des elements suivants :\n"
            ),
            "commercial": (
                "Bonjour,\n\n"
                f"Afin de finaliser au plus vite le traitement de votre dossier {reference} "
                f"concernant {profile_label.lower()}, pouvez-vous nous transmettre les elements suivants :\n"
            ),
            "direct": (
                "Bonjour,\n\n"
                f"Le dossier {reference} ne peut pas etre traite en l'etat. Merci d'envoyer :\n"
            ),
        }
        missing_lines = "\n".join(f"- {item}" for item in missing_required_labels)
        outro_by_tone = {
            "neutral": "\n\nMerci de nous transmettre ces documents via votre espace client ou par retour de message.\n",
            "commercial": "\n\nVous pouvez nous adresser ces documents via votre espace client ou en reponse a ce message.\n",
            "direct": "\n\nCes documents doivent etre transmis via votre espace client ou par retour de message.\n",
        }
        outro = outro_by_tone.get(tone, outro_by_tone["neutral"])
        if readiness_status == "blocked":
            blocked_line = {
                "neutral": "Le dossier reste en attente tant que ces pieces ne sont pas recues.\n",
                "commercial": "Le dossier restera en attente jusqu'a reception de ces pieces.\n",
                "direct": "Sans ces pieces, le dossier restera bloque.\n",
            }
            outro += blocked_line.get(tone, blocked_line["neutral"])
        else:
            partial_line = {
                "neutral": "Une fois ces pieces recues, nous pourrons finaliser l'instruction.\n",
                "commercial": "Des reception, nous pourrons finaliser l'instruction de votre dossier.\n",
                "direct": "A reception, le dossier pourra etre finalise.\n",
            }
            outro += partial_line.get(tone, partial_line["neutral"])
        outro += "\n"
        outro += (
            "Veuillez agreer nos salutations distinguees.\nService gestion"
            if channel == "courrier"
            else "Cordialement,\nService gestion"
        )
        return {
            "subject": (
                ""
                if channel == "sms"
                else f"Pieces manquantes pour votre dossier - {reference}"
            ),
            "message": intro_by_tone.get(tone, intro_by_tone["neutral"]) + missing_lines + outro,
        }

    @staticmethod
    def _count_by_key(items: list[dict[str, object]], key: str) -> dict[str, int]:
        counts: dict[str, int] = {}
        for item in items:
            value = str(item[key])
            counts[value] = counts.get(value, 0) + 1
        return counts
