import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, AlertTriangle, CheckCircle, InfoIcon, Eye } from "lucide-react";
import { Link } from "wouter";

export interface Alert {
  id: number;
  title: string;
  message: string;
  type: "warning" | "error" | "info" | "success";
  date: string;
  isRead: boolean;
}

interface AlertsCardProps {
  title: string;
  alerts: Alert[];
  isLoading?: boolean;
  viewAllLink?: string;
  showViewAllButton?: boolean;
  maxItems?: number;
  onMarkAsRead?: (id: number) => void;
}

export const AlertsCard: React.FC<AlertsCardProps> = ({
  title,
  alerts,
  isLoading = false,
  viewAllLink = "/admin/alerts",
  showViewAllButton = true,
  maxItems = 5,
  onMarkAsRead,
}) => {
  const getAlertTypeIcon = (type: Alert["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "info":
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertTypeBadge = (type: Alert["type"]) => {
    switch (type) {
      case "warning":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Aviso
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Erro
          </Badge>
        );
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Sucesso
          </Badge>
        );
      case "info":
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Informação
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {showViewAllButton && (
          <Link to={viewAllLink}>
            <Button variant="ghost" size="sm" className="text-sm">
              Ver todos
              <Eye className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.slice(0, maxItems).map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 relative ${
                  !alert.isRead ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center">
                    {getAlertTypeIcon(alert.type)}
                    <span className="ml-2 font-medium">{alert.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAlertTypeBadge(alert.type)}
                    {!alert.isRead && onMarkAsRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">{alert.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum alerta disponível.
          </div>
        )}
      </CardContent>
    </Card>
  );
};