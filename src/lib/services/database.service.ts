/* src/lib/database.service.ts */
import type {
  Database,
  Record as DBRecord,
  User
} from '$lib/models';

const BASE = 'https://neurapath-backend.neurapath.workers.dev';

/* ---------- helpers ---------- */
function buildHeaders(username?: string, password?: string): Headers {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (username && password) {
    // Basic <base64(username:password)>
    headers.set('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
  }
  return headers;
}

async function handle<ResponseShape = unknown>(promise: Promise<Response>) {
  const res = await promise;
  const json = await res.json();
  if (!res.ok || json?.error) {
    throw new Error(json?.message ?? `Request failed with status ${res.status}`);
  }
  return json as ResponseShape;
}

/* ---------- auth / user ---------- */
export async function register(username: string, password: string) {
  return handle(
    fetch(`${BASE}/user/register`, {
      method: 'POST',
      headers: buildHeaders(username, password)
    })
  );
}

export async function login(username: string, password: string) {
  console.log('[DatabaseService] Attempting login for user:', username);
  // successful response ⇒ credentials are valid
  const result = await handle<unknown>(
    fetch(`${BASE}/user/data`, {
      method: 'GET',
      headers: buildHeaders(username, password)
    })
  );
  console.log('[DatabaseService] Login successful for user:', username);
  return result;
}

export async function deleteAccount(username: string, password: string) {
  return handle(
    fetch(`${BASE}/user/delete`, {
      method: 'POST',
      headers: buildHeaders(username, password)
    })
  );
}

export async function setDatabasePublic(
  username: string,
  password: string,
  value: boolean
) {
  return handle(
    fetch(`${BASE}/user/set/public/${value}`, {
      method: 'POST',
      headers: buildHeaders(username, password)
    })
  );
}

/* ---------- current user’s database ---------- */
export async function fetchMyDatabase(username: string, password: string) {
  return handle<Record<string, unknown>>(
    fetch(`${BASE}/user/data`, {
      method: 'GET',
      headers: buildHeaders(username, password)
    })
  );
}

export async function saveMyDatabase(
  username: string,
  password: string,
  data: Record<string, unknown>
) {
  return handle(
    fetch(`${BASE}/user/data`, {
      method: 'POST',
      headers: buildHeaders(username, password),
      body: JSON.stringify(data)
    })
  );
}

/* ---------- other people’s public databases ---------- */
export async function getPublicDatabases(): Promise<Database[]> {
  const { databases = [] } = await handle<{ databases: string[] }>(
    fetch(`${BASE}/public/data`)
  );

  // Map simple usernames → UI‑friendly objects
  return databases.map((name) => ({ id: name, name }));
}

export async function fetchPublicDatabaseByUser(username: string) {
  return handle<Record<string, unknown>>(
    fetch(`${BASE}/user/data/${username}`)
  );
}

/* ---------- convenience helpers for record‑level ops ---------- */
// We manipulate the whole DB blob on the server, but expose record‑level
// helpers in the frontend so components stay simple.

export async function addRecord(
  username: string,
  password: string,
  record: DBRecord
) {
  const db = await fetchMyDatabase(username, password);
  db[record.id] = record;
  return saveMyDatabase(username, password, db);
}

export async function updateRecord(
  username: string,
  password: string,
  record: DBRecord
) {
  return addRecord(username, password, record); // overwrite
}

export async function deleteRecord(
  username: string,
  password: string,
  id: string
) {
  const db = await fetchMyDatabase(username, password);
  delete db[id];
  return saveMyDatabase(username, password, db);
}

/* ---------- leaderboard (optional UI tab) ---------- */
export async function getLeaderboard() {
  return handle<{ users: { Username: string; Repetitions: number; Retention: number }[] }>(
    fetch(`${BASE}/leaderboard`)
  );
}

export async function incrementLeaderboard(username: string) {
  return handle(
    fetch(`${BASE}/leaderboard/${username}/increase`, {
      method: 'POST',
      headers: buildHeaders()
    })
  );
}

export async function decrementLeaderboard(username: string) {
  return handle(
    fetch(`${BASE}/leaderboard/${username}/decrease`, {
      method: 'POST',
      headers: buildHeaders()
    })
  );
}
