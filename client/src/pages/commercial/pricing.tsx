import React, { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeAlert } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { ProductPricing, Product } from "@shared/schema";

type MaterialBreakdown = {
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
};

type ProductCostAnalysis = {
  materialCost: number;
  laborCost: number;
  overhead: number;
  totalProductionCost: number;
  freightCost: number;
  taxes: number;
  profitMargin: number;
  suggestedPrice: number;
  breakdown: MaterialBreakdown[];
};

const PricingPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCalculationOpen, setIsCalculationOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    laborCost: "",
    overheadCost: "",
    freightCost: "",
    taxes: "",
    profitMargin: "",
  });

  // Obter lista de produtos
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return await response.json();
    }
  });

  // Obter lista de precificações
  const { data: pricings, isLoading: pricingsLoading } = useQuery<ProductPricing[]>({
    queryKey: ["/api/product-pricings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/product-pricings");
      return await response.json();
    }
  });

  // Obter detalhes de custo para um produto específico
  const { data: costAnalysis, isLoading: costAnalysisLoading, refetch: refetchCostAnalysis } = useQuery<ProductCostAnalysis>({
    queryKey: ["/api/product-costs", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await apiRequest("GET", `/api/product-costs/${selectedProductId}`);
      return await response.json();
    },
    enabled: !!selectedProductId,
  });

  // Mutação para criar nova precificação
  const createPricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/product-pricings", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Precificação criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-pricings"] });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao criar precificação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar precificação
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/product-pricings/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Precificação atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/product-pricings"] });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar precificação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      productId: "",
      laborCost: "",
      overheadCost: "",
      freightCost: "",
      taxes: "",
      profitMargin: "",
    });
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      productId: parseInt(formData.productId),
      laborCost: parseFloat(formData.laborCost) || 0,
      overheadCost: parseFloat(formData.overheadCost) || 0,
      freightCost: parseFloat(formData.freightCost) || 0,
      taxes: parseFloat(formData.taxes) || 0,
      profitMargin: parseFloat(formData.profitMargin) || 0,
    };

    // Verificar se o produto já tem precificação
    const existingPricing = pricings?.find(p => p.productId === data.productId);

    if (existingPricing) {
      updatePricingMutation.mutate({ id: existingPricing.id, data });
    } else {
      createPricingMutation.mutate(data);
    }
  };

  const handleCalculationClick = (productId: number) => {
    setSelectedProductId(productId);
    setIsCalculationOpen(true);
    refetchCostAnalysis();
  };

  // Formatador de moeda brasileira
  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Formatador de porcentagem brasileira
  const formatPercent = (value?: number | null) => {
    if (value === undefined || value === null) return "0,00%";
    return `${value.toFixed(2).replace('.', ',')}%`;
  };

  const getProductNameById = (id: number | null) => {
    if (id === null) return "Produto não selecionado";
    const product = products?.find((p) => p.id === id);
    return product ? product.name : "Produto não encontrado";
  };

  const isLoading = productsLoading || pricingsLoading;

  return (
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Precificação de Produtos" 
          subtitle="Gerencie os custos e preços dos produtos"
          icon={<BadgeAlert className="h-6 w-6" />}
        />

        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Precificação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Precificações Cadastradas</CardTitle>
            <CardDescription>
              Lista de precificações de produtos disponíveis no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pricings && pricings.length > 0 ? (
              <Table>
                <TableCaption>Lista de precificações de produtos</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Mão de Obra</TableHead>
                    <TableHead>Overhead</TableHead>
                    <TableHead>Frete</TableHead>
                    <TableHead>Impostos</TableHead>
                    <TableHead>Margem (%)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricings.map((pricing) => (
                    <TableRow key={pricing.id}>
                      <TableCell className="font-medium">
                        {pricing.productId !== null ? getProductNameById(pricing.productId) : "N/A"}
                      </TableCell>
                      <TableCell>{formatCurrency(pricing.laborCost)}</TableCell>
                      <TableCell>{formatCurrency(pricing.overheadCost)}</TableCell>
                      <TableCell>{formatCurrency(pricing.freightCost)}</TableCell>
                      <TableCell>{formatCurrency(pricing.taxes)}</TableCell>
                      <TableCell>{formatPercent(pricing.profitMargin)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => pricing.productId !== null ? handleCalculationClick(pricing.productId) : null}
                        >
                          Calcular Custo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma precificação encontrada. Clique em "Nova Precificação" para adicionar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário para adicionar/editar precificação */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Adicionar Precificação</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da precificação do produto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="productId" className="text-right">
                    Produto
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.productId}
                      onValueChange={(value) =>
                        handleSelectChange("productId", value)
                      }
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
                  <Label htmlFor="laborCost" className="text-right">
                    Mão de Obra (R$)
                  </Label>
                  <Input
                    id="laborCost"
                    name="laborCost"
                    type="number"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={handleFormInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="overheadCost" className="text-right">
                    Overhead (R$)
                  </Label>
                  <Input
                    id="overheadCost"
                    name="overheadCost"
                    type="number"
                    step="0.01"
                    value={formData.overheadCost}
                    onChange={handleFormInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="freightCost" className="text-right">
                    Frete (R$)
                  </Label>
                  <Input
                    id="freightCost"
                    name="freightCost"
                    type="number"
                    step="0.01"
                    value={formData.freightCost}
                    onChange={handleFormInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taxes" className="text-right">
                    Impostos (R$)
                  </Label>
                  <Input
                    id="taxes"
                    name="taxes"
                    type="number"
                    step="0.01"
                    value={formData.taxes}
                    onChange={handleFormInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profitMargin" className="text-right">
                    Margem de Lucro (%)
                  </Label>
                  <Input
                    id="profitMargin"
                    name="profitMargin"
                    type="number"
                    step="0.01"
                    value={formData.profitMargin}
                    onChange={handleFormInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createPricingMutation.isPending || updatePricingMutation.isPending}
                >
                  {(createPricingMutation.isPending || updatePricingMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detalhes e cálculo de custo do produto */}
        <Dialog open={isCalculationOpen} onOpenChange={setIsCalculationOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Análise de Custo do Produto</DialogTitle>
              <DialogDescription>
                {selectedProductId ? `Detalhes de custo para ${getProductNameById(selectedProductId)}` : "Selecione um produto para análise"}
              </DialogDescription>
            </DialogHeader>
            
            {costAnalysisLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : costAnalysis ? (
              <Tabs defaultValue="summary">
                <TabsList className="w-full">
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                  <TabsTrigger value="materials">Materiais</TabsTrigger>
                  <TabsTrigger value="calculation">Cálculo Final</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Custo de Materiais</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{formatCurrency(costAnalysis.materialCost)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Mão de Obra</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{formatCurrency(costAnalysis.laborCost)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Overhead</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{formatCurrency(costAnalysis.overhead)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Custo de Produção Total</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{formatCurrency(costAnalysis.totalProductionCost)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Margem de Lucro</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{formatPercent(costAnalysis.profitMargin)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">Preço Sugerido</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(costAnalysis.suggestedPrice)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="materials">
                  <Table>
                    <TableCaption>Materiais utilizados na fabricação do produto</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Custo Unitário</TableHead>
                        <TableHead>Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costAnalysis.breakdown.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{material.materialName}</TableCell>
                          <TableCell>{material.quantity.toFixed(4)}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell>{formatCurrency(material.unitCost)}</TableCell>
                          <TableCell>{formatCurrency(material.totalCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="calculation">
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Custo de Materiais:</div>
                      <div className="text-right">{formatCurrency(costAnalysis.materialCost)}</div>
                      
                      <div className="font-medium">Custo de Mão de Obra:</div>
                      <div className="text-right">{formatCurrency(costAnalysis.laborCost)}</div>
                      
                      <div className="font-medium">Custo de Overhead:</div>
                      <div className="text-right">{formatCurrency(costAnalysis.overhead)}</div>
                      
                      <div className="border-t pt-2 font-medium">Custo Total de Produção:</div>
                      <div className="border-t pt-2 text-right font-medium">{formatCurrency(costAnalysis.totalProductionCost)}</div>
                      
                      <div className="font-medium">Custo de Frete:</div>
                      <div className="text-right">{formatCurrency(costAnalysis.freightCost)}</div>
                      
                      <div className="font-medium">Impostos:</div>
                      <div className="text-right">{formatCurrency(costAnalysis.taxes)}</div>
                      
                      <div className="border-t pt-2 font-medium">Custo antes da Margem:</div>
                      <div className="border-t pt-2 text-right font-medium">
                        {formatCurrency(costAnalysis.totalProductionCost + costAnalysis.freightCost + costAnalysis.taxes)}
                      </div>
                      
                      <div className="font-medium">Margem de Lucro:</div>
                      <div className="text-right">{formatPercent(costAnalysis.profitMargin)}</div>
                      
                      <div className="border-t border-primary pt-2 font-bold text-primary">Preço Sugerido:</div>
                      <div className="border-t border-primary pt-2 text-right font-bold text-primary">
                        {formatCurrency(costAnalysis.suggestedPrice)}
                      </div>
                    </div>
                    
                    <div className="mt-6 text-sm text-muted-foreground">
                      <p>Fórmula de cálculo: Preço = (Custo Total de Produção + Frete + Impostos) ÷ (1 - Margem de Lucro%)</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                Não foi possível obter os dados de custo para este produto.
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setIsCalculationOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default PricingPage;