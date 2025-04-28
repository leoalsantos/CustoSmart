import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Search, Edit, Trash2, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Employee, type Department, type InsertDepartment, insertDepartmentSchema } from "@shared/schema";

const formSchema = insertDepartmentSchema.extend({});

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar departamentos do servidor
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/hr/departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/departments");
      const data = await res.json();
      return data as Department[];
    },
  });

  // Buscar funcionários do servidor (para selecionar gerentes)
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/employees");
      const data = await res.json();
      return data as Employee[];
    },
  });

  // Mutation para adicionar departamento
  const addDepartmentMutation = useMutation({
    mutationFn: async (department: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/hr/departments", department);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/departments"] });
      toast({
        title: "Departamento adicionado",
        description: "O departamento foi adicionado com sucesso.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar departamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para editar departamento
  const editDepartmentMutation = useMutation({
    mutationFn: async (department: Partial<Department> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/departments/${department.id}`, department);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/departments"] });
      toast({
        title: "Departamento atualizado",
        description: "As informações do departamento foram atualizadas com sucesso.",
      });
      setIsAddDialogOpen(false);
      setSelectedDepartment(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar departamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir departamento
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/hr/departments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/departments"] });
      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir departamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar/editar departamento
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: undefined,
      parentDepartmentId: undefined,
      budget: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedDepartment) {
      editDepartmentMutation.mutate({ id: selectedDepartment.id, ...values });
    } else {
      addDepartmentMutation.mutate(values);
    }
  }

  function handleEditDepartment(department: Department) {
    setSelectedDepartment(department);
    setIsEditMode(true);
    form.reset({
      name: department.name,
      description: department.description || undefined,
      managerId: department.managerId || undefined,
      parentDepartmentId: department.parentDepartmentId || undefined,
      budget: department.budget || undefined,
    });
    setIsAddDialogOpen(true);
  }

  function handleDeleteDepartment(department: Department) {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  }

  function handleAddNewClick() {
    setIsEditMode(false);
    setSelectedDepartment(null);
    form.reset({
      name: "",
      description: "",
      managerId: undefined,
      parentDepartmentId: undefined,
      budget: undefined,
    });
    setIsAddDialogOpen(true);
  }

  // Filtragem de departamentos
  const filteredDepartments = departments.filter((department) => {
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        department.name.toLowerCase().includes(searchTermLower) ||
        (department.description && department.description.toLowerCase().includes(searchTermLower))
      );
    }
    return true;
  });

  // Função auxiliar para encontrar o nome do gerente
  const getManagerName = (managerId: number | null | undefined) => {
    if (!managerId) return "Não definido";
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? manager.name : "Desconhecido";
  };

  // Função auxiliar para encontrar o nome do departamento pai
  const getParentDepartmentName = (parentId: number | null | undefined) => {
    if (!parentId) return "Departamento Principal";
    const parent = departments.find(dept => dept.id === parentId);
    return parent ? parent.name : "Desconhecido";
  };

  const isLoading = isLoadingDepartments || isLoadingEmployees;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os departamentos da empresa
          </p>
        </div>
        <Button onClick={handleAddNewClick}>
          <Plus className="mr-2 h-4 w-4" /> Novo Departamento
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar departamentos..."
            className="pl-8 w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <p className="text-muted-foreground">Carregando departamentos...</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-60">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum departamento encontrado</h3>
              <p className="text-muted-foreground">
                Adicione departamentos para visualizá-los aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento Superior</TableHead>
                  <TableHead>Gerente</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="font-medium">{department.name}</div>
                      {department.description && (
                        <div className="text-sm text-muted-foreground">{department.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{getParentDepartmentName(department.parentDepartmentId)}</TableCell>
                    <TableCell>{getManagerName(department.managerId)}</TableCell>
                    <TableCell>
                      {department.budget 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(department.budget)
                        : "Não definido"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditDepartment(department)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDepartment(department)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar departamento */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Departamento" : "Adicionar Departamento"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edite as informações do departamento no formulário abaixo." 
                : "Preencha as informações do novo departamento no formulário abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do departamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descrição do departamento"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parentDepartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento Superior</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o departamento superior" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum (Departamento Principal)</SelectItem>
                        {departments
                          .filter(d => !selectedDepartment || d.id !== selectedDepartment.id)
                          .map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
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
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente do Departamento</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Não definido</SelectItem>
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
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                  disabled={addDepartmentMutation.isPending || editDepartmentMutation.isPending}
                >
                  {isEditMode ? "Salvar Alterações" : "Adicionar Departamento"}
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
              Tem certeza que deseja excluir o departamento "{selectedDepartment?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedDepartment && deleteDepartmentMutation.mutate(selectedDepartment.id)}
              disabled={deleteDepartmentMutation.isPending}
            >
              {deleteDepartmentMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}