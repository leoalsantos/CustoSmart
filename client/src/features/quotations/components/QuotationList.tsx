import React, { useMemo } from 'react';
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
import { 
  FileText, 
  Eye, 
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Quotation } from '@shared/schema';

interface QuotationListProps {
  quotations: Quotation[] | undefined;
  isLoading: boolean;
  onViewDetails: (quotationId: number) => void;
  onCloseQuotation: (quotationId: number) => void;
}

export function QuotationList({
  quotations,
  isLoading,
  onViewDetails,
  onCloseQuotation,
}: QuotationListProps) {
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

  // Agrupar cotações por status
  const quotationsByStatus = useMemo(() => {
    const open: Quotation[] = [];
    const closed: Quotation[] = [];
    
    quotations?.forEach(quotation => {
      if (quotation.status === 'closed') {
        closed.push(quotation);
      } else {
        open.push(quotation);
      }
    });
    
    return { open, closed };
  }, [quotations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>
    );
  }

  if (!quotations || quotations.length === 0) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-muted-foreground">Nenhuma cotação encontrada</p>
        <p className="text-sm text-muted-foreground mt-2">Clique em "Nova Cotação" para criar a primeira.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Lista de cotações de compra</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nº da Cotação</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Data de Criação</TableHead>
          <TableHead>Data de Fechamento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotationsByStatus.open.map((quotation) => (
          <TableRow key={quotation.id}>
            <TableCell className="font-medium">{quotation.number}</TableCell>
            <TableCell>{quotation.title || 'Sem título'}</TableCell>
            <TableCell>{formatDate(quotation.createdAt)}</TableCell>
            <TableCell>{formatDate(quotation.closingDate)}</TableCell>
            <TableCell>
              <Badge variant={quotation.status === 'open' ? 'default' : 'secondary'}>
                {quotation.status === 'open' ? 'Aberta' : 'Fechada'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onViewDetails(quotation.id)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {quotation.status === 'open' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onCloseQuotation(quotation.id)}
                    title="Fechar cotação"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        
        {quotationsByStatus.closed.length > 0 && (
          <TableRow>
            <TableCell colSpan={6} className="bg-muted/50 py-2">
              <div className="font-medium text-sm">Cotações Fechadas</div>
            </TableCell>
          </TableRow>
        )}
        
        {quotationsByStatus.closed.map((quotation) => (
          <TableRow key={quotation.id} className="opacity-70">
            <TableCell className="font-medium">{quotation.number}</TableCell>
            <TableCell>{quotation.title || 'Sem título'}</TableCell>
            <TableCell>{formatDate(quotation.createdAt)}</TableCell>
            <TableCell>{formatDate(quotation.closingDate)}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                Fechada
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onViewDetails(quotation.id)}
                title="Ver detalhes"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}