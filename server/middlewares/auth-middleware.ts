import { Request, Response, NextFunction } from "express";

// Middleware para verificar se o usuário está autenticado
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}

// Middleware para verificar se o usuário tem papel de administrador
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Necessário papel de administrador." });
  }
  
  next();
}

// Middleware para verificar permissões específicas
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (!req.user) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    // Se for admin, tem acesso a tudo
    if (req.user.role === "admin") {
      return next();
    }
    
    // Verificar permissão específica
    const userPermissions = req.user.permissions as Record<string, boolean>;
    if (!userPermissions || !userPermissions[permission]) {
      return res.status(403).json({ message: `Acesso negado. Permissão '${permission}' necessária.` });
    }
    
    next();
  };
}