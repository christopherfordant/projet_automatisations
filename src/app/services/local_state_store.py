import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import get_settings


class LocalStateStore:
    def __init__(self, db_path: str | None = None) -> None:
        settings = get_settings()
        self.db_path = Path(db_path or settings.local_state_db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _initialize(self) -> None:
        with closing(self._connect()) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS ui_state (
                    state_key TEXT PRIMARY KEY,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def load_operator_state(self) -> dict[str, object]:
        defaults: dict[str, object] = {
            "manual_status_overrides": {},
            "action_log_entries": [],
            "last_batch_items": [],
            "selected_item_key": "",
            "saved_at": None,
        }
        with closing(self._connect()) as connection:
            rows = connection.execute(
                "SELECT state_key, payload_json, updated_at FROM ui_state"
            ).fetchall()

        saved_at_values: list[str] = []
        for state_key, payload_json, updated_at in rows:
            defaults[state_key] = json.loads(payload_json)
            saved_at_values.append(updated_at)

        if saved_at_values:
            defaults["saved_at"] = max(saved_at_values)
        return defaults

    def save_operator_state(self, payload: dict[str, object]) -> dict[str, object]:
        saved_at = datetime.now(timezone.utc).isoformat()
        persisted = {
            "manual_status_overrides": payload.get("manual_status_overrides", {}),
            "action_log_entries": payload.get("action_log_entries", []),
            "last_batch_items": payload.get("last_batch_items", []),
            "selected_item_key": payload.get("selected_item_key", ""),
        }

        with closing(self._connect()) as connection:
            for state_key, state_value in persisted.items():
                connection.execute(
                    """
                    INSERT INTO ui_state (state_key, payload_json, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(state_key) DO UPDATE SET
                        payload_json = excluded.payload_json,
                        updated_at = excluded.updated_at
                    """,
                    (state_key, json.dumps(state_value), saved_at),
                )
            connection.commit()

        return {
            **persisted,
            "saved_at": saved_at,
        }
