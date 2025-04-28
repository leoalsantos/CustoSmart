import { Request } from 'express';
import { SQL, SQLWrapper } from 'drizzle-orm';
import { db } from '../db';

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Extrai parâmetros de paginação da requisição
 */
export function getPaginationParams(req: Request): PaginationOptions {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const sortBy = req.query.sortBy as string;
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

  return {
    page: Math.max(1, page), // Garantir que page seja pelo menos 1
    pageSize: Math.min(100, Math.max(1, pageSize)), // Limitar page size entre 1 e 100
    sortBy,
    sortOrder,
  };
}

/**
 * Executa uma consulta com paginação
 */
export async function paginateQuery<T>(
  baseQuery: SQLWrapper, 
  countQuery: SQLWrapper,
  options: PaginationOptions,
  mapFunction?: (item: any) => T
): Promise<PaginatedResult<T>> {
  const { page = 1, pageSize = 10 } = options;
  
  // Calcular offset para a consulta
  const offset = (page - 1) * pageSize;
  
  // Executar consulta para contar o total de registros
  const [countResult] = await db.select({ count: countQuery }).execute();
  const total = Number(countResult?.count || 0);
  
  // Executar consulta principal com paginação
  const result = await db
    .select()
    .from(baseQuery)
    .limit(pageSize)
    .offset(offset)
    .execute();
  
  // Mapear os resultados se uma função de mapeamento for fornecida
  const data = mapFunction ? result.map(mapFunction) : (result as T[]);
  
  // Calcular o total de páginas
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Constrói parte da consulta para ordenação dinâmica
 */
export function buildOrderBy(
  table: any,
  options: PaginationOptions
): SQL | undefined {
  const { sortBy, sortOrder } = options;
  
  if (!sortBy || !table[sortBy]) {
    return undefined;
  }
  
  return sortOrder === 'desc' ? table[sortBy].desc() : table[sortBy].asc();
}