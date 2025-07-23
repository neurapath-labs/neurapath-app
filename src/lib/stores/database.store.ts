import { writable } from 'svelte/store';
import type { Record, Profile } from '$lib/models';

interface Database {
  profile: Profile | null;
  items: Record[];
}

const initialState: Database = {
  profile: null,
  items: [],
};

const { subscribe, set, update } = writable(initialState);

export const database = {
  subscribe,
  set,
  update,
};