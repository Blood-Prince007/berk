import { AccessToken } from 'livekit-server-sdk';
import { AUTHORIZED_USERS } from './appwrite';

export interface LiveKitTokenConfig {
  userId: string;
  roomName: string;
}

export function getLiveKitCredentials() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

  return { apiKey, apiSecret, url };
}

/**
 * Creates a signed LiveKit JWT for an authenticated BERK player.
 * Configures room grants for real-time one-to-one video/audio communication.
 */
export async function createLiveKitToken({ userId, roomName }: LiveKitTokenConfig): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitCredentials();

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing from server environment.');
  }

  const profile = AUTHORIZED_USERS[userId];
  const identityName = profile ? profile.name : userId;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: identityName,
    ttl: '6h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}
