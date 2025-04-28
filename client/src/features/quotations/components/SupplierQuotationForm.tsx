import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Supplier, QuotationItem } from '@shared/schema';

interface SupplierQuotationFormProps {
  supplierQuotationForm: {
    supplierId: string;
    price: string;
    deliveryTime: string;
    paymentTerms: string;
    freight: string;
    taxes: string;
    notes: string;
  };
  suppliers: Supplier[] | undefined;
  selectedItem: QuotationItem | undefined;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSupplierSelect: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  suppliersLoading: boolean;
  onCancel: () => void;
}

export function SupplierQuotationForm({
  supplierQuotationForm,
  suppliers,
  selectedItem,
  handleInputChange,
  handleSupplierSelect,
  handleSubmit,
  isLoading,
  suppliersLoading,
  onCancel,
}: SupplierQuotationFormProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar Proposta de Fornecedor</DialogTitle>
        <DialogDescription>
          Registre os preços e condições oferecidas pelo fornecedor.
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
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="supplierId">Fornecedor</Label>
            <Select
              value={supplierQuotationForm.supplierId}
              onValueChange={handleSupplierSelect}
              disabled={suppliersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliersLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Unitário (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Preço unitário"
                value={supplierQuotationForm.price}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deliveryTime">Prazo de Entrega (dias)</Label>
              <Input
                id="deliveryTime"
                name="deliveryTime"
                type="number"
                min="1"
                step="1"
                placeholder="Dias para entrega"
                value={supplierQuotationForm.deliveryTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
            <Input
              id="paymentTerms"
              name="paymentTerms"
              placeholder="Ex: 30/60/90 dias, à vista, etc."
              value={supplierQuotationForm.paymentTerms}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="freight">Frete (R$)</Label>
              <Input
                id="freight"
                name="freight"
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor do frete"
                value={supplierQuotationForm.freight}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="taxes">Impostos (%)</Label>
              <Input
                id="taxes"
                name="taxes"
                type="number"
                min="0"
                step="0.01"
                placeholder="Percentual de impostos"
                value={supplierQuotationForm.taxes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Informações adicionais sobre a proposta"
              value={supplierQuotationForm.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !supplierQuotationForm.supplierId || !supplierQuotationForm.price || !supplierQuotationForm.deliveryTime}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Adicionar Proposta'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}