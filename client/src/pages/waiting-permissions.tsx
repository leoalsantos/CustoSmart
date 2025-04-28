import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Settings, User, LogOut, HelpCircle, AlertCircle, Code } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function WaitingPermissions() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Verificar se o usuário não tem permissões válidas,
  // mas ignorando developer/profile que são sempre permitidos
  const hasNoPermissions = user && (
    !user.permissions ||
    Object.entries(user.permissions)
      .filter(([key]) => !['developer', 'profile'].includes(key))
      .every(([_, value]) => !value)
  );
  
  // Se o usuário tem alguma permissão válida ou é admin, redirecionar para outra página
  if (!hasNoPermissions || user?.role === 'admin') {
    // Se o usuário é admin ou tem permissão admin, vai para a página de usuários
    if (user?.role === 'admin' || user?.permissions?.admin) {
      setTimeout(() => setLocation('/admin/users'), 0);
    // Se o usuário tem permissão de dashboard, vai para a página inicial
    } else if (user?.permissions?.dashboard) {
      setTimeout(() => setLocation('/'), 0);
    } else if (user?.permissions?.chat) {
      // Se o usuário tem permissão de chat, mas não de dashboard
      setTimeout(() => setLocation('/chat'), 0);
    } else if (user?.permissions?.commercial) {
      setTimeout(() => setLocation('/commercial/orders'), 0);
    } else if (user?.permissions?.finance) {
      setTimeout(() => setLocation('/finance/expenses'), 0);
    } else if (user?.permissions?.production) {
      setTimeout(() => setLocation('/production/orders'), 0);
    } else if (user?.permissions?.maintenance) {
      setTimeout(() => setLocation('/maintenance/equipment'), 0);
    } else if (user?.permissions?.inventory) {
      setTimeout(() => setLocation('/inventory/raw-materials'), 0);
    } else if (user?.permissions?.quality) {
      setTimeout(() => setLocation('/quality/inspections'), 0);
    } else if (user?.permissions?.purchase) {
      setTimeout(() => setLocation('/purchase/suppliers'), 0);
    } else if (user?.permissions?.hr) {
      setTimeout(() => setLocation('/hr/employees'), 0);
    } else if (user?.permissions?.suporte) {
      setTimeout(() => setLocation('/support/tickets'), 0);
    } else {
      // Se tem outras permissões, mas nenhuma específica
      setTimeout(() => setLocation('/support'), 0);
    }
    return null;
  }
  
  // Extrair iniciais do nome completo para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aguardando Permissões</h1>
        <div className="flex items-center gap-4">
          <div className="text-right mr-2 hidden md:block">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'Novo Usuário'}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatar.png" alt={user?.fullName} />
                  <AvatarFallback>{getInitials(user?.fullName || 'NU')}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigateTo("/user-profile")}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigateTo("/user-settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigateTo("/support")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Desenvolvedor
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Alert className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-400">Aguardando permissões</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Sua conta foi criada com sucesso, mas você ainda não possui permissões de acesso no sistema.
          Por favor, entre em contato com o administrador para obter acesso aos módulos necessários.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao CustoSmart</CardTitle>
          <CardDescription>Sistema de Gestão Empresarial</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Olá <strong>{user?.fullName}</strong>, você está conectado como <strong>{user?.username}</strong>.
          </p>
          <p className="mb-4">
            Atualmente, você não possui permissões para acessar os módulos do sistema. 
            Um administrador precisa conceder acesso aos módulos que você utilizará.
          </p>

          <Separator className="my-6" />
          
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="developer">Desenvolvedor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <div>
                <h3 className="text-lg font-medium mb-2">Módulos disponíveis no sistema:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Financeiro - Gestão de despesas, receitas e fluxo de caixa</li>
                  <li>Produção - Gerenciamento de ordens de produção e produtos</li>
                  <li>Manutenção - Controle de equipamentos e ordens de manutenção</li>
                  <li>Estoque - Gerenciamento de materiais e inventário</li>
                  <li>Comercial - Pedidos, clientes e notas fiscais</li>
                  <li>Qualidade - Inspeções e controle de qualidade</li>
                  <li>Compras - Fornecedores e controle de compras</li>
                  <li>Recursos Humanos - Gerenciamento de funcionários e folha de pagamento</li>
                  <li>Administrativo - Configurações do sistema e usuários</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="developer">
              <div>
                <h3 className="text-lg font-medium mb-2">Informações do Desenvolvedor</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                  <p className="mb-2"><strong>CustoSmart - Sistema ERP Completo</strong></p>
                  <p className="mb-2">Desenvolvido por <strong>Leonardo Almeida da Silva</strong></p>
                  <p className="mb-2">Email: <a href="mailto:leoalmeidas@gmail.com" className="text-blue-600 hover:underline">leoalmeidas@gmail.com</a></p>
                  <p className="mb-2">Telefone: <a href="tel:+5511986675088" className="text-blue-600 hover:underline">(11) 98667-5088</a></p>
                  <p className="mb-2">Website: <a href="https://www.leoalmeida.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.leoalmeida.dev</a></p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="flex items-center gap-2">
                    <Code size={16} />
                    <span>Versão 1.0.0 - © 2025 - Todos os direitos reservados</span>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.href = "mailto:suporte@custosmart.com.br"}>
            Solicitar Acesso
          </Button>
          <Button onClick={() => window.location.href = "https://www.leoalmeida.dev"} variant="secondary">
            Contato Desenvolvedor
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}