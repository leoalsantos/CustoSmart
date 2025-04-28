import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Esquema para criação de artigos na base de conhecimento
const articleSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  tags: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function KnowledgeBase() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isNewArticleOpen, setIsNewArticleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (user?.permissions && typeof user.permissions === "object") {
      return user.permissions.admin === true;
    }
    return false;
  });

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: "",
    },
  });

  // Obter artigos da base de conhecimento
  const {
    data: articles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/support/knowledge"],
    queryFn: async () => {
      const res = await fetch("/api/support/knowledge");
      if (!res.ok) throw new Error("Falha ao carregar base de conhecimento");
      return await res.json();
    },
  });

  // Mutação para criar artigo
  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormValues) => {
      return await apiRequest("POST", "/api/support/knowledge", data);
    },
    onSuccess: () => {
      toast({
        title: "Artigo criado com sucesso",
        description: "O artigo foi adicionado à base de conhecimento",
      });
      setIsNewArticleOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support/knowledge"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar artigo",
        description: error.message || "Ocorreu um erro ao adicionar o artigo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ArticleFormValues) => {
    createArticleMutation.mutate(data);
  };

  // Filtrar artigos
  const filteredArticles = articles.filter((article: any) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags &&
        article.tags.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || article.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const uniqueCategories = [
    ...new Set(articles.map((article: any) => article.category)),
  ];

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/support">Suporte</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Base de Conhecimento</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          {(isAdmin || user?.permissions?.suporte === true) && (
            <Dialog open={isNewArticleOpen} onOpenChange={setIsNewArticleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Novo Artigo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Artigo</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título do artigo" {...field} />
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
                              <SelectItem value="financeiro">
                                Financeiro
                              </SelectItem>
                              <SelectItem value="administrativo">
                                Administrativo
                              </SelectItem>
                              <SelectItem value="treinamento">
                                Treinamento
                              </SelectItem>
                              <SelectItem value="tutorial">Tutorial</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (separadas por vírgula)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: pagamento, configuração, relatório"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Digite o conteúdo do artigo aqui..."
                              className="min-h-[300px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNewArticleOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createArticleMutation.isPending}
                      >
                        {createArticleMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar Artigo
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar com filtros */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Pesquisar</Label>
                <div className="flex items-center mt-1">
                  <Search className="h-4 w-4 mr-2 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Pesquisar artigos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category-filter">Categoria</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category-filter" className="mt-1">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {uniqueCategories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de artigos */}
        <div className="w-full md:w-3/4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-2">
                  Nenhum artigo encontrado
                </p>
                <p className="text-gray-500 text-center max-w-md">
                  Não foram encontrados artigos com os critérios de busca
                  atuais. Tente ajustar seus filtros ou criar um novo artigo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredArticles.map((article: any) => (
                <Card key={article.id} className="overflow-hidden">
                  <AccordionItem
                    value={`article-${article.id}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <h3 className="text-lg font-medium">{article.title}</h3>
                        <div className="flex mt-2 gap-2">
                          <Badge variant="outline">{article.category}</Badge>
                          {article.tags &&
                            article.tags
                              .split(",")
                              .map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {tag.trim()}
                                </Badge>
                              ))}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-0">
                      <div className="border-t pt-4 mt-2">
                        <div className="whitespace-pre-wrap">
                          {article.content}
                        </div>
                        <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
                          <div>
                            Criado em:{" "}
                            {new Date(article.createdAt).toLocaleDateString()}
                          </div>
                          {(isAdmin || user?.permissions?.suporte === true) && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
