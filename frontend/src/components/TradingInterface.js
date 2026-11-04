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
import CompanyLogo from "./CompanyLogo";
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
const CompanySelector = ({ selectedSymbol, onChange, companies, theme = "dark" }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("All Industries");
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

  const industries = [
    ...new Set(
      companies
        .map(([, , industry = ""]) => String(industry).trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const filteredCompanies = companies.filter(([symbol, name, industry = ""]) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      symbol.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      String(industry).toLowerCase().includes(query);

    const matchesIndustry =
      selectedIndustry === "All Industries" || industry === selectedIndustry;

    return matchesSearch && matchesIndustry;
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

          <div className="mx-2 mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {["All Industries", ...industries].map((industry) => {
              const active = selectedIndustry === industry;
              return (
                <button
                  type="button"
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "border-blue-500 bg-blue-600 text-white"
                      : theme === "light"
                        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        : "border-gray-600 bg-gray-900 text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {industry === "All Industries" ? "All" : industry}
                </button>
              );
            })}
          </div>

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
    const price = stockData.symbol === selectedSymbol
      ? Number(stockData.price)
      : Number.NaN;

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
  const [chartType, setChartType] = useState(ChartTypes.COLORED_BAR);
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
    lastUpdate: null,
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
        symbol: selectedSymbol,
        price: latest.close,
        change,
        high: Math.max(...historical.map((item) => item.high)),
        low: Math.min(...historical.map((item) => item.low)),
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
    if (
      price === undefined ||
      price === null ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0
    ) return "—";
    return `\u20B9${parseFloat(price).toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume === undefined || volume === null) return "0";
    if (volume >= 1e7) return `${(volume / 1e7).toFixed(2)}Cr`;
    if (volume >= 1e5) return `${(volume / 1e5).toFixed(2)}L`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="sv-chart-tooltip">
          <p>{formatDate(label)}</p>
          <strong>{formatPrice(payload[0].value)}</strong>
          {payload[1] && <span>Vol: {formatVolume(payload[1].value)}</span>}
        </div>
      );
    }
    return null;
  };

  const VolumeTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="sv-chart-tooltip">
        <p>{formatDate(label)}</p>
        <strong>{formatVolume(Number(payload[0].value) || 0)}</strong>
        <span>Volume</span>
      </div>
    );
  };

  const selectedCompany = companies.find(([symbol]) => symbol === selectedSymbol);
  const hasSelectedStockData = stockData.symbol === selectedSymbol;
  const selectedHistorical = hasSelectedStockData ? stockData.historical : [];
  const latestCandle = selectedHistorical[selectedHistorical.length - 1];
  const filteredWatchlist = watchlist.filter((symbol) => {
    const company = companies.find((item) => item[0] === symbol);
    const query = watchlistSearch.trim().toLowerCase();
    return symbol.toLowerCase().includes(query) ||
      (company?.[1] || "").toLowerCase().includes(query);
  });

  return (
    <div className="sv-terminal">
      {error && <div className="sv-terminal-error" role="alert">{error}</div>}
      <div className="sv-terminal-layout">
        <aside className={`sv-watchlist-panel ${isWatchlistOpen ? "is-mobile-open" : ""}`}>
          <div className="sv-watchlist-heading">
            <div>
              <span className="sv-section-kicker">MARKET WATCH</span>
              <h2>Watchlist</h2>
            </div>
            <span className="sv-watchlist-count">{watchlist.length}</span>
            <button
              type="button"
              className="sv-watchlist-close"
              aria-label="Close watchlist"
              onClick={() => setIsWatchlistOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="sv-watchlist-search">
            <input
              type="search"
              value={watchlistSearch}
              onChange={(event) => setWatchlistSearch(event.target.value)}
              placeholder="Search symbols"
              aria-label="Search watchlist"
            />
          </div>
          <div className="sv-watchlist-columns">
            <span>Instrument</span>
            <span className="text-right">Last price</span>
          </div>
          <div className="sv-watchlist-items">
            {filteredWatchlist.length ? filteredWatchlist.map((symbol) => {
              const company = companies.find((item) => item[0] === symbol);
              const quote = watchlistQuotes[symbol];
              const isSelected = selectedSymbol === symbol;
              const isCurrentQuote =
                isSelected && hasSelectedStockData && Number(stockData.price) > 0;
              const price = isCurrentQuote ? stockData.price : quote?.price;
              const change = isCurrentQuote ? stockData.change : quote?.change;
              const hasPrice = Number(price) > 0;

              return (
                <div
                  key={symbol}
                  className={`sv-watchlist-row ${isSelected ? "is-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="sv-watchlist-select"
                    onClick={() => {
                      setSelectedSymbol(symbol);
                      setIsWatchlistOpen(false);
                    }}
                  >
                    <CompanyLogo
                      symbol={symbol}
                      name={company?.[1] || symbol}
                      size="w-8 h-8"
                    />
                    <span className="sv-watchlist-symbol">
                      <strong>{symbol.replace(/\.(NS|BSE)$/, "")}</strong>
                      <small title={company?.[1] || symbol}>{company?.[1] || symbol}</small>
                    </span>
                    <span className="sv-watchlist-quote">
                      <strong>
                        {hasPrice
                          ? `₹${Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </strong>
                      <small className={change == null ? "" : change >= 0 ? "is-positive" : "is-negative"}>
                        {change == null ? "—" : `${change >= 0 ? "+" : ""}${Number(change).toFixed(2)}%`}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${symbol} from watchlist`}
                    className="sv-watchlist-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      setWatchlist((previous) => previous.filter((item) => item !== symbol));
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            }) : (
              <p className="sv-watchlist-empty">
                {watchlist.length ? "No matching instruments." : "Your watchlist is empty. Add a stock to follow it here."}
              </p>
            )}
          </div>
          <p className="sv-watchlist-footnote">Quotes use available historical market data.</p>
        </aside>

        <main className="sv-terminal-main">
          <div className="sv-instrument-toolbar">
            <button
              type="button"
              className="sv-mobile-watchlist-toggle"
              onClick={() => setIsWatchlistOpen((open) => !open)}
              aria-expanded={isWatchlistOpen}
            >
              Watchlist <span>{watchlist.length}</span>
            </button>
            <div className="sv-instrument-search">
              <CompanySelector
                selectedSymbol={selectedSymbol}
                onChange={setSelectedSymbol}
                companies={companies}
                theme={theme}
              />
            </div>
            <div className="sv-toolbar-control">
              <ChartTypeSelector chartType={chartType} onChange={setChartType} />
            </div>
            <div className="sv-toolbar-control sv-duration-control" ref={durationDropdownRef}>
              <button
                type="button"
                className="sv-duration-button"
                onClick={() => setShowDurationDropdown((visible) => !visible)}
                aria-expanded={showDurationDropdown}
              >
                {DURATIONS.find((item) => item.value === duration)?.label || "1D"}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showDurationDropdown && (
                <div className="sv-duration-menu">
                  {DURATIONS.map(({ label, value }) => (
                    <button
                      type="button"
                      key={value}
                      className={duration === value ? "is-selected" : ""}
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
            <button
              type="button"
              onClick={toggleWatchlist}
              className={`sv-watchlist-action ${watchlist.includes(selectedSymbol) ? "is-added" : ""}`}
            >
              {watchlist.includes(selectedSymbol) ? "★ Saved" : "+ Watch"}
            </button>
          </div>

          <section className="sv-instrument-overview">
            <div className="sv-instrument-title">
              <CompanyLogo
                symbol={selectedSymbol}
                name={selectedCompany?.[1] || selectedSymbol}
                className="sv-instrument-avatar"
              />
              <div>
                <span className="sv-section-kicker">{selectedSymbol.endsWith(".BSE") ? "BSE" : "NSE"} · EQUITY</span>
                <h1>{selectedCompany?.[1] || selectedSymbol}</h1>
                <p>{selectedSymbol}{selectedCompany?.[2] ? ` · ${selectedCompany[2]}` : ""}</p>
              </div>
            </div>
            <div className="sv-instrument-price">
              <strong>{hasSelectedStockData ? formatPrice(stockData.price) : "—"}</strong>
              {hasSelectedStockData ? (
                <span className={stockData.change >= 0 ? "is-positive" : "is-negative"}>
                  {stockData.change >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {stockData.change > 0 ? "+" : ""}{Number(stockData.change || 0).toFixed(2)}%
                </span>
              ) : <span>—</span>}
              <small>{loading ? "Updating market data…" : `Last candle ${hasSelectedStockData && stockData.lastUpdate ? formatDate(stockData.lastUpdate) : "—"}`}</small>
            </div>
          </section>

          <section className="sv-market-stats" aria-label="Selected stock details">
            <div className="sv-market-stat">
              <span>OPEN</span>
              <strong>{latestCandle ? formatPrice(latestCandle.open) : "—"}</strong>
            </div>
            <div className="sv-market-stat">
              <span>HIGH</span>
              <strong>{hasSelectedStockData ? formatPrice(stockData.high) : "—"}</strong>
            </div>
            <div className="sv-market-stat">
              <span>LOW</span>
              <strong>{hasSelectedStockData ? formatPrice(stockData.low) : "—"}</strong>
            </div>
            <div className="sv-market-stat">
              <span>VOLUME</span>
              <strong>{latestCandle ? formatVolume(stockData.volume) : "—"}</strong>
            </div>
          </section>

          <section className="sv-terminal-panel sv-chart-panel">
            <div className="sv-panel-heading">
              <div>
                <span className="sv-section-kicker">PRICE ACTION</span>
                <h2>{selectedSymbol} <span>·</span> {DURATIONS.find((item) => item.value === duration)?.label || "1D"}</h2>
              </div>
              <span className={`sv-feed-state ${error ? "has-error" : ""}`}>
                <span />
                {error ? "Feed issue" : loading ? "Updating" : "Market data"}
              </span>
            </div>
            {loading && selectedHistorical.length === 0 ? (
              <div className="sv-chart-loading"><Loader className="h-5 w-5 animate-spin" /> Loading historical data</div>
            ) : selectedHistorical.length ? (
              <StockChart
                data={selectedHistorical}
                chartType={chartType}
                formatDate={formatDate}
                formatPrice={formatPrice}
                formatVolume={formatVolume}
                CustomTooltip={CustomTooltip}
                className="sv-terminal-stock-chart"
              />
            ) : (
              <div className="sv-chart-loading">No historical market data is available for this instrument.</div>
            )}
          </section>

          <section className="sv-terminal-panel sv-volume-panel">
            <div className="sv-panel-heading">
              <div>
                <span className="sv-section-kicker">TRADING ACTIVITY</span>
                <h2>Volume</h2>
              </div>
              <span className="sv-volume-latest">{latestCandle ? formatVolume(stockData.volume) : "—"} <small>shares</small></span>
            </div>
            <div className="sv-volume-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedHistorical} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatDate}
                    minTickGap={55}
                    tick={{ fill: "var(--chart-label)", fontSize: 10 }}
                    axisLine={{ stroke: "var(--chart-grid)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatVolume}
                    width={58}
                    tick={{ fill: "var(--chart-label)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ fill: "var(--chart-hover)" }} />
                  <Bar dataKey="volume" fill="#3989db" radius={[2, 2, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="sv-terminal-panel sv-paper-trading">
            <div className="sv-panel-heading">
              <div>
                <span className="sv-section-kicker">PRACTICE ACCOUNT</span>
                <h2>Paper trading</h2>
              </div>
              <span className="sv-demo-badge">DEMO MODE</span>
            </div>
            <p className="sv-paper-note">Virtual trading only. No real money is used.</p>

            <div className="sv-order-grid">
              <div>
                <label className="sv-field-label">Order side</label>
                <div className="sv-side-toggle">
                  <button type="button" onClick={() => setTradeSide("BUY")} className={tradeSide === "BUY" ? "is-buy-active" : ""}>Buy</button>
                  <button type="button" onClick={() => setTradeSide("SELL")} className={tradeSide === "SELL" ? "is-sell-active" : ""}>Sell</button>
                </div>
              </div>
              <div>
                <label htmlFor="trade-quantity" className="sv-field-label">Quantity (shares)</label>
                <input
                  id="trade-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={tradeQuantity}
                  onChange={(event) => setTradeQuantity(event.target.value)}
                />
              </div>
              <div>
                <span className="sv-field-label">Estimated total</span>
                <div className="sv-order-total">
                  {hasSelectedStockData
                    ? `₹${(Math.max(0, Number(tradeQuantity) || 0) * Number(stockData.price || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                    : "—"}
                </div>
              </div>
            </div>
            {tradeMessage && <p className="sv-trade-message is-success" role="status">{tradeMessage}</p>}
            {tradeError && <p className="sv-trade-message is-error" role="alert">{tradeError}</p>}
            <button
              type="button"
              onClick={submitPaperOrder}
              disabled={placingOrder || loading || !hasSelectedStockData || !stockData.price}
              className={`sv-place-order ${tradeSide === "BUY" ? "is-buy" : "is-sell"}`}
            >
              {placingOrder ? "Placing order…" : `Place paper ${tradeSide} order`}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TradingView;
