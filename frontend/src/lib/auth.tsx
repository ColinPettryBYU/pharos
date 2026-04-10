import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { User, AuthResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isDonor: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "pharos_user";

function cacheUser(u: User | null) {
  if (u) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function getCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<{ user: User | null }>("/auth/me");
      const serverUser = data.user ?? null;
      setUser(serverUser);
      cacheUser(serverUser);
    } catch {
      // Cookie-based auth failed — fall back to cached session (helps on
      // mobile browsers that block cross-origin cookies)
      const cached = getCachedUser();
      setUser(cached);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    if (data.requires_mfa) {
      throw new Error("MFA_REQUIRED");
    }
    setUser(data.user);
    cacheUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${
      import.meta.env.VITE_API_URL || "/api"
    }/auth/google-login`;
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const data = await api.post<AuthResponse>("/auth/register", {
      email,
      password,
      display_name: displayName,
    });
    setUser(data.user);
    cacheUser(data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    cacheUser(null);
  };

  const isAdmin = user?.roles?.includes("Admin") ?? false;
  const isDonor = user?.roles?.includes("Donor") ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        isAdmin,
        isDonor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
