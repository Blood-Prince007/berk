import { RoomDefinition, PlayerState, InteractiveObject, RoomObject, CameraState } from './types';
import { SpriteAtlas } from './pixelSprites';

interface RenderableItem {
  type: 'furniture' | 'player';
  depthY: number;
  data: RoomObject | PlayerState;
}

export function renderLivingRoom(
  ctx: CanvasRenderingContext2D,
  room: RoomDefinition,
  atlas: SpriteAtlas,
  players: PlayerState[],
  localPlayerId: string,
  nearbyInteractive: InteractiveObject | null,
  timeSec: number,
  camera?: CameraState,
  viewport?: { width: number; height: number }
) {
  const { pixelWidth, pixelHeight, tileSize, tileWidth, tileHeight } = room;
  const vpWidth = viewport ? viewport.width : pixelWidth;
  const vpHeight = viewport ? viewport.height : pixelHeight;

  // 1. CLEAR VIEWPORT
  ctx.clearRect(0, 0, vpWidth, vpHeight);
  ctx.fillStyle = '#080a0e';
  ctx.fillRect(0, 0, vpWidth, vpHeight);

  ctx.save();

  if (camera && viewport) {
    // Center viewport and apply camera pan and zoom
    ctx.translate(Math.round(vpWidth / 2), Math.round(vpHeight / 2));
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  }

  // Room cast shadow when zoomed out
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(6, 8, pixelWidth, pixelHeight);

  // 2. FLOOR TILES (Rows 2 to tileHeight - 1)
  for (let row = 2; row < tileHeight; row++) {
    for (let col = 0; col < tileWidth; col++) {
      ctx.drawImage(atlas.floor_wood, col * tileSize, row * tileSize);
    }
  }

  // 3. WALLS (Rows 0, 1, 2 along top)
  for (let col = 0; col < tileWidth; col++) {
    ctx.drawImage(atlas.wall_top, col * tileSize, 0);
    ctx.drawImage(atlas.wall_middle, col * tileSize, tileSize);
    ctx.drawImage(atlas.wall_bottom, col * tileSize, tileSize * 2);
  }

  // Side skirting shadows along left & right borders
  ctx.fillStyle = 'rgba(25, 12, 5, 0.35)';
  ctx.fillRect(0, 96, 4, pixelHeight - 96);
  ctx.fillRect(pixelWidth - 4, 96, 4, pixelHeight - 96);

  // 4. FLAT GROUND DECOR (Rug)
  const rug = room.furniture.find((f) => f.spriteKey === 'rug');
  if (rug && (atlas as any)[rug.spriteKey]) {
    ctx.drawImage((atlas as any)[rug.spriteKey], rug.x, rug.y);
  }

  // 5. SUNLIGHT BEAM FROM WINDOW
  const windowObj = room.furniture.find((f) => f.spriteKey === 'window_view');
  if (windowObj) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(windowObj.x + 8, windowObj.y + 60);
    ctx.lineTo(windowObj.x + windowObj.width - 8, windowObj.y + 60);
    ctx.lineTo(windowObj.x + windowObj.width + 50, windowObj.y + 240);
    ctx.lineTo(windowObj.x - 30, windowObj.y + 240);
    ctx.closePath();

    const sunGradient = ctx.createLinearGradient(
      windowObj.x + 32,
      windowObj.y + 60,
      windowObj.x + 40,
      windowObj.y + 240
    );
    sunGradient.addColorStop(0, 'rgba(255, 240, 180, 0.18)');
    sunGradient.addColorStop(1, 'rgba(255, 230, 150, 0.0)');
    ctx.fillStyle = sunGradient;
    ctx.fill();
    ctx.restore();
  }

  // 6. Y-SORTED ENTITIES (FURNITURE & PLAYERS)
  const renderables: RenderableItem[] = [];

  // Add furniture items (excluding flat rug and high wall items)
  for (const item of room.furniture) {
    if (item.spriteKey === 'rug' || item.spriteKey === 'wall_clock' || item.spriteKey === 'framed_art') {
      continue;
    }
    const depthY = item.depthY !== undefined ? item.depthY : item.y + item.height;
    renderables.push({
      type: 'furniture',
      depthY,
      data: item,
    });
  }

  // Add players
  for (const player of players) {
    // Player depth is foot coordinate
    const depthY = player.y + 32;
    renderables.push({
      type: 'player',
      depthY,
      data: player,
    });
  }

  // Sort back-to-front by depthY
  renderables.sort((a, b) => a.depthY - b.depthY);

  // Draw sorted renderables
  for (const item of renderables) {
    if (item.type === 'furniture') {
      const f = item.data as RoomObject;
      const sprite = (atlas as any)[f.spriteKey] as HTMLCanvasElement;
      if (sprite) {
        ctx.drawImage(sprite, f.x, f.y);
      }
    } else {
      const p = item.data as PlayerState;
      const frames = p.avatarId === 'avatar_grape' ? atlas.player_grape : atlas.player;
      const dirFrames = frames[p.facing];
      if (dirFrames && dirFrames.length > 0) {
        const frameIndex = p.isMoving ? Math.floor(p.animFrame) % dirFrames.length : 0;
        const sprite = dirFrames[frameIndex];
        ctx.drawImage(sprite, p.x, p.y);

        // Player Name Pill
        ctx.save();
        ctx.font = 'bold 9px monospace';
        const nameText = p.name || 'Player';
        const textWidth = ctx.measureText(nameText).width;
        const tagX = Math.round(p.x + 16 - textWidth / 2);
        const tagY = Math.round(p.y - 4);

        // Distinct styling for Sopremish (cyan) vs Grape (violet)
        const isGrape = p.avatarId === 'avatar_grape' || p.name.toLowerCase().includes('grape');
        const accentColor = isGrape ? '#d67eff' : '#00e5ff';

        // Name tag background
        ctx.fillStyle = 'rgba(12, 16, 24, 0.8)';
        ctx.fillRect(tagX - 4, tagY - 9, textWidth + 8, 12);
        ctx.strokeStyle = p.id === localPlayerId ? accentColor : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tagX - 4, tagY - 9, textWidth + 8, 12);

        // Name text
        ctx.fillStyle = accentColor;
        ctx.fillText(nameText, tagX, tagY);
        ctx.restore();
      }
    }
  }

  // 7. HIGH WALL DECOR (Clock & Framed Art mounted on upper wall)
  const clock = room.furniture.find((f) => f.spriteKey === 'wall_clock');
  if (clock && atlas.wall_clock) {
    ctx.drawImage(atlas.wall_clock, clock.x, clock.y);
  }
  const art = room.furniture.find((f) => f.spriteKey === 'framed_art');
  if (art && atlas.framed_art) {
    ctx.drawImage(atlas.framed_art, art.x, art.y);
  }

  // 8. AMBIENT WARM LIGHTING PASS
  // Standing Lamp radial glow
  const lamp = room.furniture.find((f) => f.spriteKey === 'standing_lamp');
  if (lamp) {
    const lampGlow = ctx.createRadialGradient(
      lamp.x + 16,
      lamp.y + 28,
      4,
      lamp.x + 16,
      lamp.y + 50,
      130
    );
    const pulse = Math.sin(timeSec * 2.5) * 0.02;
    lampGlow.addColorStop(0, `rgba(255, 230, 140, ${0.28 + pulse})`);
    lampGlow.addColorStop(0.5, `rgba(255, 210, 110, ${0.12 + pulse})`);
    lampGlow.addColorStop(1, 'rgba(255, 200, 90, 0)');

    ctx.save();
    ctx.fillStyle = lampGlow;
    ctx.fillRect(lamp.x - 120, lamp.y - 60, 280, 280);
    ctx.restore();
  }

  // Cozy room edge vignette
  const vignette = ctx.createRadialGradient(
    pixelWidth / 2,
    pixelHeight / 2,
    pixelHeight * 0.45,
    pixelWidth / 2,
    pixelHeight / 2,
    pixelWidth * 0.65
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(12, 7, 3, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, pixelWidth, pixelHeight);

  // 9. INTERACTIVE OBJECT HOVER PROMPT
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

    // Pill shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
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

    // Tiny pointer triangle
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
