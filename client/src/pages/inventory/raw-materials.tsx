import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search, PlusCircle, Trash2, AlertTriangle } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Form schema for raw material
const materialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().min(1, "Código é obrigatório"),
  unit: z.string().min(1, "Unidade de medida é obrigatória"),
  currentStock: z.string().min(0, "Estoque atual é obrigatório"),
  minimumStock: z.string().min(0, "Estoque mínimo é obrigatório"),
  locationInWarehouse: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

const InventoryRawMaterials = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  
  // Query for raw materials
  const { data: rawMaterials = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/raw-materials"],
  });
  
  // Material form
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      code: "",
      unit: "",
      currentStock: "0",
      minimumStock: "0",
      locationInWarehouse: "",
    },
  });
  
  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (material: MaterialFormValues) => {
      // Convert string values to the right types for the API
      const apiMaterial = {
        ...material,
        currentStock: parseFloat(material.currentStock),
        minimumStock: parseFloat(material.minimumStock),
      };
      return await apiRequest("POST", "/api/raw-materials", apiMaterial);
    },
    onSuccess: () => {
      // Invalidate and refetch the materials query
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });
  
  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/raw-materials/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the materials query
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setIsDeleteDialogOpen(false);
      setSelectedMaterialId(null);
    },
  });
  
  // Update material stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number, amount: number }) => {
      const material = rawMaterials.find((m: any) => m.id === id);
      if (!material) return;
      
      const newStock = material.currentStock + amount;
      return await apiRequest("PATCH", `/api/raw-materials/${id}`, {
        currentStock: newStock < 0 ? 0 : newStock
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the materials query
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setIsAdjustStockDialogOpen(false);
      setSelectedMaterialId(null);
      setAdjustmentAmount("");
    },
  });
  
  // Filter materials by search term and low stock filter
  const filteredMaterials = rawMaterials?.filter((material: any) => {
    const searchMatch = `${material.name} ${material.code} ${material.locationInWarehouse || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const lowStockMatch = filterLowStock ? material.currentStock < material.minimumStock : true;
    return searchMatch && lowStockMatch;
  }) || [];
  
  // Calculate statistics
  const totalMaterials = rawMaterials?.length || 0;
  const lowStockCount = rawMaterials?.filter((m: any) => m.currentStock < m.minimumStock).length || 0;
  const zeroStockCount = rawMaterials?.filter((m: any) => m.currentStock === 0).length || 0;
  
  // Column definition for materials table
  const columns = [
    {
      header: "Código",
      accessorKey: "code",
    },
    {
      header: "Material",
      accessorKey: "name",
    },
    {
      header: "Estoque Atual",
      accessorKey: "currentStock",
      cell: (row: any) => {
        return `${row.currentStock} ${row.unit}`;
      }
    },
    {
      header: "Estoque Mínimo",
      accessorKey: "minimumStock",
      cell: (row: any) => {
        return `${row.minimumStock} ${row.unit}`;
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const statusType = row.currentStock < row.minimumStock 
          ? (row.currentStock === 0 ? 'zero' : 'low')
          : 'ok';
        
        const statusClasses = {
          'zero': 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
          'low': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
          'ok': 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900'
        };
        
        const displayStatus = {
          'zero': 'Sem estoque',
          'low': 'Baixo',
          'ok': 'Adequado'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[statusType]}`}>
            {displayStatus[statusType]}
          </span>
        );
      }
    },
    {
      header: "Localização",
      accessorKey: "locationInWarehouse",
      cell: (row: any) => row.locationInWarehouse || "-",
    },
  ];
  
  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => {
            setSelectedMaterialId(row.id);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-primary"
          onClick={() => {
            setSelectedMaterialId(row.id);
            setIsAdjustStockDialogOpen(true);
          }}
        >
          Ajustar
        </Button>
      </div>
    ),
  };
  
  // Handle form submission
  const onSubmit = (data: MaterialFormValues) => {
    createMaterialMutation.mutate(data);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Matérias-primas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie o estoque de matérias-primas da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            data={rawMaterials || []}
            filename="materias-primas"
            label="Exportar"
            pdfTitle="Matérias-Primas"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Material
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Materiais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
              {lowStockCount > 0 && (
                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Atenção
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-red-600">{zeroStockCount}</div>
              {zeroStockCount > 0 && (
                <Badge variant="outline" className="ml-2 border-red-500 text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Crítico
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and filter options */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar materiais..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant={filterLowStock ? "default" : "outline"} 
          className="whitespace-nowrap"
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          <AlertTriangle className={`h-4 w-4 mr-2 ${filterLowStock ? "text-white" : "text-yellow-500"}`} />
          Mostrar apenas estoque baixo
        </Button>
      </div>
      
      {/* Materials table */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredMaterials.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      {/* Create material dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Matéria-prima</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova matéria-prima.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: MP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Quilograma (kg)</SelectItem>
                          <SelectItem value="g">Grama (g)</SelectItem>
                          <SelectItem value="l">Litro (L)</SelectItem>
                          <SelectItem value="ml">Mililitro (ml)</SelectItem>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                          <SelectItem value="m">Metro (m)</SelectItem>
                          <SelectItem value="m2">Metro quadrado (m²)</SelectItem>
                          <SelectItem value="m3">Metro cúbico (m³)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationInWarehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização no Depósito</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Prateleira A, Seção 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Atual</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="minimumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMaterialMutation.isPending}>
                  {createMaterialMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Material"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedMaterialId && deleteMaterialMutation.mutate(selectedMaterialId)}
              disabled={deleteMaterialMutation.isPending}
            >
              {deleteMaterialMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Adjust stock dialog */}
      <Dialog open={isAdjustStockDialogOpen} onOpenChange={setIsAdjustStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Informe a quantidade a ser adicionada ou removida do estoque.
              Use valores positivos para entrada e negativos para saída.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaterialId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Material:</span>
                <span>{rawMaterials?.find((m: any) => m.id === selectedMaterialId)?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Estoque Atual:</span>
                <span>
                  {rawMaterials?.find((m: any) => m.id === selectedMaterialId)?.currentStock} 
                  {" "}
                  {rawMaterials?.find((m: any) => m.id === selectedMaterialId)?.unit}
                </span>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="adjustment" className="text-sm font-medium">
                  Quantidade a ajustar:
                </label>
                <Input
                  id="adjustment"
                  type="number"
                  step="0.0001"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Ex: 10 para entrada, -5 para saída"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAdjustStockDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (selectedMaterialId && adjustmentAmount) {
                  adjustStockMutation.mutate({
                    id: selectedMaterialId,
                    amount: parseFloat(adjustmentAmount)
                  });
                }
              }}
              disabled={adjustStockMutation.isPending || !adjustmentAmount}
            >
              {adjustStockMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                "Confirmar Ajuste"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InventoryRawMaterials;
