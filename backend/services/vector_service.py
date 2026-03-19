import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

BASE_DIR = Path(__file__).resolve().parents[1]

# Load backend/.env explicitly so startup does not depend on the current working directory.
load_dotenv(BASE_DIR / ".env")

class VectorService:
    def __init__(self):
        # 1. Setup HF Token 
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if hf_token:
            os.environ["HUGGINGFACEHUB_API_TOKEN"] = hf_token
        
        self.persist_directory = os.getenv("CHROMA_PATH", "vector_db")
        self.model_name = "all-MiniLM-L6-v2"
        
        print("🤖 Initializing Vector Service...")
        
        # 2. Load the Embedding Model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.model_name,
            model_kwargs={'device': 'cpu'} 
        )
        
        # 3. Connect to the existing Vector DB
        persist_path = Path(self.persist_directory)
        full_path = persist_path if persist_path.is_absolute() else BASE_DIR / persist_path
        full_path = full_path.resolve()
        
        if os.path.exists(full_path):
            self.db = Chroma(
                persist_directory=str(full_path),
                embedding_function=self.embeddings
            )
            print(f"✅ Vector DB loaded successfully from: {full_path}")
        else:
            self.db = None
            print(f"❌ ERROR: folder '{self.persist_directory}' not found!")
            print("👉 Run: 'python scripts/embed_laws.py' to generate it.")

    def search_legal_docs(self, query: str, k: int = 3):
        if not self.db:
            return []
        return self.db.similarity_search(query, k=k)

# Create the Singleton instance
vector_service = VectorService()
