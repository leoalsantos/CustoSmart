import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@shared/schema';

export function usePriceSimulation() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [simulationForm, setSimulationForm] = useState({
    productId: "",
    quantity: "1000",
    includeFixedCosts: true,
    includeLabor: true,
    includeOverhead: true,
  });

  // Estado para armazenar resultados da simulação
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Mutação para simular preços
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

  // Funções auxiliares
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

  const handleProductSelect = (productId: string, products: Product[] | undefined) => {
    if (!products) return;
    
    setSimulationForm(prev => ({
      ...prev,
      productId,
    }));
    
    const productIdNum = parseInt(productId);
    const product = products.find(p => p.id === productIdNum);
    
    if (product) {
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  };

  // Função para executar simulação
  const runPriceSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    
    const simulationData = {
      productId: parseInt(simulationForm.productId),
      quantity: parseInt(simulationForm.quantity),
      includeFixedCosts: simulationForm.includeFixedCosts,
      includeLabor: simulationForm.includeLabor,
      includeOverhead: simulationForm.includeOverhead,
    };
    
    simulatePricingMutation.mutate(simulationData);
  };

  const resetSimulation = () => {
    setSimulationForm({
      productId: "",
      quantity: "1000",
      includeFixedCosts: true,
      includeLabor: true,
      includeOverhead: true,
    });
    setSimulationResults(null);
    setSelectedProduct(null);
  };

  return {
    selectedProduct,
    simulationForm,
    simulationResults,
    simulatePricingMutation,
    handleSimulationInputChange,
    handleSimulationCheckboxChange,
    handleProductSelect,
    runPriceSimulation,
    resetSimulation,
    setSimulationForm,
    setSimulationResults,
  };
}