# LegalTech
# ⚖️ LegalTech AI System

This is a full-stack LegalTech platform built with a modern AI-powered backend and a fast, responsive frontend.

The system includes:
* **AI Legal Chatbot (RAG):** Answers legal questions based on uploaded documents.
* **Legal Document Summarizer:** Summarizes long legal texts.
* **Document Generator:** Generates legal document templates (e.g., FIRs, NDAs).
* **Semantic Search:** Searches through a vector database of legal knowledge.

---

## ⚙️ Tech Stack

* **Frontend:** Next.js (JavaScript) + Tailwind CSS
* **Backend:** FastAPI (Python)
* **Database:** MongoDB
* **AI / ML:** LangChain, SentenceTransformers, ChromaDB (Vector Store)
* **Deployment:** Vercel (Frontend), Render (Backend), MongoDB Atlas (DB)

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine for development.

### 1. Prerequisites

Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or later)
* [Python](https://www.python.org/) (v3.10 or later)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) (or a free MongoDB Atlas account)

### 2. Clone & Install

```bash
# 1. Clone the repository
git clone [YOUR_REPO_URL]
cd legaltech-ai
```

### 3. Backend Setup

First, set up and run the Python backend.

```bash
# 1. Go into the backend folder
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the environment
# Windows (Git Bash)
source venv/Scripts/activate
# Mac / Linux
# source venv/bin/activate

# 4. Install all required packages
pip install -r requirements.txt
```

### 4. Frontend Setup

Next, set up the Next.js frontend in a separate terminal.

```bash
# 1. Go into the frontend folder (from the root)
cd frontend

# 2. Install all npm packages
npm install
```

### 5. Environment Variables (`.env`)

You need to create a `.env` file in the `backend/` folder.

1.  Create the file: `backend/.env`
2.  Copy and paste the template below, adding your own values.

```ini
# This is the connection string for your database.
# For local MongoDB (recommended for development):
DATABASE_URL="mongodb://localhost:27017/legaltech_db"

# For a cloud MongoDB Atlas instance:
# DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/legaltech_db"

# This tells the backend to trust your frontend
CLIENT_ORIGIN="http://localhost:3000"

# Get this from Google AI Studio (for the AI Chatbot)
GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

### 6. Run the Application

You need two terminals open at the same time.

**Terminal 1: Run the Backend**
```bash
# 1. Go to the backend folder
cd backend

# 2. Activate your environment (if not already)
source venv/Scripts/activate

# 3. Start the FastAPI server
uvicorn main:app --reload --port 8000
```
✅ **Backend is now running at `http://localhost:8000`**

**Terminal 2: Run the Frontend**
```bash
# 1. Go to the frontend folder
cd frontend

# 2. Start the Next.js server
npm run dev
```
✅ **Frontend is now running at `http://localhost:3000`**