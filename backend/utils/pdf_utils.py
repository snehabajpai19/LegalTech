import io

from pypdf import PdfReader


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract plain text from PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(file_content))
        pages = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append(page_text.strip())
        return "\n\n".join(pages).strip()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""
