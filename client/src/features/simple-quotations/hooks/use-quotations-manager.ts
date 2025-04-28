import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Quotation, 
  QuotationItem, 
  SupplierQuotation, 
  Supplier, 
  RawMaterial, 
  MeasurementUnit 
} from '@shared/schema';

export function useQuotationsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para gerenciar modais e formulários
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSupplierQuotationOpen, setIsSupplierQuotationOpen] = useState(false);
  const [isQuotationDetailOpen, setIsQuotationDetailOpen] = useState(false);
  
  // Estados para armazenar IDs selecionados
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  
  // Estados para formulários
  const [quotationForm, setQuotationForm] = useState({
    title: "", // Usado apenas na UI
    description: "", // Mapeado para notes
    dueDate: "", // Mapeado para closingDate
    status: "open",
  });
  
  const [itemForm, setItemForm] = useState({
    materialId: "",
    quantity: "",
    unitId: "",
    description: "",
    originalUnitType: "", // Para armazenar o tipo da unidade original do material
  });
  
  const [supplierQuotationForm, setSupplierQuotationForm] = useState({
    supplierId: "",
    price: "",
    deliveryTime: "",
    notes: "",
  });

  // Consultas para dados
  const { data: quotations, isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quotations");
      return await response.json();
    }
  });

  const { data: quotationItems, isLoading: quotationItemsLoading } = useQuery<QuotationItem[]>({
    queryKey: ["/api/quotation-items", selectedQuotationId],
    queryFn: async () => {
      if (!selectedQuotationId) return [];
      const response = await apiRequest("GET", `/api/quotations/${selectedQuotationId}/items`);
      return await response.json();
    },
    enabled: !!selectedQuotationId,
  });

  const { data: supplierQuotations, isLoading: supplierQuotationsLoading } = useQuery<SupplierQuotation[]>({
    queryKey: ["/api/supplier-quotations", selectedItemId],
    queryFn: async () => {
      if (!selectedItemId) return [];
      const response = await apiRequest("GET", `/api/quotation-items/${selectedItemId}/supplier-quotations`);
      return await response.json();
    },
    enabled: !!selectedItemId,
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/suppliers");
      return await response.json();
    }
  });

  const { data: materials, isLoading: materialsLoading } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/raw-materials");
      return await response.json();
    }
  });

  const { data: units, isLoading: unitsLoading } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/measurement-units");
      return await response.json();
    }
  });

  // Mutações para operações CRUD
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
      setIsNewQuotationOpen(false);
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

  const createQuotationItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotation-items", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-items", selectedQuotationId] });
      setIsItemFormOpen(false);
      resetItemForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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
      setIsSupplierQuotationOpen(false);
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

  const deleteQuotationItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quotation-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-items", selectedQuotationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao remover item: ${error.message}`,
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

  const resetItemForm = () => {
    setItemForm({
      materialId: "",
      quantity: "",
      unitId: "",
      description: "",
      originalUnitType: "",
    });
  };

  const resetSupplierQuotationForm = () => {
    setSupplierQuotationForm({
      supplierId: "",
      price: "",
      deliveryTime: "",
      notes: "",
    });
  };

  const handleQuotationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuotationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSupplierQuotationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierQuotationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string, formSetter: React.Dispatch<React.SetStateAction<any>>) => {
    formSetter((prev: any) => ({
      ...prev,
      [name]: value,
    }));

    // Se estiver alterando o materialId no formulário de item, buscar a unidade de medida do material
    if (name === "materialId" && formSetter === setItemForm && materials) {
      const materialId = parseInt(value);
      const material = materials.find(m => m.id === materialId);
      
      if (material) {
        // Armazenar o material selecionado para exibir informações adicionais
        setSelectedMaterial(material);
        
        // Buscar a unidade de medida do material
        const materialUnit = material.unit;
        
        // Determinar o tipo de unidade com base na unidade do material
        let unitType = "";
        
        if (["kg", "g", "mg"].includes(materialUnit)) {
          unitType = "mass";
        } else if (["l", "ml"].includes(materialUnit)) {
          unitType = "volume";
        } else if (["m²", "cm²", "mm²"].includes(materialUnit)) {
          unitType = "area";
        } else if (["m", "cm", "mm"].includes(materialUnit)) {
          unitType = "length";
        } else {
          unitType = "count";
        }
        
        // Atualizar o campo originalUnitType no formulário
        setItemForm(prev => ({
          ...prev,
          originalUnitType: unitType,
          unitMeasurement: materialUnit // Armazenar a unidade original do material
        }));
        
        // Definir a unidade padrão apenas se tivermos unidades cadastradas
        if (units && units.length > 0) {
          const matchingUnit = units.find(u => u.symbol === materialUnit);
          if (matchingUnit) {
            setItemForm(prev => ({
              ...prev,
              unitId: matchingUnit.id.toString()
            }));
          }
        }
      } else {
        // Limpar o material selecionado se nenhum for encontrado
        setSelectedMaterial(null);
      }
    }
  };

  // Handlers para submissão de formulários
  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gera um número de cotação no formato COT-YYYYMMDD-XXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationNumber = `COT-${year}${month}${day}-${random}`;
    
    const data = {
      quotationNumber: quotationNumber,
      notes: quotationForm.description,
      status: quotationForm.status || 'open',
      creationDate: now.toISOString().split('T')[0], // Formato YYYY-MM-DD
      closingDate: quotationForm.dueDate || null,
    };
    
    createQuotationMutation.mutate(data);
  };

  const handleAddQuotationItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuotationId) {
      toast({
        title: "Erro",
        description: "Nenhuma cotação selecionada",
        variant: "destructive",
      });
      return;
    }
    
    // Pegando o símbolo da unidade selecionada
    const unit = units?.find(u => u.id === parseInt(itemForm.unitId));
    
    if (!unit) {
      toast({
        title: "Erro",
        description: "Escala de medida inválida",
        variant: "destructive",
      });
      return;
    }
    
    if (!itemForm.originalUnitType) {
      toast({
        title: "Erro",
        description: "Selecione uma matéria-prima primeiro",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se a unidade selecionada é do mesmo tipo que a unidade original
    if (unit.type !== itemForm.originalUnitType) {
      toast({
        title: "Erro",
        description: "A escala de medida deve ser do mesmo tipo que a unidade original da matéria-prima",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      quotationId: selectedQuotationId,
      materialId: parseInt(itemForm.materialId),
      quantity: parseFloat(itemForm.quantity),
      unitId: parseInt(itemForm.unitId),
      unitMeasurement: unit.symbol, // Utiliza o símbolo da unidade como unitMeasurement
    };
    
    createQuotationItemMutation.mutate(data);
  };

  const handleAddSupplierQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId) {
      toast({
        title: "Erro",
        description: "Nenhum item selecionado",
        variant: "destructive",
      });
      return;
    }
    
    const price = parseFloat(supplierQuotationForm.price);
    const freight = 0; // Valor padrão para frete
    const taxes = 0; // Valor padrão para impostos
    
    const data = {
      quotationItemId: selectedItemId,
      supplierId: parseInt(supplierQuotationForm.supplierId),
      unitPrice: price,
      freight: freight,
      taxes: taxes,
      totalPrice: price + freight + taxes, // Soma para obter o preço total
      deliveryTime: parseInt(supplierQuotationForm.deliveryTime) || 0,
      paymentTerms: "",
      isSelected: false
    };
    
    createSupplierQuotationMutation.mutate(data);
  };

  const handleSelectBestQuotation = (id: number) => {
    selectBestQuotationMutation.mutate(id);
  };

  const handleDeleteQuotationItem = (id: number) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteQuotationItemMutation.mutate(id);
    }
  };

  // Funções de formatação e exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'closed':
        return 'Fechada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Função para abrir a visualização detalhada da cotação
  const openQuotationDetail = (quotationId: number) => {
    setSelectedQuotationId(quotationId);
    setIsQuotationDetailOpen(true);
  };

  // Função para abrir o formulário de item para uma cotação específica
  const openItemForm = (quotationId: number) => {
    setSelectedQuotationId(quotationId);
    setIsItemFormOpen(true);
  };

  // Função para abrir o formulário de proposta de fornecedor para um item específico
  const openSupplierQuotationForm = (itemId: number) => {
    setSelectedItemId(itemId);
    setIsSupplierQuotationOpen(true);
  };

  return {
    // Estados
    isNewQuotationOpen,
    isItemFormOpen,
    isSupplierQuotationOpen,
    isQuotationDetailOpen,
    selectedQuotationId,
    selectedItemId,
    selectedMaterial,
    quotationForm,
    itemForm,
    supplierQuotationForm,
    
    // Dados
    quotations,
    quotationItems,
    supplierQuotations,
    suppliers,
    materials,
    units,
    
    // Estados de carregamento
    isLoading: quotationsLoading || materialsLoading || unitsLoading || suppliersLoading,
    quotationsLoading,
    quotationItemsLoading,
    supplierQuotationsLoading,
    
    // Mutações
    createQuotationMutation,
    createQuotationItemMutation,
    createSupplierQuotationMutation,
    selectBestQuotationMutation,
    deleteQuotationItemMutation,
    
    // Setters
    setIsNewQuotationOpen,
    setIsItemFormOpen,
    setIsSupplierQuotationOpen,
    setIsQuotationDetailOpen,
    setSelectedQuotationId,
    setSelectedItemId,
    
    // Handlers para formulários
    handleQuotationInputChange,
    handleItemInputChange,
    handleSupplierQuotationInputChange,
    handleSelectChange,
    handleCreateQuotation,
    handleAddQuotationItem,
    handleAddSupplierQuotation,
    handleSelectBestQuotation,
    handleDeleteQuotationItem,
    
    // Funções auxiliares
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusLabel,
    
    // Funções de navegação
    openQuotationDetail,
    openItemForm,
    openSupplierQuotationForm,
    
    // Funções de reset
    resetQuotationForm,
    resetItemForm,
    resetSupplierQuotationForm,
  };
}