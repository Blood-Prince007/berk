import { Direction } from './types';
import { getHouseSpritesDictionary } from './houseSprites';

export interface SpriteAtlas {
  floor_wood: HTMLCanvasElement;
  wall_top: HTMLCanvasElement;
  wall_middle: HTMLCanvasElement;
  wall_bottom: HTMLCanvasElement;
  rug: HTMLCanvasElement;
  sofa: HTMLCanvasElement;
  coffee_table: HTMLCanvasElement;
  tv_console: HTMLCanvasElement;
  window_view: HTMLCanvasElement;
  bookshelf: HTMLCanvasElement;
  standing_lamp: HTMLCanvasElement;
  plant_large: HTMLCanvasElement;
  plant_small: HTMLCanvasElement;
  wall_clock: HTMLCanvasElement;
  framed_art: HTMLCanvasElement;
  sleeping_cat: HTMLCanvasElement;
  player: Record<Direction, HTMLCanvasElement[]>;
  player_grape: Record<Direction, HTMLCanvasElement[]>;
  [key: string]: any;
}

// Global cached atlas
let cachedAtlas: SpriteAtlas | null = null;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return {
      getContext: () => null,
      width,
      height,
    } as unknown as HTMLCanvasElement;
  }
  const canvas = document.createElement('canvas');
  if (!canvas || typeof canvas.getContext !== 'function') {
    return {
      getContext: () => null,
      width,
      height,
    } as unknown as HTMLCanvasElement;
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
  }
  return canvas;
}

// Helper: draw pixel rectangle
function pRect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Helper: draw single pixel
function pDot(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ----------------------------------------------------
// 1. FLOOR TILE (32x32 warm parquet wood planks)
// ----------------------------------------------------
function buildFloorWood(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Base warm oak
  pRect(ctx, '#98653e', 0, 0, 32, 32);

  // Parquet layout: 4 planks of 16x8 alternating
  // Plank borders
  ctx.fillStyle = '#653c1c';
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 8, 32, 1);
  ctx.fillRect(0, 16, 32, 1);
  ctx.fillRect(0, 24, 32, 1);
  ctx.fillRect(16, 0, 1, 16);
  ctx.fillRect(8, 16, 1, 16);
  ctx.fillRect(24, 16, 1, 16);

  // Plank 1 (0..16, 0..8): warm tone with grain
  pRect(ctx, '#a57248', 1, 1, 15, 7);
  pRect(ctx, '#b37f53', 2, 2, 13, 2);
  pRect(ctx, '#8c5934', 4, 5, 8, 1);
  pDot(ctx, '#5c371d', 2, 4); // nail
  pDot(ctx, '#5c371d', 13, 4);

  // Plank 2 (16..32, 0..8): slightly richer tone
  pRect(ctx, '#8d5c36', 17, 1, 15, 7);
  pRect(ctx, '#9e6a41', 18, 2, 13, 2);
  pRect(ctx, '#7b4c27', 20, 5, 9, 1);
  pDot(ctx, '#5c371d', 18, 4);
  pDot(ctx, '#5c371d', 29, 4);

  // Plank 3 (0..16, 8..16)
  pRect(ctx, '#8f5d37', 1, 9, 15, 7);
  pRect(ctx, '#9d6940', 3, 10, 11, 2);
  pRect(ctx, '#7d4d29', 2, 13, 12, 1);
  pDot(ctx, '#5c371d', 3, 12);
  pDot(ctx, '#5c371d', 13, 12);

  // Plank 4 (16..32, 8..16)
  pRect(ctx, '#a8754b', 17, 9, 15, 7);
  pRect(ctx, '#b58257', 18, 10, 13, 2);
  pRect(ctx, '#8e5b35', 21, 14, 8, 1);
  pDot(ctx, '#5c371d', 19, 12);
  pDot(ctx, '#5c371d', 30, 12);

  // Bottom half (16..32 y) with staggered vertical joints
  pRect(ctx, '#a26f46', 1, 17, 7, 7);
  pRect(ctx, '#8c5a34', 9, 17, 15, 7);
  pRect(ctx, '#a67349', 25, 17, 7, 7);

  pRect(ctx, '#8f5c36', 1, 25, 7, 7);
  pRect(ctx, '#a47148', 9, 25, 15, 7);
  pRect(ctx, '#905d37', 25, 25, 7, 7);

  // Subtle wood highlights
  pRect(ctx, '#b78458', 11, 18, 11, 1);
  pRect(ctx, '#b78458', 11, 26, 11, 1);

  return c;
}

// ----------------------------------------------------
// 2. WALLS (32x32 tiles: top moulding, middle wainscot, base skirting)
// ----------------------------------------------------
function buildWallTop(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Dark ceiling shadow
  pRect(ctx, '#22140a', 0, 0, 32, 3);
  // Crown moulding dark oak
  pRect(ctx, '#4a2c17', 0, 3, 32, 4);
  pRect(ctx, '#653e24', 0, 4, 32, 2);
  pRect(ctx, '#361e0e', 0, 7, 32, 2);

  // Upper wall warm plaster
  pRect(ctx, '#e4d9c7', 0, 9, 32, 23);
  // Subtle vertical stripe texture
  for (let x = 0; x < 32; x += 4) {
    pRect(ctx, '#ded2bf', x, 9, 1, 23);
  }

  return c;
}

function buildWallMiddle(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Cream plaster with subtle vertical paper stripes
  pRect(ctx, '#e4d9c7', 0, 0, 32, 32);
  for (let x = 0; x < 32; x += 4) {
    pRect(ctx, '#ded2bf', x, 0, 1, 32);
  }
  // Subtle warm ambient gradient towards middle
  pRect(ctx, '#e8dfd0', 0, 12, 32, 8);

  return c;
}

function buildWallBottom(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Lower wallpaper
  pRect(ctx, '#e4d9c7', 0, 0, 32, 18);
  for (let x = 0; x < 32; x += 4) {
    pRect(ctx, '#ded2bf', x, 0, 1, 18);
  }

  // Wainscoting chair rail trim
  pRect(ctx, '#54341e', 0, 18, 32, 2);
  pRect(ctx, '#6e4428', 0, 19, 32, 1);

  // Lower wood panelling
  pRect(ctx, '#7c4d2c', 0, 20, 32, 8);
  pRect(ctx, '#8e5832', 1, 21, 30, 2);

  // Heavy skirting board at floor line
  pRect(ctx, '#3d2312', 0, 28, 32, 4);
  pRect(ctx, '#563219', 0, 28, 32, 1); // bevel highlight
  pRect(ctx, '#1d1007', 0, 31, 32, 1); // floor shadow

  return c;
}

// ----------------------------------------------------
// 3. RUG (192x120 large warm boho woven rug)
// ----------------------------------------------------
function buildRug(): HTMLCanvasElement {
  const c = createCanvas(192, 120);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Fringes on left & right
  for (let y = 10; y < 110; y += 3) {
    pRect(ctx, '#f0eae1', 0, y, 4, 1);
    pRect(ctx, '#f0eae1', 188, y, 4, 1);
  }

  // Rug base: warm cream/linen
  pRect(ctx, '#f7f1e7', 4, 4, 184, 112);

  // Outer terracotta border
  pRect(ctx, '#b85437', 8, 8, 176, 104);
  pRect(ctx, '#f7f1e7', 12, 12, 168, 96);

  // Navy/teal inner accent border
  pRect(ctx, '#3a5f65', 15, 15, 162, 90);
  pRect(ctx, '#f7f1e7', 17, 17, 158, 86);

  // Soft warm peach inner field
  pRect(ctx, '#faede2', 20, 20, 152, 80);

  // Central diamond & floral boho motif
  // Diamonds in terracotta and golden mustard
  const centerX = 96;
  const centerY = 60;

  // Center medallion
  for (let r = 0; r < 24; r++) {
    const w = r * 2;
    pRect(ctx, '#b85437', centerX - r, centerY - 24 + r, w + 1, 1);
    pRect(ctx, '#b85437', centerX - r, centerY + 24 - r, w + 1, 1);
  }
  for (let r = 0; r < 16; r++) {
    const w = r * 2;
    pRect(ctx, '#e5ad45', centerX - r, centerY - 16 + r, w + 1, 1);
    pRect(ctx, '#e5ad45', centerX - r, centerY + 16 - r, w + 1, 1);
  }
  for (let r = 0; r < 8; r++) {
    const w = r * 2;
    pRect(ctx, '#3a5f65', centerX - r, centerY - 8 + r, w + 1, 1);
    pRect(ctx, '#3a5f65', centerX - r, centerY + 8 - r, w + 1, 1);
  }

  // Corner motifs
  const corners = [
    [32, 32],
    [160, 32],
    [32, 88],
    [160, 88],
  ];
  corners.forEach(([cx, cy]) => {
    pRect(ctx, '#b85437', cx - 6, cy - 6, 13, 13);
    pRect(ctx, '#e5ad45', cx - 4, cy - 4, 9, 9);
    pRect(ctx, '#3a5f65', cx - 2, cy - 2, 5, 5);
  });

  return c;
}

// ----------------------------------------------------
// 4. SOFA (100x56 cozy 3-seater terracotta/rust velvet sofa)
// ----------------------------------------------------
function buildSofa(): HTMLCanvasElement {
  const c = createCanvas(100, 56);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Cast shadow
  pRect(ctx, 'rgba(25, 15, 8, 0.45)', 4, 46, 92, 10);

  // Dark turned wooden legs
  pRect(ctx, '#3b2010', 8, 48, 6, 7);
  pRect(ctx, '#3b2010', 86, 48, 6, 7);
  pRect(ctx, '#3b2010', 47, 48, 6, 7);

  // Sofa back frame
  pRect(ctx, '#8d351b', 4, 4, 92, 30);
  pRect(ctx, '#af4a29', 6, 6, 88, 26);

  // 3 back cushion segments
  for (let i = 0; i < 3; i++) {
    const bx = 8 + i * 28;
    pRect(ctx, '#be5432', bx, 8, 27, 22);
    pRect(ctx, '#d06542', bx + 2, 9, 23, 4); // top cushion highlight
    pRect(ctx, '#7b2c15', bx + 26, 8, 1, 22); // cushion crease
    // Tufted buttons
    pDot(ctx, '#62220f', bx + 13, 18);
  }

  // Seat cushions (3 sections)
  pRect(ctx, '#7b2c15', 4, 28, 92, 22);
  for (let i = 0; i < 3; i++) {
    const sx = 6 + i * 29;
    pRect(ctx, '#c15835', sx, 30, 28, 18);
    pRect(ctx, '#d76f4c', sx + 2, 31, 24, 3); // cushion puff highlight
    pRect(ctx, '#9c3f21', sx, 44, 28, 4); // lower shadow
    pRect(ctx, '#682410', sx + 27, 30, 1, 18); // cushion seam
  }

  // Rolled armrests (left & right)
  pRect(ctx, '#803017', 2, 16, 10, 32);
  pRect(ctx, '#c75e3b', 4, 18, 6, 28);
  pRect(ctx, '#e07956', 5, 19, 4, 4); // rounded arm highlight

  pRect(ctx, '#803017', 88, 16, 10, 32);
  pRect(ctx, '#c75e3b', 90, 18, 6, 28);
  pRect(ctx, '#e07956', 91, 19, 4, 4);

  // Throw pillows!
  // Pillow 1: Cream boho pillow on left
  pRect(ctx, '#e8ded0', 14, 22, 14, 14);
  pRect(ctx, '#f9f3ea', 16, 23, 10, 10);
  pRect(ctx, '#c8bba9', 15, 33, 12, 3);
  pRect(ctx, '#a85b42', 20, 24, 2, 8); // embroidered stripe

  // Pillow 2: Mustard gold pillow on right
  pRect(ctx, '#b88924', 72, 22, 14, 14);
  pRect(ctx, '#e2ad3a', 74, 23, 10, 10);
  pRect(ctx, '#916814', 73, 33, 12, 3);

  return c;
}

// ----------------------------------------------------
// 5. COFFEE TABLE (72x38 warm walnut table with books & tea)
// ----------------------------------------------------
function buildCoffeeTable(): HTMLCanvasElement {
  const c = createCanvas(72, 38);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(20, 12, 6, 0.4)', 4, 26, 64, 12);

  // 4 Legs
  pRect(ctx, '#412614', 6, 20, 4, 14);
  pRect(ctx, '#412614', 62, 20, 4, 14);
  pRect(ctx, '#412614', 16, 16, 4, 12);
  pRect(ctx, '#412614', 52, 16, 4, 12);

  // Bottom magazine shelf
  pRect(ctx, '#5a351d', 10, 24, 52, 3);

  // Table top main slab
  pRect(ctx, '#4a2b16', 2, 4, 68, 16);
  pRect(ctx, '#7b4c29', 3, 5, 66, 14);
  pRect(ctx, '#935e35', 4, 6, 64, 12);
  // Wood grain & sheen
  pRect(ctx, '#a86f43', 6, 7, 56, 2);
  pRect(ctx, '#683d20', 8, 11, 40, 1);

  // Items on table:
  // 1. Ceramic mug of chai with steam
  pRect(ctx, '#264b56', 14, 8, 7, 7); // mug body
  pRect(ctx, '#f0ede6', 15, 9, 5, 5); // ceramic inside
  pRect(ctx, '#6b3e1c', 16, 10, 3, 3); // hot tea
  pRect(ctx, '#264b56', 21, 10, 2, 4); // mug handle
  // Steam curls
  pDot(ctx, 'rgba(255, 255, 255, 0.6)', 16, 5);
  pDot(ctx, 'rgba(255, 255, 255, 0.4)', 17, 3);
  pDot(ctx, 'rgba(255, 255, 255, 0.5)', 18, 1);

  // 2. Open paperback book
  pRect(ctx, '#78281b', 32, 8, 18, 9); // cover
  pRect(ctx, '#f7f4ea', 33, 9, 8, 7); // left page
  pRect(ctx, '#ece7d7', 41, 9, 8, 7); // right page
  pRect(ctx, '#572016', 40, 9, 1, 7); // spine crease
  // Text lines
  pRect(ctx, '#988f83', 34, 11, 6, 1);
  pRect(ctx, '#988f83', 34, 13, 5, 1);
  pRect(ctx, '#988f83', 42, 11, 6, 1);
  pRect(ctx, '#988f83', 42, 13, 4, 1);

  // 3. Small succulent in mini pot
  pRect(ctx, '#c4694a', 58, 8, 6, 6);
  pRect(ctx, '#3f7c35', 59, 6, 4, 3);
  pDot(ctx, '#6bb85d', 60, 5);

  return c;
}

// ----------------------------------------------------
// 6. TV & MEDIA CONSOLE (92x64 wooden console + retro animated TV)
// ----------------------------------------------------
function buildTvConsole(): HTMLCanvasElement {
  const c = createCanvas(92, 64);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Media Console (Bottom credenza)
  // Shadow
  pRect(ctx, 'rgba(20, 10, 5, 0.4)', 2, 58, 88, 6);
  // Credenza base
  pRect(ctx, '#3c2211', 2, 34, 88, 26);
  pRect(ctx, '#683e22', 4, 36, 84, 22);

  // Wooden cabinet slatted doors & brass handles
  pRect(ctx, '#4e2d17', 6, 38, 24, 18);
  pRect(ctx, '#5e371d', 7, 39, 22, 16);
  pDot(ctx, '#d4af37', 26, 47); // brass knob

  pRect(ctx, '#4e2d17', 34, 38, 24, 18);
  pRect(ctx, '#3a1f0f', 35, 39, 22, 16); // center shelf
  // Stored game console / VHS player
  pRect(ctx, '#1f242b', 37, 48, 18, 5);
  pDot(ctx, '#00e5ff', 39, 50); // power LED

  pRect(ctx, '#4e2d17', 62, 38, 24, 18);
  pRect(ctx, '#5e371d', 63, 39, 22, 16);
  pDot(ctx, '#d4af37', 65, 47); // brass knob

  // Credenza top surface highlight
  pRect(ctx, '#8b5431', 2, 34, 88, 2);

  // Television
  // TV stand neck & base
  pRect(ctx, '#23272e', 40, 30, 12, 4);
  pRect(ctx, '#1b1e24', 36, 33, 20, 2);

  // TV Outer Frame (Sleek dark matte with subtle bezel highlight)
  pRect(ctx, '#181b20', 16, 2, 60, 30);
  pRect(ctx, '#282d36', 17, 3, 58, 28);
  pRect(ctx, '#0e1014', 19, 5, 54, 24);

  // TV Screen: Peaceful Studio Ghibli retro anime landscape!
  // Sky
  pRect(ctx, '#5da8de', 20, 6, 52, 13);
  pRect(ctx, '#8ac7f0', 20, 15, 52, 4);
  // Golden sunset sun
  pRect(ctx, '#fbe374', 54, 8, 6, 6);
  pRect(ctx, '#fff6ad', 55, 9, 4, 4);
  // Puffy pixel clouds
  pRect(ctx, '#ffffff', 24, 9, 10, 3);
  pRect(ctx, '#ffffff', 27, 8, 5, 2);
  // Distant purple hills
  pRect(ctx, '#685987', 20, 18, 52, 4);
  // Rolling green meadows
  pRect(ctx, '#42803b', 20, 20, 52, 6);
  pRect(ctx, '#589e4e', 20, 21, 52, 2);
  // Little cottage silhouette
  pRect(ctx, '#bf4e36', 32, 19, 5, 4);
  pRect(ctx, '#4a251b', 31, 18, 7, 2);

  // Retro scanlines overlay
  for (let y = 6; y < 29; y += 2) {
    pRect(ctx, 'rgba(0, 0, 0, 0.15)', 20, y, 52, 1);
  }

  // Soft power LED
  pDot(ctx, '#00e5ff', 72, 30);

  return c;
}

// ----------------------------------------------------
// 7. WINDOW (64x76 sunny window with curtains)
// ----------------------------------------------------
function buildWindow(): HTMLCanvasElement {
  const c = createCanvas(64, 76);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Window frame cut into wall
  pRect(ctx, '#3f2513', 4, 4, 56, 68);
  pRect(ctx, '#5e3a20', 6, 6, 52, 64);

  // Outdoor Sky view
  pRect(ctx, '#6bb9f0', 8, 8, 48, 60);
  pRect(ctx, '#98d4fa', 8, 30, 48, 20);

  // Distant green rolling mountains
  pRect(ctx, '#588b52', 8, 44, 48, 14);
  pRect(ctx, '#3f6d39', 8, 50, 48, 18);

  // Sunlight and fluffy clouds
  pRect(ctx, '#ffffff', 20, 18, 16, 6);
  pRect(ctx, '#ffffff', 24, 15, 8, 4);

  // Window wooden panes (crossbars)
  pRect(ctx, '#5e3a20', 31, 8, 2, 60);
  pRect(ctx, '#5e3a20', 8, 36, 48, 2);

  // Sill
  pRect(ctx, '#774c2d', 2, 68, 60, 4);
  pRect(ctx, '#8e5d39', 4, 69, 56, 2);

  // Curtains on sides (Ivory with gentle drapes and golden tiebacks)
  // Left curtain
  pRect(ctx, '#fcfaf6', 6, 6, 12, 60);
  pRect(ctx, '#ede4d3', 15, 6, 3, 60);
  // Tieback
  pRect(ctx, '#d4a337', 6, 40, 10, 4);
  pDot(ctx, '#ffd966', 15, 41);

  // Right curtain
  pRect(ctx, '#fcfaf6', 46, 6, 12, 60);
  pRect(ctx, '#ede4d3', 46, 6, 3, 60);
  // Tieback
  pRect(ctx, '#d4a337', 48, 40, 10, 4);
  pDot(ctx, '#ffd966', 47, 41);

  // Curtain rod & rings
  pRect(ctx, '#c59b27', 0, 2, 64, 3);
  pDot(ctx, '#e8be48', 2, 1);
  pDot(ctx, '#e8be48', 61, 1);

  return c;
}

// ----------------------------------------------------
// 8. BOOKSHELF (64x96 dark oak library bookshelf)
// ----------------------------------------------------
function buildBookshelf(): HTMLCanvasElement {
  const c = createCanvas(64, 96);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(20, 10, 5, 0.45)', 2, 90, 60, 6);

  // Main wooden case
  pRect(ctx, '#361e0e', 2, 2, 60, 92);
  pRect(ctx, '#54321b', 4, 4, 56, 88);
  // Top moulding
  pRect(ctx, '#6c4125', 0, 0, 64, 4);
  pRect(ctx, '#361e0e', 1, 3, 62, 1);

  // 4 Shelves
  const shelvesY = [24, 46, 68, 90];
  shelvesY.forEach((sy) => {
    pRect(ctx, '#361e0e', 4, sy, 56, 3);
    pRect(ctx, '#6c4125', 4, sy, 56, 1);
  });

  // Shelf 1 (top): books + trailing ivy plant
  // Colorful book spines
  const colors1 = ['#8d2921', '#285566', '#a87e22', '#2f5b35', '#57335e'];
  let bx = 6;
  colors1.forEach((col, idx) => {
    const w = 4 + (idx % 2);
    pRect(ctx, col, bx, 8, w, 16);
    pRect(ctx, '#f7f4ea', bx + 1, 9, w - 2, 1); // page edges
    pDot(ctx, '#d4a337', bx + 2, 15); // gold foil on spine
    bx += w + 1;
  });
  // Trailing Ivy plant on right of top shelf
  pRect(ctx, '#ab5734', 44, 15, 12, 9); // terracotta pot
  pRect(ctx, '#396d2f', 43, 10, 14, 6); // foliage
  pRect(ctx, '#549c45', 45, 11, 10, 4);
  // Vines hanging down past shelf
  pRect(ctx, '#407c35', 46, 24, 2, 12);
  pRect(ctx, '#5ea84f', 45, 27, 3, 2);
  pRect(ctx, '#407c35', 52, 24, 2, 8);
  pRect(ctx, '#5ea84f', 53, 29, 3, 2);

  // Shelf 2: rows of books & bookend
  let bx2 = 6;
  const colors2 = [
    '#324b69',
    '#324b69',
    '#9c4228',
    '#2d573c',
    '#704128',
    '#a88934',
    '#4a3763',
    '#8d2b2b',
    '#254b52',
    '#854c25',
  ];
  colors2.forEach((col) => {
    const w = 4;
    pRect(ctx, col, bx2, 29, w, 17);
    pRect(ctx, '#f7f4ea', bx2 + 1, 30, w - 2, 1);
    bx2 += w + 1;
  });

  // Shelf 3: books + framed polaroid memory
  let bx3 = 6;
  const colors3 = ['#6e3328', '#2b4d5e', '#a37b27', '#335e3c'];
  colors3.forEach((col) => {
    pRect(ctx, col, bx3, 51, 5, 17);
    bx3 += 6;
  });
  // Slanted book
  pRect(ctx, '#8a3328', 32, 54, 8, 14);
  // Framed Polaroid of Sopremish & Grape!
  pRect(ctx, '#f7f4ea', 44, 52, 14, 16);
  pRect(ctx, '#518bb5', 46, 54, 10, 9); // sky in photo
  pRect(ctx, '#c85e43', 48, 57, 3, 4); // heart / figures
  pRect(ctx, '#70a856', 52, 57, 3, 4);

  // Shelf 4 (bottom): heavy encyclopedia tomes
  let bx4 = 6;
  const colors4 = ['#291a13', '#401815', '#162e24', '#152438', '#382012'];
  colors4.forEach((col) => {
    pRect(ctx, col, bx4, 72, 9, 18);
    pRect(ctx, '#b88f37', bx4 + 2, 75, 5, 2); // gold embossed bands
    pRect(ctx, '#b88f37', bx4 + 2, 85, 5, 2);
    bx4 += 10;
  });

  return c;
}

// ----------------------------------------------------
// 9. STANDING LAMP (32x88 retro brass floor lamp with warm glow)
// ----------------------------------------------------
function buildStandingLamp(): HTMLCanvasElement {
  const c = createCanvas(32, 88);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Base shadow
  pRect(ctx, 'rgba(25, 15, 5, 0.4)', 4, 82, 24, 6);

  // Circular brass base
  pRect(ctx, '#8c6817', 7, 80, 18, 5);
  pRect(ctx, '#d4a32b', 9, 81, 14, 3);
  pRect(ctx, '#fae17a', 11, 81, 10, 1);

  // Slim brass pole
  pRect(ctx, '#a67d20', 15, 22, 2, 60);
  pRect(ctx, '#f1d166', 15, 22, 1, 60); // reflection

  // Lamp shade (Warm pleated ivory shade)
  // Shade top
  pRect(ctx, '#d9be8b', 10, 16, 12, 4);
  pRect(ctx, '#f5e4bd', 11, 17, 10, 2);
  // Fluted conical body
  pRect(ctx, '#faecd0', 6, 20, 20, 16);
  // Pleats
  for (let x = 7; x < 25; x += 3) {
    pRect(ctx, '#e6caa1', x, 20, 1, 16);
  }
  // Bottom fringe
  pRect(ctx, '#d4a32b', 5, 36, 22, 2);

  // Soft bulb glow inside shade
  pRect(ctx, '#fffde8', 12, 24, 8, 8);

  return c;
}

// ----------------------------------------------------
// 10. LARGE MONSTERA PLANT (36x52 in terracotta pot)
// ----------------------------------------------------
function buildLargePlant(): HTMLCanvasElement {
  const c = createCanvas(36, 52);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(20, 10, 5, 0.4)', 6, 46, 24, 6);

  // Terracotta Pot
  pRect(ctx, '#94472b', 9, 32, 18, 16);
  pRect(ctx, '#b85c3b', 10, 33, 16, 14);
  pRect(ctx, '#cb6f4e', 11, 34, 14, 3); // pot rim highlight
  pRect(ctx, '#5c2b18', 8, 30, 20, 4); // pot rim
  pRect(ctx, '#d67a58', 9, 31, 18, 2);
  // Dark soil
  pRect(ctx, '#2d180d', 11, 31, 14, 2);

  // Lush Monstera leaves (Deep tropical green with fenestrations)
  // Leaf 1: Top left
  pRect(ctx, '#245220', 2, 10, 16, 18);
  pRect(ctx, '#3c7935', 4, 12, 12, 14);
  pRect(ctx, '#5da854', 6, 14, 8, 6); // leaf highlight
  // cutouts
  pRect(ctx, 'rgba(0,0,0,0)', 8, 16, 4, 2);

  // Leaf 2: Top right
  pRect(ctx, '#1d451a', 18, 6, 16, 20);
  pRect(ctx, '#346d2e', 20, 8, 12, 16);
  pRect(ctx, '#549c4a', 22, 10, 8, 8);

  // Leaf 3: Center arching
  pRect(ctx, '#2d6128', 10, 14, 16, 18);
  pRect(ctx, '#45853e', 12, 16, 12, 14);
  pRect(ctx, '#6aba60', 14, 18, 8, 6);

  // Stems
  pRect(ctx, '#275223', 17, 24, 2, 9);
  pRect(ctx, '#275223', 13, 22, 2, 10);
  pRect(ctx, '#275223', 21, 22, 2, 10);

  return c;
}

// ----------------------------------------------------
// 11. SMALL SUCCULENT PLANT (24x28)
// ----------------------------------------------------
function buildSmallPlant(): HTMLCanvasElement {
  const c = createCanvas(24, 28);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(20, 10, 5, 0.3)', 4, 24, 16, 4);

  // White geometric ceramic pot
  pRect(ctx, '#d8d4cb', 6, 16, 12, 10);
  pRect(ctx, '#f5f2ec', 7, 17, 10, 8);
  pRect(ctx, '#4a6f78', 8, 20, 8, 2); // painted teal pattern

  // Jade / Succulent fleshy rosettes
  pRect(ctx, '#2f5b3a', 6, 6, 12, 11);
  pRect(ctx, '#4a8258', 8, 8, 8, 8);
  pRect(ctx, '#6eb37f', 10, 10, 4, 4);
  pDot(ctx, '#98d9a8', 11, 11);

  return c;
}

// ----------------------------------------------------
// 12. WALL CLOCK (28x28 round wooden clock)
// ----------------------------------------------------
function buildWallClock(): HTMLCanvasElement {
  const c = createCanvas(28, 28);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Outer dark wood rim
  pRect(ctx, '#3f2413', 2, 2, 24, 24);
  pRect(ctx, '#6e4324', 4, 4, 20, 20);

  // White clock face
  pRect(ctx, '#f8f5ee', 6, 6, 16, 16);

  // Hour tick marks (12, 3, 6, 9)
  pDot(ctx, '#26170d', 13, 7);
  pDot(ctx, '#26170d', 19, 13);
  pDot(ctx, '#26170d', 13, 19);
  pDot(ctx, '#26170d', 7, 13);

  // Clock hands (pointing to ~4:15 cozy teatime!)
  pRect(ctx, '#1f130b', 13, 13, 1, 1);
  pRect(ctx, '#1f130b', 13, 11, 1, 3); // minute hand up
  pRect(ctx, '#1f130b', 14, 14, 3, 1); // hour hand right

  return c;
}

// ----------------------------------------------------
// 13. FRAMED ART (36x30 framed landscape painting)
// ----------------------------------------------------
function buildFramedArt(): HTMLCanvasElement {
  const c = createCanvas(36, 30);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Ornate gold frame
  pRect(ctx, '#8a6b1e', 0, 0, 36, 30);
  pRect(ctx, '#d4a83b', 2, 2, 32, 26);
  pRect(ctx, '#fae17a', 3, 3, 30, 2);

  // Canvas painting: Sunset over coastal cliff
  // Sunset gradient
  pRect(ctx, '#de7043', 4, 5, 28, 7);
  pRect(ctx, '#f0a354', 4, 12, 28, 4);
  // Ocean horizon
  pRect(ctx, '#2a5b78', 4, 16, 28, 9);
  pRect(ctx, '#3d7a9c', 4, 18, 28, 2); // wave glint
  // Dark silhouette cliff
  pRect(ctx, '#1c241e', 4, 14, 10, 11);
  pRect(ctx, '#1c241e', 14, 18, 6, 7);

  return c;
}

// ----------------------------------------------------
// 14. SLEEPING CAT (30x22 orange tabby on floor pillow)
// ----------------------------------------------------
function buildSleepingCat(): HTMLCanvasElement {
  const c = createCanvas(30, 22);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Floor cushion
  pRect(ctx, 'rgba(20, 10, 5, 0.3)', 2, 16, 26, 6);
  pRect(ctx, '#3b5560', 3, 6, 24, 13);
  pRect(ctx, '#4f717f', 4, 7, 22, 11);

  // Curled up orange tabby
  pRect(ctx, '#b5581e', 7, 8, 16, 9);
  pRect(ctx, '#de7731', 8, 9, 14, 7);
  // Tabby stripes
  pDot(ctx, '#8e3d0f', 11, 10);
  pDot(ctx, '#8e3d0f', 14, 10);
  pDot(ctx, '#8e3d0f', 17, 10);
  // Sleeping eyes curved
  pDot(ctx, '#612506', 18, 12);
  pDot(ctx, '#612506', 20, 12);
  // Ears
  pRect(ctx, '#b5581e', 19, 7, 2, 2);
  pRect(ctx, '#b5581e', 21, 7, 2, 2);
  // Curled tail
  pRect(ctx, '#de7731', 6, 12, 4, 2);

  // Zzz sleep bubbles
  pDot(ctx, 'rgba(255, 255, 255, 0.7)', 23, 4);
  pDot(ctx, 'rgba(255, 255, 255, 0.5)', 25, 2);

  return c;
}

interface PlayerPalette {
  hairDark: string;
  hairMid: string;
  hairLight: string;
  sweaterDark: string;
  sweaterMid: string;
  sweaterLight: string;
  sweaterTrim: string;
}

const DEFAULT_SOPREMISH_PALETTE: PlayerPalette = {
  hairDark: '#3b2213',
  hairMid: '#5c3820',
  hairLight: '#794d2f',
  sweaterDark: '#1a434d',
  sweaterMid: '#286270',
  sweaterLight: '#3b7e8f',
  sweaterTrim: '#f5efe3',
};

const GRAPE_PALETTE: PlayerPalette = {
  hairDark: '#441d1a',
  hairMid: '#682e27',
  hairLight: '#8a443a',
  sweaterDark: '#401750',
  sweaterMid: '#662880',
  sweaterLight: '#8940a8',
  sweaterTrim: '#faedf8',
};

// ----------------------------------------------------
// 15. PLAYER CHARACTER (32x36 Indie Pixel-Art Protagonist)
// ----------------------------------------------------
// 4 Directions x 4 Animation Frames (0=idle, 1=walkA, 2=idle, 3=walkB)
function buildPlayerFrames(
  palette: PlayerPalette = DEFAULT_SOPREMISH_PALETTE
): Record<Direction, HTMLCanvasElement[]> {
  const directions: Direction[] = ['down', 'up', 'left', 'right'];
  const playerAtlas: Record<Direction, HTMLCanvasElement[]> = {
    down: [],
    up: [],
    left: [],
    right: [],
  };

  directions.forEach((dir) => {
    for (let frame = 0; frame < 4; frame++) {
      const c = createCanvas(32, 36);
      const ctx = c.getContext('2d');
      if (!ctx) {
        playerAtlas[dir].push(c);
        continue;
      }

      // Cast shadow under feet
      pRect(ctx, 'rgba(15, 8, 4, 0.45)', 8, 30, 16, 5);

      const bobY = frame === 1 || frame === 3 ? 1 : 0;
      const legOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

      // Color Palette:
      const {
        hairDark,
        hairMid,
        hairLight,
        sweaterDark,
        sweaterMid,
        sweaterLight,
        sweaterTrim,
      } = palette;
      const skinTone = '#fce4c8';
      const skinShadow = '#e0be9f';
      const pantsColor = '#2d2f3d';
      const shoeColor = '#4a2c1d';

      if (dir === 'down') {
        // Legs & Shoes
        pRect(ctx, pantsColor, 11 + legOffset, 24, 4, 6);
        pRect(ctx, pantsColor, 17 - legOffset, 24, 4, 6);
        pRect(ctx, shoeColor, 10 + legOffset, 30, 5, 3);
        pRect(ctx, shoeColor, 17 - legOffset, 30, 5, 3);

        // Sweater Body
        pRect(ctx, sweaterDark, 9, 14 + bobY, 14, 11);
        pRect(ctx, sweaterMid, 10, 15 + bobY, 12, 9);
        pRect(ctx, sweaterLight, 11, 16 + bobY, 6, 4); // sweater knit highlight
        pRect(ctx, sweaterTrim, 12, 14 + bobY, 8, 2); // cozy rolled neckline

        // Arms (hanging or swinging slightly)
        pRect(ctx, sweaterMid, 7, 16 + bobY - legOffset / 2, 3, 8);
        pRect(ctx, skinTone, 7, 24 + bobY - legOffset / 2, 3, 2); // hands

        pRect(ctx, sweaterMid, 22, 16 + bobY + legOffset / 2, 3, 8);
        pRect(ctx, skinTone, 22, 24 + bobY + legOffset / 2, 3, 2);

        // Head & Face
        pRect(ctx, skinTone, 11, 7 + bobY, 10, 8);
        pRect(ctx, skinShadow, 11, 14 + bobY, 10, 1);

        // Expressive eyes
        pRect(ctx, '#1c1b18', 12, 10 + bobY, 2, 3);
        pDot(ctx, '#ffffff', 12, 10 + bobY); // eye sparkle
        pRect(ctx, '#1c1b18', 18, 10 + bobY, 2, 3);
        pDot(ctx, '#ffffff', 18, 10 + bobY);

        // Subtle blush
        pRect(ctx, '#f2a7a7', 11, 13 + bobY, 2, 1);
        pRect(ctx, '#f2a7a7', 19, 13 + bobY, 2, 1);

        // Hair (layered messy indie bangs & fluffy top)
        pRect(ctx, hairDark, 10, 3 + bobY, 12, 5);
        pRect(ctx, hairMid, 11, 2 + bobY, 10, 6);
        pRect(ctx, hairLight, 12, 3 + bobY, 6, 2);
        // Bangs over forehead
        pRect(ctx, hairMid, 10, 7 + bobY, 3, 3);
        pRect(ctx, hairDark, 14, 7 + bobY, 3, 2);
        pRect(ctx, hairMid, 18, 7 + bobY, 4, 3);
      } else if (dir === 'up') {
        // Facing Up (Back view)
        // Legs & Shoes
        pRect(ctx, pantsColor, 11 - legOffset, 24, 4, 6);
        pRect(ctx, pantsColor, 17 + legOffset, 24, 4, 6);
        pRect(ctx, shoeColor, 10 - legOffset, 30, 5, 3);
        pRect(ctx, shoeColor, 17 + legOffset, 30, 5, 3);

        // Sweater Back
        pRect(ctx, sweaterDark, 9, 14 + bobY, 14, 11);
        pRect(ctx, sweaterMid, 10, 15 + bobY, 12, 9);
        pRect(ctx, sweaterLight, 11, 16 + bobY, 10, 4);
        pRect(ctx, sweaterTrim, 12, 13 + bobY, 8, 2); // collar back

        // Arms swinging
        pRect(ctx, sweaterMid, 7, 16 + bobY + legOffset / 2, 3, 8);
        pRect(ctx, sweaterMid, 22, 16 + bobY - legOffset / 2, 3, 8);

        // Full back of hair
        pRect(ctx, hairDark, 9, 3 + bobY, 14, 12);
        pRect(ctx, hairMid, 10, 4 + bobY, 12, 10);
        pRect(ctx, hairLight, 12, 5 + bobY, 8, 3);
      } else if (dir === 'left') {
        // Side view Left
        // Legs
        pRect(ctx, pantsColor, 13 + legOffset, 24, 4, 6);
        pRect(ctx, pantsColor, 15 - legOffset, 24, 4, 6);
        pRect(ctx, shoeColor, 11 + legOffset, 30, 6, 3);
        pRect(ctx, shoeColor, 13 - legOffset, 30, 6, 3);

        // Sweater
        pRect(ctx, sweaterDark, 11, 14 + bobY, 10, 11);
        pRect(ctx, sweaterMid, 12, 15 + bobY, 8, 9);
        pRect(ctx, sweaterLight, 12, 16 + bobY, 5, 4);

        // Left arm in profile
        pRect(ctx, sweaterMid, 13, 16 + bobY - legOffset / 2, 4, 8);
        pRect(ctx, skinTone, 13, 24 + bobY - legOffset / 2, 3, 2);

        // Face profile
        pRect(ctx, skinTone, 9, 7 + bobY, 9, 8);
        pRect(ctx, '#1c1b18', 10, 10 + bobY, 2, 3); // eye profile
        pDot(ctx, '#ffffff', 10, 10 + bobY);
        pDot(ctx, '#f2a7a7', 9, 13 + bobY); // blush

        // Hair side profile
        pRect(ctx, hairDark, 10, 3 + bobY, 12, 11);
        pRect(ctx, hairMid, 11, 4 + bobY, 10, 9);
        pRect(ctx, hairLight, 13, 4 + bobY, 6, 2);
        pRect(ctx, hairMid, 8, 6 + bobY, 4, 3); // front bangs
      } else if (dir === 'right') {
        // Side view Right (Mirrored left)
        pRect(ctx, pantsColor, 15 - legOffset, 24, 4, 6);
        pRect(ctx, pantsColor, 13 + legOffset, 24, 4, 6);
        pRect(ctx, shoeColor, 15 - legOffset, 30, 6, 3);
        pRect(ctx, shoeColor, 13 + legOffset, 30, 6, 3);

        pRect(ctx, sweaterDark, 11, 14 + bobY, 10, 11);
        pRect(ctx, sweaterMid, 12, 15 + bobY, 8, 9);
        pRect(ctx, sweaterLight, 15, 16 + bobY, 5, 4);

        pRect(ctx, sweaterMid, 15, 16 + bobY + legOffset / 2, 4, 8);
        pRect(ctx, skinTone, 16, 24 + bobY + legOffset / 2, 3, 2);

        pRect(ctx, skinTone, 14, 7 + bobY, 9, 8);
        pRect(ctx, '#1c1b18', 20, 10 + bobY, 2, 3);
        pDot(ctx, '#ffffff', 20, 10 + bobY);
        pDot(ctx, '#f2a7a7', 21, 13 + bobY);

        pRect(ctx, hairDark, 10, 3 + bobY, 12, 11);
        pRect(ctx, hairMid, 11, 4 + bobY, 10, 9);
        pRect(ctx, hairLight, 13, 4 + bobY, 6, 2);
        pRect(ctx, hairMid, 20, 6 + bobY, 4, 3);
      }

      playerAtlas[dir].push(c);
    }
  });

  return playerAtlas;
}

// ----------------------------------------------------
// Build & Cache All Sprites
// ----------------------------------------------------
export function getSpriteAtlas(): SpriteAtlas {
  if (cachedAtlas) {
    return cachedAtlas;
  }

  cachedAtlas = {
    floor_wood: buildFloorWood(),
    wall_top: buildWallTop(),
    wall_middle: buildWallMiddle(),
    wall_bottom: buildWallBottom(),
    rug: buildRug(),
    sofa: buildSofa(),
    coffee_table: buildCoffeeTable(),
    tv_console: buildTvConsole(),
    window_view: buildWindow(),
    bookshelf: buildBookshelf(),
    standing_lamp: buildStandingLamp(),
    plant_large: buildLargePlant(),
    plant_small: buildSmallPlant(),
    wall_clock: buildWallClock(),
    framed_art: buildFramedArt(),
    sleeping_cat: buildSleepingCat(),
    player: buildPlayerFrames(DEFAULT_SOPREMISH_PALETTE),
    player_grape: buildPlayerFrames(GRAPE_PALETTE),
    ...getHouseSpritesDictionary(),
  };

  return cachedAtlas;
}
