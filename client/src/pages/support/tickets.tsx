import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ui/export-button";
import { useAuth } from "@/hooks/use-auth";

// Esquema para criação de tickets
const ticketSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  priority: z.string().min(1, "Selecione uma prioridade"),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function SupportTickets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "médio",
    },
  });

  // Obter tickets
  const {
    data: tickets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/support/tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Falha ao carregar tickets");
      return await res.json();
    },
  });

  // Mutação para criar ticket
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      return await apiRequest("POST", "/api/support/tickets", data);
    },
    onSuccess: () => {
      toast({
        title: "Ticket criado com sucesso",
        description: "Seu ticket foi registrado e será analisado em breve",
      });
      setIsNewTicketOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message || "Ocorreu um erro ao registrar o ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TicketFormValues) => {
    createTicketMutation.mutate(data);
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = searchQuery === "" || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Obter cores para status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "em_andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "resolvido":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "fechado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obter cores para prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "baixo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "médio":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "alto":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "crítico":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Mapear status para texto legível
  const mapStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      aberto: "Aberto",
      em_andamento: "Em Andamento",
      resolvido: "Resolvido",
      fechado: "Fechado"
    };
    return statusMap[status] || status;
  };

  // Mapear prioridade para texto legível
  const mapPriority = (priority: string) => {
    const priorityMap: Record<string, string> = {
      baixo: "Baixa",
      médio: "Média",
      alto: "Alta",
      crítico: "Crítica"
    };
    return priorityMap[priority] || priority;
  };

  // Colunas para a tabela de tickets
  const columns = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "title",
      header: "Título",
    },
    {
      accessorKey: "category",
      header: "Categoria",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge className={getStatusColor(row.original.status)}>
          {mapStatus(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }: any) => (
        <Badge className={getPriorityColor(row.original.priority)}>
          {mapPriority(row.original.priority)}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Data de Criação",
      cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedTicket(row.original.id)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tickets de Suporte</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Novo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket de Suporte</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título do ticket" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="técnico">Técnico</SelectItem>
                              <SelectItem value="financeiro">Financeiro</SelectItem>
                              <SelectItem value="administrativo">Administrativo</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="baixo">Baixa</SelectItem>
                              <SelectItem value="médio">Média</SelectItem>
                              <SelectItem value="alto">Alta</SelectItem>
                              <SelectItem value="crítico">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva detalhadamente o problema..." 
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsNewTicketOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createTicketMutation.isPending}>
                        {createTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Ticket
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets de Suporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Pesquisar tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter">Status:</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter" className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton
                  data={filteredTickets}
                  filename="tickets-suporte"
                  fields={[
                    { label: 'ID', key: 'id' },
                    { label: 'Título', key: 'title' },
                    { label: 'Categoria', key: 'category' },
                    { label: 'Status', key: 'status', formatter: mapStatus },
                    { label: 'Prioridade', key: 'priority', formatter: mapPriority },
                    { label: 'Data de Criação', key: 'createdAt', formatter: (v: string) => new Date(v).toLocaleDateString() },
                    { label: 'Descrição', key: 'description' }
                  ]}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={filteredTickets} 
                searchField="title"
              />
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Ticket */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {tickets.find((t: any) => t.id === selectedTicket) ? (
                  <TicketDetails 
                    ticket={tickets.find((t: any) => t.id === selectedTicket)} 
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
                      setSelectedTicket(null);
                    }}
                  />
                ) : (
                  <div className="py-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2">Carregando detalhes do ticket...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
}

function TicketDetails({ 
  ticket, 
  onClose,
  onUpdate
}: { 
  ticket: any, 
  onClose: () => void,
  onUpdate: () => void
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [response, setResponse] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => {
    if (user?.permissions && typeof user.permissions === 'object') {
      return user.permissions.admin === true;
    }
    return false;
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async (data: { resolution: string, status: string }) => {
      return await apiRequest("PATCH", `/api/support/tickets/${ticket.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Ticket atualizado",
        description: "O ticket foi atualizado com sucesso",
      });
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar ticket",
        description: error.message || "Ocorreu um erro ao atualizar o ticket",
        variant: "destructive",
      });
    },
  });

  const handleResolve = () => {
    if (!response.trim()) {
      toast({
        title: "Resposta necessária",
        description: "Por favor, forneça uma resposta ou resolução para o ticket",
        variant: "destructive",
      });
      return;
    }

    resolveTicketMutation.mutate({
      resolution: response,
      status: "resolvido"
    });
  };

  const handleInProgress = () => {
    resolveTicketMutation.mutate({
      resolution: response || "Ticket em análise.",
      status: "em_andamento"
    });
  };

  const handleClose = () => {
    if (!response.trim()) {
      toast({
        title: "Resposta necessária",
        description: "Por favor, forneça uma explicação para o fechamento do ticket",
        variant: "destructive",
      });
      return;
    }

    resolveTicketMutation.mutate({
      resolution: response,
      status: "fechado"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "em_andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "resolvido":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "fechado":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "baixo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "médio":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "alto":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "crítico":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Mapear status para texto legível
  const mapStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      aberto: "Aberto",
      em_andamento: "Em Andamento",
      resolvido: "Resolvido",
      fechado: "Fechado"
    };
    return statusMap[status] || status;
  };

  // Mapear prioridade para texto legível
  const mapPriority = (priority: string) => {
    const priorityMap: Record<string, string> = {
      baixo: "Baixa",
      médio: "Média",
      alto: "Alta",
      crítico: "Crítica"
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Título</p>
          <p className="text-lg">{ticket.title}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Categoria</p>
          <p>{ticket.category}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge className={getStatusColor(ticket.status)}>
            {mapStatus(ticket.status)}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium">Prioridade</p>
          <Badge className={getPriorityColor(ticket.priority)}>
            {mapPriority(ticket.priority)}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium">Criado em</p>
          <p>{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Criado por</p>
          <p>{ticket.userName || 'Usuário não identificado'}</p>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium">Descrição</p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mt-1 whitespace-pre-wrap">
          {ticket.description}
        </div>
      </div>

      {ticket.resolution && (
        <div>
          <p className="text-sm font-medium">Resolução</p>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mt-1 whitespace-pre-wrap">
            {ticket.resolution}
          </div>
        </div>
      )}

      {(isAdmin || user?.permissions?.suporte === true) && ticket.status !== "fechado" && (
        <div>
          <p className="text-sm font-medium">Resposta</p>
          <Textarea 
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Digite sua resposta ou solução para o ticket..."
            className="mt-1 min-h-[100px]"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
        
        {(isAdmin || user?.permissions?.suporte === true) && ticket.status !== "fechado" && (
          <>
            {ticket.status === "aberto" && (
              <Button
                variant="secondary"
                onClick={handleInProgress}
                disabled={resolveTicketMutation.isPending}
              >
                {resolveTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Em Andamento
              </Button>
            )}
            
            {ticket.status !== "resolvido" && ticket.status !== "fechado" && (
              <Button
                onClick={handleResolve}
                disabled={resolveTicketMutation.isPending}
              >
                {resolveTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resolver
              </Button>
            )}
            
            {ticket.status === "resolvido" && (
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={resolveTicketMutation.isPending}
              >
                {resolveTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fechar Ticket
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}