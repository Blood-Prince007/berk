import { describe, it, expect } from 'vitest';
import {
  HOUSE_ZONES,
  getRoomAtPosition,
  houseDefinition,
  DEFAULT_ROOM_ID,
} from '@/lib/world/roomData';
import { isPlayerColliding, findNearbyInteractiveObject } from '@/lib/world/collision';
import { getSpriteAtlas } from '@/lib/world/pixelSprites';

describe('BERK Unified Multi-Room House System', () => {
  const EXPECTED_ROOM_IDS = [
    'living_room',
    'kitchen',
    'bedroom',
    'balcony',
    'garage',
    'theatre',
    'working_lab',
    'bathroom',
    'store_room',
  ];

  it('defines all 9 rooms in HOUSE_ZONES catalog', () => {
    EXPECTED_ROOM_IDS.forEach((roomId) => {
      const zone = HOUSE_ZONES.find((z) => z.id === roomId);
      expect(zone).toBeDefined();
      expect(zone!.id).toBe(roomId);
      expect(zone!.name.length).toBeGreaterThan(0);
      expect(zone!.bounds.width).toBeGreaterThan(0);
      expect(zone!.bounds.height).toBeGreaterThan(0);
    });
  });

  it('provides a unified house map encompassing all 9 rooms in a contiguous top view', () => {
    expect(houseDefinition.pixelWidth).toBe(2400);
    expect(houseDefinition.pixelHeight).toBe(1600);
    expect(houseDefinition.tileWidth).toBe(75);
    expect(houseDefinition.tileHeight).toBe(50);
  });

  it('correctly maps world coordinates to the corresponding room zone', () => {
    // Living room center
    expect(getRoomAtPosition(1184, 800).id).toBe('living_room');

    // Lab
    expect(getRoomAtPosition(380, 300).id).toBe('working_lab');

    // Theatre
    expect(getRoomAtPosition(1184, 300).id).toBe('theatre');

    // Store room
    expect(getRoomAtPosition(1980, 300).id).toBe('store_room');

    // Bedroom
    expect(getRoomAtPosition(400, 780).id).toBe('bedroom');

    // Kitchen
    expect(getRoomAtPosition(1980, 780).id).toBe('kitchen');

    // Bathroom
    expect(getRoomAtPosition(320, 1300).id).toBe('bathroom');

    // Garage
    expect(getRoomAtPosition(990, 1320).id).toBe('garage');

    // Balcony
    expect(getRoomAtPosition(1870, 1300).id).toBe('balcony');
  });

  it('ensures every room spawn point is inside bounds and free of collision', () => {
    HOUSE_ZONES.forEach((zone) => {
      const { spawnPoint } = zone;
      expect(spawnPoint.x).toBeGreaterThan(zone.bounds.x);
      expect(spawnPoint.x).toBeLessThan(zone.bounds.x + zone.bounds.width);
      expect(spawnPoint.y).toBeGreaterThan(zone.bounds.y);
      expect(spawnPoint.y).toBeLessThan(zone.bounds.y + zone.bounds.height);

      const collides = isPlayerColliding(spawnPoint, houseDefinition);
      expect(collides).toBe(false);
    });
  });

  it('allows seamless walking through open doorway cutouts between connected rooms', () => {
    // Doorway opening between Living Room and Kitchen at X: 1584, Y: 790
    const doorPos = { x: 1584, y: 780 };
    expect(isPlayerColliding(doorPos, houseDefinition)).toBe(false);

    // Doorway opening between Living Room and Bedroom at X: 784, Y: 790
    const bedDoorPos = { x: 784, y: 780 };
    expect(isPlayerColliding(bedDoorPos, houseDefinition)).toBe(false);

    // Doorway opening between Living Room and Lab at X: 910, Y: 528
    const labDoorPos = { x: 910, y: 520 };
    expect(isPlayerColliding(labDoorPos, houseDefinition)).toBe(false);
  });

  it('verifies SOPREMISH\'S WORKING LAB has designated workstations, electronics, and equipment', () => {
    const interactiveIds = houseDefinition.interactiveObjects.map((obj) => obj.id);
    expect(interactiveIds).toContain('interact_battlestation');
    expect(interactiveIds).toContain('interact_electronics');
    expect(interactiveIds).toContain('interact_printer');
    expect(interactiveIds).toContain('interact_server');
    expect(interactiveIds).toContain('interact_tech_books');
  });

  it('verifies Theatre cinema screen and living room TV interactables are present', () => {
    const interactiveIds = houseDefinition.interactiveObjects.map((obj) => obj.id);
    expect(interactiveIds).toContain('interact_theatre_screen');
    expect(interactiveIds).toContain('interact_tv');
  });

  it('detects interactive objects when player approaches them', () => {
    // Near TV: { x: 1120, y: 570, width: 130, height: 60 }
    const nearTv = { x: 1160, y: 575 };
    const interaction = findNearbyInteractiveObject(nearTv, houseDefinition);
    expect(interaction).not.toBeNull();
    expect(interaction?.id).toBe('interact_tv');
  });

  it('loads the procedural sprite atlas with all house floors and furniture', () => {
    const atlas = getSpriteAtlas();
    expect(atlas).toBeDefined();

    // Verify house floor textures exist in atlas dictionary
    expect(atlas.floor_wood).toBeDefined();
    expect((atlas as any).floor_kitchen).toBeDefined();
    expect((atlas as any).floor_bathroom).toBeDefined();
    expect((atlas as any).floor_theatre).toBeDefined();
    expect((atlas as any).floor_lab).toBeDefined();
    expect((atlas as any).floor_garage).toBeDefined();
    expect((atlas as any).floor_balcony).toBeDefined();

    // Verify key room furniture exists in atlas dictionary
    expect((atlas as any).fridge_double).toBeDefined();
    expect((atlas as any).bed_double).toBeDefined();
    expect((atlas as any).parked_car).toBeDefined();
    expect((atlas as any).theatre_screen).toBeDefined();
    expect((atlas as any).lab_battlestation).toBeDefined();
    expect((atlas as any).shower_glass).toBeDefined();
    expect((atlas as any).storage_shelves_wood).toBeDefined();
  });
});
