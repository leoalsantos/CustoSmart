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
  isCollapsed: boolean;
};

const SidebarContext = createContext<SidebarContextType>({ isCollapsed: false });

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
  // Pegue o estado collapsed do componente pai
  const { isCollapsed } = useContext(SidebarContext);
  
  if (subItems && subItems.length > 0) {
    return (
      <Collapsible
        open={expanded && !isCollapsed}
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
            {!isCollapsed && <span className="text-sm">{title}</span>}
          </span>
          {!isCollapsed && (
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
      {!isCollapsed && <span>{title}</span>}
    </Link>
  );
};

type SidebarProps = {
  collapsed?: boolean;
};

export function Sidebar({ collapsed = false }: SidebarProps) {
  // Variável de estado para rastrear se a barra está colapsada
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  // Atualiza o estado local quando a prop collapsed muda
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);
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
    admin: false,
    chat: false
  });
  
  // Utilizando o hook useAuth para verificar permissões
  const { hasPermission } = useAuth();

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
    } else if (location.startsWith("/chat")) {
      updatedSections.chat = true;
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
    <SidebarContext.Provider value={{ isCollapsed }}>
      <div className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-800 shadow-md transition-all duration-300 z-10",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-1 min-h-[calc(100vh-16rem)]">
            <div className="mb-4">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Principais</h3>
            <div className="mt-2 space-y-1">
              {hasPermission('dashboard') && (
                <SidebarSection
                  title="Dashboard"
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  path="/"
                  isActive={isPathActive("/")}
                />
              )}
              
              {/* Removida temporariamente a verificação de permissão */}
              <SidebarSection
                title="Chat"
                icon={<MessageCircle className="h-5 w-5" />}
                expanded={expandedSections.chat}
                onToggle={() => toggleSection("chat")}
                isActive={isSubPathActive("/chat")}
                isSubActive={isSubItemActive}
                subItems={[
                  { title: "Chat", path: "/chat" },
                  { title: "Chat Teste", path: "/test-chat" }
                ]}
              />
              
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
                    { title: "Logs do Sistema", path: "/admin/system-audit-logs" },
                    // Removida verificação de permissão para chat
                    { title: "Chat Administrativo", path: "/admin/chat" },
                    { title: "Logs de Chat", path: "/admin/chat-audit-logs" }
                  ]}
                />
              )}
            </div>
          </div>
          
          {hasPermission('finance') && (
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
          
          {hasPermission('production') && (
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
          
          {hasPermission('maintenance') && (
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
          
          {hasPermission('inventory') && (
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
          
          {hasPermission('quality') && (
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
                    { title: "Não Conformidades", path: "/quality/issues" }
                  ]}
                />
              </div>
            </div>
          )}
          
          {hasPermission('commercial') && (
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
                    { title: "Precificação", path: "/commercial/pricing" },
                    { title: "Configuração Fiscal", path: "/commercial/fiscal-config" }
                  ]}
                />
              </div>
            </div>
          )}
          
          {hasPermission('purchase') && (
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
                    { title: "Ordens de Compra", path: "/purchase/orders" },
                    { title: "Cotações", path: "/purchase/quotations" },
                    { title: "Cotações Avançadas", path: "/purchase/quotations-v2" },
                    { title: "Notas de Entrada", path: "/purchase/invoice-entries" }
                  ]}
                />
              </div>
            </div>
          )}
          
          {/* Seção de Suporte - visível para usuários com permissão */}
          {hasPermission('support') && (
            <div className="mb-4 mt-auto">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Suporte</h3>
              <div className="mt-2 space-y-1">
                <SidebarSection
                  title="Suporte Técnico"
                  icon={<HelpCircle className="h-5 w-5" />}
                  path="/support"
                  isActive={isPathActive("/support")}
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">CustoSmart v1.0</p>
            <p className="text-xs text-gray-500">Desenvolvido por Leonardo A. Santos</p>
          </div>
        </div>
      </div>
    </div>
    </SidebarContext.Provider>
  );
}
