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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

// Form schema for expense
const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  paymentDate: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
  costCenter: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const FinanceExpenses = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaid, setFilterPaid] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // Query for expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Form
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      paymentDate: "",
      category: "",
      isRecurring: false,
      recurrenceFrequency: "",
      recurrenceEndDate: "",
      costCenter: "",
    },
  });

  // Watch the isRecurring field to conditionally render recurrence options
  const isRecurring = form.watch("isRecurring");

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expense: ExpenseFormValues) => {
      // Convert string values to the right types for the API
      const apiExpense = {
        ...expense,
        amount: parseFloat(expense.amount),
        recurrenceInfo: expense.isRecurring
          ? {
              frequency: expense.recurrenceFrequency,
              endDate: expense.recurrenceEndDate,
            }
          : undefined,
      };
      return await apiRequest("POST", "/api/expenses", apiExpense);
    },
    onSuccess: () => {
      // Invalidate and refetch the expenses query
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch the expenses query
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsDeleteDialogOpen(false);
      setSelectedExpenseId(null);
    },
  });

  // Filter expenses by search term and paid status
  const filteredExpenses =
    expenses?.filter((expense: any) => {
      const searchMatch =
        `${expense.description} ${expense.category} ${expense.costCenter || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const paidMatch =
        filterPaid === undefined ||
        (filterPaid === true && expense.paymentDate) ||
        (filterPaid === false && !expense.paymentDate);
      return searchMatch && paidMatch;
    }) || [];

  // Calculate total amounts
  const totalAmount = filteredExpenses.reduce(
    (sum: number, expense: any) => sum + expense.amount,
    0,
  );
  const paidAmount = filteredExpenses
    .filter((expense: any) => expense.paymentDate)
    .reduce((sum: number, expense: any) => sum + expense.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  // Column definition for expenses table
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
      header: "Situação",
      accessorKey: "paymentDate",
      cell: (row: any) => {
        if (row.paymentDate) {
          return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900">
              Pago em {new Date(row.paymentDate).toLocaleDateString("pt-BR")}
            </span>
          );
        }

        // Check if the due date is past
        const now = new Date();
        const dueDate = new Date(row.dueDate);
        const isPastDue = dueDate < now;

        if (isPastDue) {
          return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900">
              Vencida
            </span>
          );
        }

        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900">
            Pendente
          </span>
        );
      },
    },
    {
      header: "Categoria",
      accessorKey: "category",
    },
    {
      header: "Centro de Custo",
      accessorKey: "costCenter",
      cell: (row: any) => row.costCenter || "-",
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
            setSelectedExpenseId(row.id);
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
            // Mark as paid functionality would go here
            console.log("Mark as paid:", row.id);
          }}
        >
          {row.paymentDate ? "Estornar" : "Pagar"}
        </Button>
      </div>
    ),
  };

  // Handle form submission
  const onSubmit = (data: ExpenseFormValues) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas despesas fixas e variáveis
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredExpenses || []}
            filename="despesas"
            label="Exportar"
            pdfTitle="Relatório de Despesas"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valor Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(paidAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valor Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(pendingAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar despesas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterPaid === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid(undefined)}
          >
            Todas
          </Button>
          <Button
            variant={filterPaid === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid(false)}
          >
            Pendentes
          </Button>
          <Button
            variant={filterPaid === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid(true)}
          >
            Pagas
          </Button>
        </div>
      </div>

      {/* Expenses table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredExpenses.length || 0) / 10),
          onPageChange: setCurrentPage,
        }}
      />

      {/* Create expense dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma nova despesa.
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
                      <Input placeholder="Descrição da despesa" {...field} />
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="energia">Energia</SelectItem>
                          <SelectItem value="água">Água</SelectItem>
                          <SelectItem value="telefone">
                            Telefone/Internet
                          </SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="manutenção">Manutenção</SelectItem>
                          <SelectItem value="folha">
                            Folha de Pagamento
                          </SelectItem>
                          <SelectItem value="tributos">Tributos</SelectItem>
                          <SelectItem value="serviços">Serviços</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
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
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento (opcional)</FormLabel>
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
                name="costCenter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um centro de custo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="administrativo">
                          Administrativo
                        </SelectItem>
                        <SelectItem value="produção">Produção</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="logística">Logística</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="rh">Recursos Humanos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Despesa Recorrente
                      </FormLabel>
                      <FormDescription>
                        Marque se esta despesa se repete periodicamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrenceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">
                              Trimestral
                            </SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término (opcional)</FormLabel>
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
              )}

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
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Despesa"
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
              Tem certeza que deseja excluir esta despesa? Esta ação não pode
              ser desfeita.
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
                selectedExpenseId &&
                deleteExpenseMutation.mutate(selectedExpenseId)
              }
              disabled={deleteExpenseMutation.isPending}
            >
              {deleteExpenseMutation.isPending ? (
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

export default FinanceExpenses;
