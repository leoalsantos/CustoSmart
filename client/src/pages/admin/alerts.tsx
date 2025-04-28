import React from "react";
import { useSystemAlerts, SystemAlert } from "@/hooks/use-system-alerts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  X,
  Filter,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/page-title";
import { useEffect, useState } from "react";

export default function AlertsPage() {
  const {
    alerts,
    isLoading,
    acknowledgeAlert,
    resolveAlert,
    deleteAlert,
  } = useSystemAlerts();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [filteredAlerts, setFilteredAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    if (!alerts) return;

    let filtered = [...alerts];

    // Filtrar por texto de pesquisa
    if (searchQuery) {
      filtered = filtered.filter(
        (alert) =>
          alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.module.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((alert) => alert.status === statusFilter);
    }

    // Filtrar por prioridade
    if (priorityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.priority === priorityFilter);
    }

    // Filtrar por módulo
    if (moduleFilter !== "all") {
      filtered = filtered.filter((alert) => alert.module === moduleFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchQuery, statusFilter, priorityFilter, moduleFilter]);

  // Obter lista única de módulos para o filtro
  const modules = alerts
    ? Array.from(new Set(alerts.map((alert) => alert.module)))
    : [];

  const handleAcknowledge = (id: number) => {
    acknowledgeAlert(id);
  };

  const handleResolve = (id: number) => {
    resolveAlert(id);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este alerta?")) {
      deleteAlert(id);
    }
  };

  const exportToCSV = () => {
    if (!filteredAlerts.length) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há alertas para exportar",
        variant: "destructive",
      });
      return;
    }

    // Criar cabeçalhos CSV
    const headers = [
      "ID",
      "Mensagem",
      "Prioridade",
      "Status",
      "Módulo",
      "Tipo de Referência",
      "ID de Referência",
      "Data de Criação",
      "Criado Por",
      "Data de Confirmação",
      "Confirmado Por",
      "Data de Resolução",
      "Resolvido Por",
    ].join(",");

    // Criar linhas de dados
    const rows = filteredAlerts.map((alert) => [
      alert.id,
      `"${alert.message.replace(/"/g, '""')}"`, // Escapar aspas
      alert.priority,
      alert.status,
      alert.module,
      alert.referenceType || "",
      alert.referenceId || "",
      alert.createdAt,
      alert.createdBy,
      alert.acknowledgedAt || "",
      alert.acknowledgedBy || "",
      alert.resolvedAt || "",
      alert.resolvedBy || "",
    ].join(","));

    // Combinar cabeçalhos e linhas
    const csvContent = [headers, ...rows].join("\n");

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `alertas_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Alta
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Média
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Baixa
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            {priority}
          </Badge>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Ativo
          </Badge>
        );
      case "acknowledged":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Confirmado
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Resolvido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle 
        title="Gerenciamento de Alertas" 
        subtitle="Visualize e gerencie todos os alertas do sistema" 
        icon={<AlertTriangle className="h-6 w-6" />} 
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a lista de alertas com os filtros abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar alertas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="acknowledged">Confirmados</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={moduleFilter}
                onValueChange={setModuleFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setModuleFilter("all");
                }}
                className="flex gap-2"
              >
                <X className="h-4 w-4" />
                <span>Limpar</span>
              </Button>

              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas</CardTitle>
          <CardDescription>
            Total de {filteredAlerts.length} alertas encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum alerta encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead className="w-[300px]">Mensagem</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.id}</TableCell>
                      <TableCell className="font-medium">{alert.message}</TableCell>
                      <TableCell>{renderPriorityBadge(alert.priority)}</TableCell>
                      <TableCell>{renderStatusBadge(alert.status)}</TableCell>
                      <TableCell>{alert.module}</TableCell>
                      <TableCell>{formatDate(alert.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {alert.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                              title="Confirmar alerta"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {(alert.status === "active" || alert.status === "acknowledged") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                              title="Resolver alerta"
                              className="bg-green-50 hover:bg-green-100 border-green-200"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            title="Excluir alerta"
                            className="bg-red-50 hover:bg-red-100 border-red-200"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}