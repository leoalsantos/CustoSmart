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
import { Loader2 } from 'lucide-react';

interface NewQuotationFormProps {
  quotationForm: {
    title: string;
    description: string;
    dueDate: string;
    status: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export function NewQuotationForm({
  quotationForm,
  handleInputChange,
  handleSubmit,
  isLoading,
  onCancel,
}: NewQuotationFormProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Cotação</DialogTitle>
        <DialogDescription>
          Preencha os dados para criar uma nova cotação de materiais.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder="Título da cotação"
              value={quotationForm.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descrição detalhada"
              value={quotationForm.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Data de Fechamento</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={quotationForm.dueDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Cotação'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}