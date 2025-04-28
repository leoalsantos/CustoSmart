import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Calendar as CalendarIcon,
  ListFilter,
  Clock,
} from "lucide-react";
import { Link } from "wouter";

// Tipos para o agendamento de manutenção
interface MaintenanceScheduleItem {
  id: number;
  equipmentId: number;
  equipmentName: string;
  type: "preventive" | "corrective" | "calibration";
  status: "scheduled" | "in-progress" | "completed" | "canceled";
  date: string;
  technician: string;
  estimatedDuration: number; // Em minutos
  notes: string;
}

export default function MaintenanceSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedType, setSelectedType] = useState<string>("all");

  // Buscar agendamentos de manutenção
  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: [
      "/api/maintenance/schedule",
      selectedDate?.toISOString(),
      selectedType,
    ],
    queryFn: async () => {
      // Dados simulados
      return [
        {
          id: 1,
          equipmentId: 21,
          equipmentName: "Misturador Industrial M-101",
          type: "preventive" as const,
          status: "scheduled" as const,
          date: "2025-04-16T09:00:00",
          technician: "José Silva",
          estimatedDuration: 120,
          notes: "Manutenção preventiva trimestral conforme plano",
        },
        {
          id: 2,
          equipmentId: 18,
          equipmentName: "Esteira Transportadora E-202",
          type: "corrective" as const,
          status: "in-progress" as const,
          date: "2025-04-15T14:30:00",
          technician: "Paulo Oliveira",
          estimatedDuration: 90,
          notes: "Verificar desgaste anormal no motor",
        },
        {
          id: 3,
          equipmentId: 15,
          equipmentName: "Balança de Precisão BP-303",
          type: "calibration" as const,
          status: "scheduled" as const,
          date: "2025-04-18T10:15:00",
          technician: "Amanda Santos",
          estimatedDuration: 60,
          notes: "Calibração mensal",
        },
        {
          id: 4,
          equipmentId: 23,
          equipmentName: "Compressor Industrial C-404",
          type: "preventive" as const,
          status: "scheduled" as const,
          date: "2025-04-17T08:00:00",
          technician: "Carlos Ferreira",
          estimatedDuration: 180,
          notes: "Limpeza e verificação de válvulas",
        },
        {
          id: 5,
          equipmentId: 30,
          equipmentName: "Agitador Industrial A-505",
          type: "corrective" as const,
          status: "scheduled" as const,
          date: "2025-04-16T13:45:00",
          technician: "Marcos Pereira",
          estimatedDuration: 150,
          notes: "Troca de rolamentos",
        },
      ] as MaintenanceScheduleItem[];
    },
  });

  // Filtrar itens de agendamento com base no tipo selecionado
  const filteredItems = scheduleItems?.filter((item) => {
    return selectedType === "all" || item.type === selectedType;
  });

  // Agrupar itens de agendamento por data
  const groupedByDate = filteredItems?.reduce(
    (acc, item) => {
      const dateKey = new Date(item.date).toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    },
    {} as Record<string, MaintenanceScheduleItem[]>,
  );

  // Função para determinar as datas com manutenção agendada
  const isMaintenanceDateFn = (date: Date) => {
    if (!scheduleItems) return false;

    const dateString = date.toISOString().split("T")[0];
    return Object.keys(groupedByDate || {}).includes(dateString);
  };

  // Funções de ajuda para renderização
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: "preventive" | "corrective" | "calibration") => {
    switch (type) {
      case "preventive":
        return "Preventiva";
      case "corrective":
        return "Corretiva";
      case "calibration":
        return "Calibração";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (
    type: "preventive" | "corrective" | "calibration",
  ) => {
    switch (type) {
      case "preventive":
        return "default";
      case "corrective":
        return "destructive";
      case "calibration":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (
    status: "scheduled" | "in-progress" | "completed" | "canceled",
  ) => {
    switch (status) {
      case "scheduled":
        return "Agendada";
      case "in-progress":
        return "Em Progresso";
      case "completed":
        return "Concluída";
      case "canceled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (
    status: "scheduled" | "in-progress" | "completed" | "canceled",
  ) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "in-progress":
        return "default";
      case "completed":
        return "outline";
      case "canceled":
        return "destructive";
      default:
        return "default";
    }
  };

  // Obter itens para o dia selecionado
  const selectedDateItems = selectedDate
    ? groupedByDate?.[selectedDate.toISOString().split("T")[0]] || []
    : [];

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Agendamento de Manutenção</h1>
          <Button
            onClick={() => (window.location.href = "/maintenance/schedule/new")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="mb-8">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="list">
              <ListFilter className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Filtrar por Tipo</CardTitle>
                  <CardDescription>
                    Selecione o tipo de manutenção para filtrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={selectedType === "all" ? "default" : "outline"}
                      onClick={() => setSelectedType("all")}
                      className="justify-start"
                    >
                      Todos os Tipos
                    </Button>
                    <Button
                      variant={
                        selectedType === "preventive" ? "default" : "outline"
                      }
                      onClick={() => setSelectedType("preventive")}
                      className="justify-start"
                    >
                      Manutenção Preventiva
                    </Button>
                    <Button
                      variant={
                        selectedType === "corrective" ? "default" : "outline"
                      }
                      onClick={() => setSelectedType("corrective")}
                      className="justify-start"
                    >
                      Manutenção Corretiva
                    </Button>
                    <Button
                      variant={
                        selectedType === "calibration" ? "default" : "outline"
                      }
                      onClick={() => setSelectedType("calibration")}
                      className="justify-start"
                    >
                      Calibração
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Calendário de Manutenções</CardTitle>
                  <CardDescription>
                    Selecione uma data para ver as manutenções agendadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      modifiersClassNames={{
                        selected: "bg-primary text-primary-foreground",
                      }}
                      modifiers={{
                        maintenance: (date) => isMaintenanceDateFn(date),
                      }}
                      modifiersStyles={{
                        maintenance: {
                          fontWeight: "bold",
                          textDecoration: "underline",
                        },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Manutenções Agendadas</CardTitle>
                <CardDescription>
                  Todas as manutenções agendadas para os próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedByDate || {}).map(
                      ([dateKey, items]) => (
                        <div key={dateKey} className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            {new Date(dateKey).toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </h3>
                          <Separator />
                          <div className="space-y-4">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                                  <div className="flex flex-col gap-1">
                                    <h4 className="font-medium">
                                      {item.equipmentName}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">
                                        {formatTime(item.date)} -{" "}
                                        {item.estimatedDuration} min
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge
                                      variant={getTypeBadgeVariant(item.type)}
                                    >
                                      {getTypeLabel(item.type)}
                                    </Badge>
                                    <Badge
                                      variant={getStatusBadgeVariant(
                                        item.status,
                                      )}
                                    >
                                      {getStatusLabel(item.status)}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm">{item.notes}</p>
                                <div className="mt-2 text-sm text-muted-foreground">
                                  Técnico: {item.technician}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Manutenções para{" "}
                {selectedDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <CardDescription>
                {selectedDateItems.length > 0
                  ? `${selectedDateItems.length} manutenção(ões) agendada(s)`
                  : "Nenhuma manutenção agendada para esta data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateItems.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                        <div className="flex flex-col gap-1">
                          <h4 className="font-medium">{item.equipmentName}</h4>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(item.date)} - {item.estimatedDuration}{" "}
                              min
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getTypeBadgeVariant(item.type)}>
                            {getTypeLabel(item.type)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm">{item.notes}</p>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Técnico: {item.technician}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/maintenance/schedule/${item.id}/edit`}>
                            Editar
                          </Link>
                        </Button>
                        {item.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Aqui iria uma mutação para atualizar o status
                              alert(
                                `Manutenção ID ${item.id} iniciada com sucesso!`,
                              );
                              // Seria necessário refetch dos dados
                            }}
                          >
                            Iniciar Manutenção
                          </Button>
                        )}
                        {item.status === "in-progress" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Aqui iria uma mutação para atualizar o status
                              alert(
                                `Manutenção ID ${item.id} concluída com sucesso!`,
                              );
                              // Seria necessário refetch dos dados
                            }}
                          >
                            Concluir Manutenção
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma manutenção programada para esta data.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "/maintenance/schedule/new")
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agendar Nova Manutenção
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
