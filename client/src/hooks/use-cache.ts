import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // Tempo de vida do cache em milissegundos
  maxSize?: number; // Tamanho máximo do cache
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheData<T> {
  [key: string]: CacheEntry<T>;
}

/**
 * Hook para gerenciar cache de dados com TTL (Time-To-Live)
 */
export function useCache<T>(options: CacheOptions = {}) {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutos por padrão
    maxSize = 100 // Máximo de 100 itens por padrão
  } = options;
  
  // Usamos useRef para manter a referência ao cache entre renderizações
  // e evitar recriações desnecessárias
  const cacheRef = useRef<CacheData<T>>({});
  const keysRef = useRef<string[]>([]);
  
  // Função para obter um item do cache
  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current[key];
    
    if (!entry) {
      return null;
    }
    
    // Verificar se o item expirou
    if (Date.now() - entry.timestamp > ttl) {
      // Remover item expirado
      delete cacheRef.current[key];
      keysRef.current = keysRef.current.filter(k => k !== key);
      return null;
    }
    
    return entry.data;
  }, [ttl]);
  
  // Função para adicionar um item ao cache
  const set = useCallback((key: string, data: T): void => {
    // Se o cache já está cheio, remover o item mais antigo
    if (keysRef.current.length >= maxSize && !cacheRef.current[key]) {
      const oldestKey = keysRef.current.shift();
      if (oldestKey) {
        delete cacheRef.current[oldestKey];
      }
    }
    
    // Adicionar ou atualizar o item no cache
    cacheRef.current[key] = {
      data,
      timestamp: Date.now()
    };
    
    // Atualizar a lista de chaves
    if (!keysRef.current.includes(key)) {
      keysRef.current.push(key);
    }
  }, [maxSize]);
  
  // Função para remover um item do cache
  const remove = useCallback((key: string): void => {
    delete cacheRef.current[key];
    keysRef.current = keysRef.current.filter(k => k !== key);
  }, []);
  
  // Função para limpar todo o cache
  const clear = useCallback((): void => {
    cacheRef.current = {};
    keysRef.current = [];
  }, []);
  
  // Função para obter o tamanho atual do cache
  const size = useCallback((): number => {
    return keysRef.current.length;
  }, []);
  
  // Função para obter todas as chaves no cache
  const keys = useCallback((): string[] => {
    return [...keysRef.current];
  }, []);
  
  // Efeito para limpar itens expirados periodicamente
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      // Identificar chaves expiradas
      keysRef.current.forEach(key => {
        const entry = cacheRef.current[key];
        if (entry && now - entry.timestamp > ttl) {
          expiredKeys.push(key);
        }
      });
      
      // Remover chaves expiradas
      expiredKeys.forEach(key => {
        delete cacheRef.current[key];
      });
      
      // Atualizar lista de chaves
      keysRef.current = keysRef.current.filter(key => !expiredKeys.includes(key));
    };
    
    // Executar limpeza a cada metade do TTL
    const interval = setInterval(cleanup, ttl / 2);
    
    return () => {
      clearInterval(interval);
    };
  }, [ttl]);
  
  return {
    get,
    set,
    remove,
    clear,
    size,
    keys
  };
}

/**
 * Hook para memorizar o resultado de uma função assíncrona
 */
export function useMemoizedAsync<T, P extends any[]>(
  asyncFn: (...args: P) => Promise<T>,
  deps: React.DependencyList = [],
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const cache = useCache<T>(options);
  
  // Função para executar a função assíncrona com cache
  const execute = useCallback(async (...args: P) => {
    try {
      setLoading(true);
      setError(null);
      
      // Criar uma chave de cache baseada nos argumentos
      const key = JSON.stringify(args);
      
      // Verificar se o resultado está em cache
      const cachedResult = cache.get(key);
      if (cachedResult) {
        setData(cachedResult);
        setLoading(false);
        return cachedResult;
      }
      
      // Executar a função assíncrona
      const result = await asyncFn(...args);
      
      // Armazenar o resultado em cache
      cache.set(key, result);
      
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, cache, ...deps]);
  
  return {
    execute,
    data,
    loading,
    error,
    clearCache: cache.clear
  };
}