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

// Form schema for equipment
const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  sector: z.string().min(1, "Setor é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  criticality: z.string().min(1, "Criticidade é obrigatória"),
  status: z.string().min(1, "Status é obrigatório"),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const MaintenanceEquipment = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Query for equipment
  const { data: equipment, isLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });

  // Form
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      model: "",
      serialNumber: "",
      manufacturer: "",
      purchaseDate: "",
      sector: "",
      type: "",
      criticality: "medium",
      status: "operational",
    },
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: async (equipment: EquipmentFormValues) => {
      return await apiRequest("POST", "/api/equipment", equipment);
    },
    onSuccess: () => {
      // Invalidate and refetch the equipment query
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Filter equipment by search term
  const filteredEquipment =
    equipment?.filter((item: any) => {
      const searchString =
        `${item.name} ${item.model || ""} ${item.serialNumber || ""} ${item.manufacturer || ""} ${item.sector}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    }) || [];

  // Column definition for equipment table
  const columns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Modelo",
      accessorKey: "model",
      cell: (row: any) => row.model || "-",
    },
    {
      header: "Setor",
      accessorKey: "sector",
    },
    {
      header: "Criticidade",
      accessorKey: "criticality",
      cell: (row: any) => {
        const criticalityClasses = {
          high: "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
          medium:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900",
          low: "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
        };

        const displayCriticality = {
          high: "Alta",
          medium: "Média",
          low: "Baixa",
        };

        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${criticalityClasses[row.criticality as keyof typeof criticalityClasses] || ""}`}
          >
            {displayCriticality[
              row.criticality as keyof typeof displayCriticality
            ] || row.criticality}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const statusClasses = {
          operational:
            "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900",
          maintenance:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900",
          broken: "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900",
        };

        const displayStatus = {
          operational: "Operacional",
          maintenance: "Em manutenção",
          broken: "Inoperante",
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
      header: "Fabricante",
      accessorKey: "manufacturer",
      cell: (row: any) => row.manufacturer || "-",
    },
  ];

  // Action column
  const actionColumn = {
    cell: (row: any) => (
      <Link
        href={`/maintenance/equipment/${row.id}`}
        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
      >
        Detalhes
      </Link>
    ),
  };

  // Handle form submission
  const onSubmit = (data: EquipmentFormValues) => {
    createEquipmentMutation.mutate(data);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os equipamentos e máquinas da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredEquipment || []}
            filename="equipamentos"
            label="Exportar"
            pdfTitle="Relatório de Equipamentos"
            pdfSubtitle="Relatório gerado pelo CustoSmart"
            variant="outline"
            size="sm"
          />
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment?.filter((e: any) => e.status === "operational")
                .length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Em Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {equipment?.filter((e: any) => e.status === "maintenance")
                .length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Inoperantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {equipment?.filter((e: any) => e.status === "broken").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar equipamentos..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Equipment table */}
      <DataTable
        columns={columns}
        data={filteredEquipment}
        actionColumn={actionColumn}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages: Math.ceil((filteredEquipment.length || 0) / 10),
          onPageChange: setCurrentPage,
        }}
      />

      {/* Create equipment dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Equipamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo equipamento.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do equipamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Série</FormLabel>
                      <FormControl>
                        <Input placeholder="Nº de série" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabricante</FormLabel>
                      <FormControl>
                        <Input placeholder="Fabricante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Aquisição</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="produção">Produção</SelectItem>
                          <SelectItem value="armazenamento">
                            Armazenamento
                          </SelectItem>
                          <SelectItem value="laboratório">
                            Laboratório
                          </SelectItem>
                          <SelectItem value="administrativo">
                            Administrativo
                          </SelectItem>
                          <SelectItem value="expedição">Expedição</SelectItem>
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
                          <SelectItem value="máquina">Máquina</SelectItem>
                          <SelectItem value="equipamento">
                            Equipamento
                          </SelectItem>
                          <SelectItem value="veículo">Veículo</SelectItem>
                          <SelectItem value="ferramenta">Ferramenta</SelectItem>
                          <SelectItem value="instrumento">
                            Instrumento
                          </SelectItem>
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
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticidade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a criticidade" />
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
                          <SelectItem value="operational">
                            Operacional
                          </SelectItem>
                          <SelectItem value="maintenance">
                            Em manutenção
                          </SelectItem>
                          <SelectItem value="broken">Inoperante</SelectItem>
                        </SelectContent>
                      </Select>
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
                  disabled={createEquipmentMutation.isPending}
                >
                  {createEquipmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Equipamento"
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

export default MaintenanceEquipment;
