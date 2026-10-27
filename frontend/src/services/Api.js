
const BASE_URL = `http://${window.location.hostname}:8001`;

function getToken() {
  return sessionStorage.getItem('stockviz_token');
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem('stockviz_token');
      sessionStorage.removeItem('stockviz_user');
      window.dispatchEvent(new Event('stockviz:unauthorized'));
    }

    throw new Error(data.detail || data.message || 'Request failed');
  }

  return data;
}

export const api = {
  signup: (body) =>
    request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request('/api/auth/me'),

  logout: () => {
    sessionStorage.removeItem('stockviz_token');
    sessionStorage.removeItem('stockviz_user');
  },

  getStocks: () => request('/api/stocks'),

  getStockData: (symbol) =>
    request(`/api/stocks/${encodeURIComponent(symbol)}`),

  getFunds: () => request('/api/trading/funds'),

  addDemoFunds: (amount) =>
    request('/api/trading/funds/add', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) }),
    }),

  withdrawDemoFunds: (amount) =>
    request('/api/trading/funds/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) }),
    }),

  getFundTransactions: () => request('/api/trading/funds/transactions'),

  getOrders: () => request('/api/trading/orders'),

  getHoldings: () => request('/api/trading/holdings'),

  getPositions: () => request('/api/trading/positions'),

  placeOrder: (body) =>
    request('/api/trading/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  connectWebSocket: (symbol, onMessage, onError) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(
      `${protocol}//${window.location.hostname}:8001/ws/${encodeURIComponent(symbol)}`
    );

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };

    socket.onerror = (event) => {
      if (onError) onError(event);
    };

    return socket;
  },
};
