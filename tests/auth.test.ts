import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validatePassword,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth';

describe('Authentication & Password Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.BERK_PASSWORD = 'super-secret-password-123';
    process.env.BERK_SESSION_SECRET = 'test-secret-salt-key-minimum-length';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('approves the correct password', async () => {
    const isValid = await validatePassword('super-secret-password-123');
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password without throwing', async () => {
    const isValid = await validatePassword('wrong-password');
    expect(isValid).toBe(false);
  });

  it('rejects empty, null, or undefined inputs', async () => {
    expect(await validatePassword('')).toBe(false);
    expect(await validatePassword(null)).toBe(false);
    expect(await validatePassword(undefined)).toBe(false);
    expect(await validatePassword(12345 as unknown as string)).toBe(false);
  });

  it('rejects passwords when BERK_PASSWORD is unset in environment', async () => {
    delete process.env.BERK_PASSWORD;
    const isValid = await validatePassword('super-secret-password-123');
    expect(isValid).toBe(false);
  });

  it('creates and verifies a valid session token', async () => {
    const token = await createSessionToken();
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = await verifySessionToken(token);
    expect(verified).toBe(true);
  });

  it('rejects a tampered session token', async () => {
    const token = await createSessionToken();
    const [payload, signature] = token.split('.');
    
    // Tamper with payload
    const tamperedToken = `${payload}xyz.${signature}`;
    expect(await verifySessionToken(tamperedToken)).toBe(false);

    // Tamper with signature
    const tamperedSig = `${payload}.${signature}abc`;
    expect(await verifySessionToken(tamperedSig)).toBe(false);
  });

  it('rejects malformed and empty tokens gracefully', async () => {
    expect(await verifySessionToken('')).toBe(false);
    expect(await verifySessionToken(null)).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken('invalid-non-dot-string')).toBe(false);
    expect(await verifySessionToken('a.b.c.too.many.dots')).toBe(false);
  });
});
