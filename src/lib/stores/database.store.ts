/* ------------------------------------------------------------------
   src/lib/stores/database.store.ts
   — Svelte store that holds the current user’s DB blob in memory
------------------------------------------------------------------- */

import { writable } from 'svelte/store';
import type { Record } from '$lib/models';
// import { lastSaved } from '$lib/stores/lastSaved.store';

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
  profile?: import('$lib/models').Profile;
}

const initialState: Database = { items: [], profile: undefined };
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
  // Load the database when the user ID is set
  if (userId) {
    loadDatabase(userId);
  }
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
  // Capture current state and the record to remove
  const dbBefore = getState();
  const recordToRemove = dbBefore.items.find((r) => r.id === id);

  // Compute optional parent update if removing a Cloze subitem
  let parentIdToPersist: string | null = null;
  let parentUpdated: Record | null = null;

  if (recordToRemove && recordToRemove.contentType === 'Cloze') {
    const slashIndex = id.lastIndexOf('/');
    if (slashIndex > 0) {
      const parentId = id.substring(0, slashIndex);
      const parent = dbBefore.items.find((r) => r.id === parentId);
      const childCloze = (recordToRemove.clozes && recordToRemove.clozes[0]) || null;
      if (parent && parent.contentType === 'Extract' && parent.clozes && childCloze) {
        const nextClozes = parent.clozes.filter(
          (c) => !(c.startindex === childCloze.startindex && c.stopindex === childCloze.stopindex)
        );
        parentUpdated = { ...parent, clozes: nextClozes } as Record;
        parentIdToPersist = parent.id;
      }
    }
  }

  // Apply local state update: remove the record, and update parent clozes if needed
  update((db) => ({
    ...db,
    items: db.items
      .map((r) => (parentUpdated && r.id === parentUpdated.id ? parentUpdated : r))
      .filter((r) => r.id !== id)
  }));

  // Persist remote changes
  if (currentUserId) {
    // Delete the record remotely
    await serviceDeleteRecord(currentUserId, currentUserPassword || '', id);
    // Update the parent remotely if we modified its clozes
    if (parentIdToPersist) {
      const parentNow = getRecordById(parentIdToPersist);
      if (parentNow) {
        await serviceUpdateRecord(currentUserId, currentUserPassword || '', parentNow);
      }
    }
  }
};

/* ---------- DELETE FOLDER AND CONTENTS ---------- */
export const removeFolderAndContents = async (folderId: string) => {
  update((db) => ({
    ...db,
    items: db.items.filter(
      (r) => r.id !== folderId && !r.id.startsWith(`${folderId}/`)
    )
  }));

  if (currentUserId) {
    // Get the current database state
    const db = getState();

    // Find all items that are in this folder or its subfolders
    const itemsToRemove = db.items.filter(
      (r) => r.id === folderId || r.id.startsWith(`${folderId}/`)
    );

    // Delete all items remotely
    for (const item of itemsToRemove) {
      await serviceDeleteRecord(currentUserId, currentUserPassword || '', item.id);
    }
    
    // Save the database to ensure changes are persisted
    await saveDatabase(currentUserId);
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
  // Get the item name from the current ID
  const itemName = itemId.split('/').pop() || '';
  
  // Create new ID with the new parent path
  const newId = newParentPath ? `${newParentPath}/${itemName}` : itemName;
  
  // Get the current database state
  const db = getState();
  
  // Find the item and its children
  const itemToMove = db.items.find(item => item.id === itemId);
  const childItems = db.items.filter(item => item.id.startsWith(`${itemId}/`));
  
  // If item doesn't exist, return
  if (!itemToMove) return;

  // No-op: moving to same parent location
  if (newId === itemId) return;

  // Prevent duplicate name conflicts at destination and across subtree
  // Build sets of existing and prospective IDs to detect collisions
  const currentSubtreeIds = new Set([itemId, ...childItems.map((c) => c.id)]);
  const existingIdsExcludingSubtree = new Set(
    db.items.filter((i) => !currentSubtreeIds.has(i.id)).map((i) => i.id)
  );
  const prospectiveIds = new Set<string>([newId]);
  for (const childItem of childItems) {
    const relativePath = childItem.id.substring(itemId.length + 1);
    prospectiveIds.add(`${newId}/${relativePath}`);
  }
  for (const id of prospectiveIds) {
    if (existingIdsExcludingSubtree.has(id)) {
      // UI-level feedback here to match rename behavior
      if (typeof alert !== 'undefined') {
        alert('An item with that name already exists in the destination.');
      }
      return;
    }
  }

  // Filter out the item and its children from the current items
  const filteredItems = db.items.filter(item =>
    item.id !== itemId && !item.id.startsWith(`${itemId}/`)
  );
  
  // Update the item and its children with new IDs
  const movedItem = { ...itemToMove, id: newId };
  const movedChildren = childItems.map(childItem => {
    const relativePath = childItem.id.substring(itemId.length + 1);
    const childNewId = newParentPath ? `${newParentPath}/${itemName}/${relativePath}` : `${itemName}/${relativePath}`;
    return { ...childItem, id: childNewId };
  });
  
  // Update the database with filtered items plus moved items
  update((db) => ({
    ...db,
    items: [...filteredItems, movedItem, ...movedChildren]
  }));

  // Update remotely if user is logged in
  if (currentUserId) {
    // Delete the original item remotely
    await serviceDeleteRecord(currentUserId, currentUserPassword || '', itemId);
    
    // Add the moved item remotely
    await serviceAddRecord(currentUserId, currentUserPassword || '', movedItem);
    
    // Handle children if any
    for (const childItem of movedChildren) {
      // Delete the original child item remotely
      await serviceDeleteRecord(currentUserId, currentUserPassword || '',
        itemId + childItem.id.substring(newId.length));
      
      // Add the moved child item remotely
      await serviceAddRecord(currentUserId, currentUserPassword || '', childItem);
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


    // Handle different data formats from backend
    let items: Record[] = [];
    let profile: import('$lib/models').Profile | undefined = undefined;
    if (data) {
      if ((data as any).items) {
        // Already in correct format
        items = (data as any).items as Record[];
        profile = (data as any).profile as import('$lib/models').Profile | undefined;
      } else if ((data as any).records) {
        // Backend returns { records: [...] }
        items = (data as any).records as Record[];
      } else if ((data as any).data && (data as any).data.records) {
        // Backend returns { data: { records: [...] } }
        items = (data as any).data.records as Record[];
        if ((data as any).data.profile) {
          profile = (data as any).data.profile as import('$lib/models').Profile;
        }
      }
    }



    if (items.length > 0) {
      set({ items, profile });
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
    records: db.items,
    profile: db.profile
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
  removeFolderAndContents,
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
