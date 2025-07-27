import { writable } from 'svelte/store';

type Theme = 'day' | 'night' | 'homebrew';

interface ThemeState {
  currentTheme: Theme;
  isZenMode: boolean;
}

const initialState: ThemeState = {
  currentTheme: 'day',
  isZenMode: false
};

const { subscribe, set, update } = writable(initialState);

const setTheme = (theme: Theme) => {
  update(state => ({
    ...state,
    currentTheme: theme
  }));
  
  // Apply theme to document root
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    switch (theme) {
      case 'day':
        root.style.setProperty('--font-color', '68, 68, 68');
        root.style.setProperty('--font-color_button', '255, 255, 255');
        root.style.setProperty('--background-color', '255, 255, 255');
        root.style.setProperty('--background-color_sidebar', '252, 252, 252');
        root.style.setProperty('--background-color_modalbox', '255, 255, 255');
        root.style.setProperty('--background-color_button', '163, 205, 255');
        root.style.setProperty('--background-color_button-hover', '118, 180, 255');
        root.style.setProperty('--background-color_checkbox', '33, 150, 243');
        break;
      case 'night':
        root.style.setProperty('--font-color', '255, 255, 255');
        root.style.setProperty('--font-color_button', '255, 255, 255');
        root.style.setProperty('--background-color', '46, 42, 36');
        root.style.setProperty('--background-color_sidebar', '46, 42, 36');
        root.style.setProperty('--background-color_modalbox', '85, 85, 85');
        root.style.setProperty('--background-color_button', '249, 208, 148');
        root.style.setProperty('--background-color_button-hover', '249, 218, 158');
        break;
      case 'homebrew':
        root.style.setProperty('--font-color', '249, 208, 148');
        root.style.setProperty('--font-color_button', '46, 42, 36');
        root.style.setProperty('--background-color', '46, 42, 36');
        root.style.setProperty('--background-color_sidebar', '47, 44, 38');
        root.style.setProperty('--background-color_modalbox', '38, 34, 28');
        root.style.setProperty('--background-color_button', '249, 208, 148');
        root.style.setProperty('--background-color_button-hover', '249, 218, 158');
        root.style.setProperty('--background-color_checkbox', '46, 42, 36');
        break;
    }
  }
};

const toggleZenMode = () => {
  update(state => {
    const newZenMode = !state.isZenMode;
    
    // Update CSS variable for zen mode
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--zen-opacity', 
        newZenMode ? '0.3' : '1'
      );
    }
    
    return {
      ...state,
      isZenMode: newZenMode
    };
  });
};

// Initialize theme from system preference or stored preference
if (typeof window !== 'undefined') {
  // Check for stored theme preference
  const storedTheme = localStorage.getItem('theme') as Theme | null;
  if (storedTheme) {
    setTheme(storedTheme);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'night' : 'day');
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const theme = e.matches ? 'night' : 'day';
    if (!localStorage.getItem('theme')) {
      setTheme(theme);
    }
  });
}

export const theme = {
  subscribe,
  setTheme,
  toggleZenMode
};