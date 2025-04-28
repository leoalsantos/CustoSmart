import React from 'react';
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
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Loader2 } from 'lucide-react';

interface QuotationFormData {
  title: string;
  description: string;
  dueDate: string;
  status: string;
}

interface NewQuotationFormProps {
  quotationForm: QuotationFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export const NewQuotationForm: React.FC<NewQuotationFormProps> = ({
  quotationForm,
  handleInputChange,
  handleSubmit,
  isLoading,
  onCancel,
}) => {
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nova Cotação</DialogTitle>
        <DialogDescription>
          Crie uma nova cotação para solicitação de preços a fornecedores.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Título
          </Label>
          <Input
            id="title"
            name="title"
            value={quotationForm.title}
            onChange={handleInputChange}
            placeholder="Ex: Cotação de matérias-primas"
            className="col-span-3"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Descrição
          </Label>
          <Textarea
            id="description"
            name="description"
            value={quotationForm.description}
            onChange={handleInputChange}
            placeholder="Descreva o propósito desta cotação"
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dueDate" className="text-right">
            Data Limite
          </Label>
          <div className="col-span-3 flex">
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={quotationForm.dueDate}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Calendar className="ml-2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            Status
          </Label>
          <Select 
            defaultValue={quotationForm.status} 
            onValueChange={(value) => {
              // Simulando um evento de mudança
              const event = {
                target: {
                  name: 'status',
                  value
                }
              } as React.ChangeEvent<HTMLInputElement>;
              handleInputChange(event);
            }}
          >
            <SelectTrigger id="status" className="col-span-3">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberta</SelectItem>
              <SelectItem value="closed">Fechada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
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
  );
};