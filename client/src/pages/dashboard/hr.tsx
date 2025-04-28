import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, UserCog, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { useAuth } from "@/hooks/use-auth";
import WaitingPermissions from "@/pages/waiting-permissions";

const HRDashboard = () => {
  const { hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de RH
  const hasHRAccess = hasPermission("hr");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasHRAccess) {
    return <WaitingPermissions />;
  }

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchInterval: 60000,
    enabled: true,
  });

  // Columns for employees
  const employeeColumns = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "position",
      header: "Cargo",
    },
    {
      accessorKey: "department",
      header: "Departamento",
    },
    {
      accessorKey: "hiringDate",
      header: "Data de Contratação",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.hiringDate).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
          ferias: { label: "Férias", color: "bg-blue-100 text-blue-800" },
          licenca: { label: "Licença", color: "bg-yellow-100 text-yellow-800" },
          desligado: { label: "Desligado", color: "bg-red-100 text-red-800" },
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

  // Columns for leaves
  const leaveColumns = [
    {
      accessorKey: "employeeName",
      header: "Funcionário",
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }: { row: any }) => {
        const type = row.original.type;
        const typeMap: { [key: string]: { label: string; color: string } } = {
          ferias: { label: "Férias", color: "bg-blue-100 text-blue-800" },
          licenca_medica: { label: "Licença Médica", color: "bg-yellow-100 text-yellow-800" },
          licenca_maternidade: { label: "Lic. Maternidade", color: "bg-purple-100 text-purple-800" },
          licenca_paternidade: { label: "Lic. Paternidade", color: "bg-indigo-100 text-indigo-800" },
          outros: { label: "Outros", color: "bg-gray-100 text-gray-800" },
        };
        
        const typeInfo = typeMap[type] || { label: type, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: "Início",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.startDate).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "Fim",
      cell: ({ row }: { row: any }) => (
        <span>{new Date(row.original.endDate).toLocaleDateString("pt-BR")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
          aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
          rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
          em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
          concluida: { label: "Concluída", color: "bg-purple-100 text-purple-800" },
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

  // Action column for employees
  const employeeActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/hr/employees/${row.original.id}`}
        className="flex items-center text-sm text-primary hover:underline"
      >
        Detalhes
        <ChevronRight className="w-4 w-4 ml-1" />
      </Link>
    ),
  };

  // Action column for leaves
  const leaveActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => (
      <Link
        to={`/hr/leaves/${row.original.id}`}
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
        title="Dashboard de Recursos Humanos"
        subtitle="Gestão de colaboradores e departamentos"
        icon={<Users className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Funcionários"
          value={dashboardData?.hr?.totalEmployees || 0}
          description="total de colaboradores"
          trend={{
            type: "up",
            value: "2 contratações recentes",
          }}
          icon={<Users className="h-5 w-5" />}
        />

        <KPICard
          title="Departamentos"
          value={dashboardData?.hr?.departmentCount || 0}
          description="total de departamentos"
          trend={{
            type: "none",
            value: "Estrutura estável",
          }}
          icon={<UserCog className="h-5 w-5" />}
        />

        <KPICard
          title="Em Licença"
          value={dashboardData?.hr?.onLeaveCount || 0}
          description="funcionários ausentes"
          trend={{
            type: "none",
            value: `${dashboardData?.hr?.upcomingLeavesCount || 0} programados`,
          }}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Funcionários Recentes</CardTitle>
            <CardDescription>
              Últimas contratações e atualizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={employeeColumns}
              data={dashboardData?.hr?.recentEmployees || []}
              actionColumn={employeeActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/hr/employees"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todos os funcionários
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenças e Férias</CardTitle>
            <CardDescription>
              Programação de ausências da equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={leaveColumns}
              data={dashboardData?.hr?.recentLeaves || []}
              actionColumn={leaveActionColumn}
              isLoading={isLoading}
            />
            <div className="flex justify-end mt-4">
              <Link
                to="/hr/leaves"
                className="text-sm text-primary hover:underline flex items-center"
              >
                Ver todas as licenças
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default HRDashboard;