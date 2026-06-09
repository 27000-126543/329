import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../lib/types';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type NotificationType = 'alert' | 'approval' | 'task' | 'system';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  meta?: Record<string, unknown>;
}

interface AppState {
  currentUser: User | null;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  toasts: Toast[];

  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  showToast: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const STORAGE_KEY = 'app-state';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const dismissToastWithTimeout = (
  id: string,
  duration: number,
  dismissFn: (id: string) => void
): void => {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => dismissFn(id), duration);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sidebarCollapsed: false,
      notifications: [],
      toasts: [],

      setUser: (user: User | null) => {
        set({ currentUser: user });
        if (typeof window !== 'undefined') {
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            localStorage.removeItem('user');
          }
        }
      },

      login: (user: User) => {
        get().setUser(user);
      },

      logout: () => {
        get().setUser(null);
        set({ notifications: [], toasts: [] });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      addNotification: (
        notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
      ) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markNotificationRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      showToast: (
        toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }
      ) => {
        const duration = toast.duration ?? 4000;
        const id = generateId();
        const newToast: Toast = {
          ...toast,
          id,
          duration,
        };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        if (duration > 0) {
          dismissToastWithTimeout(id, duration, get().dismissToast);
        }
      },

      dismissToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        sidebarCollapsed: state.sidebarCollapsed,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          const { currentUser } = state;
          if (currentUser && typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        };
      },
    }
  )
);

export const selectCurrentUser = (state: AppState) => state.currentUser;
export const selectIsAuthenticated = (state: AppState) => state.currentUser !== null;
export const selectUserRole = (state: AppState) => state.currentUser?.role;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectUnreadNotificationCount = (state: AppState) =>
  state.notifications.filter((n) => !n.read).length;
export const selectToasts = (state: AppState) => state.toasts;

export default useAppStore;
