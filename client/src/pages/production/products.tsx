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
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, PlusCircle, Plus, X, Package, ArrowDown } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

// Form schema for material in formula
const materialSchema = z.object({
  materialId: z.number().min(1, "Selecione uma matéria-prima"),
  quantity: z.number().min(0.0001, "Quantidade deve ser maior que 0.0001"),
  unit: z.string().optional(), // Unidade de medida, se não fornecida usa a padrão do material
});

// Form schema for product
const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().min(1, "Código é obrigatório"),
  description: z.string().optional(),
  materials: z.array(materialSchema).optional(),
});

type MaterialItem = z.infer<typeof materialSchema>;
type ProductFormValues = z.infer<typeof productSchema>;

const ProductionProducts = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Query for products
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Query for raw materials
  const { data: rawMaterials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["/api/raw-materials"],
  });
  
  // Form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      materials: [],
    },
  });
  
  // Set up field array for materials
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (product: ProductFormValues) => {
      console.log("Form values:", product);
      
      // Convert string values to the right types for the API
      // Cria a estrutura de fórmula a partir dos materiais
      const formulaData = {
        materials: product.materials?.map(material => {
          // Busca a unidade do material se não for especificada
          const rawMaterial = rawMaterials?.find((m: any) => m.id === material.materialId);
          const unit = material.unit || (rawMaterial ? rawMaterial.unit : "");
          
          console.log("Material:", {
            id: material.materialId,
            materialObject: rawMaterial,
            quantity: material.quantity,
            unit: unit
          });
          
          return {
            id: material.materialId,
            quantity: material.quantity,
            unit: unit
          };
        }) || []
      };
      
      const apiProduct = {
        name: product.name,
        code: product.code,
        description: product.description,
        unitCost: 0, // Definido posteriormente na tela de precificação
        sellingPrice: null, // Definido posteriormente na tela de precificação
        formula: formulaData
      };
      
      console.log("API Product:", apiProduct);
      
      try {
        const response = await apiRequest("POST", "/api/products", apiProduct);
        console.log("API Response:", response);
        return response;
      } catch (error) {
        console.error("Error creating product:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the products query
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateDialogOpen(false);
      form.reset({
        name: "",
        code: "",
        description: "",
        materials: []
      });
    },
  });
  
  // Filter products by search term
  const filteredProducts = products?.filter((product: any) => {
    const searchString = `${product.name} ${product.code} ${product.description || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Column definition for products table
  const columns = [
    {
      header: "Código",
      accessorKey: "code",
    },
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Descrição",
      accessorKey: "description",
      cell: (row: any) => row.description || "-",
    },
    {
      header: "Custo Unitário",
      accessorKey: "unitCost",
      cell: (row: any) => {
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(row.unitCost);
      }
    },
    {
      header: "Preço de Venda",
      accessorKey: "sellingPrice",
      cell: (row: any) => {
        if (!row.sellingPrice) return "-";
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(row.sellingPrice);
      }
    },
    {
      header: "Margem",
      accessorKey: "margin",
      cell: (row: any) => {
        if (!row.sellingPrice) return "-";
        const margin = ((row.sellingPrice - row.unitCost) / row.sellingPrice) * 100;
        return `${margin.toFixed(2)}%`;
      }
    },
  ];
  
  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <div className="flex space-x-2 justify-end">
        <Link
          href={`/production/products/${row.id}`}
          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
        >
          Detalhes
        </Link>
        <Link
          href={`/production/products/${row.id}/edit`}
          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
        >
          Editar
        </Link>
      </div>
    ),
  };
  
  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos e Fórmulas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os produtos e suas fórmulas de produção
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            data={products || []}
            filename="produtos"
            label="Exportar"
            pdfTitle="Produtos e Fórmulas"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Custo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products?.length > 0 
                ? new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(
                    products.reduce((sum: number, p: any) => sum + p.unitCost, 0) / products.length
                  )
                : 'R$ 0,00'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Com Fórmula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products?.filter((p: any) => p.formula).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Buscar produtos..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Products table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredProducts.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      {/* Create product dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo produto.
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
                        <Input placeholder="Nome do produto" {...field} />
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
                        <Input placeholder="Ex: PROD-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              

              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Fórmula do Produto</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ materialId: 0, quantity: 0, unit: "" })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Material
                  </Button>
                </div>
                
                {/* Área com barra de rolagem para a fórmula do produto */}
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-md bg-gray-50 dark:bg-gray-800">
                      <Package className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 text-center">Nenhuma matéria-prima adicionada</p>
                      <p className="text-gray-400 text-sm text-center mt-1">
                        Clique no botão acima para adicionar matérias-primas à fórmula
                      </p>
                    </div>
                  )}
                  
                  {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`materials.${index}.materialId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Matéria-prima</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value ? field.value.toString() : undefined}
                              disabled={isLoadingMaterials}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a matéria-prima" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {rawMaterials?.map((material: any) => (
                                  <SelectItem key={material.id} value={material.id.toString()}>
                                    {material.name} ({material.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`materials.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantidade</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.0001"
                                step="0.0001"
                                placeholder="Quantidade"
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`materials.${index}.unit`}
                        render={({ field }) => {
                          // Obter a unidade padrão do material selecionado
                          const selectedMaterial = rawMaterials?.find(
                            (m: any) => m.id === form.watch(`materials.${index}.materialId`)
                          );
                          const defaultUnit = selectedMaterial?.unit || "";
                          
                          // Se a unidade não foi definida manualmente e temos uma unidade padrão, usamos ela
                          if (!field.value && defaultUnit) {
                            field.onChange(defaultUnit);
                          }
                          
                          return (
                            <FormItem>
                              <FormLabel className="text-xs">Escala de Medida</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || defaultUnit}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a escala" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* Filtrar e mostrar apenas unidades compatíveis */}
                                  {(() => {
                                    // Se não houver material selecionado, mostrar todas as opções
                                    if (!selectedMaterial) {
                                      return (
                                        <>
                                          <SelectItem value="kg">kg (Quilograma)</SelectItem>
                                          <SelectItem value="g">g (Grama)</SelectItem>
                                          <SelectItem value="mg">mg (Miligrama)</SelectItem>
                                          <SelectItem value="l">l (Litro)</SelectItem>
                                          <SelectItem value="ml">ml (Mililitro)</SelectItem>
                                          <SelectItem value="m²">m² (Metro Quadrado)</SelectItem>
                                          <SelectItem value="cm²">cm² (Centímetro Quadrado)</SelectItem>
                                          <SelectItem value="mm²">mm² (Milímetro Quadrado)</SelectItem>
                                          <SelectItem value="m">m (Metro)</SelectItem>
                                          <SelectItem value="cm">cm (Centímetro)</SelectItem>
                                          <SelectItem value="mm">mm (Milímetro)</SelectItem>
                                          <SelectItem value="un">un (Unidade)</SelectItem>
                                          <SelectItem value="pç">pç (Peça)</SelectItem>
                                        </>
                                      );
                                    }
                                    
                                    // Agrupar unidades por tipo
                                    const massUnits = [
                                      { value: "kg", label: "kg (Quilograma)" },
                                      { value: "g", label: "g (Grama)" },
                                      { value: "mg", label: "mg (Miligrama)" }
                                    ];
                                    
                                    const volumeUnits = [
                                      { value: "l", label: "l (Litro)" },
                                      { value: "ml", label: "ml (Mililitro)" }
                                    ];
                                    
                                    const areaUnits = [
                                      { value: "m²", label: "m² (Metro Quadrado)" },
                                      { value: "cm²", label: "cm² (Centímetro Quadrado)" },
                                      { value: "mm²", label: "mm² (Milímetro Quadrado)" }
                                    ];
                                    
                                    const lengthUnits = [
                                      { value: "m", label: "m (Metro)" },
                                      { value: "cm", label: "cm (Centímetro)" },
                                      { value: "mm", label: "mm (Milímetro)" }
                                    ];
                                    
                                    const countUnits = [
                                      { value: "un", label: "un (Unidade)" },
                                      { value: "pç", label: "pç (Peça)" }
                                    ];
                                    
                                    // Determinar o tipo de unidade do material
                                    let compatibleUnits = [];
                                    
                                    if (["kg", "g", "mg"].includes(selectedMaterial.unit)) {
                                      compatibleUnits = massUnits;
                                    } else if (["l", "ml"].includes(selectedMaterial.unit)) {
                                      compatibleUnits = volumeUnits;
                                    } else if (["m²", "cm²", "mm²"].includes(selectedMaterial.unit)) {
                                      compatibleUnits = areaUnits;
                                    } else if (["m", "cm", "mm"].includes(selectedMaterial.unit)) {
                                      compatibleUnits = lengthUnits;
                                    } else {
                                      compatibleUnits = countUnits;
                                    }
                                    
                                    return compatibleUnits.map(unit => (
                                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center mt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Produto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductionProducts;
