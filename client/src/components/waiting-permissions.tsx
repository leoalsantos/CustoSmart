import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WaitingPermissions() {
  return (
    <div className="container mx-auto py-6">
      <Card className="bg-white dark:bg-gray-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <div>
            <CardTitle className="text-xl">Aguardando Permissões</CardTitle>
            <CardDescription>
              Sua conta foi criada, mas ainda não possui permissões atribuídas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Sua conta foi criada com sucesso, mas você ainda não possui permissões atribuídas para acessar os módulos do sistema.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Por favor, entre em contato com um administrador do sistema para que as permissões necessárias sejam concedidas à sua conta.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Enquanto isso, você pode acessar:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Seu perfil de usuário (menu superior direito)</li>
              <li>Configurações da sua conta (menu superior direito)</li>
              <li>Suporte técnico (barra lateral)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}