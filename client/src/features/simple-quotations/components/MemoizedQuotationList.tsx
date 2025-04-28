import { QuotationList } from './QuotationList';
import { memoizeComponent, withMemoizedListRendering } from '@/utils/optimizations';
import { Quotation } from '@shared/schema';

// Versão memoizada do componente de lista de cotações
export const MemoizedQuotationList = memoizeComponent(
  withMemoizedListRendering<any>(
    QuotationList,
    (item: Quotation) => item.id
  ),
  (prevProps, nextProps) => {
    // Comparação personalizada para determinar se é necessário re-renderizar
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.quotations?.length !== nextProps.quotations?.length) return false;
    
    // Se chegarmos até aqui, comparamos apenas se as referências são iguais
    if (prevProps.quotations === nextProps.quotations &&
        prevProps.onViewDetails === nextProps.onViewDetails &&
        prevProps.onAddItem === nextProps.onAddItem &&
        prevProps.onCloseQuotation === nextProps.onCloseQuotation &&
        prevProps.onDeleteQuotation === nextProps.onDeleteQuotation) {
      return true;
    }
    
    return false;
  }
);