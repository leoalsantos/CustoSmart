import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Factory, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const ProductionDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");
  const { user, hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de produção
  const hasProductionAccess = hasPermission("production");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasProductionAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000, // Refresh every minute
    enabled: true,
  });

  // Example chart data
  const [productionChartData, setProductionChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate sample chart data based on real data structure
    if (dashboardData) {
      // This would normally come from the API
      const chartData = [
        { date: "01/05", produção: 42, meta: 40 },
        { date: "02/05", produção: 38, meta: 40 },
        { date: "03/05", produção: 45, meta: 40 },
        { date: "04/05", produção: 40, meta: 40 },
        { date: "05/05", produção: 43, meta: 40 },
        { date: "06/05", produção: 48, meta: 40 },
        { date: "07/05", produção: 50, meta: 40 },
      ];
      setProductionChartData(chartData);
    }
  }, [dashboardData]);

  // Columns for production orders
  const productionColumns = [
    {
      accessorKey: "orderNumber",
      header: "Número",
    },
    {
      accessorKey: "productId",
      header: "Produto",
      cell: ({ row }: { row: any }) => <span>{row.original.productId}</span>,
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
      cell: ({ row }: { row: any }) => <span>{row.original.quantity} un</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
          concluido: { label: "Concluído", color: "bg-green-100 text-green-800" },
          atrasado: { label: "Atrasado", color: "bg-red-100 text-red-800" },
          planned: { label: "Planejado", color: "bg-purple-100 text-purple-800" },
          in_progress: { label: "Em Progresso", color: "bg-yellow-100 text-yellow-800" },
          completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
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

  // Action column for all tables
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to="/production/orders"
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
        title="Dashboard de Produção"
        subtitle="Monitoramento em tempo real da produção"
        icon={<Factory className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Total"
          value={dashboardData?.production?.count || 0}
          description="unidades produzidas"
          trend={{
            type: "up",
            value: "12% vs último mês",
          }}
          icon={<Factory className="h-5 w-5" />}
        />

        <KPICard
          title="Em Progresso"
          value={dashboardData?.production?.inProgress || 0}
          description="ordens em andamento"
          trend={{
            type: "up",
            value: "3 ordens novas",
          }}
          icon={<Factory className="h-5 w-5" />}
        />

        <KPICard
          title="Concluídas"
          value={dashboardData?.production?.completed || 0}
          description="ordens finalizadas"
          trend={{
            type: "up",
            value: "8% vs último mês",
          }}
          icon={<Factory className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <ChartCard
          title="Produção x Metas"
          data={productionChartData}
          type="line"
          xKey="date"
          yKeys={[
            { key: "produção", color: "#3B82F6", name: "Produção" },
            { key: "meta", color: "#10B981", name: "Meta" },
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

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Produção Recentes</CardTitle>
            <CardDescription>
              Últimas ordens de produção registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={productionColumns}
              data={dashboardData?.recentOrders || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
              export={{
                enabled: true,
                filename: "ordens-de-producao",
                title: "Ordens de Produção",
                subtitle: "Últimos registros do sistema",
              }}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/production/orders"
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

export default ProductionDashboard;