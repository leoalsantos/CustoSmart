import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const SetupPage = () => {
  const { toast } = useToast();
  const [isCreatingAdmin, setIsCreatingAdmin] = React.useState(false);
  const [isCreatingLeo, setIsCreatingLeo] = React.useState(false);
  const [adminCreated, setAdminCreated] = React.useState(false);
  const [leoCreated, setLeoCreated] = React.useState(false);

  const createAdminUser = async () => {
    setIsCreatingAdmin(true);
    try {
      await apiRequest('POST', '/api/admin/setup', {
        username: 'administrador',
        password: 'administrador',
        fullName: 'Administrador do Sistema',
        email: 'admin@custosmart.com.br'
      });
      
      toast({
        title: 'Sucesso',
        description: 'Usuário administrador criado com sucesso!',
      });
      
      setAdminCreated(true);
    } catch (error: any) {
      console.error('Erro ao criar usuário administrador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar usuário administrador',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const createLeoUser = async () => {
    setIsCreatingLeo(true);
    try {
      await apiRequest('POST', '/api/admin/setup', {
        username: 'leoalmeidas',
        password: 'L30n4rd0@052085',
        fullName: 'Leonardo Almeida',
        email: 'leo@custosmart.com.br'
      });
      
      toast({
        title: 'Sucesso',
        description: 'Usuário Leonardo criado com sucesso!',
      });
      
      setLeoCreated(true);
    } catch (error: any) {
      console.error('Erro ao criar usuário Leonardo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar usuário Leonardo',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLeo(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Configuração do Sistema CustoSmart</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuração de Usuários Administradores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-500">
              Esta página permite a criação dos usuários administradores do sistema. 
              Use esta opção apenas durante a configuração inicial do sistema.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Usuário Administrador</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    <strong>Usuário:</strong> administrador<br />
                    <strong>Senha:</strong> administrador<br />
                    <strong>Função:</strong> Administrador do Sistema
                  </p>
                  <Button 
                    onClick={createAdminUser} 
                    disabled={isCreatingAdmin || adminCreated}
                    className="w-full"
                  >
                    {isCreatingAdmin ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : adminCreated ? (
                      'Usuário Criado'
                    ) : (
                      'Criar Usuário Administrador'
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Usuário Leonardo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    <strong>Usuário:</strong> leoalmeidas<br />
                    <strong>Senha:</strong> L30n4rd0@052085<br />
                    <strong>Função:</strong> Administrador do Sistema
                  </p>
                  <Button 
                    onClick={createLeoUser} 
                    disabled={isCreatingLeo || leoCreated}
                    className="w-full"
                  >
                    {isCreatingLeo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : leoCreated ? (
                      'Usuário Criado'
                    ) : (
                      'Criar Usuário Leonardo'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <Button onClick={() => window.location.href = '/auth'}>
            Ir para página de login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;