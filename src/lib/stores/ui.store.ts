import { writable } from 'svelte/store';

interface UIState {
  expandedFolders: Set<string>;
  activeItemId: string | null;
  isSpotlightMode: boolean;
  isExplorerOpen: boolean;
  isFlaggedOpen: boolean;
  isStatisticsOpen: boolean;
  isDatabasesOpen: boolean;
  isChangelogOpen: boolean;
  isPolicyOpen: boolean;
  isTutorialOpen: boolean;
}

const initialState: UIState = {
  expandedFolders: new Set<string>(),
  activeItemId: null,
  isSpotlightMode: false,
  isExplorerOpen: false,
  isFlaggedOpen: false,
  isStatisticsOpen: false,
  isDatabasesOpen: false,
  isChangelogOpen: false,
  isPolicyOpen: false,
  isTutorialOpen: false
};

const { subscribe, set, update } = writable(initialState);

const toggleFolderExpanded = (folderId: string) => {
  update(state => {
    const newExpandedFolders = new Set(state.expandedFolders);
    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }
    return {
      ...state,
      expandedFolders: newExpandedFolders
    };
  });
};

const expandAllParentsToId = (itemId: string) => {
  update(state => {
    const newExpandedFolders = new Set(state.expandedFolders);
    const parts = itemId.split('/');
    
    // Add all parent folders to expanded set
    let path = '';
    for (let i = 0; i < parts.length - 1; i++) {
      if (i > 0) path += '/';
      path += parts[i];
      newExpandedFolders.add(path);
    }
    
    return {
      ...state,
      expandedFolders: newExpandedFolders
    };
  });
};

const setActiveItemId = (itemId: string | null) => {
  update(state => ({
    ...state,
    activeItemId: itemId
  }));
};

const toggleSpotlightMode = () => {
  update(state => ({
    ...state,
    isSpotlightMode: !state.isSpotlightMode
  }));
};

const openExplorer = () => {
  update(state => ({
    ...state,
    isExplorerOpen: true
  }));
};

const closeExplorer = () => {
  update(state => ({
    ...state,
    isExplorerOpen: false
  }));
};

const openFlagged = () => {
  update(state => ({
    ...state,
    isFlaggedOpen: true
  }));
};

const closeFlagged = () => {
  update(state => ({
    ...state,
    isFlaggedOpen: false
  }));
};

const openStatistics = () => {
  update(state => ({
    ...state,
    isStatisticsOpen: true
  }));
};

const closeStatistics = () => {
  update(state => ({
    ...state,
    isStatisticsOpen: false
  }));
};

const openDatabases = () => {
  update(state => ({
    ...state,
    isDatabasesOpen: true
  }));
};

const closeDatabases = () => {
  update(state => ({
    ...state,
    isDatabasesOpen: false
  }));
};

const openChangelog = () => {
  update(state => ({
    ...state,
    isChangelogOpen: true
  }));
};

const closeChangelog = () => {
  update(state => ({
    ...state,
    isChangelogOpen: false
  }));
};

const openPolicy = () => {
  update(state => ({
    ...state,
    isPolicyOpen: true
  }));
};

const closePolicy = () => {
  update(state => ({
    ...state,
    isPolicyOpen: false
  }));
};

const openTutorial = () => {
  update(state => ({
    ...state,
    isTutorialOpen: true
  }));
};

const closeTutorial = () => {
  update(state => ({
    ...state,
    isTutorialOpen: false
  }));
};

export const ui = {
  subscribe,
  set,
  update,
  toggleFolderExpanded,
  expandAllParentsToId,
  setActiveItemId,
  toggleSpotlightMode,
  openExplorer,
  closeExplorer,
  openFlagged,
  closeFlagged,
  openStatistics,
  closeStatistics,
  openDatabases,
  closeDatabases,
  openChangelog,
  closeChangelog,
  openPolicy,
  closePolicy,
  openTutorial,
  closeTutorial
};