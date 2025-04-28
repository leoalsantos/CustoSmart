import React, { createContext, useContext, ReactNode } from 'react';
import { useQuotationsManager } from '@/features/simple-quotations/hooks/use-quotations-manager';
import { 
  Quotation, 
  QuotationItem, 
  SupplierQuotation, 
  Supplier, 
  RawMaterial, 
  MeasurementUnit 
} from '@shared/schema';

// Define o tipo para o contexto de cotações
interface QuotationsContextType {
  // Estados
  isNewQuotationOpen: boolean;
  isItemFormOpen: boolean;
  isSupplierQuotationOpen: boolean;
  isQuotationDetailOpen: boolean;
  selectedQuotationId: number | null;
  selectedItemId: number | null;
  selectedMaterial: RawMaterial | null;
  quotationForm: {
    title: string;
    description: string;
    dueDate: string;
    status: string;
  };
  itemForm: {
    materialId: string;
    quantity: string;
    unitId: string;
    description: string;
    originalUnitType: string;
  };
  supplierQuotationForm: {
    supplierId: string;
    price: string;
    deliveryTime: string;
    notes: string;
  };
  
  // Dados
  quotations?: Quotation[];
  quotationItems?: QuotationItem[];
  supplierQuotations?: SupplierQuotation[];
  suppliers?: Supplier[];
  materials?: RawMaterial[];
  units?: MeasurementUnit[];
  
  // Estados de carregamento
  isLoading: boolean;
  quotationsLoading: boolean;
  quotationItemsLoading: boolean;
  supplierQuotationsLoading: boolean;
  
  // Setters
  setIsNewQuotationOpen: (isOpen: boolean) => void;
  setIsItemFormOpen: (isOpen: boolean) => void;
  setIsSupplierQuotationOpen: (isOpen: boolean) => void;
  setIsQuotationDetailOpen: (isOpen: boolean) => void;
  setSelectedQuotationId: (id: number | null) => void;
  setSelectedItemId: (id: number | null) => void;
  setItemForm: React.Dispatch<React.SetStateAction<{
    materialId: string;
    quantity: string;
    unitId: string;
    description: string;
    originalUnitType: string;
  }>>;
  
  // Handlers para formulários
  handleQuotationInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleItemInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSupplierQuotationInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string, formSetter: React.Dispatch<React.SetStateAction<any>>) => void;
  handleCreateQuotation: (e: React.FormEvent) => void;
  handleAddQuotationItem: (e: React.FormEvent) => void;
  handleAddSupplierQuotation: (e: React.FormEvent) => void;
  handleSelectBestQuotation: (id: number) => void;
  handleDeleteQuotationItem: (id: number) => void;
  
  // Funções auxiliares
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  
  // Funções de navegação
  openQuotationDetail: (quotationId: number) => void;
  openItemForm: (quotationId: number) => void;
  openSupplierQuotationForm: (itemId: number) => void;
  
  // Funções de reset
  resetQuotationForm: () => void;
  resetItemForm: () => void;
  resetSupplierQuotationForm: () => void;
}

// Cria o contexto com valor inicial undefined
const QuotationsContext = createContext<QuotationsContextType | undefined>(undefined);

// Props para o provider do contexto
interface QuotationsProviderProps {
  children: ReactNode;
}

// Provider que usa o hook personalizado e disponibiliza os valores para os componentes filhos
export const QuotationsProvider: React.FC<QuotationsProviderProps> = ({ children }) => {
  const quotationsManager = useQuotationsManager();
  
  return (
    <QuotationsContext.Provider value={quotationsManager}>
      {children}
    </QuotationsContext.Provider>
  );
};

// Hook personalizado para usar o contexto de cotações
export function useQuotations() {
  const context = useContext(QuotationsContext);
  
  if (context === undefined) {
    throw new Error('useQuotations must be used within a QuotationsProvider');
  }
  
  return context;
}