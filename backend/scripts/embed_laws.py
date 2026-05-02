from pathlib import Path

import pandas as pd
from langchain_community.document_loaders import CSVLoader, DirectoryLoader, PyPDFLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "Data"
CHROMA_PATH = BASE_DIR / "vector_db"


def _row_metadata(row: pd.Series, path: Path, index: int) -> dict:
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
        loader = CSVLoader(str(path), encoding="utf-8")
        return [
            doc
            for doc in loader.load()
            if doc.page_content and doc.page_content.strip()
        ]

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
        try:
            print(f"Loading CSV: {csv_path.name}")
            out.extend(documents_from_csv(csv_path))
        except Exception as exc:
            print(f"Skipping CSV {csv_path.name}: {exc}")
    return out


def load_pdf_files(data_dir: Path) -> list[Document]:
    out: list[Document] = []
    for pdf_path in sorted(data_dir.glob("*.pdf")):
        try:
            print(f"Loading PDF: {pdf_path.name}")
            docs = PyPDFLoader(str(pdf_path)).load()
            out.extend(
                doc
                for doc in docs
                if doc.page_content and doc.page_content.strip()
            )
        except Exception as exc:
            print(f"Skipping PDF {pdf_path.name}: {exc}")
    return out


def load_txt_files(data_dir: Path) -> list[Document]:
    out: list[Document] = []
    for txt_path in sorted(data_dir.glob("*.txt")):
        try:
            if not txt_path.read_text(encoding="utf-8").strip():
                print(f"Skipping empty TXT: {txt_path.name}")
                continue

            print(f"Loading TXT: {txt_path.name}")
            docs = TextLoader(str(txt_path), encoding="utf-8").load()
            out.extend(
                doc
                for doc in docs
                if doc.page_content and doc.page_content.strip()
            )
        except Exception as exc:
            print(f"Skipping TXT {txt_path.name}: {exc}")
    return out


def run_ingestion() -> None:
    pdf_docs = load_pdf_files(DATA_PATH)
    csv_docs = load_all_csvs(DATA_PATH)
    txt_docs = load_txt_files(DATA_PATH)

    all_docs = csv_docs + txt_docs
    print(f"Loaded {len(pdf_docs)} PDF documents/pages.")
    print(f"Loaded {len(csv_docs)} CSV rows/documents.")
    print(f"Loaded {len(txt_docs)} TXT documents.")
    print(f"Loaded {len(all_docs)} total document pages/rows.")

    print("Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(all_docs)
    print(f"Created {len(chunks)} total chunks.")

    if not chunks:
        print("No chunks to ingest. Vector store was not changed.")
        return

    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"local_files_only": True},
    )

    print(f"Adding chunks to vector store at {CHROMA_PATH}...")
    db = Chroma(
        persist_directory=str(CHROMA_PATH),
        embedding_function=embeddings,
    )
    db.add_documents(chunks)
    db.persist()
    print("Ingestion complete.")


if __name__ == "__main__":
    run_ingestion()
