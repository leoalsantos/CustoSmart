#!/bin/bash
set -e

# Função para aguardar o PostgreSQL ficar disponível
waitForPostgres() {
  echo "Aguardando o PostgreSQL..."
  
  until pg_isready -h db -U "${POSTGRES_USER:-custosmart}" -d "${POSTGRES_DB:-custosmart_db}" > /dev/null 2>&1; do
    echo "PostgreSQL indisponível - aguardando..."
    sleep 2
  done
  
  echo "PostgreSQL está pronto!"
}

# Criar diretórios necessários se não existirem
mkdir -p /app/uploads
mkdir -p /app/uploads/chat
mkdir -p /app/uploads/thumbnails
mkdir -p /app/logs

# Configurar permissões corretas para os diretórios
chmod -R 755 /app/uploads
chmod -R 755 /app/logs

# Aguardar o PostgreSQL
waitForPostgres

# Executar migrações do banco de dados
echo "Executando migrações do banco de dados..."
npx drizzle-kit push

# Conferir se há necessidade de inicializar o banco com dados padrão
if [ "${INITIALIZE_DB:-false}" = "true" ]; then
  echo "Inicializando banco de dados com dados padrão..."
  node init_db.js
fi

echo "Inicialização concluída. Executando comando: $@"
exec "$@"