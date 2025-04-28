import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageTitle from "@/components/common/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  PlusCircle,
  FileText,
  ShoppingCart,
  DollarSign,
  Trash2,
  FileEdit,
  Eye,
  CheckCircle,
  Calendar,
  FilePlus2,
  Calculator,
  FileUp,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { 
  Quotation, 
  QuotationItem, 
  SupplierQuotation, 
  Supplier, 
  RawMaterial, 
  MeasurementUnit,
  Product
} from "@shared/schema";

const EnhancedQuotationsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para gerenciar modais e formulários
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSupplierQuotationOpen, setIsSupplierQuotationOpen] = useState(false);
  const [isQuotationDetailOpen, setIsQuotationDetailOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isBatchSupplierModalOpen, setIsBatchSupplierModalOpen] = useState(false);
  const [isPriceSimulationOpen, setIsPriceSimulationOpen] = useState(false);
  
  // Estados para armazenar IDs selecionados
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
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
    paymentTerms: "",
    freight: "0",
    taxes: "0",
    notes: "",
  });

  const [batchSupplierForm, setBatchSupplierForm] = useState({
    supplierIds: [] as string[],
  });

  const [simulationForm, setSimulationForm] = useState({
    productId: "",
    quantity: "1000",
    includeFixedCosts: true,
    includeLabor: true,
    includeOverhead: true,
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

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
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
      setIsQuotationDetailOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao fechar cotação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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

  const simulatePricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/product-pricing/simulate`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Simulação Concluída",
        description: "A simulação de preço foi realizada com sucesso"
      });
      // Atualizar interface com os resultados da simulação
      setSimulationResults(data);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao realizar simulação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Estado para armazenar resultados da simulação
  const [simulationResults, setSimulationResults] = useState<any>(null);

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
      paymentTerms: "",
      freight: "0",
      taxes: "0",
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

  const handleSimulationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSimulationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSimulationCheckboxChange = (name: string, checked: boolean) => {
    setSimulationForm((prev) => ({
      ...prev,
      [name]: checked,
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
          unitType = "weight";
        } else if (["l", "ml"].includes(materialUnit)) {
          unitType = "volume";
        } else if (["m²", "cm²", "mm²"].includes(materialUnit)) {
          unitType = "area";
        } else if (["m", "cm", "mm"].includes(materialUnit)) {
          unitType = "length";
        } else {
          unitType = "unit";
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

    // Se estiver alterando o productId no formulário de simulação
    if (name === "productId" && formSetter === setSimulationForm && products) {
      const productId = parseInt(value);
      const product = products.find(p => p.id === productId);
      
      if (product) {
        setSelectedProduct(product);
      } else {
        setSelectedProduct(null);
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
    const freight = parseFloat(supplierQuotationForm.freight) || 0;
    const taxes = parseFloat(supplierQuotationForm.taxes) || 0;
    
    const data = {
      quotationItemId: selectedItemId,
      supplierId: parseInt(supplierQuotationForm.supplierId),
      unitPrice: price,
      freight: freight,
      taxes: taxes,
      totalPrice: price + freight + taxes, // Soma para obter o preço total
      deliveryTime: parseInt(supplierQuotationForm.deliveryTime) || 0,
      paymentTerms: supplierQuotationForm.paymentTerms || "",
      notes: supplierQuotationForm.notes || "",
      isSelected: false
    };
    
    createSupplierQuotationMutation.mutate(data);
  };

  const handleAddBatchSuppliers = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuotationId || !batchSupplierForm.supplierIds.length) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um fornecedor",
        variant: "destructive",
      });
      return;
    }

    // Implementar lógica para adicionar vários fornecedores de uma vez
    toast({
      title: "Sucesso",
      description: `${batchSupplierForm.supplierIds.length} fornecedores adicionados à cotação`
    });

    setIsBatchSupplierModalOpen(false);
  };

  const handleRunPriceSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!simulationForm.productId) {
      toast({
        title: "Erro",
        description: "Selecione um produto para simular",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      productId: parseInt(simulationForm.productId),
      quantity: parseInt(simulationForm.quantity) || 1000,
      includeFixedCosts: simulationForm.includeFixedCosts,
      includeLabor: simulationForm.includeLabor,
      includeOverhead: simulationForm.includeOverhead
    };
    
    simulatePricingMutation.mutate(data);
  };

  const handleSelectBestQuotation = (id: number) => {
    selectBestQuotationMutation.mutate(id);
  };

  const handleDeleteQuotationItem = (id: number) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteQuotationItemMutation.mutate(id);
    }
  };

  const handleCloseQuotation = (id: number) => {
    if (confirm("Tem certeza que deseja fechar esta cotação? Isso atualizará os preços das matérias-primas selecionadas.")) {
      closeQuotationMutation.mutate(id);
      
      // Atualizar preços das matérias-primas com base nas cotações selecionadas
      if (quotationItems && supplierQuotations) {
        quotationItems.forEach(item => {
          const selectedQuotation = supplierQuotations.find(
            sq => sq.quotationItemId === item.id && sq.isSelected
          );
          
          if (selectedQuotation) {
            updateMaterialPriceMutation.mutate({
              materialId: item.materialId,
              price: selectedQuotation.unitPrice
            });
          }
        });
      }
    }
  };

  const handleSupplierSelectionChange = (supplierId: string, checked: boolean) => {
    if (checked) {
      setBatchSupplierForm(prev => ({
        ...prev,
        supplierIds: [...prev.supplierIds, supplierId]
      }));
    } else {
      setBatchSupplierForm(prev => ({
        ...prev,
        supplierIds: prev.supplierIds.filter(id => id !== supplierId)
      }));
    }
  };

  // Funções de formatação e exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  const getQuotationById = (id: number) => {
    return quotations?.find(q => q.id === id);
  };

  const getQuotationTitle = (quotation: Quotation) => {
    return quotation.quotationNumber || "Cotação sem número";
  };

  const getMaterialById = (id: number) => {
    return materials?.find(m => m.id === id);
  };

  const getSupplierById = (id: number) => {
    return suppliers?.find(s => s.id === id);
  };

  const getUnitById = (id: number) => {
    return units?.find(u => u.id === id);
  };

  const getBestPrice = (itemId: number) => {
    const quotes = supplierQuotations?.filter(sq => sq.quotationItemId === itemId) || [];
    if (quotes.length === 0) return null;
    
    // Primeiro verificamos se já existe alguma cotação selecionada
    const selectedQuote = quotes.find(q => q.isSelected);
    if (selectedQuote) return selectedQuote;
    
    // Caso contrário, encontramos o menor preço
    return quotes.reduce((best, current) => 
      best.unitPrice < current.unitPrice ? best : current
    );
  };

  const openQuotationDetail = (id: number) => {
    setSelectedQuotationId(id);
    setIsQuotationDetailOpen(true);
  };

  const openAddItemForm = (quotationId: number) => {
    setSelectedQuotationId(quotationId);
    setIsItemFormOpen(true);
  };

  const openSupplierQuotationForm = (itemId: number) => {
    setSelectedItemId(itemId);
    setIsSupplierQuotationOpen(true);
  };

  const openComparisonView = () => {
    setIsComparisonOpen(true);
  };

  const openBatchSupplierModal = (quotationId: number) => {
    setSelectedQuotationId(quotationId);
    setBatchSupplierForm({ supplierIds: [] });
    setIsBatchSupplierModalOpen(true);
  };

  const openPriceSimulation = () => {
    setSimulationResults(null);
    setIsPriceSimulationOpen(true);
  };

  const isLoading = quotationsLoading || materialsLoading || unitsLoading || suppliersLoading;

  return (
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Cotações e Precificação" 
          subtitle="Sistema integrado de cotações com fornecedores e cálculo de preços"
          icon={<ShoppingCart className="h-6 w-6" />}
        />

        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={openComparisonView} 
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" /> Comparação de Preços
            </Button>
            <Button 
              variant="outline" 
              onClick={openPriceSimulation} 
              className="flex items-center gap-2"
            >
              <FilePlus2 className="h-4 w-4" /> Simulação de Custos
            </Button>
          </div>
          <Button onClick={() => setIsNewQuotationOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Cotação
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cotações</CardTitle>
                <CardDescription>
                  Gerenciamento de cotações com fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quotations && quotations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>Data Limite</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell className="font-medium">
                            {quotation.quotationNumber}
                          </TableCell>
                          <TableCell>{formatDate(quotation.creationDate)}</TableCell>
                          <TableCell>{formatDate(quotation.closingDate)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(quotation.status)}>
                              {getStatusLabel(quotation.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {quotationItems && selectedQuotationId === quotation.id 
                              ? quotationItems.length 
                              : 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openQuotationDetail(quotation.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Detalhes
                              </Button>
                              {quotation.status === 'open' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openAddItemForm(quotation.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Item
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openBatchSupplierModal(quotation.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Fornecedores
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma cotação encontrada. Clique em "Nova Cotação" para adicionar.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal para criar nova cotação */}
        <Dialog open={isNewQuotationOpen} onOpenChange={setIsNewQuotationOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Cotação</DialogTitle>
              <DialogDescription>
                Crie uma nova cotação para iniciar o processo de requisição de preços
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuotation}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={quotationForm.title}
                    onChange={handleQuotationInputChange}
                    className="col-span-3"
                    placeholder="Título da cotação (apenas referência)"
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
                    onChange={handleQuotationInputChange}
                    className="col-span-3"
                    placeholder="Descrição da cotação"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Data Limite
                  </Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={quotationForm.dueDate}
                    onChange={handleQuotationInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsNewQuotationOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createQuotationMutation.isPending}
                >
                  {createQuotationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Cotação
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Painel lateral para detalhes da cotação */}
        <Sheet open={isQuotationDetailOpen} onOpenChange={setIsQuotationDetailOpen}>
          <SheetContent className="sm:max-w-[640px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedQuotationId && getQuotationById(selectedQuotationId) ? 
                  getQuotationTitle(getQuotationById(selectedQuotationId)!) : 'Detalhes da Cotação'}
              </SheetTitle>
              <SheetDescription>
                {selectedQuotationId && getQuotationById(selectedQuotationId)?.notes || 'Sem descrição'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Itens da Cotação</h3>
                {selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                  <Button 
                    size="sm" 
                    onClick={() => openAddItemForm(selectedQuotationId)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                  </Button>
                )}
              </div>
              
              {quotationItemsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : quotationItems && quotationItems.length > 0 ? (
                <div className="space-y-4">
                  {quotationItems.map((item) => {
                    const material = getMaterialById(item.materialId);
                    const unit = getUnitById(item.unitId);
                    const bestPrice = getBestPrice(item.id);
                    
                    return (
                      <Card key={item.id}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{material ? material.name : 'Material não encontrado'}</CardTitle>
                              <CardDescription>
                                {item.quantity} {unit ? unit.symbol : item.unitMeasurement}
                              </CardDescription>
                            </div>
                            {selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                onClick={() => handleDeleteQuotationItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm">
                            <Tabs defaultValue="quotes">
                              <TabsList className="w-full">
                                <TabsTrigger value="quotes">Cotações</TabsTrigger>
                                <TabsTrigger value="best">Melhor Oferta</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="quotes">
                                {supplierQuotationsLoading && selectedItemId === item.id ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  </div>
                                ) : (
                                  <div className="divide-y">
                                    {supplierQuotations?.filter(sq => sq.quotationItemId === item.id).length > 0 ? (
                                      // Ordenamos as cotações para mostrar primeiro a selecionada, depois por menor preço
                                      supplierQuotations
                                        ?.filter(sq => sq.quotationItemId === item.id)
                                        .sort((a, b) => {
                                          if (a.isSelected) return -1;
                                          if (b.isSelected) return 1;
                                          return a.unitPrice - b.unitPrice;
                                        })
                                        .map((sq) => {
                                          const supplier = getSupplierById(sq.supplierId);
                                          return (
                                            <div 
                                              key={sq.id} 
                                              className={`py-2 ${sq.isSelected ? 'bg-blue-50' : ''}`}
                                            >
                                              <div className="flex justify-between items-start mb-1">
                                                <div className="font-medium">
                                                  {supplier ? supplier.name : 'Fornecedor não encontrado'}
                                                  {sq.isSelected && (
                                                    <Badge className="ml-2 bg-blue-100 text-blue-800">
                                                      Selecionado
                                                    </Badge>
                                                  )}
                                                </div>
                                                <div className="font-medium">
                                                  {formatCurrency(sq.unitPrice)}
                                                </div>
                                              </div>
                                              <div className="flex justify-between text-sm text-muted-foreground">
                                                <div>Prazo: {sq.deliveryTime} dias</div>
                                                <div>
                                                  Frete: {formatCurrency(sq.freight)} • 
                                                  Impostos: {formatCurrency(sq.taxes)}
                                                </div>
                                              </div>
                                              {selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                                                <div className="mt-2 flex justify-end">
                                                  <Button 
                                                    size="sm" 
                                                    variant={sq.isSelected ? "outline" : "secondary"}
                                                    disabled={sq.isSelected}
                                                    onClick={() => handleSelectBestQuotation(sq.id)}
                                                  >
                                                    {sq.isSelected && (
                                                      <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
                                                    )}
                                                    {sq.isSelected ? 'Selecionada' : 'Selecionar'}
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                    ) : (
                                      <div className="py-4 text-center text-muted-foreground">
                                        Nenhuma cotação de fornecedor disponível.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="best">
                                {bestPrice ? (
                                  <div className="p-4 border rounded-md">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <div className="font-medium">
                                          {getSupplierById(bestPrice.supplierId)?.name || 'Fornecedor não encontrado'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Prazo de entrega: {bestPrice.deliveryTime} dias
                                        </div>
                                      </div>
                                      <div className="text-lg font-bold text-green-600">
                                        {formatCurrency(bestPrice.unitPrice)}
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Frete:</span> {formatCurrency(bestPrice.freight)}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Impostos:</span> {formatCurrency(bestPrice.taxes)}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Total:</span> {formatCurrency(bestPrice.totalPrice)}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Pagamento:</span> {bestPrice.paymentTerms || 'Não especificado'}
                                      </div>
                                    </div>
                                    
                                    {bestPrice.notes && (
                                      <div className="mt-2 text-sm">
                                        <span className="text-muted-foreground">Observações:</span> {bestPrice.notes}
                                      </div>
                                    )}
                                    
                                    {!bestPrice.isSelected && selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                                      <Button 
                                        size="sm" 
                                        className="mt-4 w-full"
                                        onClick={() => handleSelectBestQuotation(bestPrice.id)}
                                      >
                                        Selecionar como Melhor Oferta
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="py-4 text-center text-muted-foreground">
                                    Nenhuma cotação de fornecedor disponível.
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 px-4 py-2">
                          {selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-auto"
                              onClick={() => {
                                setSelectedItemId(item.id);
                                openSupplierQuotationForm(item.id);
                              }}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Adicionar Cotação
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground border rounded-md">
                  Nenhum item na cotação. Clique em "Adicionar Item" para começar.
                </div>
              )}
            </div>
            
            <SheetFooter className="mt-6">
              {selectedQuotationId && getQuotationById(selectedQuotationId)?.status === 'open' && (
                <Button 
                  onClick={() => handleCloseQuotation(selectedQuotationId)}
                  disabled={closeQuotationMutation.isPending}
                >
                  {closeQuotationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Fechar Cotação e Atualizar Preços
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Modal para adicionar item à cotação */}
        <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Adicionar Item à Cotação</DialogTitle>
              <DialogDescription>
                {selectedQuotationId && `Adicionando item à cotação: ${getQuotationById(selectedQuotationId) ? getQuotationTitle(getQuotationById(selectedQuotationId)!) : ''}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddQuotationItem}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="materialId" className="text-right">
                    Material
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={itemForm.materialId}
                      onValueChange={(value) => handleSelectChange("materialId", value, setItemForm)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} ({material.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedMaterial && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                      Estoque atual: {selectedMaterial.currentStock} {selectedMaterial.unit} • 
                      Preço atual: {formatCurrency(selectedMaterial.price || 0)}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={itemForm.quantity}
                    onChange={handleItemInputChange}
                    className="col-span-3"
                    placeholder="Quantidade desejada"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unitId" className="text-right">
                    Unidade
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={itemForm.unitId}
                      onValueChange={(value) => handleSelectChange("unitId", value, setItemForm)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          ?.filter(unit => !itemForm.originalUnitType || unit.type === itemForm.originalUnitType)
                          .map((unit) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.name} ({unit.symbol})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsItemFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createQuotationItemMutation.isPending}
                >
                  {createQuotationItemMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal para adicionar cotação de fornecedor */}
        <Dialog open={isSupplierQuotationOpen} onOpenChange={setIsSupplierQuotationOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Adicionar Cotação de Fornecedor</DialogTitle>
              <DialogDescription>
                {selectedItemId && quotationItems && (
                  <>
                    Item: {getMaterialById(
                      quotationItems.find(item => item.id === selectedItemId)?.materialId || 0
                    )?.name || 'Material não encontrado'}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSupplierQuotation}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplierId" className="text-right">
                    Fornecedor
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={supplierQuotationForm.supplierId}
                      onValueChange={(value) => handleSelectChange("supplierId", value, setSupplierQuotationForm)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Preço Unitário
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={supplierQuotationForm.price}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Preço unitário"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="freight" className="text-right">
                    Frete
                  </Label>
                  <Input
                    id="freight"
                    name="freight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={supplierQuotationForm.freight}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Valor do frete"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taxes" className="text-right">
                    Impostos
                  </Label>
                  <Input
                    id="taxes"
                    name="taxes"
                    type="number"
                    min="0"
                    step="0.01"
                    value={supplierQuotationForm.taxes}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Valor de impostos"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deliveryTime" className="text-right">
                    Prazo (dias)
                  </Label>
                  <Input
                    id="deliveryTime"
                    name="deliveryTime"
                    type="number"
                    min="0"
                    value={supplierQuotationForm.deliveryTime}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Prazo de entrega em dias"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paymentTerms" className="text-right">
                    Pagamento
                  </Label>
                  <Input
                    id="paymentTerms"
                    name="paymentTerms"
                    value={supplierQuotationForm.paymentTerms}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Condições de pagamento"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={supplierQuotationForm.notes}
                    onChange={handleSupplierQuotationInputChange}
                    className="col-span-3"
                    placeholder="Observações adicionais"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsSupplierQuotationOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createSupplierQuotationMutation.isPending}
                >
                  {createSupplierQuotationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Cotação
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal para adicionar vários fornecedores de uma vez */}
        <Dialog open={isBatchSupplierModalOpen} onOpenChange={setIsBatchSupplierModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Múltiplos Fornecedores</DialogTitle>
              <DialogDescription>
                Selecione os fornecedores que deseja adicionar à cotação de uma vez
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBatchSuppliers}>
              <div className="py-4">
                <div className="overflow-y-auto max-h-[300px] border rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {suppliers?.map((supplier) => (
                      <div key={supplier.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`supplier-${supplier.id}`} 
                          checked={batchSupplierForm.supplierIds.includes(supplier.id.toString())}
                          onCheckedChange={(checked) => 
                            handleSupplierSelectionChange(supplier.id.toString(), checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`supplier-${supplier.id}`}
                          className="text-sm font-normal"
                        >
                          {supplier.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    {batchSupplierForm.supplierIds.length} fornecedores selecionados
                  </div>
                  <div className="space-x-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setBatchSupplierForm({ supplierIds: [] })}
                    >
                      Limpar seleção
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        if (suppliers) {
                          setBatchSupplierForm({ 
                            supplierIds: suppliers.map(s => s.id.toString()) 
                          });
                        }
                      }}
                    >
                      Selecionar todos
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsBatchSupplierModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={!batchSupplierForm.supplierIds.length}
                >
                  Adicionar Fornecedores
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal para visualização comparativa de cotações */}
        <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Comparação de Preços</DialogTitle>
              <DialogDescription>
                Análise comparativa de preços de matérias-primas entre fornecedores
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Tabs defaultValue="materials">
                <TabsList className="w-full">
                  <TabsTrigger value="materials">Por Material</TabsTrigger>
                  <TabsTrigger value="suppliers">Por Fornecedor</TabsTrigger>
                  <TabsTrigger value="history">Histórico de Preços</TabsTrigger>
                </TabsList>
                
                <TabsContent value="materials" className="mt-4">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Melhor Preço</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Preço Anterior</TableHead>
                          <TableHead>Variação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials?.slice(0, 5).map((material) => {
                          // Simulação de dados para demonstração
                          const price = Math.random() * 100 + 10;
                          const oldPrice = price * (1 + (Math.random() * 0.2 - 0.1));
                          const variation = ((price - oldPrice) / oldPrice) * 100;
                          
                          return (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>{formatCurrency(price)}</TableCell>
                              <TableCell>
                                {suppliers ? suppliers[Math.floor(Math.random() * suppliers.length)]?.name : '-'}
                              </TableCell>
                              <TableCell>{formatCurrency(oldPrice)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {variation > 0 ? (
                                    <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
                                  )}
                                  <span className={variation > 0 ? 'text-red-500' : 'text-green-500'}>
                                    {Math.abs(variation).toFixed(2)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="suppliers" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Análise comparativa por fornecedor será implementada em breve.
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Histórico de preços com gráficos será implementado em breve.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsComparisonOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para simulação de preços de produtos */}
        <Dialog open={isPriceSimulationOpen} onOpenChange={setIsPriceSimulationOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Simulação de Custos e Preços</DialogTitle>
              <DialogDescription>
                Calcule os custos de produção e preços sugeridos com base nas cotações
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Tabs defaultValue="simulation">
                <TabsList className="w-full">
                  <TabsTrigger value="simulation">Simulação</TabsTrigger>
                  <TabsTrigger value="results" disabled={!simulationResults}>Resultados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simulation" className="mt-4">
                  <form onSubmit={handleRunPriceSimulation}>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productId" className="text-right">
                          Produto
                        </Label>
                        <div className="col-span-3">
                          <Select
                            value={simulationForm.productId}
                            onValueChange={(value) => handleSelectChange("productId", value, setSimulationForm)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          Quantidade
                        </Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          value={simulationForm.quantity}
                          onChange={handleSimulationInputChange}
                          className="col-span-3"
                          placeholder="Quantidade para simulação"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">
                          Incluir
                        </Label>
                        <div className="col-span-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeFixedCosts"
                              checked={simulationForm.includeFixedCosts}
                              onCheckedChange={(checked) => 
                                handleSimulationCheckboxChange("includeFixedCosts", checked as boolean)
                              }
                            />
                            <Label htmlFor="includeFixedCosts" className="font-normal">
                              Custos Fixos
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeLabor"
                              checked={simulationForm.includeLabor}
                              onCheckedChange={(checked) => 
                                handleSimulationCheckboxChange("includeLabor", checked as boolean)
                              }
                            />
                            <Label htmlFor="includeLabor" className="font-normal">
                              Mão de Obra
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeOverhead"
                              checked={simulationForm.includeOverhead}
                              onCheckedChange={(checked) => 
                                handleSimulationCheckboxChange("includeOverhead", checked as boolean)
                              }
                            />
                            <Label htmlFor="includeOverhead" className="font-normal">
                              Despesas Gerais
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!simulationForm.productId || simulatePricingMutation.isPending}
                      >
                        {simulatePricingMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Calcular Simulação
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="results" className="mt-4">
                  {simulationResults ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Custos de Matéria-Prima</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatCurrency(simulationResults.materialCost || 0)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Custo total de matérias-primas por unidade
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Custo Total por Unidade</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatCurrency(simulationResults.unitCost || 0)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Incluindo todos os custos selecionados
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Mão de Obra</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {formatCurrency(simulationResults.laborCost || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Custos Fixos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {formatCurrency(simulationResults.fixedCost || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Despesas Gerais</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {formatCurrency(simulationResults.overheadCost || 0)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-4">Simulação de Preços de Venda</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Margem</TableHead>
                              <TableHead>Preço de Venda</TableHead>
                              <TableHead>Lucro por Unidade</TableHead>
                              <TableHead>Lucro Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[20, 30, 40, 50].map((margin) => {
                              const unitCost = simulationResults.unitCost || 0;
                              const salePrice = unitCost * (1 + (margin / 100));
                              const profitPerUnit = salePrice - unitCost;
                              const totalProfit = profitPerUnit * parseInt(simulationForm.quantity);
                              
                              return (
                                <TableRow key={margin}>
                                  <TableCell>{margin}%</TableCell>
                                  <TableCell>{formatCurrency(salePrice)}</TableCell>
                                  <TableCell>{formatCurrency(profitPerUnit)}</TableCell>
                                  <TableCell>{formatCurrency(totalProfit)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Execute uma simulação para ver os resultados.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsPriceSimulationOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default EnhancedQuotationsPage;