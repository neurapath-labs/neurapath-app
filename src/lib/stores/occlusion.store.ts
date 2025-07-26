import { writable } from 'svelte/store';
import type { Occlusion } from '$lib/models';

interface OcclusionState {
  isCreating: boolean;
  imageUrl: string | null;
  occlusions: Occlusion[];
  activeOcclusion: Occlusion | null;
}

const initialState: OcclusionState = {
  isCreating: false,
  imageUrl: null,
  occlusions: [],
  activeOcclusion: null
};

const { subscribe, set, update } = writable(initialState);

const startCreating = (imageUrl: string) => {
  update(state => ({
    ...state,
    isCreating: true,
    imageUrl
  }));
};

const stopCreating = () => {
  update(state => ({
    ...state,
    isCreating: false,
    imageUrl: null,
    occlusions: [],
    activeOcclusion: null
  }));
};

const addOcclusion = (occlusion: Occlusion) => {
  update(state => ({
    ...state,
    occlusions: [...state.occlusions, occlusion]
  }));
};

const removeOcclusion = (index: number) => {
  update(state => {
    const newOcclusions = [...state.occlusions];
    newOcclusions.splice(index, 1);
    return {
      ...state,
      occlusions: newOcclusions
    };
  });
};

const clearOcclusions = () => {
  update(state => ({
    ...state,
    occlusions: []
  }));
};

const setActiveOcclusion = (occlusion: Occlusion | null) => {
  update(state => ({
    ...state,
    activeOcclusion: occlusion
  }));
};

export const occlusion = {
  subscribe,
  startCreating,
  stopCreating,
  addOcclusion,
  removeOcclusion,
  clearOcclusions,
  setActiveOcclusion
};