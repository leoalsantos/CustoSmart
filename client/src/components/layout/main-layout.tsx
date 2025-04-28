import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar-fixed";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const { isMobile } = useMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  
  // Verifica se o usuário está autenticado
  const isAuthenticated = !!user;
  
  // Se o usuário não estiver autenticado, não exibe a sidebar
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 h-full">
            {children}
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Overlay para fechar a sidebar em dispositivos móveis quando clicado */}
      {!sidebarCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 transition-transform transform duration-300 ${
        sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
      } md:relative md:translate-x-0`}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="container mx-auto px-4 py-6 h-full" id="main-content-container">
            {children}
          </div>
        </main>
        
        <footer 
          className={`py-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-0' : 'md:ml-64'
          }`} 
          id="main-footer"
        >
          <p>© {new Date().getFullYear()} CustoSmart - Desenvolvido por Leonardo de Almeida Santos</p>
        </footer>
      </div>
    </div>
  );
}
