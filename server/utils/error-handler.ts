import { Request, Response, NextFunction } from 'express';

// Tipos de erros personalizados
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Erros operacionais são esperados e podem ser tratados
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string>) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}

// Middleware para capturar erros em rotas assíncronas
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware global de tratamento de erros
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);
  
  // Erros de validação do Drizzle ou outras bibliotecas
  if (err.name === 'DrizzleError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.errors || { general: err.message }
    });
  }
  
  // Erros personalizados da aplicação
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err instanceof ValidationError ? err.errors : undefined
    });
  }
  
  // Erros de banco de dados
  if (err.code && (err.code.startsWith('23') || err.code.startsWith('42'))) {
    let message = 'Erro de banco de dados';
    
    // Mapear códigos de erro comuns do PostgreSQL
    switch (err.code) {
      case '23505': // unique_violation
        message = 'Registro duplicado';
        break;
      case '23503': // foreign_key_violation
        message = 'Violação de chave estrangeira';
        break;
      case '42P01': // undefined_table
        message = 'Tabela não encontrada';
        break;
      case '42703': // undefined_column
        message = 'Coluna não encontrada';
        break;
    }
    
    return res.status(400).json({
      success: false,
      message,
      detail: err.detail || err.message
    });
  }
  
  // Tratamento de erro genérico para ambientes de produção
  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    detail: isProduction ? undefined : err.message,
    stack: isProduction ? undefined : err.stack
  });
};

// Middleware para rotas não encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);
  next(err);
};