import React, { useState } from "react";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/dashboard/data-table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload, Database, AlertCircle, Search, Download, RefreshCw, Plus, ChevronRight, Package, Loader2, UploadCloud } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function InvoiceEntries() {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [xmlContent, setXmlContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileInfo, setSelectedFileInfo] = useState<{ name: string, size: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");

  // Buscar notas fiscais de entrada
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/purchase/invoice-entries"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/fiscal/nfes?tipo=0");
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar notas fiscais:", error);
        return [];
      }
    }
  });

  // Mutation para importar XML
  const importXmlMutation = useMutation({
    mutationFn: async (data: { xml: string, tipoEntrada: string }) => {
      const response = await apiRequest("POST", "/api/fiscal/importar-xml", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "XML importado com sucesso",
          description: `${data.message || "Nota fiscal registrada e estoque atualizado."}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/purchase/invoice-entries"] });
        queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
        setImportDialogOpen(false);
        setXmlContent("");
        setFile(null);
        setSelectedFileInfo(null);
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao importar XML",
          description: data.message || "Ocorreu um erro ao importar o XML.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao importar XML",
        description: error.message || "Ocorreu um erro ao importar o XML.",
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/xml" && !selectedFile.name.endsWith(".xml")) {
        toast({
          variant: "destructive",
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo XML.",
        });
        return;
      }

      setFile(selectedFile);
      setSelectedFileInfo({
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlContent(content);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!xmlContent) {
      toast({
        variant: "destructive",
        title: "Nenhum XML fornecido",
        description: "Por favor, forneça um conteúdo XML válido para importar.",
      });
      return;
    }

    importXmlMutation.mutate({
      xml: xmlContent,
      tipoEntrada: "entrada"
    });
  };

  // Colunas da tabela
  const columns = [
    {
      accessorKey: "numero",
      header: "Número",
    },
    {
      accessorKey: "chave",
      header: "Chave",
      cell: ({ row }: { row: any }) => (
        <span className="text-xs font-mono">
          {row.original.chave}
        </span>
      ),
    },
    {
      accessorKey: "dataEmissao",
      header: "Emissão",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.dataEmissao), "dd/MM/yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "fornecedor",
      header: "Fornecedor",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.fornecedor?.name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "valorTotal",
      header: "Valor Total",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(row.original.valorTotal)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.original.status;
        const statusMap: { [key: string]: { label: string; color: string } } = {
          em_digitacao: { label: "Em Digitação", color: "bg-yellow-100 text-yellow-800" },
          enviada: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
          autorizada: { label: "Autorizada", color: "bg-green-100 text-green-800" },
          rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
          cancelada: { label: "Cancelada", color: "bg-gray-100 text-gray-800" },
        };
        
        const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    }
  ];

  // Coluna de ações
  const actionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Implementar visualização detalhada da NF-e
              window.open(`/purchase/invoice-entries/${row.original.id}`, "_blank");
            }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Implementar download do DANFE
              window.open(`/api/fiscal/nfes/${row.original.id}/danfe`, "_blank");
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            DANFE
          </Button>
        </div>
      );
    }
  };

  // Colunas da tabela de itens
  const itemColumns = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "descricao",
      header: "Descrição",
    },
    {
      accessorKey: "quantidade",
      header: "Quantidade",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR").format(row.original.quantidade)} {row.original.unidade}
        </span>
      ),
    },
    {
      accessorKey: "valorUnitario",
      header: "Valor Unit.",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(row.original.valorUnitario)}
        </span>
      ),
    },
    {
      accessorKey: "valorTotal",
      header: "Valor Total",
      cell: ({ row }: { row: any }) => (
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(row.original.valorTotal)}
        </span>
      ),
    },
    {
      accessorKey: "ncm",
      header: "NCM",
    },
  ];

  // Coluna de ações para itens
  const itemActionColumn = {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Verificar no estoque
              window.open(`/inventory/raw-materials?search=${encodeURIComponent(row.original.codigo)}`, "_blank");
            }}
          >
            <Package className="h-4 w-4 mr-1" />
            Ver no Estoque
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageTitle
        title="Entrada de Notas Fiscais"
        subtitle="Importação de NF-e e gerenciamento de entradas no estoque"
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nota fiscal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px]"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            className="w-full md:w-auto"
            onClick={() => setImportDialogOpen(true)}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Importar XML
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="invoices" className="flex-1 sm:flex-initial">
            <FileText className="h-4 w-4 mr-2" />
            Notas Fiscais
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 sm:flex-initial">
            <Package className="h-4 w-4 mr-2" />
            Itens Recebidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="p-0 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={invoices || []}
                isLoading={isLoading}
                searchColumn="fornecedor.name"
                actionColumn={actionColumn}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="p-0 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <DataTable
                  columns={itemColumns}
                  data={(invoices || []).flatMap((invoice: any) => invoice.itens || [])}
                  isLoading={isLoading}
                  searchColumn="descricao"
                  actionColumn={itemActionColumn}
                  searchTerm={searchTerm}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Não há itens recebidos para exibir.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de importação de XML */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Importar XML de Nota Fiscal</DialogTitle>
            <DialogDescription>
              Selecione ou cole o conteúdo XML para importar a nota fiscal e atualizar o estoque automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="file" className="font-medium">
                  Selecionar arquivo XML
                </Label>
                <div className="relative border rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    id="file"
                    type="file"
                    accept=".xml"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {selectedFileInfo ? (
                    <div className="text-center">
                      <p className="font-medium">{selectedFileInfo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFileInfo.size}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p>Clique ou arraste o arquivo XML aqui</p>
                      <p className="text-sm text-muted-foreground">
                        Somente arquivos XML são aceitos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center font-medium text-muted-foreground my-2">
                OU
              </div>

              <div className="grid items-center gap-2">
                <Label htmlFor="content" className="font-medium">
                  Colar conteúdo XML
                </Label>
                <Textarea
                  id="content"
                  placeholder="Cole o conteúdo XML aqui..."
                  rows={10}
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  A importação irá atualizar automaticamente o estoque de matérias-primas.
                  Se o item não existir no cadastro, ele será criado. Os produtos serão vinculados
                  pelo código do fornecedor.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setImportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!xmlContent || importXmlMutation.isPending}
              >
                {importXmlMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar XML
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}