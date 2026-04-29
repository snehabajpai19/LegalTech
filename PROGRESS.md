# Legal Document Generator – Progress Tracker

## Overview
Implementation of the Legal Edge document generator module with template management, PII-safe generation flow, and backend+frontend integration. This file records decisions, completed work, and next steps so the whole team can stay aligned.

---

## Phase Plan & Status

1. **Foundation / Planning** — ✅ _Complete_
   - Repository cloned locally, environment reviewed.
   - High-level architecture and phased roadmap agreed.

2. **Backend Document Generator** — 🔄 _In Progress_
   - [x] Template data models (Pydantic).
   - [x] Template service (CRUD, version metadata).
   - [x] Document generator service (PII redaction + rendering).
   - [x] API router: `/api/templates`, `/api/generator` endpoints.
   - [x] Sample template seeding utility.

3. **Frontend Module** — ⏳ _Pending_
   - Dynamic form rendering from template metadata.
   - AI suggestion UI hooks (stub initially).
   - Preview + export actions.

4. **Security & PII Protection** — ⏳ _Pending_
   - Placeholder-based redaction for LLM calls.
   - Encrypted PII mapping store.

5. **Testing & Documentation** — ⏳ _Pending_
   - Unit + integration tests.
   - User/developer documentation updates.

---

## Decisions & Notes
- Keep existing backend structure (FastAPI + PyMongo) intact; add new router/service files without major refactors.
- Store templates in MongoDB collection `document_templates` with explicit version metadata.
- Use Jinja2 for template rendering; record requirement in `backend/requirements.txt`.
- Redaction uses regex + field metadata (is_pii) as first pass; will expand in later phases.

---

## Next Immediate Tasks
1. Implement template service + router endpoints.
2. Implement document generation service with placeholder-based PII masking.
3. Integrate new router into `backend/main.py` and expose health/test endpoints.
4. Seed DB with at least one FIR template for local testing.

_This log should be updated after every meaningful milestone (new feature, refactor, or decision)._

## All routes
Public:

GET /api/health
POST /api/auth/google
GET /api/templates
POST /api/templates
GET /api/templates/{template_id}
PUT /api/templates/{template_id}
DELETE /api/templates/{template_id}
POST /api/search/legal
Protected:

GET /api/auth/me
POST /api/chatbot/query
POST /api/summarizer/upload/pdf
POST /api/summarizer/upload/ocr
POST /api/generator/render