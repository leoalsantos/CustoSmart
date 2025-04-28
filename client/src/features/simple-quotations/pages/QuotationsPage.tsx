import React from 'react';
import { useQuotationsManager } from '../hooks/use-quotations-manager';
import { PaginatedQuotationList } from '../components/PaginatedQuotationList';
import { NewQuotationForm } from '../components/NewQuotationForm';
import { QuotationItemForm } from '../components/QuotationItemForm';
import PageTitle from '@/components/common/PageTitle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

/**
 * Componente principal para a página de cotações
 * Implementa o padrão Container-Presentational, onde este componente:
 * 1. Gerencia o estado através do hook useQuotationsManager
 * 2. Coordena a interação entre diferentes componentes da UI
 * 3. Renderiza e organiza os componentes de apresentação
 */
const QuotationsPage: React.FC = () => {
  const quotationsManager = useQuotationsManager();
  const {
    // Estados
    isNewQuotationOpen,
    isItemFormOpen,
    isSupplierQuotationOpen,
    isQuotationDetailOpen,
    selectedQuotationId,
    selectedItemId,
    selectedMaterial,
    quotationForm,
    itemForm,
    supplierQuotationForm,
    
    // Dados
    quotations,
    quotationItems,
    supplierQuotations,
    suppliers,
    materials,
    units,
    
    // Estados de carregamento
    isLoading,
    quotationsLoading,
    quotationItemsLoading,
    supplierQuotationsLoading,
    
    // Setters
    setIsNewQuotationOpen,
    setIsItemFormOpen,
    setIsSupplierQuotationOpen,
    setIsQuotationDetailOpen,
    setSelectedQuotationId,
    setItemForm,
    
    // Handlers para formulários
    handleQuotationInputChange,
    handleItemInputChange,
    handleSupplierQuotationInputChange,
    handleSelectChange,
    handleCreateQuotation,
    handleAddQuotationItem,
    handleAddSupplierQuotation,
    handleSelectBestQuotation,
    handleDeleteQuotationItem,
    
    // Funções auxiliares
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusLabel,
    
    // Funções de navegação
    openQuotationDetail,
    openItemForm,
    openSupplierQuotationForm,
    
    // Mutações
    createQuotationMutation,
    createQuotationItemMutation,
  } = quotationsManager;

  // Função para renderizar detalhes de uma cotação específica
  const renderQuotationDetails = () => {
    if (!selectedQuotationId) return null;
    
    const quotation = quotations?.find(q => q.id === selectedQuotationId);
    if (!quotation) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{quotation.quotationNumber}</h2>
            <div className="text-sm text-gray-500">
              Criada em: {formatDate(quotation.creationDate || '')}
            </div>
            {quotation.closingDate && (
              <div className="text-sm text-gray-500">
                Data Limite: {formatDate(quotation.closingDate)}
              </div>
            )}
            <div className="mt-1">
              <Badge variant="outline" className={getStatusColor(quotation.status)}>
                {getStatusLabel(quotation.status)}
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={() => openItemForm(selectedQuotationId)}
            disabled={quotation.status !== 'open'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
        
        {quotation.notes && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-1">Observações</h3>
            <p className="text-sm">{quotation.notes}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="font-medium mb-3">Itens da Cotação</h3>
          
          {quotationItemsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !quotationItems || quotationItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
              <p>Nenhum item adicionado a esta cotação.</p>
              <p className="text-sm mt-2">
                Clique em "Adicionar Item" para incluir matérias-primas nesta cotação.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotationItems.map(item => {
                const material = materials?.find(m => m.id === item.materialId);
                const unit = units?.find(u => u.id === item.unitId);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{material?.name || 'Material'}</CardTitle>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openSupplierQuotationForm(item.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Proposta
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteQuotationItem(item.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Código: {material?.code} | Quantidade: {item.quantity} {unit?.symbol}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-2">
                      <Tabs defaultValue="proposals">
                        <TabsList>
                          <TabsTrigger value="proposals">Propostas</TabsTrigger>
                          <TabsTrigger value="details">Detalhes</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="proposals" className="pt-4">
                          {supplierQuotations?.filter(sq => sq.quotationItemId === item.id).length === 0 ? (
                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                              <p>Nenhuma proposta de fornecedor para este item.</p>
                              <p className="text-sm mt-1">
                                Clique em "Proposta" para adicionar cotações de fornecedores.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {supplierQuotations
                                ?.filter(sq => sq.quotationItemId === item.id)
                                .map(supplierQuotation => {
                                  const supplier = suppliers?.find(s => s.id === supplierQuotation.supplierId);
                                  
                                  return (
                                    <div 
                                      key={supplierQuotation.id} 
                                      className={`p-3 rounded-md border ${supplierQuotation.isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                                    >
                                      <div className="flex justify-between">
                                        <div>
                                          <div className="font-medium">{supplier?.name || 'Fornecedor'}</div>
                                          <div className="text-sm text-gray-500">
                                            Preço: {formatCurrency(supplierQuotation.unitPrice)}
                                            {supplierQuotation.deliveryTime > 0 && ` | Entrega: ${supplierQuotation.deliveryTime} dias`}
                                          </div>
                                        </div>
                                        
                                        {!supplierQuotation.isSelected && (
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleSelectBestQuotation(supplierQuotation.id)}
                                          >
                                            Selecionar
                                          </Button>
                                        )}
                                        
                                        {supplierQuotation.isSelected && (
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            Selecionada
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="details" className="pt-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">Material</h4>
                              <p className="text-sm">{material?.name}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">Código</h4>
                              <p className="text-sm">{material?.code}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">Quantidade</h4>
                              <p className="text-sm">{item.quantity} {unit?.symbol}</p>
                            </div>
                            
                            {material?.description && (
                              <div>
                                <h4 className="font-medium">Descrição do Material</h4>
                                <p className="text-sm">{material.description}</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle 
        title="Cotações de Compras" 
        subtitle="Gerenciamento de cotações com fornecedores"
        icon={<ShoppingCart className="h-6 w-6" />}
      />
      
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsNewQuotationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Cotação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cotações</CardTitle>
          <CardDescription>
            Lista de cotações de compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedQuotationList
            quotations={quotations}
            isLoading={quotationsLoading}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            formatDate={formatDate}
            onViewDetails={openQuotationDetail}
            onAddItem={openItemForm}
          />
        </CardContent>
      </Card>
      
      {/* Modal para criar nova cotação */}
      <Dialog open={isNewQuotationOpen} onOpenChange={setIsNewQuotationOpen}>
        <DialogContent>
          <NewQuotationForm
            quotationForm={quotationForm}
            handleInputChange={handleQuotationInputChange}
            handleSubmit={handleCreateQuotation}
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
            materials={materials}
            units={units}
            selectedMaterial={selectedMaterial}
            handleInputChange={handleItemInputChange}
            handleSelectChange={handleSelectChange}
            handleSubmit={handleAddQuotationItem}
            setItemForm={setItemForm}
            isLoading={createQuotationItemMutation.isPending}
            onCancel={() => setIsItemFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Painel lateral para detalhes da cotação */}
      <Sheet open={isQuotationDetailOpen} onOpenChange={setIsQuotationDetailOpen}>
        <SheetContent className="w-[90%] sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Cotação</SheetTitle>
            <SheetDescription>
              Gerencie os itens e propostas desta cotação.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            {renderQuotationDetails()}
          </div>
          
          <SheetFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsQuotationDetailOpen(false)}
            >
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Sheet para formulário de proposta de fornecedor */}
      <Sheet open={isSupplierQuotationOpen} onOpenChange={setIsSupplierQuotationOpen}>
        <SheetContent className="w-[90%] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nova Proposta de Fornecedor</SheetTitle>
            <SheetDescription>
              Adicione uma proposta de fornecedor para o item selecionado.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleAddSupplierQuotation} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="supplierId" className="text-sm font-medium">
                Fornecedor
              </label>
              <select
                id="supplierId"
                name="supplierId"
                className="w-full p-2 border rounded-md"
                value={supplierQuotationForm.supplierId}
                onChange={handleSupplierQuotationInputChange}
                required
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers?.map(supplier => (
                  <option key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Preço Unitário (R$)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                className="w-full p-2 border rounded-md"
                value={supplierQuotationForm.price}
                onChange={handleSupplierQuotationInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="deliveryTime" className="text-sm font-medium">
                Prazo de Entrega (dias)
              </label>
              <input
                id="deliveryTime"
                name="deliveryTime"
                type="number"
                min="0"
                className="w-full p-2 border rounded-md"
                value={supplierQuotationForm.deliveryTime}
                onChange={handleSupplierQuotationInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                className="w-full p-2 border rounded-md"
                value={supplierQuotationForm.notes}
                onChange={handleSupplierQuotationInputChange}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSupplierQuotationOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Proposta
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default QuotationsPage;