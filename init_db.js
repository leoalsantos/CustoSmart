#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('Inicializando banco de dados...');

// Verificar se arquivo drizzle.config.ts existe
if (!fs.existsSync('drizzle.config.ts')) {
  console.log('Criando configuração do Drizzle...');
  const drizzleConfig = `
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
`;
  
  fs.writeFileSync('drizzle.config.ts', drizzleConfig);
  console.log('Arquivo drizzle.config.ts criado.');
}

// Executar db:push para criar o schema no banco de dados
try {
  console.log('Executando db:push para criar o schema...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('Banco de dados inicializado com sucesso!');
} catch (error) {
  console.error('Erro ao executar db:push:', error);
  process.exit(1);
}