// Exportar página principal
export { default as EnhancedQuotationsPage } from './pages/EnhancedQuotations';

// Exportar hooks
export { useQuotations } from './hooks/use-quotations';
export { useQuotationItems } from './hooks/use-quotation-items';
export { useSupplierQuotations } from './hooks/use-supplier-quotations';
export { usePriceSimulation } from './hooks/use-price-simulation';
export { useSharedResources } from './hooks/use-shared-resources';

// Exportar componentes
export { NewQuotationForm } from './components/NewQuotationForm';
export { QuotationList } from './components/QuotationList';
export { QuotationItemForm } from './components/QuotationItemForm';
export { QuotationItemList } from './components/QuotationItemList';
export { SupplierQuotationForm } from './components/SupplierQuotationForm';
export { SupplierQuotationList } from './components/SupplierQuotationList';
export { QuotationDetailSheet } from './components/QuotationDetailSheet';
export { BatchSupplierForm } from './components/BatchSupplierForm';
export { PriceSimulationForm } from './components/PriceSimulationForm';