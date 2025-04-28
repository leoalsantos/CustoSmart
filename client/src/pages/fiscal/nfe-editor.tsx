import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  FileDown, 
  Loader2, 
  Plus, 
  Save, 
  Send, 
  Trash, 
  X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Esquema para validação básica da NFe
const nfeSchema = z.object({
  tipoOperacao: z.string().default("1"), // 0-Entrada, 1-Saída
  tipoDocumento: z.string().default("55"), // 55-NFe, 65-NFCe
  finalidadeEmissao: z.string().default("1"), // 1-Normal, 2-Complementar, etc
  naturezaOperacao: z.string().min(1, "Natureza da operação é obrigatória"),
  serie: z.number().min(1),
  informacoesAdicionais: z.string().optional(),
  destinatarioId: z.number().optional(),
});

// Esquema para validação de item da NFe
const nfeItemSchema = z.object({
  produtoId: z.number().optional(),
  codigoProduto: z.string().min(1, "Código do produto é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  ncm: z.string().min(1, "NCM é obrigatório"),
  cfop: z.string().min(1, "CFOP é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  valorUnitario: z.number().min(0.01, "Valor unitário deve ser maior que zero"),
  valorTotal: z.number().min(0.01, "Valor total deve ser maior que zero"),
  cstICMS: z.string().optional(),
  aliquotaICMS: z.number().default(0),
  valorICMS: z.number().default(0),
});

type NFeFormValues = z.infer<typeof nfeSchema>;
type NFeItemFormValues = z.infer<typeof nfeItemSchema>;

export default function NFeEditorPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState("cabecalho");
  const [items, setItems] = useState<NFeItemFormValues[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Formulário da NFe
  const nfeForm = useForm<NFeFormValues>({
    resolver: zodResolver(nfeSchema),
    defaultValues: {
      tipoOperacao: "1",
      tipoDocumento: "55",
      finalidadeEmissao: "1",
      naturezaOperacao: "VENDA DE MERCADORIA",
      serie: 1,
      informacoesAdicionais: ""
    },
  });

  // Formulário de item da NFe
  const itemForm = useForm<NFeItemFormValues>({
    resolver: zodResolver(nfeItemSchema),
    defaultValues: {
      codigoProduto: "",
      descricao: "",
      ncm: "",
      cfop: "",
      unidade: "UN",
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
      cstICMS: "00",
      aliquotaICMS: 0,
      valorICMS: 0
    },
  });

  // Carregar dados da NFe ao editar
  const { data: nfeData, isLoading: isLoadingNFe } = useQuery({
    queryKey: [`/api/fiscal/nfe/${id}`],
    enabled: isEditing,
  });

  // Carregar lista de clientes e produtos
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  // Carregar NCMs, CFOPs e CSTs
  const { data: ncms } = useQuery({
    queryKey: ['/api/fiscal/ncms'],
  });

  const { data: cfops } = useQuery({
    queryKey: ['/api/fiscal/cfops'],
  });

  const { data: csts } = useQuery({
    queryKey: ['/api/fiscal/csts'],
  });

  // Mutação para salvar NFe
  const saveNFeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const response = await apiRequest('PUT', `/api/fiscal/nfe/${id}`, data);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/fiscal/nfe', data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: isEditing ? 'NF-e atualizada com sucesso' : 'NF-e criada com sucesso',
        description: isEditing ? 'As alterações foram salvas.' : 'A NF-e foi criada com sucesso.',
      });
      setLocation('/fiscal/nfe');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar NF-e',
        description: error.message || 'Ocorreu um erro ao salvar a nota fiscal.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar formulários quando os dados forem carregados (edição)
  useEffect(() => {
    if (nfeData) {
      nfeForm.reset({
        tipoOperacao: nfeData.tipoOperacao || "1",
        tipoDocumento: nfeData.tipoDocumento || "55",
        finalidadeEmissao: nfeData.finalidadeEmissao || "1",
        naturezaOperacao: nfeData.naturezaOperacao,
        serie: nfeData.serie,
        informacoesAdicionais: nfeData.informacoesAdicionais,
        destinatarioId: nfeData.destinatarioId
      });

      if (nfeData.itens && Array.isArray(nfeData.itens)) {
        setItems(nfeData.itens.map((item: any) => ({
          produtoId: item.produtoId,
          codigoProduto: item.codigoProduto,
          descricao: item.descricao,
          ncm: item.ncm,
          cfop: item.cfop,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          cstICMS: item.cstICMS || "00",
          aliquotaICMS: item.aliquotaICMS || 0,
          valorICMS: item.valorICMS || 0
        })));
      }
    }
  }, [nfeData]);

  // Exibir diálogo de item quando um produto for selecionado
  const handleProductSelect = (productId: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      itemForm.setValue('produtoId', product.id);
      itemForm.setValue('codigoProduto', product.code);
      itemForm.setValue('descricao', product.name);
      
      // Se o produto tiver dados fiscais associados
      if (product.fiscalData) {
        itemForm.setValue('ncm', product.fiscalData.ncm || '');
        itemForm.setValue('cfop', product.fiscalData.cfop || '');
        itemForm.setValue('cstICMS', product.fiscalData.cstICMS || '00');
      }
      
      itemForm.setValue('valorUnitario', product.sellingPrice);
      calculateTotal();
    }
  };

  // Calcular valor total do item com base na quantidade e valor unitário
  const calculateTotal = () => {
    const quantidade = itemForm.getValues('quantidade');
    const valorUnitario = itemForm.getValues('valorUnitario');
    const valorTotal = quantidade * valorUnitario;
    itemForm.setValue('valorTotal', valorTotal);
    
    // Calcular ICMS se tiver alíquota
    const aliquotaICMS = itemForm.getValues('aliquotaICMS');
    if (aliquotaICMS > 0) {
      const valorICMS = valorTotal * (aliquotaICMS / 100);
      itemForm.setValue('valorICMS', valorICMS);
    }
  };

  // Manipular mudanças de quantidade e valor unitário
  useEffect(() => {
    const subscription = itemForm.watch((value, { name }) => {
      if (name === 'quantidade' || name === 'valorUnitario' || name === 'aliquotaICMS') {
        calculateTotal();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [itemForm.watch]);

  // Adicionar ou atualizar item na lista
  const handleAddItem = (values: NFeItemFormValues) => {
    if (editingItemIndex !== null) {
      // Atualizar item existente
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = values;
      setItems(updatedItems);
    } else {
      // Adicionar novo item
      setItems([...items, values]);
    }
    
    setItemDialogOpen(false);
    setEditingItemIndex(null);
    itemForm.reset({
      codigoProduto: "",
      descricao: "",
      ncm: "",
      cfop: "",
      unidade: "UN",
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
      cstICMS: "00",
      aliquotaICMS: 0,
      valorICMS: 0
    });
  };

  // Editar item existente
  const handleEditItem = (index: number) => {
    const item = items[index];
    itemForm.reset(item);
    setEditingItemIndex(index);
    setItemDialogOpen(true);
  };

  // Remover item da lista
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  // Salvar NF-e completa
  const handleSaveNFe = (values: NFeFormValues) => {
    if (items.length === 0) {
      toast({
        title: 'Itens obrigatórios',
        description: 'Adicione pelo menos um item à nota fiscal.',
        variant: 'destructive',
      });
      return;
    }

    // Calcular valor total da nota
    const valorTotal = items.reduce((sum, item) => sum + item.valorTotal, 0);
    
    const nfeCompleta = {
      ...values,
      status: 'em_digitacao',
      valorTotal,
      // Certifique-se de que valores primitivos são enviados corretamente
      serie: Number(values.serie),
      itens: items
    };
    
    saveNFeMutation.mutate(nfeCompleta);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setLocation('/fiscal/nfe')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Editar NF-e' : 'Nova NF-e'}</h1>
      </div>

      {isEditing && isLoadingNFe ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cabecalho">Cabeçalho</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
          </TabsList>

          <TabsContent value="cabecalho">
            <Card>
              <CardHeader>
                <CardTitle>Dados da NF-e</CardTitle>
                <CardDescription>
                  Preencha os dados básicos da nota fiscal eletrônica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...nfeForm}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <FormField
                          control={nfeForm.control}
                          name="tipoOperacao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Operação</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de operação" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">Entrada</SelectItem>
                                  <SelectItem value="1">Saída</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={nfeForm.control}
                          name="naturezaOperacao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Natureza da Operação</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: VENDA DE MERCADORIA" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={nfeForm.control}
                          name="destinatarioId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destinatário</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o destinatário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customers?.map((customer: any) => (
                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-6">
                        <FormField
                          control={nfeForm.control}
                          name="tipoDocumento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Documento</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de documento" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="55">NF-e (55)</SelectItem>
                                  <SelectItem value="65">NFC-e (65)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={nfeForm.control}
                          name="finalidadeEmissao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Finalidade de Emissão</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a finalidade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Normal</SelectItem>
                                  <SelectItem value="2">Complementar</SelectItem>
                                  <SelectItem value="3">Ajuste</SelectItem>
                                  <SelectItem value="4">Devolução</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={nfeForm.control}
                          name="serie"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Série</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={nfeForm.control}
                      name="informacoesAdicionais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informações Adicionais</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Informações complementares para a NF-e" 
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setLocation('/fiscal/nfe')}>
                  Cancelar
                </Button>
                <Button onClick={() => setActiveTab('itens')}>
                  Próximo: Itens
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="itens">
            <Card>
              <CardHeader>
                <CardTitle>Itens da NF-e</CardTitle>
                <CardDescription>
                  Adicione os produtos e serviços que compõem a nota fiscal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={() => {
                    itemForm.reset();
                    setEditingItemIndex(null);
                    setItemDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>

                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead>CFOP</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Unid</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.codigoProduto}</TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>{item.ncm}</TableCell>
                          <TableCell>{item.cfop}</TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valorUnitario)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(item.valorTotal)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditItem(index)}
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center border rounded-md">
                    <p className="text-muted-foreground">Nenhum item adicionado.</p>
                    <p className="text-muted-foreground text-sm mt-1">Clique em "Adicionar Item" para incluir produtos na nota.</p>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <div className="bg-muted p-4 rounded-md">
                      <p className="mb-1 text-sm font-medium">Total da Nota:</p>
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(items.reduce((sum, item) => sum + item.valorTotal, 0))}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('cabecalho')}>
                  Voltar para Cabeçalho
                </Button>
                <Button onClick={() => handleSaveNFe(nfeForm.getValues())} disabled={saveNFeMutation.isPending}>
                  {saveNFeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Atualizar NF-e' : 'Salvar NF-e'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Diálogo para adicionar/editar item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? 'Editar Item' : 'Adicionar Item'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do item a ser adicionado à nota fiscal.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={itemForm.control}
                    name="produtoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            handleProductSelect(parseInt(value));
                          }} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.code} - {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="codigoProduto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do Produto</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              min="0.01" 
                              step="0.01" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="unidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={itemForm.control}
                    name="ncm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NCM</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o NCM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ncms?.map((ncm: any) => (
                              <SelectItem key={ncm.id} value={ncm.code}>
                                {ncm.code} - {ncm.description.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="cfop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CFOP</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o CFOP" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cfops?.map((cfop: any) => (
                              <SelectItem key={cfop.id} value={cfop.code}>
                                {cfop.code} - {cfop.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="valorUnitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitário</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              min="0.01" 
                              step="0.01" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="valorTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              readOnly 
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="cstICMS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CST ICMS</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o CST" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {csts?.filter((cst: any) => cst.type === 'ICMS').map((cst: any) => (
                                <SelectItem key={cst.id} value={cst.code}>
                                  {cst.code} - {cst.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="aliquotaICMS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alíquota ICMS (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              min="0" 
                              step="0.01" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItemIndex !== null ? 'Atualizar Item' : 'Adicionar Item'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}