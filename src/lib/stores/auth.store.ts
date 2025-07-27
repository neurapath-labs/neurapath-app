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
    console.log('[AuthStore] Read from localStorage:', raw);
    return raw ? (JSON.parse(raw) as AuthState) : EMPTY;
  } catch (e) {
    console.error('[auth.store] failed to read localStorage', e);
    return EMPTY;
  }
};

const writeStorage = (state: AuthState) => {
  if (!browser) return;
  try {
    console.log('[AuthStore] Writing to localStorage:', state);
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
    console.log('[AuthStore] Logging in user:', username);
    const state: AuthState = { isLoggedIn: true, user: { username } };
    set(state);
    writeStorage(state);
    console.log('[AuthStore] Login completed for user:', username);
  };

  const logout = async () => {
    console.log('[AuthStore] Logging out');
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
    console.log('[AuthStore] Logout completed');
  };

  /* 3 — expose API (this was missing) */
  return { subscribe, login, logout };
}

export const auth = createAuthStore();
