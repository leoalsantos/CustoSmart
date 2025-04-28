import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { PlusCircle, Search, Filter, ExternalLink, FileText } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { Link } from "wouter";

type NonConformityType = "product" | "process" | "material" | "system";
type NonConformitySeverity = "critical" | "major" | "minor";
type NonConformityStatus = "open" | "in-progress" | "resolved" | "closed";

interface NonConformity {
  id: number;
  type: NonConformityType;
  title: string;
  description: string;
  severity: NonConformitySeverity;
  status: NonConformityStatus;
  date: string;
  reportedBy: string;
  assignedTo?: string;
  relatedInspectionId?: number;
  resolutionDetails?: string;
  resolutionDate?: string;
}

export default function QualityNonConformities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Buscar não conformidades
  const { data: nonConformities, isLoading } = useQuery({
    queryKey: [
      "/api/quality/non-conformities", 
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      filterType,
      filterStatus,
      filterSeverity
    ],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          type: "product" as NonConformityType,
          title: "Coloração inconsistente no lote PF-2025-0228-001",
          description: "Produto apresenta variação de cor entre amostras do mesmo lote",
          severity: "major" as NonConformitySeverity,
          status: "in-progress" as NonConformityStatus,
          date: "2025-04-14T14:30:00",
          reportedBy: "Marcos Santos",
          assignedTo: "Carlos Lima",
          relatedInspectionId: 3
        },
        {
          id: 2,
          type: "material" as NonConformityType,
          title: "Matéria-prima fora das especificações",
          description: "Matéria-prima MP-B apresenta odor intenso e coloração irregular",
          severity: "critical" as NonConformitySeverity,
          status: "open" as NonConformityStatus,
          date: "2025-04-15T09:00:00",
          reportedBy: "Rafael Costa",
          relatedInspectionId: 5
        },
        {
          id: 3,
          type: "process" as NonConformityType,
          title: "Temperatura acima do especificado na etapa de mistura",
          description: "Registros indicam temperatura 15°C acima do limite máximo",
          severity: "major" as NonConformitySeverity,
          status: "resolved" as NonConformityStatus,
          date: "2025-04-10T11:20:00",
          reportedBy: "Ana Silva",
          assignedTo: "Pedro Oliveira",
          resolutionDetails: "Sensor de temperatura calibrado e ajustado limite de segurança",
          resolutionDate: "2025-04-13T16:45:00"
        },
        {
          id: 4,
          type: "system" as NonConformityType,
          title: "Falha na documentação de procedimentos",
          description: "Documentação de calibração não foi atualizada conforme programado",
          severity: "minor" as NonConformitySeverity,
          status: "closed" as NonConformityStatus,
          date: "2025-04-08T10:15:00",
          reportedBy: "Juliana Pereira",
          assignedTo: "Roberto Mendes",
          resolutionDetails: "Documento revisado e sistema de notificação implementado",
          resolutionDate: "2025-04-11T14:30:00"
        },
        {
          id: 5,
          type: "product" as NonConformityType,
          title: "Viscosidade fora do padrão",
          description: "Produto X com viscosidade abaixo da especificação mínima",
          severity: "major" as NonConformitySeverity,
          status: "in-progress" as NonConformityStatus,
          date: "2025-04-13T13:00:00",
          reportedBy: "Carlos Lima",
          assignedTo: "Ana Silva",
          relatedInspectionId: 2
        },
      ] as NonConformity[];
    },
  });

  // Filtrar não conformidades
  const filteredNonConformities = nonConformities?.filter((nc) => {
    const matchesSearch = 
      nc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nc.assignedTo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      nc.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || nc.type === filterType;
    const matchesStatus = filterStatus === "all" || nc.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || nc.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });

  // Funções de ajuda para tradução e renderização
  const getTypeLabel = (type: NonConformityType) => {
    switch (type) {
      case "product": return "Produto";
      case "process": return "Processo";
      case "material": return "Material";
      case "system": return "Sistema";
      default: return type;
    }
  };

  const getSeverityBadge = (severity: NonConformitySeverity) => {
    switch (severity) {
      case "critical":
        return { label: "Crítica", variant: "destructive" };
      case "major":
        return { label: "Maior", variant: "default" };
      case "minor":
        return { label: "Menor", variant: "secondary" };
      default:
        return { label: severity, variant: "default" };
    }
  };

  const getStatusBadge = (status: NonConformityStatus) => {
    switch (status) {
      case "open":
        return { label: "Aberta", variant: "destructive" };
      case "in-progress":
        return { label: "Em Andamento", variant: "default" };
      case "resolved":
        return { label: "Resolvida", variant: "secondary" };
      case "closed":
        return { label: "Fechada", variant: "outline" };
      default:
        return { label: status, variant: "default" };
    }
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Não Conformidades</h1>
          <div className="flex gap-2">
            <ExportButton 
              data={filteredNonConformities || []}
              filename="nao-conformidades"
              label="Exportar"
              pdfTitle="Não Conformidades"
              pdfSubtitle="Relatório gerado pelo CustoSmart"
              variant="outline"
              size="sm"
            />
            <Button asChild>
              <Link href="/quality/non-conformities/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Não Conformidade
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtrar e buscar não conformidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={filterType} 
                    onValueChange={setFilterType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="process">Processo</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={filterStatus} 
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="open">Aberta</SelectItem>
                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                      <SelectItem value="resolved">Resolvida</SelectItem>
                      <SelectItem value="closed">Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={filterSeverity} 
                    onValueChange={setFilterSeverity}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Severidades</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="major">Maior</SelectItem>
                      <SelectItem value="minor">Menor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onFromChange={(date) => setDateRange(prev => ({ ...prev, from: date || prev.from }))}
                onToChange={(date) => setDateRange(prev => ({ ...prev, to: date || prev.to }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Não Conformidades Registradas</CardTitle>
            <CardDescription>
              Lista de todas as não conformidades registradas no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNonConformities && filteredNonConformities.length > 0 ? (
                    filteredNonConformities.map((nc) => (
                      <TableRow key={nc.id}>
                        <TableCell>
                          {new Date(nc.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {getTypeLabel(nc.type)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {nc.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadge(nc.severity).variant as any}>
                            {getSeverityBadge(nc.severity).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(nc.status).variant as any}>
                            {getStatusBadge(nc.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {nc.reportedBy}
                        </TableCell>
                        <TableCell>
                          {nc.assignedTo || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {nc.relatedInspectionId && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/quality/inspections/${nc.relatedInspectionId}`}>
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">Ver Inspeção</span>
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/quality/non-conformities/${nc.id}`}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Detalhes</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Nenhuma não conformidade encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}