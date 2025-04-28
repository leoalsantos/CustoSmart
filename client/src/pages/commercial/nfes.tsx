import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Download, Eye, Plus, RefreshCw, Send, XCircle } from "lucide-react";

// Tipos para as NFes
type NFe = {
  id: number;
  chave: string;
  numero: number;
  serie: number;
  dataEmissao: string;
  status: string;
  valorTotal: number;
  naturezaOperacao: string;
  destinatarioNome: string;
  destinatarioCNPJ: string;
  createdAt: string;
};

type NFeItem = {
  id: number;
  nfeId: number;
  produtoId: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

type NFeEvento = {
  id: number;
  nfeId: number;
  tipo: string;
  status: string;
  dataEvento: string;
  mensagem: string | null;
};

// Componente para listar NFes
export default function CommercialNFes() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("todas");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Extrair ID da NFe da URL se estivermos na página de detalhes
  const nfeId = location.startsWith('/commercial/nfes/') && !location.includes('/new') 
    ? parseInt(location.split('/').pop() || '0') 
    : null;
  
  // Consulta para carregar a lista de NFes
  const { 
    data: nfes = [], 
    isLoading: isLoadingNFes, 
    refetch: refetchNFes 
  } = useQuery({ 
    queryKey: ['/api/fiscal/nfes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/fiscal/nfes');
      const data = await response.json();
      return data;
    }
  });
  
  // Consulta para obter detalhes de uma NFe específica, se estiver na tela de detalhes
  const { 
    data: nfeDetails, 
    isLoading: isLoadingDetails 
  } = useQuery({ 
    queryKey: ['/api/fiscal/nfes', nfeId],
    queryFn: async () => {
      if (!nfeId) return null;
      const response = await apiRequest('GET', `/api/fiscal/nfes/${nfeId}`);
      return await response.json();
    },
    enabled: !!nfeId
  });
  
  // Consulta para obter os itens da NFe
  const { 
    data: nfeItems = [], 
    isLoading: isLoadingItems 
  } = useQuery({ 
    queryKey: ['/api/fiscal/nfes', nfeId, 'items'],
    queryFn: async () => {
      if (!nfeId) return [];
      const response = await apiRequest('GET', `/api/fiscal/nfes/${nfeId}/items`);
      return await response.json();
    },
    enabled: !!nfeId
  });
  
  // Consulta para obter os eventos da NFe
  const { 
    data: nfeEvents = [], 
    isLoading: isLoadingEvents 
  } = useQuery({ 
    queryKey: ['/api/fiscal/nfes', nfeId, 'events'],
    queryFn: async () => {
      if (!nfeId) return [];
      const response = await apiRequest('GET', `/api/fiscal/nfes/${nfeId}/events`);
      return await response.json();
    },
    enabled: !!nfeId
  });
  
  // Mutação para criar uma nova NFe
  const createNFeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/fiscal/nfes', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "NFe criada com sucesso",
        description: `NFe nº ${data.numero} foi criada.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes'] });
      setShowCreateDialog(false);
      setLocation(`/commercial/nfes/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar NFe",
        description: error.message || "Ocorreu um erro ao criar a NFe",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para enviar a NFe para a SEFAZ (simulação)
  const sendNFeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/fiscal/nfes/${id}/events`, {
        tipo: 'envio',
        status: 'sucesso',
        mensagem: 'Nota fiscal enviada para a SEFAZ com sucesso',
        dataEvento: new Date().toISOString()
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "NFe enviada com sucesso",
        description: "A nota fiscal foi enviada para processamento.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes', nfeId, 'events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes', nfeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar NFe",
        description: error.message || "Ocorreu um erro ao enviar a NFe",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para cancelar a NFe (simulação)
  const cancelNFeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/fiscal/nfes/${id}/events`, {
        tipo: 'cancelamento',
        status: 'sucesso',
        mensagem: 'Nota fiscal cancelada com sucesso',
        dataEvento: new Date().toISOString()
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "NFe cancelada com sucesso",
        description: "A nota fiscal foi cancelada.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes', nfeId, 'events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes', nfeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/nfes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar NFe",
        description: error.message || "Ocorreu um erro ao cancelar a NFe",
        variant: "destructive",
      });
    }
  });
  
  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Filtrar NFes com base na tab ativa
  const filteredNFes = nfes.filter((nfe: NFe) => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'pendentes') return nfe.status === 'pendente';
    if (activeTab === 'enviadas') return nfe.status === 'enviada';
    if (activeTab === 'autorizadas') return nfe.status === 'autorizada';
    if (activeTab === 'canceladas') return nfe.status === 'cancelada';
    return true;
  });
  
  // Componente para o formulário de criação de NFe
  const CreateNFeForm = () => {
    const [formData, setFormData] = useState({
      naturezaOperacao: 'Venda de mercadoria',
      tipoOperacao: 'saida',
      serie: 1,
      modeloDocumento: '55',
      destinatarioNome: '',
      destinatarioCNPJ: '',
      destinatarioIE: '',
      destinatarioEndereco: '',
      valorTotal: 0,
      transportadora: '',
      observacoes: ''
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const nfeData = {
        ...formData,
        dataEmissao: new Date().toISOString(),
        numero: Math.floor(Math.random() * 1000000), // Apenas para simulação
        status: 'pendente'
      };
      
      createNFeMutation.mutate(nfeData);
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="naturezaOperacao">Natureza da Operação</Label>
            <Input
              id="naturezaOperacao"
              name="naturezaOperacao"
              value={formData.naturezaOperacao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipoOperacao">Tipo de Operação</Label>
            <Select 
              value={formData.tipoOperacao} 
              onValueChange={(value) => handleSelectChange('tipoOperacao', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serie">Série</Label>
            <Input
              id="serie"
              name="serie"
              type="number"
              value={formData.serie}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modeloDocumento">Modelo</Label>
            <Select 
              value={formData.modeloDocumento} 
              onValueChange={(value) => handleSelectChange('modeloDocumento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="55">55 - NF-e</SelectItem>
                <SelectItem value="65">65 - NFC-e</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Dados do Destinatário</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destinatarioNome">Nome/Razão Social</Label>
              <Input
                id="destinatarioNome"
                name="destinatarioNome"
                value={formData.destinatarioNome}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destinatarioCNPJ">CNPJ/CPF</Label>
              <Input
                id="destinatarioCNPJ"
                name="destinatarioCNPJ"
                value={formData.destinatarioCNPJ}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destinatarioIE">Inscrição Estadual</Label>
              <Input
                id="destinatarioIE"
                name="destinatarioIE"
                value={formData.destinatarioIE}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destinatarioEndereco">Endereço</Label>
              <Input
                id="destinatarioEndereco"
                name="destinatarioEndereco"
                value={formData.destinatarioEndereco}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="valorTotal">Valor Total</Label>
          <Input
            id="valorTotal"
            name="valorTotal"
            type="number"
            step="0.01"
            value={formData.valorTotal}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="transportadora">Transportadora</Label>
          <Input
            id="transportadora"
            name="transportadora"
            value={formData.transportadora}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateDialog(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={createNFeMutation.isPending}
          >
            {createNFeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar NFe"
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  };
  
  // Renderizar a lista de NFes
  const renderNFeList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notas Fiscais Eletrônicas</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetchNFes()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Nova NFe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Nota Fiscal</DialogTitle>
                <DialogDescription>
                  Preencha os dados para a emissão da Nota Fiscal Eletrônica.
                </DialogDescription>
              </DialogHeader>
              <CreateNFeForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
          <TabsTrigger value="autorizadas">Autorizadas</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {isLoadingNFes ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredNFes.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-lg text-gray-500">Nenhuma nota fiscal encontrada.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNFes.map((nfe: NFe) => (
                      <TableRow key={nfe.id}>
                        <TableCell>{nfe.numero}</TableCell>
                        <TableCell>{formatDate(nfe.dataEmissao)}</TableCell>
                        <TableCell>{nfe.destinatarioNome}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(nfe.valorTotal)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={nfe.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/commercial/nfes/${nfe.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  
  // Renderiza a tela de detalhes de uma NFe
  const renderNFeDetails = () => {
    if (isLoadingDetails) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!nfeDetails) {
      return (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">Nota fiscal não encontrada</h2>
          <p className="mt-2 text-gray-500">A nota fiscal que você está procurando não existe ou foi removida.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation('/commercial/nfes')}
          >
            Voltar para a listagem
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/commercial/nfes')}
            >
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">
              NFe {nfeDetails.numero} - {nfeDetails.serie}
            </h1>
            <StatusBadge status={nfeDetails.status} />
          </div>
          
          <div className="flex items-center gap-2">
            {(nfeDetails.status === 'pendente' || nfeDetails.status === 'rejeitada') && (
              <Button
                onClick={() => sendNFeMutation.mutate(nfeDetails.id)}
                disabled={sendNFeMutation.isPending}
              >
                {sendNFeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Enviar para SEFAZ
              </Button>
            )}
            
            {(nfeDetails.status === 'autorizada' || nfeDetails.status === 'enviada') && (
              <Button
                variant="destructive"
                onClick={() => cancelNFeMutation.mutate(nfeDetails.id)}
                disabled={cancelNFeMutation.isPending}
              >
                {cancelNFeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Cancelar NFe
              </Button>
            )}
            
            {(nfeDetails.status === 'autorizada') && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Download DANFE
              </Button>
            )}
            
            {(nfeDetails.status === 'autorizada') && (
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-1" />
                XML
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da NFe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Chave de Acesso</p>
                  <p className="text-sm break-all">{nfeDetails.chave || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Modelo</p>
                  <p className="text-sm">{nfeDetails.modeloDocumento || "55"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Natureza da Operação</p>
                  <p className="text-sm">{nfeDetails.naturezaOperacao}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de Operação</p>
                  <p className="text-sm">{nfeDetails.tipoOperacao === 'saida' ? 'Saída' : 'Entrada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Emissão</p>
                  <p className="text-sm">{formatDate(nfeDetails.dataEmissao)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-sm">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(nfeDetails.valorTotal || 0)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Destinatário</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium">{nfeDetails.destinatarioNome}</p>
                  <p className="text-sm">CNPJ/CPF: {nfeDetails.destinatarioCNPJ}</p>
                  <p className="text-sm">IE: {nfeDetails.destinatarioIE || "Isento"}</p>
                  <p className="text-sm">Endereço: {nfeDetails.destinatarioEndereco || "N/A"}</p>
                </div>
              </div>
              
              {nfeDetails.observacoes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Observações</p>
                  <p className="text-sm">{nfeDetails.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos</CardTitle>
                <CardDescription>Histórico de eventos da NFe</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : nfeEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum evento registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {nfeEvents.map((event: NFeEvento) => (
                      <div key={event.id} className="border-l-2 border-primary pl-3 py-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium">
                            {event.tipo === 'envio' ? 'Envio para SEFAZ' : 
                             event.tipo === 'retorno' ? 'Retorno SEFAZ' : 
                             event.tipo === 'cancelamento' ? 'Cancelamento' : event.tipo}
                          </p>
                          <Badge 
                            variant={event.status === 'sucesso' ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.dataEvento)}
                        </p>
                        {event.mensagem && (
                          <p className="text-sm mt-1">{event.mensagem}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Itens da NFe</CardTitle>
                <CardDescription>Produtos incluídos nesta nota fiscal</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingItems ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : nfeItems.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">Nenhum item registrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfeItems.map((item: NFeItem) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.codigo}</TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>{item.quantidade} {item.unidade}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valorUnitario)}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valorTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar diferentes visualizações com base na URL
  const renderContent = () => {
    if (location === '/commercial/nfes') {
      return renderNFeList();
    } else if (location === '/commercial/nfes/new') {
      // A página de criação agora é tratada por dialog
      setLocation('/commercial/nfes');
      setShowCreateDialog(true);
      return renderNFeList();
    } else if (location.startsWith('/commercial/nfes/') && nfeId) {
      return renderNFeDetails();
    }
    
    return renderNFeList();
  };
  
  return (
    <div className="container p-6">
      {renderContent()}
    </div>
  );
}

// Componente para renderizar os badges de status
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline">Pendente</Badge>;
    case 'enviada':
      return <Badge variant="secondary">Enviada</Badge>;
    case 'processando':
      return <Badge variant="secondary">Processando</Badge>;
    case 'autorizada':
      return <Badge variant="default">Autorizada</Badge>;
    case 'cancelada':
      return <Badge variant="destructive">Cancelada</Badge>;
    case 'rejeitada':
      return <Badge variant="destructive">Rejeitada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};