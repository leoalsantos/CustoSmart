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
import { Loader2, Search, PlusCircle, CalendarDays, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ExportButton } from "@/components/ui/export-button";

// Form schema for order
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório"),
  customerId: z.string().min(1, "Cliente é obrigatório"),
  orderDate: z.string().min(1, "Data do pedido é obrigatória"),
  deliveryDate: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  totalAmount: z.string().min(1, "Valor total é obrigatório"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "Produto é obrigatório"),
    quantity: z.string().min(1, "Quantidade é obrigatória"),
    unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  })).optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const CommercialOrders = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState<string>("all");
  
  // Queries
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      customerId: "",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      status: "new",
      totalAmount: "",
      notes: "",
      items: [{ productId: "", quantity: "", unitPrice: "" }],
    },
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: OrderFormValues) => {
      // Convert string values to the right types for the API
      const apiOrder = {
        ...order,
        customerId: parseInt(order.customerId),
        totalAmount: parseFloat(order.totalAmount),
        items: order.items?.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice)
        }))
      };
      return await apiRequest("POST", "/api/orders", apiOrder);
    },
    onSuccess: () => {
      // Invalidate and refetch the orders query
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });
  
  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the orders query
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDeleteDialogOpen(false);
      setSelectedOrderId(null);
    },
  });
  
  // Filter orders by search term and current tab
  const filteredOrders = orders?.filter((order: any) => {
    const customer = customers?.find((c: any) => c.id === order.customerId);
    const searchString = `${order.orderNumber} ${customer?.name || ""} ${order.status}`.toLowerCase();
    const searchMatch = searchString.includes(searchTerm.toLowerCase());
    
    if (currentTab === "all") {
      return searchMatch;
    } else {
      return searchMatch && order.status === currentTab;
    }
  }) || [];
  
  // Calculate statistics
  const totalOrders = orders?.length || 0;
  const newOrders = orders?.filter((o: any) => o.status === "new").length || 0;
  const inProgressOrders = orders?.filter((o: any) => o.status === "in-progress").length || 0;
  const deliveredOrders = orders?.filter((o: any) => o.status === "delivered").length || 0;
  const cancelledOrders = orders?.filter((o: any) => o.status === "cancelled").length || 0;
  
  const totalRevenue = orders?.reduce((sum: number, order: any) => {
    if (order.status !== "cancelled") {
      return sum + (order.totalAmount || 0);
    }
    return sum;
  }, 0) || 0;
  
  // Functions to generate a default order number
  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const lastOrderNumber = orders?.length 
      ? Math.max(...orders.map((o: any) => {
          const num = o.orderNumber.split('-')[1];
          return num ? parseInt(num, 10) : 0;
        }))
      : 0;
    const nextNumber = (lastOrderNumber + 1).toString().padStart(4, '0');
    return `PV-${nextNumber}`;
  };
  
  // Column definition for orders table
  const columns = [
    {
      header: "Número",
      accessorKey: "orderNumber",
    },
    {
      header: "Cliente",
      accessorKey: "customerId",
      cell: (row: any) => {
        const customer = customers?.find((c: any) => c.id === row.customerId);
        return customer?.name || "Cliente não encontrado";
      }
    },
    {
      header: "Data do Pedido",
      accessorKey: "orderDate",
      cell: (row: any) => {
        if (!row.orderDate) return "-";
        return new Date(row.orderDate).toLocaleDateString('pt-BR');
      }
    },
    {
      header: "Entrega",
      accessorKey: "deliveryDate",
      cell: (row: any) => {
        if (!row.deliveryDate) return "-";
        return new Date(row.deliveryDate).toLocaleDateString('pt-BR');
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const statusClasses = {
          'new': 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
          'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
          'delivered': 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
          'cancelled': 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900'
        };
        
        const displayStatus = {
          'new': 'Novo',
          'in-progress': 'Em andamento',
          'delivered': 'Entregue',
          'cancelled': 'Cancelado'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[row.status as keyof typeof statusClasses] || ''}`}>
            {displayStatus[row.status as keyof typeof displayStatus] || row.status}
          </span>
        );
      }
    },
    {
      header: "Valor Total",
      accessorKey: "totalAmount",
      cell: (row: any) => {
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(row.totalAmount || 0);
      }
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
            setSelectedOrderId(row.id);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Link
          href={`/commercial/orders/${row.id}`}
          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 px-2 py-1"
        >
          Detalhes
        </Link>
      </div>
    ),
  };
  
  // Handle form submission
  const onSubmit = (data: OrderFormValues) => {
    createOrderMutation.mutate(data);
  };
  
  // Calculate total amount based on items
  const calculateTotal = () => {
    const items = form.watch("items") || [];
    let total = 0;
    
    items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      total += quantity * price;
    });
    
    form.setValue("totalAmount", total.toString());
  };
  
  // Add new item to the order
  const addItem = () => {
    const items = form.watch("items") || [];
    form.setValue("items", [...items, { productId: "", quantity: "", unitPrice: "" }]);
  };
  
  // Remove item from the order
  const removeItem = (index: number) => {
    const items = form.watch("items") || [];
    form.setValue("items", items.filter((_, i) => i !== index));
    calculateTotal();
  };
  
  // Open dialog handler
  const handleOpenCreateDialog = () => {
    // Set default values
    form.setValue('orderNumber', generateOrderNumber());
    form.setValue('orderDate', new Date().toISOString().split("T")[0]);
    form.setValue('status', 'new');
    setIsCreateDialogOpen(true);
  };
  
  const isLoading = ordersLoading || customersLoading || productsLoading;
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de Venda</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os pedidos de venda da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders}
            filename="pedidos-vendas"
            label="Exportar"
            pdfTitle="Pedidos de Venda"
            pdfSubtitle="Relatório de pedidos gerado pelo CustoSmart"
          />
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">{newOrders} novos</Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{inProgressOrders} em andamento</Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">{deliveredOrders} entregues</Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">{cancelledOrders} cancelados</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar pedidos..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Select value={currentTab} onValueChange={setCurrentTab}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Novos</SelectItem>
              <SelectItem value="in-progress">Em andamento</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Orders table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredOrders.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
        export={{
          enabled: true,
          filename: "pedidos-venda",
          title: "Pedidos de Venda",
          subtitle: "Relatório gerado pelo CustoSmart"
        }}
      />
      
      {/* Create order dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Pedido de Venda</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo pedido.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Pedido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PV-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Pedido</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Entrega</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input type="date" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="in-progress">Em andamento</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Itens do Pedido</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addItem}
                  >
                    Adicionar Item
                  </Button>
                </div>
                
                {form.watch("items")?.map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Produto</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Auto-fill price from selected product
                                const product = products?.find((p: any) => p.id.toString() === value);
                                if (product && product.sellingPrice) {
                                  form.setValue(`items.${index}.unitPrice`, product.sellingPrice.toString());
                                  calculateTotal();
                                }
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Qtd</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotal();
                                }}
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
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Preço Unit.</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotal();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => removeItem(index)}
                        disabled={form.watch("items")?.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                          readOnly 
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre o pedido" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Pedido"
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
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
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
              onClick={() => selectedOrderId && deleteOrderMutation.mutate(selectedOrderId)}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? (
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
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-md font-semibold text-blue-700 dark:text-blue-300 mb-2">Nota sobre os pedidos</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Os pedidos impactam diretamente o estoque de produtos acabados. A criação de um pedido reserva 
          a quantidade especificada, e a entrega confirma a saída do estoque.
        </p>
      </div>
    </>
  );
};

export default CommercialOrders;
