import React, { useState } from 'react';
import { api } from '../services/Api';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = mode === 'signup'
        ? await api.signup({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await api.login({
            email: email.trim(),
            password,
          });

      sessionStorage.setItem('stockviz_token', result.token);
      sessionStorage.setItem('stockviz_user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080e1b] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <style>{`
        .stockviz-particle-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .stockviz-particle {
          position: absolute;
          display: block;
          border-radius: 9999px;
          background: rgba(125, 211, 252, 0.95);
          box-shadow: 0 0 7px rgba(56, 189, 248, 0.65);
          animation: stockviz-float var(--duration, 24s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
          opacity: 0;
        }
        .stockviz-particle.bubble {
          background: transparent;
          border: 1px solid rgba(125, 211, 252, 0.45);
          box-shadow: none;
        }
        @keyframes stockviz-float {
          0% { transform: translate3d(0, 20px, 0); opacity: 0; }
          15% { opacity: var(--opacity, 0.45); }
          50% { transform: translate3d(18px, -35px, 0); }
          85% { opacity: var(--opacity, 0.45); }
          100% { transform: translate3d(-10px, -85px, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .stockviz-particle { animation: none; opacity: 0.18; }
        }
      `}</style>
      <div className="stockviz-particle-layer" aria-hidden="true">
        {Array.from({ length: 80 }, (_, i) => {
          const bubble = i % 5 === 0;
          const size = bubble ? 7 + (i % 3) * 3 : 1 + (i % 3);
          return (
            <span
              key={i}
              className={`stockviz-particle${bubble ? ' bubble' : ''}`}
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                '--duration': `${8 + (i % 5) * 2}s`,
                '--delay': `${-(i % 13) * 0.8}s`,
                '--opacity': `${0.35 + (i % 4) * 0.12}`,
              }}
            />
          );
        })}
      </div>
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101a2b] shadow-2xl shadow-black/40 lg:grid-cols-2">

        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#142b50] via-[#10213c] to-[#0c1526] p-10 lg:flex xl:p-14">
          <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border border-blue-400/10" />
          <div className="pointer-events-none absolute -right-12 top-36 h-48 w-48 rounded-full border border-blue-400/15" />
          <div className="pointer-events-none absolute bottom-24 left-10 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-600/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                  <path d="M3 13h4l3-8 4 14 3-6h4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Stock<span className="text-cyan-400">Viz</span>
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Market intelligence
                </p>
              </div>
            </div>

            <div className="mt-20">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Learn by doing
              </div>

              <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
                Understand the market.
                <span className="mt-2 block text-cyan-400">
                  Practice with confidence.
                </span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                Explore stock charts, follow market movements and build your
                trading knowledge in a virtual practice environment.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Your learning space</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Virtual Market
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                    <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 7h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex h-16 items-end gap-2">
                {[25, 38, 30, 52, 43, 65, 48, 72, 58, 90, 75, 100, 82, 94].map((height, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-t-sm ${index % 4 === 0 ? 'bg-cyan-400/50' : 'bg-blue-500/60'}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Practice first. Learn at your own pace.
              </p>
            </div>
          </div>

          <p className="relative mt-10 text-xs text-slate-500">
            A smarter way to explore the stock market.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-10 xl:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-600/20 lg:hidden">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                  <path d="M3 13h4l3-8 4 14 3-6h4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                Welcome to StockViz
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {isSignup
                  ? 'Start exploring the virtual stock market today.'
                  : 'Sign in to continue your market practice.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#0b1322] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                aria-pressed={!isSignup}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  !isSignup
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                aria-pressed={isSignup}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isSignup
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {isSignup && (
                <div>
                  <label htmlFor="auth-name" className="mb-2 block text-sm font-medium text-slate-200">
                    Full name
                  </label>
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true">
                      <path d="M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-[#0b1322] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-slate-200">
                  Email address
                </label>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0b1322] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="auth-password" className="block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <span className="text-xs text-slate-500">
                    {isSignup ? '8+ characters' : 'Your account password'}
                  </span>
                </div>
                <div className="relative">
                  <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={isSignup ? 8 : 1}
                    maxLength={128}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0b1322] py-3.5 pl-12 pr-20 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm leading-5 text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-900/40 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create Account'
                    : 'Sign In'}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs leading-5 text-slate-400">
                <span className="font-semibold text-slate-200">Practice safely.</span>
                {' '}Paper trading only. No real money or brokerage orders.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              StockViz <span className="mx-1.5 text-slate-700">•</span>
              Market learning made simple
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}