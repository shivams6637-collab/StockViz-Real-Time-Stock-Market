
import React, { useState } from 'react';
import { api } from '../services/Api';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = mode === 'signup'
        ? await api.signup({ name: name.trim(), email: email.trim(), password })
        : await api.login({ email: email.trim(), password });

      sessionStorage.setItem('stockviz_token', result.token);
      sessionStorage.setItem('stockviz_user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700">
          StockViz
        </h1>
        <p className="mt-2 text-center text-gray-500">
          Virtual stock market practice
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`rounded-md py-2 ${mode === 'login' ? 'bg-white shadow font-semibold' : ''}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`rounded-md py-2 ${mode === 'signup' ? 'bg-white shadow font-semibold' : ''}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-sm font-medium">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                autoComplete="name"
                required
                className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'signup' ? 8 : 1}
              maxLength={128}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">
          Paper trading only. No real money or brokerage orders.
        </p>
      </div>
    </main>
  );
}
