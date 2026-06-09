import { create } from 'zustand';
import type { User, Role } from '../../shared/types';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateRole: (role: Role) => void;
}

const roleNames: Record<Role, string> = {
  geologist: '地质工程师',
  postdoc: '博士后研究员',
  professor: '教授',
  chief: '首席地震学家',
  assessor: '评估分析师',
  admin: '系统管理员',
};

export { roleNames };

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  updateRole: (role) =>
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          role,
          name: getUserNameByRole(role),
          email: getEmailByRole(role),
        },
      };
    }),
}));

function getUserNameByRole(role: Role): string {
  const map: Record<Role, string> = {
    geologist: '李明工',
    postdoc: '王研究',
    professor: '赵教授',
    chief: '张首席',
    assessor: '陈评估',
    admin: '刘管理',
  };
  return map[role];
}

function getEmailByRole(role: Role): string {
  return `${role}@quake-sim.edu.cn`;
}
