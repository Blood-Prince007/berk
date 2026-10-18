import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(sessionCookie);

  // Root route: redirect based on auth status
  if (pathname === '/') {
    const targetUrl = new URL(isAuthenticated ? '/world' : '/login', request.url);
    return NextResponse.redirect(targetUrl);
  }

  // World route: protected
  if (pathname.startsWith('/world')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Login route: redirect if already authenticated
  if (pathname === '/login') {
    if (isAuthenticated) {
      const worldUrl = new URL('/world', request.url);
      return NextResponse.redirect(worldUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/world', '/world/:path*'],
};
