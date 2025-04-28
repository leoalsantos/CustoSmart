#!/bin/bash

# Configurar variáveis de ambiente
export NODE_ENV=development
export HOST=0.0.0.0
export PORT=5000

# Garantir que a conexão SSL está ativada
if [[ "${DATABASE_URL}" != *"sslmode=require"* ]]; then
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
fi

echo "URL de conexão configurada com SSL"

# Garantir permissões de diretórios
mkdir -p CustoSmart-Replit/uploads/chat CustoSmart-Replit/uploads/thumbnails

# Iniciar o servidor com stdout e stderr redirecionados diretamente
cd CustoSmart-Replit
node_modules/.bin/tsx server/index.ts