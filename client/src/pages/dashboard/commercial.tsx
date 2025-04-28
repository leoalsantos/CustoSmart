import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingCart, LineChart, DollarSign, ChevronRight, Percent, Users } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const CommercialDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão comercial
  const hasCommercialAccess = hasPermission("commercial");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasCommercialAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Chart data for sales
  const [salesChartData, setSalesChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate chart data
    if (dashboardData) {
      const chartData = [
        { mes: "Jan", vendas: 85400, meta: 80000 },
        { mes: "Fev", vendas: 72500, meta: 80000 },
        { mes: "Mar", vendas: 78300, meta: 80000 },
        { mes: "Abr", vendas: 81200, meta: 80000 },
        { mes: "Mai", vendas: 86700, meta: 80000 },
        { mes: "Jun", vendas: 91500, meta: 90000 },
        { mes: "Jul", vendas: 88200, meta: 90000 },
      ];
      setSalesChartData(chartData);
    }
  }, [dashboardData]);

  // Columns for sales
  const salesColumns = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.date).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "customer",
      header: "Cliente",
    },
    {
      accessorKey: "product",
      header: "Produto",
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
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
          completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
          cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
          invoiced: { label: "Faturado", color: "bg-blue-100 text-blue-800" },
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

  // Columns for customers
  const customerColumns = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Telefone",
    },
    {
      accessorKey: "totalPurchases",
      header: "Compras Totais",
      cell: ({ row }: { row: any }) => (
        <span>{formatCurrency(row.original.totalPurchases)}</span>
      ),
    },
    {
      accessorKey: "lastPurchase",
      header: "Última Compra",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.lastPurchase).toLocaleDateString("pt-BR")}</span>
      ),
    },
  ];

  // Action column for all tables
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/commercial/sales/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    ),
  };

  // Action column for customers
  const customerActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/commercial/customers/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 h-4 ml-1" />
      </Link>
    ),
  };

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <PageTitle
        title="Dashboard Comercial"
        subtitle="Gestão de vendas, clientes e desempenho comercial"
        icon={<ShoppingCart className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Vendas"
          value={formatCurrency(dashboardData?.commercial?.salesTotal || 0)}
          description="no período atual"
          trend={{
            type: "up",
            value: "12% vs último mês",
          }}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <KPICard
          title="Pedidos"
          value={dashboardData?.commercial?.ordersCount || 0}
          description="pedidos no período"
          trend={{
            type: "up",
            value: "5 novos pedidos hoje",
          }}
          icon={<ShoppingCart className="h-5 w-5" />}
        />

        <KPICard
          title="Conversão"
          value={(dashboardData?.commercial?.conversionRate || 0) + "%"}
          description="taxa de conversão"
          trend={{
            type: "up",
            value: "3% vs último mês",
          }}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-3">
          <ChartCard
            title="Vendas Mensais x Meta"
            data={salesChartData}
            type="bar"
            xKey="mes"
            yKeys={[
              { key: "vendas", color: "#3B82F6", name: "Vendas" },
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Últimas vendas registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={salesColumns}
              data={dashboardData?.commercial?.recentSales || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
              export={{
                enabled: true,
                filename: "vendas-recentes",
                title: "Vendas Recentes",
                subtitle: "Últimas vendas registradas no sistema",
              }}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/commercial/sales"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as vendas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Clientes</CardTitle>
            <CardDescription>
              Clientes com maior volume de compras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={customerColumns}
              data={dashboardData?.commercial?.topCustomers || []}
              actionColumn={customerActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/commercial/customers"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos os clientes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho de Produtos</CardTitle>
            <CardDescription>
              Produtos mais vendidos no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {dashboardData?.commercial?.topProducts?.map((product: any, index: number) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Código: {product.code}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {formatCurrency(product.totalSales)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.unitsSold} unidades
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Link
                to="/commercial/products"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver análise de produtos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CommercialDashboard;