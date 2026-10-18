export interface Position {
  x: number;
  y: number;
}

export interface Boundaries {
  width: number;
  height: number;
}

export interface MovementKeysState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export const MOVEMENT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'a',
  's',
  'd',
  'W',
  'A',
  'S',
  'D',
]);

export function isMovementKey(keyOrCode: string): boolean {
  return MOVEMENT_KEYS.has(keyOrCode);
}

export function clamp(val: number, min: number, max: number): number {
  if (min > max) {
    return min;
  }
  return Math.min(Math.max(val, min), max);
}

/**
 * Calculates the next clamped position for a character within a bounded rectangle.
 */
export function calculateNextPosition(
  current: Position,
  keys: MovementKeysState,
  speed: number,
  bounds: Boundaries,
  characterSize: number
): Position {
  let dx = 0;
  let dy = 0;

  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  // Normalize diagonal movement speed
  if (dx !== 0 && dy !== 0) {
    const invSqrt2 = 0.7071067811865475;
    dx *= invSqrt2;
    dy *= invSqrt2;
  }

  const nextX = current.x + dx * speed;
  const nextY = current.y + dy * speed;

  const maxX = Math.max(0, bounds.width - characterSize);
  const maxY = Math.max(0, bounds.height - characterSize);

  return {
    x: clamp(nextX, 0, maxX),
    y: clamp(nextY, 0, maxY),
  };
}

/**
 * Clamps an existing position to new boundary dimensions (e.g. on window resize).
 */
export function clampToBoundaries(
  pos: Position,
  bounds: Boundaries,
  characterSize: number
): Position {
  const maxX = Math.max(0, bounds.width - characterSize);
  const maxY = Math.max(0, bounds.height - characterSize);
  return {
    x: clamp(pos.x, 0, maxX),
    y: clamp(pos.y, 0, maxY),
  };
}
