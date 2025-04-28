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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calculator } from 'lucide-react';
import { Product } from '@shared/schema';

interface PriceSimulationFormProps {
  simulationForm: {
    productId: string;
    quantity: string;
    includeFixedCosts: boolean;
    includeLabor: boolean;
    includeOverhead: boolean;
  };
  products: Product[] | undefined;
  selectedProduct: Product | null;
  simulationResults: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (name: string, checked: boolean) => void;
  handleProductSelect: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  productsLoading: boolean;
  onCancel: () => void;
}

export function PriceSimulationForm({
  simulationForm,
  products,
  selectedProduct,
  simulationResults,
  handleInputChange,
  handleCheckboxChange,
  handleProductSelect,
  handleSubmit,
  isLoading,
  productsLoading,
  onCancel,
}: PriceSimulationFormProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Simulação de Custos e Preços</DialogTitle>
        <DialogDescription>
          Simule o impacto das cotações nos custos e preços de produtos acabados.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="productId">Produto</Label>
            <Select
              value={simulationForm.productId}
              onValueChange={handleProductSelect}
              disabled={productsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {productsLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProduct && (
            <div className="bg-muted p-2 rounded text-sm">
              <p><strong>Produto:</strong> {selectedProduct.name}</p>
              <p><strong>Código:</strong> {selectedProduct.sku}</p>
              <p><strong>Categoria:</strong> {selectedProduct.category || 'N/A'}</p>
              <p><strong>Preço Atual:</strong> R$ {selectedProduct.price?.toFixed(2) || '0,00'}</p>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantidade para Produção</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Quantidade"
              value={simulationForm.quantity}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Incluir no Cálculo</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFixedCosts"
                checked={simulationForm.includeFixedCosts}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('includeFixedCosts', !!checked)
                }
              />
              <Label 
                htmlFor="includeFixedCosts" 
                className="text-sm font-normal cursor-pointer"
              >
                Custos Fixos
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLabor"
                checked={simulationForm.includeLabor}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('includeLabor', !!checked)
                }
              />
              <Label 
                htmlFor="includeLabor" 
                className="text-sm font-normal cursor-pointer"
              >
                Mão de Obra
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeOverhead"
                checked={simulationForm.includeOverhead}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('includeOverhead', !!checked)
                }
              />
              <Label 
                htmlFor="includeOverhead" 
                className="text-sm font-normal cursor-pointer"
              >
                Despesas Indiretas
              </Label>
            </div>
          </div>
        </div>
        
        {simulationResults && (
          <div className="rounded-md border p-4 mt-4">
            <h3 className="text-lg font-medium mb-2">Resultados da Simulação</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Custo de Materiais:</p>
                <p className="font-medium">
                  {simulationResults.materialCost?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Custo de Mão de Obra:</p>
                <p className="font-medium">
                  {simulationResults.laborCost?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Custos Fixos:</p>
                <p className="font-medium">
                  {simulationResults.fixedCost?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Despesas Indiretas:</p>
                <p className="font-medium">
                  {simulationResults.overheadCost?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Total:</p>
                  <p className="text-lg font-bold">
                    {simulationResults.totalCost?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Unitário:</p>
                  <p className="text-lg font-bold">
                    {simulationResults.unitCost?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {simulationResults.priceVariation && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">
                  Impacto no Preço de Venda:
                </p>
                <p className={`text-lg font-bold ${
                  simulationResults.priceVariation < 0 
                    ? 'text-green-600' 
                    : simulationResults.priceVariation > 0 
                    ? 'text-red-600' 
                    : ''
                }`}>
                  {simulationResults.priceVariation > 0 ? '+' : ''}
                  {simulationResults.priceVariation.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Fechar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !simulationForm.productId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulando...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Simular
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}