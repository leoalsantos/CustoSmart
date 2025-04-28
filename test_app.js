// Arquivo de teste para verificar a conectividade com o banco de dados
const { Pool } = require('pg');
const http = require('http');

// Função para testar a conexão com o banco de dados
async function testDatabaseConnection() {
  console.log("Verificando conexão com o banco de dados...");
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error("Erro: Variável DATABASE_URL não está definida");
      return false;
    }
    
    console.log("DATABASE_URL encontrada:", process.env.DATABASE_URL.substring(0, 20) + "...");
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    console.log("Conexão com o banco de dados estabelecida!");
    
    const result = await client.query('SELECT NOW()');
    console.log("Consulta executada com sucesso:", result.rows[0]);
    
    client.release();
    await pool.end();
    
    return true;
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    return false;
  }
}

// Função para testar a abertura da porta do servidor
function testServerPort() {
  console.log("Testando abertura da porta 5000...");
  
  return new Promise((resolve) => {
    try {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Servidor de teste funcionando!');
      });
      
      server.on('error', (error) => {
        console.error("Erro ao abrir a porta 5000:", error);
        resolve(false);
      });
      
      server.listen(5000, '0.0.0.0', () => {
        console.log("Servidor de teste aberto na porta 5000");
        // Fechar o servidor após confirmação
        setTimeout(() => {
          server.close(() => {
            console.log("Servidor de teste fechado");
            resolve(true);
          });
        }, 3000);
      });
    } catch (error) {
      console.error("Erro ao criar servidor de teste:", error);
      resolve(false);
    }
  });
}

// Função principal
async function main() {
  console.log("=== Teste da Aplicação CustoSmart ===");
  console.log("Variáveis de ambiente:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", process.env.PORT);
  
  // Testar banco de dados
  const dbSuccess = await testDatabaseConnection();
  console.log("Teste de banco de dados:", dbSuccess ? "SUCESSO" : "FALHA");
  
  // Testar porta do servidor
  const portSuccess = await testServerPort();
  console.log("Teste de porta do servidor:", portSuccess ? "SUCESSO" : "FALHA");
  
  if (dbSuccess && portSuccess) {
    console.log("\n✅ Todos os testes passaram! A aplicação deve funcionar corretamente.");
    process.exit(0);
  } else {
    console.log("\n❌ Alguns testes falharam. Verifique os problemas acima.");
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error("Erro inesperado:", error);
  process.exit(1);
});