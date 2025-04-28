import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Settings, Bell, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { AlertsCard } from "@/components/dashboard/alerts-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const AdminDashboard = () => {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de admin
  const hasAdminAccess = hasPermission("admin");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasAdminAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });
  
  // Columns for users
  const userColumns = [
    {
      accessorKey: "username",
      header: "Usuário",
    },
    {
      accessorKey: "fullName",
      header: "Nome Completo",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Função",
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const active = row.original.active;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {active ? "Ativo" : "Inativo"}
          </span>
        );
      },
    },
  ];

  // Columns for system logs
  const logColumns = [
    {
      accessorKey: "timestamp",
      header: "Data/Hora",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.timestamp).toLocaleString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "user",
      header: "Usuário",
    },
    {
      accessorKey: "action",
      header: "Ação",
    },
    {
      accessorKey: "module",
      header: "Módulo",
    },
    {
      accessorKey: "level",
      header: "Nível",
      cell: ({ row }: { row: any }) => {
        const level = row.original.level;
        const levelMap: { [key: string]: { label: string; color: string } } = {
          info: { label: "Info", color: "bg-blue-100 text-blue-800" },
          warning: { label: "Aviso", color: "bg-yellow-100 text-yellow-800" },
          error: { label: "Erro", color: "bg-red-100 text-red-800" },
          success: { label: "Sucesso", color: "bg-green-100 text-green-800" },
        };
        
        const levelInfo = levelMap[level] || { label: level, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
            {levelInfo.label}
          </span>
        );
      },
    },
  ];

  // Action column for users
  const userActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/admin/users/edit/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Editar
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for logs
  const logActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/admin/system-logs/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Prepare alerts data - formatados conforme a interface Alert esperada pelo AlertsCard
  const alertsData = [
    {
      id: 1,
      title: "Alerta de Segurança",
      message: "Tentativa de acesso não autorizado",
      type: "error",
      date: "Hoje, 10:42",
      isRead: false,
    },
    {
      id: 2,
      title: "Alerta de Sistema",
      message: "Espaço em disco abaixo de 20%",
      type: "warning",
      date: "Ontem, 15:30",
      isRead: false,
    },
    {
      id: 3,
      title: "Notificação de Backup",
      message: "Backup automático completo",
      type: "info",
      date: "Hoje, 03:15",
      isRead: true,
    },
    {
      id: 4,
      title: "Permissões Pendentes",
      message: "3 usuários com permissões pendentes",
      type: "warning",
      date: "2 dias atrás",
      isRead: false,
    },
  ];

  return (
    <>
      <PageTitle
        title="Dashboard Administrativo"
        subtitle="Gerenciamento e monitoramento do sistema"
        icon={<Settings className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Usuários"
          value={dashboardData?.admin?.activeUsers || 0}
          description="usuários ativos"
          trend={{
            type: "up",
            value: "2 novos usuários",
          }}
          icon={<Users className="h-5 w-5" />}
        />

        <KPICard
          title="Alertas"
          value={dashboardData?.admin?.totalAlerts || 0}
          description="alertas do sistema"
          trend={{
            type: dashboardData?.admin?.totalAlerts > 5 ? "warning" : "none",
            value: `${dashboardData?.admin?.criticalAlerts || 0} críticos`,
          }}
          icon={<Bell className="h-5 w-5" />}
        />

        <KPICard
          title="Performance"
          value={dashboardData?.admin?.systemHealth ? (dashboardData.admin.systemHealth + "%") : "N/A"}
          description="saúde do sistema"
          trend={{
            type: (dashboardData?.admin?.systemHealth || 0) > 90 ? "up" : "warning",
            value: "Monitorando...",
          }}
          icon={<Settings className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Gerenciamento de usuários e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={dashboardData?.admin?.recentUsers || []}
                actionColumn={userActionColumn}
                isLoading={isLoading}
              />
              <div className="flex justify-end mt-4">
                <Link
                  to="/admin/users"
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  Gerenciar usuários
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <AlertsCard
            title="Alertas do Sistema"
            alerts={alertsData}
            viewAllLink="/admin/alerts"
          />
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Logs do Sistema</CardTitle>
            <CardDescription>
              Registro de atividades e eventos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={logColumns}
              data={dashboardData?.admin?.recentLogs || []}
              actionColumn={logActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/admin/logs"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos os logs
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;