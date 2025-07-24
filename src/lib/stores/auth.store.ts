import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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

// Initialize auth state from localStorage on browser side
if (browser) {
  const storedAuth = localStorage.getItem('auth');
  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      set(parsed);
    } catch (e) {
      console.error('Failed to parse auth data from localStorage', e);
    }
  }
}

const login = async (username: string, password: string) => {
  // In a real app, this would make an API call to the server
  // For now, we'll simulate the login
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate successful login
    const user = { username };
    const newState = { isLoggedIn: true, user };
    
    // Save to localStorage
    if (browser) {
      localStorage.setItem('auth', JSON.stringify(newState));
    }
    
    // Update the store
    set(newState);
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Login failed' };
  }
};

const logout = async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear from localStorage
    if (browser) {
      localStorage.removeItem('auth');
    }
    
    // Update the store
    set({ isLoggedIn: false, user: null });
    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Logout failed' };
  }
};

export const auth = {
  subscribe,
  login,
  logout
};