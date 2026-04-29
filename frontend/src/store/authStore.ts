import { create } from "zustand";

export type Role = "CLIENT" | "ORGANIZER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  accessToken:     localStorage.getItem("access_token"),
  refreshToken:    localStorage.getItem("refresh_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("access_token",  accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
