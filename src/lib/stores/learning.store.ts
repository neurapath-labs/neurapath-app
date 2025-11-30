import { writable } from 'svelte/store';
import type { Record } from '$lib/models';

interface LearningState {
  isInLearningMode: boolean;
  currentRecord: Record | null;
  showClozesInLearningMode: boolean;
  showOcclusionsInLearningMode: boolean;
  showExtractsInLearningMode: boolean;
}

interface SM2Result {
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: string;
}

const initialState: LearningState = {
  isInLearningMode: false,
  currentRecord: null,
  showClozesInLearningMode: true,
  showOcclusionsInLearningMode: true,
  showExtractsInLearningMode: true
};

const { subscribe, set, update } = writable(initialState);

const toggleLearningMode = () => {
  update(state => ({
    ...state,
    isInLearningMode: !state.isInLearningMode
  }));
};

const setCurrentRecord = (record: Record | null) => {
  update(state => ({
    ...state,
    currentRecord: record
  }));
};

const toggleShowClozes = () => {
  update(state => ({
    ...state,
    showClozesInLearningMode: !state.showClozesInLearningMode
  }));
};

const toggleShowOcclusions = () => {
  update(state => ({
    ...state,
    showOcclusionsInLearningMode: !state.showOcclusionsInLearningMode
  }));
};

const toggleShowExtracts = () => {
  update(state => ({
    ...state,
    showExtractsInLearningMode: !state.showExtractsInLearningMode
  }));
};

/**
 * SM-2 algorithm implementation for spaced repetition
 * @param grade - Quality of response (0-5)
 * @param repetition - Current number of consecutive correct reviews
 * @param efactor - Easiness factor (starts at 2.5)
 * @param interval - Current interval in days
 * @returns Updated SM-2 parameters and next due date
 */
const sm2 = (
  grade: number,
  repetition: number,
  efactor: number,
  interval: number
): SM2Result => {
  let nextInterval: number;
  let nextRepetition: number;
  let nextEfactor: number;

  // Grade >= 3 means correct response
  if (grade >= 3) {
    if (repetition === 0) {
      nextInterval = 1;
      nextRepetition = 1;
    } else if (repetition === 1) {
      nextInterval = 6;
      nextRepetition = 2;
    } else {
      nextInterval = Math.round(interval * efactor);
      nextRepetition = repetition + 1;
    }
  } else {
    // Failed - reset repetition count
    nextInterval = 1;
    nextRepetition = 0;
  }

  // Update easiness factor
  nextEfactor = efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  // Minimum efactor is 1.3
  if (nextEfactor < 1.3) {
    nextEfactor = 1.3;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextInterval);

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    efactor: nextEfactor,
    dueDate: dueDate.toISOString()
  };
};

export const learning = {
  subscribe,
  set,
  update,
  toggleLearningMode,
  setCurrentRecord,
  toggleShowClozes,
  toggleShowOcclusions,
  toggleShowExtracts,
  sm2
};