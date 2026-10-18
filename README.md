# BERK — Minimal MVP

A minimal web application featuring a password login screen and an interactive single-character 2D space.

---

## Features

- **Server-Side Password Authentication**:
  - The expected password is read from the `BERK_PASSWORD` server-side environment variable.
  - No secrets or expected passwords are exposed in client-side code.
  - Server validation uses constant-time hash comparisons to mitigate timing side-channel attacks.
  - Incorrect passwords return generic rejection without disclosing sensitive details.
- **Protected Sessions**:
  - Authenticated sessions use an `httpOnly`, `SameSite=Lax`, secure HTTP cookie signed via HMAC-SHA256 (`berk_session`).
  - Next.js Edge `middleware.ts` guards `/world` and `/` so unauthenticated requests are redirected immediately without rendering the protected page.
  - Dedicated logout action invalidates the session cookie and redirects to `/login`.
- **Interactive Character Space**:
  - Full-screen space with a single character square.
  - Fluid movement using **WASD** or the **Arrow keys** normalized for diagonal velocities.
  - Prevents browser page scrolling when movement keys are pressed.
  - Viewport boundary clamping guarantees the character never moves off-screen.
  - Dynamic window resize handler maintains boundary clamping whenever the window dimensions change.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18.17+ (tested on Node v20+ and v22+)
- npm v9+

---

## Quickstart & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` to specify your password:
   ```env
   BERK_PASSWORD=your_secure_password_here
   BERK_SESSION_SECRET=optional_custom_secret_key_for_cookie_signing
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build & Test Run Locally**:
   ```bash
   npm run build
   npm run start
   ```

---

## Running Tests

The test suite is powered by **Vitest** and covers authentication validation, session token signing/tamper resistance, movement calculations, diagonal speed normalization, boundary clamping, and resize adjustments.

```bash
npm test
```

---

## Deploying to Vercel

This project is built with Next.js (App Router) and requires zero extra configuration to deploy on Vercel:

1. **Import the repository** into your [Vercel Dashboard](https://vercel.com/new).
2. **Set Environment Variables** in the Vercel project settings:
   - `BERK_PASSWORD`: Set to your production password.
   - `BERK_SESSION_SECRET` *(optional)*: Random string for signing session cookies.
3. **Deploy**:
   - Vercel automatically detects Next.js, executes `npm run build`, and provisions serverless and edge handlers.

---

## Project Structure

```
berk/
├── .env.example          # Template for environment variables
├── .gitignore            # Excludes .env, build output, and node_modules
├── app/
│   ├── api/auth/
│   │   ├── login/        # Server-side login endpoint & cookie setter
│   │   └── logout/       # Session revocation & cookie deletion
│   ├── login/            # Minimal responsive login screen
│   ├── world/            # Full-screen single character space
│   ├── globals.css       # Clean stylesheet with responsive UI styling
│   ├── layout.tsx        # Root HTML layout and viewport configuration
│   └── page.tsx          # Root redirect handler
├── lib/
│   ├── auth.ts           # Web Crypto HMAC session signing & password validation
│   └── movement.ts       # Pure movement calculation & boundary clamping
├── middleware.ts         # Route protection guard for /world & /
├── tests/
│   ├── auth.test.ts      # Unit tests for auth, cookies, and tamper detection
│   └── movement.test.ts  # Unit tests for WASD movement, clamping, and resize
├── package.json
└── tsconfig.json
```
