import { IStorage } from "./storage";
import { db, pool } from "./db";
import { 
  users, User, InsertUser,
  chatRooms, ChatRoom, InsertChatRoom,
  chatMessages, ChatMessage, InsertChatMessage,
  chatRoomParticipants, ChatRoomParticipant, InsertChatRoomParticipant,
  chatUploads, 
  employees, departments, positions, leaves, payroll, supportTickets,
  Employee, InsertEmployee,
  Department, InsertDepartment,
  Position, InsertPosition,
  Leave, InsertLeave,
  InsertPayroll, Payroll,
  SupportTicket, InsertSupportTicket,
  fiscalCertificates, fiscalNCMs, fiscalCFOPs, fiscalCSTs, fiscalConfigs, nfes, nfeItens, nfeEventos, produtosFiscais,
  FiscalCertificate, InsertFiscalCertificate,
  FiscalNCM, InsertFiscalNCM,
  FiscalCFOP, InsertFiscalCFOP,
  FiscalCST, InsertFiscalCST,
  FiscalConfig, InsertFiscalConfig,
  NFe, InsertNFe,
  NFeItem, InsertNFeItem,
  NFeEvento, InsertNFeEvento,
  ProdutoFiscal, InsertProdutoFiscal,
  products, Product, InsertProduct,
  productFormulas, ProductFormula, InsertProductFormula,
  quotations, Quotation, InsertQuotation,
  quotationItems, QuotationItem, InsertQuotationItem,
  supplierQuotations, SupplierQuotation, InsertSupplierQuotation,
  productPricing, ProductPricing, InsertProductPricing,
  measurementUnits, MeasurementUnit, InsertMeasurementUnit
} from "@shared/schema";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// Criar store de sessão PostgreSQL
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Configurar a store de sessão com o pool de conexões PostgreSQL
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool,
      createTableIfMissing: true,
      tableName: 'session', // Nome da tabela de sessões
      pruneSessionInterval: 60 * 15, // Limpar sessões expiradas a cada 15 minutos
      errorLog: (err) => console.error('Erro no store de sessão:', err)
    });
  }

  // Implementações para o chat
  async isChatRoomParticipant(roomId: number, userId: number): Promise<boolean> {
    try {
      const participant = await db
        .select({
          id: chatRoomParticipants.id
        })
        .from(chatRoomParticipants)
        .where(and(
          eq(chatRoomParticipants.roomId, roomId),
          eq(chatRoomParticipants.userId, userId)
        ))
        .limit(1);
      
      return participant.length > 0;
    } catch (error) {
      console.error("Erro ao verificar participante da sala:", error);
      return false;
    }
  }

  async getChatRoom(roomId: number): Promise<any> {
    try {
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .limit(1);
      
      if (!room) return undefined;
      
      // Obter participantes
      const participants = await db
        .select({
          userId: chatRoomParticipants.userId,
          roleInRoom: chatRoomParticipants.roleInRoom
        })
        .from(chatRoomParticipants)
        .where(eq(chatRoomParticipants.roomId, roomId));
      
      return {
        ...room,
        participants
      };
    } catch (error) {
      console.error("Erro ao obter sala de chat:", error);
      return undefined;
    }
  }

  async getChatMessages(roomId: number, limit: number, offset: number): Promise<any[]> {
    console.log(`Iniciando busca de mensagens para sala ${roomId} (limite: ${limit}, offset: ${offset})`);
    
    try {
      if (isNaN(roomId) || !Number.isInteger(roomId) || roomId <= 0) {
        console.error(`ID de sala inválido: ${roomId}`);
        throw new Error(`ID de sala inválido: ${roomId}`);
      }
      
      if (isNaN(limit) || limit <= 0) limit = 50;
      if (isNaN(offset) || offset < 0) offset = 0;
      
      console.log(`Validações de parâmetros OK, executando consulta SQL para sala ${roomId}`);
      
      try {
        const messages = await db
          .select({
            id: chatMessages.id,
            roomId: chatMessages.roomId,
            userId: chatMessages.userId,
            message: chatMessages.message,
            content: chatMessages.content,  // Adicionando o campo content
            isRead: chatMessages.isRead,
            isSystem: chatMessages.isSystem,
            createdAt: chatMessages.createdAt,
            updatedAt: chatMessages.updatedAt,
            parentId: chatMessages.parentId,
            attachments: chatMessages.attachments,
            mentions: chatMessages.mentions,
            reactions: chatMessages.reactions,
            editedAt: chatMessages.editedAt,
            editedBy: chatMessages.editedBy,
            type: sql`COALESCE('text', 'text')`.as('type') // Definindo tipo padrão 'text' se não estiver definido
          })
          .from(chatMessages)
          .where(eq(chatMessages.roomId, roomId))
          .orderBy(desc(chatMessages.createdAt))
          .limit(limit)
          .offset(offset);
        
        console.log(`Consulta SQL bem-sucedida. Recuperadas ${messages.length} mensagens da sala ${roomId}`);
        
        // Adicionar log para depuração (limitando a quantidade mostrada no log)
        if (messages.length > 0) {
          console.log(`Exemplo de mensagem recuperada:`, 
            JSON.stringify(messages[0], null, 2));
        } else {
          console.log(`Nenhuma mensagem encontrada para a sala ${roomId}`);
        }
        
        // Para cada mensagem, garantir que temos um campo 'content' válido
        console.log(`Processando ${messages.length} mensagens para garantir formato adequado`);
        
        const messagesProcessed = messages.map(msg => {
          try {
            // Verificar tipo
            if (typeof msg !== 'object' || msg === null) {
              console.error('Formato de mensagem inválido:', msg);
              return { 
                id: 0, 
                roomId: roomId, 
                userId: 0, 
                content: '[Mensagem com formato inválido]',
                message: '',
                type: 'text',
                createdAt: new Date(),
                isRead: true
              };
            }
            
            // Cria um objeto de mensagem formatado de forma segura
            let processedMsg = { ...msg };
            
            // Se a mensagem não tiver conteúdo no campo content, usar o campo message (para compatibilidade)
            if (!processedMsg.content && processedMsg.message) {
              processedMsg.content = processedMsg.message;
            }
            
            // Garantir que todos os campos necessários existam
            if (!processedMsg.type) processedMsg.type = 'text';
            if (!processedMsg.content && !processedMsg.message) processedMsg.content = '[Sem conteúdo]';
            
            return processedMsg;
          } catch (error) {
            console.error('Erro ao processar mensagem individual:', error);
            // Retornar uma mensagem de fallback em caso de erro
            return { 
              id: 0, 
              roomId: roomId, 
              userId: 0, 
              content: '[Erro ao processar mensagem]',
              message: '',
              type: 'text',
              createdAt: new Date(),
              isRead: true
            };
          }
        });
        
        console.log(`Processamento de mensagens concluído. ${messagesProcessed.length} mensagens prontas para envio`);
        
        return messagesProcessed;
      } catch (dbError) {
        console.error(`Erro na consulta SQL ao buscar mensagens da sala ${roomId}:`, dbError);
        throw new Error(`Falha na consulta ao banco de dados: ${dbError.message}`);
      }
    } catch (error) {
      console.error(`Erro geral ao obter mensagens do chat para sala ${roomId}:`, error);
      // Retornar um array vazio mas registrar o erro para diagnóstico
      return [];
    }
  }

  async createChatMessage(message: any): Promise<any> {
    try {
      // Garantir que temos conteúdo válido
      if (!message.content) {
        message.content = message.type === 'text' ? '' : 'Arquivo anexado';
      }
      
      // Para compatibilidade, garantir que o campo message tenha algum valor
      if (!message.message) {
        message.message = ''; // Campo antigo mantido vazio
      }
      
      console.log("Criando mensagem no DB:", {
        roomId: message.roomId,
        userId: message.userId,
        content: message.content,
        message: message.message,
        type: message.type || 'text'
      });
      
      // Se a mensagem tiver uploadId, obter informações do upload e anexar à mensagem
      if (message.uploadId) {
        try {
          const upload = await this.getChatUpload(message.uploadId);
          if (upload) {
            message.file = {
              fileUrl: upload.fileUrl,
              thumbnailUrl: upload.thumbnailUrl,
              originalName: upload.originalName,
              mimeType: upload.mimeType,
              size: upload.size
            };
          }
        } catch (err) {
          console.log('Upload não encontrado, continuando sem anexo');
        }
      }
      
      const [newMessage] = await db
        .insert(chatMessages)
        .values(message)
        .returning();
      
      return newMessage;
    } catch (error) {
      console.error("Erro ao criar mensagem de chat:", error);
      throw error;
    }
  }

  async updateChatMessageReadStatus(messageId: number, userId: number): Promise<boolean> {
    try {
      // Implementação para marcar mensagem como lida
      // Normalmente seria uma tabela de mensagens lidas ou flag na mensagem
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status de leitura de mensagem:", error);
      return false;
    }
  }

  // Implementações para uploads de chat
  async getChatUpload(uploadId: number): Promise<any> {
    try {
      const [upload] = await db
        .select()
        .from(chatUploads)
        .where(eq(chatUploads.id, uploadId))
        .limit(1);
      
      return upload;
    } catch (error) {
      console.error("Erro ao obter upload de chat:", error);
      return undefined;
    }
  }

  async getChatUploads(roomId: number): Promise<any[]> {
    try {
      const uploads = await db
        .select()
        .from(chatUploads)
        .where(eq(chatUploads.roomId, roomId))
        .orderBy(desc(chatUploads.createdAt));
      
      return uploads;
    } catch (error) {
      console.error("Erro ao obter uploads de chat:", error);
      return [];
    }
  }

  async createChatUpload(upload: any): Promise<any> {
    try {
      const [newUpload] = await db
        .insert(chatUploads)
        .values(upload)
        .returning();
      
      return newUpload;
    } catch (error) {
      console.error("Erro ao criar upload de chat:", error);
      throw error;
    }
  }

  async deleteChatUpload(uploadId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(chatUploads)
        .where(eq(chatUploads.id, uploadId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir upload de chat:", error);
      return false;
    }
  }

  // Implementação básica para usuários (necessária para o chat)
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          active: users.active,
          permissions: users.permissions,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          active: users.active,
          permissions: users.permissions,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error("Erro ao obter usuário por username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values(user)
        .returning();
      
      return newUser;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  async updateUser(id: number | string, data: Partial<User>): Promise<User> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      
      const [updatedUser] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, numericId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          active: users.active,
          permissions: users.permissions,
          createdAt: users.createdAt
        })
        .from(users);
      return allUsers;
    } catch (error) {
      console.error("Erro ao obter todos os usuários:", error);
      return [];
    }
  }

  // Funções de chat que estavam faltando
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    try {
      // Primeiro, obtenha os IDs das salas em que o usuário é participante
      const participations = await db
        .select({
          roomId: chatRoomParticipants.roomId
        })
        .from(chatRoomParticipants)
        .where(eq(chatRoomParticipants.userId, userId));
      
      if (participations.length === 0) {
        return [];
      }
      
      const roomIds = participations.map(p => p.roomId);
      
      // Buscar as salas com esses IDs usando uma seleção explícita dos campos
      // para evitar o erro "Cannot convert undefined or null to object"
      const rooms = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          description: chatRooms.description,
          type: chatRooms.type,
          visibility: chatRooms.visibility,
          isGroup: chatRooms.isGroup,
          createdBy: chatRooms.createdBy,
          createdAt: chatRooms.createdAt,
          updatedAt: chatRooms.updatedAt,
          avatarUrl: chatRooms.avatarUrl,
          lastMessageAt: chatRooms.lastMessageAt,
          readOnly: chatRooms.readOnly,
          archived: chatRooms.archived
        })
        .from(chatRooms)
        .where(inArray(chatRooms.id, roomIds));
      
      // Para cada sala, buscar os participantes
      const roomsWithParticipants = await Promise.all(
        rooms.map(async (room) => {
          const participants = await db
            .select({
              userId: chatRoomParticipants.userId,
              isAdmin: chatRoomParticipants.isAdmin,
              isOwner: chatRoomParticipants.isOwner,
              isModerator: chatRoomParticipants.isModerator
            })
            .from(chatRoomParticipants)
            .where(eq(chatRoomParticipants.roomId, room.id));
          
          // Buscar última mensagem da sala
          const lastMessages = await db
            .select({
              id: chatMessages.id,
              roomId: chatMessages.roomId,
              userId: chatMessages.userId,
              message: chatMessages.message,
              content: chatMessages.content,  // Incluindo o campo content
              createdAt: chatMessages.createdAt,
              type: sql`COALESCE('text', 'text')`.as('type') // Definindo tipo padrão 'text'
            })
            .from(chatMessages)
            .where(eq(chatMessages.roomId, room.id))
            .orderBy(desc(chatMessages.createdAt))
            .limit(1);
          
          let lastMessage = undefined;
          if (lastMessages.length > 0) {
            lastMessage = lastMessages[0];
            // Se não tiver content mas tiver message, usar message como content
            if (!lastMessage.content && lastMessage.message) {
              lastMessage.content = lastMessage.message;
            }
          }
          
          // Contar mensagens não lidas
          const unreadCount = await this.getUnreadMessagesCount(userId, room.id);
          
          return {
            ...room,
            participants,
            lastMessage,
            unreadCount
          };
        })
      );
      
      return roomsWithParticipants;
    } catch (error) {
      console.error("Erro ao obter salas de chat do usuário:", error);
      return [];
    }
  }

  async createChatRoom(roomData: InsertChatRoom): Promise<ChatRoom> {
    try {
      const [newRoom] = await db
        .insert(chatRooms)
        .values(roomData)
        .returning();
      
      return newRoom;
    } catch (error) {
      console.error("Erro ao criar sala de chat:", error);
      throw error;
    }
  }

  async addChatRoomParticipant(roomId: number, userId: number, roleInRoom: string = 'member'): Promise<ChatRoomParticipant> {
    try {
      const participant = {
        roomId,
        userId,
        isAdmin: roleInRoom === 'admin',
        isOwner: roleInRoom === 'owner',
        isModerator: roleInRoom === 'moderator',
        status: 'online'
      };
      
      const [newParticipant] = await db
        .insert(chatRoomParticipants)
        .values(participant)
        .returning();
      
      return newParticipant;
    } catch (error) {
      console.error("Erro ao adicionar participante à sala de chat:", error);
      throw error;
    }
  }

  async getChatRoomById(roomId: number): Promise<ChatRoom | undefined> {
    try {
      const [room] = await db
        .select({
          id: chatRooms.id,
          name: chatRooms.name,
          description: chatRooms.description,
          type: chatRooms.type,
          visibility: chatRooms.visibility,
          isGroup: chatRooms.isGroup,
          createdBy: chatRooms.createdBy,
          createdAt: chatRooms.createdAt,
          updatedAt: chatRooms.updatedAt,
          avatarUrl: chatRooms.avatarUrl,
          lastMessageAt: chatRooms.lastMessageAt,
          readOnly: chatRooms.readOnly,
          archived: chatRooms.archived
        })
        .from(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .limit(1);
      
      if (!room) return undefined;
      
      // Buscar os participantes
      const participants = await db
        .select({
          id: chatRoomParticipants.id,
          roomId: chatRoomParticipants.roomId,
          userId: chatRoomParticipants.userId,
          isAdmin: chatRoomParticipants.isAdmin,
          isOwner: chatRoomParticipants.isOwner,
          isModerator: chatRoomParticipants.isModerator,
          joinedAt: chatRoomParticipants.joinedAt,
          lastSeenAt: chatRoomParticipants.lastSeenAt,
          status: chatRoomParticipants.status,
          statusMessage: chatRoomParticipants.statusMessage,
          muted: chatRoomParticipants.muted,
          notifications: chatRoomParticipants.notifications
        })
        .from(chatRoomParticipants)
        .where(eq(chatRoomParticipants.roomId, roomId));
      
      return {
        ...room,
        participants
      };
    } catch (error) {
      console.error("Erro ao obter sala de chat por ID:", error);
      return undefined;
    }
  }

  async updateChatRoom(roomId: number, data: Partial<ChatRoom>): Promise<ChatRoom> {
    try {
      const [updatedRoom] = await db
        .update(chatRooms)
        .set(data)
        .where(eq(chatRooms.id, roomId))
        .returning();
      
      return updatedRoom;
    } catch (error) {
      console.error("Erro ao atualizar sala de chat:", error);
      throw error;
    }
  }

  async deleteChatRoom(roomId: number): Promise<boolean> {
    try {
      // Primeiro remover todos os participantes
      await db
        .delete(chatRoomParticipants)
        .where(eq(chatRoomParticipants.roomId, roomId));
      
      // Remover todas as mensagens
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.roomId, roomId));
      
      // Remover todos os uploads
      await db
        .delete(chatUploads)
        .where(eq(chatUploads.roomId, roomId));
      
      // Finalmente, remover a sala
      const result = await db
        .delete(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir sala de chat:", error);
      return false;
    }
  }

  async getUnreadMessagesCount(userId: number, roomId?: number): Promise<number> {
    try {
      // Implementação simplificada - em um sistema real, você precisaria de uma tabela
      // de mensagens lidas para rastrear o que cada usuário já leu
      return 0;
    } catch (error) {
      console.error("Erro ao contar mensagens não lidas:", error);
      return 0;
    }
  }

  async updateParticipantStatus(roomId: number, userId: number, status: string, statusMessage?: string): Promise<void> {
    try {
      // Implementação para atualizar o status de um participante (online, offline, etc.)
      await db
        .update(chatRoomParticipants)
        .set({ 
          status, 
          statusMessage: statusMessage || null 
        })
        .where(
          and(
            eq(chatRoomParticipants.roomId, roomId),
            eq(chatRoomParticipants.userId, userId)
          )
        );
    } catch (error) {
      console.error("Erro ao atualizar status do participante:", error);
    }
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    try {
      // Implementação para marcar mensagem como lida
      // Em um sistema real, isso deveria registrar em uma tabela de leituras
      return true;
    } catch (error) {
      console.error("Erro ao marcar mensagem como lida:", error);
      return false;
    }
  }

  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    try {
      const [message] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, id))
        .limit(1);
      
      return message;
    } catch (error) {
      console.error("Erro ao obter mensagem de chat:", error);
      return undefined;
    }
  }

  async updateChatMessage(id: number, data: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const [updatedMessage] = await db
        .update(chatMessages)
        .set(data)
        .where(eq(chatMessages.id, id))
        .returning();
      
      return updatedMessage;
    } catch (error) {
      console.error("Erro ao atualizar mensagem de chat:", error);
      throw error;
    }
  }

  // Implementação para retornar e modificar participantes de uma sala
  async getChatRoomParticipants(roomId: number): Promise<ChatRoomParticipant[]> {
    try {
      const participants = await db
        .select({
          id: chatRoomParticipants.id,
          roomId: chatRoomParticipants.roomId,
          userId: chatRoomParticipants.userId,
          isAdmin: chatRoomParticipants.isAdmin,
          isOwner: chatRoomParticipants.isOwner,
          isModerator: chatRoomParticipants.isModerator,
          joinedAt: chatRoomParticipants.joinedAt,
          lastSeenAt: chatRoomParticipants.lastSeenAt,
          status: chatRoomParticipants.status,
          statusMessage: chatRoomParticipants.statusMessage,
          muted: chatRoomParticipants.muted,
          notifications: chatRoomParticipants.notifications
        })
        .from(chatRoomParticipants)
        .where(eq(chatRoomParticipants.roomId, roomId));
      
      return participants;
    } catch (error) {
      console.error("Erro ao obter participantes da sala:", error);
      return [];
    }
  }

  async removeChatRoomParticipant(roomId: number, userId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(chatRoomParticipants)
        .where(
          and(
            eq(chatRoomParticipants.roomId, roomId),
            eq(chatRoomParticipants.userId, userId)
          )
        )
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao remover participante da sala:", error);
      return false;
    }
  }

  // Stubs para outros métodos da interface IStorage que não são necessários para o chat
  // Implementações para HR - Folha de pagamento
  async getPayrolls() {
    try {
      const payrollData = await db
        .select()
        .from(payroll)
        .orderBy(desc(payroll.id));
      
      return payrollData;
    } catch (error) {
      console.error("Erro ao obter folhas de pagamento:", error);
      return [];
    }
  }

  async getPayrollsByYearMonth(year: number, month: number) {
    try {
      const payrollData = await db
        .select()
        .from(payroll)
        .where(
          and(
            eq(payroll.year, year),
            eq(payroll.month, month)
          )
        )
        .orderBy(desc(payroll.id));
      
      return payrollData;
    } catch (error) {
      console.error("Erro ao obter folhas de pagamento por ano/mês:", error);
      return [];
    }
  }

  async getPayrollByEmployeeYearMonth(employeeId: number, year: number, month: number) {
    try {
      const [payrollData] = await db
        .select()
        .from(payroll)
        .where(
          and(
            eq(payroll.employeeId, employeeId),
            eq(payroll.year, year),
            eq(payroll.month, month)
          )
        )
        .limit(1);
      
      return payrollData;
    } catch (error) {
      console.error("Erro ao obter folha de pagamento específica:", error);
      return undefined;
    }
  }

  async createPayroll(payrollData: InsertPayroll): Promise<Payroll> {
    try {
      const [newPayroll] = await db
        .insert(payroll)
        .values(payrollData)
        .returning();
      
      return newPayroll;
    } catch (error) {
      console.error("Erro ao criar folha de pagamento:", error);
      throw error;
    }
  }

  async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll> {
    try {
      const [updatedPayroll] = await db
        .update(payroll)
        .set(data)
        .where(eq(payroll.id, id))
        .returning();
      
      return updatedPayroll;
    } catch (error) {
      console.error("Erro ao atualizar folha de pagamento:", error);
      throw error;
    }
  }

  async deletePayroll(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(payroll)
        .where(eq(payroll.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir folha de pagamento:", error);
      return false;
    }
  }
  
  // Implementações para o módulo de suporte
  async getSupportTickets() {
    try {
      const tickets = await db
        .select()
        .from(supportTickets)
        .orderBy(desc(supportTickets.createdAt));
      
      return tickets;
    } catch (error) {
      console.error("Erro ao obter tickets de suporte:", error);
      return [];
    }
  }
  
  async getSupportTicketById(id: number) {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id))
        .limit(1);
      
      return ticket;
    } catch (error) {
      console.error("Erro ao obter ticket de suporte:", error);
      return undefined;
    }
  }
  
  async createSupportTicket(ticketData: any) {
    try {
      const [ticket] = await db
        .insert(supportTickets)
        .values(ticketData)
        .returning();
      
      return ticket;
    } catch (error) {
      console.error("Erro ao criar ticket de suporte:", error);
      throw error;
    }
  }
  
  async updateSupportTicket(id: number, data: any) {
    try {
      const [updatedTicket] = await db
        .update(supportTickets)
        .set(data)
        .where(eq(supportTickets.id, id))
        .returning();
      
      return updatedTicket;
    } catch (error) {
      console.error("Erro ao atualizar ticket de suporte:", error);
      throw error;
    }
  }
  
  async deleteSupportTicket(id: number) {
    try {
      const result = await db
        .delete(supportTickets)
        .where(eq(supportTickets.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir ticket de suporte:", error);
      return false;
    }
  }

  // Implementações para o módulo HR - Departamentos
  async getDepartments() {
    try {
      const departmentsList = await db
        .select()
        .from(departments)
        .orderBy(departments.name);
      
      return departmentsList;
    } catch (error) {
      console.error("Erro ao obter departamentos:", error);
      return [];
    }
  }

  async getDepartment(id: number) {
    try {
      const [department] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);
      
      return department;
    } catch (error) {
      console.error("Erro ao obter departamento:", error);
      return undefined;
    }
  }

  async createDepartment(departmentData: InsertDepartment): Promise<Department> {
    try {
      const [newDepartment] = await db
        .insert(departments)
        .values(departmentData)
        .returning();
      
      return newDepartment;
    } catch (error) {
      console.error("Erro ao criar departamento:", error);
      throw error;
    }
  }

  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    try {
      const [updatedDepartment] = await db
        .update(departments)
        .set(data)
        .where(eq(departments.id, id))
        .returning();
      
      return updatedDepartment;
    } catch (error) {
      console.error("Erro ao atualizar departamento:", error);
      throw error;
    }
  }

  async deleteDepartment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(departments)
        .where(eq(departments.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir departamento:", error);
      return false;
    }
  }

  // Implementações para o módulo HR - Posições/Cargos
  async getPositions() {
    try {
      const positionsList = await db
        .select()
        .from(positions)
        .orderBy(positions.name);
      
      return positionsList;
    } catch (error) {
      console.error("Erro ao obter cargos:", error);
      return [];
    }
  }

  async getPosition(id: number) {
    try {
      const [position] = await db
        .select()
        .from(positions)
        .where(eq(positions.id, id))
        .limit(1);
      
      return position;
    } catch (error) {
      console.error("Erro ao obter cargo:", error);
      return undefined;
    }
  }

  async createPosition(positionData: InsertPosition): Promise<Position> {
    try {
      const [newPosition] = await db
        .insert(positions)
        .values(positionData)
        .returning();
      
      return newPosition;
    } catch (error) {
      console.error("Erro ao criar cargo:", error);
      throw error;
    }
  }

  async updatePosition(id: number, data: Partial<Position>): Promise<Position> {
    try {
      const [updatedPosition] = await db
        .update(positions)
        .set(data)
        .where(eq(positions.id, id))
        .returning();
      
      return updatedPosition;
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
      throw error;
    }
  }

  async deletePosition(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(positions)
        .where(eq(positions.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
      return false;
    }
  }

  // Implementações para o módulo HR - Funcionários
  async getEmployees() {
    try {
      const employeesList = await db
        .select()
        .from(employees)
        .orderBy(employees.name);
      
      return employeesList;
    } catch (error) {
      console.error("Erro ao obter funcionários:", error);
      return [];
    }
  }

  async getEmployee(id: number) {
    try {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);
      
      return employee;
    } catch (error) {
      console.error("Erro ao obter funcionário:", error);
      return undefined;
    }
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    try {
      const [newEmployee] = await db
        .insert(employees)
        .values(employeeData)
        .returning();
      
      return newEmployee;
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
      throw error;
    }
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    try {
      const [updatedEmployee] = await db
        .update(employees)
        .set(data)
        .where(eq(employees.id, id))
        .returning();
      
      return updatedEmployee;
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      throw error;
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
      return false;
    }
  }

  // Implementações para o módulo HR - Licenças/Férias
  async getLeaves() {
    try {
      const leavesList = await db
        .select()
        .from(leaves)
        .orderBy(desc(leaves.startDate));
      
      return leavesList;
    } catch (error) {
      console.error("Erro ao obter licenças:", error);
      return [];
    }
  }

  async getLeave(id: number) {
    try {
      const [leave] = await db
        .select()
        .from(leaves)
        .where(eq(leaves.id, id))
        .limit(1);
      
      return leave;
    } catch (error) {
      console.error("Erro ao obter licença:", error);
      return undefined;
    }
  }

  async createLeave(leaveData: InsertLeave): Promise<Leave> {
    try {
      const [newLeave] = await db
        .insert(leaves)
        .values(leaveData)
        .returning();
      
      return newLeave;
    } catch (error) {
      console.error("Erro ao criar licença:", error);
      throw error;
    }
  }

  async updateLeave(id: number, data: Partial<Leave>): Promise<Leave> {
    try {
      const [updatedLeave] = await db
        .update(leaves)
        .set(data)
        .where(eq(leaves.id, id))
        .returning();
      
      return updatedLeave;
    } catch (error) {
      console.error("Erro ao atualizar licença:", error);
      throw error;
    }
  }

  async deleteLeave(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(leaves)
        .where(eq(leaves.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir licença:", error);
      return false;
    }
  }

  // Implementações para o módulo de Suporte
  async getAllSupportTickets() {
    try {
      const tickets = await db
        .select()
        .from(supportTickets)
        .orderBy(desc(supportTickets.createdAt));
      
      return tickets;
    } catch (error) {
      console.error("Erro ao obter todos os tickets de suporte:", error);
      return [];
    }
  }

  // Implementação para o módulo fiscal
  async getFiscalCertificates(): Promise<FiscalCertificate[]> {
    try {
      const certificates = await db
        .select()
        .from(fiscalCertificates);
      
      return certificates;
    } catch (error) {
      console.error("Erro ao obter certificados fiscais:", error);
      return [];
    }
  }

  async getFiscalCertificate(id: number): Promise<FiscalCertificate | undefined> {
    try {
      const [certificate] = await db
        .select()
        .from(fiscalCertificates)
        .where(eq(fiscalCertificates.id, id))
        .limit(1);
      
      return certificate;
    } catch (error) {
      console.error("Erro ao obter certificado fiscal:", error);
      return undefined;
    }
  }

  async createFiscalCertificate(certificateData: InsertFiscalCertificate): Promise<FiscalCertificate> {
    try {
      const [certificate] = await db
        .insert(fiscalCertificates)
        .values(certificateData)
        .returning();
      
      return certificate;
    } catch (error) {
      console.error("Erro ao criar certificado fiscal:", error);
      throw error;
    }
  }

  async updateFiscalCertificate(id: number, data: Partial<FiscalCertificate>): Promise<FiscalCertificate> {
    try {
      const [certificate] = await db
        .update(fiscalCertificates)
        .set(data)
        .where(eq(fiscalCertificates.id, id))
        .returning();
      
      return certificate;
    } catch (error) {
      console.error("Erro ao atualizar certificado fiscal:", error);
      throw error;
    }
  }

  async deleteFiscalCertificate(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fiscalCertificates)
        .where(eq(fiscalCertificates.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir certificado fiscal:", error);
      return false;
    }
  }

  async getFiscalNCMs(): Promise<FiscalNCM[]> {
    try {
      const ncms = await db
        .select()
        .from(fiscalNCMs);
      
      return ncms;
    } catch (error) {
      console.error("Erro ao obter NCMs:", error);
      return [];
    }
  }

  async getFiscalNCM(id: number): Promise<FiscalNCM | undefined> {
    try {
      const [ncm] = await db
        .select()
        .from(fiscalNCMs)
        .where(eq(fiscalNCMs.id, id))
        .limit(1);
      
      return ncm;
    } catch (error) {
      console.error("Erro ao obter NCM:", error);
      return undefined;
    }
  }

  async getFiscalNCMByCode(code: string): Promise<FiscalNCM | undefined> {
    try {
      const [ncm] = await db
        .select()
        .from(fiscalNCMs)
        .where(eq(fiscalNCMs.code, code))
        .limit(1);
      
      return ncm;
    } catch (error) {
      console.error("Erro ao obter NCM por código:", error);
      return undefined;
    }
  }

  async createFiscalNCM(ncmData: InsertFiscalNCM): Promise<FiscalNCM> {
    try {
      const [ncm] = await db
        .insert(fiscalNCMs)
        .values(ncmData)
        .returning();
      
      return ncm;
    } catch (error) {
      console.error("Erro ao criar NCM:", error);
      throw error;
    }
  }

  async updateFiscalNCM(id: number, data: Partial<FiscalNCM>): Promise<FiscalNCM> {
    try {
      const [ncm] = await db
        .update(fiscalNCMs)
        .set(data)
        .where(eq(fiscalNCMs.id, id))
        .returning();
      
      return ncm;
    } catch (error) {
      console.error("Erro ao atualizar NCM:", error);
      throw error;
    }
  }

  async deleteFiscalNCM(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fiscalNCMs)
        .where(eq(fiscalNCMs.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir NCM:", error);
      return false;
    }
  }

  async getFiscalCFOPs(): Promise<FiscalCFOP[]> {
    try {
      const cfops = await db
        .select()
        .from(fiscalCFOPs);
      
      return cfops;
    } catch (error) {
      console.error("Erro ao obter CFOPs:", error);
      return [];
    }
  }

  async getFiscalCFOP(id: number): Promise<FiscalCFOP | undefined> {
    try {
      const [cfop] = await db
        .select()
        .from(fiscalCFOPs)
        .where(eq(fiscalCFOPs.id, id))
        .limit(1);
      
      return cfop;
    } catch (error) {
      console.error("Erro ao obter CFOP:", error);
      return undefined;
    }
  }

  async getFiscalCFOPByCode(code: string): Promise<FiscalCFOP | undefined> {
    try {
      const [cfop] = await db
        .select()
        .from(fiscalCFOPs)
        .where(eq(fiscalCFOPs.code, code))
        .limit(1);
      
      return cfop;
    } catch (error) {
      console.error("Erro ao obter CFOP por código:", error);
      return undefined;
    }
  }

  async createFiscalCFOP(cfopData: InsertFiscalCFOP): Promise<FiscalCFOP> {
    try {
      const [cfop] = await db
        .insert(fiscalCFOPs)
        .values(cfopData)
        .returning();
      
      return cfop;
    } catch (error) {
      console.error("Erro ao criar CFOP:", error);
      throw error;
    }
  }

  async updateFiscalCFOP(id: number, data: Partial<FiscalCFOP>): Promise<FiscalCFOP> {
    try {
      const [cfop] = await db
        .update(fiscalCFOPs)
        .set(data)
        .where(eq(fiscalCFOPs.id, id))
        .returning();
      
      return cfop;
    } catch (error) {
      console.error("Erro ao atualizar CFOP:", error);
      throw error;
    }
  }

  async deleteFiscalCFOP(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fiscalCFOPs)
        .where(eq(fiscalCFOPs.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir CFOP:", error);
      return false;
    }
  }

  async getFiscalCSTs(): Promise<FiscalCST[]> {
    try {
      const csts = await db
        .select()
        .from(fiscalCSTs);
      
      return csts;
    } catch (error) {
      console.error("Erro ao obter CSTs:", error);
      return [];
    }
  }

  async getFiscalCST(id: number): Promise<FiscalCST | undefined> {
    try {
      const [cst] = await db
        .select()
        .from(fiscalCSTs)
        .where(eq(fiscalCSTs.id, id))
        .limit(1);
      
      return cst;
    } catch (error) {
      console.error("Erro ao obter CST:", error);
      return undefined;
    }
  }

  async createFiscalCST(cstData: InsertFiscalCST): Promise<FiscalCST> {
    try {
      const [cst] = await db
        .insert(fiscalCSTs)
        .values(cstData)
        .returning();
      
      return cst;
    } catch (error) {
      console.error("Erro ao criar CST:", error);
      throw error;
    }
  }

  async updateFiscalCST(id: number, data: Partial<FiscalCST>): Promise<FiscalCST> {
    try {
      const [cst] = await db
        .update(fiscalCSTs)
        .set(data)
        .where(eq(fiscalCSTs.id, id))
        .returning();
      
      return cst;
    } catch (error) {
      console.error("Erro ao atualizar CST:", error);
      throw error;
    }
  }

  async deleteFiscalCST(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fiscalCSTs)
        .where(eq(fiscalCSTs.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir CST:", error);
      return false;
    }
  }

  async getFiscalConfig(): Promise<FiscalConfig | undefined> {
    try {
      const [config] = await db
        .select()
        .from(fiscalConfigs)
        .limit(1);
      
      return config;
    } catch (error) {
      console.error("Erro ao obter configuração fiscal:", error);
      return undefined;
    }
  }

  async createFiscalConfig(configData: InsertFiscalConfig): Promise<FiscalConfig> {
    try {
      const [config] = await db
        .insert(fiscalConfigs)
        .values(configData)
        .returning();
      
      return config;
    } catch (error) {
      console.error("Erro ao criar configuração fiscal:", error);
      throw error;
    }
  }

  async updateFiscalConfig(id: number, data: Partial<FiscalConfig>): Promise<FiscalConfig> {
    try {
      const [config] = await db
        .update(fiscalConfigs)
        .set(data)
        .where(eq(fiscalConfigs.id, id))
        .returning();
      
      return config;
    } catch (error) {
      console.error("Erro ao atualizar configuração fiscal:", error);
      throw error;
    }
  }

  async getProdutosFiscais(): Promise<ProdutoFiscal[]> {
    try {
      const produtos = await db
        .select()
        .from(produtosFiscais);
      
      return produtos;
    } catch (error) {
      console.error("Erro ao obter produtos fiscais:", error);
      return [];
    }
  }

  async getProdutoFiscal(id: number): Promise<ProdutoFiscal | undefined> {
    try {
      const [produto] = await db
        .select()
        .from(produtosFiscais)
        .where(eq(produtosFiscais.id, id))
        .limit(1);
      
      return produto;
    } catch (error) {
      console.error("Erro ao obter produto fiscal:", error);
      return undefined;
    }
  }

  async getProdutoFiscalByProdutoId(produtoId: number): Promise<ProdutoFiscal | undefined> {
    try {
      const [produto] = await db
        .select()
        .from(produtosFiscais)
        .where(eq(produtosFiscais.produtoId, produtoId))
        .limit(1);
      
      return produto;
    } catch (error) {
      console.error("Erro ao obter produto fiscal por produtoId:", error);
      return undefined;
    }
  }

  async createProdutoFiscal(produtoData: InsertProdutoFiscal): Promise<ProdutoFiscal> {
    try {
      const [produto] = await db
        .insert(produtosFiscais)
        .values(produtoData)
        .returning();
      
      return produto;
    } catch (error) {
      console.error("Erro ao criar produto fiscal:", error);
      throw error;
    }
  }

  async updateProdutoFiscal(id: number, data: Partial<ProdutoFiscal>): Promise<ProdutoFiscal> {
    try {
      const [produto] = await db
        .update(produtosFiscais)
        .set(data)
        .where(eq(produtosFiscais.id, id))
        .returning();
      
      return produto;
    } catch (error) {
      console.error("Erro ao atualizar produto fiscal:", error);
      throw error;
    }
  }

  async deleteProdutoFiscal(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(produtosFiscais)
        .where(eq(produtosFiscais.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir produto fiscal:", error);
      return false;
    }
  }

  async getNFes(): Promise<NFe[]> {
    try {
      const nfs = await db
        .select()
        .from(nfes);
      
      return nfs;
    } catch (error) {
      console.error("Erro ao obter NFes:", error);
      return [];
    }
  }

  async getNFe(id: number): Promise<NFe | undefined> {
    try {
      const [nf] = await db
        .select()
        .from(nfes)
        .where(eq(nfes.id, id))
        .limit(1);
      
      return nf;
    } catch (error) {
      console.error("Erro ao obter NFe:", error);
      return undefined;
    }
  }

  async getNFeByChave(chaveAcesso: string): Promise<NFe | undefined> {
    try {
      const [nf] = await db
        .select()
        .from(nfes)
        .where(eq(nfes.chaveAcesso, chaveAcesso))
        .limit(1);
      
      return nf;
    } catch (error) {
      console.error("Erro ao obter NFe por chave de acesso:", error);
      return undefined;
    }
  }

  async getNFeItens(nfeId: number): Promise<NFeItem[]> {
    try {
      const itens = await db
        .select()
        .from(nfeItens)
        .where(eq(nfeItens.nfeId, nfeId));
      
      return itens;
    } catch (error) {
      console.error("Erro ao obter itens da NFe:", error);
      return [];
    }
  }

  async getNFeEventos(nfeId: number): Promise<NFeEvento[]> {
    try {
      const eventos = await db
        .select()
        .from(nfeEventos)
        .where(eq(nfeEventos.nfeId, nfeId));
      
      return eventos;
    } catch (error) {
      console.error("Erro ao obter eventos da NFe:", error);
      return [];
    }
  }

  async createNFe(nfeData: InsertNFe): Promise<NFe> {
    try {
      // Obter o próximo número de NF-e
      const config = await this.getFiscalConfig();
      if (!config) {
        throw new Error("Configuração fiscal não encontrada");
      }
      
      // Atualizar o próximo número de NF-e na configuração
      // Deve ser feito em uma transação para evitar problemas de concorrência
      const [updatedConfig] = await db
        .update(fiscalConfigs)
        .set({
          ultNFe: sql`${fiscalConfigs.ultNFe} + 1`
        })
        .where(eq(fiscalConfigs.id, config.id))
        .returning();
      
      // Usar o número atualizado para a nova NF-e
      const newNFe = {
        ...nfeData,
        numeroNota: updatedConfig.ultNFe
      };
      
      const [nf] = await db
        .insert(nfes)
        .values(newNFe)
        .returning();
      
      return nf;
    } catch (error) {
      console.error("Erro ao criar NFe:", error);
      throw error;
    }
  }

  async updateNFe(id: number, data: Partial<NFe>): Promise<NFe> {
    try {
      const [nf] = await db
        .update(nfes)
        .set(data)
        .where(eq(nfes.id, id))
        .returning();
      
      return nf;
    } catch (error) {
      console.error("Erro ao atualizar NFe:", error);
      throw error;
    }
  }

  async deleteNFe(id: number): Promise<boolean> {
    try {
      // Primeiro excluir itens e eventos relacionados
      await db.delete(nfeItens).where(eq(nfeItens.nfeId, id));
      await db.delete(nfeEventos).where(eq(nfeEventos.nfeId, id));
      
      // Depois excluir a NF-e
      const result = await db
        .delete(nfes)
        .where(eq(nfes.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir NFe:", error);
      return false;
    }
  }

  async createNFeItem(itemData: InsertNFeItem): Promise<NFeItem> {
    try {
      const [item] = await db
        .insert(nfeItens)
        .values(itemData)
        .returning();
      
      return item;
    } catch (error) {
      console.error("Erro ao criar item de NFe:", error);
      throw error;
    }
  }

  async updateNFeItem(id: number, data: Partial<NFeItem>): Promise<NFeItem> {
    try {
      const [item] = await db
        .update(nfeItens)
        .set(data)
        .where(eq(nfeItens.id, id))
        .returning();
      
      return item;
    } catch (error) {
      console.error("Erro ao atualizar item de NFe:", error);
      throw error;
    }
  }

  async deleteNFeItem(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(nfeItens)
        .where(eq(nfeItens.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir item de NFe:", error);
      return false;
    }
  }

  async createNFeEvento(eventoData: InsertNFeEvento): Promise<NFeEvento> {
    try {
      const [evento] = await db
        .insert(nfeEventos)
        .values(eventoData)
        .returning();
      
      return evento;
    } catch (error) {
      console.error("Erro ao criar evento de NFe:", error);
      throw error;
    }
  }

  async updateNFeEvento(id: number, data: Partial<NFeEvento>): Promise<NFeEvento> {
    try {
      const [evento] = await db
        .update(nfeEventos)
        .set(data)
        .where(eq(nfeEventos.id, id))
        .returning();
      
      return evento;
    } catch (error) {
      console.error("Erro ao atualizar evento de NFe:", error);
      throw error;
    }
  }

  async deleteNFeEvento(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(nfeEventos)
        .where(eq(nfeEventos.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Erro ao excluir evento de NFe:", error);
      return false;
    }
  }
  
  // Implementação para fórmulas de produtos
  async getProductFormulas(productId: number): Promise<ProductFormula[]> {
    try {
      // Vamos fazer uma consulta SQL direta para evitar problemas com o esquema
      const query = `SELECT * FROM product_formulas WHERE product_id = ${productId}`;
      const result = await db.execute(query);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        materialId: row.material_id,
        quantity: row.quantity,
        unit: row.unit,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by
      }));
    } catch (error) {
      console.error(`Erro ao buscar fórmulas para o produto ID ${productId}:`, error);
      return [];
    }
  }
  
  async getProductFormula(id: number): Promise<ProductFormula | undefined> {
    try {
      const result = await db.execute(
        `SELECT * FROM product_formulas WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        materialId: row.material_id,
        quantity: row.quantity,
        unit: row.unit,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by
      };
    } catch (error) {
      console.error(`Erro ao buscar fórmula ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createProductFormula(formula: InsertProductFormula): Promise<ProductFormula> {
    try {
      const result = await db.execute(
        `INSERT INTO product_formulas (product_id, material_id, quantity, unit, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          formula.productId,
          formula.materialId,
          formula.quantity,
          formula.unit || 'g',
          formula.description || null,
          formula.createdBy
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Falha ao criar fórmula de produto: nenhum registro retornado');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        materialId: row.material_id,
        quantity: row.quantity,
        unit: row.unit,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by
      };
    } catch (error) {
      console.error('Erro ao criar fórmula de produto:', error);
      throw new Error(`Falha ao criar fórmula de produto: ${error.message}`);
    }
  }
  
  async updateProductFormula(id: number, data: Partial<ProductFormula>): Promise<ProductFormula> {
    try {
      // Construir o objeto de campos atualizáveis
      const updateFields: Record<string, any> = {};
      
      if (data.quantity !== undefined) updateFields.quantity = data.quantity;
      if (data.unit !== undefined) updateFields.unit = data.unit;
      if (data.description !== undefined) updateFields.description = data.description;
      
      // Se não houver campos para atualizar, gera erro
      if (Object.keys(updateFields).length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }
      
      // Construir a parte SET da consulta SQL
      const setClauses = Object.entries(updateFields).map(([key, _], index) => {
        const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${column} = $${index + 2}`;
      }).join(', ');
      
      const values = [id, ...Object.values(updateFields)];
      
      const result = await db.execute(
        `UPDATE product_formulas 
         SET ${setClauses}
         WHERE id = $1
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Fórmula de produto ID ${id} não encontrada`);
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        materialId: row.material_id,
        quantity: row.quantity,
        unit: row.unit,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by
      };
    } catch (error) {
      console.error(`Erro ao atualizar fórmula ID ${id}:`, error);
      throw new Error(`Falha ao atualizar fórmula de produto: ${error.message}`);
    }
  }
  
  async deleteProductFormula(id: number): Promise<boolean> {
    try {
      const result = await db.execute(
        `DELETE FROM product_formulas WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Erro ao remover fórmula ID ${id}:`, error);
      return false;
    }
  }

  // Implementação de gerenciamento de Produtos
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));
      
      return product;
    } catch (error) {
      console.error(`Erro ao buscar produto ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getProductByCode(code: string): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.codigo, code));
      
      return product;
    } catch (error) {
      console.error(`Erro ao buscar produto pelo código ${code}:`, error);
      return undefined;
    }
  }
  
  async getProducts(): Promise<Product[]> {
    try {
      const produtosList = await db
        .select()
        .from(products);
      
      return produtosList;
    } catch (error) {
      console.error('Erro ao buscar lista de produtos:', error);
      return [];
    }
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [newProduct] = await db
        .insert(products)
        .values(product)
        .returning();
      
      return newProduct;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw new Error(`Falha ao criar produto: ${error.message}`);
    }
  }
  
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();
      
      if (!updatedProduct) {
        throw new Error(`Produto ID ${id} não encontrado`);
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Erro ao atualizar produto ID ${id}:`, error);
      throw new Error(`Falha ao atualizar produto: ${error.message}`);
    }
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db
        .delete(products)
        .where(eq(products.id, id));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir produto ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação de gerenciamento de Cotações (Quotations)
  async getQuotations(): Promise<Quotation[]> {
    try {
      // Usando SQL direto para evitar problemas com o schema
      const result = await db.execute(sql`
        SELECT
          id,
          reference_number as "quotationNumber",
          status,
          created_at as "creationDate",
          NULL as "closingDate",
          notes,
          created_at as "createdAt",
          created_by as "createdBy",
          description
        FROM quotations
        ORDER BY created_at DESC
      `);
      
      // Transformando os resultados para corresponder à estrutura da interface Quotation
      return result.rows.map(row => {
        return {
          id: row.id,
          quotationNumber: row.quotationNumber || `COT-${row.id}`,
          status: row.status || 'open',
          creationDate: row.creationDate,
          closingDate: row.closingDate,
          notes: row.notes,
          createdAt: row.createdAt,
          createdBy: row.createdBy
        } as Quotation;
      });
    } catch (error) {
      console.error('Erro ao buscar lista de cotações:', error);
      // Retornar array vazio pois ainda não há cotações ou a tabela não existe
      return [];
    }
  }
  
  async getQuotation(id: number): Promise<Quotation | undefined> {
    try {
      // Usando SQL direto para evitar problemas com o schema
      const result = await db.execute(sql`
        SELECT
          id,
          reference_number as "quotationNumber",
          status,
          created_at as "creationDate",
          NULL as "closingDate",
          notes,
          created_at as "createdAt",
          created_by as "createdBy",
          description
        FROM quotations
        WHERE id = ${id}
      `);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Transformando o resultado para corresponder à estrutura da interface Quotation
      return {
        id: row.id,
        quotationNumber: row.quotationNumber || `COT-${row.id}`,
        status: row.status || 'open',
        creationDate: row.creationDate,
        closingDate: row.closingDate,
        notes: row.notes,
        createdAt: row.createdAt,
        createdBy: row.createdBy
      } as Quotation;
    } catch (error) {
      console.error(`Erro ao buscar cotação ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    try {
      // Mapeando os campos do InsertQuotation para os campos reais da tabela
      const mappedValues = {
        reference_number: quotation.quotationNumber,
        status: quotation.status,
        created_at: quotation.creationDate ? new Date(quotation.creationDate) : new Date(),
        notes: quotation.notes,
        created_by: quotation.createdBy,
        description: quotation.notes || 'Cotação criada via API',
        requestor_id: quotation.createdBy
      };
      
      // Usando SQL direto para evitar problemas com o schema
      const result = await db.execute(sql`
        INSERT INTO quotations (reference_number, status, created_at, notes, created_by, description, requestor_id)
        VALUES (${mappedValues.reference_number}, ${mappedValues.status}, ${mappedValues.created_at}, 
                ${mappedValues.notes}, ${mappedValues.created_by}, ${mappedValues.description}, ${mappedValues.requestor_id})
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        throw new Error('Falha ao criar cotação: nenhum registro retornado');
      }
      
      return result.rows[0] as Quotation;
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      throw new Error(`Falha ao criar cotação: ${error.message}`);
    }
  }
  
  async updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation> {
    try {
      // Mapeando os campos do objeto data para os campos reais da tabela
      const updateFields: Record<string, any> = {};
      
      if (data.quotationNumber) updateFields.reference_number = data.quotationNumber;
      if (data.status) updateFields.status = data.status;
      if (data.notes) {
        updateFields.notes = data.notes;
        updateFields.description = data.notes;
      }
      
      // Construindo a parte SET da consulta SQL
      const setClause = Object.entries(updateFields)
        .map(([column, value]) => `${column} = ${typeof value === 'string' ? `'${value}'` : value}`)
        .join(', ');
      
      if (setClause.length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }
      
      // Executando a consulta SQL de atualização
      const result = await db.execute(sql`
        UPDATE quotations 
        SET ${sql.raw(setClause)}
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        throw new Error(`Cotação ID ${id} não encontrada`);
      }
      
      const updatedRow = result.rows[0];
      
      // Transformando o resultado para corresponder à estrutura da interface Quotation
      return {
        id: updatedRow.id,
        quotationNumber: updatedRow.reference_number || `COT-${updatedRow.id}`,
        status: updatedRow.status || 'open',
        creationDate: updatedRow.created_at,
        closingDate: null,
        notes: updatedRow.notes,
        createdAt: updatedRow.created_at,
        createdBy: updatedRow.created_by
      } as Quotation;
    } catch (error) {
      console.error(`Erro ao atualizar cotação ID ${id}:`, error);
      throw new Error(`Falha ao atualizar cotação: ${error.message}`);
    }
  }
  
  async deleteQuotation(id: number): Promise<boolean> {
    try {
      // Usando SQL direto para evitar problemas com o schema
      const result = await db.execute(sql`
        DELETE FROM quotations
        WHERE id = ${id}
        RETURNING id
      `);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Erro ao excluir cotação ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação de gerenciamento de Itens de Cotação (Quotation Items)
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    try {
      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quotationId))
        .orderBy(quotationItems.id);
      
      return items;
    } catch (error) {
      console.error(`Erro ao buscar itens da cotação ID ${quotationId}:`, error);
      return [];
    }
  }
  
  async getQuotationItem(id: number): Promise<QuotationItem | undefined> {
    try {
      const [item] = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.id, id));
      
      return item;
    } catch (error) {
      console.error(`Erro ao buscar item de cotação ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    try {
      const [newItem] = await db
        .insert(quotationItems)
        .values(item)
        .returning();
      
      return newItem;
    } catch (error) {
      console.error('Erro ao criar item de cotação:', error);
      throw new Error(`Falha ao criar item de cotação: ${error.message}`);
    }
  }
  
  async updateQuotationItem(id: number, data: Partial<QuotationItem>): Promise<QuotationItem> {
    try {
      const [updatedItem] = await db
        .update(quotationItems)
        .set(data)
        .where(eq(quotationItems.id, id))
        .returning();
      
      if (!updatedItem) {
        throw new Error(`Item de cotação ID ${id} não encontrado`);
      }
      
      return updatedItem;
    } catch (error) {
      console.error(`Erro ao atualizar item de cotação ID ${id}:`, error);
      throw new Error(`Falha ao atualizar item de cotação: ${error.message}`);
    }
  }
  
  async deleteQuotationItem(id: number): Promise<boolean> {
    try {
      await db
        .delete(quotationItems)
        .where(eq(quotationItems.id, id));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir item de cotação ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação de gerenciamento de Cotações de Fornecedores (Supplier Quotations)
  async getSupplierQuotations(quotationItemId: number): Promise<SupplierQuotation[]> {
    try {
      const quotes = await db
        .select()
        .from(supplierQuotations)
        .where(eq(supplierQuotations.quotationItemId, quotationItemId))
        .orderBy(supplierQuotations.totalPrice);
      
      return quotes;
    } catch (error) {
      console.error(`Erro ao buscar cotações de fornecedores para o item ${quotationItemId}:`, error);
      return [];
    }
  }
  
  async getSupplierQuotation(id: number): Promise<SupplierQuotation | undefined> {
    try {
      const [quote] = await db
        .select()
        .from(supplierQuotations)
        .where(eq(supplierQuotations.id, id));
      
      return quote;
    } catch (error) {
      console.error(`Erro ao buscar cotação de fornecedor ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createSupplierQuotation(quote: InsertSupplierQuotation): Promise<SupplierQuotation> {
    try {
      const [newQuote] = await db
        .insert(supplierQuotations)
        .values(quote)
        .returning();
      
      return newQuote;
    } catch (error) {
      console.error('Erro ao criar cotação de fornecedor:', error);
      throw new Error(`Falha ao criar cotação de fornecedor: ${error.message}`);
    }
  }
  
  async updateSupplierQuotation(id: number, data: Partial<SupplierQuotation>): Promise<SupplierQuotation> {
    try {
      const [updatedQuote] = await db
        .update(supplierQuotations)
        .set(data)
        .where(eq(supplierQuotations.id, id))
        .returning();
      
      if (!updatedQuote) {
        throw new Error(`Cotação de fornecedor ID ${id} não encontrada`);
      }
      
      return updatedQuote;
    } catch (error) {
      console.error(`Erro ao atualizar cotação de fornecedor ID ${id}:`, error);
      throw new Error(`Falha ao atualizar cotação de fornecedor: ${error.message}`);
    }
  }
  
  async selectBestSupplierQuotation(id: number): Promise<SupplierQuotation> {
    try {
      // Primeiro, obtém a cotação selecionada
      const [selectedQuotation] = await db
        .select()
        .from(supplierQuotations)
        .where(eq(supplierQuotations.id, id));
      
      if (!selectedQuotation) {
        throw new Error(`Cotação de fornecedor ID ${id} não encontrada`);
      }
      
      // Atualiza esta cotação como selecionada
      const [updatedQuote] = await db
        .update(supplierQuotations)
        .set({ selected: true })
        .where(eq(supplierQuotations.id, id))
        .returning();
      
      // Marca todas as outras cotações do mesmo item como não selecionadas
      await db
        .update(supplierQuotations)
        .set({ selected: false })
        .where(and(
          eq(supplierQuotations.quotationItemId, selectedQuotation.quotationItemId),
          sql`${supplierQuotations.id} != ${id}`
        ));
      
      return updatedQuote;
    } catch (error) {
      console.error(`Erro ao selecionar melhor cotação ID ${id}:`, error);
      throw new Error(`Falha ao selecionar melhor cotação: ${error.message}`);
    }
  }
  
  async deleteSupplierQuotation(id: number): Promise<boolean> {
    try {
      await db
        .delete(supplierQuotations)
        .where(eq(supplierQuotations.id, id));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir cotação de fornecedor ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação de gerenciamento de Preços de Produtos (Product Pricing)
  async getProductPricings(): Promise<ProductPricing[]> {
    try {
      const pricings = await db
        .select()
        .from(productPricing);
      
      return pricings;
    } catch (error) {
      console.error('Erro ao buscar preços de produtos:', error);
      return [];
    }
  }
  
  async getProductPricing(id: number): Promise<ProductPricing | undefined> {
    try {
      const [pricing] = await db
        .select()
        .from(productPricing)
        .where(eq(productPricing.id, id));
      
      return pricing;
    } catch (error) {
      console.error(`Erro ao buscar preço de produto ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getProductPricingByProductId(productId: number): Promise<ProductPricing | undefined> {
    try {
      const [pricing] = await db
        .select()
        .from(productPricing)
        .where(eq(productPricing.productId, productId));
      
      return pricing;
    } catch (error) {
      console.error(`Erro ao buscar preço para o produto ID ${productId}:`, error);
      return undefined;
    }
  }
  
  async createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing> {
    try {
      const [newPricing] = await db
        .insert(productPricing)
        .values(pricing)
        .returning();
      
      return newPricing;
    } catch (error) {
      console.error('Erro ao criar preço de produto:', error);
      throw new Error(`Falha ao criar preço de produto: ${error.message}`);
    }
  }
  
  async updateProductPricing(id: number, data: Partial<ProductPricing>): Promise<ProductPricing> {
    try {
      const [updatedPricing] = await db
        .update(productPricing)
        .set(data)
        .where(eq(productPricing.id, id))
        .returning();
      
      if (!updatedPricing) {
        throw new Error(`Preço de produto ID ${id} não encontrado`);
      }
      
      return updatedPricing;
    } catch (error) {
      console.error(`Erro ao atualizar preço de produto ID ${id}:`, error);
      throw new Error(`Falha ao atualizar preço de produto: ${error.message}`);
    }
  }
  
  async deleteProductPricing(id: number): Promise<boolean> {
    try {
      await db
        .delete(productPricing)
        .where(eq(productPricing.id, id));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir preço de produto ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação de gerenciamento de Unidades de Medida (Measurement Units)
  async getMeasurementUnits(): Promise<MeasurementUnit[]> {
    try {
      const units = await db
        .select()
        .from(measurementUnits)
        .orderBy(measurementUnits.name);
      
      return units;
    } catch (error) {
      console.error('Erro ao buscar unidades de medida:', error);
      return [];
    }
  }
  
  async getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined> {
    try {
      const [unit] = await db
        .select()
        .from(measurementUnits)
        .where(eq(measurementUnits.id, id));
      
      return unit;
    } catch (error) {
      console.error(`Erro ao buscar unidade de medida ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit> {
    try {
      const [newUnit] = await db
        .insert(measurementUnits)
        .values(unit)
        .returning();
      
      return newUnit;
    } catch (error) {
      console.error('Erro ao criar unidade de medida:', error);
      throw new Error(`Falha ao criar unidade de medida: ${error.message}`);
    }
  }
  
  async updateMeasurementUnit(id: number, data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    try {
      const [updatedUnit] = await db
        .update(measurementUnits)
        .set(data)
        .where(eq(measurementUnits.id, id))
        .returning();
      
      if (!updatedUnit) {
        throw new Error(`Unidade de medida ID ${id} não encontrada`);
      }
      
      return updatedUnit;
    } catch (error) {
      console.error(`Erro ao atualizar unidade de medida ID ${id}:`, error);
      throw new Error(`Falha ao atualizar unidade de medida: ${error.message}`);
    }
  }
  
  async deleteMeasurementUnit(id: number): Promise<boolean> {
    try {
      await db
        .delete(measurementUnits)
        .where(eq(measurementUnits.id, id));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir unidade de medida ID ${id}:`, error);
      return false;
    }
  }
  
  // Implementação para precificação de produtos
  async getProductPricings(): Promise<any[]> {
    try {
      const result = await db.execute(
        `SELECT * FROM product_pricings ORDER BY id`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar precificações de produtos:', error);
      return [];
    }
  }
  
  async getProductPricing(id: number): Promise<any | undefined> {
    try {
      const query = `SELECT * FROM product_pricings WHERE id = ${id}`;
      const result = await db.execute(query);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao buscar precificação ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getProductPricingByProductId(productId: number): Promise<any | undefined> {
    try {
      const query = `SELECT * FROM product_pricings WHERE product_id = ${productId}`;
      const result = await db.execute(query);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao buscar precificação para produto ID ${productId}:`, error);
      return undefined;
    }
  }
  
  // Stubs para outras funções
  // Implementação para matérias-primas
  async getRawMaterial(id: number): Promise<any> {
    try {
      const query = `SELECT * FROM raw_materials WHERE id = ${id}`;
      const result = await db.execute(query);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Erro ao buscar matéria-prima ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getCompany() { return {}; }
  async updateCompany() { return {}; }
  async createCompany() { return {}; }
  async getCustomer() { return undefined; }
  async getCustomerByCnpj() { return undefined; }
  async getDashboardData() { return {}; }
  async getSystemAlerts() { return []; }
  async getActiveSystemAlerts() { return []; }
  async getSystemAlert() { return undefined; }
  async getSystemAlertsByModule() { return []; }
  async createSystemAlert() { return {}; }
  async updateSystemAlert() { return {}; }
  async deleteSystemAlert() { return true; }
}