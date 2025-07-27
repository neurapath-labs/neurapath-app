/* ------------------------------------------------------------------
   src/lib/stores/database.store.ts
   — Svelte store that holds the current user’s DB blob in memory
------------------------------------------------------------------- */

import { writable } from 'svelte/store';
import type { Record } from '$lib/models';

import {
  /* READ public or private DB */
  fetchPublicDatabaseByUser,

  /* WRITE helpers, password sent as 2nd arg */
  addRecord as serviceAddRecord,
  updateRecord as serviceUpdateRecord,
  deleteRecord as serviceDeleteRecord,
  saveMyDatabase as serviceSaveMyDb
} from '$lib/services/database.service';

/* -------------------------------------------------
   Store shape & initial value
------------------------------------------------- */
export interface Database {
  items: Record[];
}

const initialState: Database = { items: [] };
const { subscribe, set, update } = writable<Database>(initialState);

/* -------------------------------------------------
   Session state – set via setCurrentUserId()
------------------------------------------------- */
let currentUserId: string | null = null;
let lastSyncTime: number | null = null;

/* -------------------------------------------------
   Utilities
------------------------------------------------- */
const getState = (): Database => {
  let state: Database = initialState;
  const unsub = subscribe((s) => (state = s));
  unsub();
  return state;
};

export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

/* -------------------------------------------------
   CRUD helpers – write‑through to Cloudflare Worker
   (password arg left empty for now -> '')
------------------------------------------------- */
export const getRecordById = (id: string) =>
  getState().items.find((r) => r.id === id);

/* ---------- ADD ---------- */
export const addRecord = async (record: Record) => {
  update((db) => ({ ...db, items: [...db.items, record] }));

  if (currentUserId) {
    await serviceAddRecord(currentUserId, '', record);
  }
};

/* ---------- DELETE ---------- */
export const removeRecordById = async (id: string) => {
  update((db) => ({ ...db, items: db.items.filter((r) => r.id !== id) }));

  if (currentUserId) {
    await serviceDeleteRecord(currentUserId, '', id);
  }
};

/* ---------- UPDATE ---------- */
export const updateRecordLocally = (id: string, changes: Partial<Record>) =>
  update((db) => ({
    ...db,
    items: db.items.map((r) => (r.id === id ? { ...r, ...changes } : r))
  }));

export const updateRecordRemotely = async (
  id: string,
  changes: Partial<Record>
) => {
  updateRecordLocally(id, changes);

  if (currentUserId) {
    const record = getRecordById(id);
    if (record) {
      await serviceUpdateRecord(currentUserId, '', { ...record, ...changes });
    }
  }
};

/* -------------------------------------------------
   Whole‑DB operations
------------------------------------------------- */
export const loadDatabase = async (userId: string) => {
  try {
    const data = await fetchPublicDatabaseByUser(userId);
    console.log("Fetching public database: ", data);

    if (data && (data as any).items) {
      set({ items: (data as any).items as Record[] });
      lastSyncTime = Date.now();
    } else {
      // Initialise empty DB for new users
      set(initialState);
      lastSyncTime = Date.now();
      if (currentUserId) {
        await serviceSaveMyDb(userId, '', initialState);
      }
    }
  } catch (err) {
    console.error('loadDatabase failed – falling back to empty DB', err);
    set(initialState);
    lastSyncTime = Date.now();
  }
};

export const saveDatabase = async (userId: string) => {
  const db = getState();
  await serviceSaveMyDb(userId, '', db);
  lastSyncTime = Date.now();
};

export const syncDatabase = async (userId: string) => saveDatabase(userId);

export const needsSync = () => {
  if (!lastSyncTime) return true;
  return Date.now() - lastSyncTime > 5 * 60 * 1000; // 5 min
};

/* -------------------------------------------------
   Public API
------------------------------------------------- */
export const database = {
  subscribe,
  set,
  update,
  getRecordById,
  addRecord,
  removeRecordById,
  updateRecord: updateRecordLocally,
  updateRecordRemotely,
  loadDatabase,
  saveDatabase,
  syncDatabase,
  needsSync,
  setCurrentUserId
};
