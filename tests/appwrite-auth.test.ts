import { describe, it, expect } from 'vitest';
import {
  isAuthorizedUser,
  getOtherAuthorizedUserId,
  AUTHORIZED_USERS,
  SOPREMISH_USER_ID,
  GRAPE_USER_ID,
} from '@/lib/appwrite';
import { createSessionToken, getSessionPayload } from '@/lib/auth';

describe('Appwrite Multi-User Authorization & Identity Rules', () => {
  it('strictly approves Sopremish and Grape user IDs', () => {
    expect(isAuthorizedUser(SOPREMISH_USER_ID)).toBe(true);
    expect(isAuthorizedUser(GRAPE_USER_ID)).toBe(true);
  });

  it('strictly denies unauthorized user IDs', () => {
    expect(isAuthorizedUser('unauthorized_user_12345')).toBe(false);
    expect(isAuthorizedUser('attacker_anonymous_guest')).toBe(false);
    expect(isAuthorizedUser('')).toBe(false);
    expect(isAuthorizedUser(null)).toBe(false);
    expect(isAuthorizedUser(undefined)).toBe(false);
  });

  it('correctly maps the counterpart player ID', () => {
    expect(getOtherAuthorizedUserId(SOPREMISH_USER_ID)).toBe(GRAPE_USER_ID);
    expect(getOtherAuthorizedUserId(GRAPE_USER_ID)).toBe(SOPREMISH_USER_ID);
  });

  it('preserves distinct profile and avatar configurations for both players', () => {
    const sopremish = AUTHORIZED_USERS[SOPREMISH_USER_ID];
    expect(sopremish).toBeDefined();
    expect(sopremish.name).toBe('Sopremish');
    expect(sopremish.email).toBe('premsonarofficial@gmail.com');
    expect(sopremish.avatarId).toBe('avatar_sopremish');

    const grape = AUTHORIZED_USERS[GRAPE_USER_ID];
    expect(grape).toBeDefined();
    expect(grape.name).toBe('Grape');
    expect(grape.email).toBe('grishma11052007@gmail.com');
    expect(grape.avatarId).toBe('avatar_grape');
  });

  it('stores and retrieves authenticated user ID in session token', async () => {
    const token = await createSessionToken(SOPREMISH_USER_ID);
    expect(typeof token).toBe('string');

    const payload = await getSessionPayload(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(SOPREMISH_USER_ID);
  });
});
