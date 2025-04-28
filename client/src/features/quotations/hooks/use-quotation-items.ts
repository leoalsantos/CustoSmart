import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { QuotationItem, RawMaterial, MeasurementUnit } from '@shared/schema';

export function useQuotationItems(selectedQuotationId: number | null, materials: RawMaterial[] | undefined, units: MeasurementUnit[] | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  
  const [itemForm, setItemForm] = useState({
    materialId: "",
    quantity: "",
    unitId: "",
    description: "",
    originalUnitType: "",
  });

  // Query para buscar itens de cotação
  const { 
    data: quotationItems, 
    isLoading: quotationItemsLoading 
  } = useQuery<QuotationItem[]>({
    queryKey: ["/api/quotation-items", selectedQuotationId],
    queryFn: async () => {
      if (!selectedQuotationId) return [];
      const response = await apiRequest("GET", `/api/quotations/${selectedQuotationId}/items`);
      return await response.json();
    },
    enabled: !!selectedQuotationId,
  });

  // Mutação para criar item de cotação
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

  // Mutação para excluir item de cotação
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

  // Funções auxiliares
  const resetItemForm = () => {
    setItemForm({
      materialId: "",
      quantity: "",
      unitId: "",
      description: "",
      originalUnitType: "",
    });
    setSelectedMaterial(null);
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMaterialSelect = (materialId: string) => {
    if (!materials) return;
    
    const materialIdNum = parseInt(materialId);
    const material = materials.find(m => m.id === materialIdNum);
    
    if (material) {
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
        materialId,
        originalUnitType: unitType,
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
      setSelectedMaterial(null);
    }
  };

  // Função para criar item de cotação
  const createQuotationItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuotationId) {
      toast({
        title: "Erro",
        description: "Selecione uma cotação primeiro",
        variant: "destructive",
      });
      return;
    }
    
    const itemData = {
      quotationId: selectedQuotationId,
      materialId: parseInt(itemForm.materialId),
      quantity: parseFloat(itemForm.quantity),
      unitId: parseInt(itemForm.unitId),
      description: itemForm.description || "",
    };
    
    createQuotationItemMutation.mutate(itemData);
  };

  return {
    quotationItems,
    quotationItemsLoading,
    selectedItemId,
    setSelectedItemId,
    selectedMaterial,
    itemForm,
    createQuotationItemMutation,
    deleteQuotationItemMutation,
    handleItemInputChange,
    handleMaterialSelect,
    createQuotationItem,
    resetItemForm,
  };
}