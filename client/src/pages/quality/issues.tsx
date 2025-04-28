import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/dashboard/data-table";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertCircle, Check, Clock, FileText, Loader2, Plus, Search
} from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Tipos para não conformidades
type NonConformityStatus = "open" | "investigating" | "resolved";
type NonConformitySeverity = "critical" | "major" | "minor";

interface NonConformity {
  id: number;
  code: string;
  title: string;
  description: string;
  status: NonConformityStatus;
  severity: NonConformitySeverity;
  origin: string;
  detectedDate: string;
  resolvedDate: string | null;
  responsibleId: number | null;
  responsibleName: string | null;
  productId: number | null;
  productName: string | null;
  rawMaterialId: number | null;
  rawMaterialName: string | null;
  processId: number | null;
  processName: string | null;
  correctionPlan: string | null;
  rootCause: string | null;
  preventiveActions: string | null;
}

// Esquema de validação para o formulário
const nonConformitySchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(5, "A descrição deve ter pelo menos 5 caracteres"),
  severity: z.enum(["critical", "major", "minor"]),
  origin: z.string().min(1, "A origem é obrigatória"),
  detectedDate: z.string().min(1, "A data de detecção é obrigatória"),
  productId: z.string().optional(),
  rawMaterialId: z.string().optional(),
  processId: z.string().optional(),
  rootCause: z.string().optional(),
  correctionPlan: z.string().optional(),
  preventiveActions: z.string().optional(),
});

type NonConformityFormValues = z.infer<typeof nonConformitySchema>;

export default function QualityIssues() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<NonConformity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data para não conformidades
  const mockNonConformities: NonConformity[] = [
    {
      id: 1,
      code: "NC-2025-001",
      title: "Variação de cor no lote de tintas",
      description: "Identificada variação significativa de tonalidade nas tintas do lote L2025-045",
      status: "resolved",
      severity: "major",
      origin: "Produção",
      detectedDate: "2025-03-15T10:30:00",
      resolvedDate: "2025-03-20T14:20:00",
      responsibleId: 1,
      responsibleName: "João Silva",
      productId: 5,
      productName: "Tinta Acrílica Standard",
      rawMaterialId: null,
      rawMaterialName: null,
      processId: 2,
      processName: "Processo de Mistura",
      correctionPlan: "Revisar processo de mistura e calibrar equipamentos",
      rootCause: "Desregulagem do equipamento de mistura",
      preventiveActions: "Implementar checklist diário de calibração"
    },
    {
      id: 2,
      code: "NC-2025-002",
      title: "Contaminação em matéria-prima",
      description: "Detectada contaminação por partículas no lote de Resina A420",
      status: "investigating",
      severity: "critical",
      origin: "Fornecedor",
      detectedDate: "2025-04-02T09:15:00",
      resolvedDate: null,
      responsibleId: 3,
      responsibleName: "Maria Oliveira",
      productId: null,
      productName: null,
      rawMaterialId: 12,
      rawMaterialName: "Resina A420",
      processId: null,
      processName: null,
      correctionPlan: "Isolar o lote e solicitar substituição ao fornecedor",
      rootCause: "Em investigação",
      preventiveActions: null
    },
    {
      id: 3,
      code: "NC-2025-003",
      title: "Erro de rótulagem",
      description: "Produtos com informações incorretas no rótulo",
      status: "open",
      severity: "minor",
      origin: "Embalagem",
      detectedDate: "2025-04-10T15:45:00",
      resolvedDate: null,
      responsibleId: null,
      responsibleName: null,
      productId: 8,
      productName: "Verniz Ultra Brilho",
      rawMaterialId: null,
      rawMaterialName: null,
      processId: 5,
      processName: "Processo de Embalagem",
      correctionPlan: null,
      rootCause: null,
      preventiveActions: null
    }
  ];

  // Consulta para carregar não conformidades
  const { 
    data: nonConformities = mockNonConformities,
    isLoading 
  } = useQuery({
    queryKey: ['/api/quality/issues'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/quality/issues');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar não conformidades:", error);
        // Retorna dados mock em caso de erro
        return mockNonConformities;
      }
    }
  });

  // Consultas auxiliares para produtos, matérias-primas e processos
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/products');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
      }
    }
  });

  const { data: rawMaterials = [] } = useQuery({
    queryKey: ['/api/raw-materials'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/raw-materials');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar matérias-primas:", error);
        return [];
      }
    }
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['/api/processes'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/processes');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar processos:", error);
        return [];
      }
    }
  });

  // Mutação para criar uma nova não conformidade
  const createIssueMutation = useMutation({
    mutationFn: async (data: NonConformityFormValues) => {
      const response = await apiRequest('POST', '/api/quality/issues', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Não conformidade registrada",
        description: "A não conformidade foi registrada com sucesso.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/quality/issues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar não conformidade",
        description: error.message || "Ocorreu um erro ao registrar a não conformidade",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar o status de uma não conformidade
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: NonConformityStatus }) => {
      const response = await apiRequest('PATCH', `/api/quality/issues/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da não conformidade foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quality/issues'] });
      if (isViewDialogOpen && selectedIssue) {
        // Atualizar a não conformidade selecionada
        const updatedIssue = nonConformities.find(nc => nc.id === selectedIssue.id);
        if (updatedIssue) {
          setSelectedIssue(updatedIssue);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status",
        variant: "destructive",
      });
    }
  });

  // Formulário para criar uma nova não conformidade
  const form = useForm<NonConformityFormValues>({
    resolver: zodResolver(nonConformitySchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "minor",
      origin: "",
      detectedDate: new Date().toISOString().split('T')[0],
      productId: undefined,
      rawMaterialId: undefined,
      processId: undefined,
      rootCause: "",
      correctionPlan: "",
      preventiveActions: "",
    }
  });

  // Filtrar não conformidades com base no termo de busca e na aba atual
  const filteredIssues = nonConformities
    .filter(issue => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        issue.code.toLowerCase().includes(searchLower) ||
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description.toLowerCase().includes(searchLower) ||
        (issue.productName && issue.productName.toLowerCase().includes(searchLower)) ||
        (issue.rawMaterialName && issue.rawMaterialName.toLowerCase().includes(searchLower));
      
      if (currentTab === "all") {
        return matchesSearch;
      } else {
        return matchesSearch && issue.status === currentTab;
      }
    })
    .sort((a, b) => new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime());

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para obter a variante do badge com base na severidade
  const getSeverityBadgeVariant = (severity: NonConformitySeverity) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "major":
        return "default";
      case "minor":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Função para obter o ícone e cor do status
  const getStatusInfo = (status: NonConformityStatus) => {
    switch (status) {
      case "open":
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          label: "Aberto",
          color: "text-red-500"
        };
      case "investigating":
        return {
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          label: "Em Investigação",
          color: "text-amber-500"
        };
      case "resolved":
        return {
          icon: <Check className="h-4 w-4 text-green-500" />,
          label: "Resolvido",
          color: "text-green-500"
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Desconhecido",
          color: ""
        };
    }
  };

  // Handler para envio do formulário
  const onSubmit = (data: NonConformityFormValues) => {
    createIssueMutation.mutate(data);
  };

  // Handler para atualizar o status
  const handleUpdateStatus = (id: number, newStatus: NonConformityStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Handler para abrir o modal de visualização
  const handleViewIssue = (issue: NonConformity) => {
    setSelectedIssue(issue);
    setIsViewDialogOpen(true);
  };

  // Colunas para a tabela de não conformidades
  const columns = [
    {
      header: "Código",
      accessorKey: "code",
    },
    {
      header: "Título",
      accessorKey: "title",
    },
    {
      header: "Severidade",
      cell: (row: NonConformity) => (
        <Badge variant={getSeverityBadgeVariant(row.severity)}>
          {row.severity === "critical" 
            ? "Crítica" 
            : row.severity === "major" 
              ? "Maior" 
              : "Menor"}
        </Badge>
      )
    },
    {
      header: "Status",
      cell: (row: NonConformity) => {
        const statusInfo = getStatusInfo(row.status);
        return (
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
        );
      }
    },
    {
      header: "Origem",
      accessorKey: "origin",
    },
    {
      header: "Data Detectada",
      cell: (row: NonConformity) => formatDate(row.detectedDate)
    },
  ];

  // Ações para cada linha
  const actionColumn = {
    cell: (row: NonConformity) => (
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleViewIssue(row)}
        >
          <FileText className="h-4 w-4 mr-1" />
          Detalhes
        </Button>
        {row.status === "open" && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleUpdateStatus(row.id, "investigating")}
          >
            <Clock className="h-4 w-4 mr-1" />
            Investigar
          </Button>
        )}
        {row.status === "investigating" && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleUpdateStatus(row.id, "resolved")}
          >
            <Check className="h-4 w-4 mr-1" />
            Resolver
          </Button>
        )}
      </div>
    )
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Não Conformidades</h1>
            <p className="text-gray-500 mt-1">
              Gerencie as não conformidades identificadas
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton 
              data={filteredIssues || []}
              filename="nao-conformidades"
              label="Exportar"
              pdfTitle="Não Conformidades"
              pdfSubtitle="Relatório gerado pelo CustoSmart"
              variant="outline"
              size="sm"
            />
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Não Conformidade
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Buscar não conformidades..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs defaultValue="all" className="w-full md:w-auto" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="open">Abertas</TabsTrigger>
              <TabsTrigger value="investigating">Investigando</TabsTrigger>
              <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Não Conformidades</CardTitle>
            <CardDescription>
              Lista de não conformidades registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredIssues}
              actionColumn={actionColumn}
              isLoading={isLoading}
              pagination={{
                currentPage,
                totalPages: Math.ceil(filteredIssues.length / 10),
                onPageChange: setCurrentPage
              }}

            />
          </CardContent>
        </Card>

        {/* Modal para criar uma nova não conformidade */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Não Conformidade</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para registrar uma nova não conformidade
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da não conformidade" {...field} />
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
                        <Textarea 
                          placeholder="Descreva a não conformidade em detalhes" 
                          className="resize-none min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severidade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="minor">Menor</SelectItem>
                            <SelectItem value="major">Maior</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Produção, Fornecedor, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="detectedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Detecção</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto (se aplicável)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
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
                    name="rawMaterialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matéria-prima (se aplicável)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rawMaterials.map((material: any) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name}
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
                    name="processId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processo (se aplicável)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {processes.map((process: any) => (
                              <SelectItem key={process.id} value={process.id.toString()}>
                                {process.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="rootCause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causa Raiz (se conhecida)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a causa raiz, se conhecida" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="correctionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Correção</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva as ações corretivas planejadas" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preventiveActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ações Preventivas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva as ações preventivas para evitar recorrência" 
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
                  <Button type="submit" disabled={createIssueMutation.isPending}>
                    {createIssueMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal para visualizar detalhes da não conformidade */}
        {selectedIssue && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>Não Conformidade: {selectedIssue.code}</span>
                  {getStatusInfo(selectedIssue.status).icon}
                </DialogTitle>
                <DialogDescription>
                  {selectedIssue.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Status</h4>
                    <div className={`flex items-center gap-2 ${getStatusInfo(selectedIssue.status).color}`}>
                      {getStatusInfo(selectedIssue.status).icon}
                      <span>{getStatusInfo(selectedIssue.status).label}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Severidade</h4>
                    <Badge variant={getSeverityBadgeVariant(selectedIssue.severity)}>
                      {selectedIssue.severity === "critical" 
                        ? "Crítica" 
                        : selectedIssue.severity === "major" 
                          ? "Maior" 
                          : "Menor"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Descrição</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    {selectedIssue.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Origem</h4>
                    <p className="text-sm">{selectedIssue.origin}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Data Detectada</h4>
                    <p className="text-sm">{formatDate(selectedIssue.detectedDate)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Responsável</h4>
                    <p className="text-sm">{selectedIssue.responsibleName || "Não atribuído"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Data Resolvida</h4>
                    <p className="text-sm">{selectedIssue.resolvedDate ? formatDate(selectedIssue.resolvedDate) : "Não resolvido"}</p>
                  </div>
                </div>
                
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="cause">Causa Raiz</TabsTrigger>
                    <TabsTrigger value="actions">Ações</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 pt-4">
                    {selectedIssue.productName && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Produto</h4>
                        <p className="text-sm">{selectedIssue.productName}</p>
                      </div>
                    )}
                    
                    {selectedIssue.rawMaterialName && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Matéria-Prima</h4>
                        <p className="text-sm">{selectedIssue.rawMaterialName}</p>
                      </div>
                    )}
                    
                    {selectedIssue.processName && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Processo</h4>
                        <p className="text-sm">{selectedIssue.processName}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="cause" className="pt-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Causa Raiz</h4>
                      <p className="text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {selectedIssue.rootCause || "Não identificada"}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="space-y-4 pt-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Plano de Correção</h4>
                      <p className="text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {selectedIssue.correctionPlan || "Não definido"}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Ações Preventivas</h4>
                      <p className="text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {selectedIssue.preventiveActions || "Não definidas"}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="flex justify-between">
                <div>
                  {selectedIssue.status === "open" && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleUpdateStatus(selectedIssue.id, "investigating");
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Iniciar Investigação
                    </Button>
                  )}
                  {selectedIssue.status === "investigating" && (
                    <Button 
                      variant="default" 
                      onClick={() => {
                        handleUpdateStatus(selectedIssue.id, "resolved");
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como Resolvido
                    </Button>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}