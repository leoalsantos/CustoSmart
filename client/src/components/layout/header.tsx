import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserHeader } from "./user-header";
import { 
  Menu, Search, Sun, Moon, Bell
} from "lucide-react";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/" className="flex items-center ml-4">
            <div className="h-8 w-8 bg-primary text-primary-foreground rounded flex items-center justify-center font-bold">
              CS
            </div>
            <span className="ml-2 text-xl font-semibold">CustoSmart</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log("Search for:", searchQuery);
          }} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              type="text" 
              placeholder="Pesquisar..." 
              className="pl-10 w-full bg-gray-100 dark:bg-gray-700 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <UserHeader />
        </div>
      </div>
    </header>
  );
}
