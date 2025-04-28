import { Express, Request, Response } from "express";
import { desc, eq, like, and, or, sql } from "drizzle-orm";
import { db } from "../db";
import { systemAuditLogs, chatAuditLogs, users } from "@shared/schema";

// Middleware para verificar permissão de administrador
const ensurePermission = (permission: string) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const user = req.user as any;
    if (!user || !user.permissions || !user.permissions[permission]) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    next();
  };
};

export function setupAuditRoutes(app: Express) {
  // Verificação de permissão para acesso aos logs de auditoria do sistema
  const adminOnly = ensurePermission("admin");

  // Obter logs de auditoria do sistema
  app.get("/api/system-audit-logs", adminOnly, async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        sortBy = "timestamp",
        sortOrder = "desc",
        module,
        entityType,
        action,
        userId,
        startDate,
        endDate,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Construir a query base
      let query = db.select({
        audit: systemAuditLogs,
        userName: users.username
      })
      .from(systemAuditLogs)
      .leftJoin(users, eq(systemAuditLogs.userId, users.id));
      
      // Aplicar filtros
      const conditions = [];
      
      if (module) {
        conditions.push(eq(systemAuditLogs.module, module as string));
      }
      
      if (entityType) {
        conditions.push(eq(systemAuditLogs.entityType, entityType as string));
      }
      
      if (action) {
        conditions.push(eq(systemAuditLogs.action, action as string));
      }
      
      if (userId) {
        conditions.push(eq(systemAuditLogs.userId, parseInt(userId as string)));
      }
      
      if (startDate && endDate) {
        conditions.push(
          and(
            sql`${systemAuditLogs.timestamp} >= ${new Date(startDate as string).toISOString()}`,
            sql`${systemAuditLogs.timestamp} <= ${new Date(endDate as string).toISOString()}`
          )
        );
      } else if (startDate) {
        conditions.push(sql`${systemAuditLogs.timestamp} >= ${new Date(startDate as string).toISOString()}`);
      } else if (endDate) {
        conditions.push(sql`${systemAuditLogs.timestamp} <= ${new Date(endDate as string).toISOString()}`);
      }
      
      // Busca textual
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(users.username, searchTerm),
            like(systemAuditLogs.entityType, searchTerm),
            like(systemAuditLogs.action, searchTerm),
            like(systemAuditLogs.module, searchTerm)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Aplicar ordenação
      if (sortOrder.toLowerCase() === "asc") {
        query = query.orderBy(systemAuditLogs[sortBy as keyof typeof systemAuditLogs]);
      } else {
        query = query.orderBy(desc(systemAuditLogs[sortBy as keyof typeof systemAuditLogs]));
      }
      
      // Aplicar paginação
      query = query.limit(limitNum).offset(offset);
      
      // Executar a query
      const logs = await query;
      
      // Contagem total para paginação
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(systemAuditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // Mapear resultado para um formato mais amigável
      const formattedLogs = logs.map(({ audit, userName }) => ({
        id: audit.id,
        timestamp: audit.timestamp,
        user: userName || "Sistema",
        userId: audit.userId,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId,
        details: audit.details,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        module: audit.module
      }));
      
      return res.status(200).json({
        logs: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      console.error("Erro ao obter logs de auditoria:", error);
      return res.status(500).json({ message: "Erro ao obter logs de auditoria" });
    }
  });

  // Obter logs de auditoria de chat
  app.get("/api/chat-audit-logs", adminOnly, async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        sortBy = "timestamp",
        sortOrder = "desc",
        action,
        userId,
        roomId,
        startDate,
        endDate
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Construir a query base
      let query = db.select({
        audit: chatAuditLogs,
        userName: users.username
      })
      .from(chatAuditLogs)
      .leftJoin(users, eq(chatAuditLogs.userId, users.id));
      
      // Aplicar filtros
      const conditions = [];
      
      if (action) {
        conditions.push(eq(chatAuditLogs.action, action as string));
      }
      
      if (userId) {
        conditions.push(eq(chatAuditLogs.userId, parseInt(userId as string)));
      }
      
      if (roomId) {
        conditions.push(eq(chatAuditLogs.roomId, parseInt(roomId as string)));
      }
      
      if (startDate && endDate) {
        conditions.push(
          and(
            sql`${chatAuditLogs.timestamp} >= ${new Date(startDate as string).toISOString()}`,
            sql`${chatAuditLogs.timestamp} <= ${new Date(endDate as string).toISOString()}`
          )
        );
      } else if (startDate) {
        conditions.push(sql`${chatAuditLogs.timestamp} >= ${new Date(startDate as string).toISOString()}`);
      } else if (endDate) {
        conditions.push(sql`${chatAuditLogs.timestamp} <= ${new Date(endDate as string).toISOString()}`);
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Aplicar ordenação
      if (sortOrder.toLowerCase() === "asc") {
        query = query.orderBy(chatAuditLogs[sortBy as keyof typeof chatAuditLogs]);
      } else {
        query = query.orderBy(desc(chatAuditLogs[sortBy as keyof typeof chatAuditLogs]));
      }
      
      // Aplicar paginação
      query = query.limit(limitNum).offset(offset);
      
      // Executar a query
      const logs = await query;
      
      // Contagem total para paginação
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatAuditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const totalCount = totalCountResult[0]?.count || 0;
      
      // Mapear resultado para um formato mais amigável
      const formattedLogs = logs.map(({ audit, userName }) => ({
        id: audit.id,
        timestamp: audit.timestamp,
        user: userName || "Sistema",
        userId: audit.userId,
        action: audit.action,
        roomId: audit.roomId,
        messageId: audit.messageId,
        originalContent: audit.originalContent,
        newContent: audit.newContent
      }));
      
      return res.status(200).json({
        logs: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      console.error("Erro ao obter logs de auditoria de chat:", error);
      return res.status(500).json({ message: "Erro ao obter logs de auditoria de chat" });
    }
  });
}