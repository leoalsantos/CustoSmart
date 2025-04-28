import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Verificar ambiente e DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debugging: verificar se o sslmode está adequadamente configurado
console.log("URL de conexão (início truncado para segurança): ..."+process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 30));

// Criar um pool de conexões para maior resiliência
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // limite de conexões no pool para evitar sobrecarga
  min: 2, // manter pelo menos 2 conexões sempre prontas
  idleTimeoutMillis: 60000, // tempo máximo que uma conexão pode ficar inativa (1 minuto)
  connectionTimeoutMillis: 10000, // tempo máximo para tentar se conectar (10 segundos)
  allowExitOnIdle: false, // não encerrar quando inativo
  statement_timeout: 30000, // timeout para statements SQL (30 segundos)
  query_timeout: 60000, // timeout para queries (1 minuto)
  ssl: {
    rejectUnauthorized: false, // Permite conexões a servidores sem certificados verificados
    require: true // Força o uso de SSL
  }
});

// Adicionar handler para erros no pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
  // Não deixar o erro derrubar o servidor
});

// Verificar se o pool está funcionando
pool.query('SELECT NOW()')
  .then(() => console.log('Conectado ao PostgreSQL com sucesso.'))
  .catch(err => {
    console.error('Erro ao conectar ao PostgreSQL:', err);
    // Continuar a execução do servidor mesmo com erro no banco
  });

// Configurar o Drizzle ORM com o pool PostgreSQL
export const db = drizzle(pool, { schema });
