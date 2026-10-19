import {
  RoomDefinition,
  PlayerState,
  InteractiveObject,
  RoomObject,
  CameraState,
  Doorway,
} from './types';
import { SpriteAtlas } from './pixelSprites';
import { HOUSE_ZONES } from './roomData';

interface RenderableItem {
  type: 'furniture' | 'player';
  depthY: number;
  data: RoomObject | PlayerState;
}

export interface RoomBannerState {
  title: string;
  icon: string;
  alpha: number; // 0 to 1
}

export function renderHouseRoom(
  ctx: CanvasRenderingContext2D,
  room: RoomDefinition,
  atlas: SpriteAtlas,
  players: PlayerState[],
  localPlayerId: string,
  nearbyInteractive: InteractiveObject | null,
  timeSec: number,
  camera?: CameraState,
  viewport?: { width: number; height: number },
  screenVideo?: HTMLVideoElement | null,
  nearbyDoor?: Doorway | null,
  roomBanner?: RoomBannerState | null
) {
  const { pixelWidth, pixelHeight, tileSize } = room;
  const vpWidth = viewport ? viewport.width : pixelWidth;
  const vpHeight = viewport ? viewport.height : pixelHeight;

  // 1. CLEAR VIEWPORT
  ctx.clearRect(0, 0, vpWidth, vpHeight);
  ctx.fillStyle = '#06080c';
  ctx.fillRect(0, 0, vpWidth, vpHeight);

  ctx.save();

  if (camera && viewport) {
    // Center viewport and apply camera pan and zoom
    ctx.translate(Math.round(vpWidth / 2), Math.round(vpHeight / 2));
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  }

  // Soft architectural foundation shadow around entire house
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(20, 20, pixelWidth + 20, pixelHeight + 20);

  // 2. SCENIC BALCONY VISTA BACKDROP (South-East Exterior)
  const balconyZone = HOUSE_ZONES.find((z) => z.id === 'balcony');
  if (balconyZone) {
    const bx = balconyZone.bounds.x;
    const by = balconyZone.bounds.y + balconyZone.bounds.height - 40;
    const bw = balconyZone.bounds.width + 120;
    const bh = 180;

    const skyGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    skyGrad.addColorStop(0, '#1c1b33'); // Dusk violet
    skyGrad.addColorStop(0.5, '#5c3d5e'); // Sunset amber
    skyGrad.addColorStop(1, '#e17055'); // Horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(bx, by, bw, bh);

    // Mountain silhouettes in background
    ctx.fillStyle = '#1e1828';
    ctx.beginPath();
    ctx.moveTo(bx, by + bh);
    ctx.lineTo(bx + 60, by + 40);
    ctx.lineTo(bx + 200, by + 80);
    ctx.lineTo(bx + 380, by + 30);
    ctx.lineTo(bx + 540, by + 70);
    ctx.lineTo(bx + 720, by + 36);
    ctx.lineTo(bx + bw, by + 60);
    ctx.lineTo(bx + bw, by + bh);
    ctx.closePath();
    ctx.fill();

    // Distant stars
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 80, by + 14, 2, 2);
    ctx.fillRect(bx + 240, by + 20, 2, 2);
    ctx.fillRect(bx + 480, by + 12, 2, 2);
    ctx.fillRect(bx + 760, by + 18, 2, 2);
    ctx.fillRect(bx + 920, by + 10, 2, 2);
  }

  // 3. FLOOR TILES FOR ALL 9 ROOMS
  for (const zone of HOUSE_ZONES) {
    const floorKey = zone.floorSpriteKey || 'floor_wood';
    const floorSprite = (atlas as any)[floorKey] || atlas.floor_wood;

    const startX = zone.bounds.x;
    const endX = zone.bounds.x + zone.bounds.width;
    const startY = zone.bounds.y;
    const endY = zone.bounds.y + zone.bounds.height;

    for (let y = startY; y < endY; y += tileSize) {
      for (let x = startX; x < endX; x += tileSize) {
        if (floorSprite) {
          ctx.drawImage(floorSprite, x, y);
        }
      }
    }
  }

  // 4. FLAT GROUND DECOR (Rugs & Doorway Mats)
  for (const item of room.furniture) {
    if (item.spriteKey === 'rug' || item.spriteKey === 'door_mat') {
      const sprite = (atlas as any)[item.spriteKey] as HTMLCanvasElement;
      if (sprite) {
        ctx.drawImage(sprite, item.x, item.y);
      }
    }
  }

  // 5. WALLS (Perimeter Walls, Partitions, and Doorway Headers)
  for (const wall of room.walls) {
    const isRailing = wall.height <= 24;
    if (isRailing) {
      // Wrought-iron balcony safety railing
      ctx.fillStyle = '#1a1d24';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Top handrail (brass / bronze metallic)
      ctx.fillStyle = '#c5a059';
      ctx.fillRect(wall.x, wall.y, wall.width, 3);

      // Vertical balusters every 8px
      ctx.fillStyle = '#3a3f4d';
      for (let bx = wall.x; bx < wall.x + wall.width; bx += 8) {
        ctx.fillRect(bx, wall.y + 3, 2, wall.height - 3);
      }
    } else {
      // Solid 3D Pixel Wall
      const isHorizontal = wall.width >= wall.height;

      // Base wall mass
      ctx.fillStyle = '#1e2330';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      if (isHorizontal) {
        // Top wall cap (cream/slate molding)
        ctx.fillStyle = '#3d4458';
        ctx.fillRect(wall.x, wall.y, wall.width, 6);
        ctx.fillStyle = '#5c6684';
        ctx.fillRect(wall.x, wall.y, wall.width, 2);

        // Subtle vertical wall panels
        ctx.fillStyle = '#262d3d';
        for (let px = wall.x + 32; px < wall.x + wall.width; px += 32) {
          ctx.fillRect(px, wall.y + 6, 1, wall.height - 10);
        }

        // Baseboard shadow
        ctx.fillStyle = '#12151c';
        ctx.fillRect(wall.x, wall.y + wall.height - 4, wall.width, 4);
      } else {
        // Vertical divider wall
        ctx.fillStyle = '#3d4458';
        ctx.fillRect(wall.x, wall.y, 6, wall.height);
        ctx.fillStyle = '#5c6684';
        ctx.fillRect(wall.x, wall.y, 2, wall.height);

        // Right shadow
        ctx.fillStyle = '#12151c';
        ctx.fillRect(wall.x + wall.width - 4, wall.y, 4, wall.height);
      }
    }
  }

  // 6. ELEGANT ROOM LABELS IN TOP VIEW
  ctx.save();
  for (const zone of HOUSE_ZONES) {
    const labelX = Math.round(zone.bounds.x + 18);
    const labelY = Math.round(zone.bounds.y + 26);
    const labelText = `${zone.icon}  ${zone.name.toUpperCase()}`;

    ctx.font = 'bold 11px monospace';
    const textW = ctx.measureText(labelText).width;

    // Subtle background tag
    ctx.fillStyle = 'rgba(10, 14, 22, 0.72)';
    ctx.fillRect(labelX - 6, labelY - 14, textW + 12, 18);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(labelX - 6, labelY - 14, textW + 12, 18);

    // Label text
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(labelText, labelX, labelY);
  }
  ctx.restore();

  // 7. Y-SORTED ENTITIES (FURNITURE & PLAYERS)
  const renderables: RenderableItem[] = [];

  // Add furniture items (excluding flat rugs)
  for (const item of room.furniture) {
    if (item.spriteKey === 'rug' || item.spriteKey === 'door_mat') continue;
    const depthY = item.depthY !== undefined ? item.depthY : item.y + item.height;
    renderables.push({
      type: 'furniture',
      depthY,
      data: item,
    });
  }

  // Add players
  for (const player of players) {
    renderables.push({
      type: 'player',
      depthY: player.y + 30, // Foot position
      data: player,
    });
  }

  // Sort back-to-front by depthY
  renderables.sort((a, b) => a.depthY - b.depthY);

  // Render all entities
  for (const item of renderables) {
    if (item.type === 'furniture') {
      const f = item.data as RoomObject;
      const sprite = (atlas as any)[f.spriteKey] as HTMLCanvasElement;
      if (sprite) {
        // Soft contact drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(f.x + 4, f.y + f.height - 4, f.width - 8, 6);

        ctx.drawImage(sprite, f.x, f.y);

        // Dynamic In-World Screen Rendering:
        // Living Room TV Console
        if (f.spriteKey === 'tv_console' && screenVideo && screenVideo.readyState >= 2) {
          try {
            ctx.drawImage(screenVideo, f.x + 20, f.y + 6, 52, 22);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            for (let sy = f.y + 6; sy < f.y + 28; sy += 2) {
              ctx.fillRect(f.x + 20, sy, 52, 1);
            }
          } catch {}
        }

        // Theatre Massive Cinema Projection Screen
        if (f.spriteKey === 'theatre_screen' && screenVideo && screenVideo.readyState >= 2) {
          try {
            ctx.drawImage(screenVideo, f.x + 10, f.y + 10, 128, 60);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let sy = f.y + 10; sy < f.y + 70; sy += 2) {
              ctx.fillRect(f.x + 10, sy, 128, 1);
            }
          } catch {}
        }
      }
    } else {
      const p = item.data as PlayerState;
      const frames = p.avatarId === 'avatar_grape' ? atlas.player_grape : atlas.player;
      const facing = p.facing && (frames as any)[p.facing] ? p.facing : 'down';
      const dirFrames = (frames as any)[facing] || frames.down;
      if (dirFrames && dirFrames.length > 0) {
        const frameIndex = p.isMoving ? Math.floor(p.animFrame || 0) % dirFrames.length : 0;
        const sprite = dirFrames[frameIndex] || dirFrames[0];
        if (sprite) {
          // Character soft ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
          ctx.beginPath();
          ctx.ellipse(p.x + 16, p.y + 30, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(sprite, p.x, p.y);
        }

        // Player Name Pill
        ctx.save();
        ctx.font = 'bold 9px monospace';
        const nameText = p.name || 'Player';
        const textWidth = ctx.measureText(nameText).width;
        const tagX = Math.round(p.x + 16 - textWidth / 2);
        const tagY = Math.round(p.y - 4);

        const isGrape = p.avatarId === 'avatar_grape' || p.name.toLowerCase().includes('grape');
        const accentColor = isGrape ? '#d67eff' : '#00e5ff';

        ctx.fillStyle = 'rgba(12, 16, 24, 0.88)';
        ctx.fillRect(tagX - 4, tagY - 9, textWidth + 8, 12);
        ctx.strokeStyle = p.id === localPlayerId ? accentColor : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tagX - 4, tagY - 9, textWidth + 8, 12);

        ctx.fillStyle = accentColor;
        ctx.fillText(nameText, tagX, tagY);
        ctx.restore();
      }
    }
  }

  // 8. HIGH WALL DECOR (Clocks, Wall art, Wall shelves, Wall bicycles)
  for (const item of room.furniture) {
    if (
      item.spriteKey === 'wall_clock' ||
      item.spriteKey === 'framed_art' ||
      item.spriteKey === 'kitchen_shelf' ||
      item.spriteKey === 'wall_bicycle' ||
      item.spriteKey === 'towel_rack'
    ) {
      const sprite = (atlas as any)[item.spriteKey] as HTMLCanvasElement;
      if (sprite) {
        ctx.drawImage(sprite, item.x, item.y);
      }
    }
  }

  // 9. CONTEXTUAL [E] INTERACTION PROMPT
  if (nearbyInteractive) {
    ctx.save();
    const bob = Math.sin(timeSec * 5) * 2;
    const px = Math.round(nearbyInteractive.promptPosition.x);
    const py = Math.round(nearbyInteractive.promptPosition.y + bob);

    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const label = `${nearbyInteractive.name}`;
    const textW = ctx.measureText(label).width;
    const pillW = textW + 36;
    const pillH = 20;
    const pillX = Math.round(px - pillW / 2);
    const pillY = Math.round(py - pillH - 4);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(pillX + 1, pillY + 2, pillW, pillH);

    // Pill body
    ctx.fillStyle = '#1c222e';
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(pillX, pillY, pillW, pillH);

    // [E] badge
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(pillX + 4, pillY + 3, 16, 14);
    ctx.fillStyle = '#090e14';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('E', pillX + 9, pillY + 14);

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(label, pillX + 24, pillY + 14);

    // Pointer
    ctx.fillStyle = '#1c222e';
    ctx.beginPath();
    ctx.moveTo(px - 4, pillY + pillH);
    ctx.lineTo(px + 4, pillY + pillH);
    ctx.lineTo(px, pillY + pillH + 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Restore camera viewport matrix
  ctx.restore();
}

// Backward-compatible alias
export const renderLivingRoom = renderHouseRoom;
