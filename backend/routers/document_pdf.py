from __future__ import annotations

import re
import shutil
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from config import settings
from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from models.pdf import PdfDownloadRequest

router = APIRouter()

WINDOWS_WKHTMLTOPDF_PATHS = (
    Path("C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe"),
    Path("C:/Program Files (x86)/wkhtmltopdf/bin/wkhtmltopdf.exe"),
)


DOCUMENT_CSS = """
@page {
  size: A4;
  margin: 22mm 18mm;
}

html, body {
  background: #ffffff;
  color: #111827;
  font-family: "Times New Roman", serif;
  font-size: 12pt;
  line-height: 1.55;
}

h1 {
  font-size: 22pt;
  margin: 0 0 16pt;
  text-align: center;
}

h2 {
  font-size: 16pt;
  margin: 18pt 0 8pt;
}

h3 {
  font-size: 13pt;
  margin: 14pt 0 6pt;
}

p {
  margin: 0 0 10pt;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #d1d5db;
  padding: 6pt;
}
"""


def _sanitize_pdf_filename(filename: str | None) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", (filename or "document").strip())
    cleaned = cleaned.strip("._") or "document"
    if not cleaned.lower().endswith(".pdf"):
        cleaned = f"{cleaned}.pdf"
    return cleaned


def _build_html_document(content: str) -> str:
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>{DOCUMENT_CSS}</style>
</head>
<body>
  {content}
</body>
</html>"""


def _resolve_wkhtmltopdf_path() -> str | None:
    if settings.WKHTMLTOPDF_PATH:
        return settings.WKHTMLTOPDF_PATH

    executable = shutil.which("wkhtmltopdf")
    if executable:
        return executable

    for path in WINDOWS_WKHTMLTOPDF_PATHS:
        if path.exists():
            return str(path)

    return None


def _get_wkhtmltopdf_config():
    import pdfkit

    executable = _resolve_wkhtmltopdf_path()
    if not executable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="wkhtmltopdf is not installed or is not configured on this host.",
        )
    try:
        return pdfkit.configuration(wkhtmltopdf=executable)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="wkhtmltopdf is not available at the configured path.",
        ) from exc


@router.post("/api/documents/download-pdf")
def download_pdf(
    payload: PdfDownloadRequest,
    _: AuthenticatedUser = Depends(get_current_user),
) -> StreamingResponse:
    try:
        import pdfkit
    except (ImportError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server-side PDF rendering is not available. Install pdfkit and wkhtmltopdf.",
        ) from exc

    configuration = _get_wkhtmltopdf_config()
    options = {
        "encoding": "UTF-8",
        "disable-javascript": None,
        "disable-local-file-access": None,
        "quiet": None,
    }

    try:
        pdf_bytes = pdfkit.from_string(
            _build_html_document(payload.content),
            False,
            configuration=configuration,
            options=options,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to generate PDF from the provided content.",
        ) from exc

    filename = _sanitize_pdf_filename(payload.filename)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers=headers,
    )
