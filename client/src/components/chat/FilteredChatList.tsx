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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { 
  Archive,
  ArrowRight, 
  ArrowLeft, 
  ChevronLeft,
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileDialog } from "./UserProfileDialog";
import { CanaisButton } from "./CanaisButton";
import { MensagensDirectasButton } from "./MensagensDirectasButton";

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

// Tipos
interface ChatUser {
  id: number;
  username: string;
  fullName?: string;
  role?: string;
  profileImage?: string | null;
  status?: string;
  statusMessage?: string;
}

interface ChatComponentProps {
  initialRoomId?: number;
  height?: string;
  embedded?: boolean;
}

export default function FilteredChatList({
  initialRoomId,
  height = "h-screen",
  embedded = false,
}: ChatComponentProps) {
  // Estado para o componente
  const [searchTerm, setSearchTerm] = useState("");
  const [showChannelList, setShowChannelList] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"all" | "groups" | "directs">("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userStatus, setUserStatus] = useState("online");
  const [userStatusMessage, setUserStatusMessage] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  
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

  return (
    <div className="h-full w-full flex flex-col sm:flex-row overflow-hidden bg-background">
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
                onClick={() => window.location.href = '/chat'}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-base sm:text-lg font-semibold">Chat</h2>
            </div>
            
            {/* Área de perfil do usuário */}
            <div className="flex items-center">
              {isMobileView && activeRoom && (
                <Button variant="ghost" size="icon" onClick={() => setShowChannelList(false)} className="mr-1">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 flex items-center gap-2 px-2">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        {userProfileImage ? (
                          <AvatarImage src={userProfileImage} alt={user?.fullName || user?.username || "Usuário"} />
                        ) : (
                          <AvatarFallback>{user?.username?.charAt(0) || 'U'}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background">
                        {userStatus === "online" && <div className="h-full w-full rounded-full bg-green-500" />}
                        {userStatus === "away" && <div className="h-full w-full rounded-full bg-yellow-500" />}
                        {userStatus === "busy" && <div className="h-full w-full rounded-full bg-red-500" />}
                        {userStatus === "offline" && <div className="h-full w-full rounded-full bg-gray-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isMobileView && (
                        <span className="text-sm font-medium truncate max-w-[80px]">
                          {user?.fullName || user?.username}
                        </span>
                      )}
                      {getStatusIcon(userStatus)}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.fullName || user?.username}</span>
                      <span className="text-xs text-muted-foreground">@{user?.username}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="px-3 py-2 cursor-default flex-col items-start" onSelect={e => e.preventDefault()}>
                    <div className="flex items-center gap-2 mb-1 w-full">
                      {getStatusIcon(userStatus)}
                      <span className="font-medium">{userStatus === "online" ? "Disponível" : 
                                                   userStatus === "away" ? "Ausente" : 
                                                   userStatus === "busy" ? "Ocupado" : "Offline"}</span>
                    </div>
                    {userStatusMessage && (
                      <span className="text-xs text-muted-foreground truncate w-full">{userStatusMessage}</span>
                    )}
                  </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Barra de pesquisa */}
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
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                    // Lógica para criar novo canal
                    toast({ title: "Criar canal", description: "Funcionalidade de criar canal" });
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
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
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({ 
                                title: "Arquivar conversa", 
                                description: `Conversa ${room.name} arquivada`
                              });
                            }}
                          >
                            <Archive className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({ 
                                title: "Excluir conversa", 
                                description: `Conversa ${room.name} excluída`
                              });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Exibir cabeçalho de canais mesmo quando não há canais */}
            {(selectedTab === 'all' || selectedTab === 'groups') && 
             !filteredRooms.some(room => room.type === 'group') && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Canais</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                    // Lógica para criar novo canal
                    toast({ title: "Criar canal", description: "Funcionalidade de criar canal" });
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Mensagens Diretas - Mostrar apenas se a tab 'all' ou 'directs' está selecionada */}
            {(selectedTab === 'all' || selectedTab === 'directs') && filteredRooms.some(room => room.type === 'direct') && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-2 py-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensagens Diretas</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                    // Abrir diálogo ou dropdown com lista de usuários disponíveis
                    if (users.length > 1) {
                      // Encontrar um usuário diferente do atual para teste
                      const otherUser = users.find(u => u.id !== user?.id);
                      if (otherUser) {
                        handleUserSelect(otherUser);
                      }
                    } else {
                      toast({
                        title: "Nenhum usuário disponível",
                        description: "Não há outros usuários para iniciar conversa",
                        variant: "destructive"
                      });
                    }
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1 mt-1">
                  {filteredRooms
                    .filter(room => room.type === 'direct')
                    .map(room => {
                      // Para mensagens diretas, mostramos o nome do outro usuário
                      const otherParticipant = (room as any).participants?.find((p: any) => 
                        p.userId !== user?.id
                      );
                      const otherUser = users.find(u => 
                        u.id === otherParticipant?.userId
                      );
                      
                      // Verificar status online
                      const isOnline = otherUser && onlineUsers.includes(otherUser.id);
                      
                      return (
                        <div key={room.id} className="group relative">
                          <Button
                            variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                            className="w-full justify-start px-2 h-auto py-1.5 pr-16"
                            onClick={() => joinRoom(room.id)}
                          >
                            <div className="relative flex-shrink-0 mr-2">
                              <Avatar className="h-5 w-5">
                                {otherUser?.profileImage ? (
                                  <AvatarImage 
                                    src={otherUser.profileImage} 
                                    alt={otherUser.fullName || otherUser.username || "Usuário"} 
                                  />
                                ) : (
                                  <AvatarFallback>{otherUser?.username?.charAt(0) || '?'}</AvatarFallback>
                                )}
                              </Avatar>
                              {isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                              )}
                            </div>
                            <span className="truncate">{otherUser?.fullName || otherUser?.username || room.name}</span>
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
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ 
                                  title: "Arquivar conversa", 
                                  description: `Conversa com ${otherUser?.fullName || otherUser?.username || room.name} arquivada`
                                });
                              }}
                            >
                              <Archive className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ 
                                  title: "Excluir conversa", 
                                  description: `Conversa com ${otherUser?.fullName || otherUser?.username || room.name} excluída`
                                });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Removida mensagem "nenhuma conversa direta encontrada" */}
            
            {/* Usuários Online */}
            <div className="px-2 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuários Online</h3>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                  toast({ title: "Ver todos", description: "Ver todos os usuários" });
                }}>
                  <Users className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1 mt-1">
                {users
                  .filter(u => u.id !== user?.id && onlineUsers.includes(u.id))
                  .map(u => (
                    <Button
                      key={u.id}
                      variant="ghost"
                      className="w-full justify-start px-2 h-auto py-1.5"
                      onClick={() => handleUserSelect(u)}
                    >
                      <div className="relative flex-shrink-0 mr-2">
                        <Avatar className="h-5 w-5">
                          {u.profileImage ? (
                            <AvatarImage 
                              src={u.profileImage} 
                              alt={u.fullName || u.username || "Usuário"} 
                            />
                          ) : (
                            <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                      </div>
                      <span className="truncate">{u.fullName || u.username}</span>
                    </Button>
                  ))}
                  
                {users.filter(u => u.id !== user?.id && onlineUsers.includes(u.id)).length === 0 && (
                  <div className="px-2 py-2 text-sm text-gray-500">
                    Nenhum usuário online no momento
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        {/* Botão de limpeza de dados - apenas para administradores */}
        {user?.role === 'admin' && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <Button
              onClick={async () => {
                if (window.confirm('Tem certeza que deseja limpar todos os dados de chat? Esta ação não pode ser desfeita.')) {
                  try {
                    const response = await fetch('/api/chat/cleanup', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      credentials: 'include'
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Dados limpos",
                        description: "Todas as mensagens e canais de chat foram removidos com sucesso.",
                      });
                      
                      // Recarregar a página para atualizar os dados
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      toast({
                        title: "Erro",
                        description: "Não foi possível limpar os dados de chat.",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    console.error('Erro ao limpar dados de chat:', error);
                    toast({
                      title: "Erro",
                      description: "Ocorreu um erro ao limpar os dados de chat.",
                      variant: "destructive"
                    });
                  }
                }
              }}
              variant="outline"
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Limpar todos os dados de chat
            </Button>
          </div>
        )}
      </div>
      
      {/* Área de conversa */}
      <div className={cn(
        "flex flex-col flex-1 h-full max-w-full overflow-hidden",
        isMobileView && !showChannelList ? "block" : (isMobileView ? "hidden" : "block")
      )}>
        {activeRoom ? (
          <>
            {/* Header da sala ativa */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {/* Botão de voltar para mobile */}
                  {isMobileView && (
                    <Button variant="ghost" size="icon" className="mr-1" onClick={() => setShowChannelList(true)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Nome da sala */}
                  <div className="flex items-center">
                    {activeRoom.type === 'group' ? (
                      <Hash className="h-5 w-5 mr-2 text-gray-500" />
                    ) : (
                      <User className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    <h2 className="text-lg font-semibold truncate">{activeRoom.name}</h2>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex">
                  <Button variant="ghost" size="icon">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => deleteRoom(activeRoom.id)}
                    title="Excluir conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Conteúdo da conversa */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 min-h-[calc(100vh-180px)] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="h-4"></div> // Espaço vazio sem mensagem de "Nenhuma mensagem ainda"
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div key={message.id || index} className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${message.userId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {(message.type === 'file' || message.type === 'image') && (
                              <div className="mb-2">
                                {message.content.match(/\.(jpeg|jpg|gif|png)$/i) || message.type === 'image' ? (
                                  <img 
                                    src={message.content} 
                                    alt="Imagem enviada" 
                                    className="max-w-full max-h-64 rounded-md" 
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                ) : (
                                  <div className="flex items-center text-sm">
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    <a 
                                      href={message.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="underline"
                                    >
                                      Arquivo anexado
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            {message.type === 'text' && (
                              <div className="text-sm">
                                {message.content}
                              </div>
                            )}
                            <div className="text-xs mt-1 opacity-70 text-right">
                              {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Referência para rolar para o final da lista de mensagens */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Área de digitação */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 w-full mt-auto sticky bottom-0 bg-background">
              <div className="relative">
                <div className="absolute left-3 top-3 z-10">
                  <label htmlFor="fileUpload">
                    <div 
                      className="flex items-center justify-center w-8 h-8 hover:opacity-80 cursor-pointer transition-opacity" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = ''; // Resetar input para permitir reenvio do mesmo arquivo
                          fileInput.click();
                        }
                      }}
                    >
                      <div className="p-1">
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="text-primary"
                        >
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </div>
                    </div>
                  </label>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    className="hidden" 
                    accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Mostrar feedback visual no textarea
                        const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                        if (messageInput) {
                          messageInput.value = `Anexando o arquivo: ${file.name}...`;
                        }
                        
                        // Tentar upload
                        uploadFile(file)
                          .then(() => {
                            // Limpar mensagem de feedback em caso de sucesso
                            setTimeout(() => {
                              if (messageInput && messageInput.value.includes('Anexando o arquivo')) {
                                messageInput.value = '';
                              }
                            }, 1000);
                          })
                          .catch(err => {
                            // Mostrar erro no textarea
                            if (messageInput) {
                              messageInput.value = `Erro ao anexar: ${err.message || 'Tente novamente'}`;
                            }
                          });
                        
                        e.target.value = ''; // Limpa o input para permitir reenviar o mesmo arquivo
                      }
                    }}
                  />
                </div>
                <Textarea 
                  id="messageInput"
                  placeholder="Digite sua mensagem..." 
                  className="w-full pl-12 pr-16 min-h-[40px] max-h-[120px] resize-none overflow-y-auto"
                  onKeyDown={(e: React.KeyboardEvent) => {
                    // Enviar apenas em desktop/laptop quando Enter é pressionado sem Shift
                    // Em dispositivos móveis, a tecla Enter nos teclados virtuais geralmente insere quebras de linha
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                      e.preventDefault();
                      const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                      const message = messageInput.value.trim();
                      
                      if (message) {
                        sendMessage(message);
                        messageInput.value = '';
                      }
                    }
                  }}
                />
                <div className="absolute right-3 top-3">
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                      const message = messageInput.value.trim();
                      
                      if (message) {
                        sendMessage(message);
                        messageInput.value = '';
                      }
                    }}
                  >
                    <Send className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat</h3>
              <p className="text-gray-500 mb-6">Selecione uma conversa no menu lateral para começar</p>
              <div className="flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}