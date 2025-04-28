import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDefaultUsers, storage } from "./storage";
import "./quotation-pricing"; // Importa as implementações de cotação e precificação
import { serveStaticFiles } from "./services/file-service";
import { initSocketService } from "./services/socket-service";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // Aumentado para 50MB
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'uploads', 'temp'),
  createParentPath: true,
  abortOnLimit: true,
  responseOnLimit: 'Arquivo muito grande. O limite é 50MB.'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Garantir que o diretório uploads exista
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  // Servir arquivos estáticos
  serveStaticFiles(app);
  
  // Inicializar usuários padrão
  await initializeDefaultUsers();
  
  const server = await registerRoutes(app);
  
  // Inicializar serviço de Socket.IO
  const socketService = initSocketService(server, storage);
  
  // Expor socketService globalmente para uso em outras partes da aplicação
  (global as any).socketService = socketService;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
