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

const Navbar = ({
  theme = "dark",
  onToggleTheme,
  onNavigate,
  activePage = "Dashboard",
  user,
  onLogout,
}) => {
  const [marketData, setMarketData] = useState({
    nifty: { value: 0, change: 0 },
    sensex: { value: 0, change: 0 },
  });

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

        if (!cancelled) {
          setMarketData({
            nifty: {
              value: Number(data?.nifty?.value ?? 0),
              change: Number(data?.nifty?.change ?? 0),
            },
            sensex: {
              value: Number(data?.sensex?.value ?? 0),
              change: Number(data?.sensex?.change ?? 0),
            },
          });
        }
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const pages = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Orders", icon: ClipboardList },
    { name: "Holdings", icon: BriefcaseBusiness },
    { name: "Positions", icon: ChartNoAxesCombined },
    { name: "Funds", icon: Wallet },
  ];

  const formatIndex = (value) =>
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const changeColor = (change) =>
    change > 0
      ? "text-emerald-500"
      : change < 0
        ? "text-rose-500"
        : "text-[var(--text-muted)]";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate?.("Dashboard")}
          className="flex items-center gap-3 text-left"
          aria-label="StockViz dashboard"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-600 text-white shadow-md">
            <Activity size={23} strokeWidth={2.5} />
          </span>

          <span>
            <span className="block text-xl font-extrabold tracking-tight">
              Stock<span className="text-emerald-500">Viz</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Market intelligence
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] transition hover:bg-[var(--surface-alt)]"
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            onClick={() => window.alert("No new notifications.")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] transition hover:bg-[var(--surface-alt)]"
          >
            <Bell size={18} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              aria-expanded={accountOpen}
              className="flex max-w-[220px] items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 transition hover:bg-[var(--surface-alt)]"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-500">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                {user?.name || user?.email || "My Account"}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              />
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-y border-[var(--border)] bg-[var(--surface-alt)]/60">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Market watch
          </span>

          {[
            { name: "NIFTY 50", data: marketData.nifty },
            { name: "SENSEX", data: marketData.sensex },
          ].map(({ name, data }) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-muted)]">{name}</span>
              <span className="text-sm font-bold tabular-nums">{formatIndex(data.value)}</span>
              <span className={`text-xs font-semibold tabular-nums ${changeColor(data.change)}`}>
                {data.change > 0 ? "+" : ""}
                {data.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {pages.map(({ name, icon: Icon }) => {
          const active = activePage === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onNavigate?.(name)}
              aria-current={active ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium transition sm:px-4 ${
                active
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={17} />
              {name}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Navbar;
