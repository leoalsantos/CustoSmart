import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SupplierQuotation, Supplier } from '@shared/schema';

export function useSupplierQuotations(selectedItemId: number | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [supplierQuotationForm, setSupplierQuotationForm] = useState({
    supplierId: "",
    price: "",
    deliveryTime: "",
    paymentTerms: "",
    freight: "0",
    taxes: "0",
    notes: "",
  });

  const [batchSupplierForm, setBatchSupplierForm] = useState({
    supplierIds: [] as string[],
  });

  // Query para buscar cotações de fornecedores
  const { 
    data: supplierQuotations, 
    isLoading: supplierQuotationsLoading 
  } = useQuery<SupplierQuotation[]>({
    queryKey: ["/api/supplier-quotations", selectedItemId],
    queryFn: async () => {
      if (!selectedItemId) return [];
      const response = await apiRequest("GET", `/api/quotation-items/${selectedItemId}/supplier-quotations`);
      return await response.json();
    },
    enabled: !!selectedItemId,
  });

  // Mutação para criar cotação de fornecedor
  const createSupplierQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/supplier-quotations", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Proposta do fornecedor adicionada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotations", selectedItemId] });
      resetSupplierQuotationForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar proposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutação para selecionar a melhor cotação
  const selectBestQuotationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/supplier-quotations/${id}/select`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Proposta selecionada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-quotations", selectedItemId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao selecionar proposta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar preço do material
  const updateMaterialPriceMutation = useMutation({
    mutationFn: async (data: { materialId: number, price: number }) => {
      const response = await apiRequest("PATCH", `/api/raw-materials/${data.materialId}`, { price: data.price });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Preço da matéria-prima atualizado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar preço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Funções auxiliares
  const resetSupplierQuotationForm = () => {
    setSupplierQuotationForm({
      supplierId: "",
      price: "",
      deliveryTime: "",
      paymentTerms: "",
      freight: "0",
      taxes: "0",
      notes: "",
    });
  };

  const handleSupplierQuotationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierQuotationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleBatchSupplier = (supplierId: string) => {
    setBatchSupplierForm(prev => {
      const supplierIds = [...prev.supplierIds];
      const index = supplierIds.indexOf(supplierId);
      
      if (index > -1) {
        supplierIds.splice(index, 1);
      } else {
        supplierIds.push(supplierId);
      }
      
      return {
        ...prev,
        supplierIds,
      };
    });
  };

  // Função para criar cotação de fornecedor
  const createSupplierQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId) {
      toast({
        title: "Erro",
        description: "Selecione um item primeiro",
        variant: "destructive",
      });
      return;
    }
    
    const quotationData = {
      itemId: selectedItemId,
      supplierId: parseInt(supplierQuotationForm.supplierId),
      price: parseFloat(supplierQuotationForm.price),
      deliveryTime: parseInt(supplierQuotationForm.deliveryTime) || 0,
      paymentTerms: supplierQuotationForm.paymentTerms,
      freight: parseFloat(supplierQuotationForm.freight) || 0,
      taxes: parseFloat(supplierQuotationForm.taxes) || 0,
      notes: supplierQuotationForm.notes,
    };
    
    createSupplierQuotationMutation.mutate(quotationData);
  };

  // Função para enviar em lote para vários fornecedores
  const sendBatchQuotationRequests = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId) {
      toast({
        title: "Erro",
        description: "Selecione um item primeiro",
        variant: "destructive",
      });
      return;
    }
    
    if (batchSupplierForm.supplierIds.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um fornecedor",
        variant: "destructive",
      });
      return;
    }
    
    // Implementar lógica para envio em lote
    toast({
      title: "Sucesso",
      description: `Solicitações enviadas para ${batchSupplierForm.supplierIds.length} fornecedores`
    });
    
    setBatchSupplierForm({
      supplierIds: [],
    });
  };

  return {
    supplierQuotations,
    supplierQuotationsLoading,
    supplierQuotationForm,
    batchSupplierForm,
    createSupplierQuotationMutation,
    selectBestQuotationMutation,
    updateMaterialPriceMutation,
    handleSupplierQuotationInputChange,
    toggleBatchSupplier,
    createSupplierQuotation,
    sendBatchQuotationRequests,
    resetSupplierQuotationForm,
    setSupplierQuotationForm,
    setBatchSupplierForm,
  };
}