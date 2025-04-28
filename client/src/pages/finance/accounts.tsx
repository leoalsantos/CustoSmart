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
import {
  Loader2,
  Search,
  PlusCircle,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for account
const accountSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.string().min(1, "Situação é obrigatória"),
  entityName: z.string().min(1, "Nome da entidade é obrigatório"),
  entityId: z.string().optional(),
  documentNumber: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const FinanceAccounts = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Query for accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Query for customers and suppliers for dropdowns
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Form
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      type: "",
      status: "pending",
      entityName: "",
      entityId: "",
      documentNumber: "",
    },
  });

  // Watch the type field to conditionally render entity selection
  const accountType = form.watch("type");

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (account: AccountFormValues) => {
      // Convert string values to the right types for the API
      const apiAccount = {
        ...account,
        amount: parseFloat(account.amount),
        entityId: account.entityId ? parseInt(account.entityId) : undefined,
      };
      return await apiRequest("POST", "/api/accounts", apiAccount);
    },
    onSuccess: () => {
      // Invalidate and refetch the accounts query
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/accounts/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the accounts query
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDeleteDialogOpen(false);
      setSelectedAccountId(null);
    },
  });

  // Update account status mutation
  const updateAccountMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AccountFormValues>;
    }) => {
      return await apiRequest("PATCH", `/api/accounts/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate and refetch the accounts query
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });

  // Filter accounts by search term and current tab
  const filteredAccounts =
    accounts?.filter((account: any) => {
      const searchMatch =
        `${account.description} ${account.entityName} ${account.documentNumber || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      if (currentTab === "all") {
        return searchMatch;
      } else if (currentTab === "payable") {
        return searchMatch && account.type === "payable";
      } else if (currentTab === "receivable") {
        return searchMatch && account.type === "receivable";
      } else if (currentTab === "pending") {
        return searchMatch && account.status === "pending";
      } else if (currentTab === "paid") {
        return searchMatch && account.status === "paid";
      } else if (currentTab === "overdue") {
        return searchMatch && account.status === "overdue";
      }

      return searchMatch;
    }) || [];

  // Calculate total amounts
  const payableTotal =
    accounts
      ?.filter((a: any) => a.type === "payable")
      .reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
  const receivableTotal =
    accounts
      ?.filter((a: any) => a.type === "receivable")
      .reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
  const pendingPayable =
    accounts
      ?.filter((a: any) => a.type === "payable" && a.status === "pending")
      .reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
  const pendingReceivable =
    accounts
      ?.filter((a: any) => a.type === "receivable" && a.status === "pending")
      .reduce((sum: number, a: any) => sum + a.amount, 0) || 0;

  // Column definition for accounts table
  const columns = [
    {
      header: "Descrição",
      accessorKey: "description",
    },
    {
      header: "Valor",
      accessorKey: "amount",
      cell: (row: any) => {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(row.amount);
      },
    },
    {
      header: "Vencimento",
      accessorKey: "dueDate",
      cell: (row: any) => {
        if (!row.dueDate) return "-";
        return new Date(row.dueDate).toLocaleDateString("pt-BR");
      },
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (row: any) => {
        const typeClasses = {
          payable: "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
          receivable:
            "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
        };

        const displayType = {
          payable: "A pagar",
          receivable: "A receber",
        };

        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeClasses[row.type as keyof typeof typeClasses] || ""}`}
          >
            {displayType[row.type as keyof typeof displayType] || row.type}
          </span>
        );
      },
    },
    {
      header: "Situação",
      accessorKey: "status",
      cell: (row: any) => {
        const statusClasses = {
          pending:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900",
          paid: "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
          overdue: "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
        };

        const displayStatus = {
          pending: "Pendente",
          paid: "Pago",
          overdue: "Vencido",
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
      header: "Entidade",
      accessorKey: "entityName",
    },
    {
      header: "Documento",
      accessorKey: "documentNumber",
      cell: (row: any) => row.documentNumber || "-",
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
            setSelectedAccountId(row.id);
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
            const newStatus = row.status === "paid" ? "pending" : "paid";
            updateAccountMutation.mutate({
              id: row.id,
              data: { status: newStatus },
            });
          }}
        >
          {row.status === "paid" ? "Estornar" : "Pagar"}
        </Button>
      </div>
    ),
  };

  // Handle form submission
  const onSubmit = (data: AccountFormValues) => {
    createAccountMutation.mutate(data);
  };

  // Handle entity selection based on type
  const handleEntitySelection = (id: string) => {
    if (accountType === "payable") {
      const supplier = suppliers?.find((s: any) => s.id.toString() === id);
      if (supplier) {
        form.setValue("entityName", supplier.name);
      }
    } else if (accountType === "receivable") {
      const customer = customers?.find((c: any) => c.id.toString() === id);
      if (customer) {
        form.setValue("entityName", customer.name);
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contas a Pagar e Receber</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie contas a pagar e receber da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredAccounts || []}
            filename="contas-a-pagar-receber"
            label="Exportar"
            pdfTitle="Relatório de Contas a Pagar e Receber"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(payableTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(receivableTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pendente a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(pendingPayable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pendente a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(pendingReceivable)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search input and tabs */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar contas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs
          defaultValue="all"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="payable">A Pagar</TabsTrigger>
            <TabsTrigger value="receivable">A Receber</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="paid">Pagas</TabsTrigger>
            <TabsTrigger value="overdue">Vencidas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Accounts table */}
      <DataTable
        columns={columns}
        data={filteredAccounts}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredAccounts.length || 0) / 10),
          onPageChange: setCurrentPage,
        }}
      />

      {/* Create account dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma nova conta a pagar ou
              receber.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da conta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 100.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="payable">A Pagar</SelectItem>
                          <SelectItem value="receivable">A Receber</SelectItem>
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {accountType === "payable" && (
                  <FormField
                    control={form.control}
                    name="entityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleEntitySelection(value);
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((supplier: any) => (
                              <SelectItem
                                key={supplier.id}
                                value={supplier.id.toString()}
                              >
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {accountType === "receivable" && (
                  <FormField
                    control={form.control}
                    name="entityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleEntitySelection(value);
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers?.map((customer: any) => (
                              <SelectItem
                                key={customer.id}
                                value={customer.id.toString()}
                              >
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!accountType && (
                  <FormField
                    control={form.control}
                    name="entityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Entidade</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do cliente ou fornecedor"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: NF-12345" {...field} />
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
                <Button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                >
                  {createAccountMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Conta"
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
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser
              desfeita.
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
              onClick={() =>
                selectedAccountId &&
                deleteAccountMutation.mutate(selectedAccountId)
              }
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
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

export default FinanceAccounts;
