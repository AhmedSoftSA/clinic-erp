import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "doctor" | "staff" | "patient";
}

interface AuthContextValue {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <AuthContext.Provider value={{ user: data as AuthUser | null, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  return ctx;
}
