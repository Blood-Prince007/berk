'use client';

import React, { useState } from 'react';
import { account, isAuthorizedUser, AUTHORIZED_USERS, SOPREMISH_USER_ID, GRAPE_USER_ID } from '@/lib/appwrite';

export default function LoginPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>(SOPREMISH_USER_ID);
  const [email, setEmail] = useState(AUTHORIZED_USERS[SOPREMISH_USER_ID]?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!email && !password) || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Determine target user accurately
    let targetUserId = selectedUserId;
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail.includes('grishma') || lowerEmail.includes('grape')) {
      targetUserId = GRAPE_USER_ID;
    } else if (lowerEmail.includes('prem') || lowerEmail.includes('sopremish')) {
      targetUserId = SOPREMISH_USER_ID;
    }

    // 1. Try Appwrite Cloud Account Session if email is provided
    if (email.includes('@')) {
      try {
        try {
          await account.deleteSession('current');
        } catch {}

        await account.createEmailPasswordSession(email.trim(), password);
        const user = await account.get();

        if (!isAuthorizedUser(user.$id)) {
          await account.deleteSession('current');
          setError('Access denied: You are not an authorized member of this private world.');
          setIsLoading(false);
          return;
        }

        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.$id }),
        });

        window.location.href = '/world';
        return;
      } catch (err: any) {
        console.warn('Appwrite cloud session attempt failed, attempting secure BERK key fallback:', err);
      }
    }

    // 2. Server-Side Secure Password Fallback (BERK_PASSWORD with targeted userId)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password || email,
          userId: targetUserId,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      window.location.href = data.redirectUrl || '/world';
    } catch {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    const u = AUTHORIZED_USERS[userId];
    if (u) {
      setEmail(u.email);
      setError(null);
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">
        <header className="login-header">
          <span className="login-badge">★ BERK • RESIDENCE ★</span>
          <h1 className="login-title">VIRTUAL HOME</h1>
          <p className="login-subtitle">SELECT CHARACTER &amp; ENTER</p>
        </header>

        {/* Pixel Character Selector */}
        <div className="character-select-row">
          <button
            type="button"
            onClick={() => selectUser(SOPREMISH_USER_ID)}
            className={`pixel-char-btn sopremish ${email === AUTHORIZED_USERS[SOPREMISH_USER_ID]?.email ? 'selected' : ''}`}
          >
            <span className="pixel-char-icon">👨‍💻</span>
            <span>SOPREMISH</span>
          </button>
          <button
            type="button"
            onClick={() => selectUser(GRAPE_USER_ID)}
            className={`pixel-char-btn grape ${email === AUTHORIZED_USERS[GRAPE_USER_ID]?.email ? 'selected' : ''}`}
          >
            <span className="pixel-char-icon">🍇</span>
            <span>GRAPE</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="email-input"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="premsonarofficial@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className="password-input"
                disabled={isLoading}
              />
            </div>
          </div>

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
            disabled={isLoading || (!email && !password)}
          >
            {isLoading ? 'VERIFYING...' : '▶ ENTER RESIDENCE'}
          </button>
        </form>
      </div>
    </main>
  );
}
