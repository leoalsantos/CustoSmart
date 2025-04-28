import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Search,
  PlusCircle,
  Trash2,
  UserCog,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
} from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Form schema for user
const userSchema = z.object({
  username: z
    .string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.string().min(1, "Papel é obrigatório"),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Query for users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "standard",
      active: true,
    },
  });

  // Register user mutation
  const registerUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      return await apiRequest("POST", "/api/register", userData);
    },
    onSuccess: () => {
      // Invalidate and refetch the users query
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário pode fazer login no sistema",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number | string; active: boolean }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, { active });
    },
    onSuccess: () => {
      // Invalidate and refetch the users query
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description:
          error.message || "Ocorreu um erro ao atualizar o status do usuário",
        variant: "destructive",
      });
    },
  });

  // Estado para controle do modal de confirmação de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the users query
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number | string; password: string }) => {
      return await apiRequest("PATCH", `/api/users/${id}/password`, { password });
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setUserToChangePassword(null);
      setNewPassword("");
      toast({
        title: "Senha alterada",
        description: "A senha do usuário foi alterada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar a senha do usuário",
        variant: "destructive",
      });
    },
  });
  
  // Função para abrir modal de alteração de senha
  const handleOpenPasswordDialog = (rowData: any) => {
    // Extrair os dados do usuário usando a função robusta
    const user = extractUserData(rowData);
    
    if (!user || !user.username) {
      toast({
        title: "Erro ao abrir alteração de senha",
        description: "Não foi possível identificar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    setUserToChangePassword(user);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };
  
  // Função para confirmar alteração de senha
  const confirmChangePassword = () => {
    if (!userToChangePassword) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    // Usar username como fallback se ID não estiver disponível
    const userId = typeof userToChangePassword.id === 'number' && !isNaN(userToChangePassword.id)
      ? userToChangePassword.id
      : userToChangePassword.username;
    
    changePasswordMutation.mutate({ id: userId, password: newPassword });
  };

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteUser = (rowData: any) => {
    // Extrair os dados do usuário usando a função robusta
    const user = extractUserData(rowData);
    
    if (!user || !user.username) {
      toast({
        title: "Erro ao abrir confirmação",
        description: "Não foi possível identificar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDeleteUser = () => {
    if (userToDelete) {
      // Usar username como fallback se ID não estiver disponível
      const userId = typeof userToDelete.id === 'number' && !isNaN(userToDelete.id)
        ? userToDelete.id
        : userToDelete.username;
      
      deleteUserMutation.mutate(userId);
    }
  };

  // Filter users by search term
  // Filtrar usuários por termo de busca e ocultar o usuário leoalmeidas para outros usuários
  const filteredUsers = Array.isArray(users)
    ? users.filter((user: any) => {
        // Ocultar o usuário leoalmeidas para todos os outros usuários
        if (
          user.username === "leoalmeidas" &&
          currentUser?.username !== "leoalmeidas"
        ) {
          return false;
        }

        const searchString =
          `${user.username} ${user.fullName} ${user.email} ${user.role}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      })
    : [];

  // Role icons
  const roleIcon = (role: string, username?: string) => {
    // Garantir que administrador e leoalmeidas sempre apareçam como administradores
    if (username === "administrador" || username === "leoalmeidas" || role === "admin") {
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    } else {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  // Estado para controle do modal de permissões
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Removido - duplicado

  // Lista de permissões disponíveis no sistema
  const availablePermissions = [
    { id: "dashboard", label: "Dashboard" },
    { id: "production", label: "Produção" },
    { id: "maintenance", label: "Manutenção" },
    { id: "finance", label: "Financeiro" },
    { id: "inventory", label: "Estoque" },
    { id: "commercial", label: "Comercial" },
    { id: "quality", label: "Qualidade" },
    { id: "purchase", label: "Compras" },
    { id: "hr", label: "Recursos Humanos" },
    { id: "admin", label: "Administração" },
    { id: "chat", label: "Chat Interno" },
    { id: "support", label: "Suporte Técnico" },
  ];

  // Mutação para atualizar permissões
  const updateUserPermissionsMutation = useMutation({
    mutationFn: async ({
      id,
      permissions,
    }: {
      id: number | string;
      permissions: Record<string, boolean>;
    }) => {
      return await apiRequest("PATCH", `/api/users/${id}/permissions`, {
        permissions,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the users query
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsPermissionsDialogOpen(false);
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar permissões",
        description:
          error.message ||
          "Ocorreu um erro ao atualizar as permissões do usuário",
        variant: "destructive",
      });
    },
  });

  // Função para abrir o modal de permissões
  const handleOpenPermissionsDialog = (rowData: any) => {
    console.log("Abrindo diálogo para dados da row:", rowData);
    
    // Extrair os dados do usuário usando a função robusta
    const user = extractUserData(rowData);
    
    console.log("Usuário extraído para permissões:", user);
    
    if (!user || !user.username) {
      toast({
        title: "Erro ao abrir configurações",
        description: "Não foi possível identificar o usuário. Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Buscar o usuário completo dos dados filtrados para termos todas as propriedades
    let completeUser = user;
    if (user.username && Array.isArray(filteredUsers)) {
      const foundUser = filteredUsers.find(u => u.username === user.username);
      if (foundUser) {
        console.log("Usando dados completos do usuário:", foundUser);
        completeUser = foundUser;
      }
    }
    
    // Adicionar o usuário ao estado com informações suficientes para identificação
    setSelectedUser({
      ...completeUser,
      // Preferir username como identificador, mas manter ID se disponível
      id: typeof completeUser.id === 'number' && !isNaN(completeUser.id) ? completeUser.id : null,
      username: completeUser.username
    });

    // Extrair as permissões ativas do objeto de permissões
    const activePermissions = completeUser.permissions
      ? Object.entries(completeUser.permissions)
          .filter(([_, value]) => value === true)
          .map(([key, _]) => key)
      : [];

    console.log("Permissões ativas:", activePermissions);
    setSelectedPermissions(activePermissions);
    setIsPermissionsDialogOpen(true);
  };

  // Função para salvar permissões
  const handleSavePermissions = () => {
    if (selectedUser) {
      console.log("Usuário selecionado para atualização de permissões:", selectedUser);
      
      // Converter a lista de permissões para o formato de objeto de permissões
      const permissionsObject = availablePermissions.reduce(
        (acc, { id }) => {
          acc[id] = selectedPermissions.includes(id);
          return acc;
        },
        {} as Record<string, boolean>,
      );
      
      console.log("Permissões a serem enviadas:", permissionsObject);
      
      // Preferir sempre usar username como identificador para consistência
      if (!selectedUser.username || selectedUser.username === 'undefined' || selectedUser.username === 'usuário-desconhecido') {
        toast({
          title: "Erro ao atualizar permissões",
          description: "Não foi possível identificar o nome de usuário. Por favor, feche este diálogo e tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Usar sempre o username para identificação
      const userId = selectedUser.username;
      console.log("Usando username para atualização de permissões:", userId);
      
      updateUserPermissionsMutation.mutate({
        id: userId,
        permissions: permissionsObject,
      });
    }
  };

  // Função para alternar uma permissão
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((p) => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Função para extrair dados do usuário de forma robusta
  const extractUserData = (rowData: any) => {
    console.log("Extraindo dados do usuário:", rowData);
    
    // Caso especial para valores primitivos
    if (typeof rowData !== 'object' || rowData === null) {
      console.log("Dados não são um objeto:", rowData);
      return { username: rowData?.toString() };
    }
    
    // Retornar diretamente se for um objeto de usuário simples
    if (rowData.username && !rowData.row && !rowData.cell && !rowData.column && !rowData.table) {
      console.log("Objeto de usuário simples encontrado:", rowData);
      return rowData;
    }
    
    let user;
    
    // Verificar se é um objeto TanStack Row
    if (rowData.original) {
      console.log("Objeto TanStack Row encontrado com original:", rowData.original);
      user = rowData.original;
    } 
    // Se contém um contexto de célula com valores
    else if (rowData._valuesCache) {
      console.log("Objeto com _valuesCache encontrado:", rowData._valuesCache);
      user = rowData._valuesCache;
    }
    // Se é um objeto de célula TanStack
    else if (rowData.row && rowData.row.original) {
      console.log("Objeto de célula TanStack encontrado:", rowData.row.original);
      user = rowData.row.original;
    }
    // Se for um objeto com estrutura complexa da tabela
    else if (rowData.table && rowData.table.data && Array.isArray(rowData.table.data) && rowData.table.data.length > 0) {
      // Tentar encontrar pelo username na função getValue
      console.log("Estrutura de tabela complexa encontrada");
      let username = null;
      
      // Tentar obter o username com getValue
      if (typeof rowData.getValue === 'function') {
        try {
          username = rowData.getValue('username');
          console.log("Nome de usuário obtido com getValue:", username);
        } catch (error) {
          console.log("Erro ao usar getValue:", error);
        }
      }
      
      // Tentar outras formas de obter o username
      if (!username && rowData.row && rowData.row.values) {
        username = rowData.row.values.username;
        console.log("Nome de usuário obtido de row.values:", username);
      }
      
      if (!username && rowData.row && rowData.row.original) {
        username = rowData.row.original.username;
        console.log("Nome de usuário obtido de row.original:", username);
      }
      
      // Buscar o usuário correspondente nos dados da tabela
      if (username) {
        user = rowData.table.data.find((u: any) => u.username === username);
        console.log("Usuário encontrado na tabela:", user);
      } 
      
      // Fallback: pegar da célula ou primeiro item
      if (!user) {
        if (rowData.row && rowData.row.index !== undefined) {
          console.log("Usando índice da linha:", rowData.row.index);
          user = rowData.table.data[rowData.row.index] || rowData.table.data[0];
        } else {
          console.log("Fallback para o primeiro usuário");
          user = rowData.table.data[0]; 
        }
      }
    } 
    // Se o objeto tem uma função getValue, use-a para obter valores diretamente
    else if (typeof rowData.getValue === 'function') {
      console.log("Usando função getValue para extrair dados");
      
      try {
        const username = rowData.getValue('username');
        console.log("Username obtido:", username);
        
        // Se temos o username, podemos tentar encontrar o usuário completo nos dados filtrados
        if (username && Array.isArray(filteredUsers)) {
          const foundUser = filteredUsers.find(u => u.username === username);
          if (foundUser) {
            console.log("Usuário encontrado nos dados filtrados:", foundUser);
            return foundUser;
          }
        }
        
        // Caso não encontre, cria um objeto com os valores básicos
        user = {
          username: username,
          fullName: rowData.getValue('fullName'),
          email: rowData.getValue('email'),
          role: rowData.getValue('role'),
          active: rowData.getValue('active'),
          createdAt: rowData.getValue('createdAt'),
          id: rowData.getValue('id'),
          permissions: rowData.getValue('permissions'),
        };
      } catch (error) {
        console.log("Erro ao obter valores:", error);
        // Tentar obter de row se disponível
        if (rowData.row && rowData.row.original) {
          user = rowData.row.original;
        } else {
          user = null;
        }
      }
    }
    // Caso seja um objeto simples (último recurso)
    else {
      console.log("Usando o objeto como está (último recurso)");
      user = rowData;
    }
    
    // Verificação final
    if (!user || !user.username) {
      console.log("Nenhum usuário extraído, tentando outros métodos:");
      
      // Tentar buscar pelos filteredUsers se for uma linha
      if (rowData.id !== undefined || rowData.index !== undefined) {
        const index = rowData.id !== undefined ? rowData.id : rowData.index;
        if (Array.isArray(filteredUsers) && filteredUsers[index]) {
          console.log("Usuário encontrado pelo índice:", filteredUsers[index]);
          return filteredUsers[index];
        }
      }
      
      // Criar um placeholder com as informações que temos
      user = {
        username: 'usuário-desconhecido',
        ...user
      };
    }
    
    return user;
  };

  // Column definition for users table
  const columns = [
    {
      header: "Usuário",
      accessorKey: "username",
    },
    {
      header: "Nome Completo",
      accessorKey: "fullName",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Função",
      accessorKey: "role",
      cell: (rowData: any) => {
        // Extrair os dados do usuário usando a função robusta
        const row = extractUserData(rowData);
        
        return (
          <div className="flex items-center gap-1">
            {roleIcon(row.role, row.username)}
            <span className="capitalize">
              {row.username === "administrador" || row.username === "leoalmeidas" 
                ? "admin" 
                : row.role}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "active",
      cell: (rowData: any) => {
        // Extrair os dados do usuário usando a função robusta
        const row = extractUserData(rowData);
        console.log("Dados para Switch de status:", row);
        
        // Verificar se temos um usuário válido
        if (!row.username || row.username === 'usuário-desconhecido') {
          return (
            <div className="flex items-center">
              <Switch disabled />
              <span className="ml-2 text-xs text-gray-500">Erro de dados</span>
            </div>
          );
        }
        
        return (
          <Switch
            checked={row.active}
            onCheckedChange={(checked) => {
              // Validar se o usuário é o atual
              if (row.username === currentUser?.username || row.id === currentUser?.id) {
                toast({
                  title: "Operação não permitida",
                  description: "Você não pode desativar seu próprio usuário",
                  variant: "destructive",
                });
                return;
              }
              
              // Determinar qual ID usar, com preferência pelo username para garantir consistência
              let userId;
              
              if (row.username && row.username !== 'usuário-desconhecido') {
                userId = row.username;
                console.log("Usando username para mutação:", userId);
              } else if (typeof row.id === 'number' && !isNaN(row.id)) {
                userId = row.id;
                console.log("Usando ID numérico para mutação:", userId);
              } else {
                toast({
                  title: "Erro ao atualizar status",
                  description: "Não foi possível identificar o usuário para atualização",
                  variant: "destructive",
                });
                return;
              }
              
              // Executar a mutação com o ID correto
              updateUserStatusMutation.mutate({ 
                id: userId, 
                active: checked 
              });
            }}
            disabled={row.username === currentUser?.username || row.id === currentUser?.id}
          />
        );
      },
    },
    {
      header: "Criado em",
      accessorKey: "createdAt",
      cell: (rowData: any) => {
        // Extrair os dados do usuário usando a função robusta
        const row = extractUserData(rowData);
        
        if (!row.createdAt) return "-";
        return new Date(row.createdAt).toLocaleDateString("pt-BR");
      },
    },
    {
      header: "Ações",
      id: "actions",
      cell: (rowData: any) => {
        // Extrair os dados do usuário usando a função robusta
        const row = extractUserData(rowData);
        
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPermissionsDialog(rowData)}
              disabled={row.role === "admin" || row.username === "administrador" || row.username === "leoalmeidas"}
              title={
                row.role === "admin" || row.username === "administrador" || row.username === "leoalmeidas"
                  ? "Administradores têm acesso completo"
                  : "Configurar permissões"
              }
            >
              <UserCog className="h-4 w-4" />
            </Button>
            
            {/* Botão para alterar senha */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenPasswordDialog(rowData)}
              title="Alterar senha do usuário"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Key className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUser(rowData)}
              disabled={
                row.id === currentUser?.id ||
                row.username === "administrador" ||
                row.username === "leoalmeidas"
              }
              title={
                row.id === currentUser?.id
                  ? "Você não pode excluir seu próprio usuário"
                  : row.username === "administrador" ||
                      row.username === "leoalmeidas"
                    ? "Usuários administradores padrão não podem ser excluídos"
                    : "Excluir usuário"
              }
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    registerUserMutation.mutate(data);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os usuários e permissões do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredUsers || []}
            filename="usuarios"
            label="Exportar"
            pdfTitle="Relatório de Usuários"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Role description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h3 className="font-medium">Administrador</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Acesso completo a todas as funcionalidades do sistema, incluindo
            gerenciamento de usuários e configurações.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Usuário Padrão</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Acesso baseado em permissões. As permissões individuais podem ser
            configuradas pelo administrador para cada módulo do sistema.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar usuários..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredUsers.length || 0) / 10),
          onPageChange: setCurrentPage,
        }}
      />

      {/* Create user dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: joaosilva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Ex: joao@empresa.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-red-500" />
                              <span>Administrador</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="standard">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <span>Padrão</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                        <p className="text-sm text-gray-500">
                          O usuário poderá acessar o sistema imediatamente
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={registerUserMutation.isPending}>
                  {registerUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de permissões */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Permissões do Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser ? (
                <span>
                  Configure as permissões para{" "}
                  <strong>{selectedUser.fullName}</strong>
                </span>
              ) : (
                "Configure as permissões para este usuário"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-medium mb-4">Módulos do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center space-x-2"
                >
                  <Switch
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <label
                    htmlFor={`permission-${permission.id}`}
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updateUserPermissionsMutation.isPending}
            >
              {updateUserPermissionsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Permissões"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <UserCog className="inline h-4 w-4 mr-1" />
          Os usuários são automaticamente sincronizados em todo o sistema. As
          alterações de permissões têm efeito imediato.
        </p>
      </div>

      {/* Modal de alteração de senha */}
      <Dialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Alteração de Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário{" "}
              <strong>
                {userToChangePassword ? userToChangePassword.fullName || userToChangePassword.username : ""}
              </strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label 
                htmlFor="new-password" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Nova Senha
              </label>
              <Input 
                id="new-password"
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full"
              />
              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-red-500">A senha deve ter pelo menos 6 caracteres</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={confirmChangePassword}
              disabled={changePasswordMutation.isPending || !newPassword || newPassword.length < 6}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userToDelete?.fullName}</strong>? Esta ação não pode ser
              desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsers;
