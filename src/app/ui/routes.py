from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


templates = Jinja2Templates(directory="src/app/ui/templates")
router = APIRouter(tags=["ui"])
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DROPZONE_ROOT = PROJECT_ROOT / "dropzones"
INCOMING_PATH = DROPZONE_ROOT / "incoming"
ARCHIVE_PATH = DROPZONE_ROOT / "archive"
ERROR_PATH = DROPZONE_ROOT / "error"
SUPPORTED_DROPZONE_EXTENSIONS = {".csv", ".json"}


def ensure_dropzone_directories() -> None:
    for path in (INCOMING_PATH, ARCHIVE_PATH, ERROR_PATH):
        path.mkdir(parents=True, exist_ok=True)


def serialize_dropzone_files(path: Path) -> list[dict[str, object]]:
    ensure_dropzone_directories()
    files = []
    for file_path in sorted(path.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
        if not file_path.is_file():
            continue
        files.append(
            {
                "name": file_path.name,
                "size_bytes": file_path.stat().st_size,
                "updated_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                "extension": file_path.suffix.lower(),
            }
        )
    return files


@router.get("/", response_class=HTMLResponse)
def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "request": request,
        },
    )


@router.get("/ui/dropzone-status")
def dropzone_status() -> dict[str, object]:
    ensure_dropzone_directories()
    return {
        "watch_path": str(INCOMING_PATH),
        "archive_path": str(ARCHIVE_PATH),
        "error_path": str(ERROR_PATH),
        "incoming": serialize_dropzone_files(INCOMING_PATH),
        "archive": serialize_dropzone_files(ARCHIVE_PATH),
        "error": serialize_dropzone_files(ERROR_PATH),
    }


@router.post("/ui/dropzone-upload")
async def dropzone_upload(files: list[UploadFile] = File(...)) -> dict[str, object]:
    ensure_dropzone_directories()
    uploaded_files: list[str] = []

    for upload in files:
        file_name = Path(upload.filename or "").name
        extension = Path(file_name).suffix.lower()
        if extension not in SUPPORTED_DROPZONE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Format non supporte pour {file_name}. Utilise uniquement .csv ou .json.",
            )

        destination = INCOMING_PATH / file_name
        destination.write_bytes(await upload.read())
        uploaded_files.append(file_name)

    return {
        "uploaded_files": uploaded_files,
        "count": len(uploaded_files),
        "watch_path": str(INCOMING_PATH),
    }
