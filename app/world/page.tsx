'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { livingRoomDefinition } from '@/lib/world/roomData';

const LiveKitVideoChat = dynamic(() => import('@/components/LiveKitVideoChat'), {
  ssr: false,
});
import { getSpriteAtlas, SpriteAtlas } from '@/lib/world/pixelSprites';
import { renderLivingRoom } from '@/lib/world/renderer';
import {
  resolveMovementWithSliding,
  findNearbyInteractiveObject,
} from '@/lib/world/collision';
import { getFacingDirection, isMovementKey, clamp } from '@/lib/movement';
import { PlayerState, Direction, InteractiveObject, CameraState } from '@/lib/world/types';
import {
  client,
  account,
  databases,
  databaseId,
  COLLECTIONS,
  SOPREMISH_USER_ID,
  GRAPE_USER_ID,
  AUTHORIZED_USERS,
  isAuthorizedUser,
  getOtherAuthorizedUserId,
} from '@/lib/appwrite';

const PLAYER_SPEED_PIXELS_PER_SEC = 160;
const WALK_ANIM_FPS = 8;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3.5;
const PUBLISH_INTERVAL_MS = 130; // ~7-8 updates per second while moving

interface RemoteTargetState {
  x: number;
  y: number;
  facing: Direction;
  animFrame: number;
  isMoving: boolean;
  seq: number;
}

export default function WorldPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeDialog, setActiveDialog] = useState<InteractiveObject | null>(null);
  const [debugPos, setDebugPos] = useState({ x: 190, y: 140 });
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);

  // Online Presence state
  const [currentUserId, setCurrentUserId] = useState<string>(SOPREMISH_USER_ID);
  const [isRemoteOnline, setIsRemoteOnline] = useState<boolean>(false);

  // Local Player
  const localPlayerRef = useRef<PlayerState>({
    id: SOPREMISH_USER_ID,
    name: 'Sopremish',
    x: 190,
    y: 140,
    facing: 'down',
    isMoving: false,
    animFrame: 0,
    walkTimer: 0,
    avatarId: 'avatar_sopremish',
  });

  // Remote Player
  const remotePlayerRef = useRef<PlayerState>({
    id: GRAPE_USER_ID,
    name: 'Grape',
    x: 230,
    y: 140,
    facing: 'down',
    isMoving: false,
    animFrame: 0,
    walkTimer: 0,
    avatarId: 'avatar_grape',
  });

  const remoteTargetRef = useRef<RemoteTargetState>({
    x: 230,
    y: 140,
    facing: 'down',
    animFrame: 0,
    isMoving: false,
    seq: 0,
  });

  const lastRemoteHeartbeatRef = useRef<number>(0);
  const lastRemoteSeqRef = useRef<number>(0);
  const localSeqRef = useRef<number>(1);
  const lastPublishedTimeRef = useRef<number>(0);
  const wasMovingRef = useRef<boolean>(false);

  // Camera & Viewport
  const cameraRef = useRef<CameraState>({
    x: livingRoomDefinition.pixelWidth / 2,
    y: livingRoomDefinition.pixelHeight / 2,
    zoom: 1.5,
  });
  const targetZoomRef = useRef<number>(1.5);
  const defaultCoverZoomRef = useRef<number>(1.5);
  const viewportRef = useRef({ width: 800, height: 600 });

  const keysDownRef = useRef<Set<string>>(new Set());
  const nearbyInteractiveRef = useRef<InteractiveObject | null>(null);
  const atlasRef = useRef<SpriteAtlas | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const activeDialogRef = useRef<InteractiveObject | null>(null);

  // Synchronize activeDialogRef
  useEffect(() => {
    activeDialogRef.current = activeDialog;
  }, [activeDialog]);

  // Handle interaction trigger
  const handleTriggerInteraction = useCallback(() => {
    if (activeDialogRef.current) {
      setActiveDialog(null);
      return;
    }
    if (nearbyInteractiveRef.current) {
      setActiveDialog(nearbyInteractiveRef.current);
    }
  }, []);

  // Zoom controls helper
  const applyZoom = useCallback((newZoom: number) => {
    const clamped = clamp(Number(newZoom.toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    targetZoomRef.current = clamped;
    setZoomLevel(clamped);
  }, []);

  const handleZoomIn = useCallback(() => applyZoom(targetZoomRef.current + 0.25), [applyZoom]);
  const handleZoomOut = useCallback(() => applyZoom(targetZoomRef.current - 0.25), [applyZoom]);
  const handleZoomReset = useCallback(() => applyZoom(defaultCoverZoomRef.current), [applyZoom]);

  // Authenticate user & initialize multiplayer identity
  useEffect(() => {
    let isSubscribed = true;
    let unsubscribeRealtime: (() => void) | null = null;

    async function initUserAndMultiplayer() {
      try {
        let authUser;
        try {
          authUser = await account.get();
        } catch {
          // If no active Appwrite session in browser, check if server has session or redirect
          console.log('No active Appwrite session detected.');
        }

        const myId = authUser?.$id || SOPREMISH_USER_ID;

        // Security check: Must be an authorized user
        if (authUser && !isAuthorizedUser(authUser.$id)) {
          await account.deleteSession('current');
          window.location.href = '/login';
          return;
        }

        if (!isSubscribed) return;

        setCurrentUserId(myId);
        const otherId = getOtherAuthorizedUserId(myId);

        const myProfile = AUTHORIZED_USERS[myId] || AUTHORIZED_USERS[SOPREMISH_USER_ID];
        const otherProfile = AUTHORIZED_USERS[otherId] || AUTHORIZED_USERS[GRAPE_USER_ID];

        // Configure Local Player
        localPlayerRef.current.id = myProfile.id;
        localPlayerRef.current.name = myProfile.name;
        localPlayerRef.current.avatarId = myProfile.avatarId;

        // Configure Remote Player
        remotePlayerRef.current.id = otherProfile.id;
        remotePlayerRef.current.name = otherProfile.name;
        remotePlayerRef.current.avatarId = otherProfile.avatarId;

        // Fetch Remote Player's initial state from Appwrite
        try {
          const doc = await databases.getDocument(
            databaseId,
            COLLECTIONS.PLAYER_STATES,
            otherId
          );
          if (doc && isSubscribed) {
            remotePlayerRef.current.x = Number(doc.x);
            remotePlayerRef.current.y = Number(doc.y);
            remotePlayerRef.current.facing = (doc.direction as Direction) || 'down';
            remoteTargetRef.current = {
              x: Number(doc.x),
              y: Number(doc.y),
              facing: (doc.direction as Direction) || 'down',
              animFrame: doc.anim_frame || 0,
              isMoving: Boolean(doc.is_moving),
              seq: doc.seq || 0,
            };
            // If updated in last 30 seconds, mark online
            if (doc.updated_at && Date.now() - doc.updated_at < 30000) {
              setIsRemoteOnline(true);
              lastRemoteHeartbeatRef.current = doc.updated_at;
            }
          }
        } catch {
          // Use default spawn if not yet recorded
        }

        // Subscribe to Appwrite Realtime for the Player States collection
        const channel = `databases.${databaseId}.collections.${COLLECTIONS.PLAYER_STATES}.documents`;
        unsubscribeRealtime = client.subscribe(channel, (response: any) => {
          if (!isSubscribed) return;
          const payload = response.payload;
          if (!payload || payload.user_id !== otherId) return;

          // Reject out-of-order packets
          if (payload.seq && payload.seq < lastRemoteSeqRef.current) {
            return;
          }
          if (payload.seq) {
            lastRemoteSeqRef.current = payload.seq;
          }

          lastRemoteHeartbeatRef.current = Date.now();
          setIsRemoteOnline(true);

          remoteTargetRef.current = {
            x: Number(payload.x),
            y: Number(payload.y),
            facing: (payload.direction as Direction) || 'down',
            animFrame: payload.anim_frame || 0,
            isMoving: Boolean(payload.is_moving),
            seq: payload.seq || 0,
          };
        });
      } catch (err) {
        console.error('Multiplayer initialization error:', err);
      }
    }

    initUserAndMultiplayer();

    // Heartbeat checker interval (checks if remote player went offline)
    const presenceInterval = setInterval(() => {
      if (lastRemoteHeartbeatRef.current > 0) {
        const diff = Date.now() - lastRemoteHeartbeatRef.current;
        setIsRemoteOnline(diff < 20000); // 20s cutoff
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(presenceInterval);
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, []);

  // Initialize Sprite Atlas and Viewport Resizing
  useEffect(() => {
    const atlas = getSpriteAtlas();
    atlasRef.current = atlas;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      viewportRef.current = { width, height };

      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }

      const scaleX = width / livingRoomDefinition.pixelWidth;
      const scaleY = height / livingRoomDefinition.pixelHeight;
      const cover = Math.max(scaleX, scaleY);
      const sensibleCover = clamp(Number(cover.toFixed(2)), 1.1, 2.5);
      defaultCoverZoomRef.current = sensibleCover;

      if (!isReady) {
        targetZoomRef.current = sensibleCover;
        cameraRef.current.zoom = sensibleCover;
        setZoomLevel(sensibleCover);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    setIsReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isReady]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.2 : -0.2;
      applyZoom(targetZoomRef.current + step);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [applyZoom]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleTriggerInteraction();
        return;
      }

      if (e.code === 'Escape') {
        if (activeDialogRef.current) {
          e.preventDefault();
          setActiveDialog(null);
          return;
        }
      }

      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      if (e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        handleZoomReset();
        return;
      }

      if (isMovementKey(e.code) || isMovementKey(e.key)) {
        e.preventDefault();
        keysDownRef.current.add(e.code);
        keysDownRef.current.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isMovementKey(e.code) || isMovementKey(e.key)) {
        keysDownRef.current.delete(e.code);
        keysDownRef.current.delete(e.key.toLowerCase());
      }
    };

    const handleBlur = () => {
      keysDownRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleTriggerInteraction, handleZoomIn, handleZoomOut, handleZoomReset]);

  // Rate-limited position update broadcaster
  const publishPosition = useCallback(
    async (x: number, y: number, direction: Direction, isMoving: boolean, animFrame: number) => {
      try {
        await databases.updateDocument(
          databaseId,
          COLLECTIONS.PLAYER_STATES,
          currentUserId,
          {
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            direction,
            anim_frame: Math.floor(animFrame),
            is_moving: isMoving,
            seq: ++localSeqRef.current,
            updated_at: Date.now(),
          }
        );
      } catch {
        // Safe ignore network drops during movement
      }
    },
    [currentUserId]
  );

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        const player = localPlayerRef.current;
        const remotePlayer = remotePlayerRef.current;
        const isDialogOpen = activeDialogRef.current !== null;

        // 1. LOCAL PLAYER MOVEMENT
        if (!isDialogOpen) {
          const keys = keysDownRef.current;
          const up = keys.has('KeyW') || keys.has('ArrowUp') || keys.has('w');
          const down = keys.has('KeyS') || keys.has('ArrowDown') || keys.has('s');
          const left = keys.has('KeyA') || keys.has('ArrowLeft') || keys.has('a');
          const right = keys.has('KeyD') || keys.has('ArrowRight') || keys.has('d');

          let dx = 0;
          let dy = 0;
          if (left) dx -= 1;
          if (right) dx += 1;
          if (up) dy -= 1;
          if (down) dy += 1;

          const isMoving = dx !== 0 || dy !== 0;

          if (isMoving) {
            if (dx !== 0 && dy !== 0) {
              const invSqrt2 = 0.7071067811865475;
              dx *= invSqrt2;
              dy *= invSqrt2;
            }

            const stepSpeed = PLAYER_SPEED_PIXELS_PER_SEC * deltaSeconds;
            const moveX = dx * stepSpeed;
            const moveY = dy * stepSpeed;

            const resolved = resolveMovementWithSliding(
              { x: player.x, y: player.y },
              moveX,
              moveY,
              livingRoomDefinition
            );

            player.x = resolved.x;
            player.y = resolved.y;
            player.facing = getFacingDirection({ up, down, left, right }, player.facing);
            player.isMoving = true;
            player.walkTimer += deltaSeconds;
            player.animFrame = (player.walkTimer * WALK_ANIM_FPS) % 4;

            setDebugPos({ x: Math.round(player.x), y: Math.round(player.y) });

            // Throttled publish to Appwrite Cloud
            if (now - lastPublishedTimeRef.current >= PUBLISH_INTERVAL_MS) {
              publishPosition(player.x, player.y, player.facing, true, player.animFrame);
              lastPublishedTimeRef.current = now;
            }
            wasMovingRef.current = true;
          } else {
            // Player stopped moving
            if (wasMovingRef.current) {
              publishPosition(player.x, player.y, player.facing, false, 0);
              wasMovingRef.current = false;
            }
            player.isMoving = false;
            player.walkTimer = 0;
            player.animFrame = 0;
          }

          // Check proximity to interactive objects
          const nearby = findNearbyInteractiveObject(
            { x: player.x, y: player.y },
            livingRoomDefinition
          );
          nearbyInteractiveRef.current = nearby;
        } else {
          player.isMoving = false;
        }

        // 2. REMOTE PLAYER INTERPOLATION (Smooth Lerp)
        const target = remoteTargetRef.current;
        if (target) {
          const distX = target.x - remotePlayer.x;
          const distY = target.y - remotePlayer.y;

          // If close, smoothly interpolate. If huge gap (initial join), snap.
          if (Math.hypot(distX, distY) > 160) {
            remotePlayer.x = target.x;
            remotePlayer.y = target.y;
          } else {
            remotePlayer.x += distX * 0.25;
            remotePlayer.y += distY * 0.25;
          }

          remotePlayer.facing = target.facing;
          remotePlayer.isMoving = target.isMoving;
          remotePlayer.animFrame = target.animFrame;
        }

        // 3. CAMERA FOLLOWING & CLAMPING
        const camera = cameraRef.current;
        const targetZoom = targetZoomRef.current;
        camera.zoom += (targetZoom - camera.zoom) * 0.15;

        const targetX = player.x + 16;
        const targetY = player.y + 18;

        const visibleWorldW = viewportRef.current.width / camera.zoom;
        const visibleWorldH = viewportRef.current.height / camera.zoom;

        let desiredCamX = targetX;
        let desiredCamY = targetY;

        if (visibleWorldW >= livingRoomDefinition.pixelWidth) {
          desiredCamX = livingRoomDefinition.pixelWidth / 2;
        } else {
          desiredCamX = clamp(
            targetX,
            visibleWorldW / 2,
            livingRoomDefinition.pixelWidth - visibleWorldW / 2
          );
        }

        if (visibleWorldH >= livingRoomDefinition.pixelHeight) {
          desiredCamY = livingRoomDefinition.pixelHeight / 2;
        } else {
          desiredCamY = clamp(
            targetY,
            visibleWorldH / 2,
            livingRoomDefinition.pixelHeight - visibleWorldH / 2
          );
        }

        camera.x += (desiredCamX - camera.x) * 0.12;
        camera.y += (desiredCamY - camera.y) * 0.12;

        // 4. RENDER LIVING ROOM WITH BOTH PLAYERS
        if (atlasRef.current) {
          renderLivingRoom(
            ctx,
            livingRoomDefinition,
            atlasRef.current,
            [player, remotePlayer],
            player.id,
            nearbyInteractiveRef.current,
            now / 1000,
            camera,
            viewportRef.current
          );
        }
      }

      lastTimeRef.current = now;
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isReady, publishPosition]);

  // Touch handlers for mobile virtual controls
  const handleTouchDirStart = (code: string) => keysDownRef.current.add(code);
  const handleTouchDirEnd = (code: string) => keysDownRef.current.delete(code);

  // Logout action
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Send stopped state to Appwrite
      await publishPosition(
        localPlayerRef.current.x,
        localPlayerRef.current.y,
        localPlayerRef.current.facing,
        false,
        0
      );
      // 2. Delete Appwrite Session
      await account.deleteSession('current').catch(() => {});
      // 3. Clear Next.js server cookie
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // Proceed with redirect regardless
    }
    window.location.href = '/login';
  };

  const otherUserName =
    currentUserId === SOPREMISH_USER_ID ? 'Grape' : 'Sopremish';
  const myUserName =
    currentUserId === SOPREMISH_USER_ID ? 'Sopremish' : 'Grape';

  return (
    <main className="world-container" id="berk-world">
      {/* Top HUD */}
      <header className="world-hud">
        <div className="world-hud-left">
          <span className="hud-pill hud-title">BERK</span>

          {/* Local User Badge */}
          <span className="hud-pill" style={{ color: currentUserId === SOPREMISH_USER_ID ? '#00e5ff' : '#d67eff' }}>
            ● {myUserName} (You)
          </span>

          {/* Remote Player Presence Indicator */}
          <span
            className="hud-pill"
            style={{
              color: isRemoteOnline ? '#2ed573' : '#8a99ad',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isRemoteOnline ? '#2ed573' : '#718096',
                boxShadow: isRemoteOnline ? '0 0 8px #2ed573' : 'none',
              }}
            />
            {otherUserName} {isRemoteOnline ? 'Online' : 'Offline'}
          </span>

          <span className="hud-pill">
            X: {debugPos.x} | Y: {debugPos.y}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          <LiveKitVideoChat currentUserId={currentUserId} />
          <button
            type="button"
            id="logout-button"
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Logout"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Full-Window Pixel Canvas */}
      <div className="pixel-canvas-container">
        <canvas
          ref={canvasRef}
          id="living-room-canvas"
          className="pixel-canvas"
          role="img"
          aria-label="Cozy pixel-art living room covering full window"
        />
      </div>

      {/* Floating Zoom Controls Widget */}
      <div className="zoom-controls-widget" role="toolbar" aria-label="Zoom controls">
        <button
          type="button"
          className="zoom-btn"
          onClick={handleZoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          −
        </button>

        <button
          type="button"
          className="zoom-level-badge"
          onClick={handleZoomReset}
          title="Reset Zoom (0)"
          aria-label="Reset Zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          type="button"
          className="zoom-btn"
          onClick={handleZoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>
      </div>

      {/* Interactive Modal Dialog */}
      {activeDialog && (
        <div
          className="interaction-modal-overlay"
          onClick={() => setActiveDialog(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="interaction-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="interaction-modal-header">
              <span className="interaction-tag">Inspect</span>
              <button
                type="button"
                className="interaction-close-btn"
                onClick={() => setActiveDialog(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <h2 className="interaction-title">{activeDialog.title}</h2>
            <p className="interaction-desc">{activeDialog.description}</p>

            <div className="interaction-action-row">
              <span className="interaction-hint-text">Press [Esc] or [E] to return</span>
              <button
                type="button"
                className="interaction-dismiss-btn"
                onClick={() => setActiveDialog(null)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <footer className="controls-hint" aria-hidden="true">
        Move: <span className="key-badge">W</span> <span className="key-badge">A</span>{' '}
        <span className="key-badge">S</span> <span className="key-badge">D</span> • Inspect:{' '}
        <span className="key-badge">E</span> • Zoom:{' '}
        <span className="key-badge">Scroll</span> or <span className="key-badge">+</span>/<span className="key-badge">-</span>
      </footer>

      {/* Mobile Virtual D-Pad */}
      <div className="mobile-dpad-container" aria-hidden="true">
        <div className="dpad-grid">
          <div />
          <button
            type="button"
            className="dpad-btn"
            onTouchStart={() => handleTouchDirStart('KeyW')}
            onTouchEnd={() => handleTouchDirEnd('KeyW')}
            onMouseDown={() => handleTouchDirStart('KeyW')}
            onMouseUp={() => handleTouchDirEnd('KeyW')}
            aria-label="Move Up"
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            className="dpad-btn"
            onTouchStart={() => handleTouchDirStart('KeyA')}
            onTouchEnd={() => handleTouchDirEnd('KeyA')}
            onMouseDown={() => handleTouchDirStart('KeyA')}
            onMouseUp={() => handleTouchDirEnd('KeyA')}
            aria-label="Move Left"
          >
            ◀
          </button>
          <div />
          <button
            type="button"
            className="dpad-btn"
            onTouchStart={() => handleTouchDirStart('KeyD')}
            onTouchEnd={() => handleTouchDirEnd('KeyD')}
            onMouseDown={() => handleTouchDirStart('KeyD')}
            onMouseUp={() => handleTouchDirEnd('KeyD')}
            aria-label="Move Right"
          >
            ▶
          </button>

          <div />
          <button
            type="button"
            className="dpad-btn"
            onTouchStart={() => handleTouchDirStart('KeyS')}
            onTouchEnd={() => handleTouchDirEnd('KeyS')}
            onMouseDown={() => handleTouchDirStart('KeyS')}
            onMouseUp={() => handleTouchDirEnd('KeyS')}
            aria-label="Move Down"
          >
            ▼
          </button>
          <div />
        </div>
      </div>

      {/* Mobile Virtual Action Button */}
      <div className="mobile-action-container" aria-hidden="true">
        <button
          type="button"
          className="action-btn-touch"
          onClick={handleTriggerInteraction}
          aria-label="Interact"
        >
          E
        </button>
      </div>
    </main>
  );
}
