import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Receipt, FileText, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const PurchaseDashboard = () => {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de compras
  const hasPurchaseAccess = hasPermission("purchase");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasPurchaseAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Columns for purchase orders
  const purchaseColumns = [
    {
      accessorKey: "orderNumber",
      header: "Pedido #",
    },
    {
      accessorKey: "supplier",
      header: "Fornecedor",
      cell: ({ row }: { row: any }) => <span>{row.original.supplier?.name || "N/A"}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: "Valor Total",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(row.original.totalAmount || 0)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Date(row.original.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          aguardando: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
          aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800" },
          enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800" },
          recebido: { label: "Recebido", color: "bg-purple-100 text-purple-800" },
          cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
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

  // Columns for invoice entries
  const invoiceColumns = [
    {
      accessorKey: "numero",
      header: "Número",
    },
    {
      accessorKey: "fornecedor",
      header: "Fornecedor",
      cell: ({ row }: { row: any }) => <span>{row.original.fornecedor?.name || "N/A"}</span>,
    },
    {
      accessorKey: "valorTotal",
      header: "Valor Total",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(row.original.valorTotal || 0)}
        </span>
      ),
    },
    {
      accessorKey: "dataEmissao",
      header: "Emissão",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Date(row.original.dataEmissao).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          em_digitacao: { label: "Em Digitação", color: "bg-yellow-100 text-yellow-800" },
          recebida: { label: "Recebida", color: "bg-blue-100 text-blue-800" },
          processada: { label: "Processada", color: "bg-green-100 text-green-800" },
          rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
          cancelada: { label: "Cancelada", color: "bg-gray-100 text-gray-800" },
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

  // Columns for quotations
  const quotationColumns = [
    {
      accessorKey: "number",
      header: "Número",
    },
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "supplier",
      header: "Fornecedor",
      cell: ({ row }: { row: any }) => <span>{row.original.supplier?.name || "N/A"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Date(row.original.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          aberta: { label: "Aberta", color: "bg-yellow-100 text-yellow-800" },
          enviada: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
          respondida: { label: "Respondida", color: "bg-green-100 text-green-800" },
          finalizada: { label: "Finalizada", color: "bg-purple-100 text-purple-800" },
          cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
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

  // Action column for purchase orders
  const orderActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/purchase/orders/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for invoice entries
  const invoiceActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/purchase/invoice-entries/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for quotations
  const quotationActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/purchase/quotations/${row.original.id}`}
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
        title="Dashboard de Compras"
        subtitle="Gerenciamento de compras, fornecedores e cotações"
        icon={<Receipt className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Compras do Mês"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(dashboardData?.purchase?.monthlyPurchases || 0)}
          description="total em compras"
          trend={{
            type: "none",
            value: "Dentro do orçamento",
          }}
          icon={<Receipt className="h-5 w-5" />}
        />

        <KPICard
          title="Cotações"
          value={dashboardData?.purchase?.pendingQuotations || 0}
          description="cotações em aberto"
          trend={{
            type: dashboardData?.purchase?.pendingQuotations > 3 ? "warning" : "none",
            value: "Aguardando resposta",
          }}
          icon={<Receipt className="h-5 w-5" />}
        />

        <KPICard
          title="Notas de Entrada"
          value={dashboardData?.purchase?.pendingInvoices || 0}
          description="notas a processar"
          trend={{
            type: "none",
            value: "Processamento normal",
          }}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Cotações Recentes</CardTitle>
            <CardDescription>
              Últimas cotações enviadas aos fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={quotationColumns}
              data={dashboardData?.purchase?.recentQuotations || []}
              actionColumn={quotationActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/purchase/quotations"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as cotações
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de Compra</CardTitle>
            <CardDescription>
              Últimos pedidos enviados a fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={purchaseColumns}
              data={dashboardData?.purchase?.recentOrders || []}
              actionColumn={orderActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/purchase/orders"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos os pedidos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas Fiscais de Entrada</CardTitle>
            <CardDescription>
              Últimas notas fiscais recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={invoiceColumns}
              data={dashboardData?.purchase?.recentInvoices || []}
              actionColumn={invoiceActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/purchase/invoice-entries"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as notas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PurchaseDashboard;