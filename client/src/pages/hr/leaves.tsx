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
import { Search, Edit, Trash2, Plus, CalendarIcon, Clock, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { insertLeaveSchema, type Employee, type Leave, type InsertLeave } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

const formSchema = insertLeaveSchema.extend({
  startDate: z.date(),
  endDate: z.date(),
  approvedDate: z.date().optional(),
});

type LeaveStatus = "pending" | "approved" | "rejected" | "completed";
type LeaveType = "vacation" | "sick" | "personal" | "maternity" | "paternity";

const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: "Férias",
  sick: "Licença médica",
  personal: "Licença pessoal",
  maternity: "Licença maternidade",
  paternity: "Licença paternidade"
};

const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Negada",
  completed: "Concluída"
};

export default function LeavesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");

  const isAdmin = user?.role === 'admin';

  // Buscar licenças do servidor
  const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["/api/hr/leaves"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/leaves");
      const data = await res.json();
      return data as Leave[];
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

  // Mutation para adicionar licença
  const addLeaveMutation = useMutation({
    mutationFn: async (leave: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/hr/leaves", leave);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
      toast({
        title: "Licença adicionada",
        description: "A licença foi adicionada com sucesso.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para editar licença
  const editLeaveMutation = useMutation({
    mutationFn: async (leave: Partial<Leave> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/leaves/${leave.id}`, leave);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
      toast({
        title: "Licença atualizada",
        description: "As informações da licença foram atualizadas com sucesso.",
      });
      setIsAddDialogOpen(false);
      setSelectedLeave(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para aprovar licença
  const approveLeaveMutation = useMutation({
    mutationFn: async (leave: Partial<Leave> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/leaves/${leave.id}/approve`, leave);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
      toast({
        title: "Licença aprovada",
        description: "A licença foi aprovada com sucesso.",
      });
      setIsApproveDialogOpen(false);
      setSelectedLeave(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para rejeitar licença
  const rejectLeaveMutation = useMutation({
    mutationFn: async (leave: Partial<Leave> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/hr/leaves/${leave.id}/reject`, leave);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
      toast({
        title: "Licença rejeitada",
        description: "A licença foi rejeitada.",
      });
      setIsRejectDialogOpen(false);
      setSelectedLeave(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir licença
  const deleteLeaveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/hr/leaves/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves"] });
      toast({
        title: "Licença excluída",
        description: "A licença foi excluída com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedLeave(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar/editar licença
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: undefined,
      type: "vacation",
      startDate: new Date(),
      endDate: new Date(),
      status: "pending",
      reason: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedLeave) {
      editLeaveMutation.mutate({ id: selectedLeave.id, ...values });
    } else {
      addLeaveMutation.mutate(values);
    }
  }

  function handleEditLeave(leave: Leave) {
    setSelectedLeave(leave);
    setIsEditMode(true);
    form.reset({
      employeeId: leave.employeeId,
      type: leave.type as LeaveType,
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      status: leave.status as LeaveStatus,
      reason: leave.reason || undefined,
      notes: leave.notes || undefined,
      approvedById: leave.approvedById || undefined,
      approvedDate: leave.approvedDate ? new Date(leave.approvedDate) : undefined,
    });
    setIsAddDialogOpen(true);
  }

  function handleApproveLeave(leave: Leave) {
    setSelectedLeave(leave);
    setIsApproveDialogOpen(true);
  }

  function handleRejectLeave(leave: Leave) {
    setSelectedLeave(leave);
    setIsRejectDialogOpen(true);
  }

  function handleDeleteLeave(leave: Leave) {
    setSelectedLeave(leave);
    setIsDeleteDialogOpen(true);
  }

  function handleAddNewClick() {
    setIsEditMode(false);
    setSelectedLeave(null);
    form.reset({
      employeeId: undefined,
      type: "vacation",
      startDate: new Date(),
      endDate: new Date(),
      status: "pending",
      reason: "",
      notes: "",
    });
    setIsAddDialogOpen(true);
  }

  function approveLeave() {
    if (selectedLeave) {
      approveLeaveMutation.mutate({
        id: selectedLeave.id,
        status: "approved",
        approvedById: user?.id,
        approvedDate: new Date(),
      });
    }
  }

  function rejectLeave() {
    if (selectedLeave) {
      rejectLeaveMutation.mutate({
        id: selectedLeave.id,
        status: "rejected",
        approvedById: user?.id,
        approvedDate: new Date(),
      });
    }
  }

  // Filtragem de licenças
  const filteredLeaves = leaves.filter((leave) => {
    // Filtro por status
    if (statusFilter !== "all" && leave.status !== statusFilter) {
      return false;
    }

    // Filtro por texto
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const employee = employees.find(emp => emp.id === leave.employeeId);
      return (
        (employee && employee.name.toLowerCase().includes(searchTermLower)) ||
        (leave.reason && leave.reason.toLowerCase().includes(searchTermLower)) ||
        (leave.notes && leave.notes.toLowerCase().includes(searchTermLower))
      );
    }

    return true;
  });

  // Gerar contador de status
  const statusCounts = leaves.reduce(
    (acc, leave) => {
      const status = leave.status as LeaveStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<LeaveStatus, number>
  );

  // Auxiliares
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Funcionário Desconhecido";
  };

  const getApproverName = (approverId: number | null | undefined) => {
    if (!approverId) return "-";
    const approver = employees.find(emp => emp.id === approverId);
    return approver ? approver.name : "Desconhecido";
  };

  const isLoading = isLoadingLeaves || isLoadingEmployees;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie as licenças dos funcionários
          </p>
        </div>
        <Button onClick={handleAddNewClick}>
          <Plus className="mr-2 h-4 w-4" /> Nova Licença
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setStatusFilter(value as LeaveStatus | "all")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">
              Todas ({leaves.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({statusCounts.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovadas ({statusCounts.approved || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Negadas ({statusCounts.rejected || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({statusCounts.completed || 0})
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar licenças..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <LeaveTable 
            leaves={filteredLeaves}
            employees={employees}
            onEdit={handleEditLeave}
            onDelete={handleDeleteLeave}
            onApprove={handleApproveLeave}
            onReject={handleRejectLeave}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <LeaveTable 
            leaves={filteredLeaves}
            employees={employees}
            onEdit={handleEditLeave}
            onDelete={handleDeleteLeave}
            onApprove={handleApproveLeave}
            onReject={handleRejectLeave}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="approved" className="mt-0">
          <LeaveTable 
            leaves={filteredLeaves}
            employees={employees}
            onEdit={handleEditLeave}
            onDelete={handleDeleteLeave}
            onApprove={handleApproveLeave}
            onReject={handleRejectLeave}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="rejected" className="mt-0">
          <LeaveTable 
            leaves={filteredLeaves}
            employees={employees}
            onEdit={handleEditLeave}
            onDelete={handleDeleteLeave}
            onApprove={handleApproveLeave}
            onReject={handleRejectLeave}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
          <LeaveTable 
            leaves={filteredLeaves}
            employees={employees}
            onEdit={handleEditLeave}
            onDelete={handleDeleteLeave}
            onApprove={handleApproveLeave}
            onReject={handleRejectLeave}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar/editar licença */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Licença" : "Nova Licença"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edite as informações da licença no formulário abaixo." 
                : "Preencha as informações da nova licença no formulário abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Licença</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vacation">Férias</SelectItem>
                        <SelectItem value="sick">Licença médica</SelectItem>
                        <SelectItem value="personal">Licença pessoal</SelectItem>
                        <SelectItem value="maternity">Licença maternidade</SelectItem>
                        <SelectItem value="paternity">Licença paternidade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
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
                              date < form.getValues().startDate
                            }
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
                        <SelectItem value="approved">Aprovada</SelectItem>
                        <SelectItem value="rejected">Negada</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Motivo da licença"
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
              
              {isAdmin && isEditMode && (form.watch("status") === "approved" || form.watch("status") === "rejected") && (
                <>
                  <FormField
                    control={form.control}
                    name="approvedById"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aprovado/Rejeitado por</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um aprovador" />
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
                    name="approvedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Aprovação/Rejeição</FormLabel>
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
                </>
              )}
              
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
                  disabled={addLeaveMutation.isPending || editLeaveMutation.isPending}
                >
                  {isEditMode ? "Salvar Alterações" : "Adicionar Licença"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação para aprovar */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar licença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar a licença do funcionário{" "}
              {selectedLeave && employees.find(e => e.id === selectedLeave.employeeId)?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={approveLeave}
              disabled={approveLeaveMutation.isPending}
            >
              {approveLeaveMutation.isPending ? "Aprovando..." : "Aprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação para rejeitar */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar licença</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar a licença do funcionário{" "}
              {selectedLeave && employees.find(e => e.id === selectedLeave.employeeId)?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectLeave}
              disabled={rejectLeaveMutation.isPending}
            >
              {rejectLeaveMutation.isPending ? "Rejeitando..." : "Rejeitar"}
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
              Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedLeave && deleteLeaveMutation.mutate(selectedLeave.id)}
              disabled={deleteLeaveMutation.isPending}
            >
              {deleteLeaveMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para a tabela de licenças
function LeaveTable({ 
  leaves, 
  employees,
  onEdit, 
  onDelete,
  onApprove,
  onReject,
  isLoading,
  isAdmin 
}: { 
  leaves: Leave[];
  employees: Employee[];
  onEdit: (leave: Leave) => void;
  onDelete: (leave: Leave) => void;
  onApprove: (leave: Leave) => void;
  onReject: (leave: Leave) => void;
  isLoading: boolean;
  isAdmin: boolean;
}) {
  function getStatusBadge(status: LeaveStatus) {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {leaveStatusLabels[status]}
      </span>
    );
  }
  
  function getEmployeeName(employeeId: number) {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Funcionário Desconhecido";
  }
  
  function getLeaveTypeName(type: string) {
    return leaveTypeLabels[type as LeaveType] || type;
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-60">
            <p className="text-muted-foreground">Carregando licenças...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (leaves.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-60">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma licença encontrada</h3>
            <p className="text-muted-foreground">
              Adicione licenças para visualizá-las aqui.
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
              <TableHead>Funcionário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>
                  <div className="font-medium">{getEmployeeName(leave.employeeId)}</div>
                  {leave.reason && (
                    <div className="text-sm text-muted-foreground">{leave.reason}</div>
                  )}
                </TableCell>
                <TableCell>{getLeaveTypeName(leave.type)}</TableCell>
                <TableCell>
                  <div>
                    {format(new Date(leave.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    {" até "}
                    {format(new Date(leave.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(leave.status as LeaveStatus)}</TableCell>
                <TableCell className="text-right">
                  {isAdmin && leave.status === "pending" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => onApprove(leave)} title="Aprovar">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onReject(leave)} title="Rejeitar">
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(leave)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(leave)}>
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