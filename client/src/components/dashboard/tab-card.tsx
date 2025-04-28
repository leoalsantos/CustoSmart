import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface TabCardItem {
  id: string;
  label: string;
  content: React.ReactNode;
  viewAllLink?: string;
}

interface TabCardProps {
  tabs: TabCardItem[];
  className?: string;
}

export function TabCard({ tabs, className }: TabCardProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "px-6 py-3 text-center text-sm font-medium rounded-none",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn("p-4", activeTab !== tab.id && "hidden")}
        >
          {tab.content}
          
          {tab.viewAllLink && (
            <div className="flex justify-between items-center mt-4 px-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {`Mostrando ${(tab.content as any)?.props?.data?.length || 0} registros`}
              </p>
              <Link 
                href={tab.viewAllLink}
                className="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400"
              >
                Ver tudo
              </Link>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
