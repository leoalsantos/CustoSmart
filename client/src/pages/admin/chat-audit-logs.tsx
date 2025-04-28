import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  Check,
  Download,
  Filter,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WaitingPermissions from "@/pages/waiting-permissions";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";

// Tipo para os logs de auditoria de chat
type ChatAuditLog = {
  id: number;
  timestamp: string;
  user: string;
  userId: number;
  action: string;
  roomId: number;
  messageId: number | null;
  originalContent: string | null;
  newContent: string | null;
};

// Schema de filtro de auditoria
const filterSchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  roomId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

const ChatAuditLogs = () => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Verifica se o usuário tem permissão de admin
  const hasAdminAccess = hasPermission("admin");

  // Formulário de filtro
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      action: "",
      userId: "",
      roomId: "",
    },
  });

  // Recupera os valores do filtro
  const filterValues = form.watch();

  // Consulta para obter os logs de auditoria de chat
  const {
    data: auditLogsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "/api/chat-audit-logs",
      currentPage,
      pageSize,
      filterValues
    ],
    enabled: hasAdminAccess,
  });

  // Se o usuário não tiver permissão, mostra mensagem de aguardando permissões
  if (!hasAdminAccess) {
    return <WaitingPermissions />;
  }

  // Colunas da tabela de logs
  const columns = [
    {
      accessorKey: "timestamp",
      header: "Data/Hora",
      cell: ({ row }: { row: any }) => {
        const timestamp = row.original.timestamp;
        return (
          <div className="flex items-center">
            <span>
              {timestamp
                ? format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss", {
                    locale: ptBR,
                  })
                : "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Usuário",
    },
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }: { row: any }) => {
        const action = row.original.action;
        
        const actionStyles = {
          send: "bg-green-100 text-green-800",
          edit: "bg-blue-100 text-blue-800",
          delete: "bg-red-100 text-red-800",
        };
        
        const style = actionStyles[action as keyof typeof actionStyles] || "bg-gray-100 text-gray-800";
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
            {action === "send" && "Envio"}
            {action === "edit" && "Edição"}
            {action === "delete" && "Exclusão"}
            {!["send", "edit", "delete"].includes(action) && action}
          </span>
        );
      },
    },
    {
      accessorKey: "roomId",
      header: "Sala",
    },
    {
      accessorKey: "messageId",
      header: "Mensagem ID",
    },
  ];

  // Ação para visualizar detalhes do log
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const log = row.original;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <Search className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Detalhes do Log</h4>
              <div className="text-sm">
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">ID:</span>
                  <span className="col-span-2">{log.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">Data/Hora:</span>
                  <span className="col-span-2">{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">Usuário:</span>
                  <span className="col-span-2">{log.user} (ID: {log.userId})</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">Ação:</span>
                  <span className="col-span-2">{log.action}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">Sala ID:</span>
                  <span className="col-span-2">{log.roomId}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-semibold">Mensagem ID:</span>
                  <span className="col-span-2">{log.messageId || 'N/A'}</span>
                </div>
                
                {log.originalContent && (
                  <div className="mt-2">
                    <span className="font-semibold">Conteúdo Original:</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-24">
                      {log.originalContent}
                    </div>
                  </div>
                )}
                
                {log.newContent && (
                  <div className="mt-2">
                    <span className="font-semibold">Novo Conteúdo:</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-24">
                      {log.newContent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  };

  // Função para exportar logs
  const exportLogs = () => {
    if (!auditLogsData?.logs) return;

    const logs = auditLogsData.logs;
    const csvContent = [
      ["ID", "Data/Hora", "Usuário", "ID do Usuário", "Ação", "Sala ID", "Mensagem ID", "Conteúdo Original", "Novo Conteúdo"].join(","),
      ...logs.map(log => [
        log.id,
        format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss"),
        log.user,
        log.userId,
        log.action,
        log.roomId,
        log.messageId || "",
        `"${log.originalContent?.replace(/"/g, '""') || ""}"`,
        `"${log.newContent?.replace(/"/g, '""') || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `logs_chat_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para aplicar filtros
  const applyFilters = (values: FilterValues) => {
    setCurrentPage(1);
    refetch();
  };

  return (
    <>
      <PageTitle
        title="Logs de Auditoria de Chat"
        subtitle="Monitore as mensagens enviadas, editadas e excluídas"
        icon={<MessageCircle className="h-6 w-6" />}
      />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre os logs por período, usuário, sala ou tipo de operação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(applyFilters)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as ações" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todas as ações</SelectItem>
                            <SelectItem value="send">Envio</SelectItem>
                            <SelectItem value="edit">Edição</SelectItem>
                            <SelectItem value="delete">Exclusão</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Usuário</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ID do usuário"
                            {...field}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID da Sala</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ID da sala"
                            {...field}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Inicial</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                if (
                                  date &&
                                  form.getValues("endDate") &&
                                  date > form.getValues("endDate")!
                                ) {
                                  form.setValue("endDate", date);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Final</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date <
                                (form.getValues("startDate") ||
                                  new Date(2000, 0, 1))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setCurrentPage(1);
                      refetch();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button type="submit">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Logs de Auditoria de Chat</CardTitle>
              <CardDescription>
                {auditLogsData?.pagination?.totalCount
                  ? `Total de ${auditLogsData.pagination.totalCount} logs`
                  : "Carregando..."}
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={auditLogsData?.logs || []}
              actionColumn={actionColumn}
              pagination={{
                currentPage,
                pageSize,
                totalPages: auditLogsData?.pagination?.totalPages || 1,
                totalCount: auditLogsData?.pagination?.totalCount || 0,
                onPageChange: setCurrentPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ChatAuditLogs;