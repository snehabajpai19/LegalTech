import os
import pandas as pd
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# --- CONFIGURATION ---
DATA_PATH = "data/" #Currently it have dummy pdfs, 
CHROMA_PATH = "vector_db/"

def run_ingestion():
    # 1. Load Documents
    
    # Loads all PDFs in the folder
    pdf_loader = DirectoryLoader(DATA_PATH, glob="./*.pdf", loader_cls=PyPDFLoader)
    pdf_docs = pdf_loader.load()
    
    # Loads all CSVs in the folder (if any)
    csv_loader = DirectoryLoader(DATA_PATH, glob="./*.csv", loader_cls=CSVLoader)
    csv_docs = csv_loader.load()
    
    all_docs = pdf_docs + csv_docs
    print(f"✅ Loaded {len(all_docs)} total document pages/rows.")

    # 2. Split Text into Chunks
    # We use Recursive splitting to keep legal sections together as much as possible
    print("✂️ Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(all_docs)
    

    # 3. Create Embeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 4. Save to ChromaDB
    print(f"💾 Saving to {CHROMA_PATH}...")
    db = Chroma.from_documents(
        chunks, 
        embeddings, 
        persist_directory=CHROMA_PATH
    )
  

if __name__ == "__main__":
    run_ingestion()