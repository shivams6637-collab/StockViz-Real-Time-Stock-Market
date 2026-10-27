import { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react";

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

  const getColorClass = (change) =>
    change >= 0 ? "text-green-500" : "text-red-500";

  const pages = ["Dashboard", "Orders", "Holdings", "Positions", "Funds"];

  return (
    <div className="flex flex-col md:flex-row justify-between items-center px-2 md:px-4 py-2 md:min-h-14 border-b shadow-md sticky top-0 z-50 bg-[var(--surface)] text-[var(--text)] border-[var(--border)]">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 w-full md:w-auto">
        <span className="font-semibold">NIFTY 50</span>

        <div className="flex items-center space-x-2">
          <span>{marketData.nifty.value.toFixed(2)}</span>
          <span className={getColorClass(marketData.nifty.change)}>
            {marketData.nifty.change > 0 ? "+" : ""}
            {marketData.nifty.change.toFixed(2)}%
          </span>
        </div>

        <span className="font-semibold">SENSEX</span>

        <div className="flex items-center space-x-2">
          <span>{marketData.sensex.value.toFixed(2)}</span>
          <span className={getColorClass(marketData.sensex.change)}>
            {marketData.sensex.change > 0 ? "+" : ""}
            {marketData.sensex.change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-5 mt-2 md:mt-0 w-full md:w-auto">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onNavigate?.(page)}
            aria-current={activePage === page ? "page" : undefined}
            className={`text-sm md:text-base transition-colors ${
              activePage === page
                ? "text-blue-600 font-semibold"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Theme toggle button */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to bright mode"
              : "Switch to dark mode"
          }
          title={theme === "dark" ? "Bright mode" : "Dark mode"}
          className="rounded-full border border-[var(--border)] p-2 hover:opacity-80"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications button */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => window.alert("No new notifications.")}
          className="hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Account menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded"
          >
            <span className="max-w-32 truncate">
              {user?.name || user?.email || "My Account"}
            </span>

            <ChevronDown className="w-4 h-4" />
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg">
              <p className="font-semibold break-words">
                {user?.name || "User"}
              </p>

              <p className="mt-1 text-sm text-gray-500 break-words">
                {user?.email}
              </p>

              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  onLogout?.();
                }}
                className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
