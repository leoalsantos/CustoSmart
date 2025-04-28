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
import { Loader2, Search, PlusCircle, Trash2, Mail, Phone } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

// Form schema for customer
const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  taxId: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CommercialCustomers = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Query for customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Query for orders to count by customer
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  // Form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      taxId: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
    },
  });
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customer: CustomerFormValues) => {
      return await apiRequest("POST", "/api/customers", customer);
    },
    onSuccess: () => {
      // Invalidate and refetch the customers query
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the customers query
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDeleteDialogOpen(false);
      setSelectedCustomerId(null);
    },
  });
  
  // Filter customers by search term
  const filteredCustomers = customers?.filter((customer: any) => {
    const searchString = `${customer.name} ${customer.contactName || ""} ${customer.email || ""} ${customer.taxId || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];
  
  // Calculate statistics
  const totalCustomers = customers?.length || 0;
  
  // Count orders by customer
  const customerWithOrderCount = filteredCustomers.map((customer: any) => {
    const customerOrders = orders?.filter((o: any) => o.customerId === customer.id) || [];
    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
    };
  });
  
  // Column definition for customers table
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Contato",
      accessorKey: "contactName",
      cell: (row: any) => row.contactName || "-",
    },
    {
      header: "CNPJ/CPF",
      accessorKey: "taxId",
      cell: (row: any) => row.taxId || "-",
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (row: any) => {
        if (!row.email) return "-";
        return (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-gray-500" />
            <a href={`mailto:${row.email}`} className="text-primary hover:underline">
              {row.email}
            </a>
          </div>
        );
      }
    },
    {
      header: "Telefone",
      accessorKey: "phone",
      cell: (row: any) => {
        if (!row.phone) return "-";
        return (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-gray-500" />
            <a href={`tel:${row.phone}`} className="text-primary hover:underline">
              {row.phone}
            </a>
          </div>
        );
      }
    },
    {
      header: "Pedidos",
      accessorKey: "orderCount",
    },
    {
      header: "Total de Compras",
      accessorKey: "totalSpent",
      cell: (row: any) => {
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(row.totalSpent || 0);
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
            setSelectedCustomerId(row.id);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Link
          href={`/commercial/customers/${row.id}`}
          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 px-2 py-1"
        >
          Detalhes
        </Link>
      </div>
    ),
  };
  
  // Handle form submission
  const onSubmit = (data: CustomerFormValues) => {
    createCustomerMutation.mutate(data);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie o cadastro de clientes da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            data={customerWithOrderCount || []}
            filename="clientes"
            label="Exportar"
            pdfTitle="Relatório de Clientes"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Novos este mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers?.filter((c: any) => {
                const creationDate = new Date(c.createdAt);
                const now = new Date();
                return (
                  creationDate.getMonth() === now.getMonth() &&
                  creationDate.getFullYear() === now.getFullYear()
                );
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customerWithOrderCount.filter((c: any) => c.orderCount > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Buscar clientes..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Customers table */}
      <DataTable
        columns={columns}
        data={customerWithOrderCount}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredCustomers.length || 0) / 10),
          onPageChange: setCurrentPage
        }}
      />
      
      {/* Create customer dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo cliente.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome/Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo ou razão social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ/CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="Somente números" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Pessoa de contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Endereço completo" 
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
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Cliente"
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
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
              onClick={() => selectedCustomerId && deleteCustomerMutation.mutate(selectedCustomerId)}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? (
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
    </>
  );
};

export default CommercialCustomers;
