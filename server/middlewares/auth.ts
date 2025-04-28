import { Request, Response, NextFunction } from 'express';

// Middleware para garantir que o usuário esteja autenticado
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar permissões
export function ensurePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const user = req.user as Express.User;
    
    // Se o usuário for admin, tem todas as permissões
    if (user.role === 'admin') {
      return next();
    }
    
    // Verificar permissões específicas
    // Implementação simplificada, pode ser expandida conforme necessário
    if (user.role === permission || 
        (user.permissions && typeof user.permissions === 'object' && 
        (user.permissions as any)[permission])) {
      return next();
    }
    
    res.status(403).json({ message: "Acesso negado. Permissão necessária: " + permission });
  };
}

// Middleware para verificar se o usuário é admin
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  const user = req.user as Express.User;
  
  if (user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
}