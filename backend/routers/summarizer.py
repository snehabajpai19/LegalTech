# backend/routers/summarizer.py
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pymongo.database import Database

from database import get_db
from dependencies.auth import get_current_user
from models.auth import AuthenticatedUser
from services.summarizer_service import summarizer_service
from utils.ocr_utils import SUPPORTED_OCR_EXTENSIONS, extract_text_from_image
from utils.pdf_utils import extract_text_from_pdf

router = APIRouter()


def _normalize_filename(filename: str | None) -> str:
    return (filename or "").strip().lower()


@router.post("/api/summarizer/upload/pdf")
async def summarize_pdf(
    file: UploadFile = File(...),
    db: Database = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    filename = _normalize_filename(file.filename)
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported on this route.")

    try:
        file_content = await file.read()
        extracted_text = extract_text_from_pdf(file_content)

        if not extracted_text:
            raise HTTPException(status_code=400, detail="The PDF is empty or could not be read.")

        summary = summarizer_service.process_summarization(
            db=db,
            user_id=UUID(current_user.id),
            text=extracted_text,
            source_type="pdf",
            filename=file.filename,
        )

        return {"summary": summary, "filename": file.filename, "source_type": "pdf"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        print(f"Summarizer PDF route error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during PDF summarization.") from e


@router.post("/api/summarizer/upload/ocr")
async def summarize_ocr(
    file: UploadFile = File(...),
    db: Database = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    filename = _normalize_filename(file.filename)
    if not any(filename.endswith(ext) for ext in SUPPORTED_OCR_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Only image files supported for OCR: .png, .jpg, .jpeg, .bmp, .tiff, .webp",
        )

    try:
        file_content = await file.read()
        extracted_text = extract_text_from_image(file_content)

        if not extracted_text:
            raise HTTPException(status_code=400, detail="No text could be extracted from the image.")

        summary = summarizer_service.process_summarization(
            db=db,
            user_id=UUID(current_user.id),
            text=extracted_text,
            source_type="ocr",
            filename=file.filename,
        )

        return {"summary": summary, "filename": file.filename, "source_type": "ocr"}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        print(f"Summarizer OCR route error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during OCR summarization.") from e
