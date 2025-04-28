FROM node:20-slim

# Argumentos para configuração durante o build
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Criar diretório de trabalho
WORKDIR /app

# Instalar dependências necessárias para o PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependências
RUN npm ci

# Copiar o código-fonte
COPY . .

# Gerar prisma client
RUN npx drizzle-kit generate

# Construir para produção
RUN npm run build

# Expor a porta do servidor
EXPOSE 5000

# Copiar e configurar script de inicialização
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Definir comando de inicialização
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]