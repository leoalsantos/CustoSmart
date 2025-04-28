import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { SupplierQuotation, RawMaterial } from '@shared/schema';

interface SupplierQuotationListProps {
  supplierQuotations: SupplierQuotation[] | undefined;
  isLoading: boolean;
  quotationClosed: boolean;
  selectedMaterial: RawMaterial | null;
  onSelectQuotation: (quotationId: number) => void;
  onUpdateMaterialPrice: (materialId: number, price: number) => void;
}

export function SupplierQuotationList({
  supplierQuotations,
  isLoading,
  quotationClosed,
  selectedMaterial,
  onSelectQuotation,
  onUpdateMaterialPrice,
}: SupplierQuotationListProps) {
  // Ordenar cotações por preço (menor para maior)
  const sortedQuotations = React.useMemo(() => {
    if (!supplierQuotations) return [];
    
    return [...supplierQuotations].sort((a, b) => {
      // Colocar a proposta selecionada no topo
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;
      
      // Ordenar por preço total (preço + frete)
      const totalPriceA = (a.price || 0) + (a.freight || 0);
      const totalPriceB = (b.price || 0) + (b.freight || 0);
      return totalPriceA - totalPriceB;
    });
  }, [supplierQuotations]);

  // Calcular o melhor e pior preço para comparações visuais
  const { bestPrice, worstPrice } = React.useMemo(() => {
    if (!sortedQuotations.length) return { bestPrice: 0, worstPrice: 0 };
    
    const prices = sortedQuotations.map(sq => sq.price || 0);
    return {
      bestPrice: Math.min(...prices),
      worstPrice: Math.max(...prices),
    };
  }, [sortedQuotations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-muted-foreground">Carregando propostas...</p>
      </div>
    );
  }

  if (!supplierQuotations || supplierQuotations.length === 0) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-muted-foreground">Nenhuma proposta de fornecedor adicionada</p>
        <p className="text-sm text-muted-foreground mt-2">Clique em "Adicionar Proposta" para incluir preços de fornecedores.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Propostas de fornecedores</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fornecedor</TableHead>
          <TableHead className="text-right">Preço (R$)</TableHead>
          <TableHead className="text-right">Frete (R$)</TableHead>
          <TableHead className="text-right">Impostos (%)</TableHead>
          <TableHead className="text-right">Total (R$)</TableHead>
          <TableHead>Entrega</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedQuotations.map((quotation) => {
          const totalPrice = (quotation.price || 0) + (quotation.freight || 0);
          const isBestPrice = quotation.price === bestPrice;
          const isWorstPrice = quotation.price === worstPrice && supplierQuotations.length > 1;
          
          return (
            <TableRow
              key={quotation.id}
              className={quotation.selected ? 'bg-muted/50' : undefined}
            >
              <TableCell className="font-medium">
                {quotation.supplier?.name || 'Desconhecido'}
              </TableCell>
              <TableCell className="text-right font-medium">
                <div className="flex items-center justify-end gap-1">
                  {isBestPrice && <ArrowDown className="h-4 w-4 text-green-500" />}
                  {isWorstPrice && <ArrowUp className="h-4 w-4 text-red-500" />}
                  {quotation.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {quotation.freight?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '0,00'}
              </TableCell>
              <TableCell className="text-right">
                {quotation.taxes ? `${quotation.taxes}%` : '0%'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                {quotation.deliveryTime} dias
              </TableCell>
              <TableCell>
                {quotation.paymentTerms || 'N/A'}
              </TableCell>
              <TableCell>
                {quotation.selected ? (
                  <Badge variant="default" className="bg-green-600">
                    Selecionada
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Pendente
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {!quotationClosed && !quotation.selected && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onSelectQuotation(quotation.id)}
                      title="Selecionar proposta"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {quotation.selected && selectedMaterial && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateMaterialPrice(selectedMaterial.id, quotation.price || 0)}
                      title="Atualizar preço do material"
                    >
                      Atualizar Preço
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}