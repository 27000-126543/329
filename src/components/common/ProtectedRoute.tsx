import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

declare global {
  interface Window {
    __mockUser?: User | null;
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  return window.__mockUser ?? null;
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  window.__mockUser = user;
  if (user) {
    localStorage.setItem("auth_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("auth_user");
  }
}

export function initMockUser(): User {
  const existing = localStorage.getItem("auth_user");
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as User;
      window.__mockUser = parsed;
      return parsed;
    } catch {
      // fall through
    }
  }
  const mockUser: User = {
    id: "U-001",
    name: "张明远",
    email: "zhang.chief@seismo.cn",
    role: "首席地震学家",
  };
  window.__mockUser = mockUser;
  localStorage.setItem("auth_user", JSON.stringify(mockUser));
  return mockUser;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          window.__mockUser = JSON.parse(stored);
          setIsAuthenticated(true);
          return;
        } catch {
          // ignore
        }
      }
    }
    setIsAuthenticated(!!user);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
