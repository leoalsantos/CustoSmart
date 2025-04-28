import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Quotation } from '@shared/schema';

export function useQuotations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quotationForm, setQuotationForm] = useState({
    title: "",
    description: "", 
    dueDate: "", 
    status: "open",
  });

  // Query para buscar cotações
  const { 
    data: quotations, 
    isLoading: quotationsLoading 
  } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quotations");
      return await response.json();
    }
  });

  // Mutação para criar cotações
  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotations", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Cotação criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      resetQuotationForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar cotação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutação para fechar cotações
  const closeQuotationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/quotations/${id}`, { status: 'closed' });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Cotação fechada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao fechar cotação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Funções auxiliares para manipulação de formulários
  const resetQuotationForm = () => {
    setQuotationForm({
      title: "",
      description: "",
      dueDate: "",
      status: "open",
    });
  };

  const handleQuotationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuotationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para criar uma nova cotação
  const createQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gera um número de cotação no formato COT-YYYYMMDD-XXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationNumber = `COT-${year}${month}${day}-${random}`;
    
    const quotationData = {
      number: quotationNumber,
      status: quotationForm.status,
      notes: quotationForm.description,
      closingDate: quotationForm.dueDate ? new Date(quotationForm.dueDate).toISOString() : null,
      title: quotationForm.title
    };
    
    createQuotationMutation.mutate(quotationData);
  };

  return {
    quotations,
    quotationsLoading,
    quotationForm,
    createQuotationMutation,
    closeQuotationMutation,
    handleQuotationInputChange,
    createQuotation,
    resetQuotationForm,
    setQuotationForm
  };
}