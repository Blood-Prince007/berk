'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  houseDefinition,
  HOUSE_ZONES,
  getRoomAtPosition,
  DEFAULT_ROOM_ID,
  HouseZone,
} from '@/lib/world/roomData';

const LiveKitVideoChat = dynamic(() => import('@/components/LiveKitVideoChat'), {
  ssr: false,
});
import { getSpriteAtlas, SpriteAtlas } from '@/lib/world/pixelSprites';
import { renderHouseRoom } from '@/lib/world/renderer';
import {
  resolveMovementWithSliding,
  findNearbyInteractiveObject,
} from '@/lib/world/collision';
import { getFacingDirection, isMovementKey, clamp } from '@/lib/movement';
import {
  PlayerState,
  Direction,
  InteractiveObject,
  CameraState,
} from '@/lib/world/types';
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
  WORLD_ID,
} from '@/lib/appwrite';

const PLAYER_SPEED_PIXELS_PER_SEC = 160;
const WALK_ANIM_FPS = 8;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const PUBLISH_INTERVAL_MS = 130; // ~7-8 updates per second while moving

interface RemoteTargetState {
  x: number;
  y: number;
  facing: Direction;
  animFrame: number;
  isMoving: boolean;
  seq: number;
  roomId?: string;
}

export default function WorldPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeDialog, setActiveDialog] = useState<InteractiveObject | null>(null);
  const [debugPos, setDebugPos] = useState({ x: 1184, y: 800 });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

  // Dynamic Room Zone State
  const [currentZone, setCurrentZone] = useState<HouseZone>(HOUSE_ZONES[4]); // Living Room
  const currentRoomIdRef = useRef<string>(DEFAULT_ROOM_ID);

  // Partner Room Zone State
  const [remoteZone, setRemoteZone] = useState<HouseZone>(HOUSE_ZONES[4]);

  // Online Presence state
  const [currentUserId, setCurrentUserId] = useState<string>(SOPREMISH_USER_ID);
  const currentUserIdRef = useRef<string>(SOPREMISH_USER_ID);
  const [isAppwriteRemoteOnline, setIsAppwriteRemoteOnline] = useState<boolean>(false);
  const [isLiveKitRemoteConnected, setIsLiveKitRemoteConnected] = useState<boolean>(false);

  // User is online if active in Appwrite heartbeat/movement OR connected in LiveKit call
  const isRemoteOnline = isAppwriteRemoteOnline || isLiveKitRemoteConnected;
  const isRemoteOnlineRef = useRef<boolean>(false);

  useEffect(() => {
    isRemoteOnlineRef.current = isRemoteOnline;
  }, [isRemoteOnline]);

  const liveKitDataSenderRef = useRef<((posData: any) => void) | null>(null);

  // Local Player (Spawn in Living Room Center)
  const localPlayerRef = useRef<PlayerState>({
    id: SOPREMISH_USER_ID,
    name: 'Sopremish',
    x: 1184,
    y: 800,
    facing: 'down',
    isMoving: false,
    animFrame: 0,
    walkTimer: 0,
    avatarId: 'avatar_sopremish',
    roomId: DEFAULT_ROOM_ID,
  });

  // Remote Player
  const remotePlayerRef = useRef<PlayerState>({
    id: GRAPE_USER_ID,
    name: 'Grape',
    x: 1240,
    y: 800,
    facing: 'down',
    isMoving: false,
    animFrame: 0,
    walkTimer: 0,
    avatarId: 'avatar_grape',
    roomId: DEFAULT_ROOM_ID,
  });

  const remoteTargetRef = useRef<RemoteTargetState>({
    x: 1240,
    y: 800,
    facing: 'down',
    animFrame: 0,
    isMoving: false,
    seq: 0,
    roomId: DEFAULT_ROOM_ID,
  });

  const lastRemoteHeartbeatRef = useRef<number>(0);
  const localSeqRef = useRef<number>(1);
  const lastPublishedTimeRef = useRef<number>(0);
  const wasMovingRef = useRef<boolean>(false);

  // Camera & Viewport
  const cameraRef = useRef<CameraState>({
    x: 1184,
    y: 800,
    zoom: 1.0,
  });
  const targetZoomRef = useRef<number>(1.0);
  const defaultZoomRef = useRef<number>(1.0);
  const viewportRef = useRef({ width: 800, height: 600 });

  const keysDownRef = useRef<Set<string>>(new Set());
  const nearbyInteractiveRef = useRef<InteractiveObject | null>(null);
  const atlasRef = useRef<SpriteAtlas | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const activeDialogRef = useRef<InteractiveObject | null>(null);
  const activeScreenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize activeDialogRef
  useEffect(() => {
    activeDialogRef.current = activeDialog;
  }, [activeDialog]);

  // Position update broadcaster: broadcasts over LiveKit DataChannel (instant WebRTC) + Appwrite (persistent)
  const publishPosition = useCallback(
    async (x: number, y: number, direction: Direction, isMoving: boolean, animFrame: number) => {
      const myId = currentUserIdRef.current;
      const roomId = currentRoomIdRef.current;
      const seq = ++localSeqRef.current;

      // 1. Instant ultra-fast WebRTC data broadcast to connected peer
      if (liveKitDataSenderRef.current) {
        liveKitDataSenderRef.current({
          x: Number(x.toFixed(1)),
          y: Number(y.toFixed(1)),
          facing: direction,
          animFrame: Math.floor(animFrame),
          isMoving,
          seq,
          room_id: roomId,
        });
      }

      // 2. Persistent Appwrite database update
      try {
        const payload = {
          user_id: myId,
          world_id: WORLD_ID,
          room_id: roomId,
          x: Number(x.toFixed(1)),
          y: Number(y.toFixed(1)),
          direction,
          anim_frame: Math.floor(animFrame),
          is_moving: isMoving,
          seq,
          updated_at: Date.now(),
        };

        try {
          await databases.updateDocument(
            databaseId,
            COLLECTIONS.PLAYER_STATES,
            myId,
            payload
          );
        } catch (err: any) {
          if (err?.code === 404 || err?.message?.toLowerCase().includes('not found')) {
            await databases.createDocument(
              databaseId,
              COLLECTIONS.PLAYER_STATES,
              myId,
              payload
            ).catch(() => {});
          }
        }
      } catch {
        // Safe ignore network drops during movement
      }
    },
    []
  );

  // Direct fast travel to any room in the house
  const fastTravelToRoom = useCallback(
    (targetRoomId: string) => {
      const zone = HOUSE_ZONES.find((z) => z.id === targetRoomId) || HOUSE_ZONES[4];
      const player = localPlayerRef.current;
      player.x = zone.spawnPoint.x;
      player.y = zone.spawnPoint.y;
      player.isMoving = false;
      player.walkTimer = 0;
      player.animFrame = 0;
      currentRoomIdRef.current = zone.id;
      setCurrentZone(zone);
      keysDownRef.current.clear();

      // Center camera
      cameraRef.current.x = player.x;
      cameraRef.current.y = player.y;

      publishPosition(player.x, player.y, player.facing, false, 0);
    },
    [publishPosition]
  );

  // Handle interaction trigger (Key E or Touch E)
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

  const handleZoomIn = useCallback(() => applyZoom(targetZoomRef.current + 0.2), [applyZoom]);
  const handleZoomOut = useCallback(() => applyZoom(targetZoomRef.current - 0.2), [applyZoom]);
  const handleZoomReset = useCallback(() => applyZoom(defaultZoomRef.current), [applyZoom]);

  // Handler for instant WebRTC LiveKit data packets
  const handlePositionDataReceivedFromLiveKit = useCallback((data: any) => {
    if (!data) return;
    lastRemoteHeartbeatRef.current = Date.now();
    setIsAppwriteRemoteOnline(true);
    isRemoteOnlineRef.current = true;
    const targetX = Number(data.x);
    const targetY = Number(data.y);
    const zone = getRoomAtPosition(targetX, targetY);
    setRemoteZone(zone);

    remoteTargetRef.current = {
      x: targetX,
      y: targetY,
      facing: (data.facing as Direction) || 'down',
      animFrame: data.animFrame || 0,
      isMoving: Boolean(data.isMoving),
      seq: data.seq || 0,
      roomId: data.room_id || zone.id,
    };
  }, []);

  const handleScreenVideoElementChange = useCallback((el: HTMLVideoElement | null) => {
    activeScreenVideoRef.current = el;
  }, []);

  const handleRemoteParticipantChange = useCallback((hasRemote: boolean) => {
    setIsLiveKitRemoteConnected(hasRemote);
    if (hasRemote) {
      isRemoteOnlineRef.current = true;
    }
  }, []);

  const handleSendPositionDataReady = useCallback((sender: ((posData: any) => void) | null) => {
    liveKitDataSenderRef.current = sender;
  }, []);

  // Authenticate user & initialize multiplayer identity
  useEffect(() => {
    let isSubscribed = true;
    let unsubscribeRealtime: (() => void) | null = null;

    async function initUserAndMultiplayer() {
      try {
        let resolvedUserId: string | null = null;

        // 1. Check verified 1st-party server session cookie first
        try {
          const sessionRes = await fetch('/api/auth/session');
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json().catch(() => ({}));
            if (
              sessionData?.authenticated &&
              sessionData?.userId &&
              isAuthorizedUser(sessionData.userId)
            ) {
              resolvedUserId = sessionData.userId;
            }
          }
        } catch (sessionErr) {
          console.warn('Session check failed:', sessionErr);
        }

        // 2. Fall back to Appwrite client session if available
        if (!resolvedUserId) {
          try {
            const authUser = await account.get();
            if (authUser?.$id && isAuthorizedUser(authUser.$id)) {
              resolvedUserId = authUser.$id;
              // Synchronize session cookie
              await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resolvedUserId }),
              }).catch(() => {});
            }
          } catch {
            // No client session
          }
        }

        // 3. If neither is valid, redirect to login
        if (!resolvedUserId || !isAuthorizedUser(resolvedUserId)) {
          window.location.href = '/login';
          return;
        }

        if (!isSubscribed) return;

        const myId = resolvedUserId;
        setCurrentUserId(myId);
        currentUserIdRef.current = myId;
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
            const docX = Number(doc.x);
            const docY = Number(doc.y);
            remotePlayerRef.current.x = docX;
            remotePlayerRef.current.y = docY;
            remotePlayerRef.current.facing = (doc.direction as Direction) || 'down';
            const zone = getRoomAtPosition(docX, docY);
            setRemoteZone(zone);

            remoteTargetRef.current = {
              x: docX,
              y: docY,
              facing: (doc.direction as Direction) || 'down',
              animFrame: doc.anim_frame || 0,
              isMoving: Boolean(doc.is_moving),
              seq: doc.seq || 0,
              roomId: doc.room_id || zone.id,
            };
            // If updated in last 30 seconds, mark online
            if (doc.updated_at && Date.now() - Number(doc.updated_at) < 30000) {
              setIsAppwriteRemoteOnline(true);
              isRemoteOnlineRef.current = true;
              lastRemoteHeartbeatRef.current = Number(doc.updated_at);
            }
          }
        } catch {
          // Use default spawn if not yet recorded
        }

        // Publish local player's initial position
        const initialPayload = {
          user_id: myId,
          world_id: WORLD_ID,
          room_id: currentRoomIdRef.current,
          x: localPlayerRef.current.x,
          y: localPlayerRef.current.y,
          direction: localPlayerRef.current.facing,
          anim_frame: 0,
          is_moving: false,
          seq: ++localSeqRef.current,
          updated_at: Date.now(),
        };
        try {
          await databases.updateDocument(
            databaseId,
            COLLECTIONS.PLAYER_STATES,
            myId,
            initialPayload
          );
        } catch (err: any) {
          if (err?.code === 404 || err?.message?.toLowerCase().includes('not found')) {
            await databases.createDocument(
              databaseId,
              COLLECTIONS.PLAYER_STATES,
              myId,
              initialPayload
            ).catch(() => {});
          }
        }

        // Subscribe to Appwrite Realtime
        const channels = [
          `databases.${databaseId}.collections.${COLLECTIONS.PLAYER_STATES}.documents`,
          `databases.${databaseId}.collections.${COLLECTIONS.PLAYER_STATES}.documents.${otherId}`,
        ];
        unsubscribeRealtime = client.subscribe(channels, (response: any) => {
          if (!isSubscribed) return;
          const payload = response.payload;
          if (!payload) return;
          const packetId = payload.$id || payload.user_id;
          if (packetId !== otherId) return;

          const packetTime = Number(payload.updated_at) || Date.now();
          const lastTime = lastRemoteHeartbeatRef.current || 0;

          if (packetTime > 0 && lastTime > 0 && packetTime < lastTime - 500) {
            return;
          }

          lastRemoteHeartbeatRef.current = packetTime;
          setIsAppwriteRemoteOnline(true);
          isRemoteOnlineRef.current = true;

          const rx = Number(payload.x);
          const ry = Number(payload.y);
          const rZone = getRoomAtPosition(rx, ry);
          setRemoteZone(rZone);

          remoteTargetRef.current = {
            x: rx,
            y: ry,
            facing: (payload.direction as Direction) || 'down',
            animFrame: payload.anim_frame || 0,
            isMoving: Boolean(payload.is_moving),
            seq: payload.seq || 0,
            roomId: payload.room_id || rZone.id,
          };
        });
      } catch (err) {
        console.error('Multiplayer initialization error:', err);
      }
    }

    initUserAndMultiplayer();

    // Heartbeat checker interval
    const presenceInterval = setInterval(() => {
      if (lastRemoteHeartbeatRef.current > 0) {
        const diff = Date.now() - lastRemoteHeartbeatRef.current;
        const isOnline = diff < 20000;
        setIsAppwriteRemoteOnline(isOnline);
        if (!isOnline && !isLiveKitRemoteConnected) {
          isRemoteOnlineRef.current = false;
        }
      } else {
        setIsAppwriteRemoteOnline(false);
      }
    }, 3000);

    // Periodic stationary heartbeat
    const stationaryHeartbeat = setInterval(() => {
      if (!isSubscribed) return;
      const player = localPlayerRef.current;
      publishPosition(player.x, player.y, player.facing, false, 0);
    }, 3500);

    // Polling fallback
    const pollInterval = setInterval(async () => {
      if (!isSubscribed) return;
      try {
        const otherId = getOtherAuthorizedUserId(currentUserIdRef.current);
        const doc = await databases.getDocument(
          databaseId,
          COLLECTIONS.PLAYER_STATES,
          otherId
        );
        if (doc && doc.updated_at) {
          const docTime = Number(doc.updated_at);
          if (Date.now() - docTime < 25000) {
            setIsAppwriteRemoteOnline(true);
            isRemoteOnlineRef.current = true;
            const rx = Number(doc.x);
            const ry = Number(doc.y);
            const rZone = getRoomAtPosition(rx, ry);
            setRemoteZone(rZone);

            if (docTime > (lastRemoteHeartbeatRef.current || 0)) {
              lastRemoteHeartbeatRef.current = docTime;
              remoteTargetRef.current = {
                x: rx,
                y: ry,
                facing: (doc.direction as Direction) || 'down',
                animFrame: doc.anim_frame || 0,
                isMoving: Boolean(doc.is_moving),
                seq: doc.seq || 0,
                roomId: doc.room_id || rZone.id,
              };
            }
          }
        }
      } catch {}
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(presenceInterval);
      clearInterval(stationaryHeartbeat);
      clearInterval(pollInterval);
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
    };
  }, [publishPosition]);

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

      // Default comfortable zoom showing the current room and surroundings
      const sensibleCover = clamp(Number((height / 900).toFixed(2)), 0.7, 1.4);
      defaultZoomRef.current = sensibleCover;

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
      const step = e.deltaY < 0 ? 0.15 : -0.15;
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

      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMapOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Escape') {
        if (activeDialogRef.current) {
          e.preventDefault();
          setActiveDialog(null);
          return;
        }
        if (isMapOpen) {
          e.preventDefault();
          setIsMapOpen(false);
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
  }, [handleTriggerInteraction, handleZoomIn, handleZoomOut, handleZoomReset, isMapOpen]);

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
        const isOverlayOpen = isDialogOpen || isMapOpen;

        // 1. LOCAL PLAYER CONTINUOUS MOVEMENT ACROSS ENTIRE HOUSE
        if (!isOverlayOpen) {
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
              houseDefinition
            );

            player.x = resolved.x;
            player.y = resolved.y;
            player.facing = getFacingDirection({ up, down, left, right }, player.facing);
            player.isMoving = true;
            player.walkTimer += deltaSeconds;
            player.animFrame = (player.walkTimer * WALK_ANIM_FPS) % 4;

            setDebugPos({ x: Math.round(player.x), y: Math.round(player.y) });

            // Check current room zone dynamically
            const activeZone = getRoomAtPosition(player.x, player.y);
            if (activeZone.id !== currentRoomIdRef.current) {
              currentRoomIdRef.current = activeZone.id;
              setCurrentZone(activeZone);
            }

            // Throttled publish to WebRTC LiveKit & Appwrite Cloud
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

          // Check proximity to interactive objects across the entire house
          nearbyInteractiveRef.current = findNearbyInteractiveObject(
            { x: player.x, y: player.y },
            houseDefinition
          );
        } else {
          player.isMoving = false;
        }

        // 2. REMOTE PLAYER INTERPOLATION (Smooth Lerp in unified world space)
        const target = remoteTargetRef.current;
        if (target) {
          const distX = target.x - remotePlayer.x;
          const distY = target.y - remotePlayer.y;

          if (Math.hypot(distX, distY) > 200) {
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

        // 3. CAMERA FOLLOWING & CLAMPING TO ENTIRE HOUSE (2400 x 1600)
        const camera = cameraRef.current;
        const targetZoom = targetZoomRef.current;
        camera.zoom += (targetZoom - camera.zoom) * 0.15;

        const targetX = player.x + 16;
        const targetY = player.y + 18;

        const visibleWorldW = viewportRef.current.width / camera.zoom;
        const visibleWorldH = viewportRef.current.height / camera.zoom;

        let desiredCamX = targetX;
        let desiredCamY = targetY;

        if (visibleWorldW >= houseDefinition.pixelWidth) {
          desiredCamX = houseDefinition.pixelWidth / 2;
        } else {
          desiredCamX = clamp(
            targetX,
            visibleWorldW / 2,
            houseDefinition.pixelWidth - visibleWorldW / 2
          );
        }

        if (visibleWorldH >= houseDefinition.pixelHeight) {
          desiredCamY = houseDefinition.pixelHeight / 2;
        } else {
          desiredCamY = clamp(
            targetY,
            visibleWorldH / 2,
            houseDefinition.pixelHeight - visibleWorldH / 2
          );
        }

        camera.x += (desiredCamX - camera.x) * 0.12;
        camera.y += (desiredCamY - camera.y) * 0.12;

        // 4. RENDER ALL 9 ROOMS DIRECTLY ON CANVAS (Simultaneous top view)
        if (atlasRef.current) {
          const playersToRender = isRemoteOnlineRef.current ? [player, remotePlayer] : [player];

          renderHouseRoom(
            ctx,
            houseDefinition,
            atlasRef.current,
            playersToRender,
            player.id,
            nearbyInteractiveRef.current,
            now / 1000,
            camera,
            viewportRef.current,
            activeScreenVideoRef.current
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
  }, [isReady, publishPosition, isMapOpen]);

  // Touch handlers for mobile virtual controls
  const handleTouchDirStart = (code: string) => keysDownRef.current.add(code);
  const handleTouchDirEnd = (code: string) => keysDownRef.current.delete(code);

  // Logout action
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await publishPosition(
        localPlayerRef.current.x,
        localPlayerRef.current.y,
        localPlayerRef.current.facing,
        false,
        0
      );
      await account.deleteSession('current').catch(() => {});
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
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

          {/* Current Dynamic Room Zone Pill */}
          <span
            className="hud-pill hud-room-pill"
            style={{
              color: '#00e5ff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <span>{currentZone.icon}</span>
            <span>{currentZone.name}</span>
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
            <span>{otherUserName}</span>
            <span style={{ fontSize: '11px', opacity: 0.9 }}>
              {isRemoteOnline ? `in ${remoteZone.name}` : 'Offline'}
            </span>
          </span>

          {/* House Directory & Fast Travel Button */}
          <button
            type="button"
            id="house-map-button"
            className="hud-map-btn"
            onClick={() => setIsMapOpen(true)}
            aria-label="Open House Directory"
            title="House Directory (M)"
          >
            🗺️ Directory
          </button>

          <span className="hud-pill hud-coords">
            X: {debugPos.x} | Y: {debugPos.y}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          <LiveKitVideoChat
            currentUserId={currentUserId}
            onScreenVideoElementChange={handleScreenVideoElementChange}
            onRemoteParticipantChange={handleRemoteParticipantChange}
            onPositionDataReceived={handlePositionDataReceivedFromLiveKit}
            onSendPositionDataReady={handleSendPositionDataReady}
          />
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
          aria-label="Contiguous 9-room multiplayer pixel-art house"
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

            <div className="interaction-action-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              {activeDialog.id === 'interact_tv' || activeDialog.id === 'interact_theatre_screen' ? (
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #00e5ff',
                    background: 'rgba(0, 229, 255, 0.15)',
                    color: '#00e5ff',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(0, 229, 255, 0.25)',
                  }}
                  onClick={() => {
                    setActiveDialog(null);
                    document.getElementById('tv-header-button')?.click();
                  }}
                >
                  📺 {activeDialog.id === 'interact_theatre_screen' ? 'Watch Cinema Screen / Broadcast' : 'Turn On TV / Watch Broadcast'}
                </button>
              ) : (
                <span className="interaction-hint-text">Press [Esc] or [E] to return</span>
              )}
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

      {/* House Directory Modal */}
      {isMapOpen && (
        <div
          className="house-map-modal-overlay"
          onClick={() => setIsMapOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="house-map-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="house-map-header">
              <div className="house-map-header-title">
                <span className="house-map-badge">Direct Overview</span>
                <h2 className="house-map-title">🗺️ BERK HOUSE DIRECTORY</h2>
                <p className="house-map-subtitle">
                  All 9 rooms are visible directly in the top view. Walk anywhere freely or click below to fast-travel.
                </p>
              </div>
              <button
                type="button"
                className="house-map-close-btn"
                onClick={() => setIsMapOpen(false)}
                aria-label="Close Map"
              >
                ✕
              </button>
            </div>

            <div className="house-map-grid">
              {HOUSE_ZONES.map((zone) => {
                const isCurrent = zone.id === currentZone.id;
                const isPartnerHere = isRemoteOnline && zone.id === remoteZone.id;

                return (
                  <div
                    key={zone.id}
                    className={`house-map-card ${isCurrent ? 'active-current-room' : ''} ${
                      isPartnerHere ? 'partner-room' : ''
                    }`}
                  >
                    <div className="house-map-card-header">
                      <span className="house-map-card-icon">{zone.icon}</span>
                      <div className="house-map-card-info">
                        <h3 className="house-map-card-name">{zone.name}</h3>
                        <span className="house-map-card-dims">
                          {Math.round(zone.bounds.width / 32)}×{Math.round(zone.bounds.height / 32)} tiles
                        </span>
                      </div>
                    </div>

                    <p className="house-map-card-desc">{zone.description}</p>

                    <div className="house-map-occupancy">
                      {isCurrent && (
                        <span className="occupancy-pill you-here">
                          ● You are here
                        </span>
                      )}
                      {isPartnerHere && (
                        <span className="occupancy-pill partner-here">
                          ● {otherUserName} is here
                        </span>
                      )}
                    </div>

                    <div className="house-map-card-footer">
                      {isCurrent ? (
                        <button
                          type="button"
                          className="house-travel-btn current"
                          disabled
                        >
                          Current Location
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="house-travel-btn"
                          onClick={() => {
                            fastTravelToRoom(zone.id);
                            setIsMapOpen(false);
                          }}
                        >
                          Walk to {zone.name} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="house-map-footer">
              <span>Tip: Zoom out to see the entire house at once • Press <kbd className="map-kbd">M</kbd> or <kbd className="map-kbd">Esc</kbd> to close</span>
              <span>All 9 rooms visible directly</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <footer className="controls-hint" aria-hidden="true">
        Move: <span className="key-badge">W</span> <span className="key-badge">A</span>{' '}
        <span className="key-badge">S</span> <span className="key-badge">D</span> • Inspect:{' '}
        <span className="key-badge">E</span> • Directory: <span className="key-badge">M</span> • Zoom Top View:{' '}
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
