import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { UserPermissions } from "@shared/schema";

// Define uma interface User específica para o ProtectedRoute
interface UserWithPermissions {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: UserPermissions;
}

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  requiredRole?: string;
  requiredPermission?: string;
};

// Componente que renderiza a rota protegida, recebendo props específicas do Router
const ProtectedRouteComponent: React.FC<
  RouteComponentProps & { component: React.ComponentType; user: UserWithPermissions }
> = ({ component: Component, user, ...rest }) => {
  // @ts-ignore - Ignora erro de tipo ao passar props para o componente
  return <Component {...rest} user={user} />;
};

export function ProtectedRoute({
  path,
  component,
  requiredRole,
  requiredPermission
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Rotas especiais que sempre estão disponíveis para usuários autenticados
  const isSpecialRoute = path === '/user-profile' || path === '/user-settings' || path === '/support' || path === '/waiting-permissions';
  
  // Se o usuário estiver na rota de espera de permissões, não precisa verificar permissões
  if (path === '/waiting-permissions') {
    return (
      <Route path={path}>
        {(params) => <ProtectedRouteComponent component={component} params={params} user={user as UserWithPermissions} />}
      </Route>
    );
  }
  
  // Anteriormente verificávamos se o usuário não tinha NENHUMA permissão, mas isso causava problemas quando tinha apenas uma
  // No entanto, não vamos mais verificar isso aqui - o usuário pode ter apenas UMA permissão (ex: admin) e isso é válido
  // Vamos apenas verificar a permissão específica requisitada para a rota, se houver

  // Rotas especiais que sempre estão acessíveis para usuários autenticados
  // Suporte (agora chamado Desenvolvedor) e waiting-permissions
  if (path === '/support' || path === '/waiting-permissions' || path === '/user-profile' || path === '/user-settings') {
    return (
      <Route path={path}>
        {(params) => <ProtectedRouteComponent component={component} params={params} user={user as UserWithPermissions} />}
      </Route>
    );
  }
  
  // Administradores têm acesso a todas as rotas
  if (user.role === 'admin') {
    return (
      <Route path={path}>
        {(params) => <ProtectedRouteComponent component={component} params={params} user={user as UserWithPermissions} />}
      </Route>
    );
  }

  // Verificar permissões específicas usando a função hasPermission do useAuth
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Se o usuário não tem permissão específica, redireciona para a tela de espera de permissões
    return (
      <Route path={path}>
        <Redirect to="/waiting-permissions" />
      </Route>
    );
  }
  
  // Verificar roles se aplicável
  if (requiredRole && user.role !== requiredRole) {
    // Redirecionar silenciosamente para a página inicial
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Usa o Route padrão do wouter para renderizar o componente
  return (
    <Route path={path}>
      {(params) => <ProtectedRouteComponent component={component} params={params} user={user as UserWithPermissions} />}
    </Route>
  );
}
