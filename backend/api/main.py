import time

from threading import Lock

import os

import requests

import logging

import asyncio

import json

import yfinance as yf

import talib

import numpy as np

from fastapi import FastAPI, WebSocket, HTTPException

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse

import time

from starlette.websockets import WebSocketState

from typing import List, Dict, Any

from datetime import datetime

import pandas as pd

from dotenv import load_dotenv



load_dotenv()



logging.basicConfig(level=logging.INFO)

logging.getLogger("yfinance").setLevel(logging.ERROR)  # Suppress non-critical yfinance warnings

from pathlib import Path



env_file = Path(__file__).resolve().parents[1] / ".env"



if env_file.exists():

    for line in env_file.read_text().splitlines():

        if "=" in line and not line.strip().startswith("#"):

            key, value = line.split("=", 1)

            os.environ.setdefault(key.strip(), value.strip())



ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

from database.mongo_db import initialize_database



app = FastAPI()

@app.on_event("startup")
def startup_database():
    initialize_database()



app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:3000",

        "http://127.0.0.1:3000",

        "http://localhost:3001",

        "http://127.0.0.1:3001",

        "http://192.168.1.5:3001",

        "http://localhost:5173",

        "http://127.0.0.1:5173",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)



STOCKS = [

    ('RELIANCE.NS', 'Reliance Industries', 'Energy'),

    ('TCS.NS', 'Tata Consultancy Services', 'Technology'),

    ('HDFCBANK.NS', 'HDFC Bank', 'Banking'),

    ('INFY.NS', 'Infosys', 'Technology'),

    ('ICICIBANK.NS', 'ICICI Bank', 'Banking'),

    ('HINDUNILVR.NS', 'Hindustan Unilever', 'Consumer Goods'),

    ('ITC.NS', 'ITC Limited', 'Consumer Goods'),

    ('SBIN.NS', 'State Bank of India', 'Banking'),

    ('BHARTIARTL.NS', 'Bharti Airtel', 'Telecom'),

    ('LT.NS', 'Larsen & Toubro', 'Infrastructure'),

]



class StockDataManager:

    def __init__(self):

        self.active_connections: List[WebSocket] = []

        self.cache: Dict[str, Dict[str, Any]] = {}

        self.last_updates: Dict[str, datetime] = {}

        self.connection_durations: Dict[WebSocket, str] = {}



    async def connect(self, websocket: WebSocket, duration: str):

        await websocket.accept()

        self.active_connections.append(websocket)

        self.connection_durations[websocket] = duration

        logging.info(f"New WebSocket connection established with duration: {duration}")



    def disconnect(self, websocket: WebSocket):

        if websocket in self.active_connections:

            self.active_connections.remove(websocket)

            self.connection_durations.pop(websocket, None)

            logging.info("WebSocket connection closed")



    def get_duration_params(self, duration: str) -> tuple:

        return {

        '1m': ('1d', '1m'),

        '5m': ('1d', '5m'),

        '15m': ('1d', '15m'),

        '30m': ('5d', '30m'),

        '1h': ('1mo', '1h'),

        '4h': ('3mo', '1h'),

        '1d': ('1d', '1m'),  # Use 1-day period at 1-minute interval for intraday data

        '1w': ('6mo', '1wk'),

        '1mo': ('2y', '1mo')

    }.get(duration, ('1d', '5m'))





    def get_update_interval(self, duration: str) -> int:

        return {

            '1m': 60,

            '5m': 300,

            '15m': 900,

            '30m': 1800,

            '1h': 3600,

            '4h': 14400,

            '1d': 86400,

            '1w': 604800,

            '1mo': 2592000

        }.get(duration, 300)



    def should_update(self, symbol: str, duration: str) -> bool:

        current_time = datetime.now()

        last_update_key = f"{symbol}_{duration}"

        last_update = self.last_updates.get(last_update_key)



        if not last_update:

            self.last_updates[last_update_key] = current_time

            return True



        interval = self.get_update_interval(duration)

        return (current_time - last_update).total_seconds() >= interval



    def process_historical_data(self, hist: pd.DataFrame) -> List[Dict]:

        historical = []

        for index, row in hist.iterrows():

            if pd.isna(row['Close']) or pd.isna(row['Volume']):

                continue



            # Convert index to timestamp safely - type: ignore since iterrows index is always Timestamp for yfinance data

            if isinstance(index, pd.Timestamp):

                timestamp_ms = int(index.timestamp() * 1000)

            else:

                # Fallback for edge cases

                timestamp_ms = int(pd.Timestamp(str(index)).timestamp() * 1000)  # type: ignore



            data_point = {

                "time": timestamp_ms,

                "open": float(row['Open']),

                "high": float(row['High']),

                "low": float(row['Low']),

                "close": float(row['Close']),

                "volume": int(row['Volume']),

                "price": float(row['Close'])

            }

            historical.append(data_point)

        return historical



    def empty_response(self, symbol: str, duration: str) -> Dict[str, Any]:

        return {

            "symbol": symbol,

            "duration": duration,

            "price": 0,

            "change": 0,

            "historical": [],

            "high": 0,

            "low": 0,

            "volume": 0,

            "lastUpdate": int(datetime.now().timestamp() * 1000)

        }







    async def get_stock_data(self, symbol: str, duration: str = "1d") -> Dict[str, Any]:

        cache_key = f"{symbol}:{duration}"

        cached = self.cache.get(cache_key)



        # Cache daily data briefly; do not reuse another duration's chart.

        cache_seconds = 300 if duration in ("1m", "5m", "15m", "30m", "1h", "4h") else 1800

        if cached and (

            datetime.now() - cached["timestamp"]

        ).total_seconds() < cache_seconds:

            return cached["data"].copy()



        # Accept NSE symbols only, e.g. RELIANCE.NS.

        yahoo_symbol = symbol if symbol.endswith(".NS") else symbol.rsplit(".", 1)[0] + ".NS"



        settings = {

             "1m": ("1d", "1m"),

             "5m": ("5d", "5m"),

             "15m": ("1mo", "15m"),

             "30m": ("1mo", "30m"),

             "1h": ("3mo", "60m"),

             "4h": ("3mo", "60m"),

             "1d": ("1d", "5m"),

             "1w": ("5d", "15m"),

             "1mo": ("1mo", "1d"),

             "1y": ("1y", "1d"),

     }

        period, interval = settings.get(duration, ("3mo", "1d"))



        try:

            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}"

            response = await asyncio.to_thread(

                requests.get,

                url,

                params={"range": period, "interval": interval},

                headers={"User-Agent": "Mozilla/5.0"},

                timeout=20,

            )

            response.raise_for_status()

            payload = response.json()



            chart = payload.get("chart", {})

            results = chart.get("result") or []

            if not results:

                logging.warning(

                    "Yahoo returned no chart data for %s: %s",

                    yahoo_symbol, chart.get("error")

                )

                return self.empty_response(symbol, duration)



            result = results[0]

            timestamps = result.get("timestamp") or []

            quote_list = result.get("indicators", {}).get("quote") or []

            if not timestamps or not quote_list:

                return self.empty_response(symbol, duration)



            quote = quote_list[0]

            historical = []



            for i, timestamp in enumerate(timestamps):

                try:

                    open_value = quote["open"][i]

                    high_value = quote["high"][i]

                    low_value = quote["low"][i]

                    close_value = quote["close"][i]

                    volume_value = quote["volume"][i]



                    if any(v is None for v in (

                        open_value, high_value, low_value, close_value

                    )):

                        continue



                    close_value = float(close_value)

                    historical.append({

                        "time": int(timestamp) * 1000,

                        "open": float(open_value),

                        "high": float(high_value),

                        "low": float(low_value),

                        "close": close_value,

                        "volume": int(volume_value or 0),

                        "price": close_value,

                    })

                except (IndexError, KeyError, TypeError, ValueError):

                    continue



            if not historical:

                return self.empty_response(symbol, duration)



            latest = historical[-1]

            previous_close = (

                historical[-2]["close"] if len(historical) > 1

                else latest["open"]

            )

            change = (

                (latest["close"] - previous_close) / previous_close * 100

                if previous_close else 0

            )



            data = {

                "symbol": symbol,

                "duration": duration,

                "price": latest["close"],

                "change": change,

                "historical": historical,

                "high": max(row["high"] for row in historical),

                "low": min(row["low"] for row in historical),

                "volume": sum(row["volume"] for row in historical),

                "latestCandleTime": latest["time"],

                "dataSource": "Yahoo Finance",

                "lastUpdate": int(datetime.now().timestamp() * 1000),

            }



            self.cache[cache_key] = {

                "data": data,

                "timestamp": datetime.now(),

            }

            logging.info(

                "Yahoo data loaded for %s: %d historical points",

                yahoo_symbol, len(historical)

            )

            return data



        except Exception:

            logging.exception("Yahoo Finance request failed for %s", yahoo_symbol)

            return self.empty_response(symbol, duration)









stock_manager = StockDataManager()



@app.get("/api/stocks")

async def get_stocks():

    return STOCKS



@app.get("/api/stock/{symbol}")

async def get_stock(symbol: str, duration: str = '1d'):

    return await stock_manager.get_stock_data(symbol, duration)



last_fetch_time = 0

cached_data = None

CACHE_DURATION = 30 * 60  # 30 minutes in seconds







@app.get("/api/market-indices")

async def get_market_indices():

    global last_fetch_time, cached_data



    current_time = time.time()



    if cached_data and (current_time - last_fetch_time) < CACHE_DURATION:

        return JSONResponse(cached_data)



    default_data = {

        "nifty": {"value": 0, "change": 0},

        "sensex": {"value": 0, "change": 0}

    }



    try:

        def fetch_index(symbol):

            response = requests.get(

                "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol,

                params={"range": "5d", "interval": "1d"},

                headers={"User-Agent": "Mozilla/5.0"},

                timeout=15

            )

            response.raise_for_status()

            result = response.json()["chart"]["result"]



            if not result:

                return None



            quote = result[0]["indicators"]["quote"][0]

            closes = [x for x in quote.get("close", []) if x is not None]

            opens = [x for x in quote.get("open", []) if x is not None]



            if not closes or not opens:

                return None



            value = float(closes[-1])

            opening = float(opens[-1])

            change = ((value - opening) / opening * 100) if opening else 0



            return {"value": value, "change": change}



        nifty, sensex = await asyncio.gather(

            asyncio.to_thread(fetch_index, "^NSEI"),

            asyncio.to_thread(fetch_index, "^BSESN"),

            return_exceptions=True

        )



        if isinstance(nifty, Exception):

            logging.error("NIFTY fetch failed: %s", nifty)

            nifty = None



        if isinstance(sensex, Exception):

            logging.error("SENSEX fetch failed: %s", sensex)

            sensex = None



        if nifty is None or sensex is None:

            logging.warning("One or more market indices unavailable")

            return JSONResponse(default_data)



        cached_data = {"nifty": nifty, "sensex": sensex}

        last_fetch_time = current_time

        return JSONResponse(cached_data)



    except Exception:

        logging.exception("Error fetching market indices")

        return JSONResponse(default_data)



@app.websocket("/ws/{symbol}")

async def websocket_stock_data(websocket: WebSocket, symbol: str, duration: str = "1d"):

    await websocket.accept()



    try:

        while True:

            stock_data = await stock_manager.get_stock_data(symbol, duration)



            if hasattr(stock_data, "model_dump"):

                stock_data = stock_data.model_dump()

            elif hasattr(stock_data, "dict"):

                stock_data = stock_data.dict()



            if not isinstance(stock_data, dict):

                stock_data = {}



            await websocket.send_json({

                "symbol": symbol,

                "duration": duration,

                "price": stock_data.get("price", 0),

                "change": stock_data.get("change", 0),

                "high": stock_data.get("high", 0),

                "low": stock_data.get("low", 0),

                "volume": stock_data.get("volume", 0),

                "historical": stock_data.get("historical", []),

                "latestCandleTime": stock_data.get("latestCandleTime"),

                "dataSource": stock_data.get("dataSource", "Yahoo Finance"),

                "lastUpdate": stock_data.get("lastUpdate")

            })



            await asyncio.sleep(5)



    except Exception:


        logging.exception("WebSocket error for %s", symbol)

    finally:

        logging.info("WebSocket ended for %s", symbol)

from api.trading import router as trading_router

from api.auth import router as auth_router



app.include_router(trading_router)

app.include_router(auth_router)



_alpha_vantage_cache = {}

_alpha_vantage_cache_lock = Lock()

_ALPHA_VANTAGE_CACHE_TTL = 900  # 15 minutes





@app.get("/api/alpha-vantage/stock/{symbol}")

def alpha_vantage_stock(symbol: str):

    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")



    if not api_key:

        raise HTTPException(

            status_code=500,

            detail="Alpha Vantage API key is not configured",

        )



    symbol = symbol.strip().upper()

    base_symbol = symbol.replace(".NS", "").replace(".BSE", "")



    symbol_map = {

        "RELIANCE": "RELIANCE.BSE",

        "TCS": "TCS.BSE",

        "HDFCBANK": "HDFCBANK.BSE",

        "INFY": "INFY.BSE",

        "ICICIBANK": "ICICIBANK.BSE",

        "HINDUNILVR": "HINDUNILVR.BSE",

        "ITC": "ITC.BSE",

        "SBIN": "SBIN.BSE",

        "BHARTIARTL": "BHARTIARTL.BSE",

        "LT": "LT.BSE",

    }



    av_symbol = symbol_map.get(base_symbol, symbol)



    # Return cached data if it is still fresh.

    with _alpha_vantage_cache_lock:

        cached = _alpha_vantage_cache.get(av_symbol)



        if (

            cached

            and time.time() - cached["time"] < _ALPHA_VANTAGE_CACHE_TTL

        ):

            return cached["data"]



    try:

        response = requests.get(

            "https://www.alphavantage.co/query",

            params={

                "function": "TIME_SERIES_DAILY",

                "symbol": av_symbol,

                "outputsize": "compact",

                "apikey": api_key,

            },

            timeout=20,

        )



        response.raise_for_status()

        data = response.json()



        if "Error Message" in data:

            raise HTTPException(

                status_code=404,

                detail=f"Alpha Vantage does not support {av_symbol}",

            )



        if "Note" in data or "Information" in data:

            raise HTTPException(

                status_code=429,

                detail="Alpha Vantage API limit or restriction reached",

            )



        series = data.get("Time Series (Daily)")



        if not series:

            print("Alpha Vantage response:", data)

            raise HTTPException(

                status_code=502,

                detail=f"No daily data returned for {av_symbol}",

            )



        historical = []



        for date in sorted(series.keys()):

            item = series[date]



            historical.append({

                "date": date,

                "open": float(item["1. open"]),

                "high": float(item["2. high"]),

                "low": float(item["3. low"]),

                "close": float(item["4. close"]),

                "volume": int(item["5. volume"]),

            })



        latest = historical[-1]



        result = {

            "symbol": av_symbol,

            "date": latest["date"],

            "price": latest["close"],

            "source": "Alpha Vantage",

            "data_type": "daily historical data",

            "historical": historical,

        }



        # Cache only successful responses.

        with _alpha_vantage_cache_lock:

            _alpha_vantage_cache[av_symbol] = {

                "time": time.time(),

                "data": result,

            }



        return result



    except HTTPException:

        raise



    except requests.RequestException as exc:

        raise HTTPException(

            status_code=502,

            detail=f"Alpha Vantage request failed: {exc}",

        )





@app.get("/api/alpha-vantage/test")

def alpha_vantage_test():

    return {"status": "Alpha Vantage endpoint registered"}
