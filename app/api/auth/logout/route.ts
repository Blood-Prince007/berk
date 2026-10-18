import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  cookies().delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true, redirectUrl: '/login' });
}

export async function GET(request: Request) {
  cookies().delete(SESSION_COOKIE_NAME);
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}
