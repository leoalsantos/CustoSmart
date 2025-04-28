#!/bin/bash

echo "=== Iniciando a aplicação CustoSmart ==="

# Verificar o diretório atual
echo "Diretório atual: $(pwd)"
ls -la

# Garantir que o diretório do projeto existe
if [ ! -d "CustoSmart-Replit" ]; then
  echo "Clonando repositório CustoSmart-Replit..."
  git clone https://github.com/leoalsantos/CustoSmart-Replit.git
fi

# Entrar no diretório do projeto
cd CustoSmart-Replit
echo "Entrou no diretório do projeto: $(pwd)"

# Instalar dependências se necessário
echo "Verificando dependências..."
npm install

# Configurar variáveis de ambiente
echo "Configurando variáveis de ambiente..."
export NODE_ENV=production
export PORT=5000

# Verificar se há arquivo .env no diretório pai e copiá-lo
if [ -f "../.env" ]; then
  echo "Copiando arquivo .env..."
  cp "../.env" .
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
  echo "Criando arquivo .env..."
  echo "DATABASE_URL=$DATABASE_URL" > .env
  echo "PGUSER=$PGUSER" >> .env
  echo "PGPASSWORD=$PGPASSWORD" >> .env
  echo "PGHOST=$PGHOST" >> .env
  echo "PGPORT=$PGPORT" >> .env
  echo "PGDATABASE=$PGDATABASE" >> .env
fi

# Verificar se o banco de dados está configurado
echo "Verificando banco de dados..."
npm run db:push

# Construir a aplicação
echo "Construindo a aplicação..."
npm run build

# Iniciar a aplicação
echo "Iniciando a aplicação..."
npm run start