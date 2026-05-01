from __future__ import annotations

import re
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from models.pdf import PdfDownloadRequest

router = APIRouter()


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


def _block_external_resources(*_, **__):
    raise ValueError("External resources are not allowed in PDF rendering.")


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


@router.post("/api/documents/download-pdf")
def download_pdf(
    payload: PdfDownloadRequest,
    _: AuthenticatedUser = Depends(get_current_user),
) -> StreamingResponse:
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server-side PDF rendering is not available on this host.",
        ) from exc

    try:
        pdf_bytes = HTML(
            string=_build_html_document(payload.content),
            url_fetcher=_block_external_resources,
        ).write_pdf()
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
