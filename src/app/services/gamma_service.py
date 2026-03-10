from app.core.config import get_settings


class GammaService:
    def build_brief(
        self,
        *,
        title: str,
        audience: str,
        objective: str,
        source_module: str,
        source_context: str,
        key_points: list[str],
        output_type: str,
        operator_summary: str,
    ) -> dict[str, object]:
        settings = get_settings()
        normalized_output_type = output_type if output_type in {"presentation", "document", "webpage"} else settings.gamma_default_output_type
        normalized_points = [item.strip() for item in key_points if item.strip()]
        if not normalized_points:
            normalized_points = [
                "Contexte et problematique a traiter",
                "Blocages ou priorites identifies",
                "Action recommandee",
                "Impact operationnel attendu",
            ]

        gamma_prompt = (
            f"Cree un {normalized_output_type} professionnel intitule '{title}' pour {audience}. "
            f"Objectif: {objective}. "
            f"Contexte source: {source_context}. "
            f"Resume operateur: {operator_summary}. "
            f"Inclure les points suivants: {', '.join(normalized_points)}."
        )
        import_markdown = "\n".join(
            [
                f"# {title}",
                "",
                "## Audience",
                audience,
                "",
                "## Objectif",
                objective,
                "",
                "## Module source",
                source_module,
                "",
                "## Contexte source",
                source_context,
                "",
                "## Resume operateur",
                operator_summary,
                "",
                "## Points cles",
                *[f"- {item}" for item in normalized_points],
            ]
        )

        return {
            "gamma_ready": True,
            "gamma_api_configured": bool(settings.gamma_api_key),
            "gamma_base_url": settings.gamma_base_url,
            "gamma_output_type": normalized_output_type,
            "gamma_prompt": gamma_prompt,
            "gamma_import_markdown": import_markdown,
            "gamma_key_points": normalized_points,
        }
