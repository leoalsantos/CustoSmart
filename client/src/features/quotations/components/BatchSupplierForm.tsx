import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { Supplier, QuotationItem } from '@shared/schema';

interface BatchSupplierFormProps {
  supplierIds: string[];
  suppliers: Supplier[] | undefined;
  selectedItem: QuotationItem | undefined;
  toggleSupplier: (supplierId: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  suppliersLoading: boolean;
  onCancel: () => void;
}

export function BatchSupplierForm({
  supplierIds,
  suppliers,
  selectedItem,
  toggleSupplier,
  handleSubmit,
  isLoading,
  suppliersLoading,
  onCancel,
}: BatchSupplierFormProps) {
  if (suppliersLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Envio em Lote para Fornecedores</DialogTitle>
        <DialogDescription>
          Selecione os fornecedores para enviar solicitação de cotação.
        </DialogDescription>
      </DialogHeader>
      
      {selectedItem && (
        <div className="bg-muted p-3 rounded mb-4">
          <p className="font-medium">Item: {selectedItem.material?.name}</p>
          <p>Quantidade: {selectedItem.quantity} {selectedItem.unit?.symbol}</p>
          {selectedItem.description && <p>Especificações: {selectedItem.description}</p>}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="border rounded-md">
          {suppliers && suppliers.length > 0 ? (
            <div className="divide-y">
              {suppliers.map((supplier) => (
                <div 
                  key={supplier.id} 
                  className="flex items-center space-x-2 p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`supplier-${supplier.id}`}
                    checked={supplierIds.includes(supplier.id.toString())}
                    onCheckedChange={() => toggleSupplier(supplier.id.toString())}
                  />
                  <Label
                    htmlFor={`supplier-${supplier.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {supplier.contactPerson && `${supplier.contactPerson}, `}
                      {supplier.email}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum fornecedor cadastrado.
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground pt-2">
          {supplierIds.length} fornecedor(es) selecionado(s)
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || supplierIds.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {supplierIds.length} fornecedor(es)
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}