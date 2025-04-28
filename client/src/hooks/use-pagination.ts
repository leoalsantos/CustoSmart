import { useState, useMemo, useCallback } from 'react';

interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  pageSizeOptions: number[];
}

export interface PaginationHelpers<T> {
  // Estado atual da paginação
  pagination: PaginationState;
  
  // Dados paginados
  paginatedItems: T[];
  
  // Informações de paginação
  totalItems: number;
  totalPages: number;
  
  // Funções para manipular a paginação
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  
  // Funções auxiliares
  canGoToNextPage: boolean;
  canGoToPrevPage: boolean;
  getPageNumbers: () => number[];
}

export function usePagination<T>(
  items: T[] = [],
  config: PaginationConfig = {}
): PaginationHelpers<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
  } = config;

  // Estado da paginação
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calcular valores derivados
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Garantir que a página atual é válida
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  // Se a página atual for diferente da página segura, atualizar o estado
  if (currentPage !== safeCurrentPage) {
    setCurrentPage(safeCurrentPage);
  }

  // Calcular itens paginados
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    return items.slice(startIndex, endIndex);
  }, [items, safeCurrentPage, pageSize, totalItems]);

  // Funções para manipular a paginação
  const nextPage = useCallback(() => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(safeCurrentPage + 1);
    }
  }, [safeCurrentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (safeCurrentPage > 1) {
      setCurrentPage(safeCurrentPage - 1);
    }
  }, [safeCurrentPage]);

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Handler para alterar o tamanho da página
  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    // Ajustar a página atual para manter a visualização dos mesmos itens quando possível
    const itemsCount = totalItems;
    const firstItemIndex = (safeCurrentPage - 1) * pageSize;
    const newPage = Math.floor(firstItemIndex / size) + 1;
    setCurrentPage(Math.min(newPage, Math.ceil(itemsCount / size) || 1));
  }, [totalItems, safeCurrentPage, pageSize]);

  // Gerar array de números de página para navegação
  const getPageNumbers = useCallback(() => {
    const maxVisiblePages = 5; // Número máximo de botões de página visíveis
    const pages: number[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Se o total de páginas for menor que o máximo visível, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Cálculo para mostrar páginas ao redor da página atual
      let startPage = Math.max(safeCurrentPage - Math.floor(maxVisiblePages / 2), 1);
      let endPage = startPage + maxVisiblePages - 1;
      
      // Ajuste se o fim for maior que o total
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - maxVisiblePages + 1, 1);
      }
      
      // Adicionar primeira página se não estiver incluída
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push(-1); // Uso de -1 como marcador para "..."
        }
      }
      
      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Adicionar última página se não estiver incluída
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(-1); // Uso de -1 como marcador para "..."
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, safeCurrentPage]);

  return {
    pagination: {
      currentPage: safeCurrentPage,
      pageSize,
      pageSizeOptions,
    },
    paginatedItems,
    totalItems,
    totalPages,
    setCurrentPage: goToPage,
    setPageSize: handleSetPageSize,
    nextPage,
    prevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    canGoToNextPage: safeCurrentPage < totalPages,
    canGoToPrevPage: safeCurrentPage > 1,
    getPageNumbers,
  };
}