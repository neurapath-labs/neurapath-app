import { writable } from 'svelte/store';
import type { Profile, Shortcut } from '$lib/models';

// Default shortcuts based on the original script
const defaultShortcuts: Shortcut[] = [
  {event: "input-create-occlusion", keyCode: 90, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + Z"},
  {event: "input-create-occlusion-separate", keyCode: 188, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + <"},
  {event: "input-show-occlusion", keyCode: 32, altKey: false, metaKey: false, ctrlKey: false, shift: false, combination: "SPACE"},
  {event: "input-create-cloze", keyCode: 67, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + C"},
  {event: "input-create-extract", keyCode: 88, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + X"},
  {event: "input-spotlight-toggle", keyCode: 32, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + SPACE"},
  {event: "input-text-summarize", keyCode: 71, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + G"},
  {event: "input-flag-item", keyCode: 70, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + F"},
  {event: "input-remove-item", keyCode: 90, altKey: true, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + ALT + Z"},
  {event: "input-rename-item", keyCode: 88, altKey: true, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + ALT + X"},
  {event: "input-duplicate-item", keyCode: 68, altKey: true, metaKey: false, ctrlKey: true, shift: false, combination: "CTRL + ALT + D"},
  {event: "input-create-folder", keyCode: 67, altKey: true, metaKey: true, ctrlKey: true, shift: false, combination:"CTRL + ALT + C"},
  {event: "input-create-text", keyCode: 83, altKey: true, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + ALT + S"},
  {event: "input-grade-item1", keyCode: 49, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + 1"},
  {event: "input-grade-item2", keyCode: 50, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + 2"},
  {event: "input-grade-item3", keyCode: 51, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + 3"},
  {event: "input-grade-item4", keyCode: 52, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + 4"},
  {event: "input-grade-item5", keyCode: 53, altKey: false, metaKey: true, ctrlKey: true, shift: false, combination: "CTRL + 5"}
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
  shortcuts: defaultShortcuts
};

const { subscribe, set, update } = writable(defaultProfile);

const updateProfile = (updates: Partial<Profile>) => {
  update(profile => ({
    ...profile,
    ...updates
  }));
};

const setTheme = (theme: string) => {
  update(profile => ({
    ...profile,
    theme
  }));
};

const toggleRightSidebar = () => {
  update(profile => ({
    ...profile,
    showRightSidebar: !profile.showRightSidebar
  }));
};

const toggleImagesInSidebar = () => {
  update(profile => ({
    ...profile,
    showImagesInSidebar: !profile.showImagesInSidebar
  }));
};

export const profile = {
  subscribe,
  set,
  updateProfile,
  setTheme,
  toggleRightSidebar,
  toggleImagesInSidebar
};