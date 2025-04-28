import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChat, ChatRoom, ChatMessage, ChatUser } from '@/hooks/use-chat';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Image, File, UserPlus, Menu, X, MessageSquare } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";

interface ChatComponentProps {
  initialRoomId?: number;
  height?: string;
  embedded?: boolean;
}

export default function SocketIOChat({
  initialRoomId,
  height = 'h-[calc(100vh-4rem)]',
  embedded = false
}: ChatComponentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
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

  // Detectar se é mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Função para enviar mensagem
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput);
    setMessageInput('');
  };
  
  // Função para lidar com digitação
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };
  
  // Função para lidar com upload de arquivo
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Função para processar o arquivo selecionado
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Verificar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB",
        variant: "destructive"
      });
      return;
    }
    
    // Fazer upload
    uploadFile(file);
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Função para criar nova sala
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a sala",
        variant: "destructive"
      });
      return;
    }
    
    await createRoom(newRoomName, selectedParticipants);
    
    // Limpar formulário
    setNewRoomName('');
    setSelectedParticipants([]);
    setShowNewRoomDialog(false);
  };
  
  // Função para formatar data
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Verificar se um usuário está online
  const isUserOnline = (userId: number) => {
    return onlineUsers.includes(userId);
  };
  
  // Obter nome ou nome de usuário
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.fullName || user.username) : 'Usuário';
  };
  
  // Renderizar status de digitação
  const renderTypingStatus = () => {
    if (!activeRoom || !typingUsers.has(activeRoom.id)) return null;
    
    const typingUserIds = typingUsers.get(activeRoom.id) || [];
    if (typingUserIds.length === 0 || (typingUserIds.length === 1 && typingUserIds[0] === user?.id)) return null;
    
    const filteredTypingUsers = typingUserIds.filter(id => id !== user?.id);
    if (filteredTypingUsers.length === 0) return null;
    
    if (filteredTypingUsers.length === 1) {
      return (
        <div className="text-sm text-muted-foreground italic">
          {getUserName(filteredTypingUsers[0])} está digitando...
        </div>
      );
    }
    
    return (
      <div className="text-sm text-muted-foreground italic">
        {filteredTypingUsers.length} pessoas estão digitando...
      </div>
    );
  };
  
  // Renderizar mensagem de chat
  const renderChatMessage = (message: ChatMessage) => {
    const isSelf = message.userId === user?.id;
    const sender = message.sender || users.find(u => u.id === message.userId);
    const senderName = sender ? (sender.fullName || sender.username) : 'Usuário';
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex flex-col mb-2 max-w-[75%]",
          isSelf ? "self-end items-end" : "self-start items-start"
        )}
      >
        {!isSelf && (
          <div className="text-xs text-muted-foreground mb-1">{senderName}</div>
        )}
        
        {message.type === 'image' ? (
          <div className={cn(
            "rounded-lg overflow-hidden p-1 shadow-sm border",
            isSelf ? "bg-primary-foreground" : "bg-secondary"
          )}>
            <a href={message.content} target="_blank" rel="noopener noreferrer">
              <img 
                src={message.content} 
                className="max-w-full max-h-64 rounded" 
                alt="Imagem enviada"
              />
            </a>
          </div>
        ) : message.type === 'file' ? (
          <div className={cn(
            "flex items-center gap-2 rounded-lg p-3 shadow-sm border",
            isSelf ? "bg-primary-foreground" : "bg-secondary"
          )}>
            <File className="h-4 w-4" />
            <a 
              href={message.content} 
              className="text-blue-500 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Baixar arquivo
            </a>
          </div>
        ) : (
          <div className={cn(
            "rounded-lg p-3 shadow-sm",
            isSelf 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          )}>
            {message.content}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDate(message.createdAt)}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex", height, embedded ? "rounded-none" : "rounded-lg overflow-hidden border")}>
      {/* Salas de chat (desktop e mobile) */}
      {(!isMobile || (isMobile && mobileView === 'list')) && (
        <div className={cn(
          "flex flex-col border-r",
          isMobile ? "w-full" : "w-72"
        )}>
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chat</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewRoomDialog(true)}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>Nenhuma conversa disponível</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setShowNewRoomDialog(true)}
                >
                  Iniciar conversa
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                {rooms.map(room => (
                  <div
                    key={room.id}
                    className={cn(
                      "flex items-center p-3 hover:bg-muted cursor-pointer",
                      activeRoom?.id === room.id && "bg-muted"
                    )}
                    onClick={() => {
                      joinRoom(room.id);
                      if (isMobile) setMobileView('chat');
                    }}
                  >
                    <Avatar className="h-9 w-9 mr-2">
                      <AvatarFallback>
                        {room.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium truncate">{room.name}</p>
                        {room.unreadCount ? (
                          <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.lastMessage ? room.lastMessage.content : 'Nenhuma mensagem'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Área de chat (desktop e mobile) */}
      {(!isMobile || (isMobile && mobileView === 'chat')) && (
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              <div className="p-3 border-b flex justify-between items-center">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileView('list')}
                    className="mr-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <h3 className="text-lg font-semibold flex-1 truncate">{activeRoom.name}</h3>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Participantes
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Participantes</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      {users.map(chatUser => (
                        <div
                          key={chatUser.id}
                          className="flex items-center p-2 hover:bg-muted rounded-md"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {chatUser.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                            {chatUser.avatar && (
                              <AvatarImage src={chatUser.avatar} />
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{chatUser.fullName || chatUser.username}</p>
                            <p className="text-xs text-muted-foreground">{chatUser.email}</p>
                          </div>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            isUserOnline(chatUser.id) ? "bg-green-500" : "bg-gray-300"
                          )} />
                        </div>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center flex-col">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a enviar uma mensagem</p>
                  </div>
                ) : (
                  <>
                    {messages.map(renderChatMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              
              <div className="p-3 border-t">
                {renderTypingStatus()}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFileUpload}
                  >
                    <Image className="h-5 w-5" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelected}
                      className="hidden"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                    />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col p-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione uma conversa</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Ou inicie uma nova conversa clicando no botão no topo da lista
              </p>
              {isMobile && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setMobileView('list')}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Ver conversas
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Dialog para criar nova sala */}
      <Dialog open={showNewRoomDialog} onOpenChange={setShowNewRoomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Crie uma nova sala de chat para conversar com outros usuários.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="room-name" className="text-sm font-medium">
                Nome da conversa
              </label>
              <Input
                id="room-name"
                placeholder="Digite um nome para a conversa"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Participantes
              </label>
              <div className="grid gap-2">
                {users
                  .filter(u => u.id !== user?.id)
                  .map((chatUser) => (
                    <div
                      key={chatUser.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        id={`user-${chatUser.id}`}
                        checked={selectedParticipants.includes(chatUser.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants(prev => [...prev, chatUser.id]);
                          } else {
                            setSelectedParticipants(prev => prev.filter(id => id !== chatUser.id));
                          }
                        }}
                        className="h-4 w-4 rounded"
                      />
                      <label
                        htmlFor={`user-${chatUser.id}`}
                        className="flex items-center space-x-2 text-sm cursor-pointer"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {chatUser.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                          {chatUser.avatar && (
                            <AvatarImage src={chatUser.avatar} />
                          )}
                        </Avatar>
                        <span>{chatUser.fullName || chatUser.username}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoomDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRoom}>
              Criar conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}