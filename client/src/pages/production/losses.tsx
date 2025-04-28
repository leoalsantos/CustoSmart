import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { Link, useLocation, useRoute } from "wouter";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth } from "date-fns";

type LossReason = "defect" | "setup" | "operator" | "maintenance" | "other";

interface ProductionLoss {
  id: number;
  productId: number;
  productName: string;
  orderId: number;
  orderNumber: string;
  amount: number;
  unit: string;
  reason: LossReason;
  description: string;
  date: string;
  createdBy: string;
}

export default function ProductionLosses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Buscar dados de perdas na produção
  const { data: losses, isLoading } = useQuery({
    queryKey: [
      "/api/production/losses",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      filterReason,
    ],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          productId: 12,
          productName: "Produto A",
          orderId: 345,
          orderNumber: "ORD-2025-0345",
          amount: 25.5,
          unit: "kg",
          reason: "defect" as LossReason,
          description: "Falha na homogeneização",
          date: "2025-04-10T09:23:00",
          createdBy: "João Silva",
        },
        {
          id: 2,
          productId: 8,
          productName: "Produto B",
          orderId: 347,
          orderNumber: "ORD-2025-0347",
          amount: 12.2,
          unit: "L",
          reason: "operator" as LossReason,
          description: "Erro na mistura de componentes",
          date: "2025-04-11T14:05:00",
          createdBy: "Maria Oliveira",
        },
        {
          id: 3,
          productId: 15,
          productName: "Produto C",
          orderId: 350,
          orderNumber: "ORD-2025-0350",
          amount: 8.7,
          unit: "kg",
          reason: "maintenance" as LossReason,
          description: "Ajustes em equipamento",
          date: "2025-04-12T10:45:00",
          createdBy: "Pedro Santos",
        },
        {
          id: 4,
          productId: 9,
          productName: "Produto D",
          orderId: 352,
          orderNumber: "ORD-2025-0352",
          amount: 15.0,
          unit: "L",
          reason: "setup" as LossReason,
          description: "Configuração inicial de equipamento",
          date: "2025-04-13T08:30:00",
          createdBy: "Ana Costa",
        },
        {
          id: 5,
          productId: 11,
          productName: "Produto E",
          orderId: 353,
          orderNumber: "ORD-2025-0353",
          amount: 5.4,
          unit: "kg",
          reason: "other" as LossReason,
          description: "Falha no fornecimento de energia",
          date: "2025-04-14T11:15:00",
          createdBy: "Carlos Mendes",
        },
      ] as ProductionLoss[];
    },
  });

  // Filtrar perdas com base no termo de pesquisa e no filtro de motivo
  const filteredLosses = losses?.filter((loss) => {
    const matchesSearch =
      loss.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loss.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loss.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesReason =
      filterReason === "all" || loss.reason === filterReason;

    return matchesSearch && matchesReason;
  });

  // Tradução dos motivos de perda
  const getReasonLabel = (reason: LossReason) => {
    switch (reason) {
      case "defect":
        return "Defeito";
      case "setup":
        return "Setup";
      case "operator":
        return "Operador";
      case "maintenance":
        return "Manutenção";
      case "other":
        return "Outros";
      default:
        return reason;
    }
  };

  // Obter variante de badge para motivo
  const getReasonBadgeVariant = (reason: LossReason) => {
    switch (reason) {
      case "defect":
        return "destructive";
      case "setup":
        return "default";
      case "operator":
        return "secondary";
      case "maintenance":
        return "outline";
      case "other":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Controle de Perdas na Produção</h1>
          <Button asChild>
            <Link href="/production/losses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Perda
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtragem e Busca</CardTitle>
            <CardDescription>
              Filtre e busque registros de perdas na produção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, ordem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterReason} onValueChange={setFilterReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os motivos</SelectItem>
                    <SelectItem value="defect">Defeito</SelectItem>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onFromChange={(date) =>
                    setDateRange((prev) => ({
                      ...prev,
                      from: date || prev.from,
                    }))
                  }
                  onToChange={(date) =>
                    setDateRange((prev) => ({ ...prev, to: date || prev.to }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Perdas na Produção</CardTitle>
              <CardDescription>
                Lista de todas as perdas registradas no período selecionado
              </CardDescription>
            </div>
            <ExportButton
              data={filteredLosses || []}
              filename="perdas-producao"
              label="Exportar"
              pdfTitle="Perdas na Produção"
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
                    <TableHead>Produto</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLosses && filteredLosses.length > 0 ? (
                    filteredLosses.map((loss) => (
                      <TableRow key={loss.id}>
                        <TableCell>
                          {new Date(loss.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {loss.productName}
                        </TableCell>
                        <TableCell>{loss.orderNumber}</TableCell>
                        <TableCell className="text-right">
                          {loss.amount.toFixed(2)} {loss.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getReasonBadgeVariant(loss.reason)}>
                            {getReasonLabel(loss.reason)}
                          </Badge>
                        </TableCell>
                        <TableCell>{loss.description}</TableCell>
                        <TableCell>{loss.createdBy}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Nenhum registro de perda encontrado para os filtros
                        selecionados.
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
