import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import settings 
from routers import auth, chatbot, documents, summarizer, generator,search
from database import db_client

logger = logging.getLogger(__name__)

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
app.include_router(documents.router)
app.include_router(generator.router)
app.include_router(auth.router)
app.include_router(search.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled backend exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/api/health")
def health_check():
    """
    This is a "health check" endpoint.
    If you can access this, the server is running.
    """
    return {"status": "ok", "message": "LegalTech AI Backend is running!"}
