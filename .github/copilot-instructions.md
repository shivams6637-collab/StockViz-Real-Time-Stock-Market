# StockViz Repository Guidance

## Project shape
- `frontend/` is a React 18 application created with Create React App. UI code lives in `frontend/src/`; use existing component, service, and styling patterns.
- `backend/` is a FastAPI application. API routes and WebSocket behavior live in `backend/api/`, persistence helpers in `backend/database/`, and technical analysis in `backend/indicators/`.
- The backend uses Python 3.12. Dependencies are declared in `backend/requirements.txt`; TA-Lib is a native dependency with platform-specific setup considerations.
- Read the relevant README and nearby implementation before changing behavior. Keep changes scoped and preserve existing public API and data contracts unless the task requires otherwise.

## Development checks
- Frontend tests: from `frontend/`, run `npm test -- --watchAll=false`.
- Frontend production build: from `frontend/`, run `npm run build`.
- Backend local startup: from `backend/`, run `python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8001` in an environment with `requirements.txt` installed. The documented Windows setup uses Python 3.12.
- No backend test runner is declared in the repository requirements; use any existing focused tests if present, and report when backend behavior was not test-verified.

## Data and repository hygiene
- Keep credentials, `.env` values, personal information, and local database contents out of commits. Never print or expose secrets while debugging.
- Do not edit backup copies, generated frontend build output, local databases, or local environment files as a substitute for the maintained source unless explicitly asked.
- Preserve existing license notices and follow `CONTRIBUTING.md` for contribution expectations.
- Stock data providers and market-data terms can constrain availability and redistribution; avoid presenting fetched or sample data as guaranteed real-time or investment advice.
