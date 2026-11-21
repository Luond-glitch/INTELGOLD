# Responsible Gold Mining Platform: Phase 1 and 2

## Run locally
```bash
# 1. Database
createdb goldplatform   # or: docker run -e POSTGRES_PASSWORD=change_me -e POSTGRES_DB=goldplatform -p 5432:5432 postgres:16

# 2. Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # set SECRET_KEY and DATABASE_URL
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd ../frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```
## Images (put in `frontend/public/images/`)
`miner-bg.png` (included), `landing-bg.jpg` (forest and clean ocean), `expert-bg.jpg` (officials at a collapsed shaft), `researcher-bg.jpg` (fieldwork). Use licensed or own photos, 1920px wide or more.

## Keys needed
Google OAuth Client ID (Google Cloud Console), SMTP credentials (reset emails), OpenAI and Gemini keys (Phase 3).
