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
import { PlusCircle, Search, Filter, ArrowUpDown, ClipboardList, FileDown } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { Link } from "wouter";

type InspectionType = "incoming" | "process" | "final" | "audit";
type InspectionResult = "approved" | "rejected" | "pending";

interface QualityInspection {
  id: number;
  type: InspectionType;
  productId?: number;
  productName?: string;
  materialId?: number;
  materialName?: string;
  orderId?: number;
  orderNumber?: string;
  batchNumber: string;
  date: string;
  inspectedBy: string;
  result: InspectionResult;
  notes?: string;
}

export default function QualityInspections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Buscar inspeções de qualidade
  const { data: inspections, isLoading } = useQuery({
    queryKey: [
      "/api/quality/inspections", 
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      filterType,
      filterResult
    ],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          type: "incoming" as InspectionType,
          materialId: 12,
          materialName: "Matéria-Prima A",
          batchNumber: "MP-2025-0412-001",
          date: "2025-04-12T09:30:00",
          inspectedBy: "Ana Silva",
          result: "approved" as InspectionResult,
          notes: "Material dentro das especificações"
        },
        {
          id: 2,
          type: "process" as InspectionType,
          productId: 5,
          productName: "Produto X em processo",
          orderId: 230,
          orderNumber: "ORD-2025-0230",
          batchNumber: "PP-2025-0230-001",
          date: "2025-04-13T11:45:00",
          inspectedBy: "Carlos Lima",
          result: "pending" as InspectionResult,
          notes: "Aguardando segundo teste de viscosidade"
        },
        {
          id: 3,
          type: "final" as InspectionType,
          productId: 8,
          productName: "Produto Y",
          orderId: 228,
          orderNumber: "ORD-2025-0228",
          batchNumber: "PF-2025-0228-001",
          date: "2025-04-14T14:20:00",
          inspectedBy: "Marcos Santos",
          result: "rejected" as InspectionResult,
          notes: "Problemas na coloração. Encaminhado para reprocessamento."
        },
        {
          id: 4,
          type: "audit" as InspectionType,
          productId: 10,
          productName: "Produto Z",
          batchNumber: "PA-2025-0410-001",
          date: "2025-04-14T16:30:00",
          inspectedBy: "Juliana Pereira",
          result: "approved" as InspectionResult,
          notes: "Auditoria de qualidade dentro dos padrões"
        },
        {
          id: 5,
          type: "incoming" as InspectionType,
          materialId: 15,
          materialName: "Matéria-Prima B",
          batchNumber: "MP-2025-0415-002",
          date: "2025-04-15T08:15:00",
          inspectedBy: "Rafael Costa",
          result: "rejected" as InspectionResult,
          notes: "Material fora das especificações de cor e odor"
        },
      ] as QualityInspection[];
    },
  });

  // Filtrar inspeções
  const filteredInspections = inspections?.filter((inspection) => {
    const matchesSearch = 
      (inspection.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.materialName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.orderNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || inspection.type === filterType;
    
    const matchesResult = filterResult === "all" || inspection.result === filterResult;
    
    return matchesSearch && matchesType && matchesResult;
  });

  // Funções de ajuda para tradução e renderização
  const getTypeBadge = (type: InspectionType) => {
    switch (type) {
      case "incoming":
        return { label: "Recebimento", variant: "secondary" };
      case "process":
        return { label: "Processo", variant: "default" };
      case "final":
        return { label: "Final", variant: "outline" };
      case "audit":
        return { label: "Auditoria", variant: "secondary" };
      default:
        return { label: type, variant: "default" };
    }
  };

  const getResultBadge = (result: InspectionResult) => {
    switch (result) {
      case "approved":
        return { label: "Aprovado", variant: "default" };
      case "rejected":
        return { label: "Reprovado", variant: "destructive" };
      case "pending":
        return { label: "Pendente", variant: "outline" };
      default:
        return { label: result, variant: "default" };
    }
  };

  const getInspectionItem = (inspection: QualityInspection) => {
    if (inspection.type === "incoming" && inspection.materialName) {
      return inspection.materialName;
    } else if ((inspection.type === "process" || inspection.type === "final" || inspection.type === "audit") && inspection.productName) {
      return inspection.productName;
    } else {
      return "N/A";
    }
  };

  const getInspectionOrder = (inspection: QualityInspection) => {
    if (inspection.orderNumber) {
      return inspection.orderNumber;
    } else {
      return "N/A";
    }
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Inspeções de Qualidade</h1>
          <Button asChild>
            <Link href="/quality/inspections/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Inspeção
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtrar e buscar inspeções de qualidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={filterType} 
                  onValueChange={setFilterType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="incoming">Recebimento</SelectItem>
                    <SelectItem value="process">Processo</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="audit">Auditoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={filterResult} 
                  onValueChange={setFilterResult}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Resultados</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Reprovado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inspeções Realizadas</CardTitle>
              <CardDescription>
                Lista de todas as inspeções de qualidade realizadas no período
              </CardDescription>
            </div>
            <ExportButton 
              data={filteredInspections || []}
              filename="inspecoes-qualidade"
              label="Exportar"
              pdfTitle="Inspeções de Qualidade"
              pdfSubtitle="Relatório gerado pelo CustoSmart"
              variant="outline"
              size="sm"
            />
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
                    <TableHead>Item</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Inspetor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspections && filteredInspections.length > 0 ? (
                    filteredInspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          {new Date(inspection.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadge(inspection.type).variant as any}>
                            {getTypeBadge(inspection.type).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getInspectionItem(inspection)}
                        </TableCell>
                        <TableCell>
                          {getInspectionOrder(inspection)}
                        </TableCell>
                        <TableCell>
                          {inspection.batchNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getResultBadge(inspection.result).variant as any}>
                            {getResultBadge(inspection.result).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inspection.inspectedBy}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/quality/inspections/${inspection.id}`}>
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Detalhes
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Nenhuma inspeção encontrada para os filtros selecionados.
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