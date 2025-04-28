import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationState } from '@/hooks/use-pagination';

export interface PaginationProps {
  pagination: PaginationState;
  totalItems: number;
  totalPages: number;
  canGoToPrevPage: boolean;
  canGoToNextPage: boolean;
  getPageNumbers: () => number[];
  goToFirstPage: () => void;
  goToPage: (page: number) => void;
  goToLastPage: () => void;
  prevPage: () => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
  className?: string;
}

export function Pagination({
  pagination,
  totalItems,
  totalPages,
  canGoToPrevPage,
  canGoToNextPage,
  getPageNumbers,
  goToFirstPage,
  goToPage,
  goToLastPage,
  prevPage,
  nextPage,
  setPageSize,
  showPageSizeSelector = true,
  showItemCount = true,
  className = '',
}: PaginationProps) {
  const { currentPage, pageSize, pageSizeOptions } = pagination;
  const pageNumbers = getPageNumbers();
  
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 ${className}`}>
      {showItemCount && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {startItem}-{endItem} de {totalItems} itens
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToFirstPage}
          disabled={!canGoToPrevPage}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={!canGoToPrevPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {pageNumbers.map((pageNumber, idx) =>
          pageNumber === -1 ? (
            <span key={`ellipsis-${idx}`} className="px-2">
              ...
            </span>
          ) : (
            <Button
              key={pageNumber}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNumber)}
              aria-label={`Página ${pageNumber}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          )
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={!canGoToNextPage}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToLastPage}
          disabled={!canGoToNextPage}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      
      {showPageSizeSelector && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Itens por página:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}