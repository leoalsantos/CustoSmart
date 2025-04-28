import React, { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import SetupPage from "@/pages/setup";
import UserProfile from "@/pages/user-profile";
import UserSettings from "@/pages/user-settings";

// Fiscal pages
import FiscalConfigPage from "@/pages/fiscal/config-page";
import NFePage from "@/pages/fiscal/nfe-page";
import NFeEditorPage from "@/pages/fiscal/nfe-editor";

// Production pages
import ProductionOrders from "@/pages/production/orders";
import ProductionProducts from "@/pages/production/products";
import ProductionLosses from "@/pages/production/losses";
import ProductDetails from "@/pages/production/product-details";

// Maintenance pages
import MaintenanceEquipment from "@/pages/maintenance/equipment";
import MaintenanceOrders from "@/pages/maintenance/orders";
import MaintenanceSchedule from "@/pages/maintenance/schedule";

// Finance pages
import FinanceExpenses from "@/pages/finance/expenses";
import FinanceAccounts from "@/pages/finance/accounts";
import FinanceReports from "@/pages/finance/reports";

// Inventory pages
import InventoryRawMaterials from "@/pages/inventory/raw-materials";
import InventoryProducts from "@/pages/inventory/products";

// Commercial pages
import CommercialCustomers from "@/pages/commercial/customers";
import CommercialOrders from "@/pages/commercial/orders";
import CommercialNFes from "@/pages/commercial/nfes";
import CommercialFiscalConfig from "@/pages/commercial/fiscal-config";
import CommercialPricing from "@/pages/commercial/pricing";

// Quality pages
import QualityInspections from "@/pages/quality/inspections";
import QualityNonConformities from "@/pages/quality/non-conformities";

// Purchase pages
import PurchaseSuppliers from "@/pages/purchase/suppliers";
import PurchaseOrders from "@/pages/purchase/orders";
import PurchaseQuotations from "@/pages/purchase/quotations";
import EnhancedQuotations from "@/pages/purchase/enhanced-quotations";
import InvoiceEntries from "@/pages/purchase/invoice-entries";

// Admin pages
import AdminUsers from "@/pages/admin/users";
import AdminCompany from "@/pages/admin/company";
import AdminAlerts from "@/pages/admin/alerts";
import AdminChat from "@/pages/admin/chat";
import MeasurementUnits from "@/pages/admin/measurement-units";
import SystemAuditLogs from "@/pages/admin/system-audit-logs";
import ChatAuditLogs from "@/pages/admin/chat-audit-logs";

// HR pages
import HREmployees from "@/pages/hr/employees";
import HRDepartments from "@/pages/hr/departments";
import HRPositions from "@/pages/hr/positions";
import HRPayroll from "@/pages/hr/payroll";
import HRLeaves from "@/pages/hr/leaves";

// New pages
import ChatPage from "@/pages/chat";
import TestChatPage from "@/pages/test-chat";
import SupportPage from "@/pages/support";
import WaitingPermissions from "@/pages/waiting-permissions";
import DeveloperPage from "@/pages/developer";

// Support pages
import SupportTickets from "@/pages/support/tickets";
import SupportKnowledge from "@/pages/support/knowledge";

function Router() {
  return (
    <Switch>
      {/* Dashboard principal acessível a usuários com permissão de dashboard */}
      <ProtectedRoute path="/" component={Dashboard} requiredPermission="dashboard" />
      
      {/* Dashboards específicos por área */}
      <ProtectedRoute path="/dashboard/production" component={React.lazy(() => import("@/pages/dashboard/production"))} requiredPermission="production" />
      <ProtectedRoute path="/dashboard/maintenance" component={React.lazy(() => import("@/pages/dashboard/maintenance"))} requiredPermission="maintenance" />
      <ProtectedRoute path="/dashboard/inventory" component={React.lazy(() => import("@/pages/dashboard/inventory"))} requiredPermission="inventory" />
      <ProtectedRoute path="/dashboard/finance" component={React.lazy(() => import("@/pages/dashboard/finance"))} requiredPermission="finance" />
      <ProtectedRoute path="/dashboard/commercial" component={React.lazy(() => import("@/pages/dashboard/commercial"))} requiredPermission="commercial" />
      <ProtectedRoute path="/dashboard/purchase" component={React.lazy(() => import("@/pages/dashboard/purchase"))} requiredPermission="purchase" />
      <ProtectedRoute path="/dashboard/quality" component={React.lazy(() => import("@/pages/dashboard/quality"))} requiredPermission="quality" />
      <ProtectedRoute path="/dashboard/hr" component={React.lazy(() => import("@/pages/dashboard/hr"))} requiredPermission="hr" />
      <ProtectedRoute path="/dashboard/support" component={React.lazy(() => import("@/pages/dashboard/support"))} requiredPermission="suporte" />
      <ProtectedRoute path="/dashboard/admin" component={React.lazy(() => import("@/pages/dashboard/admin"))} requiredPermission="admin" />
      
      {/* Tela de espera de permissões */}
      <ProtectedRoute path="/waiting-permissions" component={WaitingPermissions} />
      
      {/* Rotas de perfil e suporte acessíveis a todos usuários autenticados */}
      <ProtectedRoute path="/user-profile" component={UserProfile} requiredPermission="profile" />
      <ProtectedRoute path="/user-settings" component={UserSettings} requiredPermission="profile" />
      <ProtectedRoute path="/chat" component={ChatPage} />
      {/* Temporariamente removida a restrição de permissão 'chat' para teste */}
      <ProtectedRoute path="/test-chat" component={TestChatPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      
      {/* Rotas de Suporte Técnico */}
      <ProtectedRoute path="/support/tickets" component={SupportTickets} requiredPermission="suporte" />
      <ProtectedRoute path="/support/knowledge" component={SupportKnowledge} requiredPermission="suporte" />
      
      {/* Production Routes */}
      <ProtectedRoute path="/production/orders" component={ProductionOrders} requiredPermission="production" />
      <ProtectedRoute path="/production/products" component={ProductionProducts} requiredPermission="production" />
      <ProtectedRoute path="/production/product/:id" component={ProductDetails} requiredPermission="production" />
      <ProtectedRoute path="/production/losses" component={ProductionLosses} requiredPermission="production" />
      <ProtectedRoute path="/production/losses/new" component={ProductionLosses} requiredPermission="production" />
      
      {/* Maintenance Routes */}
      <ProtectedRoute path="/maintenance/equipment" component={MaintenanceEquipment} requiredPermission="maintenance" />
      <ProtectedRoute path="/maintenance/orders" component={MaintenanceOrders} requiredPermission="maintenance" />
      <ProtectedRoute path="/maintenance/orders/:id" component={MaintenanceOrders} requiredPermission="maintenance" />
      <ProtectedRoute path="/maintenance/orders/:id/edit" component={MaintenanceOrders} requiredPermission="maintenance" />
      <ProtectedRoute path="/maintenance/orders/:id/complete" component={MaintenanceOrders} requiredPermission="maintenance" />
      <ProtectedRoute path="/maintenance/schedule" component={MaintenanceSchedule} requiredPermission="maintenance" />
      
      {/* Finance Routes */}
      <ProtectedRoute path="/finance/expenses" component={FinanceExpenses} requiredPermission="finance" />
      <ProtectedRoute path="/finance/accounts" component={FinanceAccounts} requiredPermission="finance" />
      <ProtectedRoute path="/finance/reports" component={FinanceReports} requiredPermission="finance" />
      
      {/* Inventory Routes */}
      <ProtectedRoute path="/inventory/raw-materials" component={InventoryRawMaterials} requiredPermission="inventory" />
      <ProtectedRoute path="/inventory/products" component={InventoryProducts} requiredPermission="inventory" />
      
      {/* Commercial Routes */}
      <ProtectedRoute path="/commercial/customers" component={CommercialCustomers} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/orders" component={CommercialOrders} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/nfes" component={CommercialNFes} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/nfes/new" component={CommercialNFes} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/nfes/:id" component={CommercialNFes} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/fiscal-config" component={CommercialFiscalConfig} requiredPermission="commercial" />
      <ProtectedRoute path="/commercial/pricing" component={CommercialPricing} requiredPermission="commercial" />
      
      {/* Quality Routes */}
      <ProtectedRoute path="/quality/inspections" component={QualityInspections} requiredPermission="quality" />
      <ProtectedRoute path="/quality/inspections/new" component={QualityInspections} requiredPermission="quality" />
      <ProtectedRoute path="/quality/inspections/:id" component={QualityInspections} requiredPermission="quality" />
      <ProtectedRoute path="/quality/non-conformities" component={QualityNonConformities} requiredPermission="quality" />
      <ProtectedRoute path="/quality/non-conformities/new" component={QualityNonConformities} requiredPermission="quality" />
      <ProtectedRoute path="/quality/non-conformities/:id" component={QualityNonConformities} requiredPermission="quality" />
      
      {/* Purchase Routes */}
      <ProtectedRoute path="/purchase/suppliers" component={PurchaseSuppliers} requiredPermission="purchase" />
      <ProtectedRoute path="/purchase/orders" component={PurchaseOrders} requiredPermission="purchase" />
      <ProtectedRoute path="/purchase/quotations" component={PurchaseQuotations} requiredPermission="purchase" />
      <ProtectedRoute path="/purchase/quotations-v2" component={EnhancedQuotations} requiredPermission="purchase" />
      <ProtectedRoute path="/purchase/invoice-entries" component={InvoiceEntries} requiredPermission="purchase" />
      <ProtectedRoute path="/purchase/invoice-entries/:id" component={InvoiceEntries} requiredPermission="purchase" />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/users" component={AdminUsers} requiredPermission="admin" />
      <ProtectedRoute path="/admin/company" component={AdminCompany} requiredPermission="admin" />
      <ProtectedRoute path="/admin/alerts" component={AdminAlerts} requiredPermission="admin" />
      <ProtectedRoute path="/admin/chat" component={AdminChat} />
      <ProtectedRoute path="/admin/measurement-units" component={MeasurementUnits} requiredPermission="admin" />
      <ProtectedRoute path="/admin/system-audit-logs" component={SystemAuditLogs} requiredPermission="admin" />
      <ProtectedRoute path="/admin/chat-audit-logs" component={ChatAuditLogs} requiredPermission="admin" />
      
      {/* HR Routes */}
      <ProtectedRoute path="/hr/employees" component={HREmployees} requiredPermission="hr" />
      <ProtectedRoute path="/hr/departments" component={HRDepartments} requiredPermission="hr" />
      <ProtectedRoute path="/hr/positions" component={HRPositions} requiredPermission="hr" />
      <ProtectedRoute path="/hr/payroll" component={HRPayroll} requiredPermission="hr" />
      <ProtectedRoute path="/hr/leaves" component={HRLeaves} requiredPermission="hr" />
      
      {/* Fiscal Routes */}
      <ProtectedRoute path="/fiscal/config" component={FiscalConfigPage} requiredPermission="fiscal" />
      <ProtectedRoute path="/fiscal/nfe" component={NFePage} requiredPermission="fiscal" />
      <ProtectedRoute path="/fiscal/nfe/nova" component={NFeEditorPage} requiredPermission="fiscal" />
      <ProtectedRoute path="/fiscal/nfe/:id" component={NFeEditorPage} requiredPermission="fiscal" />
      
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Setup Page - para configuração inicial do sistema */}
      <Route path="/setup" component={SetupPage} />
      
      {/* Developer Page */}
      <ProtectedRoute path="/developer" component={DeveloperPage} requiredPermission="admin" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Componente para envolver páginas autenticadas com o MainLayout
function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Páginas que não devem usar o MainLayout
  const publicPages = ['/auth', '/setup'];
  // Páginas que devem ter layout personalizado (atualmente nenhuma)
  const customLayoutPages: string[] = [];
  const isPublicPage = publicPages.some(page => location === page || location.startsWith(page + '/'));
  const isCustomLayoutPage = customLayoutPages.some(page => location === page || location.startsWith(page + '/'));

  // Se estiver carregando, for uma página pública, ou uma página com layout customizado,
  // renderiza sem o MainLayout
  if (isLoading || isPublicPage || isCustomLayoutPage) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <Router />
      </Suspense>
    );
  }

  // Não aplicamos o MainLayout quando o usuário não está autenticado
  if (!user) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <Router />
      </Suspense>
    );
  }

  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <Router />
      </Suspense>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
