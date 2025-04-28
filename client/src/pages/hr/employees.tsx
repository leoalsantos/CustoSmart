import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Search, Edit, Trash2, Plus, CalendarIcon, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { insertEmployeeSchema, type Employee, type InsertEmployee } from "@shared/schema";

const formSchema = insertEmployeeSchema.extend({
  birthDate: z.date().optional(),
  hiringDate: z.date(),
  terminationDate: z.date().optional(),
});

type Status = "active" | "terminated" | "on_leave";

export default function EmployeesPage() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  // Buscar funcionários do servidor
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/employees");
      const data = await res.json();
      return data as Employee[];
    },
  });

  // Mutation para adicionar funcionário
  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/hr/employees", employee);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      toast({
        title: "Funcionário adicionado",
        description: "O funcionário foi adicionado com sucesso.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para editar funcionário
  const editEmployeeMutation = useMutation({
    mutationFn: async (employee: Partial<Employee> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/employees/${employee.id}`, employee);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      toast({
        title: "Funcionário atualizado",
        description: "As informações do funcionário foram atualizadas com sucesso.",
      });
      setIsAddDialogOpen(false);
      setSelectedEmployee(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir funcionário
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/hr/employees/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi excluído com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar/editar funcionário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      rg: "",
      gender: "",
      maritalStatus: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      email: "",
      phone: "",
      cellphone: "",
      position: "",
      department: "",
      salary: 0,
      status: "active",
      notes: "",
    },
  });

  // Configurar o formulário para edição
  useEffect(() => {
    if (isEditMode && selectedEmployee) {
      form.reset({
        name: selectedEmployee.name,
        cpf: selectedEmployee.cpf || undefined,
        rg: selectedEmployee.rg || undefined,
        birthDate: selectedEmployee.birthDate ? new Date(selectedEmployee.birthDate) : undefined,
        gender: selectedEmployee.gender || undefined,
        maritalStatus: selectedEmployee.maritalStatus || undefined,
        address: selectedEmployee.address || undefined,
        city: selectedEmployee.city || undefined,
        state: selectedEmployee.state || undefined,
        postalCode: selectedEmployee.postalCode || undefined,
        email: selectedEmployee.email || undefined,
        phone: selectedEmployee.phone || undefined,
        cellphone: selectedEmployee.cellphone || undefined,
        position: selectedEmployee.position,
        department: selectedEmployee.department,
        hiringDate: selectedEmployee.hiringDate ? new Date(selectedEmployee.hiringDate) : new Date(),
        salary: selectedEmployee.salary || undefined,
        status: selectedEmployee.status as "active" | "terminated" | "on_leave",
        terminationDate: selectedEmployee.terminationDate ? new Date(selectedEmployee.terminationDate) : undefined,
        notes: selectedEmployee.notes || undefined,
      });
    }
  }, [isEditMode, selectedEmployee, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedEmployee) {
      editEmployeeMutation.mutate({ id: selectedEmployee.id, ...values });
    } else {
      addEmployeeMutation.mutate(values);
    }
  }

  function handleEditEmployee(employee: Employee) {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  }

  function handleDeleteEmployee(employee: Employee) {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  }

  function handleAddNewClick() {
    setIsEditMode(false);
    setSelectedEmployee(null);
    form.reset({
      name: "",
      cpf: "",
      rg: "",
      gender: "",
      maritalStatus: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      email: "",
      phone: "",
      cellphone: "",
      position: "",
      department: "",
      hiringDate: new Date(),
      salary: 0,
      status: "active",
      notes: "",
    });
    setIsAddDialogOpen(true);
  }

  // Filtragem de funcionários
  const filteredEmployees = employees.filter((employee) => {
    // Filtro por status
    if (statusFilter !== "all" && employee.status !== statusFilter) {
      return false;
    }

    // Filtro por texto
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchTermLower) ||
        employee.position.toLowerCase().includes(searchTermLower) ||
        employee.department.toLowerCase().includes(searchTermLower) ||
        (employee.cpf && employee.cpf.includes(searchTerm))
      );
    }

    return true;
  });

  // Gerar contador de status
  const statusCounts = employees.reduce(
    (acc, employee) => {
      const status = employee.status as Status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<Status, number>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionários da empresa
          </p>
        </div>
        <Button onClick={handleAddNewClick}>
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setStatusFilter(value as Status | "all")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({employees.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Ativos ({statusCounts.active || 0})
            </TabsTrigger>
            <TabsTrigger value="on_leave">
              Afastados ({statusCounts.on_leave || 0})
            </TabsTrigger>
            <TabsTrigger value="terminated">
              Desligados ({statusCounts.terminated || 0})
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionários..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <EmployeeTable 
            employees={filteredEmployees} 
            onEdit={handleEditEmployee} 
            onDelete={handleDeleteEmployee} 
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-0">
          <EmployeeTable 
            employees={filteredEmployees} 
            onEdit={handleEditEmployee} 
            onDelete={handleDeleteEmployee}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="on_leave" className="mt-0">
          <EmployeeTable 
            employees={filteredEmployees} 
            onEdit={handleEditEmployee} 
            onDelete={handleDeleteEmployee}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="terminated" className="mt-0">
          <EmployeeTable 
            employees={filteredEmployees} 
            onEdit={handleEditEmployee} 
            onDelete={handleDeleteEmployee}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar/editar funcionário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edite as informações do funcionário no formulário abaixo." 
                : "Preencha as informações do novo funcionário no formulário abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do funcionário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="RG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento</FormLabel>
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viúvo">Viúvo(a)</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
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
                        <Input placeholder="Telefone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cellphone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="Celular" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="CEP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Departamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hiringDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Contratação</FormLabel>
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1980-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="on_leave">Afastado</SelectItem>
                          <SelectItem value="terminated">Desligado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("status") === "terminated" && (
                  <FormField
                    control={form.control}
                    name="terminationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Desligamento</FormLabel>
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1980-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                  disabled={addEmployeeMutation.isPending || editEmployeeMutation.isPending}
                >
                  {isEditMode ? "Salvar Alterações" : "Adicionar Funcionário"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação para excluir */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o funcionário "{selectedEmployee?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedEmployee && deleteEmployeeMutation.mutate(selectedEmployee.id)}
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para a tabela de funcionários
function EmployeeTable({ 
  employees, 
  onEdit, 
  onDelete, 
  isLoading 
}: { 
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isLoading: boolean;
}) {
  function getStatusBadge(status: string) {
    const statusStyles = {
      active: "bg-green-100 text-green-800",
      on_leave: "bg-yellow-100 text-yellow-800",
      terminated: "bg-red-100 text-red-800",
    };
    
    const statusLabels = {
      active: "Ativo",
      on_leave: "Afastado",
      terminated: "Desligado",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-60">
            <p className="text-muted-foreground">Carregando funcionários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-60">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum funcionário encontrado</h3>
            <p className="text-muted-foreground">
              Adicione funcionários para visualizá-los aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="font-medium">{employee.name}</div>
                  {employee.email && (
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                  )}
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>
                  {employee.hiringDate 
                    ? format(new Date(employee.hiringDate), "dd/MM/yyyy", { locale: ptBR })
                    : "N/A"
                  }
                </TableCell>
                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(employee)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(employee)}>
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