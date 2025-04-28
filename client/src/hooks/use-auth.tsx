import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPermissions } from "@shared/schema";

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: UserPermissions;
  active: boolean;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = LoginData & {
  fullName: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useMutation<User, Error, LoginData>>;
  logoutMutation: ReturnType<typeof useMutation<void, Error, void>>;
  registerMutation: ReturnType<typeof useMutation<User, Error, RegisterData>>;
  hasPermission: (permission: string) => boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    select: (data) => data || null, // Garante que o retorno é User | null, nunca undefined
  });
  
  // Garante que o user nunca será undefined
  const user = userData || null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Sua conta foi criada e você está logado!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu do sistema com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.role === 'admin') return true;
    
    // Special case for profile access - always available
    if (permission === 'profile') return true;
    
    // Special case for 'sidebar' - all authenticated users should see the sidebar
    if (permission === 'sidebar') return true;
    
    // Special case for menu navigation - all users should be able to navigate the app
    if (permission === 'navigation') return true;
    
    // Explicitly check for admin permission
    if (permission === 'admin' && user.permissions?.admin) return true;
    
    // Check for support (suporte) permission explicitly
    if (permission === 'suporte' && user.permissions?.suporte) return true;
    
    // Check if the permission exists in UserPermissions and is true
    if (user.permissions && typeof user.permissions === 'object') {
      const permissionKey = permission as keyof UserPermissions;
      if (permissionKey in user.permissions && user.permissions[permissionKey] === true) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}