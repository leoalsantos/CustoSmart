import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Phone, HelpCircle, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const SupportDashboard = () => {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de suporte
  const hasSupportAccess = hasPermission("suporte");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasSupportAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Columns for tickets
  const ticketColumns = [
    {
      accessorKey: "number",
      header: "Número",
    },
    {
      accessorKey: "title",
      header: "Título",
    },
    {
      accessorKey: "createdBy",
      header: "Solicitante",
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.createdAt).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }: { row: any }) => {
        const priority = row.original.priority;
        const priorityMap: { [key: string]: { label: string; color: string } } = {
          baixa: { label: "Baixa", color: "bg-green-100 text-green-800" },
          media: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
          alta: { label: "Alta", color: "bg-orange-100 text-orange-800" },
          critica: { label: "Crítica", color: "bg-red-100 text-red-800" },
        };
        
        const priorityInfo = priorityMap[priority.toLowerCase()] || { label: priority, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
            {priorityInfo.label}
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
          aberto: { label: "Aberto", color: "bg-blue-100 text-blue-800" },
          em_atendimento: { label: "Em Atendimento", color: "bg-yellow-100 text-yellow-800" },
          aguardando_cliente: { label: "Aguardando Cliente", color: "bg-purple-100 text-purple-800" },
          resolvido: { label: "Resolvido", color: "bg-green-100 text-green-800" },
          fechado: { label: "Fechado", color: "bg-gray-100 text-gray-800" },
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

  // Columns for knowledge articles
  const articleColumns = [
    {
      accessorKey: "title",
      header: "Título",
    },
    {
      accessorKey: "category",
      header: "Categoria",
    },
    {
      accessorKey: "author",
      header: "Autor",
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.createdAt).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "viewCount",
      header: "Visualizações",
      cell: ({ row }: { row: any }) => <span>{row.original.viewCount}</span>,
    },
  ];

  // Action column for tickets
  const ticketActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/support/tickets/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Atender
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for knowledge articles
  const articleActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/support/knowledge/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Visualizar
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  return (
    <>
      <PageTitle
        title="Dashboard de Suporte"
        subtitle="Gestão de tickets e atendimento ao cliente"
        icon={<Phone className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Tickets Abertos"
          value={dashboardData?.support?.openTickets || 0}
          description="aguardando atendimento"
          trend={{
            type: dashboardData?.support?.openTickets > 10 ? "warning" : "none",
            value: `${dashboardData?.support?.criticalTickets || 0} críticos`,
          }}
          icon={<Phone className="h-5 w-5" />}
        />

        <KPICard
          title="Tempo Médio"
          value={dashboardData?.support?.averageResponseTime || "N/A"}
          description="de resposta"
          trend={{
            type: "up",
            value: "10% mais rápido",
          }}
          icon={<Phone className="h-5 w-5" />}
        />

        <KPICard
          title="Artigos"
          value={dashboardData?.support?.knowledgeArticles || 0}
          description="na base de conhecimento"
          trend={{
            type: "up",
            value: "3 novos artigos",
          }}
          icon={<HelpCircle className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets Recentes</CardTitle>
            <CardDescription>
              Solicitações de suporte abertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={ticketColumns}
              data={dashboardData?.support?.recentTickets || []}
              actionColumn={ticketActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/support/tickets"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos os tickets
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artigos Populares</CardTitle>
            <CardDescription>
              Conteúdo mais acessado na base de conhecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={articleColumns}
              data={dashboardData?.support?.popularArticles || []}
              actionColumn={articleActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/support/knowledge"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver base de conhecimento
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SupportDashboard;