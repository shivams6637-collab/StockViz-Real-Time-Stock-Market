# System Architecture

## Overview

StockViz uses a React frontend and a FastAPI backend for stock-market visualization.

```text
Browser
   |
   v
React Frontend (localhost:3000)
   | HTTP / WebSocket
   v
FastAPI Backend (localhost:8001)
   |-- Market-data provider (yfinance)
   |-- MongoDB persistence
   |-- Technical-analysis module
```

## Frontend Components

- `frontend/src/App.js` — application entry.
- `frontend/src/components/TradingInterface.js` — main trading and chart interface.
- `frontend/src/components/Navbar.js` — navigation and market-index display.
- `frontend/src/components/ChartTypeSelector.js` — chart-type selection.
- `frontend/src/components/Auth.js` — authentication interface.
- `frontend/src/services/Api.js` — API service.

## Backend Components

- `backend/api/main.py` — FastAPI application and market-data routes.
- `backend/api/auth.py` — authentication routes.
- `backend/api/trading.py` — trading routes.
- `backend/api/data_fetcher.py` — market-data retrieval.
- `backend/api/mongo_trading_db.py` — trading persistence.
- `backend/database/mongo_db.py` — database connection.
- `backend/indicators/technical_analysis.py` — technical-analysis module.

## Typical Data Flow

1. The frontend requests historical market data.
2. The backend retrieves and prepares the data.
3. The frontend renders the selected chart.
4. WebSocket connections can provide updates while connected.
5. Authentication and trading requests use their respective backend routes.

This is a high-level overview. Exact behavior depends on the implementation and market-data-provider availability.
