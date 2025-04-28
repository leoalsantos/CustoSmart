import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Save, Plus, Trash2, Edit, FileCheck, Info } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";

// Tipos para as configurações fiscais
type FiscalConfig = {
  id: number;
  ambiente: string;
  serieNFe: number;
  proximoNumeroNFe: number;
  regimeTributario: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cnae: string;
  certificadoId: number;
  ufEmissor: string;
  createdAt: string;
  updatedAt: string;
};

type FiscalCertificate = {
  id: number;
  name: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
};

type NCM = {
  id: number;
  code: string;
  description: string;
  aliquotaNacional: number | null;
  aliquotaImportado: number | null;
  createdAt: string;
};

type CFOP = {
  id: number;
  code: string;
  description: string;
  createdAt: string;
};

type CST = {
  id: number;
  code: string;
  description: string;
  tipo: string;
  createdAt: string;
};

// Validação para o formulário de configuração fiscal
const fiscalConfigSchema = z.object({
  ambiente: z.string().min(1, { message: "Selecione o ambiente" }),
  serieNFe: z.coerce.number().positive({ message: "A série deve ser um número positivo" }),
  proximoNumeroNFe: z.coerce.number().positive({ message: "O número deve ser positivo" }),
  regimeTributario: z.string().min(1, { message: "Selecione o regime tributário" }),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  cnae: z.string().optional(),
  certificadoId: z.coerce.number().optional(),
  ufEmissor: z.string().length(2, { message: "A UF deve ter 2 caracteres" }),
});

// Validação para o formulário de certificados
const certificateSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
  serialNumber: z.string().min(1, { message: "Número de série é obrigatório" }),
  validFrom: z.string().min(1, { message: "Data de validade inicial é obrigatória" }),
  validTo: z.string().min(1, { message: "Data de validade final é obrigatória" }),
  certificateData: z.string().min(1, { message: "Dados do certificado são obrigatórios" }),
  isActive: z.boolean().default(true),
});

// Validação para o formulário de NCM
const ncmSchema = z.object({
  code: z.string().min(4, { message: "Código NCM deve ter pelo menos 4 caracteres" }),
  description: z.string().min(3, { message: "Descrição deve ter pelo menos 3 caracteres" }),
  aliquotaNacional: z.coerce.number().nullable(),
  aliquotaImportado: z.coerce.number().nullable(),
});

// Validação para o formulário de CFOP
const cfopSchema = z.object({
  code: z.string().min(4, { message: "Código CFOP deve ter pelo menos 4 caracteres" }),
  description: z.string().min(3, { message: "Descrição deve ter pelo menos 3 caracteres" }),
});

// Validação para o formulário de CST
const cstSchema = z.object({
  code: z.string().min(2, { message: "Código CST deve ter pelo menos 2 caracteres" }),
  description: z.string().min(3, { message: "Descrição deve ter pelo menos 3 caracteres" }),
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }),
});

// Componente principal para configurações fiscais
export default function CommercialFiscalConfig() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [showNCMDialog, setShowNCMDialog] = useState(false);
  const [showCFOPDialog, setShowCFOPDialog] = useState(false);
  const [showCSTDialog, setShowCSTDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Consulta para carregar configurações fiscais
  const { 
    data: fiscalConfig = {},
    isLoading: isLoadingConfig,
    refetch: refetchConfig
  } = useQuery({ 
    queryKey: ['/api/fiscal/config'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/fiscal/config');
        const data = await response.json();
        return data || {};
      } catch (error) {
        console.error("Erro ao carregar configuração fiscal:", error);
        return {};
      }
    }
  });
  
  // Consulta para carregar certificados
  const { 
    data: certificates = [],
    isLoading: isLoadingCertificates,
    refetch: refetchCertificates
  } = useQuery({ 
    queryKey: ['/api/fiscal/certificates'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/fiscal/certificates');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao carregar certificados:", error);
        return [];
      }
    }
  });
  
  // Consulta para carregar NCMs
  const { 
    data: ncms = [],
    isLoading: isLoadingNCMs,
    refetch: refetchNCMs
  } = useQuery({ 
    queryKey: ['/api/fiscal/ncms'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/fiscal/ncms');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao carregar NCMs:", error);
        return [];
      }
    }
  });
  
  // Consulta para carregar CFOPs
  const { 
    data: cfops = [],
    isLoading: isLoadingCFOPs,
    refetch: refetchCFOPs
  } = useQuery({ 
    queryKey: ['/api/fiscal/cfops'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/fiscal/cfops');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao carregar CFOPs:", error);
        return [];
      }
    }
  });
  
  // Consulta para carregar CSTs
  const { 
    data: csts = [],
    isLoading: isLoadingCSTs,
    refetch: refetchCSTs
  } = useQuery({ 
    queryKey: ['/api/fiscal/csts'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/fiscal/csts');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao carregar CSTs:", error);
        return [];
      }
    }
  });
  
  // Formulário de configuração fiscal
  const defaultValues = {
    ambiente: "2",
    serieNFe: 1,
    proximoNumeroNFe: 1,
    regimeTributario: "1",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    cnae: "",
    certificadoId: undefined,
    ufEmissor: "MG",
  };
  
  const configForm = useForm<z.infer<typeof fiscalConfigSchema>>({
    resolver: zodResolver(fiscalConfigSchema),
    defaultValues
  });
  
  // Atualizar formulário quando os dados forem carregados
  useEffect(() => {
    if (!isLoadingConfig && fiscalConfig && Object.keys(fiscalConfig).length > 0) {
      configForm.reset({
        ambiente: fiscalConfig.ambiente || "2",
        serieNFe: fiscalConfig.serieNFe || 1,
        proximoNumeroNFe: fiscalConfig.proximoNumeroNFe || 1,
        regimeTributario: fiscalConfig.regimeTributario || "1",
        inscricaoEstadual: fiscalConfig.inscricaoEstadual || "",
        inscricaoMunicipal: fiscalConfig.inscricaoMunicipal || "",
        cnae: fiscalConfig.cnae || "",
        certificadoId: fiscalConfig.certificadoId,
        ufEmissor: fiscalConfig.ufEmissor || "MG",
      });
    }
  }, [fiscalConfig, isLoadingConfig]);
  
  // Formulários para certificados, NCMs, CFOPs e CSTs
  const certificateForm = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      name: "",
      password: "",
      serialNumber: "",
      validFrom: "",
      validTo: "",
      certificateData: "",
      isActive: true,
    }
  });
  
  const ncmForm = useForm<z.infer<typeof ncmSchema>>({
    resolver: zodResolver(ncmSchema),
    defaultValues: {
      code: "",
      description: "",
      aliquotaNacional: null,
      aliquotaImportado: null,
    }
  });
  
  const cfopForm = useForm<z.infer<typeof cfopSchema>>({
    resolver: zodResolver(cfopSchema),
    defaultValues: {
      code: "",
      description: "",
    }
  });
  
  const cstForm = useForm<z.infer<typeof cstSchema>>({
    resolver: zodResolver(cstSchema),
    defaultValues: {
      code: "",
      description: "",
      tipo: "",
    }
  });
  
  // Resetar formulários ao fechar diálogos
  const resetDialogs = () => {
    setEditingItem(null);
    certificateForm.reset();
    ncmForm.reset();
    cfopForm.reset();
    cstForm.reset();
  };
  
  // Mutações para salvar configurações fiscais
  const saveConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof fiscalConfigSchema>) => {
      if (fiscalConfig?.id) {
        // Atualizar configuração existente
        const response = await apiRequest('PATCH', `/api/fiscal/config/${fiscalConfig.id}`, data);
        return await response.json();
      } else {
        // Criar nova configuração
        const response = await apiRequest('POST', '/api/fiscal/config', data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações fiscais foram salvas com sucesso.",
      });
      refetchConfig();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro ao salvar as configurações fiscais",
        variant: "destructive",
      });
    }
  });
  
  // Mutações para certificados
  const saveCertificateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof certificateSchema>) => {
      if (editingItem?.id) {
        // Atualizar certificado existente
        const response = await apiRequest('PATCH', `/api/fiscal/certificates/${editingItem.id}`, data);
        return await response.json();
      } else {
        // Criar novo certificado
        const response = await apiRequest('POST', '/api/fiscal/certificates', data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem?.id ? "Certificado atualizado" : "Certificado salvo",
        description: `O certificado foi ${editingItem?.id ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setShowCertificateDialog(false);
      resetDialogs();
      refetchCertificates();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar certificado",
        description: error.message || "Ocorreu um erro ao salvar o certificado",
        variant: "destructive",
      });
    }
  });
  
  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/fiscal/certificates/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Certificado excluído",
        description: "O certificado foi excluído com sucesso.",
      });
      refetchCertificates();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir certificado",
        description: error.message || "Ocorreu um erro ao excluir o certificado",
        variant: "destructive",
      });
    }
  });
  
  // Mutações para NCMs
  const saveNCMMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ncmSchema>) => {
      if (editingItem?.id) {
        // Atualizar NCM existente
        const response = await apiRequest('PATCH', `/api/fiscal/ncms/${editingItem.id}`, data);
        return await response.json();
      } else {
        // Criar novo NCM
        const response = await apiRequest('POST', '/api/fiscal/ncms', data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem?.id ? "NCM atualizado" : "NCM salvo",
        description: `O código NCM foi ${editingItem?.id ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setShowNCMDialog(false);
      resetDialogs();
      refetchNCMs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar NCM",
        description: error.message || "Ocorreu um erro ao salvar o código NCM",
        variant: "destructive",
      });
    }
  });
  
  const deleteNCMMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/fiscal/ncms/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "NCM excluído",
        description: "O código NCM foi excluído com sucesso.",
      });
      refetchNCMs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir NCM",
        description: error.message || "Ocorreu um erro ao excluir o código NCM",
        variant: "destructive",
      });
    }
  });
  
  // Mutações para CFOPs
  const saveCFOPMutation = useMutation({
    mutationFn: async (data: z.infer<typeof cfopSchema>) => {
      if (editingItem?.id) {
        // Atualizar CFOP existente
        const response = await apiRequest('PATCH', `/api/fiscal/cfops/${editingItem.id}`, data);
        return await response.json();
      } else {
        // Criar novo CFOP
        const response = await apiRequest('POST', '/api/fiscal/cfops', data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem?.id ? "CFOP atualizado" : "CFOP salvo",
        description: `O código CFOP foi ${editingItem?.id ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setShowCFOPDialog(false);
      resetDialogs();
      refetchCFOPs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar CFOP",
        description: error.message || "Ocorreu um erro ao salvar o código CFOP",
        variant: "destructive",
      });
    }
  });
  
  const deleteCFOPMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/fiscal/cfops/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "CFOP excluído",
        description: "O código CFOP foi excluído com sucesso.",
      });
      refetchCFOPs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir CFOP",
        description: error.message || "Ocorreu um erro ao excluir o código CFOP",
        variant: "destructive",
      });
    }
  });
  
  // Mutações para CSTs
  const saveCSTMutation = useMutation({
    mutationFn: async (data: z.infer<typeof cstSchema>) => {
      if (editingItem?.id) {
        // Atualizar CST existente
        const response = await apiRequest('PATCH', `/api/fiscal/csts/${editingItem.id}`, data);
        return await response.json();
      } else {
        // Criar novo CST
        const response = await apiRequest('POST', '/api/fiscal/csts', data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem?.id ? "CST atualizado" : "CST salvo",
        description: `O código CST foi ${editingItem?.id ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setShowCSTDialog(false);
      resetDialogs();
      refetchCSTs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar CST",
        description: error.message || "Ocorreu um erro ao salvar o código CST",
        variant: "destructive",
      });
    }
  });
  
  const deleteCSTMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/fiscal/csts/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "CST excluído",
        description: "O código CST foi excluído com sucesso.",
      });
      refetchCSTs();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir CST",
        description: error.message || "Ocorreu um erro ao excluir o código CST",
        variant: "destructive",
      });
    }
  });
  
  // Função para formatar a data
  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return 'Data não disponível';
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return 'Data inválida';
    }
  };
  
  // Handlers para edição
  const handleEditCertificate = (certificate: FiscalCertificate) => {
    setEditingItem(certificate);
    certificateForm.reset({
      name: certificate.name,
      password: "", // Não mostrar senha por segurança
      serialNumber: certificate.serialNumber,
      validFrom: new Date(certificate.validFrom).toISOString().split('T')[0],
      validTo: new Date(certificate.validTo).toISOString().split('T')[0],
      certificateData: "", // Não mostrar dados do certificado por segurança
      isActive: certificate.isActive,
    });
    setShowCertificateDialog(true);
  };
  
  const handleEditNCM = (ncm: NCM) => {
    setEditingItem(ncm);
    ncmForm.reset({
      code: ncm.code,
      description: ncm.description,
      aliquotaNacional: ncm.aliquotaNacional,
      aliquotaImportado: ncm.aliquotaImportado,
    });
    setShowNCMDialog(true);
  };
  
  const handleEditCFOP = (cfop: CFOP) => {
    setEditingItem(cfop);
    cfopForm.reset({
      code: cfop.code,
      description: cfop.description,
    });
    setShowCFOPDialog(true);
  };
  
  const handleEditCST = (cst: CST) => {
    setEditingItem(cst);
    cstForm.reset({
      code: cst.code,
      description: cst.description,
      tipo: cst.tipo,
    });
    setShowCSTDialog(true);
  };
  
  // Handler para o envio do formulário de configuração fiscal
  const onSubmitConfig = (data: z.infer<typeof fiscalConfigSchema>) => {
    saveConfigMutation.mutate(data);
  };
  
  // Componente para o formulário de configuração geral
  const GeneralConfigForm = () => (
    <Form {...configForm}>
      <form onSubmit={configForm.handleSubmit(onSubmitConfig)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={configForm.control}
            name="ambiente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ambiente</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Produção</SelectItem>
                    <SelectItem value="2">Homologação</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Ambiente de emissão das notas fiscais
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="regimeTributario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regime Tributário</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime tributário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Simples Nacional</SelectItem>
                    <SelectItem value="2">Simples Nacional - excesso</SelectItem>
                    <SelectItem value="3">Regime Normal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="serieNFe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Série da NFe</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="proximoNumeroNFe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próximo Número da NFe</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="inscricaoEstadual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Estadual</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="inscricaoMunicipal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Municipal</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="cnae"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNAE</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="ufEmissor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF do Emissor</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={2} />
                </FormControl>
                <FormDescription>
                  Código da UF (ex: MG, SP, RJ)
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
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o certificado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {certificates.map((cert: FiscalCertificate) => (
                      <SelectItem key={cert.id} value={cert.id.toString()}>
                        {cert.name} {cert.isActive ? "" : "(Inativo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Certificado a ser utilizado para emissão de NFe
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit"
          disabled={saveConfigMutation.isPending || !configForm.formState.isDirty}
        >
          {saveConfigMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </form>
    </Form>
  );
  
  return (
    <>
      <div className="container p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Configurações Fiscais</h1>
          <div className="text-sm text-muted-foreground">
            {fiscalConfig?.id ? (
              <p>Última atualização: {formatDate(fiscalConfig.updatedAt || fiscalConfig.createdAt)}</p>
            ) : null}
          </div>
        </div>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="certificates">Certificados Digitais</TabsTrigger>
          <TabsTrigger value="ncm">Códigos NCM</TabsTrigger>
          <TabsTrigger value="cfop">CFOPs</TabsTrigger>
          <TabsTrigger value="cst">CSTs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure os parâmetros gerais para emissão de notas fiscais eletrônicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingConfig ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <GeneralConfigForm />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Certificados Digitais</CardTitle>
                <CardDescription>
                  Gerencie os certificados digitais utilizados na emissão de documentos fiscais.
                </CardDescription>
              </div>
              <Dialog open={showCertificateDialog} onOpenChange={(open) => {
                setShowCertificateDialog(open);
                if (!open) resetDialogs();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Certificado
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Editar Certificado' : 'Adicionar Novo Certificado'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do certificado digital A1 em formato .pfx
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...certificateForm}>
                    <form onSubmit={certificateForm.handleSubmit((data) => saveCertificateMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={certificateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Certificado</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={certificateForm.control}
                          name="validFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Válido a partir de</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={certificateForm.control}
                          name="validTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Válido até</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={certificateForm.control}
                        name="certificateData"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo do Certificado (Base64)</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={6} />
                            </FormControl>
                            <FormDescription>
                              Cole aqui o conteúdo do arquivo .pfx convertido para Base64
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={certificateForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Certificado Ativo</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCertificateDialog(false);
                            resetDialogs();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={saveCertificateMutation.isPending}
                        >
                          {saveCertificateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCertificates ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : certificates.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum certificado cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo Certificado" para adicionar.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Número de Série</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert: FiscalCertificate) => (
                      <TableRow key={cert.id}>
                        <TableCell>{cert.name}</TableCell>
                        <TableCell>{cert.serialNumber}</TableCell>
                        <TableCell>
                          {formatDate(cert.validFrom)} até {formatDate(cert.validTo)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cert.isActive ? "default" : "outline"}>
                            {cert.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCertificate(cert)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCertificateMutation.mutate(cert.id)}
                              disabled={deleteCertificateMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ncm" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Códigos NCM</CardTitle>
                <CardDescription>
                  Gerencie os códigos NCM (Nomenclatura Comum do Mercosul) para produtos.
                </CardDescription>
              </div>
              <Dialog open={showNCMDialog} onOpenChange={(open) => {
                setShowNCMDialog(open);
                if (!open) resetDialogs();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo NCM
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Editar NCM' : 'Adicionar Novo NCM'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do código NCM
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...ncmForm}>
                    <form onSubmit={ncmForm.handleSubmit((data) => saveNCMMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={ncmForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código NCM</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={ncmForm.control}
                        name="description"
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
                          control={ncmForm.control}
                          name="aliquotaNacional"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alíquota Nacional (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={field.value === null ? "" : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? null : Number(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={ncmForm.control}
                          name="aliquotaImportado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alíquota Importado (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={field.value === null ? "" : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? null : Number(e.target.value);
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowNCMDialog(false);
                            resetDialogs();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={saveNCMMutation.isPending}
                        >
                          {saveNCMMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingNCMs ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : ncms.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum código NCM cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo NCM" para adicionar.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Alíq. Nacional</TableHead>
                      <TableHead>Alíq. Importado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ncms.map((ncm: NCM) => (
                      <TableRow key={ncm.id}>
                        <TableCell>{ncm.code}</TableCell>
                        <TableCell>{ncm.description}</TableCell>
                        <TableCell>{ncm.aliquotaNacional ? `${ncm.aliquotaNacional}%` : "-"}</TableCell>
                        <TableCell>{ncm.aliquotaImportado ? `${ncm.aliquotaImportado}%` : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditNCM(ncm)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNCMMutation.mutate(ncm.id)}
                              disabled={deleteNCMMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cfop" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Códigos CFOP</CardTitle>
                <CardDescription>
                  Gerencie os códigos CFOP (Código Fiscal de Operações e Prestações).
                </CardDescription>
              </div>
              <Dialog open={showCFOPDialog} onOpenChange={(open) => {
                setShowCFOPDialog(open);
                if (!open) resetDialogs();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo CFOP
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Editar CFOP' : 'Adicionar Novo CFOP'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do código CFOP
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...cfopForm}>
                    <form onSubmit={cfopForm.handleSubmit((data) => saveCFOPMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={cfopForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código CFOP</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={cfopForm.control}
                        name="description"
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
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCFOPDialog(false);
                            resetDialogs();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={saveCFOPMutation.isPending}
                        >
                          {saveCFOPMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCFOPs ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : cfops.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum código CFOP cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo CFOP" para adicionar.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cfops.map((cfop: CFOP) => (
                      <TableRow key={cfop.id}>
                        <TableCell>{cfop.code}</TableCell>
                        <TableCell>{cfop.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCFOP(cfop)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCFOPMutation.mutate(cfop.id)}
                              disabled={deleteCFOPMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cst" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Códigos CST</CardTitle>
                <CardDescription>
                  Gerencie os códigos CST (Código de Situação Tributária).
                </CardDescription>
              </div>
              <Dialog open={showCSTDialog} onOpenChange={(open) => {
                setShowCSTDialog(open);
                if (!open) resetDialogs();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo CST
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Editar CST' : 'Adicionar Novo CST'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do código CST
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...cstForm}>
                    <form onSubmit={cstForm.handleSubmit((data) => saveCSTMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={cstForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código CST</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={cstForm.control}
                          name="tipo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="icms">ICMS</SelectItem>
                                  <SelectItem value="pis">PIS</SelectItem>
                                  <SelectItem value="cofins">COFINS</SelectItem>
                                  <SelectItem value="ipi">IPI</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={cstForm.control}
                        name="description"
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
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCSTDialog(false);
                            resetDialogs();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={saveCSTMutation.isPending}
                        >
                          {saveCSTMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingCSTs ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : csts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum código CST cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo CST" para adicionar.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csts.map((cst: CST) => (
                      <TableRow key={cst.id}>
                        <TableCell>{cst.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cst.tipo.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{cst.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCST(cst)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCSTMutation.mutate(cst.id)}
                              disabled={deleteCSTMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
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
    </>
  );
}