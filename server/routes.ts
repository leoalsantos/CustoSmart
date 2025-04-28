import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { ensureAuthenticated, ensurePermission, ensureAdmin } from "./middlewares/auth";
import { setupQuotationPricingRoutes } from "./quotation-pricing";
import { setupPricingSimulationRoutes } from "./routes/pricing-simulation-routes";
import fiscalController from "./fiscal/fiscal-controller";
import { InvoiceEntryController } from "./fiscal/invoice-entry-controller";
import { setupAuditRoutes } from "./routes/audit-routes";
import { serveStaticFiles } from "./services/file-service";
import { setupFiscalNFeRoutes } from "./routes/fiscal-nfe-routes";
import { initSocketService } from './services/socket-service';
import { setupChatUploadRoutesSocket } from './routes/chat-upload-routes-socket';
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { chatMessages, chatRooms, chatRoomParticipants } from "@shared/schema";
import { insertProductSchema, insertProductionOrderSchema, insertEquipmentSchema, 
         insertMaintenanceOrderSchema, insertRawMaterialSchema, insertExpenseSchema, 
         insertAccountSchema, insertCustomerSchema, insertOrderSchema, insertCompanySchema,
         insertChatRoomSchema, insertChatMessageSchema, insertChatRoomParticipantSchema,
         insertFiscalCertificateSchema, insertFiscalNCMSchema, insertFiscalCFOPSchema,
         insertFiscalCSTSchema, insertFiscalConfigSchema, insertNFeSchema,
         insertNFeItemSchema, insertNFeEventoSchema, insertProdutoFiscalSchema,
         insertMeasurementUnitSchema,
         insertEmployeeSchema, insertDepartmentSchema, insertPositionSchema,
         insertLeaveSchema, insertPayrollSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Configurar rotas do módulo fiscal
  const fiscal = fiscalController(storage);
  fiscal.configureRoutes(app);
  
  // Rotas para configuração fiscal
  app.get("/api/fiscal/config", ensurePermission('fiscal'), async (req, res) => {
    try {
      const config = await storage.getFiscalConfig();
      res.json(config || {});
    } catch (error) {
      console.error('Erro ao buscar configuração fiscal:', error);
      res.status(500).json({ message: 'Erro ao buscar configuração fiscal' });
    }
  });
  
  app.post("/api/fiscal/config", ensurePermission('fiscal'), async (req, res) => {
    try {
      const configData = req.body;
      const config = await storage.createFiscalConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error('Erro ao criar configuração fiscal:', error);
      res.status(500).json({ message: 'Erro ao criar configuração fiscal' });
    }
  });
  
  app.put("/api/fiscal/config/:id", ensurePermission('fiscal'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configData = req.body;
      const config = await storage.updateFiscalConfig(id, configData);
      res.json(config);
    } catch (error) {
      console.error('Erro ao atualizar configuração fiscal:', error);
      res.status(500).json({ message: 'Erro ao atualizar configuração fiscal' });
    }
  });
  
  // Configurar rotas para servir arquivos estáticos
  serveStaticFiles(app);
  
  // Criar servidor HTTP (usado abaixo)
  const httpServer = createServer(app);
  
  // Inicializar Socket.IO para chat em tempo real
  try {
    // Inicializar serviço Socket.IO
    const socketService = initSocketService(httpServer, storage);
    
    // Disponibilizar serviço globalmente ou passá-lo para outros controllers se necessário
    (app as any).socketService = socketService;
  } catch (socketError) {
    console.error('Erro na configuração do Socket.IO:', socketError);
  }
  
  // Configurar rotas fiscais avançadas
  setupFiscalNFeRoutes(app, storage, {
    ensureAuthenticated: ensureAuthenticated,
    ensurePermission: ensurePermission,
    ensureAdmin: ensureAdmin
  });
  
  // Configurar rotas de upload para o chat
  setupChatUploadRoutesSocket(app, storage);
  
  // API para Unidades de Medida
  app.get("/api/measurement-units", ensureAuthenticated, async (req, res) => {
    try {
      const units = await storage.getMeasurementUnits();
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Chat API - Rotas básicas necessárias para o novo Socket.IO
  
  // Rota para listar usuários
  app.get("/api/chat/users", ensureAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Formatar dados para o chat com informações específicas
      const chatUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        email: user.email,
        department: user.department || 'Geral',
        status: 'online',
        avatar: user.avatar
      }));
      
      res.json(chatUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para listar salas do usuário
  app.get("/api/chat/rooms", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const rooms = await storage.getUserChatRooms(userId);
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para criar uma sala
  app.post("/api/chat/rooms", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Criar a sala
      const room = await storage.createChatRoom({
        ...req.body,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Adicionar o criador como participante administrador
      await storage.addChatRoomParticipant(room.id, userId, 'admin');
      
      // Adicionar outros participantes, se fornecidos
      if (req.body.participants && Array.isArray(req.body.participants)) {
        for (const participantId of req.body.participants) {
          if (participantId !== userId) {
            await storage.addChatRoomParticipant(room.id, participantId, 'member');
          }
        }
      }
      
      res.status(201).json(room);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para limpar dados de teste do chat
  app.delete("/api/chat/cleanup", ensureAdmin, async (req, res) => {
    try {
      // Excluir todas as mensagens
      await db.delete(chatMessages);
      console.log("Todas as mensagens de chat foram excluídas");
      
      // Excluir salas e participantes exceto a sala padrão (ID: 14)
      await db.delete(chatRoomParticipants).where(sql`room_id != 14`);
      await db.delete(chatRooms).where(sql`id != 14`);
      console.log("Salas de chat excluídas (exceto sala padrão)");
      
      res.status(200).json({ message: "Dados de chat limpos com sucesso" });
    } catch (error) {
      console.error("Erro ao limpar dados de chat:", error);
      res.status(500).json({ message: "Erro ao limpar dados de chat" });
    }
  });
  
  // Rota para listar todos os usuários (para administradores)
  app.get("/api/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      console.log(`Listagem de usuários solicitada. Total: ${users.length}`);
      res.json(users);
    } catch (error: any) {
      console.error("Erro ao obter lista de usuários:", error);
      res.status(500).json({ message: error.message || "Erro ao obter lista de usuários" });
    }
  });
  
  // Rota para atualizar ativação de usuário
  app.patch("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const user = await storage.updateUser(id, data);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para excluir usuário
  app.delete("/api/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para atualizar senha de usuário
  app.patch("/api/users/:id/password", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Senha não fornecida" });
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.updateUser(id, { password: hashedPassword });
      res.json({ message: "Senha atualizada com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Rota para atualizar permissões de usuário
  app.patch("/api/users/:id/permissions", ensureAdmin, async (req, res) => {
    try {
      const idParam = req.params.id;
      const { permissions } = req.body;
      
      if (!permissions) {
        return res.status(400).json({ message: "Permissões não fornecidas" });
      }

      let user;
      // Verificar se o ID é um número ou um nome de usuário
      if (!isNaN(parseInt(idParam))) {
        // É um número de ID
        const numericId = parseInt(idParam);
        user = await storage.updateUser(numericId, { permissions });
      } else {
        // É um nome de usuário
        console.log(`Buscando usuário pelo username: ${idParam}`);
        const existingUser = await storage.getUserByUsername(idParam);
        
        if (!existingUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        user = await storage.updateUser(existingUser.id, { permissions });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  return httpServer;
}