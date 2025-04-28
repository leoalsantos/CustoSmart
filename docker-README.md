# CustoSmart - Instalação com Docker

Este documento contém instruções para instalar e executar o CustoSmart utilizando Docker, permitindo uma configuração rápida e isolada do ambiente de produção.

## Pré-requisitos

- Docker Engine (versão 20.10.0 ou superior)
- Docker Compose (versão 2.0.0 ou superior)
- 2GB de RAM mínimo (recomendado 4GB)
- 10GB de espaço em disco

## Instalação Rápida

Para uma instalação rápida, execute o script de instalação:

```bash
./install-docker.sh
```

Este script irá:
1. Verificar os pré-requisitos
2. Configurar as variáveis de ambiente
3. Preparar os scripts de inicialização do banco de dados
4. Construir e iniciar os containers
5. Verificar o status da aplicação

Após a execução bem-sucedida, o CustoSmart estará disponível em: http://localhost:5000

## Instalação Manual

Se preferir realizar a instalação manualmente, siga os passos abaixo:

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo para criar seu arquivo de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário, especialmente a variável `JWT_SECRET` para garantir a segurança da autenticação.

### 2. Preparar Scripts de Inicialização do Banco

Crie um diretório para os scripts de inicialização:

```bash
mkdir -p init-db
```

Crie um script para garantir as extensões necessárias:

```bash
cat > init-db/00-setup-extensions.sql << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
```

### 3. Construir e Iniciar os Containers

Execute os comandos do Docker Compose:

```bash
docker-compose build
docker-compose up -d
```

## Administração

### Monitoramento

Para visualizar os logs da aplicação:

```bash
docker-compose logs -f app
```

Para verificar o status dos containers:

```bash
docker-compose ps
```

### Comandos de Administração

- **Iniciar os serviços**: `docker-compose up -d`
- **Parar os serviços**: `docker-compose down`
- **Reiniciar os serviços**: `docker-compose restart`
- **Reconstruir e reiniciar**: `docker-compose up -d --build`
- **Excluir todos os dados**: `docker-compose down -v` (cuidado: isso remove todos os volumes, incluindo o banco de dados)

## Estrutura do Projeto Docker

- **Dockerfile**: Define a imagem do container da aplicação
- **docker-compose.yml**: Orquestra os containers (aplicação e banco de dados)
- **docker-entrypoint.sh**: Script de inicialização do container da aplicação
- **.env**: Configurações de ambiente (criado a partir de .env.example)
- **init-db/**: Scripts executados durante a inicialização do PostgreSQL

## Configurações Personalizadas

### Alterando a Porta

Por padrão, a aplicação é exposta na porta 5000. Para mudar, edite no arquivo `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "NOVA_PORTA:5000"
```

### Persistência de Dados

Os dados são armazenados em volumes Docker:

- **postgres_data**: Banco de dados PostgreSQL
- **app_uploads**: Arquivos enviados pelos usuários
- **app_logs**: Logs da aplicação

## Primeiros Passos após a Instalação

1. Acesse http://localhost:5000
2. Faça login com o usuário padrão:
   - Usuário: `administrador`
   - Senha: `admin123`
3. **Importante**: Altere a senha do administrador imediatamente após o primeiro login

## Solução de Problemas

### Container da Aplicação não Inicia

Verifique os logs:
```bash
docker-compose logs app
```

### Problemas de Conexão com o Banco de Dados

Verifique se o container do PostgreSQL está rodando:
```bash
docker-compose ps db
```

Verifique os logs do banco:
```bash
docker-compose logs db
```

### Erro "Connection Refused"

Verifique se os containers estão rodando na mesma rede:
```bash
docker network ls
docker network inspect custosmart-replit_custosmart-network
```

## Backup e Restauração

### Backup do Banco de Dados

```bash
docker-compose exec db pg_dump -U custosmart -d custosmart_db > backup_$(date +%Y%m%d).sql
```

### Restauração do Banco de Dados

```bash
cat backup.sql | docker-compose exec -T db psql -U custosmart -d custosmart_db
```