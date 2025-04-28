import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, Trash2, Plus, CalendarIcon, DollarSign, Download, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { insertPayrollSchema, type Employee, type Payroll, type InsertPayroll } from "@shared/schema";

const formSchema = insertPayrollSchema.extend({
  paymentDate: z.date().optional(),
});

type PayrollStatus = "pending" | "processed" | "paid";

const payrollMonths = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function PayrollPage() {
  const { toast } = useToast();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "all">("all");
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());

  // Buscar folhas de pagamento do servidor
  const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery({
    queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/hr/payrolls?year=${selectedYear}&month=${selectedMonth}`);
      const data = await res.json();
      return data as Payroll[];
    },
  });

  // Buscar funcionários do servidor
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/employees");
      const data = await res.json();
      return data as Employee[];
    },
  });

  // Mutation para adicionar folha de pagamento
  const addPayrollMutation = useMutation({
    mutationFn: async (payroll: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/hr/payrolls", payroll);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth] });
      toast({
        title: "Folha de pagamento adicionada",
        description: "A folha de pagamento foi adicionada com sucesso.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar folha de pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para editar folha de pagamento
  const editPayrollMutation = useMutation({
    mutationFn: async (payroll: Partial<Payroll> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/payrolls/${payroll.id}`, payroll);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth] });
      toast({
        title: "Folha de pagamento atualizada",
        description: "As informações da folha de pagamento foram atualizadas com sucesso.",
      });
      setIsAddDialogOpen(false);
      setSelectedPayroll(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar folha de pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para gerar folha de pagamento
  const generatePayrollMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const res = await apiRequest("POST", "/api/hr/payrolls/generate", { year, month });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth] });
      toast({
        title: "Folha de pagamento gerada",
        description: "A folha de pagamento foi gerada com sucesso.",
      });
      setIsGenerateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar folha de pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para processar folha de pagamento
  const processPayrollMutation = useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const res = await apiRequest("POST", "/api/hr/payrolls/process", { year, month });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth] });
      toast({
        title: "Folha de pagamento processada",
        description: "A folha de pagamento foi processada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar folha de pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir folha de pagamento
  const deletePayrollMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/hr/payrolls/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payrolls", selectedYear, selectedMonth] });
      toast({
        title: "Folha de pagamento excluída",
        description: "A folha de pagamento foi excluída com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPayroll(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir folha de pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calcular totais
  const totals = payrolls.reduce(
    (acc, p) => {
      acc.gross += p.grossSalary;
      acc.net += p.netSalary;
      acc.inss += p.inss || 0;
      acc.irrf += p.irrf || 0;
      acc.fgts += p.fgts || 0;
      acc.benefits += p.benefits || 0;
      acc.deductions += p.deductions || 0;
      acc.bonuses += p.bonuses || 0;
      return acc;
    },
    { gross: 0, net: 0, inss: 0, irrf: 0, fgts: 0, benefits: 0, deductions: 0, bonuses: 0 }
  );

  // Form para adicionar/editar folha de pagamento
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: undefined,
      year: currentYear,
      month: new Date().getMonth() + 1,
      baseSalary: 0,
      grossSalary: 0,
      netSalary: 0,
      inss: 0,
      irrf: 0,
      fgts: 0,
      benefits: 0,
      deductions: 0,
      bonuses: 0,
      status: "pending",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedPayroll) {
      editPayrollMutation.mutate({ id: selectedPayroll.id, ...values });
    } else {
      addPayrollMutation.mutate(values);
    }
  }

  function handleEditPayroll(payroll: Payroll) {
    setSelectedPayroll(payroll);
    setIsEditMode(true);
    form.reset({
      employeeId: payroll.employeeId,
      year: payroll.year,
      month: payroll.month,
      baseSalary: payroll.baseSalary,
      grossSalary: payroll.grossSalary,
      netSalary: payroll.netSalary,
      inss: payroll.inss || 0,
      irrf: payroll.irrf || 0,
      fgts: payroll.fgts || 0,
      benefits: payroll.benefits || 0,
      deductions: payroll.deductions || 0,
      bonuses: payroll.bonuses || 0,
      paymentDate: payroll.paymentDate ? new Date(payroll.paymentDate) : undefined,
      status: payroll.status as PayrollStatus,
      notes: payroll.notes || undefined,
    });
    setIsAddDialogOpen(true);
  }

  function handleDeletePayroll(payroll: Payroll) {
    setSelectedPayroll(payroll);
    setIsDeleteDialogOpen(true);
  }

  function handleAddNewClick() {
    setIsEditMode(false);
    setSelectedPayroll(null);
    form.reset({
      employeeId: undefined,
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
      baseSalary: 0,
      grossSalary: 0,
      netSalary: 0,
      inss: 0,
      irrf: 0,
      fgts: 0,
      benefits: 0,
      deductions: 0,
      bonuses: 0,
      status: "pending",
      notes: "",
    });
    setIsAddDialogOpen(true);
  }

  function handleGeneratePayrollClick() {
    setIsGenerateDialogOpen(true);
  }

  function handleProcessPayroll() {
    processPayrollMutation.mutate({
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    });
  }

  function handleGeneratePayroll() {
    generatePayrollMutation.mutate({
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    });
  }

  function handleExportClick() {
    // Esta função seria para exportar para PDF ou Excel
    toast({
      title: "Exportação de folha de pagamento",
      description: "A exportação não está implementada ainda. Use esta função para exportar para PDF ou Excel.",
    });
  }

  // Filtragem de folhas de pagamento
  const filteredPayrolls = payrolls.filter((payroll) => {
    // Filtro por status
    if (statusFilter !== "all" && payroll.status !== statusFilter) {
      return false;
    }

    // Filtro por texto
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const employee = employees.find(emp => emp.id === payroll.employeeId);
      return (
        (employee && employee.name.toLowerCase().includes(searchTermLower)) ||
        (payroll.notes && payroll.notes.toLowerCase().includes(searchTermLower))
      );
    }

    return true;
  });

  // Gerar contador de status
  const statusCounts = payrolls.reduce(
    (acc, payroll) => {
      const status = payroll.status as PayrollStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<PayrollStatus, number>
  );

  // Auxiliares
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Funcionário Desconhecido";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = isLoadingPayrolls || isLoadingEmployees;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie a folha de pagamento da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportClick} variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleProcessPayroll} disabled={payrolls.length === 0 || processPayrollMutation.isPending}>
            {processPayrollMutation.isPending ? "Processando..." : "Processar Folha"}
          </Button>
          <Button onClick={handleGeneratePayrollClick}>
            <Plus className="mr-2 h-4 w-4" /> Gerar Folha
          </Button>
          <Button onClick={handleAddNewClick}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {payrollMonths.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar folha de pagamento..."
            className="pl-8 w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setStatusFilter(value as PayrollStatus | "all")}>
        <div className="flex mb-4">
          <TabsList>
            <TabsTrigger value="all">
              Todas ({payrolls.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({statusCounts.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Processadas ({statusCounts.processed || 0})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Pagas ({statusCounts.paid || 0})
            </TabsTrigger>
          </TabsList>
        </div>
        
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-muted-foreground">Total Bruto</div>
                <div className="text-xl font-bold">{formatCurrency(totals.gross)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-muted-foreground">Total Líquido</div>
                <div className="text-xl font-bold">{formatCurrency(totals.net)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-muted-foreground">Total INSS</div>
                <div className="text-xl font-bold">{formatCurrency(totals.inss)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-muted-foreground">Total FGTS</div>
                <div className="text-xl font-bold">{formatCurrency(totals.fgts)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all" className="mt-0">
          <PayrollTable 
            payrolls={filteredPayrolls}
            employees={employees}
            onEdit={handleEditPayroll}
            onDelete={handleDeletePayroll}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <PayrollTable 
            payrolls={filteredPayrolls}
            employees={employees}
            onEdit={handleEditPayroll}
            onDelete={handleDeletePayroll}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
        <TabsContent value="processed" className="mt-0">
          <PayrollTable 
            payrolls={filteredPayrolls}
            employees={employees}
            onEdit={handleEditPayroll}
            onDelete={handleDeletePayroll}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
        <TabsContent value="paid" className="mt-0">
          <PayrollTable 
            payrolls={filteredPayrolls}
            employees={employees}
            onEdit={handleEditPayroll}
            onDelete={handleDeletePayroll}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar/editar folha de pagamento */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Item da Folha" : "Adicionar Item da Folha"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edite as informações do item da folha de pagamento no formulário abaixo." 
                : "Preencha as informações do novo item da folha de pagamento no formulário abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees
                            .filter(emp => emp.status === "active")
                            .map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="processed">Processado</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mês</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o mês" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payrollMonths.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Base</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(value);
                            // Auto-calculate gross salary if base salary changes
                            const bonuses = form.getValues().bonuses || 0;
                            form.setValue("grossSalary", value + bonuses);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bonuses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonificações</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            // Update gross salary when bonuses change
                            const baseSalary = form.getValues().baseSalary;
                            form.setValue("grossSalary", baseSalary + value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grossSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Bruto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(value);
                            // Auto-calculate net salary
                            const deductions = form.getValues().deductions || 0;
                            const inss = form.getValues().inss || 0;
                            const irrf = form.getValues().irrf || 0;
                            form.setValue("netSalary", value - deductions - inss - irrf);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="inss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>INSS</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            // Update net salary
                            const grossSalary = form.getValues().grossSalary;
                            const deductions = form.getValues().deductions || 0;
                            const irrf = form.getValues().irrf || 0;
                            form.setValue("netSalary", grossSalary - deductions - value - irrf);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="irrf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IRRF</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            // Update net salary
                            const grossSalary = form.getValues().grossSalary;
                            const deductions = form.getValues().deductions || 0;
                            const inss = form.getValues().inss || 0;
                            form.setValue("netSalary", grossSalary - deductions - inss - value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fgts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FGTS</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benefícios</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descontos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            field.onChange(value);
                            // Update net salary
                            const grossSalary = form.getValues().grossSalary;
                            const inss = form.getValues().inss || 0;
                            const irrf = form.getValues().irrf || 0;
                            form.setValue("netSalary", grossSalary - value - inss - irrf);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="netSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Líquido</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Pagamento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Observações adicionais"
                        rows={3}
                        {...field}
                        value={field.value || ""}
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
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPayrollMutation.isPending || editPayrollMutation.isPending}
                >
                  {isEditMode ? "Salvar Alterações" : "Adicionar Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para gerar folha de pagamento */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Folha de Pagamento</DialogTitle>
            <DialogDescription>
              Isso irá criar automaticamente itens de folha de pagamento para todos os funcionários ativos.
              Selecione o período para gerar a folha.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="generateYear">Ano</Label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger id="generateYear">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="generateMonth">Mês</Label>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger id="generateMonth">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {payrollMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsGenerateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGeneratePayroll}
              disabled={generatePayrollMutation.isPending}
            >
              {generatePayrollMutation.isPending ? "Gerando..." : "Gerar Folha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação para excluir */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este item da folha de pagamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPayroll && deletePayrollMutation.mutate(selectedPayroll.id)}
              disabled={deletePayrollMutation.isPending}
            >
              {deletePayrollMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente Label para o dialog de gerar folha
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1"
    >
      {children}
    </label>
  );
}

// Componente para a tabela de folha de pagamento
function PayrollTable({ 
  payrolls, 
  employees,
  onEdit, 
  onDelete,
  isLoading,
  formatCurrency
}: { 
  payrolls: Payroll[];
  employees: Employee[];
  onEdit: (payroll: Payroll) => void;
  onDelete: (payroll: Payroll) => void;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}) {
  function getStatusBadge(status: PayrollStatus) {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      processed: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
    };
    
    const statusLabels = {
      pending: "Pendente",
      processed: "Processado",
      paid: "Pago",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    );
  }
  
  function getEmployeeName(employeeId: number) {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Funcionário Desconhecido";
  }
  
  function getMonthName(month: number) {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return monthNames[month - 1];
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-60">
            <p className="text-muted-foreground">Carregando folha de pagamento...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (payrolls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-60">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum item na folha de pagamento</h3>
            <p className="text-muted-foreground">
              Adicione itens à folha de pagamento para visualizá-los aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Bruto</TableHead>
              <TableHead>Líquido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>
                  <div className="font-medium">{getEmployeeName(payroll.employeeId)}</div>
                </TableCell>
                <TableCell>
                  {getMonthName(payroll.month)}/{payroll.year}
                  {payroll.paymentDate && (
                    <div className="text-sm text-muted-foreground">
                      Pago em: {format(new Date(payroll.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(payroll.grossSalary)}</TableCell>
                <TableCell>{formatCurrency(payroll.netSalary)}</TableCell>
                <TableCell>{getStatusBadge(payroll.status as PayrollStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(payroll)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(payroll)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}