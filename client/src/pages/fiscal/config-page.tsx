import React, { useState, useEffect } from 'react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

// Esquema para validação do formulário de configuração fiscal
const configFormSchema = z.object({
  ambiente: z.enum(['1', '2']).default('2'),
  uf: z.string().length(2),
  cUF: z.string().length(2),
  certificadoId: z.number().optional(),
  empresa: z.record(z.string(), z.any()).optional(),
  webserviceUF: z.string().length(2).optional(),
  contingencia: z.boolean().default(false),
  justificativaContingencia: z.string().optional(),
  serieNFe: z.number().min(1).default(1),
  serieNFCe: z.number().min(1).default(1),
});

// Esquema para certificado digital
const certificateFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  serialNumber: z.string().min(1, "Número de série é obrigatório"),
  validFrom: z.string().min(1, "Data de validade inicial é obrigatória"),
  validUntil: z.string().min(1, "Data de validade final é obrigatória"),
  password: z.string().min(1, "Senha do certificado é obrigatória"),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;
type CertificateFormValues = z.infer<typeof certificateFormSchema>;

export default function FiscalConfigPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("config");
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null);

  // Carregar configuração fiscal
  const { data: fiscalConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/fiscal/config'],
    retry: false,
  });

  // Carregar certificados digitais
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['/api/fiscal/certificates'],
  });

  // Formulário de configuração fiscal
  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      ambiente: '2',
      uf: 'MG',
      cUF: '31',
      contingencia: false,
      serieNFe: 1,
      serieNFCe: 1,
    },
  });

  // Formulário de certificado digital
  const certificateForm = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      name: '',
      serialNumber: '',
      validFrom: '',
      validUntil: '',
      password: '',
    },
  });

  // Atualizar formulário quando a configuração for carregada
  useEffect(() => {
    if (fiscalConfig) {
      configForm.reset({
        ambiente: fiscalConfig.ambiente || '2',
        uf: fiscalConfig.uf || 'MG',
        cUF: fiscalConfig.cUF || '31',
        certificadoId: fiscalConfig.certificadoId,
        empresa: fiscalConfig.empresa || {},
        webserviceUF: fiscalConfig.webserviceUF || 'MG',
        contingencia: fiscalConfig.contingencia || false,
        justificativaContingencia: fiscalConfig.justificativaContingencia || '',
        serieNFe: fiscalConfig.serieNFe || 1,
        serieNFCe: fiscalConfig.serieNFCe || 1,
      });
      
      if (fiscalConfig.certificadoId) {
        setSelectedCertificateId(fiscalConfig.certificadoId);
      }
    }
  }, [fiscalConfig]);

  // Mutação para salvar configuração fiscal
  const saveConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormValues) => {
      // Se já existe configuração, atualiza
      if (fiscalConfig?.id) {
        const response = await apiRequest('PUT', `/api/fiscal/config/${fiscalConfig.id}`, data);
        return response.json();
      } else {
        // Senão, cria nova configuração
        const response = await apiRequest('POST', '/api/fiscal/config', data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: 'Configuração fiscal salva com sucesso',
        description: 'As configurações foram atualizadas.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/config'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message || 'Ocorreu um erro ao salvar as configurações fiscais.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para salvar certificado digital
  const saveCertificateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/fiscal/certificates', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Certificado digital salvo com sucesso',
        description: 'O certificado foi adicionado ao sistema.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/certificates'] });
      certificateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar certificado',
        description: error.message || 'Ocorreu um erro ao salvar o certificado digital.',
        variant: 'destructive',
      });
    },
  });

  // Handler para salvar configuração
  const handleSaveConfig = (values: ConfigFormValues) => {
    saveConfigMutation.mutate(values);
  };

  // Handler para upload de certificado
  const handleUploadCertificate = (values: CertificateFormValues) => {
    const certificateFile = document.getElementById('certificate-file') as HTMLInputElement;
    if (!certificateFile.files || certificateFile.files.length === 0) {
      toast({
        title: 'Arquivo não selecionado',
        description: 'Por favor, selecione o arquivo do certificado digital (PFX).',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('certificate', certificateFile.files[0]);
    formData.append('name', values.name);
    formData.append('serialNumber', values.serialNumber);
    formData.append('validFrom', values.validFrom);
    formData.append('validUntil', values.validUntil);
    formData.append('password', values.password);

    saveCertificateMutation.mutate(formData);
  };

  // Teste de conexão com a SEFAZ
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/fiscal/status-servico');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Teste de conexão concluído',
        description: `Status do serviço: ${data.status || 'OK'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao testar conexão',
        description: error.message || 'Ocorreu um erro ao testar a conexão com a SEFAZ.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações Fiscais</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="certificates">Certificados Digitais</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Fiscal</CardTitle>
              <CardDescription>
                Configure os parâmetros para emissão de documentos fiscais eletrônicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingConfig ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Form {...configForm}>
                  <form onSubmit={configForm.handleSubmit(handleSaveConfig)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={configForm.control}
                        name="ambiente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ambiente</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o ambiente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Produção</SelectItem>
                                <SelectItem value="2">Homologação (Testes)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Ambiente onde os documentos fiscais serão emitidos.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="certificadoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificado Digital</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o certificado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {certificates?.map((cert: any) => (
                                  <SelectItem key={cert.id} value={cert.id.toString()}>
                                    {cert.name} (Válido até: {new Date(cert.validUntil).toLocaleDateString()})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Certificado digital a ser utilizado para assinatura dos documentos.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={configForm.control}
                        name="uf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF Emissor</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a UF" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                {/* Adicionar outros estados conforme necessário */}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="cUF"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código UF</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Código IBGE da UF
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="webserviceUF"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF do Webservice</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a UF" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="AN">Ambiente Nacional</SelectItem>
                                {/* Adicionar outros estados conforme necessário */}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              UF do serviço a ser utilizado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={configForm.control}
                        name="serieNFe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Série NF-e</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription>
                              Série da NF-e a ser utilizada
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="serieNFCe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Série NFC-e</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription>
                              Série da NFC-e a ser utilizada
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button type="submit" className="mr-2" disabled={saveConfigMutation.isPending}>
                        {saveConfigMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Configuração
                      </Button>
                      <Button type="button" variant="outline" onClick={() => testConnectionMutation.mutate()} disabled={testConnectionMutation.isPending}>
                        {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Testar Conexão com SEFAZ
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificados Cadastrados</CardTitle>
                <CardDescription>
                  Certificados digitais disponíveis no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCertificates ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : certificates && certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert: any) => (
                      <Card key={cert.id} className={`border ${selectedCertificateId === cert.id ? 'border-primary' : ''}`}>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{cert.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">Número de Série: {cert.serialNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Validade: {new Date(cert.validFrom).toLocaleDateString()} a {new Date(cert.validUntil).toLocaleDateString()}
                          </p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCertificateId(cert.id);
                              configForm.setValue('certificadoId', cert.id);
                              setActiveTab('config');
                            }}
                          >
                            Usar este certificado
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhum certificado cadastrado.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adicionar Certificado</CardTitle>
                <CardDescription>
                  Adicione um novo certificado digital A1 (arquivo PFX).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...certificateForm}>
                  <form onSubmit={certificateForm.handleSubmit(handleUploadCertificate)} className="space-y-4">
                    <FormField
                      control={certificateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Certificado</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Certificado Empresa XYZ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel htmlFor="certificate-file">Arquivo do Certificado (PFX)</FormLabel>
                        <Input id="certificate-file" type="file" accept=".pfx,.p12" />
                        <FormDescription>
                          Selecione o arquivo do certificado digital no formato PFX.
                        </FormDescription>
                      </FormItem>
                    </div>

                    <FormField
                      control={certificateForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha do Certificado</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={certificateForm.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Série</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={certificateForm.control}
                        name="validFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={certificateForm.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Validade</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={saveCertificateMutation.isPending}>
                        {saveCertificateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar Certificado
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}