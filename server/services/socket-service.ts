import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { IStorage } from '../storage';

export interface SocketService {
  emitToUser(userId: number, event: string, data: any): void;
  emitToAll(event: string, data: any): void;
  emitToRoom(roomId: number, event: string, data: any): void;
}

/**
 * Inicializa o serviço Socket.IO para o chat
 */
export function initSocketService(httpServer: HTTPServer, storage: IStorage): SocketService {
  const io = new SocketServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://custosmart.replit.app' 
        : ['http://localhost:5000', 'http://127.0.0.1:5000', 'https://custosmart.replit.app'],
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000, // 60 segundos
    pingInterval: 25000 // 25 segundos
  });

  // Mapa para armazenar usuários conectados
  const connectedUsers = new Map<number, string[]>(); // userId -> socketIds[]
  
  // Mapa para rastrear salas por usuário
  const userRooms = new Map<number, number[]>(); // userId -> roomIds[]

  // Mapa para usuários digitando em cada sala
  const typingUsers = new Map<number, Set<number>>(); // roomId -> Set<userId>

  // Middleware para autenticação
  io.use((socket: Socket, next) => {
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error("Autenticação necessária"));
    }
    
    // Salvar o userId no socket
    (socket as any).userId = userId;
    
    // Adicionar este socket ao mapa de usuários conectados
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId)?.push(socket.id);
    
    next();
  });

  // Handling connection
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`Nova conexão Socket.IO: usuário ${userId} conectado (${socket.id})`);
    
    // Emitir evento com usuários online para todos
    const emitOnlineUsers = () => {
      const onlineUserIds = Array.from(connectedUsers.keys());
      io.emit('onlineUsers', { userIds: onlineUserIds });
    };
    
    // Emitir usuários online quando alguém se conecta
    emitOnlineUsers();
    
    // Juntar-se a uma sala
    socket.on('joinRoom', async ({ roomId }) => {
      try {
        console.log(`Usuário ${userId} entrando na sala ${roomId}`);
        
        // Verificar acesso à sala
        const isParticipant = await storage.isChatRoomParticipant(roomId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Você não tem acesso a esta sala' });
          return;
        }
        
        // Adicionar usuário à sala
        socket.join(`room:${roomId}`);
        
        // Registrar sala para o usuário
        if (!userRooms.has(userId)) {
          userRooms.set(userId, []);
        }
        const rooms = userRooms.get(userId) || [];
        if (!rooms.includes(roomId)) {
          rooms.push(roomId);
          userRooms.set(userId, rooms);
        }
        
        // Obter mensagens da sala e enviar para o usuário
        const messages = await storage.getChatMessages(roomId, 100, 0);
        socket.emit('roomHistory', { roomId, messages });
        
        // Notificar sala que o usuário entrou
        socket.to(`room:${roomId}`).emit('userJoined', { roomId, userId });
      } catch (error) {
        console.error(`Erro ao entrar na sala ${roomId}:`, error);
        socket.emit('error', { message: 'Erro ao entrar na sala' });
      }
    });
    
    // Sair de uma sala
    socket.on('leaveRoom', ({ roomId }) => {
      console.log(`Usuário ${userId} saindo da sala ${roomId}`);
      socket.leave(`room:${roomId}`);
      
      // Remover a sala da lista do usuário
      const rooms = userRooms.get(userId) || [];
      const updatedRooms = rooms.filter(id => id !== roomId);
      userRooms.set(userId, updatedRooms);
      
      // Notificar sala que o usuário saiu
      socket.to(`room:${roomId}`).emit('userLeft', { roomId, userId });
    });
    
    // Excluir uma sala de chat (apenas administradores ou criadores)
    socket.on('deleteRoom', async ({ roomId }) => {
      try {
        console.log(`Usuário ${userId} tentando excluir a sala ${roomId}`);
        
        // Verificar se o usuário é administrador ou criador da sala
        const room = await storage.getChatRoomById(roomId);
        const user = await storage.getUser(userId);
        
        if (!room) {
          socket.emit('error', { message: 'Sala não encontrada' });
          return;
        }
        
        if (room.createdBy !== userId && user?.role !== 'admin') {
          socket.emit('error', { message: 'Você não tem permissão para excluir esta sala' });
          return;
        }
        
        // Listar participantes para notificá-los da exclusão
        const participants = await storage.getChatRoomParticipants(roomId);
        
        // Excluir todos os uploads da sala
        const uploads = await storage.getChatUploads(roomId);
        for (const upload of uploads) {
          await storage.deleteChatUpload(upload.id);
        }
        
        // Excluir todas as mensagens da sala
        const messages = await storage.getChatMessages(roomId, 1000, 0);
        for (const message of messages) {
          // Marcar mensagens como excluídas (usando updateChatMessage)
          await storage.updateChatMessage(message.id, { 
            content: "Esta mensagem foi excluída", 
            message: "Mensagem excluída"
          });
        }
        
        // Excluir participantes
        for (const participant of participants) {
          await storage.removeChatRoomParticipant(roomId, participant.userId);
        }
        
        // Excluir a sala
        const success = await storage.deleteChatRoom(roomId);
        
        if (success) {
          // Notificar todos os participantes sobre a exclusão
          for (const participant of participants) {
            const socketIds = connectedUsers.get(participant.userId) || [];
            socketIds.forEach(socketId => {
              io.to(socketId).emit('roomDeleted', { roomId });
            });
          }
          
          // Emitir evento de sucesso para o solicitante
          socket.emit('roomDeleteSuccess', { roomId });
          console.log(`Sala ${roomId} excluída com sucesso pelo usuário ${userId}`);
        } else {
          socket.emit('error', { message: 'Não foi possível excluir a sala' });
        }
      } catch (error) {
        console.error(`Erro ao excluir sala ${roomId}:`, error);
        socket.emit('error', { message: 'Erro ao excluir a sala' });
      }
    });
    
    // Processar novas mensagens
    socket.on('sendMessage', async (data) => {
      try {
        const { roomId, content, type = 'text' } = data;
        
        // Verificar acesso à sala
        const isParticipant = await storage.isChatRoomParticipant(roomId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Você não tem acesso a esta sala' });
          return;
        }
        
        // Criar mensagem no banco de dados
        const message = await storage.createChatMessage({
          roomId,
          userId,
          content,
          type,
          createdAt: new Date(),
          read: false
        });
        
        // Emitir nova mensagem para todos na sala
        io.to(`room:${roomId}`).emit('newMessage', message);
        
        // Remover usuário da lista de digitando
        if (typingUsers.has(roomId)) {
          const users = typingUsers.get(roomId);
          users?.delete(userId);
          // Emitir status de digitação atualizado
          io.to(`room:${roomId}`).emit('userTyping', { 
            roomId, 
            users: Array.from(users || []) 
          });
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });
    
    // Status de digitação
    socket.on('typing', ({ roomId, isTyping }) => {
      // Inicializar conjunto de usuários digitando para a sala se necessário
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      
      const users = typingUsers.get(roomId)!;
      
      if (isTyping) {
        users.add(userId);
      } else {
        users.delete(userId);
      }
      
      // Emitir para todos os outros na sala
      socket.to(`room:${roomId}`).emit('userTyping', { 
        roomId, 
        users: Array.from(users) 
      });
    });
    
    // Desconexão
    socket.on('disconnect', () => {
      console.log(`Usuário ${userId} desconectado`);
      
      // Remover socketId do usuário
      const socketIds = connectedUsers.get(userId) || [];
      const updatedSocketIds = socketIds.filter(id => id !== socket.id);
      
      if (updatedSocketIds.length === 0) {
        // Se não houver mais sockets para este usuário, remover do mapa
        connectedUsers.delete(userId);
        
        // Limpar digitação em todas as salas
        for (const [roomId, users] of typingUsers.entries()) {
          if (users.has(userId)) {
            users.delete(userId);
            io.to(`room:${roomId}`).emit('userTyping', { 
              roomId, 
              users: Array.from(users) 
            });
          }
        }
        
        // Emitir usuários online atualizados
        emitOnlineUsers();
      } else {
        // Atualizar socketIds do usuário
        connectedUsers.set(userId, updatedSocketIds);
      }
    });
  });

  console.log('Servidor Socket.IO iniciado com sucesso');

  // Retornar API de serviço para permitir emissão de eventos de outros lugares do código
  return {
    // Emite um evento para um usuário específico
    emitToUser(userId: number, event: string, data: any): void {
      const socketIds = connectedUsers.get(userId) || [];
      socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
    },
    
    // Emite um evento para todos os usuários
    emitToAll(event: string, data: any): void {
      io.emit(event, data);
    },
    
    // Emite um evento para todos os usuários em uma sala
    emitToRoom(roomId: number, event: string, data: any): void {
      io.to(`room:${roomId}`).emit(event, data);
    }
  };
}