from typing import Iterable

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

import io


SUPPORTED_OCR_EXTENSIONS: Iterable[str] = (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")


def extract_text_from_image(file_content: bytes) -> str:
    """Extract text from an image using OCR."""
    if pytesseract is None or Image is None:
        raise RuntimeError(
            "OCR dependencies are not installed. Install 'pytesseract' and 'Pillow' first."
        )

    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR extraction failed: {e}") from e
