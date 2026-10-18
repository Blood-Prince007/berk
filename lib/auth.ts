export const SESSION_COOKIE_NAME = 'berk_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

function getSecretKey(): string {
  const secret = process.env.BERK_SESSION_SECRET || process.env.BERK_PASSWORD || 'berk-fallback-dev-secret-key-32chars';
  return secret;
}

async function getCryptoKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secret = getSecretKey();
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a signed session token containing an expiration timestamp.
 */
export async function createSessionToken(): Promise<string> {
  const payload = {
    exp: Date.now() + SESSION_DURATION_SECONDS * 1000,
    iat: Date.now(),
  };
  const encoder = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadStr));

  const key = await getCryptoKey('sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a session token. Returns true if valid and not expired, false otherwise.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const key = await getCryptoKey('verify');
    const encoder = new TextEncoder();
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValidSig) {
      return false;
    }

    const payloadBytes = base64UrlDecode(payloadB64);
    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(payloadBytes));

    if (!payload.exp || typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates the provided password against the server-side environment variable BERK_PASSWORD.
 * Uses timing-safe hash comparison.
 */
export async function validatePassword(inputPassword: unknown): Promise<boolean> {
  if (typeof inputPassword !== 'string' || !inputPassword) {
    return false;
  }

  const expectedPassword = process.env.BERK_PASSWORD;
  if (!expectedPassword) {
    console.error('BERK_PASSWORD environment variable is not set.');
    return false;
  }

  const encoder = new TextEncoder();
  const [inputHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(inputPassword)),
    crypto.subtle.digest('SHA-256', encoder.encode(expectedPassword)),
  ]);

  const inputBytes = new Uint8Array(inputHash);
  const expectedBytes = new Uint8Array(expectedHash);

  if (inputBytes.length !== expectedBytes.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < inputBytes.length; i++) {
    diff |= inputBytes[i] ^ expectedBytes[i];
  }

  return diff === 0;
}
