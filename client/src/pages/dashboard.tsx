import React from "react";
import { Link } from "wouter";
import {
  Factory,
  Hammer,
  Boxes,
  Coins,
  ShoppingCart,
  Receipt,
  CheckSquare,
  Users,
  Phone,
  Settings,
  Layers,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { SystemAlertsCard } from "@/components/dashboard/system-alerts-card";
import WaitingPermissions from "@/pages/waiting-permissions";

// Componente de card para módulos do dashboard
const DashboardModuleCard = ({
  title,
  description,
  icon,
  path,
  color = "bg-primary",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
}) => {
  return (
    <Link to={path}>
      <Card className="h-full transition-all hover:shadow-md cursor-pointer">
        <div className={`w-full h-2 ${color} rounded-t-lg`}></div>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
              {icon}
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

const Dashboard = () => {
  const { user, hasPermission } = useAuth();

  // Verifica se o usuário tem permissão de dashboard
  const hasDashboardAccess = hasPermission("dashboard");

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasDashboardAccess) {
    return <WaitingPermissions />;
  }



  // Definição dos módulos disponíveis para dashboards específicos
  const dashboardModules = [
    {
      title: "Produção",
      description: "Monitoramento de ordens de produção, produtos e indicadores de desempenho",
      icon: <Factory className="h-5 w-5 text-blue-500" />,
      path: "/dashboard/production",
      permission: "production",
      color: "bg-blue-500",
    },
    {
      title: "Manutenção",
      description: "Gestão de equipamentos, ordens de manutenção e programação preventiva",
      icon: <Hammer className="h-5 w-5 text-orange-500" />,
      path: "/dashboard/maintenance",
      permission: "maintenance",
      color: "bg-orange-500",
    },
    {
      title: "Estoque",
      description: "Controle de matérias-primas, produtos acabados e níveis de estoque",
      icon: <Boxes className="h-5 w-5 text-green-500" />,
      path: "/dashboard/inventory",
      permission: "inventory",
      color: "bg-green-500",
    },
    {
      title: "Financeiro",
      description: "Acompanhamento de receitas, despesas, contas a pagar e receber",
      icon: <Coins className="h-5 w-5 text-emerald-500" />,
      path: "/dashboard/finance",
      permission: "finance",
      color: "bg-emerald-500",
    },
    {
      title: "Comercial",
      description: "Gestão de clientes, pedidos, vendas e emissão de notas fiscais",
      icon: <ShoppingCart className="h-5 w-5 text-indigo-500" />,
      path: "/dashboard/commercial",
      permission: "commercial",
      color: "bg-indigo-500",
    },
    {
      title: "Compras",
      description: "Gerenciamento de fornecedores, cotações e pedidos de compra",
      icon: <Receipt className="h-5 w-5 text-violet-500" />,
      path: "/dashboard/purchase",
      permission: "purchase",
      color: "bg-violet-500",
    },
    {
      title: "Qualidade",
      description: "Controle de inspeções, não-conformidades e melhoria contínua",
      icon: <CheckSquare className="h-5 w-5 text-yellow-500" />,
      path: "/dashboard/quality",
      permission: "quality",
      color: "bg-yellow-500",
    },
    {
      title: "Recursos Humanos",
      description: "Gestão de funcionários, departamentos, cargos e benefícios",
      icon: <Users className="h-5 w-5 text-red-500" />,
      path: "/dashboard/hr",
      permission: "hr",
      color: "bg-red-500",
    },
    {
      title: "Suporte Técnico",
      description: "Atendimento de tickets, base de conhecimento e suporte ao cliente",
      icon: <Phone className="h-5 w-5 text-teal-500" />,
      path: "/dashboard/support",
      permission: "suporte",
      color: "bg-teal-500",
    },
    {
      title: "Administrativo",
      description: "Configurações do sistema, usuários e auditoria de logs",
      icon: <Settings className="h-5 w-5 text-gray-500" />,
      path: "/dashboard/admin",
      permission: "admin",
      color: "bg-gray-500",
    },
  ];

  // Filtra apenas os módulos para os quais o usuário tem permissão
  const accessibleModules = dashboardModules.filter(module => 
    hasPermission(module.permission) || user?.role === "admin"
  );

  // Verifica se o usuário tem alguma permissão
  const hasAnyPermission = user?.permissions
    ? Object.values(user.permissions).some((value) => value === true) || user.role === "admin"
    : false;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo ao CustoSmart, seu sistema de gestão industrial completo. Escolha um dos módulos abaixo para visualizar informações detalhadas.
        </p>
      </div>

      {!hasAnyPermission ? (
        <WaitingPermissions />
      ) : (
        <>
          {/* Alertas do sistema */}
          {(hasPermission("admin") || user?.role === "admin") && (
            <div className="mb-6">
              <SystemAlertsCard 
                title="Alertas do Sistema" 
                maxItems={3} 
                showViewAllButton={true}
                viewAllLink="/admin/alerts"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Card para Dashboard Geral/Resumido */}
            <DashboardModuleCard
              title="Visão Geral"
              description="Resumo dos principais indicadores de todos os módulos do sistema"
              icon={<Layers className="h-5 w-5 text-primary" />}
              path="/"
              color="bg-primary"
            />
            
            {/* Renderiza os módulos disponíveis com base nas permissões */}
            {accessibleModules.map((module, index) => (
              <DashboardModuleCard
                key={index}
                title={module.title}
                description={module.description}
                icon={module.icon}
                path={module.path}
                color={module.color}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default Dashboard;
