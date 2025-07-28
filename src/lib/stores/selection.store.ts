import { writable } from 'svelte/store';

export interface SelectionState {
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
  ('Setting selection:', { text, range });
  update(state => ({
    ...state,
    isSelected: true,
    text,
    range
  }));
};

const clearSelection = () => {
  ('Clearing selection');
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