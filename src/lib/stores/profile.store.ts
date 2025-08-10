import { writable } from 'svelte/store';
import type { Profile, Shortcut } from '$lib/models';
import { database } from '$lib/stores/database.store';

// Default shortcuts based on the original script
const defaultShortcuts: Shortcut[] = [
  // Create occlusion (Ctrl/Cmd + Shift + O)
  {event: "input-create-occlusion", keyCode: 79, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + O"},
  // Create separate occlusions (Ctrl/Cmd + Shift + S)
  {event: "input-create-occlusion-separate", keyCode: 83, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + S"},
  // Show answer for occlusion (Ctrl/Cmd + Shift + A)
  {event: "input-show-occlusion", keyCode: 65, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + A"},
  // Create cloze (Ctrl/Cmd + Shift + C)
  {event: "input-create-cloze", keyCode: 67, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + C"},
  // Create extract from selection (Ctrl/Cmd + Shift + E)
  {event: "input-create-extract", keyCode: 69, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + E"},
  // Toggle spotlight search (Ctrl/Cmd + Space)
  {event: "input-spotlight-toggle", keyCode: 32, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + SPACE"},
  // Summarize selected text with AI (Ctrl/Cmd + Shift + M)
  {event: "input-text-summarize", keyCode: 77, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + M"},
  // Flag item (Ctrl/Cmd + Shift + F)
  {event: "input-flag-item", keyCode: 70, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + F"},
  // Remove selected item (Delete)
  {event: "input-remove-item", keyCode: 46, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "DELETE"},
  // Rename selected item (F2)
  {event: "input-rename-item", keyCode: 113, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "F2"},
  // Duplicate selected item (Ctrl/Cmd + D)
  {event: "input-duplicate-item", keyCode: 68, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + D"},
  // Create folder (Ctrl/Cmd + Shift + N)
  {event: "input-create-folder", keyCode: 78, altKey: false, metaKey: true, ctrlKey: true, shift: true, combination: "CTRL + SHIFT + N"},
  // Create text document (Ctrl/Cmd + N)
  {event: "input-create-text", keyCode: 78, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + N"},
  // Open settings (Ctrl/Cmd + ,)
  {event: "input-open-settings", keyCode: 188, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + ,"},
  // Grade items (1-5)
  {event: "input-grade-item1", keyCode: 49, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "1"},
  {event: "input-grade-item2", keyCode: 50, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "2"},
  {event: "input-grade-item3", keyCode: 51, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "3"},
  {event: "input-grade-item4", keyCode: 52, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "4"},
  {event: "input-grade-item5", keyCode: 53, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "5"},
  // Learning mode shortcuts
  {event: "learning-show-answer", keyCode: 32, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "SPACE"},
  {event: "learning-flag-item", keyCode: 70, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "F"},
  {event: "learning-skip-item", keyCode: 83, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "S"}
];

const defaultProfile: Profile = {
  version: "1.0.0",
  id: 0,
  reviewsTotalCount: 0,
  dueCount: 0,
  folderCount: 0,
  extractCount: 0,
  clozeCount: 0,
  occlusionCount: 0,
  isDatabasePublic: true,
  tutorialCompleted: false,
  mainWindowPadding: 8,
  leftSidebarPadding: 8,
  rightSidebarPadding: 8,
  fontSize: 18,
  showLeftSidebar: true,
  showRightSidebar: true,
  showExtractsInLearningMode: true,
  showOcclusionsInLearningMode: true,
  showClozesInLearningMode: true,
  showImagesInSidebar: true,
  mainWindowBackgroundColor: "#0000",
  mainWindowFontColor: "#0000",
  leftSidebarBackgroundColor: "#0000",
  rightSidebarBackgroundColor: "#0000",
  extractHighlightColor: "#f9ff24",
  clozeHighlightColor: "#73b9ff",
  showToolbar: true,
  theme: "day",
  acceptedPolicy: false,
  statistics: {},
  shortcuts: defaultShortcuts,
  openRouterApiKey: "",
  openRouterModel: "",
};

const { subscribe, set, update } = writable(defaultProfile);

// Initialize profile from database when it's loaded
database.subscribe((db) => {
  if (db && db.profile) {
    // Merge the database profile with default profile to ensure all fields are present
    const mergedProfile = {
      ...defaultProfile,
      ...db.profile,
      // Ensure AI settings have proper defaults if not set
      openRouterApiKey: db.profile.openRouterApiKey || defaultProfile.openRouterApiKey,
      openRouterModel: db.profile.openRouterModel || defaultProfile.openRouterModel,
    };
    set(mergedProfile);
  } else {
    // Initialize with default profile if no profile exists in database
    set(defaultProfile);
    // Also update the database with the default profile
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: defaultProfile
      };
      return updatedDb;
    });
  }
});

const updateProfile = (updates: Partial<Profile>) => {
  update(profile => {
    const updatedProfile = {
      ...profile,
      ...updates
    };

    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

const setTheme = (theme: string) => {
  update(profile => {
    const updatedProfile = {
      ...profile,
      theme
    };
    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

const toggleRightSidebar = () => {
  update(profile => {
    const updatedProfile = {
      ...profile,
      showRightSidebar: !profile.showRightSidebar
    };
    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

const toggleImagesInSidebar = () => {
  update(profile => {
    const updatedProfile = {
      ...profile,
      showImagesInSidebar: !profile.showImagesInSidebar
    };
    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

const updateShortcut = (event: string, shortcut: Shortcut) => {
  update(profile => {
    const shortcuts = profile.shortcuts.map(s =>
      s.event === event ? shortcut : s
    );
    const updatedProfile = {
      ...profile,
      shortcuts
    };
    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

const resetShortcutsToDefault = () => {
  update(profile => {
    const updatedProfile = {
      ...profile,
      shortcuts: defaultShortcuts
    };
    
    // Also update the profile in the database
    database.update((db) => {
      const updatedDb = {
        ...db,
        profile: updatedProfile
      };

      return updatedDb;
    });
    
    return updatedProfile;
  });
};

export const profile = {
  subscribe,
  set,
  updateProfile,
  setTheme,
  toggleRightSidebar,
  toggleImagesInSidebar,
  updateShortcut,
  resetShortcutsToDefault
};