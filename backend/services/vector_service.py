import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parents[1]

# Load backend/.env explicitly so startup does not depend on the current working directory.
load_dotenv(BASE_DIR / ".env")


class VectorService:
    def __init__(self):
        # Preserve whichever Hugging Face token is available for downstream libraries.
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if hf_token:
            os.environ["HF_TOKEN"] = hf_token

        self.persist_directory = os.getenv("CHROMA_PATH", "vector_db")
        self.model_name = "all-MiniLM-L6-v2"
        self.embeddings = None
        self.db = None

        print("Initializing Vector Service...")

        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.model_name,
                model_kwargs={"device": "cpu", "local_files_only": True},
            )
        except Exception as e:
            print(f"ERROR: failed to initialize embeddings: {e}")
            print("The app cannot reach Hugging Face or the model is not cached locally.")
            return

        persist_path = Path(self.persist_directory)
        full_path = persist_path if persist_path.is_absolute() else BASE_DIR / persist_path
        full_path = full_path.resolve()

        if full_path.exists():
            try:
                self.db = Chroma(
                    persist_directory=str(full_path),
                    embedding_function=self.embeddings,
                )
                print(f"Vector DB loaded successfully from: {full_path}")
            except Exception as e:
                print(f"ERROR: failed to load Chroma DB: {e}")
        else:
            print(f"ERROR: folder '{self.persist_directory}' not found!")
            print("Run 'python scripts/embed_laws.py' to generate it.")

    def search_legal_docs(self, query: str, k: int = 3):
        if not self.db:
            return []
        return self.db.similarity_search(query, k=k)
    
    def search_legal_docs_with_scores(self, query: str, k: int = 10):
        """
        Semantic search over Chroma. Returns (Document, distance) pairs.
        Lower distance usually means closer match (depends on Chroma metric).
        """
        if not self.db:
            return []
        try:
            return self.db.similarity_search_with_score(query, k=k)
        except Exception as exc:
            print(f"similarity_search_with_score failed ({exc}); falling back without scores.")
            docs = self.db.similarity_search(query, k=k)
            return [(doc, 0.0) for doc in docs]


vector_service = VectorService()
