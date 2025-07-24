import { writable } from 'svelte/store';

interface ModalState {
  isLoginModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isDatabaseModalOpen: boolean;
  isStatisticsModalOpen: boolean;
  isTutorialModalOpen: boolean;
  isOcclusionCreateModalOpen: boolean;
  isOcclusionLearningModalOpen: boolean;
  isSummaryModalOpen: boolean;
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
  isAlertModalOpen: false,
  alertMessage: '',
  alertType: 'default'
};

const { subscribe, set, update } = writable(initialState);

const openLoginModal = () => {
  update(state => ({
    ...state,
    isLoginModalOpen: true
  }));
};

const closeLoginModal = () => {
  update(state => ({
    ...state,
    isLoginModalOpen: false
  }));
};

const openSettingsModal = () => {
  update(state => ({
    ...state,
    isSettingsModalOpen: true
  }));
};

const closeSettingsModal = () => {
  update(state => ({
    ...state,
    isSettingsModalOpen: false
  }));
};

const openDatabaseModal = () => {
  update(state => ({
    ...state,
    isDatabaseModalOpen: true
  }));
};

const closeDatabaseModal = () => {
  update(state => ({
    ...state,
    isDatabaseModalOpen: false
  }));
};

const openStatisticsModal = () => {
  update(state => ({
    ...state,
    isStatisticsModalOpen: true
  }));
};

const closeStatisticsModal = () => {
  update(state => ({
    ...state,
    isStatisticsModalOpen: false
  }));
};

const openTutorialModal = () => {
  update(state => ({
    ...state,
    isTutorialModalOpen: true
  }));
};

const closeTutorialModal = () => {
  update(state => ({
    ...state,
    isTutorialModalOpen: false
  }));
};

const openOcclusionCreateModal = () => {
  update(state => ({
    ...state,
    isOcclusionCreateModalOpen: true
  }));
};

const closeOcclusionCreateModal = () => {
  update(state => ({
    ...state,
    isOcclusionCreateModalOpen: false
  }));
};

const openOcclusionLearningModal = () => {
  update(state => ({
    ...state,
    isOcclusionLearningModalOpen: true
  }));
};

const closeOcclusionLearningModal = () => {
  update(state => ({
    ...state,
    isOcclusionLearningModalOpen: false
  }));
};

const openSummaryModal = () => {
  update(state => ({
    ...state,
    isSummaryModalOpen: true
  }));
};

const closeSummaryModal = () => {
  update(state => ({
    ...state,
    isSummaryModalOpen: false
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
  showAlert,
  closeAlert
};