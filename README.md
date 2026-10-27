# StockViz - Real-Time Stock Market Visualization Platform

StockViz is a modern, responsive web application for real-time stock market data visualization and analysis. Built with React and FastAPI, it provides interactive charts and technical analysis tools for Indian stock market data.

![Trading View Screenshot](.github/images/Screenshot%202025-02-10%20003153.png)

## Features

### Current Features
- Real-time stock price updates via WebSocket connection
- Multiple chart types:
  - Line Chart
  - Bar Chart
  - Candlestick Chart
- Customizable time intervals (1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, 1M)
- Live market indices tracking (NIFTY 50, SENSEX)
- Responsive design for all device sizes
- Interactive tooltips with price and volume information
- Volume analysis chart
- Real-time data updates with automatic reconnection handling

### Project Workflow
The application follows a real-time data streaming architecture:

1. **Data Flow**
   - Backend fetches initial stock data from yfinance API
   - WebSocket connection established for real-time updates
   - Frontend subscribes to specific stock symbols and durations
   - Real-time price updates are pushed to connected clients

2. **Component Structure**
   - Navbar: Displays market indices (NIFTY 50, SENSEX)
   - TradingInterface: Main chart component with controls
   - ChartSelector: Manages different chart types
   - StockSelector: Company selection dropdown
   - TimeframeSelector: Duration selection (1m to 1M)

3. **Data Processing**
   - Historical data loaded on initial component mount
   - Real-time updates merged with historical data
   - Technical indicators calculated using TA-Lib
   - Automatic data caching and update intervals
   - Smart reconnection handling for WebSocket disruptions

4. **State Management**
   - React hooks for local state management
   - WebSocket state for real-time updates
   - Caching layer for performance optimization
   - Duration-based data aggregation
   - Automatic memory management for historical data

### Technical Stack
- **Frontend**: React, Tailwind CSS, Recharts
- **Backend**: FastAPI, WebSocket
- **Data Source**: yfinance
- **Technical Analysis**: TA-Lib
- **State Management**: React Hooks
- **APIs**: REST and WebSocket

## Roadmap

### Chart Enhancements
- [ ] Improve candlestick visualization for 4h and 1h timeframes
- [ ] Add new chart types:
  - [ ] Vertex Line
  - [ ] Step
  - [ ] Mountain
  - [ ] Baseline
  - [ ] Scatterplot
  - [ ] Histogram

### User Interface Improvements
- [ ] Implement sliding window duration selector
- [ ] Add chart interaction features:
  - [ ] Zoom in/out
  - [ ] Pan/Move
  - [ ] Chart download functionality
- [ ] Technical indicator dropdown menu with TA-Lib integration
- [ ] Simple Moving Average (SMA) overlay on candlestick charts
- [ ] Theme switcher (Light/Dark mode)

### Technical Analysis Tools
- [ ] Integration with more TA-Lib indicators
- [ ] Custom indicator settings
- [ ] Multiple indicator overlay support
- [ ] Save and load indicator configurations

## Installation

### Prerequisites
- Python 3.12
- Node.js and npm
- MongoDB running locally, or a configured MongoDB URI

### 1. Get the project
Clone the repository and enter the project root containing `backend` and `frontend`.

### 2. Install backend dependencies
Open PowerShell in the project root:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env` locally and configure the required `JWT_SECRET` and any optional provider keys. Never commit `.env` or expose secret values.

### 3. Start the backend
From the `backend` directory, run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8001
```

### 4. Start the frontend
Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:3000`. Keep both servers running during local development.

## Environment Setup

### Backend Requirements
- Python 3.12
- FastAPI
- yfinance
- TA-Lib
- pandas
- uvicorn

### Frontend Requirements
- Node.js 14+
- React 18
- Tailwind CSS
- Recharts
- Lucide React

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [yfinance](https://github.com/ranaroussi/yfinance) for providing stock market data
- [TA-Lib](https://github.com/mrjbq7/ta-lib) for technical analysis tools
- [Recharts](https://recharts.org/) for the charting library
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
## Licensing and Copyright

- `LICENSE` contains the existing MIT License for the original project code. Preserve its copyright notice and license terms.
- `COPYRIGHT.md` describes the intended copyright scope for qualifying original modifications.
- `THIRD_PARTY_NOTICES.md` lists the project's known direct dependencies and notes that their individual license terms must be checked.
- Unfinalized license drafts are excluded from this repository. The existing MIT License and applicable third-party terms remain in effect.

Before distributing this project, verify ownership, dependency license requirements, and market-data provider terms.

## Credits & Contributions

### Original Project
StockViz is based on the original project by **Kanishk (Kanishk1420)**.

Original repository: https://github.com/Kanishk1420/StockViz-Real-Time-Stock-Market

### Modifications and Contributions
**Contributor:** Shivam Singh
**GitHub:** https://github.com/shivams6637-collab

The following areas have been worked on in this version. This list describes contribution areas and does not claim ownership of the original project:

- **Stock charts:** Improvements and debugging for line, bar, and candlestick chart display.
- **Chart timeframes:** Fixes for switching chart durations and handling stale chart responses.
- **Market data:** Historical stock-data integration and debugging using the existing data provider.
- **Market indices:** Improvements and debugging related to NIFTY 50 and SENSEX display.
- **Frontend/backend integration:** API and WebSocket integration debugging.
- **Paper trading:** Virtual trading and demo-funds workflow, where implemented.
- **Bug fixes and UI improvements:** Changes made while testing and debugging the application.

Only features and changes actually present in the source code should be treated as completed contributions.

### Copyright and License
The original author's copyright notice and MIT License terms are preserved. Any contributor copyright notice applies only to that contributor's own original contributions. Third-party code, dependencies, APIs, and market data remain subject to their respective licenses and terms.
