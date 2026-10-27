# API Reference

StockViz uses FastAPI for its backend.

When the backend is running locally on port `8001`, the interactive API documentation is normally available at:

- Swagger UI: `http://127.0.0.1:8001/docs`
- OpenAPI schema: `http://127.0.0.1:8001/openapi.json`

## API Modules

- `backend/api/main.py` — market-data and application routes.
- `backend/api/auth.py` — authentication routes.
- `backend/api/trading.py` — trading-related routes.

## HTTP and WebSocket

The application uses HTTP requests and WebSocket connections. Check the running OpenAPI schema and source code for exact endpoint paths, request parameters, authentication requirements, and response structures.

Do not assume every endpoint is available without authentication. This document does not claim an exhaustive endpoint list.
