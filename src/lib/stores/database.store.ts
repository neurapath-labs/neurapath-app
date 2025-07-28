/* ------------------------------------------------------------------
   src/lib/stores/database.store.ts
   — Svelte store that holds the current user’s DB blob in memory
------------------------------------------------------------------- */

import { writable } from 'svelte/store';
import type { Record } from '$lib/models';
import { lastSaved } from '$lib/stores/lastSaved.store';

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
let currentUserPassword: string | null = null;
let lastSyncTime: number | null = null;

/* -------------------------------------------------
   Utilities
------------------------------------------------- */
const getState = (): Database => {
  let state: Database = initialState;
  const unsub = subscribe((s) => {
    state = s;
  });
  unsub();
  return state;
};

export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const setCurrentUserPassword = (password: string | null) => {
  currentUserPassword = password;
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
    await serviceAddRecord(currentUserId, currentUserPassword || '', record);
  }
};

/* ---------- DELETE ---------- */
export const removeRecordById = async (id: string) => {
  update((db) => ({ ...db, items: db.items.filter((r) => r.id !== id) }));

  if (currentUserId) {
    await serviceDeleteRecord(currentUserId, currentUserPassword || '', id);
  }
};

/* ---------- UPDATE ---------- */
export const updateRecordLocally = (id: string, changes: Partial<Record>) =>
  update((db) => ({
    ...db,
    items: db.items.map((r) => (r.id === id ? { ...r, ...changes } : r))
  }));

/* ---------- MOVE ---------- */
export const moveItem = async (itemId: string, newParentPath: string) => {
  update((db) => {
    const updatedItems = db.items.map((item) => {
      if (item.id === itemId) {
        // Extract the item name from the current ID
        const itemName = item.id.split('/').pop() || '';
        // Create new ID with the new parent path
        const newId = newParentPath ? `${newParentPath}/${itemName}` : itemName;
        return { ...item, id: newId };
      } else if (item.id.startsWith(`${itemId}/`)) {
        // Handle children of the moved item
        const itemName = itemId.split('/').pop() || '';
        const relativePath = item.id.substring(itemId.length + 1);
        const newId = newParentPath ? `${newParentPath}/${itemName}/${relativePath}` : `${itemName}/${relativePath}`;
        return { ...item, id: newId };
      }
      return item;
    });
    return { ...db, items: updatedItems };
  });

  // Update remotely if user is logged in
  if (currentUserId) {
    const item = getRecordById(itemId);
    if (item) {
      const itemName = item.id.split('/').pop() || '';
      const newId = newParentPath ? `${newParentPath}/${itemName}` : itemName;
      await serviceUpdateRecord(currentUserId, currentUserPassword || '', { ...item, id: newId });
    }
  }
};

export const updateRecordRemotely = async (
  id: string,
  changes: Partial<Record>
) => {
  updateRecordLocally(id, changes);

  if (currentUserId) {
    const record = getRecordById(id);
    if (record) {
      await serviceUpdateRecord(currentUserId, currentUserPassword || '', { ...record, ...changes });
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

    // Handle different data formats from backend
    let items: Record[] = [];
    if (data) {
      if ((data as any).items) {
        // Already in correct format
        items = (data as any).items as Record[];
      } else if ((data as any).records) {
        // Backend returns { records: [...] }
        items = (data as any).records as Record[];
      } else if ((data as any).data && (data as any).data.records) {
        // Backend returns { data: { records: [...] } }
        items = (data as any).data.records as Record[];
      }
    }

    if (items.length > 0) {
      set({ items });
      lastSyncTime = Date.now();
    } else {
      // Initialise empty DB for new users
      set(initialState);
      lastSyncTime = Date.now();
      if (currentUserId) {
        await serviceSaveMyDb(userId, currentUserPassword || '', { records: [] });
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
  // Convert Database object to Record<string, unknown>
  const dbRecord: { [key: string]: unknown } = {
    records: db.items
  };
  await serviceSaveMyDb(userId, currentUserPassword || '', dbRecord);
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
  moveItem,
  loadDatabase,
  saveDatabase,
  syncDatabase,
  needsSync,
  setCurrentUserId,
  setCurrentUserPassword
};
