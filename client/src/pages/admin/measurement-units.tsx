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
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, PlusCircle, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ui/export-button";
import { toast } from "@/hooks/use-toast";

// Form schema for measurement unit
const unitSchema = z.object({
  symbol: z.string().min(1, "Símbolo é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  baseUnit: z.boolean().default(false),
  conversionFactor: z.coerce.number().min(0.0001, "Fator de conversão deve ser maior que 0").default(1)
});

type UnitFormValues = z.infer<typeof unitSchema>;

const MeasurementUnits = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Queries
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["/api/measurement-units"],
  });
  
  // Form
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      symbol: "",
      name: "",
      type: "mass",
      baseUnit: false,
      conversionFactor: 1
    },
  });
  
  // Create measurement unit mutation
  const createUnitMutation = useMutation({
    mutationFn: async (unit: UnitFormValues) => {
      return await apiRequest("POST", "/api/measurement-units", unit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Unidade de medida criada",
        description: "A unidade de medida foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar unidade de medida",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update measurement unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UnitFormValues }) => {
      return await apiRequest("PATCH", `/api/measurement-units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      setIsEditDialogOpen(false);
      setSelectedUnitId(null);
      toast({
        title: "Unidade de medida atualizada",
        description: "A unidade de medida foi atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar unidade de medida",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete measurement unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/measurement-units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurement-units"] });
      setIsDeleteDialogOpen(false);
      setSelectedUnitId(null);
      toast({
        title: "Unidade de medida excluída",
        description: "A unidade de medida foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir unidade de medida",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter measurement units by search term
  const filteredUnits = units?.filter((unit: any) => {
    const searchString = `${unit.symbol} ${unit.name} ${unit.type}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Column definition for units table
  const columns = [
    {
      header: "Símbolo",
      accessorKey: "symbol",
    },
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (row: any) => {
        const typeDisplay: Record<string, string> = {
          'mass': 'Massa',
          'volume': 'Volume',
          'length': 'Comprimento',
          'area': 'Área',
          'time': 'Tempo',
          'temperature': 'Temperatura',
          'quantity': 'Quantidade'
        };
        return typeDisplay[row.type as keyof typeof typeDisplay] || row.type;
      }
    },
    {
      header: "Unidade Base",
      accessorKey: "baseUnit",
      cell: (row: any) => (
        <Badge variant={row.baseUnit ? "default" : "outline"}>
          {row.baseUnit ? "Sim" : "Não"}
        </Badge>
      )
    },
    {
      header: "Fator de Conversão",
      accessorKey: "conversionFactor",
      cell: (row: any) => row.conversionFactor.toFixed(4)
    },
  ];
  
  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedUnitId(row.id);
            form.reset({
              symbol: row.symbol,
              name: row.name,
              type: row.type,
              baseUnit: row.baseUnit,
              conversionFactor: row.conversionFactor
            });
            setIsEditDialogOpen(true);
          }}
        >
          Editar
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => {
            setSelectedUnitId(row.id);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ),
  };
  
  // Handle form submission
  const onSubmit = (data: UnitFormValues) => {
    if (isEditDialogOpen && selectedUnitId) {
      updateUnitMutation.mutate({ id: selectedUnitId, data });
    } else {
      createUnitMutation.mutate(data);
    }
  };
  
  // Toggle base unit
  const handleBaseUnitChange = (checked: boolean) => {
    if (checked) {
      // Se for marcado como unidade base, definir fator de conversão como 1
      form.setValue("conversionFactor", 1);
    }
    form.setValue("baseUnit", checked);
  };
  
  const isLoading = unitsLoading || createUnitMutation.isPending || updateUnitMutation.isPending || deleteUnitMutation.isPending;
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Unidades de Medida</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as unidades de medida para produtos e matérias-primas
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredUnits}
            filename="unidades-medida"
            label="Exportar"
            pdfTitle="Unidades de Medida"
            pdfSubtitle="Relatório de unidades de medida do sistema"
          />
          <Button onClick={() => {
            form.reset({
              symbol: "",
              name: "",
              type: "mass",
              baseUnit: false,
              conversionFactor: 1
            });
            setIsCreateDialogOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUnits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unidades de Massa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUnits.filter((u: any) => u.type === "mass").length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unidades de Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUnits.filter((u: any) => u.type === "volume").length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unidades Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUnits.filter((u: any) => u.baseUnit).length}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar unidades..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Units table */}
      <DataTable
        columns={columns}
        data={filteredUnits}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredUnits.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      {/* Create/Edit unit dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedUnitId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Editar Unidade de Medida" : "Nova Unidade de Medida"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Edite os detalhes da unidade de medida abaixo."
                : "Preencha os detalhes para criar uma nova unidade de medida."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Símbolo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: kg, L, m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Quilograma, Litro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mass">Massa</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="length">Comprimento</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                        <SelectItem value="time">Tempo</SelectItem>
                        <SelectItem value="temperature">Temperatura</SelectItem>
                        <SelectItem value="quantity">Quantidade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="baseUnit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={handleBaseUnitChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Unidade Base</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Marque esta opção se esta for a unidade base do tipo selecionado
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="conversionFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fator de Conversão</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.0001"
                        min="0.0001"
                        disabled={form.watch("baseUnit")}
                        placeholder="Ex: 1000 para kg -> g" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Valor para converter da unidade base para esta unidade
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditDialogOpen ? "Salvar Alterações" : "Criar Unidade"}
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
              Tem certeza que deseja excluir esta unidade de medida? 
              Esta ação não pode ser desfeita.
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
              onClick={() => selectedUnitId && deleteUnitMutation.mutate(selectedUnitId)}
              disabled={deleteUnitMutation.isPending}
            >
              {deleteUnitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeasurementUnits;