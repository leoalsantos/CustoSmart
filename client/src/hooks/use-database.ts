import { useCallback, useState } from 'react';
import axios from 'axios';

// Interface genérica para parâmetros de paginação
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Interface genérica para resultados paginados
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Hook para gerenciar operações de banco de dados com paginação
export function useDatabase<T>(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados com paginação
  const fetchPaginated = useCallback(
    async (params: PaginationParams): Promise<PaginatedResult<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get<PaginatedResult<T>>(endpoint, {
          params: {
            page: params.page,
            pageSize: params.pageSize,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
            ...params.filters,
          },
        });

        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // Função para buscar todos os dados (sem paginação)
  const fetchAll = useCallback(async (): Promise<T[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<T[]>(endpoint);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Função para buscar um item por ID
  const fetchById = useCallback(
    async (id: number | string): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get<T>(`${endpoint}/${id}`);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // Função para criar um novo item
  const create = useCallback(
    async (data: Partial<T>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post<T>(endpoint, data);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // Função para atualizar um item
  const update = useCallback(
    async (id: number | string, data: Partial<T>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.put<T>(`${endpoint}/${id}`, data);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  // Função para excluir um item
  const remove = useCallback(
    async (id: number | string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${endpoint}/${id}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return {
    loading,
    error,
    fetchPaginated,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}

// Hooks específicos para cada entidade do sistema
export function useUsers() {
  return useDatabase<{
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
  }>('/api/users');
}

export function useQuotations() {
  return useDatabase<{
    id: number;
    requestNumber: string;
    supplier: string;
    requestDate: string;
    deliveryDate: string;
    status: string;
    total: number;
  }>('/api/quotations');
}

export function useProducts() {
  return useDatabase<{
    id: number;
    name: string;
    code: string;
    description: string;
    price: number;
    quantity: number;
    category: string;
  }>('/api/products');
}

export function useSuppliers() {
  return useDatabase<{
    id: number;
    name: string;
    document: string;
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  }>('/api/suppliers');
}

// Adicione mais hooks específicos conforme necessário