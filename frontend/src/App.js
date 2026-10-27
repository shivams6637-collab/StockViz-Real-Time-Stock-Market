import React, { useCallback, useEffect, useState } from 'react';
import TradingInterface from './components/TradingInterface';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import { api } from './services/Api';
import './styles/App.css';
const pageInfo = {
  Orders: {
    description: 'Your paper-trading orders.',
    columns: ['Order ID', 'Instrument', 'Type', 'Quantity', 'Price', 'Total', 'Status'],
  },
  Holdings: {
    description: 'Shares currently held in your account.',
    columns: ['Instrument', 'Quantity', 'Average Price'],
  },
  Positions: {
    description: 'Your open paper-trading positions.',
    columns: ['Instrument', 'Type', 'Quantity', 'Average Price'],
  },
};

const money = (value) =>
  Number(value ?? 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('stockviz_theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('stockviz_theme', theme);
  }, [theme]);
  const [user, setUser] = useState(null);
const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {
  const token = sessionStorage.getItem('stockviz_token');

  if (!token) {
    setAuthChecking(false);
    return;
  }

  api.getMe()
    .then((result) => {
      const currentUser = result.user || result;
      sessionStorage.setItem('stockviz_user', JSON.stringify(currentUser));
      setUser(currentUser);
    })
    .catch(() => {
      api.logout();
      setUser(null);
    })
    .finally(() => setAuthChecking(false));
}, []);

const handleLogout = () => {
  api.logout();
  setUser(null);
  setActivePage('Dashboard');
};
  const [rows, setRows] = useState([]);
  const [funds, setFunds] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [fundAmount, setFundAmount] = useState('');
  const [fundBusy, setFundBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPageData = useCallback(async () => {
    if (activePage === 'Dashboard') return;

    setLoading(true);
    setError('');

    try {
      if (activePage === 'Funds') {
        const [latestFunds, latestTransactions] = await Promise.all([
          api.getFunds(),
          api.getFundTransactions(),
        ]);
        setFunds(latestFunds);
        setTransactions(latestTransactions);
      } else {
        const loaders = {
          Orders: api.getOrders,
          Holdings: api.getHoldings,
          Positions: api.getPositions,
        };
        setRows(await loaders[activePage]());
      }
    } catch (err) {
      setError(err.message || 'Unable to load account data.');
    } finally {
      setLoading(false);
    }
  }, [activePage]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleFundAction = async (action) => {
    const amount = Number(fundAmount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      setError('Enter an amount greater than ₹0 and no more than ₹10,00,000.');
      return;
    }

    setFundBusy(true);
    setError('');

    try {
      const result = action === 'add'
        ? await api.addDemoFunds(amount)
        : await api.withdrawDemoFunds(amount);

      setFunds((previous) => ({
        ...previous,
        balance: result.balance,
      }));
      setFundAmount('');
      await loadPageData();
    } catch (err) {
      setError(err.message || 'Wallet transaction failed.');
    } finally {
      setFundBusy(false);
    }
  };

  const navigate = (page) => {
    setActivePage(page);
    setRows([]);
    setError('');
  };

  const page = pageInfo[activePage];
  if (authChecking) {
  return <p className="p-10 text-center">Checking login...</p>;
}

if (!user) {
  return <Auth onLogin={setUser} />;
}
  return (
    <div>
      <Navbar
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
        onNavigate={navigate}
        activePage={activePage}
        user={user}
        onLogout={handleLogout}
      />

      {activePage === 'Dashboard' ? (
        <TradingInterface theme={theme} />
      ) : (
        <main className="mx-auto max-w-7xl p-4 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{activePage}</h1>
              <p className="mt-2 text-gray-500">
                {page?.description || 'Your virtual trading account balance.'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadPageData}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading account data...</p>
          ) : activePage === 'Funds' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Starting Virtual Balance</p>
                <p className="mt-2 text-2xl font-semibold">
                  {money(funds?.starting_balance)}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Available Virtual Funds</p>
                <p className="mt-2 text-2xl font-semibold text-green-700">
                  {money(funds?.balance)}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="mt-2 text-xl font-semibold">
                  {funds?.account_type === 'paper_trading'
                    ? 'Paper Trading'
                    : funds?.account_type || 'â€”'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Currency: {funds?.currency || 'INR'}
                </p>
              </div>
              <section className="rounded-lg border bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
                <h2 className="text-lg font-semibold">Wallet Actions</h2>
                <p className="mt-1 text-sm text-amber-700">
                  DEMO MODE — Virtual funds only. No real money or payment is involved.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    value={fundAmount}
                    onChange={(event) => setFundAmount(event.target.value)}
                    placeholder="Enter amount in ₹"
                    aria-label="Amount in rupees"
                    className="min-w-0 flex-1 rounded-md border px-3 py-2"
                    disabled={fundBusy}
                  />
                  <button
                    type="button"
                    onClick={() => handleFundAction('add')}
                    disabled={fundBusy}
                    className="rounded-md bg-green-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    Add Demo Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFundAction('withdraw')}
                    disabled={fundBusy}
                    className="rounded-md bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    Withdraw Demo Funds
                  </button>
                </div>
                {fundBusy && (
                  <p className="mt-2 text-sm text-gray-500">Processing demo transaction...</p>
                )}
              </section>

              <section className="overflow-x-auto rounded-lg border bg-white shadow-sm sm:col-span-2 lg:col-span-3">
                <h2 className="p-5 text-lg font-semibold">Transaction History</h2>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Balance After</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No wallet transactions yet.
                        </td>
                      </tr>
                    ) : transactions.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="whitespace-nowrap px-4 py-3">
                          {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">{item.type === 'ADD_FUNDS' ? 'Add Funds' : 'Withdraw'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(item.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{money(item.balance_after)}</td>
                        <td className="px-4 py-3">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <p className="text-sm text-gray-500 sm:col-span-2 lg:col-span-3">
                Virtual money for practice only; this is not a real brokerage balance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {page.columns.map((column) => (
                      <th key={column} className="whitespace-nowrap px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={page.columns.length}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        No {activePage.toLowerCase()} yet. Place a paper trade from the Dashboard.
                      </td>
                    </tr>
                  ) : rows.map((item, index) => (
                    <tr key={item.id || `${item.symbol}-${index}`} className="border-t">
                      {activePage === 'Orders' && (
                        <>
                          <td className="whitespace-nowrap px-4 py-3">{item.id || 'â€”'}</td>
                          <td className="px-4 py-3">{item.symbol}</td>
                          <td className="px-4 py-3">{item.side}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-3">{money(item.price)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{money(item.total)}</td>
                          <td className="px-4 py-3">{item.status}</td>
                        </>
                      )}
                      {activePage === 'Holdings' && (
                        <>
                          <td className="px-4 py-3">{item.symbol}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-3">{money(item.average_price)}</td>
                        </>
                      )}
                      {activePage === 'Positions' && (
                        <>
                          <td className="px-4 py-3">{item.symbol}</td>
                          <td className="px-4 py-3">{item.position_type || 'LONG'}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-3">{money(item.average_price)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
