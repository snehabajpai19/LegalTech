from pathlib import Path

import pandas as pd
from langchain_community.document_loaders import CSVLoader, DirectoryLoader, PyPDFLoader
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- CONFIGURATION ---
DATA_PATH = "data/"
CHROMA_PATH = "vector_db/"


def _row_metadata(row: pd.Series, path: Path, index: int) -> dict:
    """Structured metadata for search / filtering (stored in Chroma)."""
    meta: dict = {
        "file": str(path).replace("\\", "/"),
        "row": index,
    }
    for key in ("source", "act", "section", "type", "keywords"):
        if key in row.index and pd.notna(row[key]):
            meta[key] = str(row[key]).strip()
    return meta


def documents_from_csv(path: Path) -> list[Document]:
    
    df = pd.read_csv(path, encoding="utf-8")
    docs: list[Document] = []

    if "content" not in df.columns:
        # Fallback: legacy loader for CSVs without a content column
        loader = CSVLoader(str(path), encoding="utf-8")
        return loader.load()

    for i, row in df.iterrows():
        text = row.get("content")
        if pd.isna(text) or not str(text).strip():
            continue
        docs.append(
            Document(
                page_content=str(text).strip(),
                metadata=_row_metadata(row, path, int(i)),
            )
        )
    return docs


def load_all_csvs(data_dir: Path) -> list[Document]:
    out: list[Document] = []
    for csv_path in sorted(data_dir.glob("*.csv")):
        print(f"  Loading CSV: {csv_path.name}")
        out.extend(documents_from_csv(csv_path))
    return out


def run_ingestion():
    data_path = Path(DATA_PATH)

    # 1. PDFs
    pdf_loader = DirectoryLoader(str(data_path), glob="./*.pdf", loader_cls=PyPDFLoader)
    pdf_docs = pdf_loader.load()

    # 2. CSVs — plain text from `content`, metadata for act/section/keywords
    csv_docs = load_all_csvs(data_path)

    all_docs = pdf_docs + csv_docs
    print(f"✅ Loaded {len(all_docs)} total document pages/rows.")

    # 3. Split 
    print("✂️ Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(all_docs)

    # 4. Embeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 5. Chroma
    print(f"💾 Saving to {CHROMA_PATH}...")
    Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=CHROMA_PATH,
    )


if __name__ == "__main__":
    run_ingestion()
