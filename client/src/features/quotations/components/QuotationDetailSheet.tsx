import React, { useState } from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlusCircle, FileText, CheckCircle, Calculator } from 'lucide-react';
import { Quotation, QuotationItem, RawMaterial } from '@shared/schema';
import { QuotationItemList } from './QuotationItemList';
import { SupplierQuotationList } from './SupplierQuotationList';

interface QuotationDetailSheetProps {
  selectedQuotation: Quotation | undefined;
  quotationItems: QuotationItem[] | undefined;
  selectedItemId: number | null;
  selectedMaterial: RawMaterial | null;
  isLoading: boolean;
  itemsLoading: boolean;
  supplierQuotationsLoading: boolean;
  onAddItem: () => void;
  onAddSupplierQuotation: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
  onSelectQuotation: (quotationId: number) => void;
  onUpdateMaterialPrice: (materialId: number, price: number) => void;
  onCloseQuotation: () => void;
  onPriceSimulation: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function QuotationDetailSheet({
  selectedQuotation,
  quotationItems,
  selectedItemId,
  selectedMaterial,
  isLoading,
  itemsLoading,
  supplierQuotationsLoading,
  onAddItem,
  onAddSupplierQuotation,
  onDeleteItem,
  onSelectQuotation,
  onUpdateMaterialPrice,
  onCloseQuotation,
  onPriceSimulation,
  onClose,
  children, // Conteúdo das abas (supplier quotations)
}: QuotationDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('items');
  
  // Formatar data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Detalhes da Cotação</SheetTitle>
        <SheetDescription>
          {selectedQuotation?.number} - {selectedQuotation?.title || 'Sem título'}
        </SheetDescription>
      </SheetHeader>
      
      {selectedQuotation && (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Número:</div>
              <div className="font-medium">{selectedQuotation.number}</div>
            </div>
            
            <div>
              <div className="text-muted-foreground">Status:</div>
              <div>
                <Badge variant={selectedQuotation.status === 'open' ? 'default' : 'secondary'}>
                  {selectedQuotation.status === 'open' ? 'Aberta' : 'Fechada'}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="text-muted-foreground">Data de Criação:</div>
              <div className="font-medium">{formatDate(selectedQuotation.createdAt)}</div>
            </div>
            
            <div>
              <div className="text-muted-foreground">Data de Fechamento:</div>
              <div className="font-medium">{formatDate(selectedQuotation.closingDate)}</div>
            </div>
            
            {selectedQuotation.notes && (
              <div className="col-span-2">
                <div className="text-muted-foreground">Observações:</div>
                <div className="font-medium">{selectedQuotation.notes}</div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            {selectedQuotation.status === 'open' && (
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  onClick={onAddItem}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onPriceSimulation}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Simulação de Preço
                </Button>
              </div>
            )}
            
            {selectedQuotation.status === 'open' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCloseQuotation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fechando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fechar Cotação
                  </>
                )}
              </Button>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger 
                value="proposals" 
                disabled={!selectedItemId}
              >
                Propostas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4 pt-4">
              <QuotationItemList
                items={quotationItems}
                isLoading={itemsLoading}
                quotationClosed={selectedQuotation.status === 'closed'}
                onAddSupplierQuotation={onAddSupplierQuotation}
                onDeleteItem={onDeleteItem}
              />
            </TabsContent>
            
            <TabsContent value="proposals" className="space-y-4 pt-4">
              {children}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      <SheetFooter>
        <Button onClick={onClose}>Fechar</Button>
      </SheetFooter>
    </>
  );
}