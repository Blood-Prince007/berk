'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Position,
  Boundaries,
  MovementKeysState,
  calculateNextPosition,
  clampToBoundaries,
  isMovementKey,
} from '@/lib/movement';

const CHARACTER_SIZE = 32; // 32x32px square
const SPEED_PIXELS_PER_SEC = 360;

export default function WorldPage() {
  const [pos, setPos] = useState<Position>({ x: 100, y: 100 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Mutable refs for animation loop
  const posRef = useRef<Position>({ x: 100, y: 100 });
  const boundsRef = useRef<Boundaries>({ width: 800, height: 600 });
  const keysDownRef = useRef<Set<string>>(new Set());
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Initialize position and bounds on mount
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    boundsRef.current = { width, height };

    const initialPos = {
      x: Math.max(0, Math.floor(width / 2 - CHARACTER_SIZE / 2)),
      y: Math.max(0, Math.floor(height / 2 - CHARACTER_SIZE / 2)),
    };
    posRef.current = initialPos;
    setPos(initialPos);
    setIsInitialized(true);

    // Handle window resize
    const handleResize = () => {
      const newBounds = { width: window.innerWidth, height: window.innerHeight };
      boundsRef.current = newBounds;
      const clamped = clampToBoundaries(posRef.current, newBounds, CHARACTER_SIZE);
      posRef.current = clamped;
      setPos(clamped);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Keyboard listeners with scroll prevention for movement keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMovementKey(e.code) || isMovementKey(e.key)) {
        // Prevent default browser scrolling behavior
        e.preventDefault();
        keysDownRef.current.add(e.code);
        keysDownRef.current.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isMovementKey(e.code) || isMovementKey(e.key)) {
        keysDownRef.current.delete(e.code);
        keysDownRef.current.delete(e.key.toLowerCase());
      }
    };

    // Clear active keys if window loses focus
    const handleBlur = () => {
      keysDownRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Game loop using requestAnimationFrame and delta-time
  useEffect(() => {
    if (!isInitialized) return;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = Math.min((now - lastTimeRef.current) / 1000, 0.1);

        const keys = keysDownRef.current;
        const keyState: MovementKeysState = {
          up: keys.has('KeyW') || keys.has('ArrowUp') || keys.has('w'),
          down: keys.has('KeyS') || keys.has('ArrowDown') || keys.has('s'),
          left: keys.has('KeyA') || keys.has('ArrowLeft') || keys.has('a'),
          right: keys.has('KeyD') || keys.has('ArrowRight') || keys.has('d'),
        };

        if (keyState.up || keyState.down || keyState.left || keyState.right) {
          const moveStep = SPEED_PIXELS_PER_SEC * deltaSeconds;
          const next = calculateNextPosition(
            posRef.current,
            keyState,
            moveStep,
            boundsRef.current,
            CHARACTER_SIZE
          );

          posRef.current = next;
          setPos(next);
        }
      }

      lastTimeRef.current = now;
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isInitialized]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue redirect even if network glitch occurs
    }
    window.location.href = '/login';
  };

  return (
    <main className="world-container" id="berk-world">
      {/* Top HUD */}
      <header className="world-hud">
        <div className="world-hud-left">
          <span className="hud-pill hud-title">BERK</span>
          <span className="hud-pill">
            X: {Math.round(pos.x)} | Y: {Math.round(pos.y)}
          </span>
        </div>

        <button
          type="button"
          id="logout-button"
          className="logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Logout"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      {/* Movement hint */}
      <footer className="controls-hint" aria-hidden="true">
        Use <span className="key-badge">W</span> <span className="key-badge">A</span>{' '}
        <span className="key-badge">S</span> <span className="key-badge">D</span> or{' '}
        <span className="key-badge">Arrow Keys</span> to move
      </footer>

      {/* Single character in space */}
      <div
        id="berk-character"
        className="world-character"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          width: `${CHARACTER_SIZE}px`,
          height: `${CHARACTER_SIZE}px`,
        }}
        role="img"
        aria-label="Player character"
      >
        <div className="world-character-core" />
      </div>
    </main>
  );
}
