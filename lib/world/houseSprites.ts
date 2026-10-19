// ============================================================================
// BERK HOUSE — Procedural Pixel-Art Sprite Builders for All 8 Additional Rooms
// Kitchen, Bedroom, Balcony, Garage, Theatre, Sopremish's Lab, Bathroom, Store Room
// ============================================================================

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

function pDot(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ----------------------------------------------------------------------------
// 1. FLOOR TILES (32x32)
// ----------------------------------------------------------------------------

export function buildFloorKitchen(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Modern porcelain tile checkerboard with subtle marble veining
  pRect(ctx, '#d6d3cb', 0, 0, 32, 32);
  // Quadrants
  pRect(ctx, '#e8e5dc', 1, 1, 15, 15);
  pRect(ctx, '#b5b2aa', 17, 1, 14, 15);
  pRect(ctx, '#b5b2aa', 1, 17, 15, 14);
  pRect(ctx, '#e8e5dc', 17, 17, 14, 14);

  // Subtle marble flecks
  pDot(ctx, '#c8c5bc', 5, 4);
  pDot(ctx, '#c8c5bc', 9, 8);
  pDot(ctx, '#9e9b94', 21, 6);
  pDot(ctx, '#9e9b94', 6, 22);

  // Grout borders
  ctx.fillStyle = '#8a8780';
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 16, 32, 1);
  ctx.fillRect(0, 0, 1, 32);
  ctx.fillRect(16, 0, 1, 32);

  return c;
}

export function buildFloorBathroom(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Refreshing turquoise / aqua mosaic tile
  pRect(ctx, '#1e3842', 0, 0, 32, 32);

  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 4; col++) {
      const colors = ['#388e9c', '#4aa3b3', '#2d7885', '#5eb7c7'];
      const pick = colors[(r * 3 + col * 5) % colors.length];
      pRect(ctx, pick, col * 8 + 1, r * 8 + 1, 7, 7);
      pDot(ctx, '#ffffff', col * 8 + 2, r * 8 + 2); // Ceramic sheen
    }
  }

  // Clean white grout
  ctx.fillStyle = '#7accd9';
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 8, 32, 1);
  ctx.fillRect(0, 16, 32, 1);
  ctx.fillRect(0, 24, 32, 1);
  ctx.fillRect(0, 0, 1, 32);
  ctx.fillRect(8, 0, 1, 32);
  ctx.fillRect(16, 0, 1, 32);
  ctx.fillRect(24, 0, 1, 32);

  return c;
}

export function buildFloorTheatre(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Deep cinema crimson velvet carpet with starburst motif
  pRect(ctx, '#3a0d18', 0, 0, 32, 32);
  pRect(ctx, '#541524', 2, 2, 28, 28);
  pRect(ctx, '#6b1c2f', 6, 6, 20, 20);

  // Subtle gold accent diamond in center
  pRect(ctx, '#9e7529', 14, 14, 4, 4);
  pDot(ctx, '#e0aa3e', 15, 15);
  pDot(ctx, '#e0aa3e', 16, 16);

  // Corner accents
  pDot(ctx, '#801b33', 3, 3);
  pDot(ctx, '#801b33', 28, 3);
  pDot(ctx, '#801b33', 3, 28);
  pDot(ctx, '#801b33', 28, 28);

  return c;
}

export function buildFloorLab(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Graphite anti-static tech floor with glowing cyan micro-channels
  pRect(ctx, '#141a24', 0, 0, 32, 32);
  pRect(ctx, '#1f2735', 1, 1, 30, 30);
  pRect(ctx, '#2a3447', 3, 3, 26, 26);

  // Anti-slip diamond plate studs
  for (let y = 6; y < 28; y += 6) {
    for (let x = 6; x < 28; x += 6) {
      pDot(ctx, '#3d4b63', x, y);
      pDot(ctx, '#12161f', x + 1, y + 1);
    }
  }

  // Cyan corner markers
  pDot(ctx, '#00e5ff', 2, 2);
  pDot(ctx, '#00e5ff', 29, 2);
  pDot(ctx, '#00e5ff', 2, 29);
  pDot(ctx, '#00e5ff', 29, 29);

  return c;
}

export function buildFloorGarage(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Industrial concrete slab with expansion joint
  pRect(ctx, '#4a4f54', 0, 0, 32, 32);
  pRect(ctx, '#5a6066', 1, 1, 30, 30);
  pRect(ctx, '#656b73', 2, 2, 28, 28);

  // Expansion joint cut
  pRect(ctx, '#32363a', 0, 15, 32, 2);
  pRect(ctx, '#737a82', 0, 17, 32, 1);

  // Subtle oil/work speckles
  pDot(ctx, '#3d4247', 7, 6);
  pDot(ctx, '#363a3d', 22, 10);
  pDot(ctx, '#3d4247', 14, 23);

  return c;
}

export function buildFloorBalcony(): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Weathered cedar outdoor decking planks
  pRect(ctx, '#23170e', 0, 0, 32, 32);

  // Planks
  pRect(ctx, '#8a5a36', 0, 1, 32, 7);
  pRect(ctx, '#9c673e', 0, 9, 32, 7);
  pRect(ctx, '#805331', 0, 17, 32, 7);
  pRect(ctx, '#915f39', 0, 25, 32, 6);

  // Decking screws / grain
  pDot(ctx, '#472d1a', 4, 4);
  pDot(ctx, '#472d1a', 26, 4);
  pDot(ctx, '#472d1a', 8, 12);
  pDot(ctx, '#472d1a', 22, 12);
  pDot(ctx, '#472d1a', 5, 20);
  pDot(ctx, '#472d1a', 25, 20);

  return c;
}

// ----------------------------------------------------------------------------
// 2. WALL TILES (32x32 for top, middle, bottom)
// ----------------------------------------------------------------------------

export function buildWallKitchen(part: 'top' | 'middle' | 'bottom'): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  if (part === 'top') {
    pRect(ctx, '#26292b', 0, 0, 32, 32);
    pRect(ctx, '#54595e', 0, 28, 32, 4);
  } else if (part === 'middle') {
    // White subway tile
    pRect(ctx, '#f0efe9', 0, 0, 32, 32);
    ctx.fillStyle = '#b8b6af';
    ctx.fillRect(0, 0, 32, 1);
    ctx.fillRect(0, 11, 32, 1);
    ctx.fillRect(0, 21, 32, 1);
    ctx.fillRect(16, 0, 1, 11);
    ctx.fillRect(8, 11, 1, 10);
    ctx.fillRect(24, 11, 1, 10);
    ctx.fillRect(16, 21, 1, 11);
  } else {
    // Bottom wall baseboard with stainless kickplate
    pRect(ctx, '#f0efe9', 0, 0, 32, 20);
    ctx.fillStyle = '#b8b6af';
    ctx.fillRect(0, 10, 32, 1);
    ctx.fillRect(16, 0, 1, 10);
    // Stainless baseboard
    pRect(ctx, '#8f959c', 0, 20, 32, 12);
    pRect(ctx, '#b8bec7', 0, 20, 32, 2);
    pRect(ctx, '#575c63', 0, 30, 32, 2);
  }

  return c;
}

export function buildWallTheatre(part: 'top' | 'middle' | 'bottom'): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  if (part === 'top') {
    pRect(ctx, '#0c070a', 0, 0, 32, 32);
    pRect(ctx, '#3b121c', 0, 28, 32, 4);
  } else if (part === 'middle') {
    // Acoustic padded wall with diamond quilting
    pRect(ctx, '#260a12', 0, 0, 32, 32);
    pRect(ctx, '#38101b', 2, 2, 28, 28);
    pDot(ctx, '#80263c', 8, 8);
    pDot(ctx, '#80263c', 24, 8);
    pDot(ctx, '#80263c', 16, 16);
    pDot(ctx, '#80263c', 8, 24);
    pDot(ctx, '#80263c', 24, 24);
  } else {
    pRect(ctx, '#260a12', 0, 0, 32, 22);
    pRect(ctx, '#140509', 0, 22, 32, 10);
    pRect(ctx, '#d4af37', 0, 20, 32, 2); // Gold cinema trim
  }

  return c;
}

export function buildWallLab(part: 'top' | 'middle' | 'bottom'): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  if (part === 'top') {
    pRect(ctx, '#090d14', 0, 0, 32, 32);
    pRect(ctx, '#182436', 0, 28, 32, 4);
    pDot(ctx, '#00e5ff', 16, 30);
  } else if (part === 'middle') {
    // Cyber metallic wall panel with blue trace lines
    pRect(ctx, '#131b26', 0, 0, 32, 32);
    pRect(ctx, '#1c2838', 2, 2, 28, 28);
    pRect(ctx, '#00e5ff', 0, 15, 32, 1); // Neon trace conduit
    pRect(ctx, '#28384f', 6, 6, 20, 6);
  } else {
    pRect(ctx, '#131b26', 0, 0, 32, 20);
    pRect(ctx, '#0d121a', 0, 20, 32, 12);
    pRect(ctx, '#00e5ff', 0, 19, 32, 2); // Glowing base line
  }

  return c;
}

export function buildWallGarage(part: 'top' | 'middle' | 'bottom'): HTMLCanvasElement {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  if (part === 'top') {
    pRect(ctx, '#1f2224', 0, 0, 32, 32);
    pRect(ctx, '#363a3d', 0, 28, 32, 4);
  } else if (part === 'middle') {
    // Industrial workshop brick & pegboard
    pRect(ctx, '#4a4f54', 0, 0, 32, 32);
    // Pegboard holes
    for (let py = 4; py < 30; py += 6) {
      for (let px = 4; px < 30; px += 6) {
        pDot(ctx, '#202326', px, py);
      }
    }
  } else {
    pRect(ctx, '#4a4f54', 0, 0, 32, 20);
    pRect(ctx, '#2a2e30', 0, 20, 32, 12);
    pRect(ctx, '#f5a623', 0, 19, 32, 2); // Yellow hazard trim
  }

  return c;
}

// ----------------------------------------------------------------------------
// 3. DOORWAYS & EXITS (Pixel Art Frames & Indicators)
// ----------------------------------------------------------------------------

export function buildDoorwayArch(): HTMLCanvasElement {
  const c = createCanvas(48, 64);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Doorway opening (interior void with welcoming amber radiance)
  pRect(ctx, '#1c1510', 6, 12, 36, 52);
  pRect(ctx, '#362315', 8, 14, 32, 50);

  // Soft interior floor glow
  const glow = ctx.createLinearGradient(24, 64, 24, 20);
  glow.addColorStop(0, 'rgba(255, 210, 120, 0.45)');
  glow.addColorStop(1, 'rgba(255, 210, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(8, 20, 32, 44);

  // Wooden outer frame
  pRect(ctx, '#663e20', 2, 6, 44, 8); // Top lintel
  pRect(ctx, '#7d4d29', 4, 8, 40, 4);
  pRect(ctx, '#663e20', 2, 14, 6, 50); // Left post
  pRect(ctx, '#7d4d29', 4, 14, 3, 50);
  pRect(ctx, '#663e20', 40, 14, 6, 50); // Right post
  pRect(ctx, '#543319', 41, 14, 3, 50);

  // Overhead exit marker / lamp
  pRect(ctx, '#00e5ff', 20, 2, 8, 4);
  pDot(ctx, '#ffffff', 23, 3);

  return c;
}

export function buildDoorMat(): HTMLCanvasElement {
  const c = createCanvas(40, 20);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, '#5c4530', 0, 0, 40, 20);
  pRect(ctx, '#7a5d42', 2, 2, 36, 16);
  pRect(ctx, '#3d2c1d', 4, 4, 32, 12);
  pRect(ctx, '#9e7b57', 6, 6, 28, 8);

  // Welcome line
  pRect(ctx, '#ffeaa7', 10, 9, 20, 2);

  return c;
}

// ----------------------------------------------------------------------------
// 4. KITCHEN FURNITURE & EQUIPMENT
// ----------------------------------------------------------------------------

export function buildFridgeDouble(): HTMLCanvasElement {
  const c = createCanvas(44, 76);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 70, 40, 6);

  // Stainless steel body
  pRect(ctx, '#7a818c', 2, 2, 40, 70);
  pRect(ctx, '#9ea6b3', 4, 4, 36, 66);

  // Left & Right doors
  pRect(ctx, '#b5bdc9', 5, 5, 16, 40);
  pRect(ctx, '#cbd4e0', 23, 5, 16, 40);

  // Door handles
  pRect(ctx, '#40454d', 19, 14, 2, 22);
  pRect(ctx, '#40454d', 23, 14, 2, 22);

  // Lower freezer drawers
  pRect(ctx, '#b5bdc9', 5, 48, 34, 20);
  pRect(ctx, '#40454d', 14, 52, 16, 3);

  // Cute colorful fridge magnets & sticky notes!
  pRect(ctx, '#ff4757', 8, 8, 4, 4); // Red heart magnet
  pRect(ctx, '#2ed573', 14, 18, 5, 6); // Green sticky note
  pRect(ctx, '#ffa502', 26, 10, 6, 8); // Yellow polaroid
  pDot(ctx, '#00d2d3', 28, 24); // Blue round magnet

  return c;
}

export function buildKitchenCounterSink(): HTMLCanvasElement {
  const c = createCanvas(68, 52);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 46, 64, 6);

  // Lower wooden cabinets
  pRect(ctx, '#4a3320', 2, 14, 64, 34);
  pRect(ctx, '#63462c', 4, 16, 60, 30);

  // Two cabinet doors with brass handles
  pRect(ctx, '#7a5738', 6, 18, 26, 26);
  pRect(ctx, '#7a5738', 36, 18, 26, 26);
  pRect(ctx, '#ffd32a', 28, 28, 2, 6);
  pRect(ctx, '#ffd32a', 38, 28, 2, 6);

  // White marble countertop
  pRect(ctx, '#d6d9de', 0, 4, 68, 12);
  pRect(ctx, '#edf0f5', 1, 5, 66, 9);

  // Stainless steel sink basin
  pRect(ctx, '#616770', 16, 6, 24, 9);
  pRect(ctx, '#8a929e', 17, 7, 22, 7);

  // Chrome gooseneck faucet
  pRect(ctx, '#ffffff', 27, 0, 3, 7);
  pRect(ctx, '#d0d7de', 25, 0, 2, 2);

  return c;
}

export function buildKitchenStoveOven(): HTMLCanvasElement {
  const c = createCanvas(50, 62);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Shadow
  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 56, 46, 6);

  // Stove body
  pRect(ctx, '#2f3542', 2, 8, 46, 50);
  pRect(ctx, '#434b5c', 4, 10, 42, 46);

  // Ceramic glass cooktop with 4 burner rings
  pRect(ctx, '#1e222b', 2, 8, 46, 12);
  pRect(ctx, '#ff4757', 8, 11, 6, 6); // Glowing red burner
  pRect(ctx, '#ff6b81', 9, 12, 4, 4);
  pRect(ctx, '#3d4454', 22, 11, 6, 6);
  pRect(ctx, '#3d4454', 36, 11, 6, 6);

  // Control knobs
  for (let k = 8; k < 44; k += 8) {
    pRect(ctx, '#ced6e0', k, 22, 3, 3);
  }

  // Oven door with glass window
  pRect(ctx, '#1e222b', 6, 28, 38, 24);
  pRect(ctx, '#403828', 10, 32, 30, 16); // Oven interior light
  pRect(ctx, '#ced6e0', 14, 29, 22, 2); // Handle

  // Overhead range hood
  pRect(ctx, '#747d8c', 8, 0, 34, 8);
  pRect(ctx, '#a4b0be', 10, 1, 30, 5);

  return c;
}

export function buildDiningTableSet(): HTMLCanvasElement {
  const c = createCanvas(86, 58);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Floor shadow
  pRect(ctx, 'rgba(0,0,0,0.3)', 4, 48, 78, 8);

  // Chairs behind table
  pRect(ctx, '#613b1f', 14, 4, 18, 20); // Left chair backrest
  pRect(ctx, '#4a7556', 16, 6, 14, 16); // Green cushion
  pRect(ctx, '#613b1f', 54, 4, 18, 20); // Right chair backrest
  pRect(ctx, '#4a7556', 56, 6, 14, 16);

  // Solid oak tabletop
  pRect(ctx, '#5e381b', 4, 16, 78, 28);
  pRect(ctx, '#82512a', 6, 18, 74, 22);
  pRect(ctx, '#9c6437', 8, 20, 70, 18);

  // Table runner / cloth
  pRect(ctx, '#f1f2f6', 32, 18, 22, 22);
  pRect(ctx, '#dfe4ea', 34, 20, 18, 18);

  // Bowl of fruit on center of table
  pRect(ctx, '#ffffff', 39, 24, 8, 5);
  pDot(ctx, '#ff4757', 41, 23); // Red apple
  pDot(ctx, '#ffa502', 43, 22); // Orange
  pDot(ctx, '#2ed573', 44, 24); // Green pear

  // Two place mats with coffee mugs
  pRect(ctx, '#ced6e0', 12, 24, 10, 8);
  pRect(ctx, '#ff6b81', 15, 25, 4, 5); // Pink mug
  pRect(ctx, '#ced6e0', 64, 24, 10, 8);
  pRect(ctx, '#00d2d3', 67, 25, 4, 5); // Cyan mug

  // Table legs
  pRect(ctx, '#472a13', 8, 38, 5, 14);
  pRect(ctx, '#472a13', 73, 38, 5, 14);

  return c;
}

export function buildKitchenShelf(): HTMLCanvasElement {
  const c = createCanvas(56, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Wood wall shelf
  pRect(ctx, '#5e381b', 2, 16, 52, 4);
  pRect(ctx, '#82512a', 3, 17, 50, 2);

  // Brackets
  pRect(ctx, '#2f3542', 6, 20, 3, 8);
  pRect(ctx, '#2f3542', 47, 20, 3, 8);

  // Items on shelf
  pRect(ctx, '#2ed573', 6, 6, 5, 10); // Green olive oil bottle
  pRect(ctx, '#ffa502', 13, 8, 4, 8); // Honey jar
  pRect(ctx, '#ff4757', 19, 9, 4, 7); // Spice bottle
  pRect(ctx, '#ffffff', 25, 7, 7, 9); // Sugar jar
  pRect(ctx, '#00d2d3', 34, 8, 5, 8); // Tea tin
  pRect(ctx, '#ced6e0', 41, 6, 8, 10); // Coffee canister

  return c;
}

// ----------------------------------------------------------------------------
// 5. BEDROOM FURNITURE
// ----------------------------------------------------------------------------

export function buildBedDouble(): HTMLCanvasElement {
  const c = createCanvas(70, 78);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Floor shadow
  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 70, 66, 8);

  // Wooden headboard
  pRect(ctx, '#4a2f1a', 4, 2, 62, 24);
  pRect(ctx, '#694427', 6, 4, 58, 20);

  // Bed mattress & frame
  pRect(ctx, '#362112', 4, 24, 62, 50);
  pRect(ctx, '#f1f2f6', 6, 26, 58, 46);

  // Two soft pillows at head
  pRect(ctx, '#ffffff', 10, 16, 22, 14);
  pRect(ctx, '#dfe4ea', 12, 18, 18, 10);
  pRect(ctx, '#ffffff', 38, 16, 22, 14);
  pRect(ctx, '#dfe4ea', 40, 18, 18, 10);

  // Warm cozy duvet (lavender / warm plum)
  pRect(ctx, '#6c5ce7', 6, 32, 58, 40);
  pRect(ctx, '#a29bfe', 8, 34, 54, 36);

  // Folded throw blanket at foot of bed
  pRect(ctx, '#fd79a8', 6, 54, 58, 16);
  pRect(ctx, '#e84393', 8, 56, 54, 12);

  return c;
}

export function buildNightstand(): HTMLCanvasElement {
  const c = createCanvas(30, 42);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 38, 26, 4);

  // Table body
  pRect(ctx, '#4a2f1a', 2, 16, 26, 22);
  pRect(ctx, '#694427', 4, 18, 22, 18);

  // Drawer with brass handle
  pRect(ctx, '#805331', 6, 20, 18, 8);
  pRect(ctx, '#ffd32a', 13, 23, 4, 2);

  // Bedside lamp
  pRect(ctx, '#f1f2f6', 10, 0, 10, 9); // Lampshade
  pRect(ctx, '#ffeaa7', 11, 1, 8, 7);
  pRect(ctx, '#d63031', 14, 9, 2, 7); // Base pole
  pRect(ctx, '#d63031', 11, 15, 8, 2); // Base

  // Digital clock (glowing green 10:19)
  pRect(ctx, '#2d3436', 4, 12, 7, 5);
  pDot(ctx, '#00b894', 6, 14);

  return c;
}

export function buildWardrobeLarge(): HTMLCanvasElement {
  const c = createCanvas(58, 86);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 80, 54, 6);

  // Main cabinet
  pRect(ctx, '#362112', 2, 6, 54, 76);
  pRect(ctx, '#54341c', 4, 8, 50, 72);

  // Top decorative crown molding
  pRect(ctx, '#2b1a0e', 0, 0, 58, 8);
  pRect(ctx, '#6e4526', 2, 2, 54, 4);

  // Left & right double doors
  pRect(ctx, '#694224', 6, 12, 21, 64);
  pRect(ctx, '#694224', 31, 12, 21, 64);

  // Door panel details
  pRect(ctx, '#7d502d', 8, 16, 17, 26);
  pRect(ctx, '#7d502d', 8, 46, 17, 26);
  pRect(ctx, '#7d502d', 33, 16, 17, 26);
  pRect(ctx, '#7d502d', 33, 46, 17, 26);

  // Brass handles
  pRect(ctx, '#fdcb6e', 24, 42, 2, 8);
  pRect(ctx, '#fdcb6e', 32, 42, 2, 8);

  return c;
}

export function buildBedroomMirror(): HTMLCanvasElement {
  const c = createCanvas(30, 60);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 54, 26, 6);

  // Gold ornate arched frame
  pRect(ctx, '#d4af37', 2, 2, 26, 52);
  pRect(ctx, '#f1c40f', 3, 3, 24, 50);

  // Reflective glass
  pRect(ctx, '#dfe6e9', 5, 5, 20, 46);
  pRect(ctx, '#74b9ff', 6, 6, 18, 44);

  // Diagonal reflection highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.lineTo(16, 6);
  ctx.lineTo(6, 40);
  ctx.lineTo(6, 24);
  ctx.fill();

  // Stand legs
  pRect(ctx, '#d4af37', 4, 52, 4, 6);
  pRect(ctx, '#d4af37', 22, 52, 4, 6);

  return c;
}

export function buildVanityDesk(): HTMLCanvasElement {
  const c = createCanvas(56, 52);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 46, 52, 6);

  // Desk table
  pRect(ctx, '#4a2f1a', 2, 22, 52, 26);
  pRect(ctx, '#694427', 4, 24, 48, 22);

  // Tabletop surface
  pRect(ctx, '#805331', 0, 18, 56, 6);

  // Vanity mirror on desk
  pRect(ctx, '#d4af37', 16, 0, 24, 18);
  pRect(ctx, '#74b9ff', 18, 2, 20, 14);
  pDot(ctx, '#ffffff', 20, 4);

  // Perfume bottles and accessories on desk
  pRect(ctx, '#e84393', 8, 12, 4, 7); // Pink perfume
  pRect(ctx, '#fdcb6e', 14, 14, 4, 5); // Gold compact
  pRect(ctx, '#00cec9', 42, 13, 5, 6); // Teal lotion bottle

  // Legs
  pRect(ctx, '#362112', 4, 26, 4, 22);
  pRect(ctx, '#362112', 48, 26, 4, 22);

  return c;
}

// ----------------------------------------------------------------------------
// 6. BALCONY ASSETS
// ----------------------------------------------------------------------------

export function buildBalconyRailing(): HTMLCanvasElement {
  const c = createCanvas(64, 40);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Handrail
  pRect(ctx, '#2d3436', 0, 0, 64, 4);
  pRect(ctx, '#636e72', 0, 1, 64, 2);

  // Bottom rail
  pRect(ctx, '#2d3436', 0, 36, 64, 4);

  // Wrought-iron spindles
  for (let s = 4; s < 64; s += 8) {
    pRect(ctx, '#2d3436', s, 4, 3, 32);
    pDot(ctx, '#fdcb6e', s + 1, 16); // Gold medallion
  }

  return c;
}

export function buildPatioTable(): HTMLCanvasElement {
  const c = createCanvas(42, 42);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 34, 38, 8);

  // Round glass top with rattan border
  pRect(ctx, '#634b35', 2, 2, 38, 24);
  pRect(ctx, '#74b9ff', 4, 4, 34, 20);
  pRect(ctx, '#81ecec', 6, 6, 30, 16);

  // Two glasses of iced tea with mint & lemon
  pRect(ctx, '#ffeaa7', 12, 8, 5, 9);
  pDot(ctx, '#00b894', 13, 9); // Mint leaf
  pRect(ctx, '#ffeaa7', 25, 8, 5, 9);
  pDot(ctx, '#fdcb6e', 26, 7); // Lemon wheel

  // Tripod wicker legs
  pRect(ctx, '#4a3726', 10, 24, 3, 14);
  pRect(ctx, '#4a3726', 20, 24, 3, 14);
  pRect(ctx, '#4a3726', 30, 24, 3, 14);

  return c;
}

export function buildPatioChair(): HTMLCanvasElement {
  const c = createCanvas(32, 36);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 30, 28, 6);

  // Wicker armchair backrest
  pRect(ctx, '#634b35', 4, 2, 24, 18);
  pRect(ctx, '#7d5e42', 6, 4, 20, 14);

  // Sage green outdoor cushion
  pRect(ctx, '#55efc4', 6, 16, 20, 10);
  pRect(ctx, '#00b894', 8, 18, 16, 6);

  // Arms & legs
  pRect(ctx, '#4a3726', 2, 14, 4, 16);
  pRect(ctx, '#4a3726', 26, 14, 4, 16);
  pRect(ctx, '#382a1d', 6, 26, 3, 8);
  pRect(ctx, '#382a1d', 23, 26, 3, 8);

  return c;
}

export function buildPlanterBox(): HTMLCanvasElement {
  const c = createCanvas(52, 30);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 24, 48, 6);

  // Soil
  pRect(ctx, '#2d1d11', 4, 10, 44, 10);

  // Flowers: lavender, pink petunias, yellow marigolds, green leaves
  pRect(ctx, '#00b894', 4, 2, 44, 12);
  pRect(ctx, '#6c5ce7', 6, 0, 5, 8); // Lavender spike
  pRect(ctx, '#fd79a8', 16, 2, 6, 6); // Pink blossom
  pRect(ctx, '#f1c40f', 26, 1, 6, 6); // Yellow flower
  pRect(ctx, '#6c5ce7', 36, 0, 5, 8);
  pRect(ctx, '#e84393', 44, 3, 5, 5);

  // Wooden trough planter
  pRect(ctx, '#543820', 2, 12, 48, 16);
  pRect(ctx, '#7a522f', 4, 14, 44, 12);

  return c;
}

export function buildLemonTreePot(): HTMLCanvasElement {
  const c = createCanvas(36, 62);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 4, 56, 28, 6);

  // Terracotta pot
  pRect(ctx, '#c0392b', 6, 38, 24, 20);
  pRect(ctx, '#e17055', 8, 40, 20, 16);
  pRect(ctx, '#d63031', 4, 36, 28, 4); // Rim

  // Trunk
  pRect(ctx, '#4a2f1a', 16, 24, 4, 14);

  // Foliage crown
  pRect(ctx, '#009432', 4, 4, 28, 24);
  pRect(ctx, '#2ed573', 8, 6, 20, 20);

  // Ripe yellow lemons!
  pRect(ctx, '#f1c40f', 8, 12, 4, 5);
  pRect(ctx, '#f1c40f', 22, 10, 4, 5);
  pRect(ctx, '#f1c40f', 15, 18, 4, 5);

  return c;
}

// ----------------------------------------------------------------------------
// 7. GARAGE & WORKSHOP ASSETS
// ----------------------------------------------------------------------------

export function buildParkedCar(): HTMLCanvasElement {
  const c = createCanvas(112, 64);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Car floor shadow
  pRect(ctx, 'rgba(0,0,0,0.45)', 6, 52, 100, 10);

  // Wheels
  pRect(ctx, '#1e272e', 14, 44, 18, 16);
  pRect(ctx, '#d2dae2', 18, 48, 10, 8); // Alloy rim
  pRect(ctx, '#1e272e', 80, 44, 18, 16);
  pRect(ctx, '#d2dae2', 84, 48, 10, 8);

  // Lower chassis
  pRect(ctx, '#800c1d', 4, 34, 104, 16);
  pRect(ctx, '#c0152f', 6, 32, 100, 16);

  // Aerodynamic body & hood
  pRect(ctx, '#e81736', 8, 22, 96, 14);
  pRect(ctx, '#ff3855', 12, 24, 88, 6); // Gloss highlight

  // Cabin & Windshield (tinted blue glass)
  pRect(ctx, '#c0152f', 28, 8, 54, 16);
  pRect(ctx, '#2c3e50', 32, 10, 46, 12);
  pRect(ctx, '#74b9ff', 34, 11, 42, 8);
  pRect(ctx, '#ffffff', 36, 12, 14, 2); // Glass sheen

  // Headlights & Tail lights
  pRect(ctx, '#ffeaa7', 98, 26, 8, 6); // Bright halogen headlight
  pDot(ctx, '#ffffff', 102, 28);
  pRect(ctx, '#ff4757', 6, 26, 4, 6); // Red tail light

  // Chrome side mirror & door handle
  pRect(ctx, '#d2dae2', 74, 20, 4, 4);
  pRect(ctx, '#d2dae2', 54, 30, 6, 2);

  return c;
}

export function buildGarageWorkbench(): HTMLCanvasElement {
  const c = createCanvas(78, 54);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 48, 74, 6);

  // Heavy timber tabletop
  pRect(ctx, '#4a3319', 2, 18, 74, 10);
  pRect(ctx, '#694a27', 3, 19, 72, 6);

  // Industrial steel legs & lower shelf
  pRect(ctx, '#2f3542', 6, 28, 6, 22);
  pRect(ctx, '#2f3542', 66, 28, 6, 22);
  pRect(ctx, '#2f3542', 6, 42, 66, 4); // Lower cross-brace

  // Bench-mounted steel vise on left
  pRect(ctx, '#57606f', 8, 8, 10, 10);
  pRect(ctx, '#a4b0be', 6, 10, 14, 4);
  pRect(ctx, '#2f3542', 12, 14, 2, 6);

  // Tools on tabletop: wrench, pliers, oil can
  pRect(ctx, '#ced6e0', 30, 20, 12, 3); // Spanner
  pRect(ctx, '#e74c3c', 48, 14, 6, 9); // Red vintage oil squirt can
  pRect(ctx, '#ced6e0', 49, 10, 1, 4); // Spout

  // Storage box on lower shelf
  pRect(ctx, '#3742fa', 20, 36, 18, 10);

  return c;
}

export function buildToolChest(): HTMLCanvasElement {
  const c = createCanvas(38, 50);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 44, 34, 6);

  // Red powder-coat cabinet
  pRect(ctx, '#c0392b', 2, 4, 34, 40);
  pRect(ctx, '#e74c3c', 4, 6, 30, 36);

  // 4 Roll-out drawers with chrome pulls
  for (let d = 8; d < 38; d += 8) {
    pRect(ctx, '#962d22', 4, d, 30, 7);
    pRect(ctx, '#ced6e0', 10, d + 2, 18, 2);
  }

  // Heavy duty casters / wheels
  pRect(ctx, '#2c3e50', 5, 44, 6, 5);
  pRect(ctx, '#2c3e50', 27, 44, 6, 5);

  return c;
}

export function buildMetalShelf(): HTMLCanvasElement {
  const c = createCanvas(52, 74);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 68, 48, 6);

  // Slotted steel uprights
  pRect(ctx, '#2f3542', 2, 2, 4, 68);
  pRect(ctx, '#2f3542', 46, 2, 4, 68);

  // 3 Shelves
  pRect(ctx, '#57606f', 2, 22, 48, 4);
  pRect(ctx, '#57606f', 2, 44, 48, 4);
  pRect(ctx, '#57606f', 2, 66, 48, 4);

  // Items: Spare car tire on top
  pRect(ctx, '#1e272e', 14, 6, 24, 16);
  pRect(ctx, '#718093', 18, 10, 16, 8);

  // Middle shelf: Oil containers and battery
  pRect(ctx, '#f1c40f', 6, 30, 8, 14); // Yellow coolant jug
  pRect(ctx, '#3742fa', 18, 32, 10, 12); // Blue windshield fluid
  pRect(ctx, '#2c3e50', 32, 34, 12, 10); // Car battery with red & black terminals
  pDot(ctx, '#ff4757', 34, 32);
  pDot(ctx, '#2f3542', 41, 32);

  // Bottom shelf: Plastic storage bin
  pRect(ctx, '#2ed573', 8, 52, 24, 14);

  return c;
}

export function buildWallBicycle(): HTMLCanvasElement {
  const c = createCanvas(58, 36);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Bicycle wheels
  pRect(ctx, '#2c3e50', 2, 12, 18, 18);
  pRect(ctx, '#74b9ff', 4, 14, 14, 14);
  pRect(ctx, '#2c3e50', 38, 12, 18, 18);
  pRect(ctx, '#74b9ff', 40, 14, 14, 14);

  // Turquoise / cyan lightweight frame
  pRect(ctx, '#00d2d3', 10, 20, 18, 3);
  pRect(ctx, '#00d2d3', 20, 10, 3, 14);
  pRect(ctx, '#00d2d3', 28, 20, 18, 3);
  pRect(ctx, '#00d2d3', 36, 8, 3, 16);

  // Seat & Handlebars
  pRect(ctx, '#2f3542', 17, 8, 9, 3); // Saddle
  pRect(ctx, '#2f3542', 34, 4, 8, 4); // Handlebars

  return c;
}

// ----------------------------------------------------------------------------
// 8. THEATRE & CINEMA ASSETS
// ----------------------------------------------------------------------------

export function buildTheatreScreen(): HTMLCanvasElement {
  const c = createCanvas(148, 80);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Ambient cinema wall glow
  pRect(ctx, 'rgba(0, 229, 255, 0.12)', 0, 0, 148, 80);

  // Black velvet outer border
  pRect(ctx, '#08090a', 2, 2, 144, 76);
  pRect(ctx, '#14171a', 4, 4, 140, 72);

  // High-gain projection surface (Default standby test screen)
  pRect(ctx, '#1a2230', 8, 8, 132, 64);
  pRect(ctx, '#232e42', 10, 10, 128, 60);

  // Retro film leader countdown / BERK CINEMA mark
  pRect(ctx, '#2e3d57', 58, 28, 32, 24);
  pDot(ctx, '#00e5ff', 73, 38);
  pDot(ctx, '#00e5ff', 74, 38);
  pDot(ctx, '#00e5ff', 73, 39);
  pDot(ctx, '#00e5ff', 74, 39);

  // Gold stage trim along bottom
  pRect(ctx, '#d4af37', 4, 74, 140, 3);
  pRect(ctx, '#f1c40f', 8, 75, 132, 1);

  return c;
}

export function buildTheatreSeatsRow(): HTMLCanvasElement {
  const c = createCanvas(100, 44);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.4)', 2, 38, 96, 6);

  // Tier riser
  pRect(ctx, '#140509', 2, 26, 96, 14);

  // 3 Plush cinema armchairs
  for (let s = 4; s < 96; s += 31) {
    // Backrest
    pRect(ctx, '#6b1c2f', s + 2, 2, 22, 24);
    pRect(ctx, '#911b38', s + 4, 4, 18, 20);

    // Deep plush seat cushion
    pRect(ctx, '#911b38', s + 2, 22, 22, 14);
    pRect(ctx, '#ad2446', s + 4, 24, 18, 10);

    // Velvet armrests with cup holders
    pRect(ctx, '#4a1120', s, 14, 4, 20);
    pRect(ctx, '#4a1120', s + 22, 14, 4, 20);
    pDot(ctx, '#2f3542', s + 1, 15); // Cup holder
    pDot(ctx, '#2f3542', s + 23, 15);
  }

  // Aisle LED runner light
  pRect(ctx, '#00e5ff', 4, 39, 92, 1);

  return c;
}

export function buildPopcornMachine(): HTMLCanvasElement {
  const c = createCanvas(36, 54);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 48, 32, 6);

  // Red cinema cart base
  pRect(ctx, '#c0392b', 4, 30, 28, 18);
  pRect(ctx, '#e74c3c', 6, 32, 24, 14);
  pRect(ctx, '#ffd32a', 12, 36, 12, 4); // Gold logo

  // Large spoked cart wheels
  pRect(ctx, '#ffd32a', 2, 38, 8, 12);
  pRect(ctx, '#ffd32a', 26, 38, 8, 12);

  // Glass popping chamber with warm glowing popcorn
  pRect(ctx, '#2c3e50', 4, 8, 28, 22);
  pRect(ctx, '#ffeaa7', 6, 10, 24, 18);

  // Popping corn pieces
  for (let i = 0; i < 8; i++) {
    pDot(ctx, '#ffffff', 8 + (i * 3) % 20, 12 + (i * 4) % 14);
    pDot(ctx, '#f1c40f', 9 + (i * 5) % 18, 13 + (i * 3) % 13);
  }

  // Red top dome
  pRect(ctx, '#c0392b', 2, 0, 32, 8);
  pRect(ctx, '#e74c3c', 4, 1, 28, 5);

  return c;
}

// ----------------------------------------------------------------------------
// 9. SOPREMISH'S WORKING LAB
// ----------------------------------------------------------------------------

export function buildLabBattlestation(): HTMLCanvasElement {
  const c = createCanvas(116, 62);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.4)', 4, 54, 108, 8);

  // Ergonomic curved black tech desk
  pRect(ctx, '#0f1722', 4, 28, 108, 26);
  pRect(ctx, '#1a2433', 6, 30, 104, 22);

  // Desktop surface with RGB mousepad
  pRect(ctx, '#253347', 2, 24, 112, 8);
  pRect(ctx, '#00e5ff', 4, 30, 108, 1); // Cyan underglow LED strip

  // Giant Triple Curved Monitor Array!
  // Left Monitor (Terminal & System Logs)
  pRect(ctx, '#080c12', 4, 4, 32, 22);
  pRect(ctx, '#0a1a1f', 6, 6, 28, 18);
  pRect(ctx, '#00ff88', 8, 8, 18, 1); // Green terminal prompt
  pRect(ctx, '#00ff88', 8, 11, 14, 1);
  pRect(ctx, '#00ff88', 8, 14, 20, 1);

  // Center Main Monitor (IDE / Code Editor with colorful syntax highlighting)
  pRect(ctx, '#080c12', 38, 2, 40, 24);
  pRect(ctx, '#141d2b', 40, 4, 36, 20);
  pRect(ctx, '#ff4757', 42, 6, 8, 2); // Keyword
  pRect(ctx, '#2ed573', 52, 6, 12, 2); // Function
  pRect(ctx, '#ffa502', 44, 10, 16, 2); // String
  pRect(ctx, '#00e5ff', 44, 14, 20, 2); // Variable
  pRect(ctx, '#ced6e0', 44, 18, 14, 2); // Comment

  // Right Monitor (Live Telemetry & Real-Time Waveforms)
  pRect(ctx, '#080c12', 80, 4, 32, 22);
  pRect(ctx, '#1a1426', 82, 6, 28, 18);
  pRect(ctx, '#ff007f', 84, 10, 24, 2); // Telemetry graph
  pRect(ctx, '#00e5ff', 84, 14, 22, 2);
  pRect(ctx, '#ffd32a', 84, 18, 16, 2);

  // Backlit Mechanical Keyboard & Precision Mouse
  pRect(ctx, '#1e272e', 46, 25, 20, 6);
  pRect(ctx, '#00e5ff', 48, 26, 16, 4); // Cyan keycap backlight
  pRect(ctx, '#1e272e', 70, 26, 5, 5); // Mouse

  // Ceramic coffee mug ("CODE")
  pRect(ctx, '#ffffff', 20, 24, 5, 6);
  pDot(ctx, '#e74c3c', 22, 26);

  // Heavy steel legs
  pRect(ctx, '#0d131a', 8, 36, 6, 18);
  pRect(ctx, '#0d131a', 102, 36, 6, 18);

  return c;
}

export function buildElectronicsBench(): HTMLCanvasElement {
  const c = createCanvas(82, 54);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 48, 78, 6);

  // Sturdy anti-static work surface
  pRect(ctx, '#17202a', 2, 18, 78, 30);
  pRect(ctx, '#212f3d', 4, 20, 74, 26);
  pRect(ctx, '#2980b9', 4, 16, 74, 6); // Blue anti-static ESD mat

  // Digital Oscilloscope on left shelf
  pRect(ctx, '#2c3e50', 6, 4, 26, 16);
  pRect(ctx, '#051923', 8, 6, 22, 12);
  // Sine wave on scope screen
  pDot(ctx, '#2ecc71', 10, 12);
  pDot(ctx, '#2ecc71', 12, 10);
  pDot(ctx, '#2ecc71', 14, 8);
  pDot(ctx, '#2ecc71', 16, 10);
  pDot(ctx, '#2ecc71', 18, 12);
  pDot(ctx, '#2ecc71', 20, 14);
  pDot(ctx, '#2ecc71', 22, 12);

  // Precision soldering station with iron in stand
  pRect(ctx, '#e67e22', 36, 6, 16, 12);
  pRect(ctx, '#2d3436', 38, 8, 12, 4); // Temperature readout: 380°C
  pDot(ctx, '#ff4757', 40, 10);
  pRect(ctx, '#d2dae2', 54, 8, 3, 10); // Soldering iron tip

  // Wire spools on rack
  pRect(ctx, '#e74c3c', 62, 8, 4, 8); // Red hookup wire
  pRect(ctx, '#3498db', 68, 8, 4, 8); // Blue wire
  pRect(ctx, '#2ecc71', 74, 8, 4, 8); // Green wire

  // Breadboard with blinking circuit on mat
  pRect(ctx, '#f1f2f6', 24, 20, 20, 10);
  pDot(ctx, '#ff4757', 28, 23); // Red LED
  pDot(ctx, '#00e5ff', 36, 25); // Cyan LED

  return c;
}

export function buildPrinter3D(): HTMLCanvasElement {
  const c = createCanvas(40, 48);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 42, 36, 6);

  // Aluminum extrusion frame
  pRect(ctx, '#2d3436', 4, 4, 32, 40);
  pRect(ctx, '#1e272e', 6, 6, 28, 36);

  // Heated print bed (amber glow)
  pRect(ctx, '#e67e22', 8, 28, 24, 5);
  pRect(ctx, '#f39c12', 10, 29, 20, 3);

  // Object being printed (cyan mini dragon / gear)
  pRect(ctx, '#00e5ff', 16, 20, 8, 8);
  pDot(ctx, '#ffffff', 20, 22);

  // Gantry and hotend extruder
  pRect(ctx, '#636e72', 6, 16, 28, 3); // X-axis rail
  pRect(ctx, '#e74c3c', 18, 14, 5, 5); // Extruder body
  pDot(ctx, '#ffeaa7', 20, 19); // Hot nozzle tip

  // Spool of filament on top
  pRect(ctx, '#00cec9', 14, 0, 12, 5);

  return c;
}

export function buildServerRack(): HTMLCanvasElement {
  const c = createCanvas(44, 86);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.4)', 2, 80, 40, 6);

  // 42U Server cabinet frame
  pRect(ctx, '#0b0f14', 2, 2, 40, 80);
  pRect(ctx, '#141c26', 4, 4, 36, 76);

  // Individual rack-mounted server chassis (1U & 2U)
  for (let u = 6; u < 74; u += 10) {
    pRect(ctx, '#1c2838', 6, u, 32, 8);
    pRect(ctx, '#253447', 7, u + 1, 30, 6);

    // Blinking status LEDs & drive caddies
    pDot(ctx, '#00e5ff', 9, u + 4);
    pDot(ctx, '#2ed573', 12, u + 4);
    pDot(ctx, '#2ed573', 15, u + 4);
    pDot(ctx, u % 20 === 6 ? '#ffa502' : '#2ed573', 18, u + 4);

    // Drive bays
    pRect(ctx, '#0d131a', 23, u + 2, 13, 4);
  }

  // Tinted glass front door sheen
  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.fillRect(4, 4, 36, 76);

  return c;
}

export function buildTechBookshelf(): HTMLCanvasElement {
  const c = createCanvas(60, 80);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 74, 56, 6);

  // Black modern shelf unit
  pRect(ctx, '#121924', 2, 2, 56, 74);
  pRect(ctx, '#1a2433', 4, 4, 52, 70);

  // 4 Shelves
  pRect(ctx, '#253347', 4, 22, 52, 3);
  pRect(ctx, '#253347', 4, 42, 52, 3);
  pRect(ctx, '#253347', 4, 62, 52, 3);

  // Shelf 1: Technical books with colorful spines
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];
  for (let i = 0; i < 7; i++) {
    pRect(ctx, colors[i], 6 + i * 7, 7, 6, 15);
    pDot(ctx, '#ffffff', 8 + i * 7, 10);
  }

  // Shelf 2: Reference manuals & robot arm parts
  pRect(ctx, '#e84393', 6, 27, 8, 15);
  pRect(ctx, '#0984e3', 15, 29, 7, 13);
  pRect(ctx, '#6c5ce7', 23, 26, 9, 16);
  pRect(ctx, '#dfe6e9', 36, 32, 18, 10); // Component drawer box

  // Shelf 3: Microcontroller development boards & oscilloscope probes
  pRect(ctx, '#00b894', 6, 50, 18, 12);
  pRect(ctx, '#fdcb6e', 28, 48, 12, 14);
  pRect(ctx, '#d63031', 43, 51, 11, 11);

  // Shelf 4: Hardware toolbox & cables
  pRect(ctx, '#2d3436', 8, 67, 24, 7);
  pRect(ctx, '#e74c3c', 16, 66, 8, 2);

  return c;
}

// ----------------------------------------------------------------------------
// 10. BATHROOM FIXTURES
// ----------------------------------------------------------------------------

export function buildShowerGlass(): HTMLCanvasElement {
  const c = createCanvas(56, 80);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 74, 52, 6);

  // Chrome framing
  pRect(ctx, '#718093', 2, 2, 52, 74);
  pRect(ctx, '#dcdde1', 4, 4, 48, 70);

  // Translucent aqua glass
  pRect(ctx, '#74b9ff', 6, 6, 44, 66);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(8, 8, 12, 62); // Glass sheen

  // Rainfall chrome showerhead & mixer
  pRect(ctx, '#ffffff', 24, 8, 12, 4);
  pRect(ctx, '#718093', 28, 8, 4, 18);
  pRect(ctx, '#dcdde1', 26, 26, 8, 8); // Temperature valve

  // Pebble shower basin
  pRect(ctx, '#dfe4ea', 6, 64, 44, 8);

  return c;
}

export function buildBathroomVanity(): HTMLCanvasElement {
  const c = createCanvas(52, 56);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 50, 48, 6);

  // White porcelain vanity base
  pRect(ctx, '#dcdde1', 2, 26, 48, 26);
  pRect(ctx, '#f5f6fa', 4, 28, 44, 22);

  // Lower double doors with chrome handles
  pRect(ctx, '#718093', 22, 34, 2, 8);
  pRect(ctx, '#718093', 28, 34, 2, 8);

  // Sink basin & chrome faucet
  pRect(ctx, '#74b9ff', 14, 28, 24, 8);
  pRect(ctx, '#ffffff', 24, 22, 4, 6);

  // LED Backlit Mirror on wall
  pRect(ctx, '#00e5ff', 8, 2, 36, 20); // Cyan backlight
  pRect(ctx, '#f5f6fa', 10, 4, 32, 16);
  pRect(ctx, '#74b9ff', 12, 6, 28, 12);

  // Toothbrush cup and hand soap
  pRect(ctx, '#2ed573', 8, 22, 3, 5); // Green cup
  pRect(ctx, '#ffa502', 40, 22, 4, 5); // Soap dispenser

  return c;
}

export function buildToiletModern(): HTMLCanvasElement {
  const c = createCanvas(30, 44);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 38, 26, 6);

  // Porcelain tank
  pRect(ctx, '#dcdde1', 4, 4, 22, 18);
  pRect(ctx, '#f5f6fa', 6, 6, 18, 14);

  // Dual flush chrome button
  pRect(ctx, '#718093', 12, 6, 6, 3);

  // Bowl and closed seat
  pRect(ctx, '#dcdde1', 4, 22, 22, 18);
  pRect(ctx, '#ffffff', 6, 24, 18, 14);
  pRect(ctx, '#ced6e0', 8, 26, 14, 10);

  return c;
}

export function buildTowelRack(): HTMLCanvasElement {
  const c = createCanvas(36, 28);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Chrome wall bar
  pRect(ctx, '#dcdde1', 2, 6, 32, 4);

  // Folded fluffy towels: turquoise & peach
  pRect(ctx, '#00d2d3', 6, 8, 11, 16);
  pRect(ctx, '#ff9ff3', 19, 8, 11, 16);

  return c;
}

// ----------------------------------------------------------------------------
// 11. STORE ROOM & UTILITY
// ----------------------------------------------------------------------------

export function buildStorageShelvesWood(): HTMLCanvasElement {
  const c = createCanvas(64, 76);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 70, 60, 6);

  // Solid pine shelf framework
  pRect(ctx, '#543d2b', 2, 2, 6, 70);
  pRect(ctx, '#543d2b', 56, 2, 6, 70);

  // 3 Shelves
  pRect(ctx, '#70533a', 2, 22, 60, 4);
  pRect(ctx, '#70533a', 2, 44, 60, 4);
  pRect(ctx, '#70533a', 2, 66, 60, 4);

  // Top shelf: Labeled plastic storage bins
  pRect(ctx, '#3498db', 10, 8, 18, 14); // Blue bin
  pRect(ctx, '#ffffff', 14, 14, 10, 4); // Label
  pRect(ctx, '#2ecc71', 32, 8, 18, 14); // Green bin

  // Middle shelf: Cardboard boxes & paint cans
  pRect(ctx, '#b3824b', 10, 30, 20, 14);
  pRect(ctx, '#95a5a6', 34, 30, 10, 14); // Silver paint can
  pRect(ctx, '#e74c3c', 46, 32, 8, 12); // Red paint can

  // Bottom shelf: Heavy tool crate
  pRect(ctx, '#4a2f1a', 12, 50, 38, 16);
  pRect(ctx, '#f1c40f', 24, 56, 14, 4); // Stencil

  return c;
}

export function buildCardboardBoxesPile(): HTMLCanvasElement {
  const c = createCanvas(48, 40);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 34, 44, 6);

  // Bottom left large box
  pRect(ctx, '#9e6d38', 2, 14, 26, 22);
  pRect(ctx, '#b88247', 4, 16, 22, 18);
  pRect(ctx, '#785024', 12, 14, 4, 22); // Brown packing tape

  // Bottom right medium box
  pRect(ctx, '#8a5c2d', 26, 18, 20, 18);
  pRect(ctx, '#a6723c', 28, 20, 16, 14);

  // Top box
  pRect(ctx, '#a6723c', 12, 2, 22, 16);
  pRect(ctx, '#c48b4e', 14, 4, 18, 12);
  pRect(ctx, '#785024', 21, 2, 4, 16); // Tape
  pRect(ctx, '#c0392b', 16, 8, 6, 4); // Red "FRAGILE" mark

  return c;
}

export function buildVintageTrunk(): HTMLCanvasElement {
  const c = createCanvas(44, 32);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.35)', 2, 26, 40, 6);

  // Dark leather trunk body
  pRect(ctx, '#362112', 2, 6, 40, 22);
  pRect(ctx, '#54341c', 4, 8, 36, 18);

  // Brass hardware corner brackets & latch
  pRect(ctx, '#ffd32a', 2, 6, 4, 4);
  pRect(ctx, '#ffd32a', 38, 6, 4, 4);
  pRect(ctx, '#ffd32a', 2, 24, 4, 4);
  pRect(ctx, '#ffd32a', 38, 24, 4, 4);
  pRect(ctx, '#ffd32a', 19, 14, 6, 6); // Central latch

  // Two leather straps
  pRect(ctx, '#23150b', 10, 6, 3, 22);
  pRect(ctx, '#23150b', 31, 6, 3, 22);

  return c;
}

export function buildUtilityCleaning(): HTMLCanvasElement {
  const c = createCanvas(30, 42);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  pRect(ctx, 'rgba(0,0,0,0.3)', 2, 36, 26, 6);

  // Commercial yellow mop bucket with wringer
  pRect(ctx, '#f1c40f', 6, 22, 18, 16);
  pRect(ctx, '#f39c12', 8, 24, 14, 12);
  pRect(ctx, '#2c3e50', 16, 16, 8, 8); // Wringer press

  // Upright mop standing in bucket
  pRect(ctx, '#8a5c2d', 10, 2, 3, 24); // Handle
  pRect(ctx, '#ecf0f1', 8, 24, 7, 8); // Cotton yarn mop head

  return c;
}

// ----------------------------------------------------------------------------
// Export builder dictionary for easy merging into SpriteAtlas
// ----------------------------------------------------------------------------

export function getHouseSpritesDictionary(): Record<string, HTMLCanvasElement> {
  return {
    // Floors
    floor_kitchen: buildFloorKitchen(),
    floor_bathroom: buildFloorBathroom(),
    floor_theatre: buildFloorTheatre(),
    floor_lab: buildFloorLab(),
    floor_garage: buildFloorGarage(),
    floor_balcony: buildFloorBalcony(),

    // Walls
    wall_kitchen_top: buildWallKitchen('top'),
    wall_kitchen_mid: buildWallKitchen('middle'),
    wall_kitchen_bot: buildWallKitchen('bottom'),
    wall_theatre_top: buildWallTheatre('top'),
    wall_theatre_mid: buildWallTheatre('middle'),
    wall_theatre_bot: buildWallTheatre('bottom'),
    wall_lab_top: buildWallLab('top'),
    wall_lab_mid: buildWallLab('middle'),
    wall_lab_bot: buildWallLab('bottom'),
    wall_garage_top: buildWallGarage('top'),
    wall_garage_mid: buildWallGarage('middle'),
    wall_garage_bot: buildWallGarage('bottom'),

    // Doorways
    doorway_arch: buildDoorwayArch(),
    door_mat: buildDoorMat(),

    // Kitchen
    fridge_double: buildFridgeDouble(),
    kitchen_counter_sink: buildKitchenCounterSink(),
    kitchen_stove_oven: buildKitchenStoveOven(),
    dining_table_set: buildDiningTableSet(),
    kitchen_shelf: buildKitchenShelf(),

    // Bedroom
    bed_double: buildBedDouble(),
    nightstand: buildNightstand(),
    wardrobe_large: buildWardrobeLarge(),
    bedroom_mirror: buildBedroomMirror(),
    vanity_desk: buildVanityDesk(),

    // Balcony
    balcony_railing: buildBalconyRailing(),
    patio_table: buildPatioTable(),
    patio_chair: buildPatioChair(),
    planter_box: buildPlanterBox(),
    lemon_tree_pot: buildLemonTreePot(),

    // Garage
    parked_car: buildParkedCar(),
    garage_workbench: buildGarageWorkbench(),
    tool_chest: buildToolChest(),
    metal_shelf: buildMetalShelf(),
    wall_bicycle: buildWallBicycle(),

    // Theatre
    theatre_screen: buildTheatreScreen(),
    theatre_seats_row: buildTheatreSeatsRow(),
    popcorn_machine: buildPopcornMachine(),

    // Sopremish's Lab
    lab_battlestation: buildLabBattlestation(),
    electronics_bench: buildElectronicsBench(),
    printer_3d: buildPrinter3D(),
    server_rack: buildServerRack(),
    tech_bookshelf: buildTechBookshelf(),

    // Bathroom
    shower_glass: buildShowerGlass(),
    bathroom_vanity: buildBathroomVanity(),
    toilet_modern: buildToiletModern(),
    towel_rack: buildTowelRack(),

    // Store Room
    storage_shelves_wood: buildStorageShelvesWood(),
    cardboard_boxes_pile: buildCardboardBoxesPile(),
    vintage_trunk: buildVintageTrunk(),
    utility_cleaning: buildUtilityCleaning(),
  };
}
