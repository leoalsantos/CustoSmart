import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Boxes, BarChart2, Package, ArrowDownCircle, ChevronRight, ShoppingCart } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const InventoryDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState("30");
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de estoque
  const hasInventoryAccess = hasPermission("inventory");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasInventoryAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Chart data for inventory
  const [inventoryChartData, setInventoryChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate chart data
    if (dashboardData) {
      const chartData = [
        { categoria: "Matérias-primas", valor: 53500 },
        { categoria: "Embalagens", valor: 12800 },
        { categoria: "Produtos acabados", valor: 78900 },
        { categoria: "Manutenção", valor: 15600 },
        { categoria: "Outros", valor: 8750 },
      ];
      setInventoryChartData(chartData);
    }
  }, [dashboardData]);

  // Columns for raw materials
  const rawMaterialsColumns = [
    {
      accessorKey: "code",
      header: "Código",
    },
    {
      accessorKey: "name",
      header: "Material",
    },
    {
      accessorKey: "currentStock",
      header: "Estoque Atual",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.currentStock} {row.original.unit}</span>
      ),
    },
    {
      accessorKey: "minimumStock",
      header: "Estoque Mínimo",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.minimumStock} {row.original.unit}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const current = row.original.currentStock;
        const minimum = row.original.minimumStock;
        let status = "ok";

        if (current < minimum) {
          status = current < minimum / 2 ? "critical" : "low";
        }

        const statusMap: { [key: string]: { label: string; color: string } } = {
          critical: { label: "Crítico", color: "bg-red-100 text-red-800" },
          low: { label: "Baixo", color: "bg-yellow-100 text-yellow-800" },
          ok: { label: "Adequado", color: "bg-green-100 text-green-800" },
        };
        
        const statusInfo = statusMap[status];
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    },
  ];

  // Columns for recent inventory movements
  const movementsColumns = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.date).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }: { row: any }) => {
        const type = row.original.type;
        const typeMap: { [key: string]: { label: string; color: string; icon: JSX.Element } } = {
          entrada: { 
            label: "Entrada", 
            color: "bg-green-100 text-green-800", 
            icon: <ArrowDownCircle className="h-3 w-3 inline mr-1 text-green-600" /> 
          },
          saida: { 
            label: "Saída", 
            color: "bg-red-100 text-red-800", 
            icon: <ShoppingCart className="h-3 w-3 inline mr-1 text-red-600" /> 
          },
          ajuste: { 
            label: "Ajuste", 
            color: "bg-blue-100 text-blue-800", 
            icon: <Package className="h-3 w-3 inline mr-1 text-blue-600" /> 
          },
        };
        
        const typeInfo = typeMap[type] || { 
          label: type, 
          color: "bg-gray-100 text-gray-800", 
          icon: <Package className="h-3 w-3 inline mr-1" /> 
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: "material",
      header: "Material",
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.quantity} {row.original.unit}</span>
      ),
    },
    {
      accessorKey: "origin",
      header: "Origem/Destino",
    },
  ];

  // Action column for all tables
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/inventory/raw-materials/${row.original.id}`}
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
        title="Dashboard de Estoque"
        subtitle="Monitoramento de matérias-primas e produtos acabados"
        icon={<Boxes className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Valor Total"
          value={formatCurrency(dashboardData?.inventory?.totalValue || 0)}
          description="em estoque"
          trend={{
            type: "up",
            value: "2% vs último mês",
          }}
          icon={<Boxes className="h-5 w-5" />}
        />

        <KPICard
          title="Itens Críticos"
          value={dashboardData?.inventory?.lowStockCount || 0}
          description="abaixo do mínimo"
          trend={{
            type: dashboardData?.inventory?.lowStockCount > 5 ? "warning" : "none",
            value: "Reposição necessária",
          }}
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />

        <KPICard
          title="Giro de Estoque"
          value={dashboardData?.inventory?.turnoverRate || "3.2"}
          description="índice de rotatividade"
          trend={{
            type: "up",
            value: "0.4 vs último mês",
          }}
          icon={<BarChart2 className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Matérias-Primas com Estoque Baixo</CardTitle>
              <CardDescription>
                Itens com estoque abaixo do nível mínimo definido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={rawMaterialsColumns}
                data={dashboardData?.inventory?.lowStockItems || []}
                actionColumn={actionColumn}
                isLoading={isLoading}
                export={{
                  enabled: true,
                  filename: "materiais-estoque-baixo",
                  title: "Matérias-Primas com Estoque Baixo",
                  subtitle: "Itens que necessitam de reposição",
                }}
              />
              <div className="flex justify-end mt-4">
                <Link
                  to="/inventory/raw-materials"
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  Ver todos os materiais
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <ChartCard
            title="Valor do Estoque por Categoria"
            data={inventoryChartData}
            type="pie"
            xKey="categoria"
            yKeys={[{ key: "valor", color: "#3B82F6", name: "Valor" }]}
            filters={[]}
            onFilterChange={() => {}}
            selectedFilter=""
          />
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
            <CardDescription>
              Últimas entradas e saídas do estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={movementsColumns}
              data={dashboardData?.inventory?.recentMovements || []}
              actionColumn={actionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/inventory/movements"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as movimentações
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InventoryDashboard;