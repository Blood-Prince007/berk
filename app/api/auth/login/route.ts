import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  validatePassword,
} from '@/lib/auth';
import { isAuthorizedUser, SOPREMISH_USER_ID } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password, userId } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    const isValid = await validatePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const targetUserId = userId && isAuthorizedUser(userId) ? userId : SOPREMISH_USER_ID;
    const token = await createSessionToken(targetUserId);

    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return NextResponse.json({ success: true, userId: targetUserId, redirectUrl: '/world' });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
