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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, PlusCircle, CalendarDays } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema for maintenance order
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Número da ordem é obrigatório"),
  equipmentId: z.string().min(1, "Selecione um equipamento"),
  type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  urgency: z.string().min(1, "Urgência é obrigatória"),
  status: z.string().min(1, "Status é obrigatório"),
  scheduledDate: z.string().optional(),
  completionDate: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const MaintenanceOrders = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Queries
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/maintenance-orders"],
  });
  
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });
  
  // Form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      equipmentId: "",
      type: "preventive",
      description: "",
      urgency: "medium",
      status: "open",
      scheduledDate: "",
      completionDate: "",
      notes: "",
    },
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: OrderFormValues) => {
      // Convert string values to the right types for the API
      const apiOrder = {
        ...order,
        equipmentId: parseInt(order.equipmentId),
      };
      return await apiRequest("POST", "/api/maintenance-orders", apiOrder);
    },
    onSuccess: () => {
      // Invalidate and refetch the orders query
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-orders"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });
  
  // Filter orders by search term
  const filteredOrders = orders?.filter((order: any) => {
    const equipmentItem = equipment?.find((e: any) => e.id === order.equipmentId);
    const searchString = `${order.orderNumber} ${equipmentItem?.name || ""} ${order.type} ${order.description}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Column definition for orders table
  const columns = [
    {
      header: "Número",
      accessorKey: "orderNumber",
    },
    {
      header: "Equipamento",
      accessorKey: "equipmentId",
      cell: (row: any) => {
        const equipmentItem = equipment?.find((e: any) => e.id === row.equipmentId);
        return equipmentItem?.name || "Equipamento não encontrado";
      }
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (row: any) => {
        const typeMap = {
          'preventive': 'Preventiva',
          'corrective': 'Corretiva'
        };
        return typeMap[row.type as keyof typeof typeMap] || row.type;
      }
    },
    {
      header: "Urgência",
      accessorKey: "urgency",
      cell: (row: any) => {
        const urgencyClasses = {
          'high': 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
          'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
          'low': 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900'
        };
        
        const displayUrgency = {
          'high': 'Alta',
          'medium': 'Média',
          'low': 'Baixa'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${urgencyClasses[row.urgency as keyof typeof urgencyClasses] || ''}`}>
            {displayUrgency[row.urgency as keyof typeof displayUrgency] || row.urgency}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const statusClasses = {
          'open': 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
          'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
          'completed': 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900'
        };
        
        const displayStatus = {
          'open': 'Aberta',
          'in-progress': 'Em andamento',
          'completed': 'Concluída'
        };
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[row.status as keyof typeof statusClasses] || ''}`}>
            {displayStatus[row.status as keyof typeof displayStatus] || row.status}
          </span>
        );
      }
    },
    {
      header: "Data Programada",
      accessorKey: "scheduledDate",
      cell: (row: any) => {
        if (!row.scheduledDate) return "-";
        return new Date(row.scheduledDate).toLocaleDateString('pt-BR');
      }
    },
  ];
  
  // Action column
  const actionColumn = {
    header: "Ações",
    cell: (row: any) => (
      <div className="flex space-x-2">
        <Link
          href={`/maintenance/orders/${row.id}`}
          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
        >
          Detalhes
        </Link>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-blue-600 hover:text-blue-900"
          onClick={() => window.location.href = `/maintenance/orders/${row.id}/edit`}
        >
          Editar
        </Button>
        {row.status !== 'completed' && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-green-600 hover:text-green-900"
            onClick={() => window.location.href = `/maintenance/orders/${row.id}/complete`}
          >
            Concluir
          </Button>
        )}
      </div>
    ),
  };
  
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
    return `OM-${nextNumber}`;
  };
  
  // Handle form submission
  const onSubmit = (data: OrderFormValues) => {
    createOrderMutation.mutate(data);
  };
  
  // Open dialog handler
  const handleOpenCreateDialog = () => {
    // Set default values
    form.setValue('orderNumber', generateOrderNumber());
    setIsCreateDialogOpen(true);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Manutenção</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie e monitore as ordens de manutenção
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders || []}
            filename="ordens-manutencao"
            label="Exportar"
            pdfTitle="Relatório de Ordens de Manutenção"
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
            <CardTitle className="text-sm font-medium text-gray-500">Total de Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders?.filter((o: any) => o.status === 'in-progress').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Urgência Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders?.filter((o: any) => o.urgency === 'high' && o.status !== 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders?.filter((o: any) => o.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Buscar ordens de manutenção..." 
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
        isLoading={ordersLoading || equipmentLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredOrders.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      {/* Create order dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Manutenção</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova ordem de manutenção.
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
                        <Input placeholder="Ex: OM-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="equipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o equipamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {equipment?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name}
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
                          <SelectItem value="preventive">Preventiva</SelectItem>
                          <SelectItem value="corrective">Corretiva</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgência</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Descreva o problema ou serviço a ser realizado" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="open">Aberta</SelectItem>
                          <SelectItem value="in-progress">Em andamento</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Programada</FormLabel>
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
                      <Textarea 
                        placeholder="Observações adicionais" 
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

export default MaintenanceOrders;
