import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChat, ChatRoom, ChatMessage, ChatUser } from '@/hooks/use-chat';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, Send, Paperclip, Smile, Plus, 
  MoreVertical, Edit, Trash2, Forward, Star, 
  Reply, ChevronDown, Hash, Lock, User, Search,
  Volume2, Bell, BellOff, Users, UserPlus, Settings,
  Menu, ChevronRight, Clock, ArrowRight, FileText, X,
  Image as ImageIcon, FileAudio, ChevronLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";

// Hook para detectar tamanho de tela
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
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
}

interface ChatComponentProps {
  initialRoomId?: number;
  height?: string;
  embedded?: boolean;
}

export default function SlackStyleChat({
  initialRoomId,
  height = 'h-[calc(100vh-4rem)]',
  embedded = false
}: ChatComponentProps): React.ReactNode {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | 'direct'>('group');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageToReply, setMessageToReply] = useState<ChatMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChannelList, setShowChannelList] = useState(true);
  
  const windowSize = useWindowSize();
  
  // Chat hook
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
    createRoom,
    setTyping,
    uploadFile
  } = useChat(initialRoomId);

  // Detectar se está em mobile view
  useEffect(() => {
    setIsMobileView(windowSize.width < 768);
    
    // Em mobile, esconder a lista de canais quando uma sala está ativa
    if (windowSize.width < 768 && activeRoom) {
      setShowChannelList(false);
    } else {
      setShowChannelList(true);
    }
  }, [windowSize.width, activeRoom]);

  // Filtrar salas com base na pesquisa
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      if (messageToReply) {
        // Formatação para reply
        const replyContent = `${messageInput}\n> Em resposta a: ${messageToReply.content}`;
        await sendMessage(replyContent);
      } else {
        await sendMessage(messageInput);
      }
      
      setMessageInput('');
      setMessageToReply(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para iniciar upload de arquivo
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Função para processar arquivo selecionado
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Upload do arquivo para cada um dos arquivos selecionados
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }
      
      // Limpar seleção de arquivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast({
        title: "Erro ao enviar arquivo",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para criar uma nova sala
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Nome da sala obrigatório",
        description: "Por favor, informe um nome para a sala.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createRoom(newRoomName, selectedParticipants);
      setShowNewRoomDialog(false);
      setNewRoomName('');
      setSelectedParticipants([]);
      
      toast({
        title: "Sala criada com sucesso",
        description: `A sala "${newRoomName}" foi criada e está pronta para uso.`,
      });
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast({
        title: "Erro ao criar sala",
        description: "Não foi possível criar a sala. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para selecionar um usuário para mensagem direta
  const handleUserSelect = async (selectedUser: ChatUser) => {
    // Verificar se já existe uma sala direta com este usuário
    const existingDM = rooms.find(room => 
      room.type === 'direct' && 
      // Como room.participants pode não existir no tipo ChatRoom, tratamos como any
      // Esta é uma solução temporária que deve ser melhorada no futuro
      (room as any).participants?.some((p: any) => p.userId === selectedUser.id)
    );
    
    if (existingDM) {
      // Se já existe, apenas entrar nela
      await joinRoom(existingDM.id);
    } else {
      // Se não existe, criar uma nova sala
      const dmName = `DM: ${user?.username} e ${selectedUser.username}`;
      // O createRoom espera apenas nome e participantes por padrão
      await createRoom(dmName, [selectedUser.id]);
    }
  };

  // Renderizar mensagem com formatação
  const renderMessageContent = (message: ChatMessage) => {
    // Caso especial para mensagens de resposta
    if (message.content.includes('> Em resposta a:')) {
      const [mainContent, replyContent] = message.content.split('\n> Em resposta a:');
      
      return (
        <div>
          <div className="mb-1 text-sm italic bg-gray-100 dark:bg-gray-800 p-1 rounded border-l-2 border-primary">
            {replyContent}
          </div>
          <div>{mainContent}</div>
        </div>
      );
    }
    
    // Detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    
    return (
      <div>
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  // Se estiver carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Componente de lista de canais
  const ChannelList = () => (
    <div className={cn(
      "border-r border-gray-200 dark:border-gray-800 flex flex-col",
      isMobileView ? (showChannelList ? "w-full" : "hidden") : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">CustoSmart Chat</h2>
          {isMobileView && activeRoom && (
            <Button variant="ghost" size="icon" onClick={() => setShowChannelList(false)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-4">
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Canais</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                setNewRoomType('group');
                setShowNewRoomDialog(true);
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1 mt-1">
              {filteredRooms
                .filter(room => room.type === 'group')
                .map(room => (
                  <button
                    key={room.id}
                    className={cn(
                      "w-full flex items-center px-2 py-1.5 text-sm rounded-md",
                      activeRoom?.id === room.id 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    onClick={() => joinRoom(room.id)}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{room.name}</span>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensagens Diretas</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                setNewRoomType('direct');
                setShowNewRoomDialog(true);
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1 mt-1">
              {filteredRooms
                .filter(room => room.type === 'direct')
                .map(room => {
                  // Para DMs, mostrar o nome do outro usuário
                  const otherParticipant = (room as any).participants?.find((p: any) => 
                    p.userId !== user?.id
                  );
                  const otherUser = users.find(u => 
                    u.id === otherParticipant?.userId
                  );
                  
                  // Verificar status online
                  const isOnline = otherUser && onlineUsers.includes(otherUser.id);
                  
                  return (
                    <button
                      key={room.id}
                      className={cn(
                        "w-full flex items-center px-2 py-1.5 text-sm rounded-md",
                        activeRoom?.id === room.id 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => joinRoom(room.id)}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback>{otherUser?.username.charAt(0) || '?'}</AvatarFallback>
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
                    </button>
                  );
                })}
            </div>
          </div>
          
          <div className="px-2 mt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Usuários Online</h3>
            <div className="space-y-1">
              {users
                .filter(u => u.id !== user?.id && onlineUsers.includes(u.id))
                .map(u => (
                  <button
                    key={u.id}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleUserSelect(u)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-gray-900"></span>
                    </div>
                    <span className="truncate">{u.fullName || u.username}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Área do perfil do usuário */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">Online</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                <span>Notificações</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  // Componente principal de chat
  const ChatArea = () => (
    <div className={cn(
      "flex flex-col flex-1 h-full max-w-full overflow-hidden",
      isMobileView && !showChannelList ? "block" : (isMobileView ? "hidden" : "block")
    )}>
      {/* Cabeçalho da sala */}
      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          {isMobileView && (
            <Button variant="ghost" size="icon" className="mr-1 flex-shrink-0 h-8 w-8" onClick={() => setShowChannelList(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center min-w-0">
            {activeRoom?.type === 'group' ? (
              <Hash className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
            ) : (
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
            )}
            <h2 className="text-base sm:text-lg font-semibold truncate">{activeRoom?.name}</h2>
          </div>
        </div>
        
        {/* Botões de ação compactos para o cabeçalho */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Membros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificações</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Detalhes do canal</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">Sair do canal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Área de mensagens */}
      {activeRoom ? (
        <ScrollArea className="flex-1 p-4 overflow-x-hidden">
          <div className="space-y-4 pr-4">
            {messages.length === 0 ? (
              <div className="text-center p-8">
                <h3 className="text-lg font-medium">Início da conversa</h3>
                <p className="text-gray-500 mt-1">Envie uma mensagem para iniciar a conversa</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const sender = users.find(u => u.id === message.userId);
                const isCurrentUser = message.userId === user?.id;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHeader = !prevMessage || 
                  prevMessage.userId !== message.userId || 
                  (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000);
                
                const formattedDate = format(new Date(message.createdAt), 'HH:mm', { locale: ptBR });
                
                return (
                  <div key={message.id} className={cn(
                    "group",
                    showHeader ? "mt-6" : "mt-1"
                  )}>
                    {showHeader && (
                      <div className="flex items-center mb-1">
                        <Avatar 
                          className="h-8 w-8 mr-2 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(sender || null);
                            setShowUserInfo(true);
                          }}
                        >
                          <AvatarFallback>{sender?.username.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{sender?.fullName || sender?.username}</span>
                          <span className="text-gray-500 text-xs ml-2">{formattedDate}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "pl-10 group relative",
                      !showHeader && "pt-0.5"
                    )}>
                      <div className={cn(
                        "rounded-md px-1 py-0.5 group-hover:bg-gray-100 dark:group-hover:bg-gray-800",
                        !showHeader && "text-sm"
                      )}>
                        {message.type === 'file' ? (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2">
                            {message.fileUrl && (
                              message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="mb-1">
                                  <img 
                                    src={message.fileUrl} 
                                    alt="Anexo" 
                                    className="max-w-full max-h-96 rounded-md"
                                  />
                                </div>
                              ) : message.fileUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                                <div className="mb-1 flex items-center">
                                  <FileAudio className="h-5 w-5 mr-2 text-blue-500" />
                                  <audio controls src={message.fileUrl} className="max-w-full"></audio>
                                </div>
                              ) : (
                                <div className="mb-1 flex items-center">
                                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                                  <a 
                                    href={message.fileUrl} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Baixar arquivo
                                  </a>
                                </div>
                              )
                            )}
                            {message.content && (
                              <div className="text-sm">{message.content}</div>
                            )}
                          </div>
                        ) : (
                          <div>{renderMessageContent(message)}</div>
                        )}
                      </div>
                      
                      {/* Botões de ação na mensagem */}
                      <div className="absolute right-0 top-0 hidden group-hover:flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMessageToReply(message)}>
                          <Reply className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Smile className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setMessageToReply(message)}>
                              <Reply className="h-4 w-4 mr-2" />
                              <span>Responder</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              <span>Favoritar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Forward className="h-4 w-4 mr-2" />
                              <span>Encaminhar</span>
                            </DropdownMenuItem>
                            {isCurrentUser && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat</h3>
            <p className="text-gray-500 mb-6">Selecione um canal para iniciar a conversa</p>
            <Button onClick={() => setShowNewRoomDialog(true)}>
              Criar um novo canal
            </Button>
          </div>
        </div>
      )}
      
      {/* Área de digitação */}
      {activeRoom && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 overflow-hidden max-w-full">
          {messageToReply && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-2">
              <div className="flex-1 text-sm">
                <p className="font-medium">Respondendo a:</p>
                <p className="text-gray-500 truncate">{messageToReply.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMessageToReply(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Área de envio de mensagem completamente reestilizada para corrigir problemas de responsividade */}
          <div className="relative w-full border rounded-md focus-within:ring-1 focus-within:ring-primary overflow-hidden">
            {/* Botões de ação no topo - Barra de ferramentas */}
            <div className="w-full flex items-center px-2 py-1 border-b border-gray-200 dark:border-gray-800">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                multiple
                className="hidden"
              />
              <Button variant="ghost" size="sm" className="h-7 w-7" onClick={handleFileUpload}>
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 ml-1">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 sm:w-80">
                  {/* Seletor de emojis compacto */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Emojis frequentes
                    </p>
                    <div className="flex flex-wrap">
                      {["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😍"].map(emoji => (
                        <button 
                          key={emoji} 
                          className="p-1.5 text-lg hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          onClick={() => {
                            setMessageInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
              
            {/* Área de texto com caixa de mensagem e botão alinhados */}
            <div className="w-full flex flex-row items-end">
              <div className="flex-1 min-w-0">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enviar com Enter (sem Shift)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] max-h-[150px] resize-none border-0 w-full rounded-none focus:ring-0 px-3 py-2"
                />
              </div>
              
              {/* Botão de enviar com tamanho fixo */}
              <div className="flex-shrink-0 p-1 pr-2 pb-2">
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!messageInput.trim()}
                  size="sm"
                  className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Diálogo de criação de sala
  const CreateRoomDialog = () => (
    <Dialog open={showNewRoomDialog} onOpenChange={setShowNewRoomDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar novo {newRoomType === 'direct' ? 'chat direto' : 'canal'}</DialogTitle>
          <DialogDescription>
            {newRoomType === 'direct' 
              ? 'Selecione um usuário para iniciar uma conversa.' 
              : 'Informe os detalhes do novo canal.'}
          </DialogDescription>
        </DialogHeader>
        
        {newRoomType === 'group' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="room-name" className="text-sm font-medium">
                Nome do canal
              </label>
              <Input
                id="room-name"
                placeholder="Ex: geral, marketing, projetos..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Participantes
              </label>
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {users
                  .filter(u => u.id !== user?.id)
                  .map(u => (
                    <div 
                      key={u.id} 
                      className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        id={`user-${u.id}`}
                        checked={selectedParticipants.includes(u.id)}
                        onChange={() => {
                          setSelectedParticipants(prev => 
                            prev.includes(u.id)
                              ? prev.filter(id => id !== u.id)
                              : [...prev, u.id]
                          );
                        }}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`user-${u.id}`}
                        className="flex items-center cursor-pointer flex-1"
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{u.fullName || u.username}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {users
                .filter(u => u.id !== user?.id)
                .map(u => (
                  <div 
                    key={u.id} 
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedParticipants([u.id]);
                      setNewRoomName(`DM: ${user?.username} e ${u.username}`);
                      handleCreateRoom();
                    }}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.fullName || u.username}</p>
                      <p className="text-xs text-gray-500">{onlineUsers.includes(u.id) ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {newRoomType === 'group' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoomDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRoom}>Criar canal</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );

  // Diálogo de perfil do usuário
  const UserInfoDialog = () => (
    <Dialog open={showUserInfo} onOpenChange={setShowUserInfo}>
      <DialogContent className="sm:max-w-[425px]">
        {selectedUser && (
          <>
            <DialogHeader>
              <DialogTitle>Perfil do usuário</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {selectedUser.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="mt-4 text-xl font-bold">
                {selectedUser.fullName || selectedUser.username}
              </h3>
              
              <p className="text-sm text-gray-500 mt-1">
                @{selectedUser.username}
              </p>
              
              <div className="mt-2 flex items-center">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="w-full space-y-3">
                {selectedUser.email && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                
                {selectedUser.department && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Departamento:</span>
                    <span>{selectedUser.department}</span>
                  </div>
                )}
              </div>
              
              <Button 
                className="mt-6 w-full"
                onClick={() => {
                  setShowUserInfo(false);
                  handleUserSelect(selectedUser);
                }}
              >
                Enviar mensagem
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn("flex max-w-full overflow-hidden", height)}>
      <ChannelList />
      <ChatArea />
      <CreateRoomDialog />
      <UserInfoDialog />
    </div>
  );
}