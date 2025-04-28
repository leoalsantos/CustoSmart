import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useChat, ChatUser } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";

// Definindo tipo User localmente para evitar problemas de importação
type UserType = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: any;
  active: boolean;
};
import { 
  Archive,
  ArrowRight, 
  ArrowLeft, 
  ChevronLeft,
  ChevronRight,
  FilePlus,
  Hash, 
  Paperclip,
  Plus, 
  Search,
  Send,
  Trash2,
  User, 
  Settings, 
  UserCircle, 
  UserCog, 
  MessageSquare,
  Users,
  UserPlus,
  Menu,
  Circle,
  Clock,
  AlertCircle,
  CircleDashed,
  Upload,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileDialog } from "./UserProfileDialog";

// Hook para detectar tamanho da janela
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
}

interface ChatComponentProps {
  initialRoomId?: number;
  height?: string;
  embedded?: boolean;
}

export default function NewFilteredChatList({
  initialRoomId,
  height = "h-screen",
  embedded = false,
}: ChatComponentProps) {
  
  // Helper para prevenir comportamento padrão em dispositivos móveis
  const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    callback();
  };
  // Estado para o componente
  const [searchTerm, setSearchTerm] = useState("");
  const [showChannelList, setShowChannelList] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"all" | "groups" | "directs">("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userStatus, setUserStatus] = useState("online");
  const [userStatusMessage, setUserStatusMessage] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
  
  // Estados para os diálogos
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [createDirectDialogOpen, setCreateDirectDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [dialogSearchTerm, setDialogSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);
  
  // Refs e hooks
  const { toast } = useToast();
  const windowSize = useWindowSize();
  const isMobileView = windowSize.width < 768;
  
  // Referência para rolar para o final da lista de mensagens
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hook de chat
  const {
    rooms,
    activeRoom,
    messages,
    users,
    onlineUsers,
    loading,
    typingUsers,
    sendMessage,
    joinRoom,
    leaveRoom,
    deleteRoom,
    createRoom,
    setTyping,
    uploadFile
  } = useChat(initialRoomId);
  
  // Obtém o usuário autenticado através do hook useAuth
  const { user: authUser } = useAuth();
  const user = authUser;
  
  // Funções para atualizar o status e mensagem
  const handleStatusChange = (status: string, statusMessage?: string) => {
    setUserStatus(status);
    setUserStatusMessage(statusMessage || "");
    
    // Aqui você também poderia chamar uma API para persistir o status do usuário
    console.log("Status atualizado:", status, statusMessage);
  };
  
  // Função para atualizar a imagem de perfil
  const handleProfileImageChange = (imageUrl: string | null) => {
    setUserProfileImage(imageUrl);
    
    // Aqui você poderia chamar uma API para persistir a imagem de perfil
    console.log("Imagem de perfil atualizada:", imageUrl);
  };
  
  // Quando a tela é redimensionada
  useEffect(() => {
    // Em dispositivos móveis, esconder a lista de canais quando uma sala está ativa
    if (windowSize.width < 768 && activeRoom) {
      setShowChannelList(false);
    } else {
      setShowChannelList(true);
    }
  }, [windowSize.width, activeRoom]);
  
  // Efeito para rolar para o final das mensagens quando novas mensagens chegarem ou a sala mudar
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeRoom]);
  
  // Filtrar salas com base na pesquisa e no filtro ativo (tab)
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo
    if (selectedTab === 'all') {
      return matchesSearch;
    } else if (selectedTab === 'groups') {
      return matchesSearch && room.type === 'group';
    } else if (selectedTab === 'directs') {
      return matchesSearch && room.type === 'direct';
    }
    
    return matchesSearch;
  });
  
  // Função para selecionar um usuário para mensagem direta
  const handleUserSelect = async (selectedUser: ChatUser) => {
    try {
      // Verificar se já existe uma sala direta com este usuário
      const existingDM = rooms.find(room => 
        room.type === 'direct' && 
        // Como room.participants pode não existir no tipo ChatRoom, tratamos como any
        (room as any).participants?.some((p: any) => p.userId === selectedUser.id)
      );
      
      if (existingDM) {
        // Se já existe, apenas entrar nela
        await joinRoom(existingDM.id);
        
        toast({
          title: "Conversa existente",
          description: `Você já tem uma conversa com ${selectedUser.fullName || selectedUser.username}`,
        });
      } else {
        // Se não existe, criar uma nova sala
        const dmName = `DM: ${user?.username} e ${selectedUser.username}`;
        await createRoom(dmName, [selectedUser.id]);
        
        toast({
          title: "Conversa iniciada",
          description: `Conversa iniciada com ${selectedUser.fullName || selectedUser.username}`,
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast({
        title: "Erro ao iniciar conversa",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Se estiver carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Função para renderizar ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Circle className="h-3 w-3 text-green-500 fill-green-500" />;
      case "away":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "busy":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "offline":
        return <CircleDashed className="h-3 w-3 text-gray-500" />;
      default:
        return <Circle className="h-3 w-3 text-green-500 fill-green-500" />;
    }
  };

  // Funções para o diálogo de criar grupo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGroupImage(e.target.files[0]);
    }
  };

  const handleGroupUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o grupo.",
        variant: "destructive"
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Participantes obrigatórios",
        description: "Por favor, selecione pelo menos um participante para o grupo.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const participants = user ? [user.id, ...selectedUsers] : selectedUsers;
      
      await createRoom(groupName, participants);
      
      toast({
        title: "Grupo criado",
        description: `O grupo "${groupName}" foi criado com sucesso.`
      });
      
      setCreateGroupDialogOpen(false);
      // Limpar estados
      setGroupName('');
      setGroupImage(null);
      setDialogSearchTerm('');
      setSelectedUsers([]);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para iniciar chat direto com um usuário
  const initiateDirectChat = async (selectedUser: ChatUser) => {
    if (!selectedUser) return;
    
    setLoadingUserId(selectedUser.id);
    try {
      await handleUserSelect(selectedUser);
      toast({
        title: "Conversa iniciada",
        description: `Conversa com ${selectedUser.fullName || selectedUser.username} iniciada`
      });
      setCreateDirectDialogOpen(false);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col sm:flex-row overflow-hidden bg-background">
      {/* Diálogo de perfil do usuário */}
      <UserProfileDialog 
        open={isEditingProfile} 
        onOpenChange={setIsEditingProfile}
        currentStatus={userStatus}
        currentStatusMessage={userStatusMessage}
        currentProfileImage={userProfileImage}
        onStatusChange={handleStatusChange}
        onProfileImageChange={handleProfileImageChange}
        onAutoResponseChange={(enabled, messages) => {
          console.log("Respostas automáticas atualizadas:", enabled, messages);
          // Aqui você poderia persistir as mensagens automáticas
        }}
      />
      
      {/* Barra lateral - Lista de Canais */}
      <div className={cn(
        "border-r border-gray-200 dark:border-gray-800 flex flex-col",
        isMobileView ? (showChannelList ? "w-full" : "hidden") : "w-64"
      )}>
        {/* Header com perfil do usuário */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-1" 
                onClick={() => window.location.href = '/'}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-base sm:text-lg font-semibold">Chat</h2>
            </div>
            
          </div>
          
          {/* Perfil do usuário movido para o canto superior esquerdo */}
          <div className="flex items-center mb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="flex items-center justify-start px-2 w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={userProfileImage || ''} />
                        <AvatarFallback>
                          {user?.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-background flex items-center justify-center">
                        {getStatusIcon(userStatus)}
                      </div>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium truncate w-full max-w-[120px] sm:max-w-[150px]">
                        {user?.fullName || user?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {userStatus === 'online' ? 'Online' : 
                        userStatus === 'away' ? 'Ausente' : 
                        userStatus === 'busy' ? 'Ocupado' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.fullName || user?.username}</span>
                    <span className="text-xs text-muted-foreground">@{user?.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsEditingProfile(true)}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Editar perfil e status</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Gerenciar Usuários</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Área de pesquisa */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Pesquisar conversas..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Espaço para navegação mobile quando necessário */}
          <div>
            {isMobileView && activeRoom && (
              <Button variant="ghost" size="icon" onClick={() => setShowChannelList(false)} className="mr-1">
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Tabs de filtro */}
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedTab(value as "all" | "groups" | "directs")}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="directs">Diretas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Lista de conversas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Canais/Grupos - Mostrar apenas se a tab 'all' ou 'groups' está selecionada */}
            {(selectedTab === 'all' || selectedTab === 'groups') && filteredRooms.some(room => room.type === 'group') && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Canais</h3>
                  {/* Mostrar botão de criar canal apenas na aba de grupos */}
                  {selectedTab === 'groups' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setCreateGroupDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-1 mt-1">
                  {filteredRooms
                    .filter(room => room.type === 'group')
                    .map(room => (
                      <div key={room.id} className="group relative">
                        <Button
                          variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                          className="w-full justify-start px-2 h-auto py-1.5 pr-16"
                          onClick={() => joinRoom(room.id)}
                        >
                          <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{room.name}</span>
                          {room.unreadCount && room.unreadCount > 0 && (
                            <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                              {room.unreadCount}
                            </span>
                          )}
                        </Button>
                        <div className="absolute right-0 top-0 h-full hidden group-hover:flex items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Tem certeza que deseja excluir o canal ${room.name}?`)) {
                                deleteRoom(room.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Exibir cabeçalho de canais mesmo quando não há canais */}
            {(selectedTab === 'all' || selectedTab === 'groups') && !filteredRooms.some(room => room.type === 'group') && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Canais</h3>
                  {/* Mostrar botão de criar canal apenas na aba de grupos */}
                  {selectedTab === 'groups' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setCreateGroupDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!filteredRooms.some(room => room.type === 'group') && (
                  <div className="text-xs text-center text-muted-foreground mt-2 mb-1">
                    Nenhum canal disponível{selectedTab === 'groups' ? ". Clique no + para criar" : ""}.
                  </div>
                )}
              </div>
            )}
            
            {/* Diálogo para criar novo canal/grupo */}
            <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar novo canal</DialogTitle>
                  <DialogDescription>
                    Crie um novo canal de conversação e adicione participantes.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do canal</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Marketing, Suporte, Desenvolvimento..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Participantes</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar usuários..."
                        className="pl-9"
                        value={dialogSearchTerm}
                        onChange={(e) => setDialogSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      {users
                        .filter(u => u.id !== user?.id) // Excluir o usuário atual
                        .filter(u => 
                          u.username.toLowerCase().includes(dialogSearchTerm.toLowerCase()) ||
                          (u.fullName && u.fullName.toLowerCase().includes(dialogSearchTerm.toLowerCase()))
                        )
                        .sort((a, b) => {
                          // Ordenar por status online primeiro
                          const aOnline = onlineUsers.includes(a.id);
                          const bOnline = onlineUsers.includes(b.id);
                          
                          if (aOnline && !bOnline) return -1;
                          if (!aOnline && bOnline) return 1;
                          
                          // Depois por nome alfabeticamente
                          return (a.fullName || a.username).localeCompare(b.fullName || b.username);
                        })
                        .map(u => (
                          <div key={u.id} className="flex items-center space-x-2 py-2">
                            <Checkbox 
                              id={`user-${u.id}`} 
                              checked={selectedUsers.includes(u.id)}
                              onCheckedChange={() => handleGroupUserSelect(u.id)}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {(u.fullName || u.username).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {onlineUsers.includes(u.id) && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border border-background"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.fullName || u.username}</p>
                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </ScrollArea>
                  </div>
                </div>
                
                <DialogFooter className="sm:justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCreateGroupDialogOpen(false);
                      setGroupName('');
                      setSelectedUsers([]);
                      setDialogSearchTerm('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
                    className="gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Criar Canal</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Mensagens Diretas - Mostrar sempre quando a tab 'all' ou 'directs' está selecionada */}
            {(selectedTab === 'all' || selectedTab === 'directs') && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensagens Diretas</h3>
                  {/* Mostrar botão de criar mensagem direta apenas na aba de mensagens diretas */}
                  {selectedTab === 'directs' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setCreateDirectDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!filteredRooms.some(room => room.type === 'direct') && (
                  <div className="text-xs text-center text-muted-foreground mt-2 mb-1">
                    Nenhuma conversa iniciada{selectedTab === 'directs' ? ". Clique no + para conversar" : ""}.
                  </div>
                )}
                
                <div className="space-y-1 mt-1">
                  {filteredRooms
                    .filter(room => room.type === 'direct')
                    .map(room => {
                      // Para salas de mensagem direta, mostrar o nome do outro usuário
                      let otherUser: ChatUser | undefined;
                      const participants = (room as any).participants;
                      
                      if (participants) {
                        const otherParticipant = participants.find((p: any) => p.userId !== user?.id);
                        if (otherParticipant) {
                          otherUser = users.find(u => u.id === otherParticipant.userId);
                        }
                      }
                      
                      const displayName = otherUser 
                        ? (otherUser.fullName || otherUser.username) 
                        : room.name.replace('DM: ', '');
                        
                      const isUserOnline = !!otherUser && onlineUsers.includes(otherUser.id);
                      
                      return (
                        <div key={room.id} className="group relative">
                          <Button
                            variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                            className="w-full justify-start px-2 h-auto py-1.5 pr-16"
                            onClick={() => joinRoom(room.id)}
                          >
                            <div className="relative mr-2 flex-shrink-0">
                              <User className="h-4 w-4" />
                              {isUserOnline && (
                                <span className="absolute right-0 bottom-0 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                              )}
                            </div>
                            <span className="truncate">{displayName}</span>
                            {room.unreadCount && room.unreadCount > 0 && (
                              <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                                {room.unreadCount}
                              </span>
                            )}
                          </Button>
                          <div className="absolute right-0 top-0 h-full hidden group-hover:flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 mr-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Tem certeza que deseja excluir a conversa com ${displayName}?`)) {
                                  deleteRoom(room.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Diálogo para criar conversa direta */}
            <Dialog open={createDirectDialogOpen} onOpenChange={setCreateDirectDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Iniciar conversa</DialogTitle>
                  <DialogDescription>
                    Selecione um usuário para iniciar uma conversa direta.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar usuários..."
                      className="pl-9"
                      value={dialogSearchTerm}
                      onChange={(e) => setDialogSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    {users
                      .filter(u => u.id !== user?.id) // Excluir o usuário atual
                      .filter(u => 
                        u.username.toLowerCase().includes(dialogSearchTerm.toLowerCase()) ||
                        (u.fullName && u.fullName.toLowerCase().includes(dialogSearchTerm.toLowerCase()))
                      )
                      .sort((a, b) => {
                        // Ordenar por status online primeiro
                        const aOnline = onlineUsers.includes(a.id);
                        const bOnline = onlineUsers.includes(b.id);
                        
                        if (aOnline && !bOnline) return -1;
                        if (!aOnline && bOnline) return 1;
                        
                        // Depois por nome alfabeticamente
                        return (a.fullName || a.username).localeCompare(b.fullName || b.username);
                      })
                      .map(u => (
                        <div key={u.id} className="py-2">
                          <Button
                            variant="ghost"
                            className="w-full flex items-center justify-start gap-2 h-auto py-2"
                            onClick={() => initiateDirectChat(u)}
                            disabled={loadingUserId === u.id}
                          >
                            <div className="relative">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                  {(u.fullName || u.username).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {onlineUsers.includes(u.id) && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border border-background"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium truncate">{u.fullName || u.username}</p>
                              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                            </div>
                            {loadingUserId === u.id && (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            )}
                          </Button>
                        </div>
                      ))}
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCreateDirectDialogOpen(false);
                      setDialogSearchTerm('');
                    }}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Controlador para apagar tudo */}
            {user && user.role === 'admin' && (
              <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir TODAS as salas e mensagens? Esta ação não pode ser desfeita.")) {
                      // Excluir cada sala
                      Promise.all(rooms.map(room => deleteRoom(room.id)))
                        .then(() => {
                          toast({
                            title: "Exclusão concluída",
                            description: "Todas as mensagens e canais de chat foram removidos com sucesso.",
                            variant: "default"
                          });
                        })
                        .catch(error => {
                          console.error("Erro ao excluir salas:", error);
                          toast({
                            title: "Erro",
                            description: "Ocorreu um erro ao excluir as salas. Tente novamente.",
                            variant: "destructive"
                          });
                        });
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Limpar todo o chat</span>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Área principal de chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50",
        isMobileView && showChannelList ? "hidden" : "flex"
      )}>
        {activeRoom ? (
          <>
            {/* Header da sala ativa */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between bg-card">
              <div className="flex items-center">
                {isMobileView && (
                  <Button variant="ghost" size="icon" onClick={() => setShowChannelList(true)} className="mr-2">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                
                {activeRoom.type === 'group' ? (
                  <div className="flex items-center">
                    <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">{activeRoom.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      {/* Indicador de status */}
                      {(() => {
                        // Tentar encontrar o outro usuário para mensagens diretas
                        let otherUser: ChatUser | undefined;
                        const participants = (activeRoom as any).participants;
                        
                        if (participants) {
                          const otherParticipant = participants.find((p: any) => p.userId !== user?.id);
                          if (otherParticipant) {
                            otherUser = users.find(u => u.id === otherParticipant.userId);
                          }
                        }
                        
                        const isUserOnline = !!otherUser && onlineUsers.includes(otherUser.id);
                        
                        return isUserOnline ? (
                          <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-green-500"></span>
                        ) : null;
                      })()}
                    </div>
                    
                    {(() => {
                      // Mostrar nome do outro usuário para mensagens diretas
                      let displayName = activeRoom.name.replace('DM: ', '');
                      
                      const participants = (activeRoom as any).participants;
                      if (participants) {
                        const otherParticipant = participants.find((p: any) => p.userId !== user?.id);
                        if (otherParticipant) {
                          const otherUser = users.find(u => u.id === otherParticipant.userId);
                          if (otherUser) {
                            displayName = otherUser.fullName || otherUser.username;
                          }
                        }
                      }
                      
                      return <span className="font-medium">{displayName}</span>;
                    })()}
                  </div>
                )}
              </div>
              
              <div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja sair de ${activeRoom.name}?`)) {
                      leaveRoom(activeRoom.id);
                    }
                  }}
                >
                  <Archive className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Área de mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    Nenhuma mensagem ainda. Seja o primeiro a enviar algo!
                  </div>
                )}
                
                {messages.map((message, index) => {
                  // Verificar se a mensagem é do usuário atual
                  const isCurrentUser = message.userId === user?.id;
                  
                  // Encontrar o usuário que enviou a mensagem
                  const messageUser = users.find(u => u.id === message.userId);
                  
                  // Verificar se deve agrupar com a mensagem anterior
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const isSameGroup = prevMessage && prevMessage.userId === message.userId;
                  
                  // Formatar a data
                  const messageDate = new Date(message.createdAt);
                  const formattedTime = messageDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex",
                        isCurrentUser ? "justify-end" : "justify-start",
                        isSameGroup ? "mt-1" : "mt-4"
                      )}
                    >
                      {!isCurrentUser && !isSameGroup && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                          <AvatarImage src={messageUser?.profileImage || ''} />
                          <AvatarFallback>
                            {messageUser?.username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {isCurrentUser && !isSameGroup && <div className="w-8 mr-2" />}
                      
                      {isSameGroup && !isCurrentUser && <div className="w-8 mr-2" />}
                      
                      <div className={cn(
                        "max-w-[75%]",
                        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-gray-200 dark:bg-gray-800",
                        "rounded-lg px-3 py-2 shadow-sm"
                      )}>
                        {!isSameGroup && (
                          <div className="flex items-center gap-x-2 mb-1">
                            <span className="font-medium text-xs">
                              {isCurrentUser ? 'Você' : messageUser?.fullName || messageUser?.username || 'Usuário desconhecido'}
                            </span>
                            <span className="text-xs opacity-70">{formattedTime}</span>
                          </div>
                        )}
                        
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        
                        {/* Se houver anexo */}
                        {message.attachment && (
                          <div className="mt-2">
                            <a 
                              href={message.attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-sm underline hover:text-primary"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Anexo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Indicador de digitação */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1 mr-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce animation-delay-200">.</span>
                      <span className="animate-bounce animation-delay-400">.</span>
                    </div>
                    <span>
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].fullName || typingUsers[0].username} está digitando` 
                        : `${typingUsers.length} pessoas estão digitando`}
                    </span>
                  </div>
                )}
                
                {/* Referência para rolagem automática */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Campo de mensagem */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-card">
              <div className="flex items-end">
                <Textarea
                  placeholder="Escreva uma mensagem..."
                  className="min-h-[80px] resize-none flex-1 mr-2"
                  onKeyDown={(e) => {
                    // Ctrl+Enter envia a mensagem
                    if (e.key === 'Enter' && e.ctrlKey) {
                      // Mostrar um elemento que tem o conteúdo e ele tenta enviar
                      const content = (e.target as HTMLTextAreaElement).value.trim();
                      if (content) {
                        sendMessage(content);
                        (e.target as HTMLTextAreaElement).value = '';
                      }
                    }
                    
                    // Sinalizar digitação
                    setTyping(true);
                  }}
                  onBlur={() => setTyping(false)}
                />
                <div className="flex flex-col mb-1">
                  <input
                    type="file"
                    id="attachment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPendingAttachment(e.target.files[0]);
                      }
                    }}
                  />
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="button" 
                      size="icon" 
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea && textarea.value.trim()) {
                          sendMessage(textarea.value.trim());
                          textarea.value = '';
                          textarea.focus();
                        }
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => document.getElementById('attachment')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Mostrar anexo pendente */}
              {pendingAttachment && (
                <div className="mt-2 p-2 border rounded-md bg-muted flex items-center justify-between">
                  <div className="flex items-center">
                    <FilePlus className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">{pendingAttachment.name}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPendingAttachment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        try {
                          await uploadFile(pendingAttachment);
                          setPendingAttachment(null);
                          toast({
                            title: "Sucesso",
                            description: "Arquivo enviado com sucesso.",
                          });
                        } catch (error) {
                          console.error("Erro ao enviar arquivo:", error);
                          toast({
                            title: "Erro",
                            description: "Não foi possível enviar o arquivo. Tente novamente.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <span>Enviar</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Estado inicial ou quando nenhuma sala está selecionada
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Bem-vindo(a) ao Chat</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Selecione uma conversa existente ou inicie uma nova para começar a enviar mensagens.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botão para criar canal */}
              <Button 
                variant="outline"
                className="flex items-center gap-x-2"
                onClick={() => {
                  setCreateGroupDialogOpen(true);
                  // Reinicialização dos estados para o diálogo
                  setGroupName('');
                  setDialogSearchTerm('');
                  setSelectedUsers([]);
                  setGroupImage(null);
                }}
              >
                <Hash className="h-5 w-5" />
                <span>Criar um canal</span>
              </Button>
              
              {/* Botão para iniciar conversa */}
              <Button 
                className="flex items-center gap-x-2"
                onClick={() => {
                  setCreateDirectDialogOpen(true);
                  setDialogSearchTerm('');
                }}
              >
                <UserPlus className="h-5 w-5" />
                <span>Iniciar conversa</span>
              </Button>
            </div>
            
            {/* Diálogo para criar grupo/canal */}
            <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar novo grupo</DialogTitle>
                  <DialogDescription>
                    Dê um nome ao grupo e selecione os participantes
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  {/* Nome do grupo */}
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Nome do grupo</Label>
                    <Input
                      id="group-name"
                      placeholder="Digite o nome do grupo"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  
                  {/* Upload de imagem */}
                  <div className="space-y-2">
                    <Label htmlFor="group-image">Imagem do grupo (opcional)</Label>
                    <div className="flex items-center gap-4">
                      {groupImage && (
                        <div className="h-16 w-16 rounded-md overflow-hidden">
                          <img 
                            src={URL.createObjectURL(groupImage)} 
                            alt="Preview" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      )}
                      <label htmlFor="group-image" className="cursor-pointer">
                        <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                          <Upload className="h-5 w-5 text-gray-500" />
                          <span className="text-sm text-gray-500">Selecionar imagem</span>
                        </div>
                        <input
                          type="file"
                          id="group-image"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Pesquisa de usuários */}
                  <div className="space-y-2">
                    <Label>Participantes</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar usuários..."
                        className="pl-9"
                        value={dialogSearchTerm}
                        onChange={(e) => setDialogSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Lista de usuários */}
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {users.length === 0 || !users.filter(u => u.id !== user?.id).length ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhum outro usuário disponível
                        </div>
                      ) : (
                        users
                          .filter(u => u.id !== user?.id)
                          .filter(u => {
                            if (!dialogSearchTerm.trim()) return true;
                            
                            const fullNameMatch = u.fullName?.toLowerCase().includes(dialogSearchTerm.toLowerCase());
                            const usernameMatch = u.username.toLowerCase().includes(dialogSearchTerm.toLowerCase());
                            return fullNameMatch || usernameMatch;
                          })
                          .sort((a, b) => {
                            // Ordenar alfabeticamente
                            const nameA = a.fullName || a.username;
                            const nameB = b.fullName || b.username;
                            return nameA.localeCompare(nameB);
                          })
                          .map(userItem => {
                            const isSelected = selectedUsers.includes(userItem.id);
                            const isOnline = onlineUsers.includes(userItem.id);
                            
                            return (
                              <div
                                key={userItem.id}
                                className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                                  isSelected ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => handleGroupUserSelect(userItem.id)}
                              >
                                <Checkbox
                                  id={`user-${userItem.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => {}}
                                  className="pointer-events-none"
                                />
                                
                                <div className="flex items-center flex-1 space-x-3">
                                  <div className="relative">
                                    <Avatar>
                                      <AvatarFallback>{userItem.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0">
                                      {getStatusIcon(isOnline ? "online" : "offline")}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col">
                                    <span className="font-medium">{userItem.fullName || userItem.username}</span>
                                    <span className="text-xs text-muted-foreground">@{userItem.username}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setCreateGroupDialogOpen(false)} variant="outline" className="mr-2">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <span className="animate-spin mr-2">●</span>
                        Criando...
                      </>
                    ) : (
                      'Criar grupo'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Diálogo para iniciar mensagem direta */}
            <Dialog open={createDirectDialogOpen} onOpenChange={setCreateDirectDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova mensagem direta</DialogTitle>
                  <DialogDescription>
                    Selecione um usuário para iniciar uma conversa
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  {/* Barra de pesquisa de usuários */}
                  <div className="space-y-2">
                    <Label htmlFor="search-users">Usuários</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="search-users"
                        placeholder="Buscar usuários..."
                        className="pl-9"
                        value={dialogSearchTerm}
                        onChange={(e) => setDialogSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Lista de usuários */}
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-2">
                      {users.length === 0 || !users.filter(u => u.id !== user?.id).length ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhum outro usuário disponível
                        </div>
                      ) : (
                        users
                          .filter(u => u.id !== user?.id)
                          .filter(u => {
                            if (!dialogSearchTerm.trim()) return true;
                            
                            const fullNameMatch = u.fullName?.toLowerCase().includes(dialogSearchTerm.toLowerCase());
                            const usernameMatch = u.username.toLowerCase().includes(dialogSearchTerm.toLowerCase());
                            return fullNameMatch || usernameMatch;
                          })
                          .sort((a, b) => {
                            // Ordenar alfabeticamente
                            const nameA = a.fullName || a.username;
                            const nameB = b.fullName || b.username;
                            return nameA.localeCompare(nameB);
                          })
                          .map((userItem) => {
                            // Verificar se o usuário está online
                            const isOnline = onlineUsers.includes(userItem.id);
                            
                            return (
                              <div
                                key={userItem.id}
                                className="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => initiateDirectChat(userItem)}
                              >
                                <div className="relative mr-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10">
                                      {userItem.username?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute bottom-0 right-0">
                                    {getStatusIcon(isOnline ? "online" : "offline")}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{userItem.fullName || userItem.username}</span>
                                  <span className="text-xs text-muted-foreground">@{userItem.username}</span>
                                </div>
                                
                                {loadingUserId === userItem.id && (
                                  <div className="ml-auto">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                  </div>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setCreateDirectDialogOpen(false)} variant="outline">
                    Cancelar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
