import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type User = { username: string };
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
}

const STORAGE_KEY = 'auth';
const EMPTY: AuthState = { isLoggedIn: false, user: null };

/* ---------- localStorage helpers ---------- */
const readStorage = (): AuthState => {
  if (!browser) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : EMPTY;
  } catch (e) {
    console.error('[auth.store] failed to read localStorage', e);
    return EMPTY;
  }
};

const writeStorage = (state: AuthState) => {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[auth.store] failed to write localStorage', e);
  }
};

/* ---------- factory ---------- */
function createAuthStore() {
  /* 1 — state */
  const { subscribe, set } = writable<AuthState>(readStorage(), (set) => {
    if (!browser) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY)
        set(e.newValue ? (JSON.parse(e.newValue) as AuthState) : EMPTY);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  });

  /* 2 — actions */
  const login = async (username: string) => {
    // (AJAX login can go here if needed)
    const state: AuthState = { isLoggedIn: true, user: { username } };
    set(state);
    writeStorage(state);
  };

  const logout = async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
        redirect: 'manual'
      });
    } catch (err) {
      console.warn('[auth.store] /logout request failed', err);
    }
    set(EMPTY);
    writeStorage(EMPTY);
  };

  /* 3 — expose API (this was missing) */
  return { subscribe, login, logout };
}

export const auth = createAuthStore();
