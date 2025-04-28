import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { systemAuditLogs } from "@shared/schema";

// Estende a interface Request para incluir propriedades personalizadas
declare global {
  namespace Express {
    interface Request {
      originalBody?: any;
    }
  }
}

/**
 * Middleware para registrar ações de auditoria no sistema
 */
export function auditAction(action: string, entityType: string, module: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    // Sobrescreve o método send para capturar o resultado da operação
    res.send = function (body?: any): Response {
      // Restaura o método original para evitar loops infinitos
      res.send = originalSend;

      // Dados do usuário autenticado
      const userId = req.user?.id || null;
      let entityId = null;
      let details = null;

      // Tenta extrair o ID da entidade da URL
      const urlParts = req.originalUrl.split('/');
      const idParam = urlParts[urlParts.length - 1];
      if (!isNaN(Number(idParam))) {
        entityId = Number(idParam);
      } else if (action === 'create' && res.statusCode >= 200 && res.statusCode < 300) {
        // Para criações bem-sucedidas, tenta extrair o ID do corpo da resposta
        try {
          const responseBody = JSON.parse(body);
          if (responseBody && responseBody.id) {
            entityId = responseBody.id;
          }
        } catch (e) {
          // Ignora erro de parsing
        }
      }

      // Captura informações do browser/cliente
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Captura detalhes da operação
      try {
        if (action === 'create') {
          details = { created: req.body };
        } else if (action === 'update') {
          details = { 
            before: req.originalBody, // Precisa ser configurado em um middleware anterior
            after: req.body 
          };
        } else if (action === 'delete') {
          details = { deleted: req.originalBody }; // Precisa ser configurado em um middleware anterior
        }
      } catch (e) {
        details = { error: "Não foi possível capturar detalhes da operação" };
      }

      // Log de auditoria somente se a operação for bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await db.insert(systemAuditLogs).values({
            userId,
            action,
            entityType,
            entityId,
            details,
            ipAddress,
            userAgent,
            module
          });
        } catch (error) {
          console.error("Erro ao registrar log de auditoria:", error);
        }
      }

      // Continua com o envio da resposta original
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Middleware para capturar o estado original da entidade antes de uma atualização ou exclusão
 */
export function captureOriginalEntity(entityType: string, getEntityFn: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extrai o ID da URL
      const urlParts = req.originalUrl.split('/');
      const idParam = urlParts[urlParts.length - 1];
      
      if (!isNaN(Number(idParam))) {
        const entityId = Number(idParam);
        const entity = await getEntityFn(entityId);
        
        if (entity) {
          // Armazena o estado original para uso no middleware de auditoria
          req.originalBody = entity;
        }
      }
    } catch (error) {
      console.error("Erro ao capturar entidade original:", error);
    }
    
    next();
  };
}