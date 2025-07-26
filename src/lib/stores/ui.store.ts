import { writable } from 'svelte/store';
import { modal } from './modal.store';

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
  isSpotlightSearchModalOpen: boolean;
  isPdfImportOpen: boolean;
  isExportImportOpen: boolean;
  isShareModalOpen: boolean;
  shareModalTargetId: string | null;
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
  isTutorialOpen: false,
  isSpotlightSearchModalOpen: false,
  isPdfImportOpen: false,
  isExportImportOpen: false,
  isShareModalOpen: false,
  shareModalTargetId: null
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
  console.log('[ui.store] Opening Explorer, closing other UI modals');
  update(state => ({
    ...state,
    isExplorerOpen: true,
    isFlaggedOpen: false,
    isStatisticsOpen: false,
    isDatabasesOpen: false,
    isChangelogOpen: false,
    isPolicyOpen: false,
    isTutorialOpen: false,
    isSpotlightSearchModalOpen: false,
    isPdfImportOpen: false,
    isExportImportOpen: false,
    isShareModalOpen: false
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
  console.log('[ui.store] Opening Statistics, closing other UI modals');
  // Close all modal store modals as well
  modal.closeLoginModal();
  modal.closeSettingsModal();
  modal.closeDatabaseModal();
  modal.closeStatisticsModal();
  modal.closeTutorialModal();
  modal.closeOcclusionCreateModal();
  modal.closeOcclusionLearningModal();
  modal.closeSummaryModal();
  modal.closeSpotlightSearchModal();
  update(state => ({
    ...state,
    isStatisticsOpen: true,
    isExplorerOpen: false,
    isFlaggedOpen: false,
    isDatabasesOpen: false,
    isChangelogOpen: false,
    isPolicyOpen: false,
    isTutorialOpen: false,
    isSpotlightSearchModalOpen: false,
    isPdfImportOpen: false,
    isExportImportOpen: false,
    isShareModalOpen: false
  }));
};

const closeStatistics = () => {
  update(state => ({
    ...state,
    isStatisticsOpen: false
  }));
};

const openDatabases = () => {
  console.log('[ui.store] Opening Databases, closing other UI modals');
  // Close all modal store modals as well
  modal.closeLoginModal();
  modal.closeSettingsModal();
  modal.closeDatabaseModal();
  modal.closeStatisticsModal();
  modal.closeTutorialModal();
  modal.closeOcclusionCreateModal();
  modal.closeOcclusionLearningModal();
  modal.closeSummaryModal();
  modal.closeSpotlightSearchModal();
  update(state => ({
    ...state,
    isDatabasesOpen: true,
    isExplorerOpen: false,
    isFlaggedOpen: false,
    isStatisticsOpen: false,
    isChangelogOpen: false,
    isPolicyOpen: false,
    isTutorialOpen: false,
    isSpotlightSearchModalOpen: false,
    isPdfImportOpen: false,
    isExportImportOpen: false,
    isShareModalOpen: false
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

const openSpotlightSearch = () => {
  update(state => ({
    ...state,
    isSpotlightSearchModalOpen: true
  }));
};

const closeSpotlightSearch = () => {
  update(state => ({
    ...state,
    isSpotlightSearchModalOpen: false
  }));
};

const openPdfImport = () => {
  update(state => ({
    ...state,
    isPdfImportOpen: true
  }));
};

const closePdfImport = () => {
  update(state => ({
    ...state,
    isPdfImportOpen: false
  }));
};

const openExportImport = () => {
  update(state => ({
    ...state,
    isExportImportOpen: true
  }));
};

const closeExportImport = () => {
  update(state => ({
    ...state,
    isExportImportOpen: false
  }));
};

const openShareModal = (targetId: string) => {
  update(state => ({
    ...state,
    isShareModalOpen: true,
    shareModalTargetId: targetId
  }));
};

const closeShareModal = () => {
  update(state => ({
    ...state,
    isShareModalOpen: false,
    shareModalTargetId: null
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
  closeTutorial,
  openSpotlightSearch,
  closeSpotlightSearch,
  openPdfImport,
  closePdfImport,
  openExportImport,
  closeExportImport,
  openShareModal,
  closeShareModal,
  closeAllModals: () => {
    closeExplorer();
    closeFlagged();
    closeStatistics();
    closeDatabases();
    closeChangelog();
    closePolicy();
    closeTutorial();
    closeSpotlightSearch();
    closePdfImport();
    closeExportImport();
    closeShareModal();
  }
};