import { RoomDefinition, Rect, RoomObject, InteractiveObject } from './types';

const TILE_SIZE = 32;
const TILE_WIDTH = 22;
const TILE_HEIGHT = 15;
const PIXEL_WIDTH = TILE_WIDTH * TILE_SIZE; // 704
const PIXEL_HEIGHT = TILE_HEIGHT * TILE_SIZE; // 480

// Perimeter wall collisions
const walls: Rect[] = [
  // North wall base
  { x: 0, y: 0, width: PIXEL_WIDTH, height: 90 },
  // West wall
  { x: 0, y: 0, width: 32, height: PIXEL_HEIGHT },
  // East wall
  { x: PIXEL_WIDTH - 32, y: 0, width: 32, height: PIXEL_HEIGHT },
  // South wall
  { x: 0, y: PIXEL_HEIGHT - 32, width: PIXEL_WIDTH, height: 32 },
];

// Room furniture & decorative objects
const furniture: RoomObject[] = [
  // Rug (flat on floor, no collision box)
  {
    id: 'rug_central',
    spriteKey: 'rug',
    x: 256,
    y: 196,
    width: 192,
    height: 120,
    depthY: 92, // Drawn just above floor level
  },

  // Wall-mounted window (no collision box)
  {
    id: 'window_living',
    spriteKey: 'window_view',
    x: 136,
    y: 18,
    width: 64,
    height: 76,
    depthY: 88,
  },

  // Wall Clock (high on wall)
  {
    id: 'wall_clock',
    spriteKey: 'wall_clock',
    x: 390,
    y: 22,
    width: 28,
    height: 28,
    depthY: 85,
  },

  // Framed Art (high on wall)
  {
    id: 'framed_art',
    spriteKey: 'framed_art',
    x: 446,
    y: 20,
    width: 36,
    height: 30,
    depthY: 85,
  },

  // Bookshelf (left wall area)
  {
    id: 'bookshelf_main',
    spriteKey: 'bookshelf',
    x: 48,
    y: 14,
    width: 64,
    height: 96,
    depthY: 104,
    solidBox: { x: 48, y: 76, width: 64, height: 26 },
  },

  // TV Console (center north wall)
  {
    id: 'tv_console_main',
    spriteKey: 'tv_console',
    x: 248,
    y: 44,
    width: 92,
    height: 64,
    depthY: 108,
    solidBox: { x: 250, y: 78, width: 88, height: 30 },
  },

  // Standing Brass Lamp (right corner)
  {
    id: 'standing_lamp_corner',
    spriteKey: 'standing_lamp',
    x: 590,
    y: 32,
    width: 32,
    height: 88,
    depthY: 118,
    solidBox: { x: 596, y: 104, width: 20, height: 14 },
  },

  // Large Monstera Plant (far right)
  {
    id: 'plant_monstera',
    spriteKey: 'plant_large',
    x: 634,
    y: 78,
    width: 36,
    height: 52,
    depthY: 126,
    solidBox: { x: 640, y: 110, width: 24, height: 18 },
  },

  // Comfortable Sofa (sits on upper rug)
  {
    id: 'sofa_living',
    spriteKey: 'sofa',
    x: 302,
    y: 156,
    width: 100,
    height: 56,
    depthY: 206,
    solidBox: { x: 304, y: 172, width: 96, height: 34 },
  },

  // Walnut Coffee Table (front of sofa)
  {
    id: 'coffee_table_main',
    spriteKey: 'coffee_table',
    x: 316,
    y: 228,
    width: 72,
    height: 38,
    depthY: 260,
    solidBox: { x: 318, y: 236, width: 68, height: 26 },
  },

  // Sleeping Tabby Cat
  {
    id: 'sleeping_cat_pillow',
    spriteKey: 'sleeping_cat',
    x: 180,
    y: 240,
    width: 30,
    height: 22,
    depthY: 258,
    solidBox: { x: 182, y: 246, width: 26, height: 14 },
  },

  // Small Succulent Stand
  {
    id: 'plant_succulent_stand',
    spriteKey: 'plant_small',
    x: 100,
    y: 350,
    width: 24,
    height: 28,
    depthY: 374,
    solidBox: { x: 102, y: 362, width: 20, height: 14 },
  },
];

// Interactive Objects & Cozy Dialogue
const interactiveObjects: InteractiveObject[] = [
  {
    id: 'interact_tv',
    name: 'Vintage Television',
    bounds: { x: 230, y: 65, width: 128, height: 60 },
    promptPosition: { x: 294, y: 40 },
    title: 'Vintage Television',
    description:
      'A silent retro anime broadcast plays gently on the screen. The flickering colors cast a soft, nostalgic glow over the room.',
    actionText: 'Watch for a moment',
  },
  {
    id: 'interact_bookshelf',
    name: 'Bookshelf',
    bounds: { x: 38, y: 65, width: 84, height: 50 },
    promptPosition: { x: 80, y: 15 },
    title: 'The Great Bookshelf',
    description:
      'Rows of well-loved fantasy books, indie comics, and a small framed polaroid from Sopremish & Grape\'s favorite trips.',
    actionText: 'Read titles',
  },
  {
    id: 'interact_window',
    name: 'Sunlit Window',
    bounds: { x: 126, y: 70, width: 84, height: 45 },
    promptPosition: { x: 168, y: 20 },
    title: 'Afternoon Window',
    description:
      'Warm sunlight streams through the sheer curtains. The hills outside are tranquil, green, and completely unhurried.',
    actionText: 'Look outside',
  },
  {
    id: 'interact_sofa',
    name: 'Velvet Sofa',
    bounds: { x: 290, y: 150, width: 124, height: 68 },
    promptPosition: { x: 352, y: 150 },
    title: 'Plush Velvet Sofa',
    description:
      'An extraordinarily comfortable couch with soft throw pillows. Perfect for curling up with a warm blanket and hot tea.',
    actionText: 'Sit down',
  },
  {
    id: 'interact_coffee_table',
    name: 'Coffee Table',
    bounds: { x: 306, y: 220, width: 92, height: 54 },
    promptPosition: { x: 352, y: 222 },
    title: 'Walnut Coffee Table',
    description:
      'A steaming mug of spiced chai rests on a coaster next to an open notebook filled with world-building sketches.',
    actionText: 'Take a sip',
  },
  {
    id: 'interact_cat',
    name: 'Sleeping Cat',
    bounds: { x: 170, y: 232, width: 50, height: 40 },
    promptPosition: { x: 195, y: 234 },
    title: 'Sleeping Tabby Cat',
    description:
      'Curled up in a deep, peaceful snooze. Soft little purrs and snores rise as its tail gently twitches in dreamland.',
    actionText: 'Pet gently',
  },
  {
    id: 'interact_lamp',
    name: 'Floor Lamp',
    bounds: { x: 580, y: 92, width: 52, height: 40 },
    promptPosition: { x: 606, y: 32 },
    title: 'Brass Standing Lamp',
    description:
      'A classic mid-century floor lamp casting a comforting amber radiance across the wooden floorboards.',
    actionText: 'Bask in the glow',
  },
  {
    id: 'interact_art',
    name: 'Framed Painting',
    bounds: { x: 436, y: 70, width: 56, height: 45 },
    promptPosition: { x: 464, y: 20 },
    title: 'Framed Painting',
    description:
      'A hand-painted coastal sunset over calm waters. A handwritten note on the back reads: "To many more sunsets together."',
    actionText: 'Admire painting',
  },
];

export const livingRoomDefinition: RoomDefinition = {
  id: 'living_room',
  name: "Sopremish & Grape's Living Room",
  tileWidth: TILE_WIDTH,
  tileHeight: TILE_HEIGHT,
  tileSize: TILE_SIZE,
  pixelWidth: PIXEL_WIDTH,
  pixelHeight: PIXEL_HEIGHT,
  playerSpawn: { x: 190, y: 140 },
  walls,
  furniture,
  interactiveObjects,
};
