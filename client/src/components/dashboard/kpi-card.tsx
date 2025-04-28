import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface TrendData {
  type: "up" | "down" | "neutral";
  value: string;
}

interface KPICardProps {
  title: string;
  value: number | string;
  description: string;
  trend?: TrendData;
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.type) {
      case "up":
        return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />;
      case "down":
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendColorClass = () => {
    if (!trend) return "text-gray-500";
    
    switch (trend.type) {
      case "up":
        return "text-emerald-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            
            {trend && (
              <div className="flex items-center mt-2">
                {getTrendIcon()}
                <span className={`text-xs font-medium ml-1 ${getTrendColorClass()}`}>
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="p-2 bg-primary/10 rounded-full">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};