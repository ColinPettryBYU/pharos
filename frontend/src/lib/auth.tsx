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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isDonor: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const data = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    if (data.requiresMfa) {
      throw new Error("MFA_REQUIRED");
    }
    setUser(data.user);
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
      displayName,
    });
    setUser(data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  const isAdmin = user?.roles.includes("Admin") ?? false;
  const isStaff =
    (user?.roles.includes("Staff") ?? false) || isAdmin;
  const isDonor = user?.roles.includes("Donor") ?? false;

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
        isStaff,
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
