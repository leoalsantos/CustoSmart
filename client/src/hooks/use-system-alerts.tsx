import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface SystemAlert {
  id: number;
  message: string;
  priority: "high" | "medium" | "low";
  status: "active" | "acknowledged" | "resolved";
  module: string;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
  createdBy: number;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  resolvedBy?: number;
}

export function useSystemAlerts() {
  const { toast } = useToast();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["/api/alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        throw new Error("Erro ao buscar alertas");
      }
      return response.json();
    },
  });

  const { data: activeAlerts = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ["/api/alerts/active"],
    queryFn: async () => {
      const response = await fetch("/api/alerts/active");
      if (!response.ok) {
        throw new Error("Erro ao buscar alertas ativos");
      }
      return response.json();
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("POST", `/api/alerts/${alertId}/acknowledge`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alerta confirmado",
        description: "O alerta foi marcado como confirmado",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao confirmar alerta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("POST", `/api/alerts/${alertId}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao resolver alerta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest("DELETE", `/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alerta excluído",
        description: "O alerta foi excluído com sucesso",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir alerta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData: Omit<SystemAlert, "id" | "createdAt" | "createdBy">) => {
      const res = await apiRequest("POST", "/api/alerts", alertData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alerta criado",
        description: "O alerta foi criado com sucesso",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar alerta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Função para mapear a prioridade do alerta para o tipo de alerta no componente
  const mapPriorityToType = (
    priority: SystemAlert["priority"]
  ): "warning" | "error" | "info" | "success" => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "info";
    }
  };

  // Função para formatar a data para exibição
  const formatAlertDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Converter alertas do sistema para o formato do componente AlertsCard
  const alertsForCard = alerts.map((alert: SystemAlert) => ({
    id: alert.id,
    title: `Alerta do módulo ${alert.module}`,
    message: alert.message,
    type: mapPriorityToType(alert.priority),
    date: formatAlertDate(alert.createdAt),
    isRead: alert.status !== "active",
  }));

  const activeAlertsForCard = activeAlerts.map((alert: SystemAlert) => ({
    id: alert.id,
    title: `Alerta do módulo ${alert.module}`,
    message: alert.message,
    type: mapPriorityToType(alert.priority),
    date: formatAlertDate(alert.createdAt),
    isRead: false,
  }));

  return {
    alerts,
    alertsForCard,
    activeAlerts,
    activeAlertsForCard,
    isLoading,
    isLoadingActive,
    error,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    resolveAlert: resolveAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    createAlert: createAlertMutation.mutate,
  };
}