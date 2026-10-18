import { describe, it, expect } from 'vitest';
import {
  checkAABBCollision,
  getPlayerCollisionBox,
  isPlayerColliding,
  resolveMovementWithSliding,
  findNearbyInteractiveObject,
} from '@/lib/world/collision';
import { livingRoomDefinition } from '@/lib/world/roomData';
import { Rect } from '@/lib/world/types';

describe('2D World Collision & Interaction System', () => {
  it('correctly detects AABB intersection between bounding boxes', () => {
    const boxA: Rect = { x: 10, y: 10, width: 20, height: 20 };
    const boxB: Rect = { x: 25, y: 25, width: 20, height: 20 };
    const boxC: Rect = { x: 100, y: 100, width: 20, height: 20 };

    expect(checkAABBCollision(boxA, boxB)).toBe(true);
    expect(checkAABBCollision(boxA, boxC)).toBe(false);
  });

  it('calculates player ground collision box with correct offsets and dimensions', () => {
    const playerPos = { x: 100, y: 200 };
    const box = getPlayerCollisionBox(playerPos);

    expect(box.x).toBe(107); // 100 + 7
    expect(box.y).toBe(222); // 200 + 22
    expect(box.width).toBe(18);
    expect(box.height).toBe(12);
  });

  it('allows player at valid spawn point without collision', () => {
    const spawnPos = livingRoomDefinition.playerSpawn;
    expect(isPlayerColliding(spawnPos, livingRoomDefinition)).toBe(false);
  });

  it('detects collision when player walks into north wall', () => {
    // North wall has height 90
    const wallPos = { x: 200, y: 40 }; // Foot Y = 62, inside wall
    expect(isPlayerColliding(wallPos, livingRoomDefinition)).toBe(true);
  });

  it('detects collision when player walks into living room sofa', () => {
    // Sofa solid box is { x: 304, y: 172, width: 96, height: 34 }
    // Footprint: x+7, y+22. If player is at x: 320, y: 160 -> foot is at (327, 182), inside sofa
    const intoSofaPos = { x: 320, y: 160 };
    expect(isPlayerColliding(intoSofaPos, livingRoomDefinition)).toBe(true);
  });

  it('resolves diagonal movement with sliding along horizontal obstacles', () => {
    // Player is below north wall, e.g. at y = 72 (foot at 94, clear).
    // Moving UP (dy = -5) would penetrate wall (foot at 89 <= 90), but moving RIGHT (dx = 5) is clear.
    const startPos = { x: 200, y: 72 };
    const nextPos = resolveMovementWithSliding(startPos, 5, -5, livingRoomDefinition);

    // X should have moved to 205
    expect(nextPos.x).toBe(205);
    // Y should have remained 72 (sliding prevented vertical wall penetration)
    expect(nextPos.y).toBe(72);
  });

  it('detects interactive objects within proximity trigger zones', () => {
    // Near TV: { x: 230, y: 65, width: 128, height: 60 }
    // Player at x: 260, y: 60 -> center is at (276, 84), inside TV bounds
    const nearTvPos = { x: 260, y: 60 };
    const interaction = findNearbyInteractiveObject(nearTvPos, livingRoomDefinition);

    expect(interaction).not.toBeNull();
    expect(interaction?.id).toBe('interact_tv');
    expect(interaction?.title).toBe('Vintage Television');
  });

  it('returns null when player is far away from interactive objects in open floor', () => {
    // Open walking area at center floor
    const openPos = { x: 200, y: 320 };
    const interaction = findNearbyInteractiveObject(openPos, livingRoomDefinition);

    expect(interaction).toBeNull();
  });
});
