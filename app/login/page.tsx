'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid password');
        setIsLoading(false);
        return;
      }

      // Successful login - redirect to world
      window.location.href = data.redirectUrl || '/world';
    } catch {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <header className="login-header">
          <span className="login-badge">BERK MVP</span>
          <h1 className="login-title">Access Space</h1>
          <p className="login-subtitle">Enter password to enter the world</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password-input" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="password-input"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="login-button"
            className="submit-btn"
            disabled={isLoading || !password}
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
