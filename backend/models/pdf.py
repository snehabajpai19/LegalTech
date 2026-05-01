from pydantic import BaseModel, Field


class PdfDownloadRequest(BaseModel):
    content: str = Field(..., min_length=1)
    filename: str | None = None

