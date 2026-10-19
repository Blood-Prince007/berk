import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, getSessionPayload } from '@/lib/auth';
import { isAuthorizedUser, AUTHORIZED_USERS, WORLD_ID } from '@/lib/appwrite';
import { createLiveKitToken, getLiveKitCredentials } from '@/lib/livekit';

export async function POST(request: Request) {
  try {
    // 1. Authenticate request using session cookie
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const session = await getSessionPayload(sessionCookie);

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid session cookie required' },
        { status: 401 }
      );
    }

    const { userId } = session;

    // 2. Authorize user
    if (!isAuthorizedUser(userId)) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to access this world' },
        { status: 403 }
      );
    }

    // 3. Reliable mapping to BERK's living room
    const body = await request.json().catch(() => ({}));
    const requestedRoom = typeof body?.room === 'string' && body.room.trim() ? body.room.trim() : WORLD_ID;

    // Only allow mapping to the authorized living room
    if (requestedRoom !== WORLD_ID) {
      return NextResponse.json(
        { error: `Invalid room: Only authorized BERK world "${WORLD_ID}" is permitted` },
        { status: 400 }
      );
    }

    // 4. Validate server-side LiveKit configuration
    const { apiKey, apiSecret, url } = getLiveKitCredentials();
    if (!apiKey || !apiSecret || !url) {
      return NextResponse.json(
        {
          error:
            'LiveKit service is not configured. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL.',
        },
        { status: 503 }
      );
    }

    // 5. Generate secure LiveKit access token
    const token = await createLiveKitToken({
      userId,
      roomName: WORLD_ID,
    });

    const userProfile = AUTHORIZED_USERS[userId];

    return NextResponse.json({
      success: true,
      token,
      url,
      room: WORLD_ID,
      userId,
      name: userProfile?.name || userId,
    });
  } catch (err: any) {
    console.error('Error generating LiveKit token:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while generating video token' },
      { status: 500 }
    );
  }
}
