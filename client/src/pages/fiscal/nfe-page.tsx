import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle2, 
  FileDown, 
  FileText, 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  Send, 
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NFePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("todas");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedNFeId, setSelectedNFeId] = useState<number | null>(null);
  const [justificativa, setJustificativa] = useState('');

  // Carregar listagem de NFes
  const { data: nfeList, isLoading: isLoadingNFes } = useQuery({
    queryKey: ['/api/fiscal/nfe'],
  });

  // Mutação para enviar NFe para SEFAZ
  const sendNFeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/fiscal/enviar-nfe/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'NF-e enviada com sucesso',
        description: 'A nota fiscal foi enviada para processamento.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfe'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar NF-e',
        description: error.message || 'Ocorreu um erro ao enviar a nota fiscal.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para cancelar NFe
  const cancelNFeMutation = useMutation({
    mutationFn: async ({ id, justificativa }: { id: number; justificativa: string }) => {
      const response = await apiRequest('POST', `/api/fiscal/cancelar-nfe/${id}`, { justificativa });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'NF-e cancelada com sucesso',
        description: 'A nota fiscal foi cancelada.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfe'] });
      setCancelDialog(false);
      setJustificativa('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar NF-e',
        description: error.message || 'Ocorreu um erro ao cancelar a nota fiscal.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para gerar DANFE
  const generateDANFEMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('GET', `/api/fiscal/gerar-danfe/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      // Abrir DANFE em nova aba ou download
      if (data.danfePath) {
        window.open(`/upload/${data.danfePath}`, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar DANFE',
        description: error.message || 'Ocorreu um erro ao gerar o DANFE.',
        variant: 'destructive',
      });
    },
  });

  // Filtrar NFEs com base na aba ativa
  const filteredNFes = nfeList ? nfeList.filter((nfe: any) => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'autorizadas') return nfe.status === 'autorizada';
    if (activeTab === 'pendentes') return nfe.status === 'em_digitacao' || nfe.status === 'enviada';
    if (activeTab === 'rejeitadas') return nfe.status === 'rejeitada';
    if (activeTab === 'canceladas') return nfe.status === 'cancelada';
    return true;
  }) : [];

  // Obter a cor e ícone do status para o Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return { color: 'success', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> };
      case 'em_digitacao':
        return { color: 'default', icon: <FileText className="h-3 w-3 mr-1" /> };
      case 'enviada':
        return { color: 'yellow', icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> };
      case 'rejeitada':
        return { color: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> };
      case 'cancelada':
        return { color: 'slate', icon: <X className="h-3 w-3 mr-1" /> };
      default:
        return { color: 'default', icon: <FileText className="h-3 w-3 mr-1" /> };
    }
  };

  // Traduzir status para português
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'autorizada': 'Autorizada',
      'em_digitacao': 'Em Digitação',
      'enviada': 'Enviada',
      'rejeitada': 'Rejeitada',
      'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
  };

  // Handler para iniciar cancelamento de NFe
  const handleCancelNFe = () => {
    if (!selectedNFeId || justificativa.length < 15) {
      toast({
        title: 'Justificativa inválida',
        description: 'A justificativa deve ter no mínimo 15 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    cancelNFeMutation.mutate({ id: selectedNFeId, justificativa });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notas Fiscais Eletrônicas</h1>
        <Button onClick={() => window.location.href = '/fiscal/nfe/nova'}>
          <Plus className="h-4 w-4 mr-2" /> Nova NF-e
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="autorizadas">Autorizadas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="rejeitadas">Rejeitadas</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              {isLoadingNFes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNFes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNFes.map((nfe: any) => {
                      const statusBadge = getStatusBadge(nfe.status);
                      const destinatario = typeof nfe.destinatario === 'string' 
                        ? JSON.parse(nfe.destinatario) 
                        : nfe.destinatario;

                      return (
                        <TableRow key={nfe.id}>
                          <TableCell>{nfe.numeroNota}</TableCell>
                          <TableCell>{nfe.serie}</TableCell>
                          <TableCell>{new Date(nfe.dataEmissao).toLocaleDateString()}</TableCell>
                          <TableCell>{destinatario?.xNome || destinatario?.name || '-'}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(nfe.valorTotal)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.color as any} className="flex items-center w-fit">
                              {statusBadge.icon} {translateStatus(nfe.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.location.href = `/fiscal/nfe/${nfe.id}`}>
                                  <FileText className="h-4 w-4 mr-2" /> Visualizar
                                </DropdownMenuItem>
                                
                                {nfe.status === 'em_digitacao' && (
                                  <DropdownMenuItem onClick={() => sendNFeMutation.mutate(nfe.id)}>
                                    <Send className="h-4 w-4 mr-2" /> Enviar para SEFAZ
                                  </DropdownMenuItem>
                                )}
                                
                                {nfe.status === 'autorizada' && (
                                  <>
                                    <DropdownMenuItem onClick={() => generateDANFEMutation.mutate(nfe.id)}>
                                      <FileDown className="h-4 w-4 mr-2" /> Gerar DANFE
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedNFeId(nfe.id);
                                      setCancelDialog(true);
                                    }}>
                                      <X className="h-4 w-4 mr-2" /> Cancelar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Nenhuma NF-e encontrada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Cancelamento */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento da NF-e. Esta informação será enviada para a SEFAZ.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa (mínimo 15 caracteres)</Label>
              <Input
                id="justificativa"
                placeholder="Informe o motivo do cancelamento"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {justificativa.length} / 255 caracteres
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>Cancelar</Button>
            <Button onClick={handleCancelNFe} disabled={justificativa.length < 15 || cancelNFeMutation.isPending}>
              {cancelNFeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}