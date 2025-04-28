import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hammer, Tool, Clock, ChevronRight, Calendar, AlertTriangle } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const MaintenanceDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de manutenção
  const hasMaintenanceAccess = hasPermission("maintenance");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasMaintenanceAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Chart data for maintenance
  const [maintenanceChartData, setMaintenanceChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate chart data
    if (dashboardData) {
      const chartData = [
        { date: "01/05", preventivas: 8, corretivas: 3 },
        { date: "02/05", preventivas: 10, corretivas: 2 },
        { date: "03/05", preventivas: 7, corretivas: 5 },
        { date: "04/05", preventivas: 9, corretivas: 4 },
        { date: "05/05", preventivas: 11, corretivas: 3 },
        { date: "06/05", preventivas: 6, corretivas: 2 },
        { date: "07/05", preventivas: 8, corretivas: 1 },
      ];
      setMaintenanceChartData(chartData);
    }
  }, [dashboardData]);

  // Columns for maintenance orders
  const maintenanceColumns = [
    {
      accessorKey: "orderNumber",
      header: "Ordem",
    },
    {
      accessorKey: "equipmentId",
      header: "Equipamento",
      cell: ({ row }: { row: any }) => <span>{row.original.equipmentId}</span>,
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }: { row: any }) => {
        const typeMap: { [key: string]: string } = {
          preventive: "Preventiva",
          corrective: "Corretiva",
          emergency: "Emergencial",
          predictive: "Preditiva",
        };
        return typeMap[row.original.type] || row.original.type;
      }
    },
    {
      accessorKey: "urgency",
      header: "Urgência",
      cell: ({ row }: { row: any }) => {
        const urgency = row.original.urgency;
        const urgencyMap: { [key: string]: { label: string; color: string } } = {
          low: { label: "Baixa", color: "bg-green-100 text-green-800" },
          medium: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
          high: { label: "Alta", color: "bg-red-100 text-red-800" },
        };
        
        const urgencyInfo = urgencyMap[urgency] || { label: urgency, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyInfo.color}`}>
            {urgencyInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: "scheduledDate",
      header: "Data Programada",
      cell: ({ row }: { row: any }) => {
        if (!row.original.scheduledDate) return "N/A";
        return new Date(row.original.scheduledDate).toLocaleDateString("pt-BR");
      }
    },
  ];

  // Action column for all tables
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/maintenance/orders/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    ),
  };

  return (
    <>
      <PageTitle
        title="Dashboard de Manutenção"
        subtitle="Gerenciamento de equipamentos e ordens de manutenção"
        icon={<Hammer className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Manutenções"
          value={dashboardData?.maintenance?.openCount || 0}
          description="ordens em aberto"
          trend={{
            type: "warning",
            value: `${dashboardData?.maintenance?.urgentCount || 0} urgentes`,
          }}
          icon={<Hammer className="h-5 w-5" />}
        />

        <KPICard
          title="Preventivas"
          value={dashboardData?.maintenance?.preventiveCount || 0}
          description="manutenções preventivas"
          trend={{
            type: "up",
            value: "5 agendadas hoje",
          }}
          icon={<Calendar className="h-5 w-5" />}
        />

        <KPICard
          title="MTTR"
          value={dashboardData?.maintenance?.mttr || "4h32m"}
          description="tempo médio de reparo"
          trend={{
            type: "down",
            value: "15% vs último mês",
          }}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Manutenções por Tipo"
            data={maintenanceChartData}
            type="bar"
            xKey="date"
            yKeys={[
              { key: "preventivas", color: "#3B82F6", name: "Preventivas" },
              { key: "corretivas", color: "#EF4444", name: "Corretivas" },
            ]}
            filters={[
              { value: "30", label: "Últimos 30 dias" },
              { value: "90", label: "Últimos 90 dias" },
              { value: "365", label: "Este ano" },
            ]}
            onFilterChange={setChartPeriod}
            selectedFilter={chartPeriod}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Críticos</CardTitle>
              <CardDescription>
                Equipamentos que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.maintenance?.criticalEquipment?.map((equipment: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">{equipment.name}</h4>
                      <p className="text-xs text-muted-foreground">{equipment.issue}</p>
                      <Link
                        to={`/maintenance/equipment/${equipment.id}`}
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum equipamento crítico no momento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Manutenção</CardTitle>
            <CardDescription>
              Últimas ordens de manutenção registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={maintenanceColumns}
              data={dashboardData?.maintenance?.recentOrders || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
              export={{
                enabled: true,
                filename: "ordens-de-manutencao",
                title: "Ordens de Manutenção",
                subtitle: "Últimos registros do sistema",
              }}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/maintenance/orders"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as ordens
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MaintenanceDashboard;