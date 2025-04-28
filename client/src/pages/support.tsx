import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  CircleHelp, 
  FileText, 
  LifeBuoy, 
  MessageCircle, 
  PhoneCall, 
  TicketCheck,
  Book,
  Mail,
  Info,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SupportPage() {
  const { user } = useAuth();
  const hasTicketPermission = user?.permissions?.suporte;
  const hasKnowledgePermission = user?.permissions?.suporte || user?.permissions?.admin;

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Centro de Suporte</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bem-vindo ao Centro de Suporte do CustoSmart. Aqui você encontra recursos para solucionar problemas,
            obter ajuda e acessar nossa base de conhecimento.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {hasTicketPermission && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TicketCheck className="h-6 w-6 mr-2 text-primary" />
                  Tickets de Suporte
                </CardTitle>
                <CardDescription>
                  Crie, visualize e gerencie seus tickets de suporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Acesse o sistema de tickets para solicitar suporte e acompanhar o status de suas solicitações. 
                  Nossa equipe está pronta para atender suas demandas.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/support/tickets">
                    Acessar Tickets <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {hasKnowledgePermission && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="h-6 w-6 mr-2 text-primary" />
                  Base de Conhecimento
                </CardTitle>
                <CardDescription>
                  Acesse tutoriais, guias e documentação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Explore nossa coleção de artigos, tutoriais e documentações para tirar o máximo proveito do sistema CustoSmart.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/support/knowledge">
                    Explorar Base <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhoneCall className="h-6 w-6 mr-2 text-primary" />
                Contato Direto
              </CardTitle>
              <CardDescription>
                Entre em contato com nossa equipe de suporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Precisa de ajuda imediata? Nossa equipe de suporte está disponível para ajudar você.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">suporte@custosmart.com.br</span>
                </div>
                <div className="flex items-center">
                  <PhoneCall className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">(11) 4002-8922</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" /> Enviar E-mail
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CircleHelp className="h-5 w-5 mr-2 text-primary" />
                  Como posso alterar minha senha?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Para alterar sua senha, acesse o menu de perfil no canto superior direito da tela e selecione "Configurações".
                  Na seção de segurança, você poderá definir uma nova senha.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CircleHelp className="h-5 w-5 mr-2 text-primary" />
                  Como exportar relatórios?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Os relatórios podem ser exportados em vários formatos (PDF, Excel, CSV) usando o botão "Exportar" 
                  presente em cada página de relatório. Selecione o formato desejado e o download será iniciado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CircleHelp className="h-5 w-5 mr-2 text-primary" />
                  O que fazer quando ocorre um erro?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Se você encontrar um erro, tente atualizar a página primeiro. Se o problema persistir, 
                  tire um print da tela de erro e abra um ticket de suporte com os detalhes do problema.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CircleHelp className="h-5 w-5 mr-2 text-primary" />
                  Como solicitar novos recursos?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Sugestões para novos recursos podem ser enviadas através da seção de tickets de suporte, 
                  selecionando a categoria "Sugestão" ao criar um novo ticket.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-3xl mx-auto bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Info className="h-6 w-6 mr-2" />
                Precisa de mais ajuda?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Se você não encontrou a informação que procura, nossa equipe de suporte está pronta para ajudar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasTicketPermission && (
                  <Button asChild>
                    <Link to="/support/tickets">
                      <TicketCheck className="h-4 w-4 mr-2" /> Abrir Ticket
                    </Link>
                  </Button>
                )}
                <Button variant="outline">
                  <PhoneCall className="h-4 w-4 mr-2" /> Entrar em Contato
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}