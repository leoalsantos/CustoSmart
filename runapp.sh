#!/bin/bash

# Configuração de cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CustoSmart - Instalação e Execução ===${NC}"

# Definindo diretório base
BASE_DIR=$(pwd)
APP_DIR="$BASE_DIR/CustoSmart-Replit"

# Passo 1: Verificar se o repositório existe
echo -e "${YELLOW}Verificando repositório...${NC}"
if [ ! -d "$APP_DIR" ]; then
  echo "Clonando repositório..."
  git clone https://github.com/leoalsantos/CustoSmart-Replit.git
  if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao clonar o repositório!${NC}"
    exit 1
  fi
fi

# Passo 2: Garantir que as variáveis de ambiente estão definidas
echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"
export NODE_ENV=development  # Alterado para development para facilitar depuração
export HOST=0.0.0.0
export PORT=5000

# Garantir que o node use o ES modules
export NODE_OPTIONS="--experimental-specifier-resolution=node"

# Configuração do banco de dados
if [ -f ".env" ]; then
  echo "Carregando variáveis de .env..."
  cp .env "$APP_DIR/.env"
  source .env
  
  # Garantir que as variáveis do banco de dados estão disponíveis na sessão
  # Adicionar sslmode=require na URL de conexão se ainda não estiver presente
  if [[ "${DATABASE_URL}" != *"sslmode=require"* ]]; then
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  
  export PGUSER="${PGUSER}"
  export PGPASSWORD="${PGPASSWORD}"
  export PGHOST="${PGHOST}"
  export PGPORT="${PGPORT}" 
  export PGDATABASE="${PGDATABASE}"
  
  echo "Configuração de SSL para PostgreSQL ativada"
fi

# Passo 3: Entrar no diretório da aplicação
cd "$APP_DIR"
echo -e "${YELLOW}Trabalhando no diretório:${NC} $(pwd)"

# Passo 4: Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao instalar dependências!${NC}"
  exit 1
fi

# Instalando dependências de desenvolvimento globalmente para acessar CLI
echo -e "${YELLOW}Instalando ferramentas de desenvolvimento...${NC}"
npm install -g vite esbuild drizzle-kit typescript

# Passo 5: Configurar o banco de dados (com tratamento especial para SSL)
echo -e "${YELLOW}Configurando banco de dados...${NC}"

# Verificar diretórios de uploads
for dir in "uploads" "uploads/chat" "uploads/thumbnails"; do
  if [ -d "$dir" ]; then
    echo "Diretório com permissão de escrita: $(pwd)/$dir"
  else
    mkdir -p "$dir"
    echo "Diretório criado com permissão de escrita: $(pwd)/$dir"
  fi
done

# Passo 6: Iniciar a aplicação no modo de desenvolvimento
# Este modo não requer compilação prévia
echo -e "${GREEN}Iniciando a aplicação na porta 5000...${NC}"
echo -e "${YELLOW}URL de Acesso:${NC} http://localhost:5000/"

# Forçar host e porta para garantir que a aplicação seja acessível
export HOST=0.0.0.0
export PORT=5000

# Usar o script de desenvolvimento
echo -e "${YELLOW}Executando em modo de desenvolvimento...${NC}"
npx tsx server/index.ts