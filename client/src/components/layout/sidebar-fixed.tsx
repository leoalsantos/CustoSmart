import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, LayoutDashboard, Settings, Receipt, Coins, FlaskRound, ClipboardList, 
  PieChart, Hammer, Boxes, Warehouse, CheckSquare, Users, ShoppingCart, Factory,
  MessageCircle, Bell, HelpCircle, Phone
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";

// Criar contexto para compartilhar o estado collapsed entre os componentes
type SidebarContextType = {
  collapsed: boolean;
};

const SidebarContext = createContext<SidebarContextType>({ collapsed: false });

// Hook para acessar o contexto
const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext deve ser usado dentro de SidebarProvider');
  }
  return context;
};

type SidebarSectionProps = {
  title: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { title: string; path: string }[];
  expanded?: boolean;
  onToggle?: () => void;
  isActive: boolean;
  isSubActive?: (path: string) => boolean;
};

const SidebarSection = ({
  title,
  icon,
  path,
  subItems,
  expanded,
  onToggle,
  isActive,
  isSubActive
}: SidebarSectionProps) => {
  // Obtenha acesso ao contexto da Sidebar para verificar se está collapsed
  const { collapsed } = useSidebarContext();
  
  if (subItems && subItems.length > 0) {
    return (
      <Collapsible
        open={expanded && !collapsed}
        onOpenChange={onToggle}
        className="w-full"
      >
        <CollapsibleTrigger className={cn(
          "flex items-center w-full gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
          isActive 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}>
          <span className="flex items-center gap-3">
            {icon}
            {!collapsed && <span className="text-sm">{title}</span>}
          </span>
          {!collapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 ml-auto transition-transform duration-200",
                expanded ? "transform rotate-180" : ""
              )}
            />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 pl-10">
          <div className="flex flex-col gap-1">
            {subItems.map((item, index) => (
              <Link
                key={index}
                href={item.path}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-sm font-medium transition-all",
                  isSubActive && isSubActive(item.path)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={path || "#"}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
    >
      {icon}
      {!collapsed && <span>{title}</span>}
    </Link>
  );
};

type SidebarProps = {
  collapsed?: boolean;
};

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    financeiro: false,
    producao: false,
    manutencao: false,
    estoque: false,
    qualidade: false,
    comercial: false,
    compras: false,
    hr: false,
    admin: false,
    suporte: false
  });
  
  // Função para verificar se o usuário tem permissão para acessar determinado módulo
  const hasPermission = (module: string): boolean => {
    // Se o usuário não estiver autenticado, retorna false
    if (!user) return false;
    
    // Se o usuário é admin, tem acesso a tudo
    if (user?.role === 'admin') return true;
    
    // Mapeamento entre nomes dos módulos na sidebar e nomes das permissões no schema
    const moduleToPermissionMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'admin': 'admin',
      'financeiro': 'finance',
      'producao': 'production',
      'manutencao': 'maintenance',
      'estoque': 'inventory',
      'qualidade': 'quality',
      'comercial': 'commercial',
      'compras': 'purchase',
      'hr': 'hr',
      'chat': 'chat',
      'suporte': 'support'
    };
    
    // Verificar as permissões específicas do usuário
    if (user?.permissions && typeof user.permissions === 'object') {
      // Converter para nome da permissão no schema
      const permissionName = moduleToPermissionMap[module] || module;
      
      // Se o usuário tem permissão específica para o módulo
      const permissions = user.permissions as Record<string, boolean>;
      if (permissionName in permissions && permissions[permissionName] === true) {
        return true;
      }
    }
    
    // Para retro-compatibilidade, verificar roles antigos também
    switch (module) {
      case 'admin':
        return user?.role === 'admin';
      case 'financeiro':
        return user?.role === 'admin' || user?.role === 'finance';
      case 'producao':
        return user?.role === 'admin' || user?.role === 'production';
      case 'manutencao':
        return user?.role === 'admin' || user?.role === 'maintenance';
      case 'estoque':
        return user?.role === 'admin' || user?.role === 'inventory';
      case 'qualidade':
        return user?.role === 'admin' || user?.role === 'quality';
      case 'comercial':
        return user?.role === 'admin' || user?.role === 'commercial';
      case 'compras':
        return user?.role === 'admin' || user?.role === 'purchase';
      case 'hr':
        return user?.role === 'admin' || user?.role === 'hr';
      case 'chat':
        // Chat só é acessível para usuários com permissão específica no sistema de permissões
        return user?.permissions?.chat === true;
      case 'suporte':
        return user?.role === 'admin' || user?.role === 'support' || (user?.permissions?.support === true);
      case 'dashboard':
        // Dashboard requer permissão específica "dashboard", mas só é verificado para exibir esse item
        if (user?.permissions && typeof user.permissions === 'object') {
          const permissions = user.permissions as Record<string, boolean>;
          return permissions['dashboard'] === true;
        }
        return user?.role === 'admin';
      default:
        return false; // Por padrão, negar acesso caso não tenha permissão específica
    }
  };

  // Expand sections based on current location
  useEffect(() => {
    const updatedSections = { ...expandedSections };
    
    if (location.startsWith("/finance")) {
      updatedSections.financeiro = true;
    } else if (location.startsWith("/production")) {
      updatedSections.producao = true;
    } else if (location.startsWith("/maintenance")) {
      updatedSections.manutencao = true;
    } else if (location.startsWith("/inventory")) {
      updatedSections.estoque = true;
    } else if (location.startsWith("/quality")) {
      updatedSections.qualidade = true;
    } else if (location.startsWith("/commercial")) {
      updatedSections.comercial = true;
    } else if (location.startsWith("/purchase")) {
      updatedSections.compras = true;
    } else if (location.startsWith("/admin")) {
      updatedSections.admin = true;
    } else if (location.startsWith("/hr")) {
      updatedSections.hr = true;
    } else if (location.startsWith("/support")) {
      updatedSections.suporte = true;
    }
    
    setExpandedSections(updatedSections);
  }, [location]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isPathActive = (path: string) => location === path;
  const isSubPathActive = (basePath: string) => location.startsWith(basePath);
  
  const isSubItemActive = (path: string) => location === path;

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-800 shadow-md transition-all duration-300 z-10",
        collapsed ? "w-16" : "w-64"
      )}>
        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-1 min-h-[calc(100vh-16rem)]">
            <div className="mb-4">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Principais</h3>
              <div className="mt-2 space-y-1">
                {/* Dashboard exibido apenas para usuários com permissão 'dashboard' */}
                {hasPermission('dashboard') && (
                  <SidebarSection
                    title="Dashboard"
                    icon={<LayoutDashboard className="h-5 w-5" />}
                    path="/"
                    isActive={isPathActive("/")}
                  />
                )}
                
                {/* Chat só é exibido se o usuário tiver permissão específica */}
                {hasPermission('chat') && (
                  <SidebarSection
                    title="Chat"
                    icon={<MessageCircle className="h-5 w-5" />}
                    path="/chat"
                    isActive={isPathActive("/chat")}
                  />
                )}
                
                {hasPermission('admin') && (
                  <SidebarSection
                    title="Administrativo"
                    icon={<Settings className="h-5 w-5" />}
                    expanded={expandedSections.admin}
                    onToggle={() => toggleSection("admin")}
                    isActive={isSubPathActive("/admin")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Usuários", path: "/admin/users" },
                      { title: "Empresa", path: "/admin/company" },
                      { title: "Alertas", path: "/admin/alerts" },
                      { title: "Unidades de Medida", path: "/admin/measurement-units" },
                      { title: "Desenvolvedor", path: "/developer" }
                    ]}
                  />
                )}
              </div>
            </div>
            
            {hasPermission('financeiro') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Financeiro</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Financeiro"
                    icon={<Coins className="h-5 w-5" />}
                    expanded={expandedSections.financeiro}
                    onToggle={() => toggleSection("financeiro")}
                    isActive={isSubPathActive("/finance")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Despesas", path: "/finance/expenses" },
                      { title: "Contas a Pagar/Receber", path: "/finance/accounts" },
                      { title: "Relatórios", path: "/finance/reports" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('producao') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produção</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Produção"
                    icon={<Factory className="h-5 w-5" />}
                    expanded={expandedSections.producao}
                    onToggle={() => toggleSection("producao")}
                    isActive={isSubPathActive("/production")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Produtos e Fórmulas", path: "/production/products" },
                      { title: "Ordens de Produção", path: "/production/orders" },
                      { title: "Controle de Perdas", path: "/production/losses" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('manutencao') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manutenção</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Manutenção"
                    icon={<Hammer className="h-5 w-5" />}
                    expanded={expandedSections.manutencao}
                    onToggle={() => toggleSection("manutencao")}
                    isActive={isSubPathActive("/maintenance")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Equipamentos", path: "/maintenance/equipment" },
                      { title: "Ordens de Manutenção", path: "/maintenance/orders" },
                      { title: "Programação", path: "/maintenance/schedule" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('estoque') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Estoque"
                    icon={<Boxes className="h-5 w-5" />}
                    expanded={expandedSections.estoque}
                    onToggle={() => toggleSection("estoque")}
                    isActive={isSubPathActive("/inventory")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Matérias-primas", path: "/inventory/raw-materials" },
                      { title: "Produtos Acabados", path: "/inventory/products" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('qualidade') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualidade</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Qualidade"
                    icon={<CheckSquare className="h-5 w-5" />}
                    expanded={expandedSections.qualidade}
                    onToggle={() => toggleSection("qualidade")}
                    isActive={isSubPathActive("/quality")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Inspeções", path: "/quality/inspections" },
                      { title: "Não Conformidades", path: "/quality/non-conformities" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('comercial') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comercial</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Comercial"
                    icon={<ShoppingCart className="h-5 w-5" />}
                    expanded={expandedSections.comercial}
                    onToggle={() => toggleSection("comercial")}
                    isActive={isSubPathActive("/commercial")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Clientes", path: "/commercial/customers" },
                      { title: "Pedidos", path: "/commercial/orders" },
                      { title: "Notas Fiscais", path: "/commercial/nfes" },
                      { title: "Configuração Fiscal", path: "/commercial/fiscal-config" },
                      { title: "Precificação", path: "/commercial/pricing" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('compras') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compras</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Compras"
                    icon={<Receipt className="h-5 w-5" />}
                    expanded={expandedSections.compras}
                    onToggle={() => toggleSection("compras")}
                    isActive={isSubPathActive("/purchase")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Fornecedores", path: "/purchase/suppliers" },
                      { title: "Pedidos", path: "/purchase/orders" },
                      { title: "Cotações", path: "/purchase/quotations" },
                      { title: "Entrada de Notas", path: "/purchase/invoice-entries" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {hasPermission('hr') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recursos Humanos</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Recursos Humanos"
                    icon={<Users className="h-5 w-5" />}
                    expanded={expandedSections.hr}
                    onToggle={() => toggleSection("hr")}
                    isActive={isSubPathActive("/hr")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Funcionários", path: "/hr/employees" },
                      { title: "Departamentos", path: "/hr/departments" },
                      { title: "Cargos", path: "/hr/positions" },
                      { title: "Folha de Pagamento", path: "/hr/payroll" },
                      { title: "Licenças", path: "/hr/leaves" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {/* Suporte Técnico */}
            {hasPermission('suporte') && (
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Suporte Técnico</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Suporte Técnico"
                    icon={<Phone className="h-5 w-5" />}
                    expanded={expandedSections.suporte}
                    onToggle={() => toggleSection("suporte")}
                    isActive={isSubPathActive("/support")}
                    isSubActive={isSubItemActive}
                    subItems={[
                      { title: "Tickets", path: "/support/tickets" },
                      { title: "Base de Conhecimento", path: "/support/knowledge" }
                    ]}
                  />
                </div>
              </div>
            )}
            
            {/* Desenvolvedor acessível apenas para administradores */}
            {hasPermission('admin') && (
              <div className="mb-4 mt-auto">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desenvolvedor</h3>
                <div className="mt-2 space-y-1">
                  <SidebarSection
                    title="Desenvolvedor"
                    icon={<HelpCircle className="h-5 w-5" />}
                    path="/developer"
                    isActive={isPathActive("/developer")}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Só exibe o rodapé quando a sidebar não está colapsada */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">CustoSmart v1.0</p>
                <p className="text-xs text-gray-500">Desenvolvido por Leonardo A. Santos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  );
}