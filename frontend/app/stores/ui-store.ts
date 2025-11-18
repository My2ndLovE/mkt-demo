import { create } from 'zustand';
import type { ToastNotification } from '../types';

interface UIState {
  // Navigation
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;

  // Notifications
  toasts: ToastNotification[];

  // Loading states
  globalLoading: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Toast actions
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
}

let toastIdCounter = 0;
const generateToastId = () => `toast_${++toastIdCounter}`;

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  toasts: [],
  globalLoading: false,

  // Navigation actions
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // Toast actions
  addToast: (toast) => {
    const id = generateToastId();
    const newToast: ToastNotification = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Loading actions
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));

// Convenience toast methods
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'success', message, duration }),

  error: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'error', message, duration }),

  warning: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'warning', message, duration }),

  info: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'info', message, duration }),
};
