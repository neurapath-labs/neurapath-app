import { writable } from 'svelte/store';

interface SelectionState {
  isSelected: boolean;
  text: string;
  range: {
    index: number;
    length: number;
  } | null;
}

const initialState: SelectionState = {
  isSelected: false,
  text: '',
  range: null
};

const { subscribe, set, update } = writable(initialState);

const setSelection = (text: string, range: { index: number; length: number }) => {
  update(state => ({
    ...state,
    isSelected: true,
    text,
    range
  }));
};

const clearSelection = () => {
  update(state => ({
    ...state,
    isSelected: false,
    text: '',
    range: null
  }));
};

export const selection = {
  subscribe,
  setSelection,
  clearSelection
};