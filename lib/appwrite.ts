import { Client, Account, Databases } from 'appwrite';

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6ad50486000e1ad5a4e5';
export const databaseId =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6ad50549003e5f481b5b';

// Appwrite browser client instance
export const client = new Client().setEndpoint(endpoint).setProject(projectId);
export const account = new Account(client);
export const databases = new Databases(client);

// Exact stable User IDs from Appwrite Cloud
export const SOPREMISH_USER_ID = '6ad505ae003d79a2a045';
export const GRAPE_USER_ID = '6ad5063a0023350d0280';
export const WORLD_ID = 'living_room_1';

export const COLLECTIONS = {
  PROFILES: 'profiles',
  WORLDS: 'worlds',
  WORLD_MEMBERS: 'world_members',
  PLAYER_STATES: 'player_states',
} as const;

export interface AuthorizedUserProfile {
  id: string;
  name: string;
  email: string;
  avatarId: string;
}

export const AUTHORIZED_USERS: Record<string, AuthorizedUserProfile> = {
  [SOPREMISH_USER_ID]: {
    id: SOPREMISH_USER_ID,
    name: 'Sopremish',
    email: 'premsonarofficial@gmail.com',
    avatarId: 'avatar_sopremish',
  },
  [GRAPE_USER_ID]: {
    id: GRAPE_USER_ID,
    name: 'Grape',
    email: 'grishma11052007@gmail.com',
    avatarId: 'avatar_grape',
  },
};

export function isAuthorizedUser(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return Boolean(AUTHORIZED_USERS[userId]);
}

export function getOtherAuthorizedUserId(myUserId: string): string {
  return myUserId === SOPREMISH_USER_ID ? GRAPE_USER_ID : SOPREMISH_USER_ID;
}
