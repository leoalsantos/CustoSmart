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
  MoreVertical, MoreHorizontal, Edit, Trash, Trash2, Forward, Star, 
  Reply, ChevronDown, Hash, Lock, User, Search,
  Volume2, Bell, BellOff, Users, UserPlus, Settings,
  Menu, ChevronRight, Clock, ArrowRight, ArrowUp, ArrowDown, FileText, X,
  Image as ImageIcon, FileAudio, ChevronLeft, Archive, Info,
  CornerUpRight, File as FileIcon, MessageSquare
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
  height = 'h-screen',
  embedded = false
}: ChatComponentProps): React.ReactNode {
  // Forçar o corpo da página a ter altura completa
  useEffect(() => {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);
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
  const [inChatSearchTerm, setInChatSearchTerm] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userStatus, setUserStatus] = useState('online');
  const [userStatusMessage, setUserStatusMessage] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'directs'>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
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
    leaveRoom,
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

  // Filtrar salas com base na pesquisa e no filtro ativo
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo
    if (activeFilter === 'all') {
      return matchesSearch;
    } else if (activeFilter === 'groups') {
      return matchesSearch && room.type === 'group';
    } else if (activeFilter === 'directs') {
      return matchesSearch && room.type === 'direct';
    }
    
    return matchesSearch;
  });

  // Scroll para a última mensagem sempre que mensagens são atualizadas
  useEffect(() => {
    // Usando setTimeout para garantir que o scroll aconteça após a renderização
    const scrollTimeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [messages]);
  
  // Scroll para a última mensagem quando a sala muda
  useEffect(() => {
    if (activeRoom) {
      const scrollTimeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [activeRoom]);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      if (messageToReply) {
        // Enviar mensagem com metadados de resposta
        // Formato: original_message|message_id|quoted_content
        const quotedContent = messageToReply.content.length > 100 
          ? messageToReply.content.substring(0, 100) + '...' 
          : messageToReply.content;
          
        const replyContent = `${messageInput}\n> Em resposta a: ${quotedContent} [MSG_ID:${messageToReply.id}]`;
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
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Evitar propagação do evento
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Adicionar os arquivos à lista de anexos pendentes
    const fileArray = Array.from(files);
    setPendingAttachments(prev => [...prev, ...fileArray]);
    
    // Limpar seleção de arquivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: files.length > 1 ? "Arquivos anexados" : "Arquivo anexado",
      description: "Escreva sua mensagem e clique em enviar para incluir os anexos.",
    });
  };
  
  // Função para remover um anexo pendente
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Função para enviar mensagem e arquivos pendentes
  const handleSendMessageWithAttachments = async () => {
    if (!messageInput.trim() && pendingAttachments.length === 0) return;
    
    try {
      // Primeiro enviar qualquer mensagem de texto
      if (messageInput.trim()) {
        if (messageToReply) {
          // Enviar mensagem com metadados de resposta
          const quotedContent = messageToReply.content.length > 100 
            ? messageToReply.content.substring(0, 100) + '...' 
            : messageToReply.content;
            
          const replyContent = `${messageInput}\n> Em resposta a: ${quotedContent} [MSG_ID:${messageToReply.id}]`;
          await sendMessage(replyContent);
        } else {
          await sendMessage(messageInput);
        }
      }
      
      // Depois enviar cada arquivo pendente
      for (const file of pendingAttachments) {
        await uploadFile(file);
      }
      
      // Limpar estado após envio bem-sucedido
      setMessageInput('');
      setMessageToReply(null);
      setPendingAttachments([]);
      
      if (pendingAttachments.length > 0) {
        toast({
          title: pendingAttachments.length > 1 ? "Arquivos enviados" : "Arquivo enviado",
          description: pendingAttachments.length > 1 
            ? `${pendingAttachments.length} arquivos foram enviados com sucesso` 
            : "O arquivo foi enviado com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem ou arquivos:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem ou arquivos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para criar uma nova sala
  const handleCreateRoom = async () => {
    // Validar nome da sala apenas para salas de grupo, não para diretas
    if (newRoomType === 'group' && !newRoomName.trim()) {
      toast({
        title: "Nome da sala obrigatório",
        description: "Por favor, informe um nome para a sala.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Para mensagens diretas, verificar se já existe conversa com o usuário selecionado
      if (newRoomType === 'direct' && selectedParticipants.length === 1) {
        const participantId = selectedParticipants[0];
        
        // Verificar se já existe uma sala direta com este usuário
        const existingDM = rooms.find(room => 
          room.type === 'direct' && 
          (room as any).participants?.some((p: any) => p.userId === participantId)
        );
        
        if (existingDM) {
          // Se já existe, apenas entrar nela
          setShowNewRoomDialog(false);
          setNewRoomName('');
          setSelectedParticipants([]);
          
          // Acessar a sala existente
          await joinRoom(existingDM.id);
          
          // Notificar o usuário
          toast({
            title: "Conversa existente",
            description: `Você já tem uma conversa com este usuário.`,
          });
          
          return;
        }
      }
      
      // Se não existe sala ou é um canal de grupo, criar normalmente
      await createRoom(newRoomName, selectedParticipants);
      
      // Sempre fechar o diálogo após tentar criar a sala, sucesso ou erro
      setShowNewRoomDialog(false);
      setNewRoomName('');
      setSelectedParticipants([]);
      
      toast({
        title: newRoomType === 'group' ? "Canal criado" : "Conversa iniciada",
        description: newRoomType === 'group' 
          ? `O canal "${newRoomName}" foi criado com sucesso.` 
          : `A conversa foi iniciada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast({
        title: newRoomType === 'group' ? "Erro ao criar canal" : "Erro ao iniciar conversa",
        description: "Não foi possível completar a operação. Tente novamente.",
        variant: "destructive"
      });
      // Fechar o diálogo mesmo em caso de erro
      setShowNewRoomDialog(false);
    }
  };

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
        
        // Feedback para o usuário
        toast({
          title: "Conversa existente",
          description: `Você já tem uma conversa com ${selectedUser.fullName || selectedUser.username}`,
        });
      } else {
        // Se não existe, criar uma nova sala
        const dmName = `DM: ${user?.username} e ${selectedUser.username}`;
        // O createRoom espera apenas nome e participantes
        await createRoom(dmName, [selectedUser.id]);
        
        // Feedback para o usuário
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

  // Função para rolar até a mensagem referenciada
  const scrollToMessage = (messageId: number) => {
    // Encontrar o elemento da mensagem pelo seu ID
    const messageElement = document.getElementById(`message-${messageId}`);
    
    if (messageElement) {
      // Adicionar destaque temporário
      messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900', 'transition-colors');
      
      // Rolar para a mensagem
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Remover destaque após alguns segundos
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900', 'transition-colors');
      }, 2000);
      
      // Feedback
      toast({
        title: "Mensagem localizada",
        description: "Rolando para a mensagem original."
      });
    } else {
      // Se a mensagem não for encontrada
      toast({
        title: "Mensagem não encontrada",
        description: "A mensagem original pode ter sido removida ou não está carregada.",
        variant: "destructive"
      });
    }
  };

  // Funções para navegação entre resultados de pesquisa
  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    // Remover os destaques existentes
    removeSearchHighlights();
    
    // Calcular o próximo índice, com rotação circular
    const nextIndex = (currentSearchResultIndex + 1) % searchResults.length;
    setCurrentSearchResultIndex(nextIndex);
    
    // Encontrar e destacar a mensagem
    highlightAndScrollToMessage(searchResults[nextIndex]);
  };
  
  const handlePreviousSearchResult = () => {
    if (searchResults.length === 0) return;
    
    // Remover os destaques existentes
    removeSearchHighlights();
    
    // Calcular o índice anterior, com rotação circular
    const prevIndex = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchResultIndex(prevIndex);
    
    // Encontrar e destacar a mensagem
    highlightAndScrollToMessage(searchResults[prevIndex]);
  };
  
  const removeSearchHighlights = () => {
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.classList.remove('search-highlight', 'bg-yellow-200', 'dark:bg-yellow-800');
    });
  };
  
  const highlightAndScrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (!messageElement) return;
    
    // Destacar visualmente a mensagem
    messageElement.classList.add('search-highlight', 'bg-yellow-200', 'dark:bg-yellow-800');
    
    // Rolar até a mensagem
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Opcional: destacar o texto encontrado dentro da mensagem
    if (inChatSearchTerm.trim()) {
      const contentElement = messageElement.querySelector('.message-content');
      if (contentElement) {
        const text = contentElement.innerHTML;
        const regex = new RegExp(`(${inChatSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        contentElement.innerHTML = text.replace(regex, '<span class="bg-yellow-300 dark:bg-yellow-700">$1</span>');
      }
    }
  };
  
  // Renderizar mensagem com formatação
  const renderMessageContent = (message: ChatMessage) => {
    // Caso especial para mensagens de resposta
    if (message.content.includes('> Em resposta a:')) {
      const [mainContent, replyContentFull] = message.content.split('\n> Em resposta a:');
      
      // Extrair ID da mensagem, se presente
      const msgIdMatch = replyContentFull.match(/\[MSG_ID:(\d+)\]/);
      const messageId = msgIdMatch ? parseInt(msgIdMatch[1]) : null;
      
      // Remover o ID da mensagem do conteúdo exibido
      const replyContent = msgIdMatch 
        ? replyContentFull.replace(msgIdMatch[0], '') 
        : replyContentFull;
      
      return (
        <div>
          <div 
            className={cn(
              "flex items-center mb-1 text-sm italic bg-gray-100 dark:bg-gray-800 p-1 rounded border-l-2 border-primary",
              messageId ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" : ""
            )}
            onClick={() => messageId && scrollToMessage(messageId)}
          >
            {messageId && (
              <CornerUpRight className="h-3 w-3 mr-1 text-primary flex-shrink-0" />
            )}
            <div className="flex-1">{replyContent}</div>
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
      "border-r border-gray-200 dark:border-gray-800 flex flex-col h-full",
      isMobileView ? (showChannelList ? "w-full" : "hidden") : "w-64 flex-shrink-0"
    )}>
      {/* Header com perfil do usuário no canto superior direito */}
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
          
          {/* Área de perfil do usuário movida para o topo direito */}
          <div className="flex items-center">
            {isMobileView && activeRoom && (
              <Button variant="ghost" size="icon" onClick={() => setShowChannelList(false)} className="mr-1">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 flex items-center gap-2 px-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {!isMobileView && (
                    <span className="text-sm font-medium truncate max-w-[80px]">{user?.fullName || user?.username}</span>
                  )}
                  <MoreVertical className="h-4 w-4" />
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
        
        {/* Barra de pesquisa */}
        <div className="relative mb-2">
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
        </div>
        
        {/* Filtros de conversas */}
        <div className="flex space-x-1 mb-2">
          <Button 
            variant={activeFilter === 'all' ? "default" : "ghost"} 
            size="sm" 
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter('all')}
          >
            Todas
          </Button>
          <Button 
            variant={activeFilter === 'groups' ? "default" : "ghost"} 
            size="sm" 
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter('groups')}
          >
            Grupos
          </Button>
          <Button 
            variant={activeFilter === 'directs' ? "default" : "ghost"} 
            size="sm" 
            className="flex-1 text-xs h-8"
            onClick={() => setActiveFilter('directs')}
          >
            Diretas
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Mostrar a seção de canais apenas se o filtro for "todos" ou "grupos" */}
          {(activeFilter === 'all' || activeFilter === 'groups') && (
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
                
                {/* Removida exibição de "nenhum canal encontrado" */}
              </div>
            </div>
          )}
          
          {/* Mostrar a seção de mensagens diretas apenas se o filtro for "todos" ou "diretas" */}
          {(activeFilter === 'all' || activeFilter === 'directs') && (
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
                      <div 
                        key={room.id}
                        className={cn(
                          "group w-full flex items-center px-2 py-1.5 text-sm rounded-md",
                          activeRoom?.id === room.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                      <button
                        className="flex items-center flex-1 min-w-0"
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
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 ${isMobileView ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            toast({
                              title: "Detalhes",
                              description: "Visualizando detalhes da conversa",
                            });
                          }}>
                            <Info className="h-4 w-4 mr-2" />
                            <span>Detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            toast({
                              title: "Silenciado",
                              description: "Notificações silenciadas para esta conversa",
                            });
                          }}>
                            <Bell className="h-4 w-4 mr-2" />
                            <span>Silenciar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            toast({
                              title: "Arquivado",
                              description: "Esta conversa foi arquivada",
                            });
                          }}>
                            <Archive className="h-4 w-4 mr-2" />
                            <span>Arquivar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta conversa?")) {
                                toast({
                                  title: "Conversa excluída",
                                  description: "A conversa foi removida com sucesso",
                                });
                              }
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            <span>Excluir conversa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                
                {/* Removida exibição de "nenhuma conversa direta encontrada" */}
              </div>
            </div>
          )}
          
          {/* Seção de usuários online */}
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
              
              {users.filter(u => u.id !== user?.id && onlineUsers.includes(u.id)).length === 0 && (
                <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhum usuário online no momento
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Área de status e ajuda */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Preferências</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações do chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            {/* Botão de menu e voltar para mobile ou botão de sair para desktop */}
            {isMobileView ? (
              <div className="flex">
                <Button variant="ghost" size="icon" className="mr-1 flex-shrink-0 h-8 w-8" onClick={() => setShowChannelList(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-1 flex-shrink-0 h-8 w-8" 
                  onClick={() => {
                    // Voltar para o menu principal em dispositivos móveis
                    leaveRoom(activeRoom?.id || 0);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-1 flex-shrink-0 h-8 w-8" 
                      onClick={() => {
                        // Usando leaveRoom() em vez de setActiveRoom()
                        leaveRoom(activeRoom?.id || 0);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair da conversa</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShowChatSearch(!showChatSearch)}>
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pesquisar neste chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
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
                <DropdownMenuItem>Silenciar notificações</DropdownMenuItem>
                <DropdownMenuItem>Arquivar conversa</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">Sair do canal</DropdownMenuItem>
                {activeRoom?.type === 'group' && (
                  <DropdownMenuItem className="text-red-500">Excluir canal</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Barra de pesquisa dentro do chat atual com navegação */}
        {showChatSearch && (
          <div className="mt-2 relative">
            <div className="flex">
              <div className="relative flex-1">
                <Input
                  placeholder="Pesquisar nesta conversa..."
                  value={inChatSearchTerm}
                  onChange={(e) => {
                    const newSearchTerm = e.target.value;
                    setInChatSearchTerm(newSearchTerm);
                    
                    // Lógica de pesquisa - procurar o termo nas mensagens atuais
                    if (newSearchTerm.trim().length > 0) {
                      const results: number[] = [];
                      
                      messages.forEach((message, index) => {
                        if (message.content.toLowerCase().includes(newSearchTerm.toLowerCase())) {
                          results.push(message.id);
                        }
                      });
                      
                      setSearchResults(results);
                      // Resetar o índice ou ajustar para o último resultado
                      setCurrentSearchResultIndex(results.length > 0 ? 0 : -1);
                    } else {
                      // Limpar resultados quando a pesquisa estiver vazia
                      setSearchResults([]);
                      setCurrentSearchResultIndex(-1);
                    }
                  }}
                  className="pr-8 w-full pl-8"
                  onKeyDown={(e) => {
                    // Navegar entre resultados com Enter
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        // Shift+Enter - resultado anterior
                        handlePreviousSearchResult();
                      } else {
                        // Enter - próximo resultado
                        handleNextSearchResult();
                      }
                    }
                  }}
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              
              <div className="flex ml-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9"
                        disabled={searchResults.length === 0}
                        onClick={handlePreviousSearchResult}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Resultado anterior (Shift+Enter)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 ml-1"
                        disabled={searchResults.length === 0}
                        onClick={handleNextSearchResult}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Próximo resultado (Enter)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 ml-1"
                        onClick={() => {
                          setShowChatSearch(false);
                          setInChatSearchTerm('');
                          setSearchResults([]);
                          setCurrentSearchResultIndex(-1);
                          
                          // Remover os destaques de pesquisa
                          document.querySelectorAll('.search-highlight').forEach(el => {
                            el.classList.remove('search-highlight', 'bg-yellow-200', 'dark:bg-yellow-800');
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Fechar pesquisa</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {inChatSearchTerm && (
              <div className="absolute right-2 -bottom-5 text-xs text-gray-500">
                {searchResults.length > 0 ? (
                  <span>
                    {currentSearchResultIndex + 1} de {searchResults.length} resultados
                  </span>
                ) : (
                  <span>Nenhum resultado encontrado</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Área de mensagens */}
      {activeRoom ? (
        <ScrollArea className="flex-1 p-4 overflow-x-hidden h-full">
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
                  <div 
                    key={message.id} 
                    id={`message-${message.id}`}
                    className={cn(
                      "group transition-colors duration-500",
                      showHeader ? "mt-6" : "mt-1"
                    )}
                  >
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
                          <span className="font-medium">
                            {sender?.id === user?.id ? 'Você' : (sender?.fullName || sender?.username)}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">{formattedDate}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "pl-10 group relative flex",
                      !showHeader && "pt-0.5"
                    )}>
                      {/* Botões de ação à esquerda da mensagem */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-9 hidden group-hover:flex flex-col gap-1 items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMessageToReply(message)}>
                          <Reply className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => {
                              toast({
                                title: "Mensagem arquivada",
                                description: "A mensagem foi arquivada com sucesso",
                              });
                            }}>
                              <Archive className="h-4 w-4 mr-2" />
                              <span>Arquivar</span>
                            </DropdownMenuItem>
                            {isCurrentUser && (
                              <DropdownMenuItem className="text-red-500" onClick={() => {
                                toast({
                                  title: "Mensagem excluída",
                                  description: "A mensagem foi excluída com sucesso",
                                });
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className={cn(
                        "rounded-md px-1 py-0.5 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 w-full",
                        !showHeader && "text-sm"
                      )}>
                        {message.type === 'image' ? (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2">
                            {message.fileUrl && (
                              <div>
                                <div className="mb-1 relative">
                                  <img 
                                    src={message.fileUrl} 
                                    alt="Imagem" 
                                    className="max-w-full max-h-[250px] rounded-md object-contain cursor-pointer"
                                    onClick={() => {
                                      // Abrir em nova aba para visualização completa
                                      window.open(message.fileUrl, '_blank');
                                    }}
                                  />
                                  <div className="absolute bottom-2 right-2">
                                    <Button 
                                      variant="secondary" 
                                      size="icon" 
                                      className="h-7 w-7 rounded-full bg-white/80 hover:bg-white shadow-sm"
                                      onClick={() => {
                                        window.open(message.fileUrl, '_blank');
                                      }}
                                    >
                                      <ArrowUp className="h-3.5 w-3.5 rotate-45" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 message-content">
                                  {message.content}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : message.type === 'file' ? (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2">
                            {message.fileUrl && (
                              message.fileUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                                <div className="mb-1 flex flex-col">
                                  <div className="flex items-center">
                                    <FileAudio className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm font-medium truncate mb-1 mr-2 message-content">
                                      {message.content ? message.content.split('\n')[0] : 'Arquivo de áudio'}
                                    </span>
                                  </div>
                                  <audio 
                                    controls 
                                    src={message.fileUrl} 
                                    className="max-w-full w-full mt-1"
                                    preload="metadata"
                                  ></audio>
                                </div>
                              ) : (
                                <div className="mb-1">
                                  <div className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate message-content">
                                        {message.content ? message.content.split('\n')[0] : 'Arquivo'}
                                      </div>
                                      <a 
                                        href={message.fileUrl} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline text-xs"
                                      >
                                        Baixar arquivo
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                            {message.content && message.content.includes('\n') && (
                              <div className="text-sm mt-1 text-gray-700 dark:text-gray-300 message-content">
                                {message.content.split('\n').slice(1).join('\n')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="break-words whitespace-pre-line message-content">
                            {renderMessageContent(message)}
                          </div>
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
            <p className="text-gray-500 mb-6">Selecione uma conversa no menu lateral para começar</p>
            <div className="flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-gray-400" />
            </div>
          </div>
        </div>
      )}
      
      {/* Área de digitação - fixa na parte inferior e ocupando toda a largura */}
      {activeRoom && (
        <div className="px-0 border-t border-gray-200 dark:border-gray-800 w-full max-w-full fixed bottom-0 left-0 right-0 bg-background z-20">
          {messageToReply && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md mx-2 mt-2">
              <div className="flex-1 text-sm">
                <p className="font-medium">Respondendo a:</p>
                <p className="text-gray-500 truncate">{messageToReply.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMessageToReply(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Área de envio de mensagem ocupando toda a largura e fixa na parte inferior */}
          <div className="chat-input-container relative w-full py-2 px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10 sticky bottom-0">
            <div className="w-full flex items-center">
              {/* Área para exibir anexos pendentes acima do campo de texto */}
              {pendingAttachments.length > 0 && (
                <div className="absolute -top-20 left-0 right-0 bg-white dark:bg-gray-900 p-2 border-t border-gray-200 dark:border-gray-800 max-h-[80px] overflow-y-auto flex flex-wrap gap-2">
                  {pendingAttachments.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div 
                        key={index} 
                        className="bg-gray-100 dark:bg-gray-800 rounded-md flex items-center p-1 pr-2 group relative"
                      >
                        {isImage ? (
                          <div className="w-8 h-8 mr-1 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="preview" 
                              className="w-full h-full object-cover"
                              onLoad={(e) => {
                                // Liberar URL para evitar memory leak
                                setTimeout(() => URL.revokeObjectURL((e.target as HTMLImageElement).src), 1000);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 mr-1 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                            <FileIcon className="h-4 w-4" />
                          </div>
                        )}
                        <span className="text-xs truncate max-w-[100px]">{file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}</span>
                        <button 
                          className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full h-5 w-5 flex items-center justify-center"
                          onClick={() => removePendingAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Botão de anexo no lado esquerdo */}
              <div className="flex-shrink-0 mr-2">
                {/* Input de arquivo oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  multiple
                  className="hidden"
                  accept="image/*,audio/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                />
                
                {/* Botão de anexo */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 rounded-full" 
                  onClick={handleFileUpload}
                  type="button"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Caixa de texto preenchendo todo o espaço entre os botões */}
              <div className="flex-1 relative">
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    // Ajusta a altura conforme o conteúdo
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    
                    // Sinalizar que o usuário está digitando
                    setTyping(true);
                  }}
                  style={{ resize: 'none' }}
                  onFocus={(e) => {
                    // Scroll para a última mensagem após um pequeno delay
                    // para garantir que o teclado virtual já apareceu
                    if (isMobileView) {
                      setTimeout(() => {
                        // Garantir que o foco continua no textarea
                        e.target.focus();
                        // Rolar para a última mensagem
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    } else {
                      // Em desktop, apenas rolar para a última mensagem
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Enviar com Enter (sem Shift)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevenir quebra de linha
                      handleSendMessageWithAttachments();
                    }
                  }}
                  className="min-h-[40px] max-h-[100px] w-full resize-none bg-gray-100 dark:bg-gray-800 rounded-full py-2 px-4 focus:outline-none"
                />
              </div>
              
              {/* Botão de enviar no lado direito */}
              <div className="flex-shrink-0 ml-2">
                <Button 
                  onClick={handleSendMessageWithAttachments} 
                  disabled={!messageInput.trim() && pendingAttachments.length === 0}
                  size="icon"
                  type="button"
                  variant={messageInput.trim() || pendingAttachments.length > 0 ? "default" : "ghost"}
                  className="h-10 w-10 rounded-full"
                >
                  <Send className="h-5 w-5" />
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
              
              {/* Barra de pesquisa de usuários */}
              <div className="relative mb-2">
                <Input
                  placeholder="Buscar usuários..."
                  value={userSearchTerm || ''}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pr-8"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {users
                  .filter(u => u.id !== user?.id)
                  .filter(u => 
                    !userSearchTerm || 
                    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  )
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
                
                {users
                  .filter(u => u.id !== user?.id)
                  .filter(u => 
                    !userSearchTerm || 
                    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Nenhum usuário encontrado
                    </div>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Barra de pesquisa de usuários para mensagens diretas */}
            <div className="relative mb-2">
              <Input
                placeholder="Buscar usuários..."
                value={userSearchTerm || ''}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {users
                .filter(u => u.id !== user?.id)
                .filter(u => 
                  !userSearchTerm || 
                  u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()))
                )
                .map(u => (
                  <div 
                    key={u.id} 
                    className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      // Primeiro fechamos o modal para evitar o piscar
                      setShowNewRoomDialog(false);
                      // Depois processamos a ação com um pequeno atraso para garantir
                      // que o modal já esteja fechado, evitando conflitos de UI
                      setTimeout(() => {
                        handleUserSelect(u);
                      }, 100);
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
              
              {users
                .filter(u => u.id !== user?.id)
                .filter(u => 
                  !userSearchTerm || 
                  u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()))
                ).length === 0 && (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado
                  </div>
                )}
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
              <DialogDescription>
                Informações detalhadas sobre {selectedUser.fullName || selectedUser.username}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl">
                    {selectedUser.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Indicador de status */}
                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <div 
                    className={cn(
                      "h-4 w-4 rounded-full", 
                      onlineUsers.includes(selectedUser.id) 
                        ? "bg-green-500" 
                        : "bg-gray-400"
                    )}
                  />
                </div>
              </div>
              
              <h3 className="mt-4 text-xl font-bold">
                {selectedUser.fullName || selectedUser.username}
              </h3>
              
              <p className="text-sm text-gray-500 mt-1">
                @{selectedUser.username}
              </p>
              
              {/* Status customizável */}
              <div className="mt-3 flex items-center">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  onlineUsers.includes(selectedUser.id) 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                )}>
                  {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                </span>
                
                {selectedUser.id === user?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-6 text-xs"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Definir status
                  </Button>
                )}
              </div>
              
              {/* Status message - simulado por enquanto */}
              {userStatusMessage && selectedUser.id === user?.id && (
                <p className="text-sm italic mt-1">{userStatusMessage}</p>
              )}
              
              <Separator className="my-4" />
              
              <div className="w-full space-y-3">
                {/* Informações do usuário disponíveis no tipo ChatUser */}
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Username:</span>
                  <span>@{selectedUser.username}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Nome:</span>
                  <span>{selectedUser.fullName || 'Não definido'}</span>
                </div>
                
                {selectedUser.email && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                
                {/* Estas informações seriam preenchidas quando integradas com o sistema */}
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Departamento:</span>
                  <span>{(selectedUser as any).department || 'Não definido'}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">Status:</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs font-medium",
                    onlineUsers.includes(selectedUser.id) 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  )}>
                    {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              
              {selectedUser.id !== user?.id && (
                <Button 
                  className="mt-6 w-full"
                  onClick={() => {
                    setShowUserInfo(false);
                    handleUserSelect(selectedUser);
                  }}
                >
                  Enviar mensagem
                </Button>
              )}
              
              {selectedUser.id === user?.id && (
                <Button 
                  className="mt-6 w-full"
                  variant="outline"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Editar perfil
                </Button>
              )}
            </div>
            
            {/* Dialog para edição de perfil */}
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar perfil</DialogTitle>
                  <DialogDescription>
                    Atualize suas informações e status.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex space-x-2">
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={userStatus}
                        onChange={(e) => setUserStatus(e.target.value)}
                      >
                        <option value="online">Online</option>
                        <option value="away">Ausente</option>
                        <option value="busy">Ocupado</option>
                        <option value="offline">Invisível</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem de status</label>
                    <Input
                      placeholder="Ex: Em reunião, Disponível..."
                      value={userStatusMessage}
                      onChange={(e) => setUserStatusMessage(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Foto de perfil</label>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button size="sm" variant="outline">
                        Alterar foto
                      </Button>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                  <Button>Salvar alterações</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex w-screen h-screen max-w-full overflow-hidden fixed top-0 left-0 right-0 bottom-0">
      <ChannelList />
      <ChatArea />
      <CreateRoomDialog />
      <UserInfoDialog />
    </div>
  );
}