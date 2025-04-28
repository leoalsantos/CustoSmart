#!/bin/bash

# Script de instalação do CustoSmart em Docker
set -e

echo "=== Instalação do CustoSmart em Docker ==="
echo

# Verificar pré-requisitos
checkPrerequisites() {
  echo "Verificando pré-requisitos..."
  
  if ! command -v docker &> /dev/null; then
    echo "Erro: Docker não está instalado. Por favor, instale o Docker antes de continuar."
    echo "Instruções em: https://docs.docker.com/get-docker/"
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    echo "Erro: Docker Compose não está instalado. Por favor, instale o Docker Compose antes de continuar."
    echo "Instruções em: https://docs.docker.com/compose/install/"
    exit 1
  fi
  
  echo "Pré-requisitos atendidos."
}

# Configurar variáveis de ambiente
setupEnvironmentVariables() {
  echo "Configurando variáveis de ambiente..."
  
  if [ ! -f .env ]; then
    echo "Criando arquivo .env a partir do modelo..."
    cp .env.example .env
    
    # Gerar uma chave JWT aleatória
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/your-jwt-secret-key-change-this-in-production/$JWT_SECRET/g" .env
    
    echo "Arquivo .env criado. Você pode editá-lo para personalizar a configuração."
  else
    echo "O arquivo .env já existe. Mantendo configuração atual."
  fi
}

# Criar diretório para scripts de inicialização do banco
setupInitScripts() {
  echo "Configurando scripts de inicialização do banco de dados..."
  
  mkdir -p init-db
  
  # Criar script para garantir extensões necessárias
  cat > init-db/00-setup-extensions.sql << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

  echo "Scripts de inicialização configurados."
}

# Construir e iniciar os containers
buildAndStartContainers() {
  echo "Construindo e iniciando containers..."
  
  docker-compose build
  docker-compose up -d
  
  echo "Containers iniciados."
}

# Verificar o status da aplicação
checkApplicationStatus() {
  echo "Verificando status da aplicação..."
  
  # Aguardar a inicialização
  echo "Aguardando a inicialização completa (30 segundos)..."
  sleep 30
  
  # Verificar se os containers estão rodando
  if [ "$(docker-compose ps -q app)" ] && [ "$(docker ps -q --no-trunc | grep $(docker-compose ps -q app))" ]; then
    echo "Aplicação está rodando!"
    echo "Acesse: http://localhost:5000"
  else
    echo "Erro: A aplicação não está rodando corretamente."
    echo "Verifique os logs com: docker-compose logs app"
  fi
}

# Instruções finais
showFinalInstructions() {
  echo
  echo "=== Instalação Concluída ==="
  echo
  echo "Comandos úteis:"
  echo "- Ver logs: docker-compose logs -f"
  echo "- Parar aplicação: docker-compose down"
  echo "- Reiniciar aplicação: docker-compose restart"
  echo "- Remover completamente (incluindo dados): docker-compose down -v"
  echo
  echo "Você pode acessar o CustoSmart em: http://localhost:5000"
  echo "Usuário padrão: administrador"
  echo "Senha padrão: admin123"
  echo
  echo "Lembre-se de alterar a senha após o primeiro acesso!"
}

# Execução principal
main() {
  checkPrerequisites
  setupEnvironmentVariables
  setupInitScripts
  buildAndStartContainers
  checkApplicationStatus
  showFinalInstructions
}

# Iniciar a execução
main