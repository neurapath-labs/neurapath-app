import type { Record } from '$lib/models';
import { database } from '$lib/stores/database.store';
import { profile } from '$lib/stores/profile.store';
import { get } from 'svelte/store';

// Generate a shareable link for a specific item
export const generateShareableLink = (itemId: string): string => {
  // In a real implementation, this would generate a unique URL
  // For now, we'll create a mock URL with the item ID
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${itemId}`;
};

// Make an item public (shareable)
export const makeItemPublic = async (itemId: string): Promise<boolean> => {
  try {
    // Get the current item
    const currentItem = database.getRecordById(itemId);
    if (!currentItem) {
      throw new Error('Item not found');
    }

    // Update the item to make it public
    await database.updateRecordRemotely(itemId, {
      ...currentItem,
      isPublic: true
    });

    return true;
  } catch (error) {
    console.error('Error making item public:', error);
    throw error;
  }
};

// Make an item private (not shareable)
export const makeItemPrivate = async (itemId: string): Promise<boolean> => {
  try {
    // Get the current item
    const currentItem = database.getRecordById(itemId);
    if (!currentItem) {
      throw new Error('Item not found');
    }

    // Update the item to make it private
    await database.updateRecordRemotely(itemId, {
      ...currentItem,
      isPublic: false
    });

    return true;
  } catch (error) {
    console.error('Error making item private:', error);
    throw error;
  }
};

// Toggle the public status of an item
export const toggleItemPublicStatus = async (itemId: string): Promise<boolean> => {
  try {
    // Get the current item
    const currentItem = database.getRecordById(itemId);
    if (!currentItem) {
      throw new Error('Item not found');
    }

    // Toggle the public status
    const newPublicStatus = !(currentItem.isPublic ?? false);
    
    await database.updateRecordRemotely(itemId, {
      ...currentItem,
      isPublic: newPublicStatus
    });

    return newPublicStatus;
  } catch (error) {
    console.error('Error toggling item public status:', error);
    throw error;
  }
};

// Get public status of an item
export const getItemPublicStatus = (itemId: string): boolean => {
  const currentItem = database.getRecordById(itemId);
  return currentItem ? !!(currentItem.isPublic ?? false) : false;
};

// Get all public items
export const getPublicItems = (): Record[] => {
  const currentDatabase = get(database);
  return currentDatabase.items.filter(item => item.isPublic ?? false);
};

// Make entire database public
export const makeDatabasePublic = async (): Promise<boolean> => {
  try {
    profile.updateProfile({ isDatabasePublic: true });
    return true;
  } catch (error) {
    console.error('Error making database public:', error);
    throw error;
  }
};

// Make entire database private
export const makeDatabasePrivate = async (): Promise<boolean> => {
  try {
    profile.updateProfile({ isDatabasePublic: false });
    return true;
  } catch (error) {
    console.error('Error making database private:', error);
    throw error;
  }
};

// Get database public status
export const getDatabasePublicStatus = (): boolean => {
  const currentProfile = get(profile);
  return currentProfile.isDatabasePublic;
};