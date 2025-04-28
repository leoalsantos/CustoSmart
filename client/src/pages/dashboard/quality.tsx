import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckSquare, AlertTriangle, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const QualityDashboard = () => {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de qualidade
  const hasQualityAccess = hasPermission("quality");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasQualityAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Columns for inspections
  const inspectionColumns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "orderNumber",
      header: "Ordem",
    },
    {
      accessorKey: "productId",
      header: "Produto",
      cell: ({ row }: { row: any }) => <span>{row.original.productId}</span>,
    },
    {
      accessorKey: "inspectionDate",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Date(row.original.inspectionDate).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          agendada: { label: "Agendada", color: "bg-blue-100 text-blue-800" },
          pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
          aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
          rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
          em_analise: { label: "Em Análise", color: "bg-purple-100 text-purple-800" },
        };
        
        const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    },
  ];

  // Columns for non-conformities
  const nonConformityColumns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "inspectionId",
      header: "Inspeção #",
      cell: ({ row }: { row: any }) => <span>{row.original.inspectionId}</span>,
    },
    {
      accessorKey: "severity",
      header: "Severidade",
      cell: ({ row }: { row: any }) => {
        const severity = row.original.severity;
        const severityMap: { [key: string]: { label: string; color: string } } = {
          baixa: { label: "Baixa", color: "bg-green-100 text-green-800" },
          media: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
          alta: { label: "Alta", color: "bg-orange-100 text-orange-800" },
          critica: { label: "Crítica", color: "bg-red-100 text-red-800" },
        };
        
        const severityInfo = severityMap[severity.toLowerCase()] || { label: severity, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityInfo.color}`}>
            {severityInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          aberta: { label: "Aberta", color: "bg-red-100 text-red-800" },
          em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
          corrigida: { label: "Corrigida", color: "bg-blue-100 text-blue-800" },
          fechada: { label: "Fechada", color: "bg-green-100 text-green-800" },
        };
        
        const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    },
  ];

  // Action column for inspections
  const inspectionActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/quality/inspections/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for non-conformities
  const nonConformityActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/quality/non-conformities/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  return (
    <>
      <PageTitle
        title="Dashboard de Qualidade"
        subtitle="Gestão de inspeções e não-conformidades"
        icon={<CheckSquare className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Inspeções"
          value={dashboardData?.quality?.totalInspections || 0}
          description="total no mês"
          trend={{
            type: "up",
            value: "12% vs último mês",
          }}
          icon={<CheckSquare className="h-5 w-5" />}
        />

        <KPICard
          title="Aprovações"
          value={dashboardData?.quality?.approvalRate ? (dashboardData.quality.approvalRate + "%") : "0%"}
          description="taxa de aprovação"
          trend={{
            type: "up",
            value: "2% de melhoria",
          }}
          icon={<CheckSquare className="h-5 w-5" />}
        />

        <KPICard
          title="Não-Conformidades"
          value={dashboardData?.quality?.openNonConformities || 0}
          description="abertas"
          trend={{
            type: dashboardData?.quality?.openNonConformities > 5 ? "warning" : "down",
            value: "Requer atenção",
          }}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Inspeções Recentes</CardTitle>
            <CardDescription>
              Últimas inspeções de qualidade realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={inspectionColumns}
              data={dashboardData?.quality?.recentInspections || []}
              actionColumn={inspectionActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/quality/inspections"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as inspeções
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Não-Conformidades</CardTitle>
            <CardDescription>
              Problemas de qualidade que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={nonConformityColumns}
              data={dashboardData?.quality?.recentNonConformities || []}
              actionColumn={nonConformityActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/quality/non-conformities"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as não-conformidades
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default QualityDashboard;