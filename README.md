# BERK — Cozy 2D Pixel-Art Virtual World

A private virtual world belonging to **Sopremish** and **Grape**. Features a secure password-protected gateway and an interactive top-down 2D pixel-art living room with smooth movement, collision geometry, and contextual object interactions.

---

## Features

- **Cozy Top-Down 2D Pixel-Art Living Room**:
  - Enclosed, detailed interior with warm parquet wood flooring, crown moulding, and skirting boards.
  - Large ornate boho woven rug defining the central seating space.
  - Plush 3-seater terracotta velvet sofa with throw pillows and realistic foot collision.
  - Walnut coffee table with a steaming ceramic mug of spiced chai and an open notebook.
  - Media console featuring a retro TV playing a peaceful animated landscape.
  - Double-hung sunlit window casting soft ambient light beams across the room.
  - Tall dark oak library bookshelf with multi-colored book spines and trailing ivy.
  - Mid-century brass floor lamp emitting a warm ambient glow.
  - Large potted Monstera Deliciosa and decorative succulent stand.
  - Wall clock, framed coastal landscape painting, and a sleeping orange tabby cat.

- **Fluid Player Movement & Collision System**:
  - Top-down character sprite with directional facing (**Down**, **Up**, **Left**, **Right**) and 4-frame walking animations.
  - Controllable via **WASD** and **Arrow Keys** with diagonal speed normalization.
  - Pure sliding collision resolution against walls and furniture to prevent sticking along obstacle edges.
  - Browser scroll prevention on active movement keys and safe focus/blur state cleanup.
  - Mobile-ready on-screen virtual D-pad and Action button for touch devices.

- **Proximity Interaction System**:
  - Approaching key objects displays an unobtrusive in-world floating indicator: `[E] <Object Name>`.
  - Pressing `E` (or clicking/tapping the prompt) opens a cozy pixel-styled inspection dialog with detailed lore and descriptions.
  - Dismissable via `Esc`, `E`, or clicking "Continue".

- **Server-Side Security & Protected Sessions**:
  - Server validation reads `BERK_PASSWORD` from environment variables using timing-safe SHA-256 hash comparisons.
  - Issues an `httpOnly`, `SameSite=Lax`, secure cookie signed via HMAC-SHA256 (`berk_session`).
  - Next.js Edge `middleware.ts` guards `/world` and `/` so unauthenticated requests are redirected immediately.
  - Working logout action terminates the session and redirects to `/login`.

- **Multiplayer Architecture Ready (Phase 2)**:
  - Strict separation of concerns between world rendering, room definitions, player state, collision detection, and input handling.
  - Local player state is represented as a structured `PlayerState` object, allowing Phase 2 (multiplayer for Sopremish and Grape) to seamlessly plug in remote player states without touching the room renderer or movement engine.

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

4. **Production Build & Verification**:
   ```bash
   npm run build
   npm run start
   ```

---

## Running Tests

Unit tests are powered by **Vitest** and verify password validation, session tokens, movement calculations, collision geometry, sliding resolution, and interaction trigger zones.

```bash
npm test
```

---

## Project Structure

```
berk/
├── .env.example          # Template for environment variables
├── .gitignore            # Excludes .env, build output, and node_modules
├── app/
│   ├── api/auth/
│   │   ├── login/        # Server-side password validation & session issuance
│   │   └── logout/       # Session revocation & cookie deletion
│   ├── login/            # Password login screen
│   ├── world/            # Cozy 2D living room canvas, game loop, HUD & modal
│   ├── globals.css       # Pixel-art canvas styles, modal styling, mobile D-pad
│   ├── layout.tsx        # HTML head, viewport metadata
│   └── page.tsx          # Root redirect handler
├── lib/
│   ├── auth.ts           # Web Crypto HMAC session signing & password validation
│   ├── movement.ts       # Movement helpers and key checking
│   └── world/
│       ├── types.ts      # Player, Room, Collision, and Interaction types
│       ├── pixelSprites.ts # Procedural pixel-art sprite generator and cached atlas
│       ├── roomData.ts   # Living room layout, tile grid, furniture & collisions
│       ├── collision.ts  # AABB collision detection, sliding resolution, proximity
│       └── renderer.ts   # Canvas renderer: floor, walls, Y-sorted depth, lighting
├── middleware.ts         # Edge route protection guard for /world & /
├── tests/
│   ├── auth.test.ts      # Unit tests for auth and session token validation
│   ├── movement.test.ts  # Unit tests for basic movement and clamping
│   └── collision.test.ts # Unit tests for 2D room collision & sliding movement
├── package.json
└── tsconfig.json
```
