/* ------------------------------------------------------------------
   src/lib/stores/lastSaved.store.ts
   — Svelte store that tracks the last time the database was saved
   ------------------------------------------------------------------- */

import { writable } from 'svelte/store';

/* -------------------------------------------------
   Store shape & initial value
   ------------------------------------------------- */
interface LastSavedState {
	lastSaved: number | null; // timestamp in milliseconds
}

const initialState: LastSavedState = { lastSaved: null };
const { subscribe, set, update } = writable<LastSavedState>(initialState);

/* -------------------------------------------------
   Actions
   ------------------------------------------------- */
export const setLastSaved = (timestamp: number) => {
	set({ lastSaved: timestamp });
};

export const getLastSaved = (): number | null => {
	let state: LastSavedState = initialState;
	const unsub = subscribe((s) => {
		state = s;
	});
	unsub();
	return state.lastSaved;
};

/* -------------------------------------------------
   Public API
   ------------------------------------------------- */
export const lastSaved = {
	subscribe,
	setLastSaved,
	getLastSaved
};