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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileEdit, Trash2, CheckCircle, PlusCircle } from 'lucide-react';
import { Quotation } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface QuotationListProps {
  quotations: Quotation[] | undefined;
  isLoading: boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatDate: (dateString: string) => string;
  onViewDetails: (quotationId: number) => void;
  onAddItem: (quotationId: number) => void;
  onCloseQuotation?: (quotationId: number) => void;
  onDeleteQuotation?: (quotationId: number) => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({
  quotations,
  isLoading,
  getStatusColor,
  getStatusLabel,
  formatDate,
  onViewDetails,
  onAddItem,
  onCloseQuotation,
  onDeleteQuotation,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quotations || quotations.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>Nenhuma cotação encontrada.</p>
        <p className="text-sm mt-2">Clique em "Nova Cotação" para criar uma.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Lista de cotações de compras</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Data Criação</TableHead>
          <TableHead>Data Limite</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Itens</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.map((quotation) => (
          <TableRow key={quotation.id}>
            <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
            <TableCell>{quotation.creationDate ? formatDate(quotation.creationDate) : '-'}</TableCell>
            <TableCell>{quotation.closingDate ? formatDate(quotation.closingDate) : '-'}</TableCell>
            <TableCell>
              <Badge variant="outline" className={getStatusColor(quotation.status)}>
                {getStatusLabel(quotation.status)}
              </Badge>
            </TableCell>
            <TableCell>{quotation.itemCount || 0}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onViewDetails(quotation.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onAddItem(quotation.id)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                {quotation.status === 'open' && onCloseQuotation && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onCloseQuotation(quotation.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {onDeleteQuotation && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteQuotation(quotation.id)}
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
};