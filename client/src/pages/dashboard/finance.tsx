import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Coins, BanknoteIcon, TrendingUp, ChevronRight, CreditCard, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const FinanceDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão financeira
  const hasFinanceAccess = hasPermission("finance");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasFinanceAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  const { data: financeReport } = useQuery({
    queryKey: ["/api/finance/reports"],
    enabled: true,
  });

  // Chart data for finance
  const [financeChartData, setFinanceChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate chart data from finance report if available
    if (financeReport) {
      setFinanceChartData(financeReport.monthlyData || []);
    } else if (dashboardData) {
      // Fallback sample data
      const chartData = [
        { mes: "Jan", receitas: 95000, despesas: 65000 },
        { mes: "Fev", receitas: 87500, despesas: 63000 },
        { mes: "Mar", receitas: 92000, despesas: 68500 },
        { mes: "Abr", receitas: 98500, despesas: 66000 },
        { mes: "Mai", receitas: 102000, despesas: 71000 },
        { mes: "Jun", receitas: 105000, despesas: 73500 },
        { mes: "Jul", receitas: 99000, despesas: 72000 },
      ];
      setFinanceChartData(chartData);
    }
  }, [financeReport, dashboardData]);

  // Columns for accounts payable
  const payablesColumns = [
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.dueDate).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "category",
      header: "Categoria",
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }: { row: any }) => (
        <span>{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
          paid: { label: "Pago", color: "bg-green-100 text-green-800" },
          late: { label: "Atrasado", color: "bg-red-100 text-red-800" },
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

  // Columns for accounts receivable
  const receivablesColumns = [
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.dueDate).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "entityName",
      header: "Cliente",
    },
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }: { row: any }) => (
        <span>{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
          received: { label: "Recebido", color: "bg-green-100 text-green-800" },
          late: { label: "Atrasado", color: "bg-red-100 text-red-800" },
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
        to={`/finance/accounts/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    ),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <PageTitle
        title="Dashboard Financeiro"
        subtitle="Visão geral das finanças da empresa"
        icon={<Coins className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="A Receber"
          value={formatCurrency(dashboardData?.financial?.receivableTotal || 0)}
          description="receita no mês"
          trend={{
            type: "up",
            value: "5,2% vs último mês",
          }}
          icon={<Coins className="h-5 w-5" />}
        />

        <KPICard
          title="A Pagar"
          value={formatCurrency(dashboardData?.financial?.payableTotal || 0)}
          description="despesas no mês"
          trend={{
            type: "warning", 
            value: "3 vencendo hoje",
          }}
          icon={<BanknoteIcon className="h-5 w-5" />}
        />

        <KPICard
          title="Saldo"
          value={formatCurrency(dashboardData?.financial?.balance || 0)}
          description="fluxo de caixa"
          trend={{
            type: "up",
            value: "Positivo",
          }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <ChartCard
          title="Fluxo de Caixa Mensal"
          data={financeChartData}
          type="bar"
          xKey="mes"
          yKeys={[
            { key: "receitas", color: "#10B981", name: "Receitas" },
            { key: "despesas", color: "#EF4444", name: "Despesas" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowDownCircle className="mr-2 h-5 w-5 text-red-500" />
              Contas a Pagar
            </CardTitle>
            <CardDescription>
              Próximos vencimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={payablesColumns}
              data={dashboardData?.financial?.recentPayables || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
              export={{
                enabled: true,
                filename: "contas-a-pagar",
                title: "Contas a Pagar",
                subtitle: "Próximos vencimentos",
              }}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/finance/payables"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as contas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpCircle className="mr-2 h-5 w-5 text-green-500" />
              Contas a Receber
            </CardTitle>
            <CardDescription>
              Próximos recebimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={receivablesColumns}
              data={dashboardData?.financial?.recentReceivables || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
              export={{
                enabled: true,
                filename: "contas-a-receber",
                title: "Contas a Receber",
                subtitle: "Próximos recebimentos",
              }}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/finance/receivables"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as contas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de despesas do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dashboardData?.financial?.expensesByCategory ? (
                <ChartCard
                  title=""
                  data={dashboardData.financial.expensesByCategory}
                  type="pie"
                  xKey="category"
                  yKeys={[{ key: "amount", color: "#3B82F6", name: "Valor" }]}
                  filters={[]}
                  onFilterChange={() => {}}
                  selectedFilter=""
                  hideLegend={false}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Link
                to="/finance/analytics"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver análise detalhada
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default FinanceDashboard;