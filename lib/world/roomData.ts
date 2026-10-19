import { RoomDefinition, Rect, RoomObject, InteractiveObject } from './types';

export const DEFAULT_ROOM_ID = 'living_room';

export interface HouseZone {
  id: string;
  name: string;
  icon: string;
  theme: string;
  floorSpriteKey: string;
  wallTheme: string;
  bounds: Rect;
  spawnPoint: { x: number; y: number };
  description: string;
}

// ============================================================================
// 9 CONTIGUOUS ROOM ZONES IN A SINGLE UNIFIED HOUSE MAP
// Total House Map: 2400 x 1600 px (75 x 50 tiles at 32px)
// ============================================================================
export const HOUSE_ZONES: HouseZone[] = [
  // 1. SOPREMISH'S WORKING LAB (Top-Left)
  {
    id: 'working_lab',
    name: "SOPREMISH'S WORKING LAB",
    icon: '🔬',
    theme: 'working_lab',
    floorSpriteKey: 'floor_lab',
    wallTheme: 'lab',
    bounds: { x: 32, y: 32, width: 736, height: 480 },
    spawnPoint: { x: 380, y: 300 },
    description:
      'High-tech research lab with primary command battlestation, oscilloscope & soldering bench, 3D printer, and server rack.',
  },
  // 2. THEATRE (Top-Center)
  {
    id: 'theatre',
    name: 'Private Cinema & Theatre',
    icon: '🎬',
    theme: 'theatre',
    floorSpriteKey: 'floor_theatre',
    wallTheme: 'theatre',
    bounds: { x: 800, y: 32, width: 768, height: 480 },
    spawnPoint: { x: 1184, y: 320 },
    description:
      '4K cinema projection screen with plush tiered recliner seating and vintage popcorn maker.',
  },
  // 3. STORE ROOM (Top-Right)
  {
    id: 'store_room',
    name: 'Store Room',
    icon: '📦',
    theme: 'store_room',
    floorSpriteKey: 'floor_kitchen',
    wallTheme: 'garage',
    bounds: { x: 1600, y: 32, width: 768, height: 480 },
    spawnPoint: { x: 1980, y: 300 },
    description:
      'Pantry and supplies store room with wooden shelving, crates, boxes, and vintage storage trunk.',
  },
  // 4. MASTER BEDROOM (Middle-Left)
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    icon: '🛏️',
    theme: 'bedroom',
    floorSpriteKey: 'floor_wood',
    wallTheme: 'bedroom',
    bounds: { x: 32, y: 544, width: 736, height: 480 },
    spawnPoint: { x: 400, y: 780 },
    description:
      'Cozy bedroom with king-size bed, nightstands, wardrobe, vanity desk, and full-length mirror.',
  },
  // 5. LIVING ROOM (Middle-Center — THE CENTRAL SHARED HUB)
  {
    id: 'living_room',
    name: 'Living Room',
    icon: '🛋️',
    theme: 'living_room',
    floorSpriteKey: 'floor_wood',
    wallTheme: 'living_room',
    bounds: { x: 800, y: 544, width: 768, height: 480 },
    spawnPoint: { x: 1184, y: 800 },
    description:
      'Central living room gathering space with retro TV console, cozy sofa, coffee table, plant, and sleeping cat.',
  },
  // 6. KITCHEN & DINING (Middle-Right)
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    icon: '🍳',
    theme: 'kitchen',
    floorSpriteKey: 'floor_kitchen',
    wallTheme: 'kitchen',
    bounds: { x: 1600, y: 544, width: 768, height: 480 },
    spawnPoint: { x: 1980, y: 780 },
    description:
      'Culinary kitchen with double-door stainless fridge, sink counter, ceramic stove, and dining table set.',
  },
  // 7. LUXURY BATHROOM (Bottom-Left)
  {
    id: 'bathroom',
    name: 'Luxury Bathroom',
    icon: '🛁',
    theme: 'bathroom',
    floorSpriteKey: 'floor_bathroom',
    wallTheme: 'bathroom',
    bounds: { x: 32, y: 1056, width: 576, height: 480 },
    spawnPoint: { x: 320, y: 1300 },
    description:
      'Tiled luxury bathroom with frameless glass shower, marble vanity sink, modern toilet, and towel rack.',
  },
  // 8. WORKSHOP & GARAGE (Bottom-Center)
  {
    id: 'garage',
    name: 'Workshop & Garage',
    icon: '🚗',
    theme: 'garage',
    floorSpriteKey: 'floor_garage',
    wallTheme: 'garage',
    bounds: { x: 640, y: 1056, width: 704, height: 480 },
    spawnPoint: { x: 990, y: 1320 },
    description:
      'Workshop and garage with parked cherry red sports coupe, mechanic workbench, and tool cabinets.',
  },
  // 9. GARDEN BALCONY (Bottom-Right)
  {
    id: 'balcony',
    name: 'Garden Balcony',
    icon: '🌿',
    theme: 'balcony',
    floorSpriteKey: 'floor_balcony',
    wallTheme: 'balcony',
    bounds: { x: 1376, y: 1056, width: 992, height: 480 },
    spawnPoint: { x: 1870, y: 1300 },
    description:
      'Outdoor terrace with terracotta tiles, wrought-iron safety railings, lemon tree, and panoramic mountain vista.',
  },
];

// Helper to determine which room zone a coordinate belongs to
export function getRoomAtPosition(x: number, y: number): HouseZone {
  for (const zone of HOUSE_ZONES) {
    if (
      x >= zone.bounds.x &&
      x < zone.bounds.x + zone.bounds.width &&
      y >= zone.bounds.y &&
      y < zone.bounds.y + zone.bounds.height
    ) {
      return zone;
    }
  }
  return HOUSE_ZONES[4]; // Default to Living Room
}

// ============================================================================
// WALLS (Exterior Perimeter & Interior Partitions with Open Walkways)
// ============================================================================
const houseWalls: Rect[] = [
  // --- Outer Perimeter Walls ---
  // North Outer Wall (Full width, height 64)
  { x: 0, y: 0, width: 2400, height: 64 },

  // West Outer Wall (Full height, width 32)
  { x: 0, y: 0, width: 32, height: 1600 },

  // East Outer Wall (Top and middle, width 32)
  { x: 2368, y: 0, width: 32, height: 1056 },

  // South Outer Wall (Left: Bathroom & Garage, Y: 1536..1600)
  { x: 0, y: 1536, width: 1376, height: 64 },

  // --- Interior Horizontal Partition 1 (Between Top Row & Middle Row, Y: 512..544) ---
  // Cutouts at X: 860..960 (Lab <-> Living) and X: 1400..1500 (Theatre <-> Living) and X: 1920..2020 (Store <-> Kitchen)
  { x: 32, y: 512, width: 828, height: 32 },
  { x: 960, y: 512, width: 440, height: 32 },
  { x: 1500, y: 512, width: 420, height: 32 },
  { x: 2020, y: 512, width: 348, height: 32 },

  // --- Interior Horizontal Partition 2 (Between Middle Row & Bottom Row, Y: 1024..1056) ---
  // Cutouts at X: 240..340 (Bedroom <-> Bath), X: 740..840 (Hall <-> Garage),
  // X: 1380..1520 (Living <-> Balcony French Doors), X: 1920..2020 (Kitchen <-> Balcony)
  { x: 32, y: 1024, width: 208, height: 32 },
  { x: 340, y: 1024, width: 400, height: 32 },
  { x: 840, y: 1024, width: 540, height: 32 },
  { x: 1520, y: 1024, width: 400, height: 32 },
  { x: 2020, y: 1024, width: 348, height: 32 },

  // --- Interior Vertical Partition 1 (Between Left Column & Center Column, X: 768..800) ---
  // Top (Lab <-> Theatre): Solid dividing wall
  { x: 768, y: 64, width: 32, height: 448 },
  // Middle (Bedroom <-> Living Room): Cutout at Y: 740..840 (Open Archway!)
  { x: 768, y: 544, width: 32, height: 196 },
  { x: 768, y: 840, width: 32, height: 184 },

  // --- Interior Vertical Partition 2 (Between Center Column & Right Column, X: 1568..1600) ---
  // Top (Theatre <-> Store Room): Solid dividing wall
  { x: 1568, y: 64, width: 32, height: 448 },
  // Middle (Living Room <-> Kitchen): Cutout at Y: 740..840 (Open Archway!)
  { x: 1568, y: 544, width: 32, height: 196 },
  { x: 1568, y: 840, width: 32, height: 184 },

  // --- Bottom Row Partition (Between Bathroom & Garage, X: 608..640) ---
  { x: 608, y: 1056, width: 32, height: 480 },

  // --- Bottom Row Partition (Between Garage & Balcony, X: 1344..1376) ---
  { x: 1344, y: 1056, width: 32, height: 480 },

  // --- Balcony Perimeter Safety Railings (Physical Collision boundaries) ---
  // Southern Balcony Railing: Y: 1524..1536, X: 1376..2368
  { x: 1376, y: 1524, width: 992, height: 20 },
  // Eastern Balcony Railing: X: 2360..2372, Y: 1056..1536
  { x: 2360, y: 1056, width: 20, height: 480 },
];

// ============================================================================
// ALL FURNITURE ACROSS ALL 9 ROOMS
// ============================================================================
const houseFurniture: RoomObject[] = [
  // --------------------------------------------------------------------------
  // 1. SOPREMISH'S WORKING LAB (Top-Left: X: 32..768, Y: 32..512)
  // --------------------------------------------------------------------------
  {
    id: 'lab_battlestation',
    spriteKey: 'lab_battlestation',
    x: 320,
    y: 74,
    width: 156,
    height: 70,
    depthY: 144,
    solidBox: { x: 324, y: 108, width: 148, height: 34 },
  },
  {
    id: 'electronics_bench',
    spriteKey: 'electronics_bench',
    x: 90,
    y: 76,
    width: 82,
    height: 54,
    depthY: 130,
    solidBox: { x: 92, y: 104, width: 78, height: 26 },
  },
  {
    id: 'printer_3d',
    spriteKey: 'printer_3d',
    x: 190,
    y: 80,
    width: 40,
    height: 48,
    depthY: 128,
    solidBox: { x: 192, y: 104, width: 36, height: 22 },
  },
  {
    id: 'server_rack',
    spriteKey: 'server_rack',
    x: 680,
    y: 66,
    width: 44,
    height: 86,
    depthY: 152,
    solidBox: { x: 682, y: 116, width: 40, height: 34 },
  },
  {
    id: 'tech_bookshelf',
    spriteKey: 'tech_bookshelf',
    x: 580,
    y: 70,
    width: 60,
    height: 80,
    depthY: 150,
    solidBox: { x: 582, y: 118, width: 56, height: 30 },
  },

  // --------------------------------------------------------------------------
  // 2. THEATRE (Top-Center: X: 800..1568, Y: 32..512)
  // --------------------------------------------------------------------------
  {
    id: 'theatre_screen',
    spriteKey: 'theatre_screen',
    x: 1110,
    y: 60,
    width: 148,
    height: 80,
    depthY: 140,
    solidBox: { x: 1114, y: 108, width: 140, height: 28 },
  },
  {
    id: 'theatre_seats_row1',
    spriteKey: 'theatre_seats_row',
    x: 1134,
    y: 220,
    width: 100,
    height: 44,
    depthY: 262,
    solidBox: { x: 1138, y: 234, width: 92, height: 26 },
  },
  {
    id: 'theatre_seats_row2',
    spriteKey: 'theatre_seats_row',
    x: 1134,
    y: 300,
    width: 100,
    height: 44,
    depthY: 342,
    solidBox: { x: 1138, y: 314, width: 92, height: 26 },
  },
  {
    id: 'popcorn_machine',
    spriteKey: 'popcorn_machine',
    x: 860,
    y: 84,
    width: 36,
    height: 54,
    depthY: 138,
    solidBox: { x: 862, y: 114, width: 32, height: 22 },
  },

  // --------------------------------------------------------------------------
  // 3. STORE ROOM (Top-Right: X: 1600..2368, Y: 32..512)
  // --------------------------------------------------------------------------
  {
    id: 'storage_shelves_wood',
    spriteKey: 'storage_shelves_wood',
    x: 1680,
    y: 68,
    width: 60,
    height: 84,
    depthY: 152,
    solidBox: { x: 1682, y: 118, width: 56, height: 32 },
  },
  {
    id: 'cardboard_boxes_pile',
    spriteKey: 'cardboard_boxes_pile',
    x: 2200,
    y: 80,
    width: 50,
    height: 46,
    depthY: 126,
    solidBox: { x: 2202, y: 102, width: 46, height: 22 },
  },
  {
    id: 'vintage_trunk',
    spriteKey: 'vintage_trunk',
    x: 1900,
    y: 82,
    width: 44,
    height: 34,
    depthY: 116,
    solidBox: { x: 1902, y: 96, width: 40, height: 18 },
  },
  {
    id: 'utility_cleaning',
    spriteKey: 'utility_cleaning',
    x: 2280,
    y: 86,
    width: 28,
    height: 48,
    depthY: 134,
    solidBox: { x: 2282, y: 114, width: 24, height: 18 },
  },

  // --------------------------------------------------------------------------
  // 4. MASTER BEDROOM (Middle-Left: X: 32..768, Y: 544..1024)
  // --------------------------------------------------------------------------
  {
    id: 'bed_double',
    spriteKey: 'bed_double',
    x: 340,
    y: 578,
    width: 70,
    height: 78,
    depthY: 654,
    solidBox: { x: 344, y: 590, width: 62, height: 60 },
  },
  {
    id: 'nightstand_left',
    spriteKey: 'nightstand',
    x: 298,
    y: 590,
    width: 32,
    height: 40,
    depthY: 630,
    solidBox: { x: 300, y: 608, width: 28, height: 20 },
  },
  {
    id: 'nightstand_right',
    spriteKey: 'nightstand',
    x: 420,
    y: 590,
    width: 32,
    height: 40,
    depthY: 630,
    solidBox: { x: 422, y: 608, width: 28, height: 20 },
  },
  {
    id: 'wardrobe_large',
    spriteKey: 'wardrobe_large',
    x: 92,
    y: 574,
    width: 58,
    height: 84,
    depthY: 658,
    solidBox: { x: 94, y: 626, width: 54, height: 30 },
  },
  {
    id: 'bedroom_mirror',
    spriteKey: 'bedroom_mirror',
    x: 168,
    y: 580,
    width: 28,
    height: 64,
    depthY: 644,
    solidBox: { x: 170, y: 626, width: 24, height: 16 },
  },
  {
    id: 'vanity_desk',
    spriteKey: 'vanity_desk',
    x: 580,
    y: 588,
    width: 60,
    height: 62,
    depthY: 650,
    solidBox: { x: 582, y: 624, width: 56, height: 24 },
  },

  // --------------------------------------------------------------------------
  // 5. LIVING ROOM (Middle-Center: X: 800..1568, Y: 544..1024)
  // --------------------------------------------------------------------------
  {
    id: 'tv_console',
    spriteKey: 'tv_console',
    x: 1140,
    y: 576,
    width: 90,
    height: 42,
    depthY: 618,
    solidBox: { x: 1142, y: 586, width: 86, height: 28 },
  },
  {
    id: 'sofa',
    spriteKey: 'sofa',
    x: 1130,
    y: 720,
    width: 110,
    height: 48,
    depthY: 768,
    solidBox: { x: 1134, y: 732, width: 102, height: 32 },
  },
  {
    id: 'rug',
    spriteKey: 'rug',
    x: 1084,
    y: 730,
    width: 200,
    height: 100,
    depthY: 576, // Flat ground
  },
  {
    id: 'coffee_table',
    spriteKey: 'coffee_table',
    x: 1146,
    y: 778,
    width: 72,
    height: 38,
    depthY: 814,
    solidBox: { x: 1148, y: 786, width: 68, height: 26 },
  },
  {
    id: 'bookshelf',
    spriteKey: 'bookshelf',
    x: 840,
    y: 574,
    width: 64,
    height: 80,
    depthY: 654,
    solidBox: { x: 842, y: 622, width: 60, height: 30 },
  },
  {
    id: 'window_view',
    spriteKey: 'window_view',
    x: 940,
    y: 568,
    width: 64,
    height: 60,
    depthY: 628,
  },
  {
    id: 'standing_lamp',
    spriteKey: 'standing_lamp',
    x: 1480,
    y: 578,
    width: 24,
    height: 60,
    depthY: 638,
    solidBox: { x: 1484, y: 624, width: 16, height: 12 },
  },
  {
    id: 'plant_large',
    spriteKey: 'plant_large',
    x: 1516,
    y: 630,
    width: 34,
    height: 46,
    depthY: 676,
    solidBox: { x: 1520, y: 656, width: 26, height: 18 },
  },
  {
    id: 'sleeping_cat',
    spriteKey: 'sleeping_cat',
    x: 980,
    y: 790,
    width: 30,
    height: 22,
    depthY: 810,
    solidBox: { x: 982, y: 796, width: 26, height: 14 },
  },
  {
    id: 'wall_clock',
    spriteKey: 'wall_clock',
    x: 1330,
    y: 570,
    width: 24,
    height: 24,
    depthY: 594,
  },
  {
    id: 'framed_art',
    spriteKey: 'framed_art',
    x: 1380,
    y: 568,
    width: 36,
    height: 26,
    depthY: 594,
  },

  // --------------------------------------------------------------------------
  // 6. KITCHEN & DINING (Middle-Right: X: 1600..2368, Y: 544..1024)
  // --------------------------------------------------------------------------
  {
    id: 'fridge_double',
    spriteKey: 'fridge_double',
    x: 1648,
    y: 574,
    width: 44,
    height: 76,
    depthY: 650,
    solidBox: { x: 1650, y: 620, width: 40, height: 26 },
  },
  {
    id: 'kitchen_counter_sink',
    spriteKey: 'kitchen_counter_sink',
    x: 1704,
    y: 596,
    width: 68,
    height: 52,
    depthY: 648,
    solidBox: { x: 1706, y: 620, width: 64, height: 26 },
  },
  {
    id: 'kitchen_stove_oven',
    spriteKey: 'kitchen_stove_oven',
    x: 1782,
    y: 588,
    width: 50,
    height: 62,
    depthY: 650,
    solidBox: { x: 1784, y: 620, width: 46, height: 28 },
  },
  {
    id: 'kitchen_shelf',
    spriteKey: 'kitchen_shelf',
    x: 1844,
    y: 578,
    width: 56,
    height: 32,
    depthY: 610,
  },
  {
    id: 'dining_table_set',
    spriteKey: 'dining_table_set',
    x: 2050,
    y: 720,
    width: 96,
    height: 68,
    depthY: 788,
    solidBox: { x: 2054, y: 742, width: 88, height: 42 },
  },

  // --------------------------------------------------------------------------
  // 7. LUXURY BATHROOM (Bottom-Left: X: 32..608, Y: 1056..1536)
  // --------------------------------------------------------------------------
  {
    id: 'shower_glass',
    spriteKey: 'shower_glass',
    x: 70,
    y: 1092,
    width: 56,
    height: 80,
    depthY: 1172,
    solidBox: { x: 72, y: 1140, width: 52, height: 30 },
  },
  {
    id: 'bathroom_vanity',
    spriteKey: 'bathroom_vanity',
    x: 160,
    y: 1100,
    width: 54,
    height: 68,
    depthY: 1168,
    solidBox: { x: 162, y: 1138, width: 50, height: 28 },
  },
  {
    id: 'toilet_modern',
    spriteKey: 'toilet_modern',
    x: 360,
    y: 1100,
    width: 32,
    height: 52,
    depthY: 1152,
    solidBox: { x: 364, y: 1124, width: 24, height: 26 },
  },
  {
    id: 'towel_rack',
    spriteKey: 'towel_rack',
    x: 420,
    y: 1090,
    width: 34,
    height: 38,
    depthY: 1128,
  },

  // --------------------------------------------------------------------------
  // 8. WORKSHOP & GARAGE (Bottom-Center: X: 640..1344, Y: 1056..1536)
  // --------------------------------------------------------------------------
  {
    id: 'parked_car',
    spriteKey: 'parked_car',
    x: 910,
    y: 1210,
    width: 140,
    height: 72,
    depthY: 1282,
    solidBox: { x: 914, y: 1228, width: 132, height: 50 },
  },
  {
    id: 'garage_workbench',
    spriteKey: 'garage_workbench',
    x: 690,
    y: 1100,
    width: 86,
    height: 50,
    depthY: 1150,
    solidBox: { x: 692, y: 1124, width: 82, height: 24 },
  },
  {
    id: 'tool_chest',
    spriteKey: 'tool_chest',
    x: 786,
    y: 1100,
    width: 38,
    height: 50,
    depthY: 1150,
    solidBox: { x: 788, y: 1124, width: 34, height: 24 },
  },
  {
    id: 'metal_shelf',
    spriteKey: 'metal_shelf',
    x: 1240,
    y: 1096,
    width: 52,
    height: 74,
    depthY: 1170,
    solidBox: { x: 1242, y: 1140, width: 48, height: 28 },
  },
  {
    id: 'wall_bicycle',
    spriteKey: 'wall_bicycle',
    x: 1140,
    y: 1090,
    width: 58,
    height: 36,
    depthY: 1126,
  },

  // --------------------------------------------------------------------------
  // 9. GARDEN BALCONY (Bottom-Right: X: 1376..2368, Y: 1056..1536)
  // --------------------------------------------------------------------------
  {
    id: 'lemon_tree_pot',
    spriteKey: 'lemon_tree_pot',
    x: 1410,
    y: 1096,
    width: 38,
    height: 54,
    depthY: 1150,
    solidBox: { x: 1414, y: 1126, width: 30, height: 22 },
  },
  {
    id: 'patio_table',
    spriteKey: 'patio_table',
    x: 1720,
    y: 1220,
    width: 52,
    height: 48,
    depthY: 1268,
    solidBox: { x: 1724, y: 1238, width: 44, height: 28 },
  },
  {
    id: 'patio_chair_left',
    spriteKey: 'patio_chair',
    x: 1676,
    y: 1226,
    width: 32,
    height: 36,
    depthY: 1262,
    solidBox: { x: 1680, y: 1238, width: 24, height: 20 },
  },
  {
    id: 'patio_chair_right',
    spriteKey: 'patio_chair',
    x: 1782,
    y: 1226,
    width: 32,
    height: 36,
    depthY: 1262,
    solidBox: { x: 1786, y: 1238, width: 24, height: 20 },
  },
  {
    id: 'planter_box_1',
    spriteKey: 'planter_box',
    x: 1560,
    y: 1096,
    width: 48,
    height: 32,
    depthY: 1128,
    solidBox: { x: 1562, y: 1114, width: 44, height: 12 },
  },
  {
    id: 'planter_box_2',
    spriteKey: 'planter_box',
    x: 2180,
    y: 1096,
    width: 48,
    height: 32,
    depthY: 1128,
    solidBox: { x: 2182, y: 1114, width: 44, height: 12 },
  },
  {
    id: 'balcony_railing_sprite',
    spriteKey: 'balcony_railing',
    x: 1800,
    y: 1512,
    width: 120,
    height: 28,
    depthY: 1540,
  },
];

// ============================================================================
// ALL INTERACTIVE OBJECTS ACROSS ALL 9 ROOMS
// ============================================================================
const houseInteractive: InteractiveObject[] = [
  // Living Room
  {
    id: 'interact_tv',
    name: 'Vintage Television',
    bounds: { x: 1120, y: 570, width: 130, height: 60 },
    promptPosition: { x: 1184, y: 560 },
    title: 'Vintage Television Console',
    description:
      'Connected directly to BERK\'s live watch-together system. Start a screen broadcast or sit back and enjoy together.',
    actionText: 'Watch Broadcast',
  },
  {
    id: 'interact_bookshelf',
    name: 'Living Room Bookshelf',
    bounds: { x: 830, y: 570, width: 84, height: 60 },
    promptPosition: { x: 872, y: 560 },
    title: 'Curated Bookshelf',
    description:
      'Loaded with architecture folios, sci-fi novels, and retro gaming magazines.',
    actionText: 'Browse books',
  },
  {
    id: 'interact_cat',
    name: 'Sleeping Cat',
    bounds: { x: 970, y: 780, width: 50, height: 40 },
    promptPosition: { x: 995, y: 775 },
    title: 'Tuxedo Cat',
    description:
      'Purring gently in a tight ball on the warm floor. Completely at peace.',
    actionText: 'Pet cat',
  },

  // Theatre
  {
    id: 'interact_theatre_screen',
    name: 'Cinema Screen',
    bounds: { x: 1090, y: 60, width: 188, height: 60 },
    promptPosition: { x: 1184, y: 50 },
    title: '4K Cinema Projection Screen',
    description:
      'Connected directly to BERK\'s live watch-together system. Start a screen broadcast or enjoy high-res films together.',
    actionText: 'Watch Cinema Screen',
  },
  {
    id: 'interact_theatre_popcorn',
    name: 'Vintage Popcorn Maker',
    bounds: { x: 850, y: 80, width: 56, height: 50 },
    promptPosition: { x: 878, y: 70 },
    title: 'Theatre Popcorn Cart',
    description:
      'Warm buttered popcorn popping continuously under the golden heat lamp.',
    actionText: 'Grab popcorn',
  },

  // Sopremish's Lab
  {
    id: 'interact_battlestation',
    name: "SOPREMISH'S WORKSTATION",
    bounds: { x: 300, y: 70, width: 196, height: 60 },
    promptPosition: { x: 398, y: 60 },
    title: "SOPREMISH'S PRIMARY COMMAND BATTLESTATION",
    description:
      'Triple curved 4K displays glowing with modern Next.js TypeScript code, active terminal sessions, and telemetry graphs. Backlit cyan mechanical keyboard clacking softly.',
    actionText: 'Commit code',
  },
  {
    id: 'interact_electronics',
    name: 'Oscilloscope & Soldering Station',
    bounds: { x: 80, y: 70, width: 102, height: 50 },
    promptPosition: { x: 131, y: 64 },
    title: 'Hardware Electronics Station',
    description:
      'Digital storage oscilloscope tracking high-speed signals. Solder iron idling at 380°C beside circuit boards and spool of solder wire.',
    actionText: 'Probe circuit',
  },
  {
    id: 'interact_printer',
    name: 'Precision 3D Printer',
    bounds: { x: 180, y: 70, width: 60, height: 50 },
    promptPosition: { x: 210, y: 66 },
    title: 'CoreXY 3D Printer',
    description:
      'Extruder gliding smoothly at 250mm/s laying down glossy cyan filament. A robotic wrist joint prototype is 84% complete.',
    actionText: 'Inspect print',
  },
  {
    id: 'interact_server',
    name: 'Enterprise Server Rack',
    bounds: { x: 670, y: 60, width: 64, height: 60 },
    promptPosition: { x: 702, y: 54 },
    title: 'Home Lab Cluster',
    description:
      'A stack of 1U servers humming quietly with cool filtered airflow. Pulsing status lights indicate 100% network health.',
    actionText: 'Check uptime',
  },
  {
    id: 'interact_tech_books',
    name: 'Engineering Library',
    bounds: { x: 570, y: 60, width: 80, height: 60 },
    promptPosition: { x: 610, y: 56 },
    title: 'Technical Reference Library',
    description:
      'Hardcover volumes on Distributed Systems, Compilers, VLSI Architecture, and Real-Time Graphics.',
    actionText: 'Read reference',
  },

  // Kitchen
  {
    id: 'interact_fridge',
    name: 'Double-Door Fridge',
    bounds: { x: 1640, y: 570, width: 60, height: 60 },
    promptPosition: { x: 1670, y: 560 },
    title: 'Stainless Steel Refrigerator',
    description:
      'Stocked with fresh cold beverages, matcha treats, fruit, and snacks.',
    actionText: 'Open fridge',
  },
  {
    id: 'interact_stove',
    name: 'Ceramic Stove & Oven',
    bounds: { x: 1770, y: 580, width: 74, height: 50 },
    promptPosition: { x: 1807, y: 570 },
    title: 'Induction Range & Convection Oven',
    description:
      'Polished cooktop with blue LED dials. Everything ready for a warm meal.',
    actionText: 'Cook something',
  },
  {
    id: 'interact_dining',
    name: 'Dining Table',
    bounds: { x: 2040, y: 710, width: 116, height: 70 },
    promptPosition: { x: 2098, y: 700 },
    title: 'Oak Dining Table',
    description:
      'Set with modern ceramic tableware and comfortable padded chairs.',
    actionText: 'Sit down',
  },

  // Store Room
  {
    id: 'interact_storage',
    name: 'Storage Shelving',
    bounds: { x: 1670, y: 60, width: 80, height: 60 },
    promptPosition: { x: 1710, y: 54 },
    title: 'Heavy Duty Storage Rack',
    description:
      'Neatly organized bins containing spare electronics, holiday lights, and camping supplies.',
    actionText: 'Rummage through shelves',
  },

  // Bedroom
  {
    id: 'interact_bed',
    name: 'King Bed',
    bounds: { x: 330, y: 570, width: 90, height: 70 },
    promptPosition: { x: 375, y: 560 },
    title: 'Master King Bed',
    description:
      'Plush memory foam mattress with soft duvet and linen pillows. The ultimate comfort spot.',
    actionText: 'Rest for a moment',
  },
  {
    id: 'interact_mirror',
    name: 'Full-Length Mirror',
    bounds: { x: 160, y: 570, width: 44, height: 60 },
    promptPosition: { x: 182, y: 560 },
    title: 'Gold-Trimmed Mirror',
    description:
      'Crystal-clear reflection. You are looking sharp today!',
    actionText: 'Check appearance',
  },

  // Bathroom
  {
    id: 'interact_shower',
    name: 'Rainfall Shower',
    bounds: { x: 60, y: 1090, width: 76, height: 60 },
    promptPosition: { x: 98, y: 1080 },
    title: 'Walk-In Spa Shower',
    description:
      'Thermostatic rainfall shower with marble tile bench and ambient mist lighting.',
    actionText: 'Turn on shower',
  },

  // Garage
  {
    id: 'interact_car',
    name: 'Cherry Red Sports Coupe',
    bounds: { x: 890, y: 1200, width: 180, height: 70 },
    promptPosition: { x: 980, y: 1190 },
    title: 'Vintage Sports Coupe',
    description:
      'Spotless cherry red paint with polished chrome trim. Full tank of gas and always ready for spontaneous road trips.',
    actionText: 'Admire car',
  },
  {
    id: 'interact_workbench',
    name: 'Mechanic Workbench',
    bounds: { x: 680, y: 1090, width: 106, height: 50 },
    promptPosition: { x: 733, y: 1080 },
    title: 'Heavy Duty Workbench',
    description:
      'Bench vise, socket set, torque wrench, and blueprints for a lightweight electric go-kart build.',
    actionText: 'Inspect tools',
  },

  // Balcony
  {
    id: 'interact_lemon',
    name: 'Terracotta Lemon Tree',
    bounds: { x: 1400, y: 1090, width: 58, height: 50 },
    promptPosition: { x: 1429, y: 1080 },
    title: 'Meyer Lemon Tree',
    description:
      'Fragrant citrus blossoms and bright yellow lemons basking in the sun.',
    actionText: 'Smell blossoms',
  },
  {
    id: 'interact_patio',
    name: 'Patio Bistro Table',
    bounds: { x: 1710, y: 1210, width: 72, height: 50 },
    promptPosition: { x: 1746, y: 1200 },
    title: 'Balcony Bistro Set',
    description:
      'Glass-top outdoor table overlooking the peaceful valley and distant hills.',
    actionText: 'Enjoy view',
  },
];

// ============================================================================
// UNIFIED HOUSE DEFINITION
// ============================================================================
export const houseDefinition: RoomDefinition = {
  id: 'berk_house',
  name: "Sopremish & Grape's Living Room",
  theme: 'living_room',
  icon: '🏡',
  description: 'Expansive 9-room multiplayer pixel-art residence.',
  tileWidth: 75,
  tileHeight: 50,
  tileSize: 32,
  pixelWidth: 2400,
  pixelHeight: 1600,
  playerSpawn: { x: 1184, y: 800 }, // Centered in Living Room
  floorSpriteKey: 'floor_wood',
  wallTheme: 'living_room',
  walls: houseWalls,
  doors: [], // No artificial loading doors; all rooms are contiguous!
  furniture: houseFurniture,
  interactiveObjects: houseInteractive,
  ambientLighting: {
    color: '#ffeaa7',
    intensity: 0.1,
  },
};

// Aliases for seamless backward-compatibility
export const livingRoomDefinition = houseDefinition;

export const HOUSE_ROOMS: Record<string, RoomDefinition> = {
  living_room: houseDefinition,
  kitchen: houseDefinition,
  bedroom: houseDefinition,
  balcony: houseDefinition,
  garage: houseDefinition,
  theatre: houseDefinition,
  working_lab: houseDefinition,
  bathroom: houseDefinition,
  store_room: houseDefinition,
};

export function getRoomDefinition(roomId?: string | null): RoomDefinition {
  return houseDefinition;
}
