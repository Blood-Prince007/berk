import { describe, it, expect } from 'vitest';
import {
  calculateNextPosition,
  clampToBoundaries,
  clamp,
  isMovementKey,
  Position,
  Boundaries,
  MovementKeysState,
} from '@/lib/movement';

describe('Movement & Boundary Clamping', () => {
  const bounds: Boundaries = { width: 800, height: 600 };
  const characterSize = 32;

  const noKeys: MovementKeysState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  it('correctly identifies movement keys', () => {
    expect(isMovementKey('KeyW')).toBe(true);
    expect(isMovementKey('KeyA')).toBe(true);
    expect(isMovementKey('KeyS')).toBe(true);
    expect(isMovementKey('KeyD')).toBe(true);
    expect(isMovementKey('ArrowUp')).toBe(true);
    expect(isMovementKey('ArrowDown')).toBe(true);
    expect(isMovementKey('ArrowLeft')).toBe(true);
    expect(isMovementKey('ArrowRight')).toBe(true);
    expect(isMovementKey('w')).toBe(true);
    expect(isMovementKey('d')).toBe(true);

    expect(isMovementKey('Space')).toBe(false);
    expect(isMovementKey('Enter')).toBe(false);
    expect(isMovementKey('Tab')).toBe(false);
  });

  it('clamps values between min and max', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('stays in place when no movement keys are pressed', () => {
    const start: Position = { x: 100, y: 100 };
    const next = calculateNextPosition(start, noKeys, 10, bounds, characterSize);
    expect(next).toEqual({ x: 100, y: 100 });
  });

  it('moves right and down correctly', () => {
    const start: Position = { x: 100, y: 100 };
    const moveRight = calculateNextPosition(
      start,
      { ...noKeys, right: true },
      10,
      bounds,
      characterSize
    );
    expect(moveRight).toEqual({ x: 110, y: 100 });

    const moveDown = calculateNextPosition(
      start,
      { ...noKeys, down: true },
      15,
      bounds,
      characterSize
    );
    expect(moveDown).toEqual({ x: 100, y: 115 });
  });

  it('moves left and up correctly', () => {
    const start: Position = { x: 100, y: 100 };
    const moveLeft = calculateNextPosition(
      start,
      { ...noKeys, left: true },
      20,
      bounds,
      characterSize
    );
    expect(moveLeft).toEqual({ x: 80, y: 100 });

    const moveUp = calculateNextPosition(
      start,
      { ...noKeys, up: true },
      25,
      bounds,
      characterSize
    );
    expect(moveUp).toEqual({ x: 100, y: 75 });
  });

  it('clamps to left and top edges (cannot go below 0)', () => {
    const start: Position = { x: 5, y: 5 };
    const next = calculateNextPosition(
      start,
      { ...noKeys, left: true, up: true },
      50,
      bounds,
      characterSize
    );
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });

  it('clamps to right and bottom boundaries (cannot exceed width/height minus characterSize)', () => {
    const start: Position = { x: 790, y: 590 };
    const next = calculateNextPosition(
      start,
      { ...noKeys, right: true, down: true },
      50,
      bounds,
      characterSize
    );
    const expectedMaxX = bounds.width - characterSize; // 800 - 32 = 768
    const expectedMaxY = bounds.height - characterSize; // 600 - 32 = 568
    expect(next.x).toBe(expectedMaxX);
    expect(next.y).toBe(expectedMaxY);
  });

  it('clamps existing positions on window resize', () => {
    const current: Position = { x: 750, y: 550 };
    const shrunkBounds: Boundaries = { width: 500, height: 400 };
    const clamped = clampToBoundaries(current, shrunkBounds, characterSize);

    expect(clamped.x).toBe(500 - characterSize); // 468
    expect(clamped.y).toBe(400 - characterSize); // 368
  });
});
