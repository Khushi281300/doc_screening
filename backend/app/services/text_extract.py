"""Best-effort plain-text extraction for search and redaction."""
import io
from typing import Optional

TEXT_MIMES = ("text/plain", "text/csv", "text/markdown", "application/json")


def extract_text(data: bytes, mime_type: Optional[str], filename: Optional[str]) -> Optional[str]:
    name = (filename or "").lower()
    mime = (mime_type or "").lower()

    if mime.startswith("text/") or mime in TEXT_MIMES or name.endswith((".txt", ".md", ".csv", ".json")):
        try:
            return data.decode("utf-8", errors="replace")
        except Exception:
            return None

    if mime == "application/pdf" or name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            pages = [(p.extract_text() or "") for p in reader.pages]
            text = "\n".join(pages).strip()
            return text or None
        except Exception:
            return None

    if name.endswith(".docx") or "wordprocessingml" in mime:
        try:
            import zipfile, re
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                xml = z.read("word/document.xml").decode("utf-8", errors="replace")
            text = re.sub(r"<[^>]+>", " ", xml)
            return " ".join(text.split()) or None
        except Exception:
            return None

    # Images: no OCR engine bundled; forensic screening still runs on them.
    return None
