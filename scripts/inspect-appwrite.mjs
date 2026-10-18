import { Client, Users, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log('Testing Appwrite connection with:');
console.log('Endpoint:', endpoint);
console.log('Project ID:', projectId);
console.log('Database ID:', databaseId);

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const users = new Users(client);
const databases = new Databases(client);

async function run() {
  try {
    console.log('\n--- Checking Users ---');
    const userList = await users.list();
    console.log(`Found ${userList.total} user(s):`);
    for (const u of userList.users) {
      console.log(`- ID: ${u.$id}, Name: ${u.name}, Email: ${u.email}`);
    }

    console.log('\n--- Checking Database ---');
    const db = await databases.get(databaseId);
    console.log(`Database "${db.name}" (${db.$id}) found.`);

    console.log('\n--- Checking Collections ---');
    const cols = await databases.listCollections(databaseId);
    console.log(`Found ${cols.total} collection(s):`);
    for (const c of cols.collections) {
      console.log(`- ID: ${c.$id}, Name: ${c.name}`);
    }
  } catch (err) {
    console.error('Error during Appwrite inspection:', err);
  }
}

run();
