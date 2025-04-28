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
import { PlusCircle, DollarSign, Trash2 } from 'lucide-react';
import { QuotationItem } from '@shared/schema';

interface QuotationItemListProps {
  items: QuotationItem[] | undefined;
  isLoading: boolean;
  quotationClosed: boolean;
  onAddSupplierQuotation: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
}

export function QuotationItemList({
  items,
  isLoading,
  quotationClosed,
  onAddSupplierQuotation,
  onDeleteItem,
}: QuotationItemListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-muted-foreground">Carregando itens...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-muted-foreground">Nenhum item adicionado</p>
        <p className="text-sm text-muted-foreground mt-2">Clique em "Adicionar Item" para incluir materiais nesta cotação.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Lista de itens da cotação</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Material</TableHead>
          <TableHead>Código</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Propostas</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.material?.name || 'Desconhecido'}
            </TableCell>
            <TableCell>{item.material?.code || 'N/A'}</TableCell>
            <TableCell className="text-right">{item.quantity.toLocaleString('pt-BR')}</TableCell>
            <TableCell>{item.unit?.symbol || 'N/A'}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {item.description || 'N/A'}
            </TableCell>
            <TableCell>
              {item._count?.supplierQuotations || 0} proposta(s)
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  title="Adicionar proposta de fornecedor"
                  onClick={() => onAddSupplierQuotation(item.id)}
                  disabled={quotationClosed}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                
                {!quotationClosed && (
                  <Button
                    variant="outline"
                    size="icon"
                    title="Excluir item"
                    onClick={() => onDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}