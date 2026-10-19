import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLiveKitToken, getLiveKitCredentials } from '@/lib/livekit';
import { SOPREMISH_USER_ID, GRAPE_USER_ID, WORLD_ID } from '@/lib/appwrite';
import { createSessionToken } from '@/lib/auth';
import { TokenVerifier } from 'livekit-server-sdk';
import { POST } from '@/app/api/livekit/token/route';

// Mock next/headers cookies
const mockCookieMap = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookieMap.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, val: string) => mockCookieMap.set(name, val),
  }),
}));

describe('LiveKit Server-Side Token Generation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.LIVEKIT_API_KEY = 'devkey_test_berk';
    process.env.LIVEKIT_API_SECRET = 'secret_test_berk_32chars_long_enough!';
    process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://berk-test.livekit.cloud';
    process.env.BERK_SESSION_SECRET = 'session_test_secret_for_signing_32ch';
    mockCookieMap.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    mockCookieMap.clear();
  });

  it('reads LiveKit credentials from environment variables', () => {
    const creds = getLiveKitCredentials();
    expect(creds.apiKey).toBe('devkey_test_berk');
    expect(creds.apiSecret).toBe('secret_test_berk_32chars_long_enough!');
    expect(creds.url).toBe('wss://berk-test.livekit.cloud');
  });

  it('throws an error if LIVEKIT_API_KEY is missing', async () => {
    delete process.env.LIVEKIT_API_KEY;
    await expect(
      createLiveKitToken({ userId: SOPREMISH_USER_ID, roomName: WORLD_ID })
    ).rejects.toThrow('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing');
  });

  it('throws an error if LIVEKIT_API_SECRET is missing', async () => {
    delete process.env.LIVEKIT_API_SECRET;
    await expect(
      createLiveKitToken({ userId: SOPREMISH_USER_ID, roomName: WORLD_ID })
    ).rejects.toThrow('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing');
  });

  it('generates a valid signed LiveKit JWT for authorized user Sopremish', async () => {
    const token = await createLiveKitToken({
      userId: SOPREMISH_USER_ID,
      roomName: WORLD_ID,
    });

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    // Verify token payload using TokenVerifier from livekit-server-sdk
    const verifier = new TokenVerifier('devkey_test_berk', 'secret_test_berk_32chars_long_enough!');
    const claims = await verifier.verify(token);

    expect(claims.sub).toBe(SOPREMISH_USER_ID);
    expect(claims.name).toBe('Sopremish');
    expect(claims.video?.room).toBe(WORLD_ID);
    expect(claims.video?.roomJoin).toBe(true);
    expect(claims.video?.canPublish).toBe(true);
    expect(claims.video?.canSubscribe).toBe(true);
  });

  it('generates a valid signed LiveKit JWT for authorized user Grape', async () => {
    const token = await createLiveKitToken({
      userId: GRAPE_USER_ID,
      roomName: WORLD_ID,
    });

    const verifier = new TokenVerifier('devkey_test_berk', 'secret_test_berk_32chars_long_enough!');
    const claims = await verifier.verify(token);

    expect(claims.sub).toBe(GRAPE_USER_ID);
    expect(claims.name).toBe('Grape');
    expect(claims.video?.room).toBe(WORLD_ID);
  });

  describe('POST /api/livekit/token API Route', () => {
    it('rejects unauthenticated requests without session cookie (401)', async () => {
      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('rejects requests from unauthorized user IDs (403)', async () => {
      const unauthorizedToken = await createSessionToken('attacker_user_999');
      mockCookieMap.set('berk_session', unauthorizedToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('rejects requests attempting to join invalid or arbitrary rooms (400)', async () => {
      const validToken = await createSessionToken(SOPREMISH_USER_ID);
      mockCookieMap.set('berk_session', validToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: 'unauthorized_random_room' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid room');
    });

    it('returns 503 if LiveKit server credentials are not configured', async () => {
      delete process.env.LIVEKIT_API_KEY;
      const validToken = await createSessionToken(SOPREMISH_USER_ID);
      mockCookieMap.set('berk_session', validToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toContain('LiveKit service is not configured');
    });

    it('issues a valid LiveKit token for authenticated player Sopremish', async () => {
      const validToken = await createSessionToken(SOPREMISH_USER_ID);
      mockCookieMap.set('berk_session', validToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.url).toBe('wss://berk-test.livekit.cloud');
      expect(data.room).toBe(WORLD_ID);
      expect(data.userId).toBe(SOPREMISH_USER_ID);
      expect(data.name).toBe('Sopremish');
    });

    it('issues a valid LiveKit token for authenticated player Grape', async () => {
      const validToken = await createSessionToken(GRAPE_USER_ID);
      mockCookieMap.set('berk_session', validToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.userId).toBe(GRAPE_USER_ID);
      expect(data.name).toBe('Grape');
    });

    it('grants canPublish, canSubscribe, and canPublishData enabling screen-sharing media tracks', async () => {
      const validToken = await createSessionToken(SOPREMISH_USER_ID);
      mockCookieMap.set('berk_session', validToken);

      const req = new Request('http://localhost/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: WORLD_ID }),
      });

      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(200);

      const verifier = new TokenVerifier('devkey_test_berk', 'secret_test_berk_32chars_long_enough!');
      const claims = await verifier.verify(data.token);

      expect(claims.video?.canPublish).toBe(true);
      expect(claims.video?.canPublishData).toBe(true);
      expect(claims.video?.canSubscribe).toBe(true);
      expect(claims.video?.room).toBe(WORLD_ID);
    });
  });

  describe('Track Source Classification Logic', () => {
    it('accurately distinguishes screen-share video tracks from camera tracks', () => {
      const isScreenShareVideo = (source: string, kind: string) => source === 'screen_share' && kind === 'video';
      const isWebcamVideo = (source: string, kind: string) => source === 'camera' && kind === 'video';

      expect(isScreenShareVideo('screen_share', 'video')).toBe(true);
      expect(isScreenShareVideo('camera', 'video')).toBe(false);
      expect(isWebcamVideo('camera', 'video')).toBe(true);
      expect(isWebcamVideo('screen_share', 'video')).toBe(false);
    });

    it('accurately distinguishes screen-share audio from microphone audio', () => {
      const isScreenAudio = (source: string, kind: string) => source === 'screen_share_audio' && kind === 'audio';
      const isMicAudio = (source: string, kind: string) => source === 'microphone' && kind === 'audio';

      expect(isScreenAudio('screen_share_audio', 'audio')).toBe(true);
      expect(isScreenAudio('microphone', 'audio')).toBe(false);
      expect(isMicAudio('microphone', 'audio')).toBe(true);
      expect(isMicAudio('screen_share_audio', 'audio')).toBe(false);
    });
  });
});

