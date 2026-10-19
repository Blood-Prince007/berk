import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  getSessionPayload,
} from '@/lib/auth';
import { isAuthorizedUser } from '@/lib/appwrite';

export async function GET() {
  try {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    const session = await getSessionPayload(sessionCookie);

    if (!session || !session.userId || !isAuthorizedUser(session.userId)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || !isAuthorizedUser(userId)) {
      return NextResponse.json(
        { error: 'Access denied: User is not an authorized member.' },
        { status: 403 }
      );
    }

    const token = await createSessionToken(userId);

    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error('Session sync error:', err);
    return NextResponse.json(
      { error: 'Failed to establish session' },
      { status: 500 }
    );
  }
}
