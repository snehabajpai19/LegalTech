from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings 
from routers import chatbot, summarizer, generator

from database import db_client

app = FastAPI()

@app.on_event("startup")
def startup_db_client():
    if db_client.client:
        print("Backend is starting up...")

@app.on_event("shutdown")
def shutdown_db_client():
    if db_client.client:
        db_client.client.close()
        print("Backend is shutting down...")

# --- CORS (Cross-Origin Resource Sharing) ---

# (running on localhost:3000) to make requests
# to this backend (running on localhost:8000)
origins = [
    settings.CLIENT_ORIGIN,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# --- API Routes ---
app.include_router(chatbot.router)
app.include_router(summarizer.router)
app.include_router(generator.router)

@app.get("/api/health")
def health_check():
    """
    This is a "health check" endpoint.
    If you can access this, the server is running.
    """
    return {"status": "ok", "message": "LegalTech AI Backend is running!"}