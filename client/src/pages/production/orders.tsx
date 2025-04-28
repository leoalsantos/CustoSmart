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
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, PlusCircle, CalendarDays } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema for production order
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Número da ordem é obrigatório"),
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  status: z.string().min(1, "Status é obrigatório"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const ProductionOrders = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/production-orders"],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      productId: "",
      quantity: "",
      status: "planned",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: OrderFormValues) => {
      // Convert string values to the right types for the API
      const apiOrder = {
        ...order,
        productId: parseInt(order.productId),
        quantity: parseFloat(order.quantity),
      };
      return await apiRequest("POST", "/api/production-orders", apiOrder);
    },
    onSuccess: () => {
      // Invalidate and refetch the orders query
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Filter orders by search term
  const filteredOrders =
    orders?.filter((order: any) => {
      const product = products?.find((p: any) => p.id === order.productId);
      const searchString =
        `${order.orderNumber} ${product?.name || ""} ${order.status}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }) || [];

  // Column definition for orders table
  const columns = [
    {
      header: "Número",
      accessorKey: "orderNumber",
    },
    {
      header: "Produto",
      accessorKey: "productId",
      cell: (row: any) => {
        const product = products?.find((p: any) => p.id === row.productId);
        return product?.name || "Produto não encontrado";
      },
    },
    {
      header: "Quantidade",
      accessorKey: "quantity",
      cell: (row: any) => {
        const product = products?.find((p: any) => p.id === row.productId);
        return `${row.quantity} ${product?.unit || ""}`;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const statusClasses = {
          planned:
            "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900",
          "in-progress":
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900",
          completed:
            "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
          cancelled:
            "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
        };

        const displayStatus = {
          planned: "Planejada",
          "in-progress": "Em andamento",
          completed: "Concluída",
          cancelled: "Cancelada",
        };

        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[row.status as keyof typeof statusClasses] || ""}`}
          >
            {displayStatus[row.status as keyof typeof displayStatus] ||
              row.status}
          </span>
        );
      },
    },
    {
      header: "Data Início",
      accessorKey: "startDate",
      cell: (row: any) => {
        if (!row.startDate) return "-";
        return new Date(row.startDate).toLocaleDateString("pt-BR");
      },
    },
    {
      header: "Previsão",
      accessorKey: "endDate",
      cell: (row: any) => {
        if (!row.endDate) return "-";
        return new Date(row.endDate).toLocaleDateString("pt-BR");
      },
    },
  ];

  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <Link
        href={`/production/orders/${row.id}`}
        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
      >
        Detalhes
      </Link>
    ),
  };

  // Handle form submission
  const onSubmit = (data: OrderFormValues) => {
    createOrderMutation.mutate(data);
  };

  // Functions to generate a default order number
  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const lastOrderNumber = orders?.length
      ? Math.max(
          ...orders.map((o: any) => {
            const num = o.orderNumber.split("-")[1];
            return num ? parseInt(num, 10) : 0;
          }),
        )
      : 0;
    const nextNumber = (lastOrderNumber + 1).toString().padStart(4, "0");
    return `OP-${nextNumber}`;
  };

  // Open dialog handler
  const handleOpenCreateDialog = () => {
    // Set default values
    form.setValue("orderNumber", generateOrderNumber());
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Produção</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e monitore as ordens de produção
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders || []}
            filename="ordens-producao"
            label="Exportar"
            pdfTitle="Ordens de Produção"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Ordens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders?.filter((o: any) => o.status === "in-progress").length ||
                0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders?.filter((o: any) => o.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Planejadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders?.filter((o: any) => o.status === "planned").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar ordens de produção..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        actionColumn={actionColumn}
        isLoading={ordersLoading || productsLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredOrders.length || 0) / 10),
          onPageChange: setCurrentPage,
        }}
      />

      {/* Create order dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova ordem de produção.
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
                      <FormLabel>Número da Ordem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: OP-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="planned">Planejada</SelectItem>
                          <SelectItem value="in-progress">
                            Em andamento
                          </SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
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
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
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
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Previsão</FormLabel>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observações sobre a ordem"
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
                    "Criar Ordem"
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

export default ProductionOrders;
