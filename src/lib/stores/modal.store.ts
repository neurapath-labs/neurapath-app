import { writable } from 'svelte/store';
import { ui } from './ui.store';

interface ModalState {
  isLoginModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isDatabaseModalOpen: boolean;
  isStatisticsModalOpen: boolean;
  isTutorialModalOpen: boolean;
  isOcclusionCreateModalOpen: boolean;
  isOcclusionLearningModalOpen: boolean;
  isSummaryModalOpen: boolean;
  isSpotlightSearchModalOpen: boolean;
  isAlertModalOpen: boolean;
  alertMessage: string;
  alertType: 'default' | 'success' | 'warning' | 'danger';
}

const initialState: ModalState = {
  isLoginModalOpen: false,
  isSettingsModalOpen: false,
  isDatabaseModalOpen: false,
  isStatisticsModalOpen: false,
  isTutorialModalOpen: false,
  isOcclusionCreateModalOpen: false,
  isOcclusionLearningModalOpen: false,
  isSummaryModalOpen: false,
  isSpotlightSearchModalOpen: false,
  isAlertModalOpen: false,
  alertMessage: '',
  alertType: 'default'
};

const { subscribe, set, update } = writable(initialState);

const openLoginModal = () => {
  console.log('[modal.store] Opening LoginModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isLoginModalOpen: true,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeLoginModal = () => {
  update(state => ({
    ...state,
    isLoginModalOpen: false
  }));
};

const openSettingsModal = () => {
  console.log('[modal.store] Opening SettingsModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isSettingsModalOpen: true,
    isLoginModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeSettingsModal = () => {
  update(state => ({
    ...state,
    isSettingsModalOpen: false
  }));
};

const openDatabaseModal = () => {
  console.log('[modal.store] Opening DatabaseModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isDatabaseModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeDatabaseModal = () => {
  update(state => ({
    ...state,
    isDatabaseModalOpen: false
  }));
};

const openStatisticsModal = () => {
  console.log('[modal.store] Opening StatisticsModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isStatisticsModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeStatisticsModal = () => {
  update(state => ({
    ...state,
    isStatisticsModalOpen: false
  }));
};

const openTutorialModal = () => {
  console.log('[modal.store] Opening TutorialModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isTutorialModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeTutorialModal = () => {
  update(state => ({
    ...state,
    isTutorialModalOpen: false
  }));
};

const openOcclusionCreateModal = () => {
  console.log('[modal.store] Opening OcclusionCreateModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isOcclusionCreateModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeOcclusionCreateModal = () => {
  update(state => ({
    ...state,
    isOcclusionCreateModalOpen: false
  }));
};

const openOcclusionLearningModal = () => {
  console.log('[modal.store] Opening OcclusionLearningModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isOcclusionLearningModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isSummaryModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeOcclusionLearningModal = () => {
  update(state => ({
    ...state,
    isOcclusionLearningModalOpen: false
  }));
};

const openSummaryModal = () => {
  console.log('[modal.store] Opening SummaryModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isSummaryModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSpotlightSearchModalOpen: false
  }));
};

const closeSummaryModal = () => {
  update(state => ({
    ...state,
    isSummaryModalOpen: false
  }));
};

const openSpotlightSearchModal = () => {
  console.log('[modal.store] Opening SpotlightSearchModal, closing others');
  // Close all UI modals as well
  ui.closeExplorer();
  ui.closeFlagged();
  ui.closeStatistics();
  ui.closeDatabases();
  ui.closeChangelog();
  ui.closePolicy();
  ui.closeTutorial();
  ui.closeSpotlightSearch();
  ui.closePdfImport();
  ui.closeExportImport();
  ui.closeShareModal();
  update(state => ({
    ...state,
    isSpotlightSearchModalOpen: true,
    isLoginModalOpen: false,
    isSettingsModalOpen: false,
    isDatabaseModalOpen: false,
    isStatisticsModalOpen: false,
    isTutorialModalOpen: false,
    isOcclusionCreateModalOpen: false,
    isOcclusionLearningModalOpen: false,
    isSummaryModalOpen: false
  }));
};

const closeSpotlightSearchModal = () => {
  update(state => ({
    ...state,
    isSpotlightSearchModalOpen: false
  }));
};

const showAlert = (message: string, type: 'default' | 'success' | 'warning' | 'danger' = 'default') => {
  update(state => ({
    ...state,
    isAlertModalOpen: true,
    alertMessage: message,
    alertType: type
  }));
  
  // Auto-close alert after 5 seconds
  setTimeout(() => {
    update(state => ({
      ...state,
      isAlertModalOpen: false
    }));
  }, 5000);
};

const closeAlert = () => {
  update(state => ({
    ...state,
    isAlertModalOpen: false
  }));
};

export const modal = {
  subscribe,
  set,
  update,
  openLoginModal,
  closeLoginModal,
  openSettingsModal,
  closeSettingsModal,
  openDatabaseModal,
  closeDatabaseModal,
  openStatisticsModal,
  closeStatisticsModal,
  openTutorialModal,
  closeTutorialModal,
  openOcclusionCreateModal,
  closeOcclusionCreateModal,
  openOcclusionLearningModal,
  closeOcclusionLearningModal,
  openSummaryModal,
  closeSummaryModal,
  openSpotlightSearchModal,
  closeSpotlightSearchModal,
  showAlert,
  closeAlert,
  closeAllModals: () => {
    closeLoginModal();
    closeSettingsModal();
    closeDatabaseModal();
    closeStatisticsModal();
    closeTutorialModal();
    closeOcclusionCreateModal();
    closeOcclusionLearningModal();
    closeSummaryModal();
    closeSpotlightSearchModal();
  }
};