import React from 'react';
import { QuotationList } from './QuotationList';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/use-pagination';
import { Quotation } from '@shared/schema';

interface PaginatedQuotationListProps {
  quotations: Quotation[] | undefined;
  isLoading: boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatDate: (dateString: string) => string;
  onViewDetails: (quotationId: number) => void;
  onAddItem: (quotationId: number) => void;
  onCloseQuotation?: (quotationId: number) => void;
  onDeleteQuotation?: (quotationId: number) => void;
  className?: string;
}

export const PaginatedQuotationList: React.FC<PaginatedQuotationListProps> = ({
  quotations,
  isLoading,
  getStatusColor,
  getStatusLabel,
  formatDate,
  onViewDetails,
  onAddItem,
  onCloseQuotation,
  onDeleteQuotation,
  className = '',
}) => {
  const {
    paginatedItems,
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
  } = usePagination<Quotation>(quotations || [], {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <QuotationList
        quotations={paginatedItems}
        isLoading={isLoading}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
        formatDate={formatDate}
        onViewDetails={onViewDetails}
        onAddItem={onAddItem}
        onCloseQuotation={onCloseQuotation}
        onDeleteQuotation={onDeleteQuotation}
      />
      
      {!isLoading && quotations && quotations.length > 0 && (
        <Pagination
          pagination={pagination}
          totalItems={totalItems}
          totalPages={totalPages}
          canGoToPrevPage={canGoToPrevPage}
          canGoToNextPage={canGoToNextPage}
          getPageNumbers={getPageNumbers}
          goToFirstPage={goToFirstPage}
          goToPage={goToPage}
          goToLastPage={goToLastPage}
          prevPage={prevPage}
          nextPage={nextPage}
          setPageSize={setPageSize}
        />
      )}
    </div>
  );
};