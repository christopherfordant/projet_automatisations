from __future__ import annotations

from datetime import UTC, datetime
import re
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings


class VerifiedWebLookupService:
    OFFICIAL_SOURCE_CATALOG = {
        "invoice_copy": [
            {
                "title": "Feuille de soins papier : ou l'envoyer ?",
                "url": "https://www.ameli.fr/assure/remboursements/etre-bien-rembourse/feuille-soins-papier",
                "check_terms": ["feuille de soins", "papier", "remboursement"],
            }
        ],
        "supporting_quote": [
            {
                "title": "Lunettes et lentilles : quelle prise en charge ?",
                "url": "https://www.ameli.fr/assure/remboursements/rembourse/optique-audition/lunettes-et-lentilles-quelle-prise-en-charge",
                "check_terms": ["lunettes", "lentilles", "prise en charge"],
            }
        ],
        "document_type:reimbursement": [
            {
                "title": "Feuille de soins papier : ou l'envoyer ?",
                "url": "https://www.ameli.fr/assure/remboursements/etre-bien-rembourse/feuille-soins-papier",
                "check_terms": ["feuille de soins", "papier", "remboursement"],
            }
        ],
        "document_type:optical_quote": [
            {
                "title": "Lunettes et lentilles : quelle prise en charge ?",
                "url": "https://www.ameli.fr/assure/remboursements/rembourse/optique-audition/lunettes-et-lentilles-quelle-prise-en-charge",
                "check_terms": ["lunettes", "lentilles", "prise en charge"],
            }
        ],
        "document_type:complaint": [
            {
                "title": "Litige avec une mutuelle ou une assurance",
                "url": "https://www.service-public.fr/particuliers/vosdroits/F20849",
                "check_terms": ["mutuelle", "assurance", "litige"],
            }
        ],
        "document_type:hospitalization": [
            {
                "title": "Hospitalisation : prise en charge et remboursement",
                "url": "https://www.ameli.fr/assure/remboursements/rembourse/hospitalisation",
                "check_terms": ["hospitalisation", "prise en charge", "remboursement"],
            }
        ],
    }

    async def lookup_claim_sources(
        self,
        missing_information: list[str],
    ) -> list[dict[str, object]]:
        sources: list[dict[str, object]] = []
        seen_urls: set[str] = set()
        for missing_code in missing_information:
            for entry in self.OFFICIAL_SOURCE_CATALOG.get(missing_code, []):
                if entry["url"] in seen_urls:
                    continue
                item = await self._fetch_verified_source(missing_code, entry)
                if item:
                    sources.append(item)
                    seen_urls.add(entry["url"])
        return sources

    async def lookup_document_sources(
        self,
        document_type: str,
        missing_required_documents: list[str],
    ) -> list[dict[str, object]]:
        sources: list[dict[str, object]] = []
        seen_urls: set[str] = set()
        keys = [f"document_type:{document_type}"]
        if "facture" in missing_required_documents:
            keys.append("invoice_copy")
        if "devis optique" in missing_required_documents:
            keys.append("supporting_quote")

        for key in keys:
            for entry in self.OFFICIAL_SOURCE_CATALOG.get(key, []):
                if entry["url"] in seen_urls:
                    continue
                item = await self._fetch_verified_source(key, entry)
                if item:
                    sources.append(item)
                    seen_urls.add(entry["url"])
        return sources

    async def _fetch_verified_source(
        self,
        lookup_key: str,
        entry: dict[str, object],
    ) -> dict[str, object] | None:
        url = str(entry["url"])
        domain = urlparse(url).netloc.lower().removeprefix("www.")
        if not self._is_allowed_domain(domain):
            return None

        settings = get_settings()
        checked_at = datetime.now(UTC).isoformat()
        try:
            async with httpx.AsyncClient(
                timeout=settings.web_lookup_timeout_seconds,
                follow_redirects=True,
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
        except httpx.HTTPError:
            return None

        html = response.text
        page_title = self._extract_page_title(html) or str(entry["title"])
        snippet = self._extract_excerpt(html)
        check_terms = [str(term).lower() for term in entry.get("check_terms", [])]
        verified = all(term in html.lower() for term in check_terms) if check_terms else True

        return {
            "lookup_key": lookup_key,
            "title": page_title,
            "url": url,
            "domain": domain,
            "checked_at": checked_at,
            "verified": verified,
            "snippet": snippet,
        }

    @staticmethod
    def _extract_page_title(html: str) -> str | None:
        match = re.search(r"<title>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
        if not match:
            return None
        return re.sub(r"\s+", " ", match.group(1)).strip()

    @staticmethod
    def _extract_excerpt(html: str) -> str:
        text = re.sub(r"<script.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r"<style.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:280]

    @staticmethod
    def _is_allowed_domain(domain: str) -> bool:
        settings = get_settings()
        allowed = {
            item.strip().lower()
            for item in settings.web_lookup_allowed_domains.split(",")
            if item.strip()
        }
        return domain in allowed
