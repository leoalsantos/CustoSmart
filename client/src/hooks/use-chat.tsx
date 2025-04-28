import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocketIO } from './use-socket-io';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Tipos
export interface ChatRoom {
  id: number;
  name: string;
  type: 'group' | 'direct';
  createdAt: Date;
  createdBy: number;
  unreadCount?: number;
  lastMessage?: ChatMessage;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  type: string;
  createdAt: Date;
  read: boolean;
  sender?: {
    id: number;
    username: string;
    fullName?: string;
  };
  fileUrl?: string;
  thumbnailUrl?: string;
}

export interface ChatUser {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  status?: string;
  department?: string;
  avatar?: string;
  profileImage?: string | null;
  statusMessage?: string;
  role?: string;
}

interface UseChatReturn {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  users: ChatUser[];
  onlineUsers: number[];
  loading: boolean;
  typingUsers: Map<number, number[]>;
  sendMessage: (content: string, type?: string) => Promise<void>;
  joinRoom: (roomId: number) => Promise<void>;
  leaveRoom: (roomId: number) => Promise<void>;
  createRoom: (name: string, participants: number[]) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  uploadFile: (file: File) => Promise<void>;
}

export function useChat(initialRoomId?: number): UseChatReturn {
  const { socket, connected } = useSocketIO();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado do chat
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<number, number[]>>(new Map());
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Carregar lista de salas
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/rooms');
      if (!response.ok) {
        throw new Error('Falha ao carregar salas de chat');
      }
      const data = await response.json();
      setRooms(data);
      
      // Se houver um ID de sala inicial, ativar automaticamente
      if (initialRoomId && !activeRoom) {
        const initialRoom = data.find((room: ChatRoom) => room.id === initialRoomId);
        if (initialRoom) {
          setActiveRoom(initialRoom);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as salas de chat",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [initialRoomId, activeRoom, toast]);
  
  // Carregar lista de usuários
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/users');
      if (!response.ok) {
        throw new Error('Falha ao carregar usuários');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);
  
  // Enviar mensagem para a sala ativa
  const sendMessage = useCallback(async (content: string, type: string = 'text') => {
    if (!socket || !connected || !activeRoom) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Verifique sua conexão.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar uma versão temporária da mensagem para exibir imediatamente
    const tempMessageId = Date.now(); // Usar timestamp como ID temporário
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      roomId: activeRoom.id,
      userId: (socket as any).auth?.userId,
      content,
      type,
      createdAt: new Date(),
      read: false
    };
    
    // Adicionar a mensagem temporária ao estado local
    setMessages(prev => [...prev, tempMessage]);
    
    socket.emit('sendMessage', {
      roomId: activeRoom.id,
      content,
      type
    });
    
    // Limpar estado de digitação
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
    }
  }, [socket, connected, activeRoom, toast]);
  
  // Juntar-se a uma sala
  const joinRoom = useCallback(async (roomId: number) => {
    if (!socket || !connected) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível entrar na sala. Verifique sua conexão.",
        variant: "destructive"
      });
      return;
    }
    
    // Sair da sala atual, se houver
    if (activeRoom && activeRoom.id !== roomId) {
      socket.emit('leaveRoom', { roomId: activeRoom.id });
    }
    
    // Encontrar a sala nos dados já carregados
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setActiveRoom(room);
      setMessages([]); // Limpar mensagens ao trocar de sala
      
      // Juntar-se à nova sala via Socket.IO
      socket.emit('joinRoom', { roomId });
    } else {
      toast({
        title: "Erro",
        description: "Sala não encontrada",
        variant: "destructive"
      });
    }
  }, [socket, connected, activeRoom, rooms, toast]);
  
  // Sair de uma sala
  const leaveRoom = useCallback(async (roomId: number) => {
    if (!socket || !connected) return;
    
    socket.emit('leaveRoom', { roomId });
    
    if (activeRoom && activeRoom.id === roomId) {
      setActiveRoom(null);
      setMessages([]);
    }
  }, [socket, connected, activeRoom]);
  
  // Criar uma nova sala
  const createRoom = useCallback(async (name: string, participants: number[]) => {
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          type: participants.length > 1 ? 'group' : 'direct',
          participants
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar sala');
      }
      
      const newRoom = await response.json();
      
      // Atualizar lista de salas
      setRooms(prevRooms => [...prevRooms, newRoom]);
      
      // Ativar a nova sala
      setActiveRoom(newRoom);
      
      // Juntar-se à nova sala
      if (socket && connected) {
        socket.emit('joinRoom', { roomId: newRoom.id });
      }
      
      toast({
        title: "Sucesso",
        description: "Sala criada com sucesso",
      });
      
      return newRoom;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sala",
        variant: "destructive"
      });
    }
  }, [socket, connected, toast]);
  
  // Indicar que o usuário está digitando
  const setTyping = useCallback((isTyping: boolean) => {
    if (!socket || !connected || !activeRoom) return;
    
    // Limpar timeout anterior, se existir
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Enviar status de digitação
    socket.emit('typing', {
      roomId: activeRoom.id,
      isTyping
    });
    
    // Se estiver digitando, configurar timeout para desativar após 3 segundos
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          roomId: activeRoom.id,
          isTyping: false
        });
        typingTimeoutRef.current = null;
      }, 3000);
    }
  }, [socket, connected, activeRoom]);
  
  // Upload de arquivo para o chat
  const uploadFile = useCallback(async (file: File) => {
    if (!socket || !connected || !activeRoom) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível enviar o arquivo. Verifique sua conexão.",
        variant: "destructive"
      });
      throw new Error("Não conectado a nenhuma sala de chat");
    }
    
    // Verificar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo excede o limite de 10MB. O tamanho atual é ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        variant: "destructive"
      });
      throw new Error(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    }
    
    // Feedback visual de início de upload
    toast({
      title: "Enviando arquivo...",
      description: `${file.name} (${(file.size / 1024).toFixed(2)}KB)`,
    });
    
    try {
      // Preparar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', activeRoom.id.toString());
      
      // Enviar arquivo via fetch com gestão de erros melhorada
      let response;
      try {
        // Adicionar um timeout mais longo para uploads (120 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        console.log(`Iniciando upload do arquivo: ${file.name} (${file.size} bytes), tipo: ${file.type}, para sala: ${activeRoom.id}`);
        
        response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',  // Use 'include' para garantir cookies de autenticação
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        console.log(`Resposta recebida: ${response.status} ${response.statusText}`);
      } catch (networkError: any) {
        console.error('Erro de rede:', networkError);
        if (networkError.name === 'AbortError') {
          throw new Error('A requisição demorou muito tempo. Tente novamente com um arquivo menor.');
        } else {
          throw new Error(`Falha de conexão ao enviar arquivo: ${networkError.message}`);
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resposta de erro:', response.status, errorData);
        throw new Error(
          errorData.message || 
          `Falha ao enviar arquivo (${response.status}: ${response.statusText})`
        );
      }
      
      const uploadData = await response.json();
      
      if (!uploadData || !uploadData.fileUrl) {
        throw new Error('Resposta do servidor inválida');
      }
      
      // Enviar mensagem com referência ao arquivo
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      await sendMessage(uploadData.fileUrl, messageType);
      
      // Feedback de sucesso
      toast({
        title: "Arquivo enviado",
        description: `${file.name} foi enviado com sucesso`,
      });
      
      return uploadData;
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  }, [socket, connected, activeRoom, sendMessage, toast]);
  
  // Configurar eventos de Socket.IO
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Receber usuários online
    socket.on('onlineUsers', ({ userIds }) => {
      setOnlineUsers(userIds);
    });
    
    // Receber histórico de mensagens
    socket.on('roomHistory', ({ roomId, messages: roomMessages }) => {
      // Apenas atualizar se for a sala ativa
      if (activeRoom && activeRoom.id === roomId) {
        // Ordenar mensagens por data
        const sortedMessages = roomMessages.sort((a: ChatMessage, b: ChatMessage) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
        
        setMessages(sortedMessages);
      }
    });
    
    // Receber novas mensagens
    socket.on('newMessage', (message: ChatMessage) => {
      // Se for da sala ativa, adicionar à lista
      if (activeRoom && activeRoom.id === message.roomId) {
        setMessages(prev => [...prev, message]);
      }
      
      // Atualizar lista de salas para refletir nova mensagem
      setRooms(prev => prev.map(room => {
        if (room.id === message.roomId) {
          return {
            ...room,
            lastMessage: message,
            // Incrementar contador de não lidas se não for a sala ativa
            unreadCount: (activeRoom && activeRoom.id === room.id) 
              ? 0 
              : ((room.unreadCount || 0) + 1)
          };
        }
        return room;
      }));
    });
    
    // Receber status de digitação
    socket.on('userTyping', ({ roomId, users: userIds }) => {
      if (activeRoom && activeRoom.id === roomId) {
        const newTypingUsers = new Map(typingUsers);
        newTypingUsers.set(roomId, userIds);
        setTypingUsers(newTypingUsers);
      }
    });
    
    // Notificação de sala excluída
    socket.on('roomDeleted', ({ roomId }) => {
      console.log(`Sala ${roomId} foi excluída`);
      
      // Remover a sala da lista
      setRooms(prev => prev.filter(room => room.id !== roomId));
      
      // Se for a sala ativa, limpar
      if (activeRoom && activeRoom.id === roomId) {
        setActiveRoom(null);
        setMessages([]);
        
        toast({
          title: "Sala excluída",
          description: "A sala de chat foi excluída com sucesso.",
        });
      }
    });
    
    // Confirmação de exclusão de sala bem-sucedida
    socket.on('roomDeleteSuccess', ({ roomId }) => {
      console.log(`Sala ${roomId} excluída com sucesso`);
      toast({
        title: "Sucesso",
        description: "Sala excluída com sucesso",
      });
      
      // Atualização da lista será feita pelo evento roomDeleted
    });
    
    // Limpar eventos ao desmontar
    return () => {
      socket.off('onlineUsers');
      socket.off('roomHistory');
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('roomDeleted');
      socket.off('roomDeleteSuccess');
    };
  }, [socket, connected, activeRoom, typingUsers, toast]);
  
  // Inicializar
  useEffect(() => {
    if (connected && user) {
      // Carregar dados iniciais
      fetchRooms();
      fetchUsers();
    }
  }, [connected, user, fetchRooms, fetchUsers]);
  
  // Se houver ID de sala inicial e as salas forem carregadas, juntar-se à sala
  useEffect(() => {
    if (initialRoomId && rooms.length > 0 && connected && !activeRoom) {
      const room = rooms.find(r => r.id === initialRoomId);
      if (room) {
        joinRoom(initialRoomId);
      }
    }
  }, [initialRoomId, rooms, connected, activeRoom, joinRoom]);
  
  // Excluir sala de chat
  const deleteRoom = useCallback(async (roomId: number) => {
    if (!socket || !connected) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível excluir a sala. Verifique sua conexão.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Confirmar exclusão
      if (!window.confirm("Tem certeza que deseja excluir esta sala de chat? Esta ação não pode ser desfeita.")) {
        return;
      }
      
      console.log(`Enviando solicitação para excluir sala ${roomId}`);
      
      // Usar o socket para excluir a sala
      socket.emit('deleteRoom', { roomId });
      
      // Evento de exclusão bem-sucedida será tratado pelo listener roomDeleteSuccess
      
      toast({
        title: "Solicitação enviada",
        description: "Solicitação de exclusão da sala enviada. Aguarde...",
      });
    } catch (error) {
      console.error('Erro ao excluir sala:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sala",
        variant: "destructive"
      });
    }
  }, [socket, connected, toast]);

  return {
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
    deleteRoom,
    setTyping,
    uploadFile
  };
}