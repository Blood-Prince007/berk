import { Position, Rect, RoomDefinition, InteractiveObject } from './types';

export const PLAYER_COLLISION_OFFSET_X = 7;
export const PLAYER_COLLISION_OFFSET_Y = 22;
export const PLAYER_COLLISION_WIDTH = 18;
export const PLAYER_COLLISION_HEIGHT = 12;

/**
 * Returns the physical ground collision box (feet) for a given player coordinate.
 */
export function getPlayerCollisionBox(pos: Position): Rect {
  return {
    x: pos.x + PLAYER_COLLISION_OFFSET_X,
    y: pos.y + PLAYER_COLLISION_OFFSET_Y,
    width: PLAYER_COLLISION_WIDTH,
    height: PLAYER_COLLISION_HEIGHT,
  };
}

/**
 * Checks if two axis-aligned bounding boxes intersect.
 */
export function checkAABBCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Collects all active solid obstacle rectangles in the room.
 */
export function getAllSolidObstacles(room: RoomDefinition): Rect[] {
  const obstacles: Rect[] = [...room.walls];
  for (const item of room.furniture) {
    if (item.solidBox) {
      obstacles.push(item.solidBox);
    }
  }
  return obstacles;
}

/**
 * Checks whether placing the player at `candidatePos` collides with any solid obstacle.
 */
export function isPlayerColliding(
  candidatePos: Position,
  room: RoomDefinition
): boolean {
  const playerBox = getPlayerCollisionBox(candidatePos);
  const obstacles = getAllSolidObstacles(room);

  for (let i = 0; i < obstacles.length; i++) {
    if (checkAABBCollision(playerBox, obstacles[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves movement using independent X and Y axis sliding resolution.
 * If diagonal movement hits a horizontal wall, horizontal sliding continues smoothly.
 */
export function resolveMovementWithSliding(
  currentPos: Position,
  dx: number,
  dy: number,
  room: RoomDefinition
): Position {
  let resolvedX = currentPos.x;
  let resolvedY = currentPos.y;

  // 1. Try moving along X axis
  if (dx !== 0) {
    const candidateXPos = { x: currentPos.x + dx, y: currentPos.y };
    if (!isPlayerColliding(candidateXPos, room)) {
      resolvedX = candidateXPos.x;
    }
  }

  // 2. Try moving along Y axis
  if (dy !== 0) {
    const candidateYPos = { x: resolvedX, y: currentPos.y + dy };
    if (!isPlayerColliding(candidateYPos, room)) {
      resolvedY = candidateYPos.y;
    }
  }

  return { x: resolvedX, y: resolvedY };
}

/**
 * Checks if player is within the trigger area of an interactive object.
 */
export function findNearbyInteractiveObject(
  playerPos: Position,
  room: RoomDefinition
): InteractiveObject | null {
  // Player interaction anchor (center of character)
  const px = playerPos.x + 16;
  const py = playerPos.y + 24;

  for (const obj of room.interactiveObjects) {
    const b = obj.bounds;
    if (px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height) {
      return obj;
    }
  }

  return null;
}
