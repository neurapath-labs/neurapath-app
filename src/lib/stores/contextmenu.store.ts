import { writable } from 'svelte/store';

interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'sidebar-item' | 'sidebar-right-item' | 'content-area' | 'sidebar-background' | null;
}

const initialState: ContextMenuState = {
  isVisible: false,
  x: 0,
  y: 0,
  targetId: null,
  targetType: null
};

const { subscribe, set, update } = writable(initialState);

const showContextMenu = (x: number, y: number, targetId: string | null, targetType: ContextMenuState['targetType']) => {
  update(state => ({
    ...state,
    isVisible: true,
    x,
    y,
    targetId,
    targetType
  }));
};

const hideContextMenu = () => {
  update(state => ({
    ...state,
    isVisible: false,
    targetId: null,
    targetType: null
  }));
};

// Close context menu when clicking anywhere else
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    hideContextMenu();
  });
}

export const contextmenu = {
  subscribe,
  showContextMenu,
  hideContextMenu
};