import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  Plus,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  type Department,
  type Position,
  type InsertPosition,
  insertPositionSchema,
} from "@shared/schema";

const formSchema = insertPositionSchema.extend({});

export default function PositionsPage() {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar cargos do servidor
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["/api/hr/positions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/positions");
      const data = await res.json();
      return data as Position[];
    },
  });

  // Buscar departamentos do servidor
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["/api/hr/departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hr/departments");
      const data = await res.json();
      return data as Department[];
    },
  });

  // Mutation para adicionar cargo
  const addPositionMutation = useMutation({
    mutationFn: async (position: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/hr/positions", position);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/positions"] });
      toast({
        title: "Cargo adicionado",
        description: "O cargo foi adicionado com sucesso.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar cargo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para editar cargo
  const editPositionMutation = useMutation({
    mutationFn: async (position: Partial<Position> & { id: number }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/hr/positions/${position.id}`,
        position,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/positions"] });
      toast({
        title: "Cargo atualizado",
        description: "As informações do cargo foram atualizadas com sucesso.",
      });
      setIsAddDialogOpen(false);
      setSelectedPosition(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cargo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir cargo
  const deletePositionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/hr/positions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/positions"] });
      toast({
        title: "Cargo excluído",
        description: "O cargo foi excluído com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPosition(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cargo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar/editar cargo
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: undefined,
      baseSalary: undefined,
      responsibilities: "",
      requirements: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditMode && selectedPosition) {
      editPositionMutation.mutate({ id: selectedPosition.id, ...values });
    } else {
      addPositionMutation.mutate(values);
    }
  }

  function handleEditPosition(position: Position) {
    setSelectedPosition(position);
    setIsEditMode(true);
    form.reset({
      title: position.title,
      description: position.description || undefined,
      departmentId: position.departmentId || undefined,
      baseSalary: position.baseSalary || undefined,
      responsibilities: position.responsibilities || undefined,
      requirements: position.requirements || undefined,
    });
    setIsAddDialogOpen(true);
  }

  function handleDeletePosition(position: Position) {
    setSelectedPosition(position);
    setIsDeleteDialogOpen(true);
  }

  function handleAddNewClick() {
    setIsEditMode(false);
    setSelectedPosition(null);
    form.reset({
      title: "",
      description: "",
      departmentId: undefined,
      baseSalary: undefined,
      responsibilities: "",
      requirements: "",
    });
    setIsAddDialogOpen(true);
  }

  // Filtragem de cargos
  const filteredPositions = positions.filter((position) => {
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        position.title.toLowerCase().includes(searchTermLower) ||
        (position.description &&
          position.description.toLowerCase().includes(searchTermLower))
      );
    }
    return true;
  });

  // Função auxiliar para encontrar o nome do departamento
  const getDepartmentName = (departmentId: number | null | undefined) => {
    if (!departmentId) return "Não definido";
    const department = departments.find((dept) => dept.id === departmentId);
    return department ? department.name : "Desconhecido";
  };

  const isLoading = isLoadingPositions || isLoadingDepartments;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cargos</h1>
          <p className="text-muted-foreground">Gerencie os cargos da empresa</p>
        </div>
        <Button onClick={handleAddNewClick}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cargos..."
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
              <p className="text-muted-foreground">Carregando cargos...</p>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-60">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum cargo encontrado
              </h3>
              <p className="text-muted-foreground">
                Adicione cargos para visualizá-los aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Salário Base</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div className="font-medium">{position.title}</div>
                      {position.description && (
                        <div className="text-sm text-muted-foreground">
                          {position.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getDepartmentName(position.departmentId)}
                    </TableCell>
                    <TableCell>
                      {position.baseSalary
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(position.baseSalary)
                        : "Não definido"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPosition(position)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePosition(position)}
                      >
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

      {/* Dialog para adicionar/editar cargo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Cargo" : "Adicionar Cargo"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edite as informações do cargo no formulário abaixo."
                : "Preencha as informações do novo cargo no formulário abaixo."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do cargo" {...field} />
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
                        placeholder="Descrição do cargo"
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
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Não definido</SelectItem>
                        {departments.map((dept) => (
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
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsabilidades</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Responsabilidades do cargo"
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
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Requisitos do cargo"
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
                  disabled={
                    addPositionMutation.isPending ||
                    editPositionMutation.isPending
                  }
                >
                  {isEditMode ? "Salvar Alterações" : "Adicionar Cargo"}
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
              Tem certeza que deseja excluir o cargo "{selectedPosition?.title}
              "? Esta ação não pode ser desfeita.
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
                selectedPosition &&
                deletePositionMutation.mutate(selectedPosition.id)
              }
              disabled={deletePositionMutation.isPending}
            >
              {deletePositionMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
