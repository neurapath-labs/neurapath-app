import { writable } from 'svelte/store';

interface User {
  username: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null
};

const { subscribe, set, update } = writable(initialState);

const login = async (username: string, password: string) => {
  // TODO: Implement the actual login logic by calling the backend API.
  // For now, we'll just simulate a successful login.
  update((state) => ({ ...state, isLoggedIn: true, user: { username } }));
};

const logout = () => {
  // TODO: Implement the actual logout logic.
  update(state => ({ ...state, isLoggedIn: false, user: null }));
};

export const auth = {
  subscribe,
  login,
  logout
};