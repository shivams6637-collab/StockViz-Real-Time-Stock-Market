import React, { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Loader, ChevronDown } from "lucide-react";
import { ChartTypes, StockChart, ChartTypeSelector } from "./ChartTypeSelector";
import { api } from "../services/Api";

const DURATIONS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1mo" },
  { label: "1Y", value: "1y" },
];
const CompanyLogo = ({ symbol, name, size = "w-9 h-9" }) => {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const domains = {
    "RELIANCE.NS": "ril.com", "TCS.NS": "tcs.com",
    "HDFCBANK.NS": "hdfcbank.com", "INFY.NS": "infosys.com",
    "ICICIBANK.NS": "icicibank.com", "HINDUNILVR.NS": "hul.co.in",
    "ITC.NS": "itcportal.com", "SBIN.NS": "sbi.co.in",
    "BHARTIARTL.NS": "airtel.in", "LT.NS": "larsentoubro.com"
  };
  const domain = domains[symbol] || domains[(symbol || "").replace(/\.BSE$/, ".NS")];
  const localLogos = {
  "RELIANCE.NS": "/logos/reliance.svg",
  "RELIANCE.BSE": "/logos/reliance.svg",
  "TCS.NS": "/logos/tcs.svg",
  "TCS.BSE": "/logos/tcs.svg",
  "HDFCBANK.NS": "/logos/hdfc.svg",
  "HDFCBANK.BSE": "/logos/hdfc.svg",
  "INFY.NS": "/logos/infosys.svg",
  "INFY.BSE": "/logos/infosys.svg",
  "ICICIBANK.NS": "/logos/icici.svg",
  "ICICIBANK.BSE": "/logos/icici.svg",
  "BHARTIARTL.NS": "/logos/airtel.svg",
  "BHARTIARTL.BSE": "/logos/airtel.svg"
};
  const localLogo = localLogos[symbol];
  const initials = (name || symbol || "?").split(/\s+/).filter(Boolean)
    .slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return (
    <div className={`${size} shrink-0 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden text-xs font-semibold text-white`} title={name || symbol}>
      {localLogo && !logoFailed ? (
        <img src={localLogo} alt={`${name} logo`} className="w-full h-full object-contain bg-white" onError={() => setLogoFailed(true)} />
      ) : initials}
    </div>
  );
};
const CompanySelector = ({ selectedSymbol, onChange, companies, theme = "dark" }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCompany =
    companies.find(([symbol]) => symbol === selectedSymbol)?.[1] ||
    selectedSymbol;

  const filteredCompanies = companies.filter(([symbol, name, sector = ""]) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      symbol.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      sector.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full p-2 border rounded flex items-center justify-between text-sm md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${theme === "light" ? "bg-white text-gray-900 border-gray-300 hover:bg-gray-50" : "bg-[#111a29] text-white border-gray-700 hover:bg-gray-800"}`}
        onClick={() => setShowDropdown((previous) => !previous)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CompanyLogo symbol={selectedSymbol} name={selectedCompany} />
          <span className="truncate">{selectedCompany}</span>
        </span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>

      {showDropdown && (
        <div className={`absolute left-0 mt-1 w-full py-2 border rounded shadow-lg z-20 ${theme === "light" ? "bg-white text-gray-900 border-gray-300" : "bg-[#111a29] text-white border-gray-700"}`}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search stock or sector..."
            className={`w-[calc(100%-16px)] mx-2 mb-2 p-2 rounded border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${theme === "light" ? "bg-white text-gray-900 placeholder-gray-500 border-gray-300" : "bg-gray-900 text-white placeholder-gray-400 border-gray-600"}`}
            autoFocus
          />

          <div className="max-h-64 overflow-y-auto">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map(([symbol, name, sector = ""]) => (
                <button
                  type="button"
                  key={symbol}
                  className={`w-full px-4 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${theme === "light" ? (selectedSymbol === symbol ? "bg-blue-100 text-blue-900" : "text-gray-900 hover:bg-gray-100") : (selectedSymbol === symbol ? "bg-blue-900 text-blue-300" : "text-white hover:bg-gray-800")}`}
                  onClick={() => {
                    onChange(symbol);
                    setShowDropdown(false);
                    setSearchTerm("");
                  }}
                >
                  <span className="flex items-center gap-3">
                    <CompanyLogo symbol={symbol} name={name} size="w-8 h-8" />
                    <span className="min-w-0">
                      <span className="block truncate">{name}</span>
                      <span className="block text-xs text-gray-400">
                        {symbol} {sector ? `- ${sector}` : ""}
                      </span>
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400">
                No matching stocks found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
const TradingView = ({ theme = "dark" }) => {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.BSE");
  const [watchlistSearch, setWatchlistSearch] = useState("");
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [watchlistQuotes, setWatchlistQuotes] = useState({});

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("stockviz_watchlist") || "[]");
      return Array.isArray(saved) ? saved.filter(x => typeof x === "string") : [];
    } catch {
      return [];
    }
  });

  // Watchlist quote fetch: real backend prices only.
  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      for (const symbol of watchlist) {
        try {
          const response = await fetch(
            `http://localhost:8001/api/stock/${encodeURIComponent(symbol)}?duration=1d`
          );
          if (!response.ok) continue;

          const data = await response.json();
          const candles = (Array.isArray(data.historical) ? data.historical : [])
            .map(item => ({
              time: Number(item.time),
              close: Number(item.close ?? item.price)
            }))
            .filter(item => Number.isFinite(item.time) && item.close > 0)
            .sort((a, b) => a.time - b.time);

          const latest = candles[candles.length - 1];
          const previous = candles[candles.length - 2];
          const price = Number(latest?.close ?? data.price);

          if (cancelled) return;
          if (!Number.isFinite(price) || price <= 0) continue;

          const change = previous?.close > 0
            ? ((price - previous.close) / previous.close) * 100
            : null;

          setWatchlistQuotes(current => ({
            ...current,
            [symbol]: { price, change }
          }));
        } catch (error) {
          console.warn("Watchlist quote unavailable:", symbol, error);
        }
      }
    }

    if (watchlist.length) loadQuotes();
    return () => { cancelled = true; };
  }, [watchlist]);
  useEffect(() => {
    try {
      localStorage.setItem("stockviz_watchlist", JSON.stringify(watchlist));
    } catch (err) {
      console.error("Watchlist save failed:", err);
    }
  }, [watchlist]);

  const toggleWatchlist = () => {
    setWatchlist(prev =>
      prev.includes(selectedSymbol)
        ? prev.filter(symbol => symbol !== selectedSymbol)
        : [...prev, selectedSymbol]
    );
  };
  const [tradeSide, setTradeSide] = useState("BUY");
  const [tradeQuantity, setTradeQuantity] = useState("1");
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeError, setTradeError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const submitPaperOrder = async () => {
    setTradeMessage("");
    setTradeError("");

    const quantity = Number(tradeQuantity);
    const price = Number(stockData.price);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setTradeError("Quantity kam se kam 1 share honi chahiye.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setTradeError("Valid stock price available nahi hai.");
      return;
    }

    setPlacingOrder(true);
    try {
      const order = await api.placeOrder({
        symbol: selectedSymbol,
        side: tradeSide,
        quantity,
        price,
      });
      setTradeMessage(
        `${order.side} order successful: ${order.quantity} shares of ${order.symbol}.`
      );
    } catch (err) {
      setTradeError(err.message || "Order place nahi ho paya.");
    } finally {
      setPlacingOrder(false);
    }
  };
  const [duration, setDuration] = useState("1d");
  const [chartType, setChartType] = useState(ChartTypes.LINE);
  const [companies, setCompanies] = useState([]);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const durationDropdownRef = React.useRef(null);
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target)) {
        setShowDurationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [stockData, setStockData] = useState({
    price: 0,
    change: 0,
    historical: [],
    high: 0,
    low: 0,
    volume: 0,
    lastUpdate: Date.now(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequestId = React.useRef(0);
  const fetchStockData = useCallback(async () => {
    const requestId = ++fetchRequestId.current;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8001/api/stock/${encodeURIComponent(selectedSymbol)}?duration=${encodeURIComponent(duration)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch stock data");
      }

      const data = await response.json();
      if (requestId !== fetchRequestId.current) return;

      const historical = (data.historical || [])
        .map((item) => {
          const rawTime = item.time ?? item.timestamp ?? item.date;
          const time = typeof rawTime === "number"
            ? rawTime
            : new Date(rawTime).getTime();

          return {
            time,
            date: item.date ?? (Number.isFinite(time) ? new Date(time).toISOString() : null),
            open: Number(item.open ?? 0),
            high: Number(item.high ?? 0),
            low: Number(item.low ?? 0),
            close: Number(item.close ?? item.price ?? 0),
            price: Number(item.close ?? item.price ?? 0),
            volume: Number(item.volume ?? 0),
          };
        })
        .filter((item) => Number.isFinite(item.time) && item.close > 0)
        .sort((a, b) => a.time - b.time);

      const latest = historical[historical.length - 1];

      if (!latest) {
        throw new Error("No valid historical stock data returned by backend");
      }

      const previous = historical[historical.length - 2];
      const change = previous && previous.close
        ? ((latest.close - previous.close) / previous.close) * 100
        : 0;

      setStockData((prev) => ({
        ...prev,
        symbol: data.symbol || selectedSymbol,
        price: latest.close,
        change,
        high: latest.high,
        low: latest.low,
        volume: latest.volume,
        historical,
        lastUpdate: latest.time,
      }));
    } catch (err) {
      if (requestId === fetchRequestId.current) {
        console.error("Failed to fetch stock data:", err);
        setError(err.message || "Failed to fetch stock data");
      }
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [selectedSymbol, duration]);


  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(
      `ws://localhost:8001/ws/${selectedSymbol}?duration=${duration}`
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.duration !== duration) return;

        setStockData((prev) => {
          const incomingTime = Number(data.latestCandleTime);
          const lastIndex = prev.historical.length - 1;
          const newHistorical = [...prev.historical];

          // Never use server wall-clock time as a market candle timestamp.
          if (Number.isFinite(incomingTime) && incomingTime > 0) {
            if (
              lastIndex === -1 ||
              incomingTime > Number(newHistorical[lastIndex].time)
            ) {
newHistorical.push({
                time: incomingTime,
                date: new Date(incomingTime).toISOString(),
                open: Number(data.price) || prev.price,
                high: Number(data.price) || prev.price,
                low: Number(data.price) || prev.price,
                close: Number(data.price) || prev.price,
                price: Number(data.price) || prev.price,
                volume: Number(data.volume) || 0,
              });
            } else if (
              incomingTime === Number(newHistorical[lastIndex].time)
            ) {
const previousCandle = newHistorical[lastIndex];
              const price = Number(data.price) || previousCandle.close || prev.price;
              newHistorical[lastIndex] = {
                ...previousCandle,
                high: Math.max(Number(previousCandle.high) || price, price),
                low: Math.min(Number(previousCandle.low) || price, price),
                close: price,
                price: price,
                volume: Number(data.volume) || previousCandle.volume || 0,
              };
            }
          }

          const maxPoints = {
            "1m": 60,
            "5m": 60,
            "15m": 120,
            "30m": 120,
            "1h": 200,
            "4h": 200,
            "1d": 200,
            "1w": 500,
            "1mo": 500,
            "1y": 1000,
          }[duration] || 500;

          const price = Number(data.price) || prev.price;

          return {
            ...prev,
            price,
            change: data.change ?? prev.change,
            high: price ? Math.max(prev.high || price, price) : prev.high,
            low: price ? Math.min(prev.low || price, price) : prev.low,
            historical: newHistorical.slice(-maxPoints),
            lastUpdate: Number.isFinite(incomingTime) && incomingTime > 0
              ? incomingTime
              : prev.lastUpdate,
          };
        });
      } catch (err) {
        console.error("Invalid WebSocket stock data:", err);
      }
    };

    ws.onopen = () => {
      setError((prev) =>
        prev === "WebSocket connection error" ? null : prev
      );
      console.log("WebSocket connected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection error");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return ws;
  }, [selectedSymbol, duration]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/stocks");
        if (!response.ok) throw new Error("Failed to fetch companies");
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setError("Failed to fetch companies");
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchStockData();
    const ws = connectWebSocket();
    return () => {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, [fetchStockData, connectWebSocket]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const format = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: duration === "1m" ? "2-digit" : undefined,
      month:
        duration === "1d" || duration === "1w" || duration === "1mo" || duration === "1y"
          ? "short"
          : undefined,
      day:
        duration === "1d" || duration === "1w" || duration === "1mo" || duration === "1y"
          ? "numeric"
          : undefined,
    });
    return format.format(date);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "\u20B90.00";
    return `\u20B9${parseFloat(price).toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume === undefined || volume === null) return "0";
    if (volume >= 1e7) return `${(volume / 1e7).toFixed(2)}Cr`;
    if (volume >= 1e5) return `${(volume / 1e5).toFixed(2)}L`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-gray-600 font-medium">
           {formatDate(label)}
           </p>
          <p className="font-bold text-gray-900">
             {formatPrice(payload[0].value)}
         </p>
          {payload[1] && (
            <p className="text-gray-400">
              Vol: {formatVolume(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-2 md:p-4 bg-[#111a29] rounded-lg shadow">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 mb-4">
        <div className="w-full md:w-1/3">
          <CompanySelector
            selectedSymbol={selectedSymbol}
            onChange={setSelectedSymbol}
            companies={companies}
      theme={theme}
          />

          <button
            type="button"
            onClick={toggleWatchlist}
            className={`mt-2 w-full px-3 py-2 rounded border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${theme === "light" ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100" : "border-gray-600 bg-gray-900 text-white hover:bg-gray-800"}`}
          >
            {watchlist.includes(selectedSymbol) ? "Remove from Watchlist" : "Add to Watchlist"}
          </button>
        </div>


      {!isWatchlistOpen && (
        <div className="fixed right-5 bottom-5 z-40">
          <button
            type="button"
            onClick={() => setIsWatchlistOpen(true)}
            className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white shadow-xl hover:bg-blue-500"
          >
            {`Ã¢ËœÂ° Watchlist (${watchlist.length})`}
          </button>
        </div>
      )}

      {isWatchlistOpen && (
        <>
          <button
            type="button"
            aria-label="Close watchlist overlay"
            onClick={() => setIsWatchlistOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/20"
          />
          <aside className={`fixed right-4 top-20 bottom-20 z-50 flex w-[min(92vw,440px)] flex-col overflow-hidden rounded-xl border shadow-2xl ${theme === "light" ? "border-gray-300 bg-white text-gray-900" : "border-slate-700 bg-[#111827] text-white"}`}>
            <div className="flex items-center justify-between gap-2 p-4">
              <div>
                <h3 className="font-semibold">My Watchlist</h3>
                <p className="text-xs opacity-60">{watchlist.length} stocks Ã‚Â· Market Watch</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWatchlistOpen(false)}
                aria-label="Close watchlist"
                className="rounded px-3 py-1 text-xl hover:bg-slate-700/30"
              >
                Ãƒâ€”
              </button>
            </div>

            <div className="px-3 pb-3">
              <input
                type="text"
                value={watchlistSearch}
                onChange={(e) => setWatchlistSearch(e.target.value)}
                placeholder="Search watchlist..."
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${theme === "light" ? "border-gray-300 bg-white" : "border-slate-700 bg-[#0b1220] text-white"}`}
              />
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className={`sticky top-0 ${theme === "light" ? "bg-gray-50 text-gray-500" : "bg-[#0b1220] text-slate-400"}`}>
                  <tr>
                    <th className="px-3 py-3 font-medium">Symbol</th>
                    <th className="px-3 py-3 text-right font-medium">Price</th>
                    <th className="px-3 py-3 text-right font-medium">Change</th>
                    <th className="px-3 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.filter((symbol) => {
                    const company = companies.find((item) => item[0] === symbol);
                    const query = (watchlistSearch || "").toLowerCase();
                    return symbol.toLowerCase().includes(query) ||
                      (company?.[1] || "").toLowerCase().includes(query);
                  }).map((symbol) => {
                    const company = companies.find((item) => item[0] === symbol);
                    const isSelected = selectedSymbol === symbol;
                    const quote = watchlistQuotes[symbol];
                    const hasPrice = Number(quote?.price) > 0;
                    const price = hasPrice ? Number(quote.price) : null;
                    const change = hasPrice && Number.isFinite(Number(quote.change))
                      ? Number(quote.change)
                      : null;

                    return (
                      <tr
                        key={symbol}
                        onClick={() => setSelectedSymbol(symbol)}
                        className={`cursor-pointer border-t ${theme === "light" ? "border-gray-200 hover:bg-blue-50" : "border-slate-800 hover:bg-slate-800/70"} ${isSelected ? (theme === "light" ? "bg-blue-50" : "bg-blue-950/40") : ""}`}
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium">{symbol.replace(/\.(NS|BSE)$/, "")}</div>
                          <div className="max-w-36 truncate text-xs opacity-60">{company?.[1] || symbol}</div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {price !== null ? `Ã¢â€šÂ¹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Ã¢â‚¬â€"}
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums ${change === null ? "opacity-50" : change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {change === null ? "Ã¢â‚¬â€" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            aria-label={`Remove ${symbol} from watchlist`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setWatchlist((previous) => previous.filter((item) => item !== symbol));
                            }}
                            className="rounded px-2 py-1 opacity-70 hover:text-red-400"
                          >
                            Ãƒâ€”
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-700 p-3">
              <span className="text-xs opacity-60">Select a stock to update the chart</span>
              <button
                type="button"
                onClick={() => {
                  if (!watchlist.includes(selectedSymbol)) toggleWatchlist();
                }}
                disabled={watchlist.includes(selectedSymbol)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </aside>
        </>
      )}        <div className="w-full md:w-1/3">
          <ChartTypeSelector chartType={chartType} onChange={setChartType} />
        </div>

        <div className="w-full md:w-1/3 relative" ref={durationDropdownRef}>
          <button
            className="w-full p-2 border rounded bg-[#111a29] flex items-center justify-between text-sm md:text-base"
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
          >
            <span>
              {DURATIONS.find((d) => d.value === duration)?.label || "1D"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showDurationDropdown && (
            <div className="absolute left-0 md:right-0 mt-1 w-full md:w-36 py-1 bg-[#111a29] border rounded shadow-lg z-10">
              {DURATIONS.map(({ label, value }) => (
                <button
                  key={value}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                    duration === value ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  onClick={() => {
                    setDuration(value);
                    setShowDurationDropdown(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6 text-xs md:text-sm">
        <div className="p-2 bg-gray-50 text-gray-900 rounded">
          <div className="text-gray-600">Price</div>
          <div className="font-semibold text-gray-900">{formatPrice(stockData.price)}</div>
        </div>
        <div className="p-2 bg-gray-50 text-gray-900 rounded">
          <div className="text-gray-600">Change</div>
          <div
            className={`font-semibold flex items-center gap-1 ${
              stockData.change >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {stockData.change >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {(stockData.change || 0).toFixed(2)}%
          </div>
        </div>
        <div className="p-2 bg-gray-50 text-gray-900 rounded">
          <div className="text-gray-600">High</div>
          <div className="font-semibold text-gray-900">{formatPrice(stockData.high)}</div>
        </div>
        <div className="p-2 bg-gray-50 text-gray-900 rounded">
          <div className="text-gray-600">Low</div>
          <div className="font-semibold text-gray-900">{formatPrice(stockData.low)}</div>
        </div>
      </div>

      <StockChart
        data={stockData.historical}
        chartType={chartType}
        formatDate={formatDate}
        formatPrice={formatPrice}
        formatVolume={formatVolume}
        CustomTooltip={CustomTooltip}
        className="h-48 md:h-96 mb-6 md:mb-12"
      />

      <div className="my-6 rounded-lg border bg-[#111a29] p-4 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">Paper Trading</h2>
        <p className="mb-4 text-sm text-gray-400">Virtual trading only ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â no real money is used.</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Order Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTradeSide("BUY")}
                className={`flex-1 rounded px-4 py-2 text-white ${tradeSide === "BUY" ? "bg-green-600" : "bg-gray-400"}`}>
                Buy
              </button>
              <button type="button" onClick={() => setTradeSide("SELL")}
                className={`flex-1 rounded px-4 py-2 text-white ${tradeSide === "SELL" ? "bg-red-600" : "bg-gray-400"}`}>
                Sell
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="trade-quantity" className="mb-1 block text-sm font-medium">Quantity (shares)</label>
            <input id="trade-quantity" type="number" min="1" step="1"
              value={tradeQuantity}
              onChange={(event) => setTradeQuantity(event.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Estimated Total</label>
            <div className="rounded bg-gray-50 text-gray-900 px-3 py-2 font-semibold">
              ?{(Math.max(0, Number(tradeQuantity) || 0) * Number(stockData.price || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {tradeMessage && <p className="mt-3 rounded bg-green-50 p-3 text-green-700">{tradeMessage}</p>}
        {tradeError && <p className="mt-3 rounded bg-red-50 p-3 text-red-700">{tradeError}</p>}

        <button type="button" onClick={submitPaperOrder} disabled={placingOrder || loading}
          className={`mt-4 w-full rounded px-4 py-3 font-semibold text-white disabled:opacity-50 ${tradeSide === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
          {placingOrder ? "Placing Order..." : `Place Paper ${tradeSide} Order`}
        </button>
      </div>
      <div className="h-32 md:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockData.historical}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              height={50}
              tickMargin={20}
              // minTickGap={50}
            />
            <YAxis tickFormatter={formatVolume} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" fill="#fecaca" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingView;
