import { writable } from 'svelte/store';
import type { Record } from '$lib/models';
import { getDatabaseByID, createRecord, updateRecord, deleteRecord, updateDatabase } from '$lib/services/database.service';

export interface Database {
  items: Record[];
}

// Initialize with empty items array
const initialState: Database = {
  items: []
};

// Last sync timestamp
let lastSyncTime: number | null = null;

// Load database from server
export const loadDatabase = async (userId: string) => {
  try {
    const data = await getDatabaseByID(userId);
    if (data && data.items) {
      set({ items: data.items });
      lastSyncTime = Date.now();
    } else {
      // If no data exists, initialize with default items
      const defaultItems: Record[] = [
        {
          id: "Quick start",
          contentType: "Extract",
          content: {
            "ops": [
              {
                "attributes": {
                  "bold": true
                },
                "insert": "Welcome to Eve!"
              },
              {
                "insert": "\n\n"
              },
              {
                "attributes": {},
                "insert": "This is an alpha release which does mean that the product may consist of bugs here and there. Therefore there are a few things you need to know: when working in Eve please do export the database frequently via the profile page. This means that you will save all your content on your local store which you will be able to import later on if something goes wrong. The platform has only been tested on Safari and Chrome, avoid internet explorer when using Eve. If you find any bugs please report them asap for us to fix them as fast as possible. This can be done via the bugs channel. Any recommendation for a new feature? Then there is a suggestions channel for this. "
              }
            ]
          }
        },
        {
          id: "Folder1",
          contentType: "Folder"
        },
        {
          id: "Folder2",
          contentType: "Folder"
        },
        {
          id: "Folder2/Folder3",
          contentType: "Folder"
        },
        {
          id: "Folder2/Folder4",
          contentType: "Folder"
        },
        {
          id: "Folder2/Folder4/Folder5",
          contentType: "Folder"
        }
      ];
      set({ items: defaultItems });
      lastSyncTime = Date.now();
      // Save default data to server
      await updateDatabase(userId, { items: defaultItems });
    }
  } catch (error) {
    console.error('Error loading database:', error);
    // Fallback to default items if loading fails
    const defaultItems: Record[] = [
      {
        id: "Quick start",
        contentType: "Extract",
        content: {
          "ops": [
            {
              "attributes": {
                "bold": true
              },
              "insert": "Welcome to Eve!"
            },
            {
              "insert": "\n\n"
            },
            {
              "attributes": {},
              "insert": "This is an alpha release which does mean that the product may consist of bugs here and there. Therefore there are a few things you need to know: when working in Eve please do export the database frequently via the profile page. This means that you will save all your content on your local store which you will be able to import later on if something goes wrong. The platform has only been tested on Safari and Chrome, avoid internet explorer when using Eve. If you find any bugs please report them asap for us to fix them as fast as possible. This can be done via the bugs channel. Any recommendation for a new feature? Then there is a suggestions channel for this. "
            }
          ]
        }
      },
      {
        id: "Folder1",
        contentType: "Folder"
      },
      {
        id: "Folder2",
        contentType: "Folder"
      },
      {
        id: "Folder2/Folder3",
        contentType: "Folder"
      },
      {
        id: "Folder2/Folder4",
        contentType: "Folder"
      },
      {
        id: "Folder2/Folder4/Folder5",
        contentType: "Folder"
      }
    ];
    set({ items: defaultItems });
    lastSyncTime = Date.now();
  }
};

// Save entire database to server
export const saveDatabase = async (userId: string) => {
  try {
    const currentDatabase = get();
    await updateDatabase(userId, currentDatabase);
    lastSyncTime = Date.now();
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
};

// Sync database with server
export const syncDatabase = async (userId: string) => {
  try {
    // For now, we'll just save the current database state
    // In a more advanced implementation, we might check for conflicts
    // and merge changes from the server
    await saveDatabase(userId);
    return true;
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

// Check if database needs sync (e.g., if it's been more than 5 minutes)
export const needsSync = (): boolean => {
  if (!lastSyncTime) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastSyncTime > fiveMinutes;
};

const { subscribe, set, update } = writable(initialState);
let currentUserId: string | null = null;

// Get current database state
const get = (): Database => {
  let currentState: Database | null = null;
  const unsubscribe = subscribe((state) => {
    currentState = state as Database;
  });
  if (currentState === null) {
    currentState = initialState;
  }
  unsubscribe();
  return currentState;
};

// Helper functions for working with the database
const getRecordById = (id: string) => {
  const currentState = get();
  return currentState.items.find(record => record.id === id);
};

const addRecord = async (record: Record) => {
  try {
    update(db => {
      return {
        ...db,
        items: [...db.items, record]
      };
    });
    
    // Save to server if user is logged in
    if (currentUserId) {
      await createRecord(currentUserId, record);
    }
  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  }
};

const removeRecordById = async (id: string) => {
  try {
    update(db => {
      return {
        ...db,
        items: db.items.filter(record => record.id !== id)
      };
    });
    
    // Delete from server if user is logged in
    if (currentUserId) {
      await deleteRecord(`${currentUserId}/${id}`);
    }
  } catch (error) {
    console.error('Error removing record:', error);
    throw error;
  }
};

const updateRecordLocally = (id: string, updates: Partial<Record>) => {
  update(db => {
    const items = db.items.map(record => {
      if (record.id === id) {
        return { ...record, ...updates };
      }
      return record;
    });
    
    return { ...db, items };
  });
};

const updateRecordRemotely = async (id: string, updates: Partial<Record>) => {
  try {
    // Update locally first
    updateRecordLocally(id, updates);
    
    // Update on server if user is logged in
    if (currentUserId) {
      const currentState = get();
      const record = currentState.items.find(record => record.id === id);
      if (record) {
        await updateRecord(`${currentUserId}/${id}`, { ...record, ...updates });
      }
    }
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

// Set current user ID for database operations
export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

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