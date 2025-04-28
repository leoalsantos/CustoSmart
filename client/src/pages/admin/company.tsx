import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Building2, UploadCloud } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for company
const companySchema = z.object({
  name: z.string().min(3, "Nome da empresa é obrigatório"),
  taxId: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const AdminCompany = () => {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Query for company
  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/company"],
  });

  // Form
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      taxId: company?.taxId || "",
      email: company?.email || "",
      phone: company?.phone || "",
      address: company?.address || "",
      website: company?.website || "",
      logo: company?.logo || "",
    },
  });

  // Update form values when company data is loaded
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        taxId: company.taxId || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        logo: company.logo || "",
      });

      if (company.logo) {
        setLogoPreview(company.logo);
      }
    }
  }, [company, form]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      if (company?.id) {
        return await apiRequest("PATCH", `/api/company/${company.id}`, data);
      } else {
        return await apiRequest("POST", "/api/company", data);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the company query
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Dados atualizados",
        description: "As informações da empresa foram atualizadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar dados",
        description:
          error.message ||
          "Ocorreu um erro ao atualizar as informações da empresa",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CompanyFormValues) => {
    updateCompanyMutation.mutate(data);
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        form.setValue("logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dados da Empresa</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure as informações da sua empresa no sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Profile */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Perfil da Empresa</CardTitle>
            <CardDescription>
              Estas informações serão exibidas em relatórios, notas fiscais e
              comunicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome oficial da empresa"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00.000.000/0000-00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="contato@empresa.com"
                            {...field}
                            value={field.value || ""}
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 0000-0000"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="www.empresa.com"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Endereço completo da empresa"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Empresa</CardTitle>
            <CardDescription>
              Faça upload da logo que será usada em documentos e no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo da empresa"
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Building2 className="h-24 w-24 text-gray-400" />
              )}
            </div>

            <div className="w-full">
              <label
                htmlFor="logo-upload"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <UploadCloud className="h-5 w-5 mr-2" />
                Carregar Logo
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Building2 className="inline h-4 w-4 mr-1" />
          Os dados da empresa são utilizados em todos os documentos e relatórios
          gerados pelo sistema.
        </p>
      </div>
    </>
  );
};

export default AdminCompany;
