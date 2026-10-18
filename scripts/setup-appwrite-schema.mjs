import { Client, Databases, Permission, Role, ID } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const SOPREMISH_USER_ID = '6ad505ae003d79a2a045';
const GRAPE_USER_ID = '6ad5063a0023350d0280';
const WORLD_ID = 'living_room_1';

const READ_PERMS = [
  Permission.read(Role.user(SOPREMISH_USER_ID)),
  Permission.read(Role.user(GRAPE_USER_ID)),
];

async function ensureCollection(collectionId, name, permissions, documentSecurity = true) {
  try {
    const existing = await databases.getCollection(databaseId, collectionId);
    console.log(`Collection "${name}" (${collectionId}) already exists.`);
    return existing;
  } catch (err) {
    if (err.code === 404) {
      console.log(`Creating collection "${name}" (${collectionId})...`);
      return await databases.createCollection(
        databaseId,
        collectionId,
        name,
        permissions,
        documentSecurity
      );
    }
    throw err;
  }
}

async function waitForAttribute(collectionId, key) {
  for (let i = 0; i < 30; i++) {
    const col = await databases.getCollection(databaseId, collectionId);
    const attr = col.attributes.find((a) => a.key === key);
    if (attr && attr.status === 'available') {
      return true;
    }
    if (attr && attr.status === 'failed') {
      throw new Error(`Attribute ${key} creation failed on ${collectionId}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function ensureStringAttr(colId, key, size, required = false) {
  const col = await databases.getCollection(databaseId, colId);
  const exists = col.attributes.some((a) => a.key === key);
  if (!exists) {
    console.log(`  Creating string attr "${key}" (${size}) on ${colId}...`);
    await databases.createStringAttribute(databaseId, colId, key, size, required);
    await waitForAttribute(colId, key);
  }
}

async function ensureFloatAttr(colId, key, required = false) {
  const col = await databases.getCollection(databaseId, colId);
  const exists = col.attributes.some((a) => a.key === key);
  if (!exists) {
    console.log(`  Creating float attr "${key}" on ${colId}...`);
    await databases.createFloatAttribute(databaseId, colId, key, required);
    await waitForAttribute(colId, key);
  }
}

async function ensureIntegerAttr(colId, key, required = false) {
  const col = await databases.getCollection(databaseId, colId);
  const exists = col.attributes.some((a) => a.key === key);
  if (!exists) {
    console.log(`  Creating integer attr "${key}" on ${colId}...`);
    await databases.createIntegerAttribute(databaseId, colId, key, required);
    await waitForAttribute(colId, key);
  }
}

async function ensureBooleanAttr(colId, key, required = false) {
  const col = await databases.getCollection(databaseId, colId);
  const exists = col.attributes.some((a) => a.key === key);
  if (!exists) {
    console.log(`  Creating boolean attr "${key}" on ${colId}...`);
    await databases.createBooleanAttribute(databaseId, colId, key, required);
    await waitForAttribute(colId, key);
  }
}

async function ensureDocument(collectionId, docId, data, permissions) {
  try {
    await databases.getDocument(databaseId, collectionId, docId);
    console.log(`Document ${docId} in ${collectionId} exists.`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`Creating document ${docId} in ${collectionId}...`);
      await databases.createDocument(databaseId, collectionId, docId, data, permissions);
    } else {
      throw err;
    }
  }
}

async function setup() {
  console.log('--- Setting up Appwrite Tables & Realtime Collections ---');

  // 1. PROFILES Collection
  await ensureCollection('profiles', 'Profiles', READ_PERMS, false);
  await ensureStringAttr('profiles', 'user_id', 64, true);
  await ensureStringAttr('profiles', 'display_name', 64, true);
  await ensureStringAttr('profiles', 'avatar_id', 32, true);
  await ensureStringAttr('profiles', 'created_at', 64, false);

  // 2. WORLDS Collection
  await ensureCollection('worlds', 'Worlds', READ_PERMS, false);
  await ensureStringAttr('worlds', 'name', 64, true);
  await ensureStringAttr('worlds', 'owner_id', 64, true);
  await ensureStringAttr('worlds', 'room_version', 32, true);

  // 3. WORLD MEMBERS Collection
  await ensureCollection('world_members', 'World Members', READ_PERMS, false);
  await ensureStringAttr('world_members', 'world_id', 64, true);
  await ensureStringAttr('world_members', 'user_id', 64, true);
  await ensureStringAttr('world_members', 'role', 32, true);
  await ensureStringAttr('world_members', 'joined_at', 64, false);

  // 4. PLAYER STATES Collection (Realtime movement & presence)
  const playerStatePerms = [
    Permission.read(Role.user(SOPREMISH_USER_ID)),
    Permission.read(Role.user(GRAPE_USER_ID)),
    Permission.create(Role.user(SOPREMISH_USER_ID)),
    Permission.create(Role.user(GRAPE_USER_ID)),
    Permission.update(Role.user(SOPREMISH_USER_ID)),
    Permission.update(Role.user(GRAPE_USER_ID)),
  ];
  await ensureCollection('player_states', 'Player States', playerStatePerms, true);
  await ensureStringAttr('player_states', 'user_id', 64, true);
  await ensureStringAttr('player_states', 'world_id', 64, true);
  await ensureFloatAttr('player_states', 'x', true);
  await ensureFloatAttr('player_states', 'y', true);
  await ensureStringAttr('player_states', 'direction', 16, true);
  await ensureIntegerAttr('player_states', 'anim_frame', false);
  await ensureBooleanAttr('player_states', 'is_moving', false);
  await ensureIntegerAttr('player_states', 'seq', false);
  await ensureIntegerAttr('player_states', 'updated_at', false);

  console.log('\n--- Seeding Initial World & Members Data ---');

  // Seed Profiles
  await ensureDocument(
    'profiles',
    SOPREMISH_USER_ID,
    {
      user_id: SOPREMISH_USER_ID,
      display_name: 'Sopremish',
      avatar_id: 'avatar_sopremish',
      created_at: new Date().toISOString(),
    },
    READ_PERMS
  );

  await ensureDocument(
    'profiles',
    GRAPE_USER_ID,
    {
      user_id: GRAPE_USER_ID,
      display_name: 'Grape',
      avatar_id: 'avatar_grape',
      created_at: new Date().toISOString(),
    },
    READ_PERMS
  );

  // Seed World
  await ensureDocument(
    'worlds',
    WORLD_ID,
    {
      name: "Sopremish & Grape's Living Room",
      owner_id: SOPREMISH_USER_ID,
      room_version: '1.0.0',
    },
    READ_PERMS
  );

  // Seed Memberships
  await ensureDocument(
    'world_members',
    `member_${SOPREMISH_USER_ID}`,
    {
      world_id: WORLD_ID,
      user_id: SOPREMISH_USER_ID,
      role: 'owner',
      joined_at: new Date().toISOString(),
    },
    READ_PERMS
  );

  await ensureDocument(
    'world_members',
    `member_${GRAPE_USER_ID}`,
    {
      world_id: WORLD_ID,
      user_id: GRAPE_USER_ID,
      role: 'member',
      joined_at: new Date().toISOString(),
    },
    READ_PERMS
  );

  // Seed initial Player States for both users
  const sopremishStatePerms = [
    Permission.read(Role.user(SOPREMISH_USER_ID)),
    Permission.read(Role.user(GRAPE_USER_ID)),
    Permission.update(Role.user(SOPREMISH_USER_ID)),
    Permission.delete(Role.user(SOPREMISH_USER_ID)),
  ];

  await ensureDocument(
    'player_states',
    SOPREMISH_USER_ID,
    {
      user_id: SOPREMISH_USER_ID,
      world_id: WORLD_ID,
      x: 190.0,
      y: 140.0,
      direction: 'down',
      anim_frame: 0,
      is_moving: false,
      seq: 1,
      updated_at: Date.now(),
    },
    sopremishStatePerms
  );

  const grapeStatePerms = [
    Permission.read(Role.user(SOPREMISH_USER_ID)),
    Permission.read(Role.user(GRAPE_USER_ID)),
    Permission.update(Role.user(GRAPE_USER_ID)),
    Permission.delete(Role.user(GRAPE_USER_ID)),
  ];

  await ensureDocument(
    'player_states',
    GRAPE_USER_ID,
    {
      user_id: GRAPE_USER_ID,
      world_id: WORLD_ID,
      x: 230.0,
      y: 140.0,
      direction: 'down',
      anim_frame: 0,
      is_moving: false,
      seq: 1,
      updated_at: Date.now(),
    },
    grapeStatePerms
  );

  console.log('\n--- Schema and Seed Complete! ---');
}

setup().catch((e) => {
  console.error('Setup failed:', e);
  process.exit(1);
});
