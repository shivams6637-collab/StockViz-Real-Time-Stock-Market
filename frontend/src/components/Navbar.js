import { useState, useEffect } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  ClipboardList,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Wallet,
} from "lucide-react";

const pages = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Orders", icon: ClipboardList },
  { name: "Holdings", icon: BriefcaseBusiness },
  { name: "Positions", icon: ChartNoAxesCombined },
  { name: "Funds", icon: Wallet },
];

const getMarketSession = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  const isWeekday = !["Sat", "Sun"].includes(values.weekday);

  return isWeekday && minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30
    ? "Open"
    : "Closed";
};

const Navbar = ({
  theme = "dark",
  onToggleTheme,
  onNavigate,
  activePage = "Dashboard",
  user,
  onLogout,
}) => {
  const [marketData, setMarketData] = useState({
    nifty: null,
    sensex: null,
  });
  const [marketSession, setMarketSession] = useState(getMarketSession);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMarketData = async () => {
      try {
        const response = await fetch(
          `http://${window.location.hostname}:8001/api/market-indices`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const parseIndex = (index) => {
          const value = Number(index?.value);
          const change = Number(index?.change);
          return Number.isFinite(value) && value > 0 && Number.isFinite(change)
            ? { value, change }
            : null;
        };

        if (!cancelled) {
          setMarketData({
            nifty: parseIndex(data?.nifty),
            sensex: parseIndex(data?.sensex),
          });
        }
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      }
    };

    const updateMarketSession = () => setMarketSession(getMarketSession());
    fetchMarketData();
    const fetchInterval = setInterval(fetchMarketData, 30 * 60 * 1000);
    const sessionInterval = setInterval(updateMarketSession, 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(fetchInterval);
      clearInterval(sessionInterval);
    };
  }, []);

  const formatIndex = (index) =>
    index?.value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || "—";

  const changeColor = (index) =>
    !index
      ? "text-[var(--text-muted)]"
      : index.change > 0
        ? "text-emerald-400"
        : index.change < 0
          ? "text-rose-400"
          : "text-[var(--text-muted)]";

  return (
    <header className="sv-navbar sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
      <div className="sv-navbar-top mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate?.("Dashboard")}
          className="flex items-center gap-3 text-left"
          aria-label="StockViz dashboard"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-blue-950/30">
            <Activity size={21} strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">
              Stock<span className="text-sky-400">Viz</span>
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Market terminal
            </span>
          </span>
        </button>

        <div className="sv-market-ribbon order-3 flex w-full items-center gap-2 overflow-x-auto sm:order-none sm:w-auto sm:gap-3">
          <span
            className={`sv-session-badge ${marketSession === "Open" ? "is-open" : "is-closed"}`}
            title="Based on regular NSE/BSE session hours in India Standard Time; exchange holidays are not included."
          >
            <span className="sv-session-dot" />
            {marketSession}
          </span>
          {[
            { name: "NIFTY 50", data: marketData.nifty },
            { name: "SENSEX", data: marketData.sensex },
          ].map(({ name, data }) => (
            <div className="sv-index-quote" key={name}>
              <span className="sv-index-name">{name}</span>
              <span className="sv-index-value">{formatIndex(data)}</span>
              <span className={`sv-index-change ${changeColor(data)}`}>
                {data
                  ? `${data.change > 0 ? "+" : ""}${data.change.toFixed(2)}%`
                  : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="sv-icon-button"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => window.alert("No new notifications.")}
            className="sv-icon-button"
          >
            <Bell size={17} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              aria-expanded={accountOpen}
              className="sv-account-button"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-400">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                {user?.name || user?.email || "My Account"}
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              />
            </button>
            {accountOpen && (
              <div className="sv-account-menu absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                <p className="break-words font-semibold">{user?.name || "User"}</p>
                <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                  {user?.email}
                </p>
                <div className="my-3 border-t border-[var(--border)]" />
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="sv-main-nav mx-auto flex max-w-[1800px] items-center gap-1 overflow-x-auto px-3 sm:px-6"
      >
        {pages.map(({ name, icon: Icon }) => {
          const active = activePage === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onNavigate?.(name)}
              aria-current={active ? "page" : undefined}
              className={`sv-nav-link ${active ? "is-active" : ""}`}
            >
              <Icon size={16} />
              {name}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Navbar;
