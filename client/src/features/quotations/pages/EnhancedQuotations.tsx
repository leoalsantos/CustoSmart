import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/common/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Plus, FileText } from 'lucide-react';

// Hooks personalizados
import { useQuotations } from '../hooks/use-quotations';
import { useQuotationItems } from '../hooks/use-quotation-items';
import { useSupplierQuotations } from '../hooks/use-supplier-quotations';
import { usePriceSimulation } from '../hooks/use-price-simulation';
import { useSharedResources } from '../hooks/use-shared-resources';

// Componentes
import { NewQuotationForm } from '../components/NewQuotationForm';
import { QuotationList } from '../components/QuotationList';
import { QuotationItemForm } from '../components/QuotationItemForm';
import { SupplierQuotationForm } from '../components/SupplierQuotationForm';
import { SupplierQuotationList } from '../components/SupplierQuotationList';
import { QuotationDetailSheet } from '../components/QuotationDetailSheet';
import { BatchSupplierForm } from '../components/BatchSupplierForm';
import { PriceSimulationForm } from '../components/PriceSimulationForm';

const EnhancedQuotationsPage: React.FC = () => {
  // Estado para controlar modais e sheets
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSupplierQuotationOpen, setIsSupplierQuotationOpen] = useState(false);
  const [isQuotationDetailOpen, setIsQuotationDetailOpen] = useState(false);
  const [isBatchSupplierModalOpen, setIsBatchSupplierModalOpen] = useState(false);
  const [isPriceSimulationOpen, setIsPriceSimulationOpen] = useState(false);
  
  // Estado para rastrear o ID da cotação selecionada
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);

  // Hooks para buscar recursos compartilhados
  const {
    suppliers,
    suppliersLoading,
    materials,
    materialsLoading,
    units,
    unitsLoading,
    products,
    productsLoading
  } = useSharedResources();

  // Hook para gerenciar cotações
  const {
    quotations,
    quotationsLoading,
    quotationForm,
    createQuotationMutation,
    closeQuotationMutation,
    handleQuotationInputChange,
    createQuotation,
    resetQuotationForm,
  } = useQuotations();

  // Hook para gerenciar itens de cotação
  const {
    quotationItems,
    quotationItemsLoading,
    selectedItemId,
    setSelectedItemId,
    selectedMaterial,
    itemForm,
    createQuotationItemMutation,
    deleteQuotationItemMutation,
    handleItemInputChange,
    handleMaterialSelect,
    createQuotationItem,
    resetItemForm,
  } = useQuotationItems(selectedQuotationId, materials, units);

  // Hook para gerenciar cotações de fornecedores
  const {
    supplierQuotations,
    supplierQuotationsLoading,
    supplierQuotationForm,
    batchSupplierForm,
    createSupplierQuotationMutation,
    selectBestQuotationMutation,
    updateMaterialPriceMutation,
    handleSupplierQuotationInputChange,
    toggleBatchSupplier,
    createSupplierQuotation,
    sendBatchQuotationRequests,
    resetSupplierQuotationForm,
    setBatchSupplierForm,
  } = useSupplierQuotations(selectedItemId);

  // Hook para simulação de preços
  const {
    selectedProduct,
    simulationForm,
    simulationResults,
    simulatePricingMutation,
    handleSimulationInputChange,
    handleSimulationCheckboxChange,
    handleProductSelect,
    runPriceSimulation,
    resetSimulation,
  } = usePriceSimulation();

  // Handlers para selecionar unidade
  const handleUnitSelect = (value: string) => {
    if (!units) return;
    
    itemForm.unitId = value;
  };

  // Handler para selecionar fornecedor
  const handleSupplierSelect = (value: string) => {
    if (!suppliers) return;
    
    supplierQuotationForm.supplierId = value;
  };

  // Buscar a cotação selecionada
  const selectedQuotation = quotations?.find(q => q.id === selectedQuotationId);
  
  // Buscar o item selecionado
  const selectedItem = quotationItems?.find(item => item.id === selectedItemId);

  // Handlers para abrir/fechar modais
  const openQuotationDetail = (quotationId: number) => {
    setSelectedQuotationId(quotationId);
    setIsQuotationDetailOpen(true);
  };

  const closeQuotationDetail = () => {
    setIsQuotationDetailOpen(false);
    setSelectedQuotationId(null);
    setSelectedItemId(null);
  };

  const openItemForm = () => {
    resetItemForm();
    setIsItemFormOpen(true);
  };

  const openSupplierQuotationForm = (itemId: number) => {
    setSelectedItemId(itemId);
    resetSupplierQuotationForm();
    setIsSupplierQuotationOpen(true);
  };

  const openBatchSupplierModal = () => {
    setBatchSupplierForm({ supplierIds: [] });
    setIsBatchSupplierModalOpen(true);
  };

  const openPriceSimulation = () => {
    resetSimulation();
    setIsPriceSimulationOpen(true);
  };

  const closeQuotation = () => {
    if (!selectedQuotationId) return;
    
    closeQuotationMutation.mutate(selectedQuotationId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle 
          title="Cotações Avançadas" 
          description="Gerencie cotações de compra e analise propostas de fornecedores" 
        />
        
        <Button onClick={() => setIsNewQuotationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cotação
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <QuotationList
            quotations={quotations}
            isLoading={quotationsLoading}
            onViewDetails={openQuotationDetail}
            onCloseQuotation={(id) => {
              setSelectedQuotationId(id);
              closeQuotationMutation.mutate(id);
            }}
          />
        </CardContent>
      </Card>
      
      {/* Modal para criar nova cotação */}
      <Dialog open={isNewQuotationOpen} onOpenChange={setIsNewQuotationOpen}>
        <DialogContent>
          <NewQuotationForm
            quotationForm={quotationForm}
            handleInputChange={handleQuotationInputChange}
            handleSubmit={createQuotation}
            isLoading={createQuotationMutation.isPending}
            onCancel={() => setIsNewQuotationOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar item à cotação */}
      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent>
          <QuotationItemForm
            itemForm={itemForm}
            selectedMaterial={selectedMaterial}
            materials={materials}
            units={units}
            handleInputChange={handleItemInputChange}
            handleMaterialSelect={handleMaterialSelect}
            handleUnitSelect={handleUnitSelect}
            handleSubmit={createQuotationItem}
            isLoading={createQuotationItemMutation.isPending}
            materialsLoading={materialsLoading}
            unitsLoading={unitsLoading}
            onCancel={() => setIsItemFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar proposta de fornecedor */}
      <Dialog open={isSupplierQuotationOpen} onOpenChange={setIsSupplierQuotationOpen}>
        <DialogContent>
          <SupplierQuotationForm
            supplierQuotationForm={supplierQuotationForm}
            suppliers={suppliers}
            selectedItem={selectedItem}
            handleInputChange={handleSupplierQuotationInputChange}
            handleSupplierSelect={handleSupplierSelect}
            handleSubmit={createSupplierQuotation}
            isLoading={createSupplierQuotationMutation.isPending}
            suppliersLoading={suppliersLoading}
            onCancel={() => setIsSupplierQuotationOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para envio em lote para fornecedores */}
      <Dialog open={isBatchSupplierModalOpen} onOpenChange={setIsBatchSupplierModalOpen}>
        <DialogContent>
          <BatchSupplierForm
            supplierIds={batchSupplierForm.supplierIds}
            suppliers={suppliers}
            selectedItem={selectedItem}
            toggleSupplier={toggleBatchSupplier}
            handleSubmit={sendBatchQuotationRequests}
            isLoading={false} // Implementar estado de loading para envio em lote
            suppliersLoading={suppliersLoading}
            onCancel={() => setIsBatchSupplierModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal para simulação de preços */}
      <Dialog open={isPriceSimulationOpen} onOpenChange={setIsPriceSimulationOpen}>
        <DialogContent className="max-w-2xl">
          <PriceSimulationForm
            simulationForm={simulationForm}
            products={products}
            selectedProduct={selectedProduct}
            simulationResults={simulationResults}
            handleInputChange={handleSimulationInputChange}
            handleCheckboxChange={handleSimulationCheckboxChange}
            handleProductSelect={(value) => handleProductSelect(value, products)}
            handleSubmit={runPriceSimulation}
            isLoading={simulatePricingMutation.isPending}
            productsLoading={productsLoading}
            onCancel={() => setIsPriceSimulationOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Sheet para detalhes da cotação */}
      <Sheet open={isQuotationDetailOpen} onOpenChange={setIsQuotationDetailOpen}>
        <SheetContent side="right" className="w-full max-w-3xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <QuotationDetailSheet
            selectedQuotation={selectedQuotation}
            quotationItems={quotationItems}
            selectedItemId={selectedItemId}
            selectedMaterial={selectedMaterial}
            isLoading={closeQuotationMutation.isPending}
            itemsLoading={quotationItemsLoading}
            supplierQuotationsLoading={supplierQuotationsLoading}
            onAddItem={openItemForm}
            onAddSupplierQuotation={openSupplierQuotationForm}
            onDeleteItem={(id) => deleteQuotationItemMutation.mutate(id)}
            onSelectQuotation={(id) => selectBestQuotationMutation.mutate(id)}
            onUpdateMaterialPrice={(materialId, price) => 
              updateMaterialPriceMutation.mutate({ materialId, price })}
            onCloseQuotation={closeQuotation}
            onPriceSimulation={openPriceSimulation}
            onClose={closeQuotationDetail}
          >
            {/* Conteúdo da aba de propostas */}
            <SupplierQuotationList
              supplierQuotations={supplierQuotations}
              isLoading={supplierQuotationsLoading}
              quotationClosed={selectedQuotation?.status === 'closed'}
              selectedMaterial={selectedMaterial}
              onSelectQuotation={(id) => selectBestQuotationMutation.mutate(id)}
              onUpdateMaterialPrice={(materialId, price) => 
                updateMaterialPriceMutation.mutate({ materialId, price })}
            />
          </QuotationDetailSheet>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EnhancedQuotationsPage;