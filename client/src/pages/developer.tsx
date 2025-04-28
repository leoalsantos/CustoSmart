import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DeveloperPage() {
  return (
    <>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Informações do Desenvolvedor</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sobre o Desenvolvedor</CardTitle>
            <CardDescription>Informações de contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">CustoSmart - Sistema ERP Completo</h3>
                <p className="mb-1">Desenvolvido por <strong>Leonardo Almeida da Silva</strong></p>
                <p className="mb-1">Email: <a href="mailto:leoalmeidas@gmail.com" className="text-blue-600 hover:underline">leoalmeidas@gmail.com</a></p>
                <p className="mb-1">Telefone: <a href="tel:+5511986675088" className="text-blue-600 hover:underline">(11) 98667-5088</a></p>
                <p className="mb-1">Website: <a href="https://www.leoalmeida.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.leoalmeida.dev</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
            <CardDescription>Detalhes técnicos do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Tecnologias Utilizadas</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Express</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Drizzle ORM</Badge>
                  <Badge variant="secondary">WebSockets</Badge>
                  <Badge variant="secondary">TailwindCSS</Badge>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Versão</h3>
                <p>v1.0.0 - Abril 2025</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Recursos do Sistema</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Dashboard com métricas e indicadores de desempenho</li>
                  <li>Sistema de mensagens em tempo real</li>
                  <li>Emissão de Nota Fiscal Eletrônica (NF-e)</li>
                  <li>Gestão de produção e fórmulas de produtos</li>
                  <li>Controle de estoque com conversão automática de unidades</li>
                  <li>Gestão financeira com contas a pagar e receber</li>
                  <li>Gestão de clientes e pedidos</li>
                  <li>Gerenciamento de fornecedores e compras</li>
                  <li>Sistema de manutenção preventiva e corretiva</li>
                  <li>Módulo de qualidade com inspeções e não conformidades</li>
                  <li>Recursos humanos com controle de funcionários e folha de pagamento</li>
                  <li>Sistema de suporte técnico e base de conhecimento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Licenciamento</CardTitle>
            <CardDescription>Informações sobre o licenciamento do software</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              © 2025 Leonardo Almeida da Silva. Todos os direitos reservados.
            </p>
            <p>
              Este software é protegido por leis de direitos autorais e tratados internacionais.
              A utilização deste sistema está sujeita aos termos do contrato de licença do usuário final.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}