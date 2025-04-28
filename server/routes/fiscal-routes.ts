import { Router, Request, Response } from "express";
import { DatabaseStorage } from "../database-storage";
import { z } from "zod";
import { insertFiscalCertificateSchema, insertFiscalNCMSchema, insertFiscalCFOPSchema, insertFiscalCSTSchema, insertFiscalConfigSchema, insertNFeSchema, insertNFeItemSchema, insertNFeEventoSchema, insertProdutoFiscalSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateUser } from "../middlewares/auth-middleware";

// Configuração do Multer para upload de certificados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/certificates";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `certificate_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos .pfx
    if (path.extname(file.originalname).toLowerCase() === '.pfx') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .pfx são permitidos'));
    }
  }
});

export function setupFiscalRoutes(app: Router, storage: DatabaseStorage) {
  const router = Router();

  // Middleware de autenticação
  router.use(authenticateUser);

  // Rotas para Certificados Digitais
  router.get("/certificates", async (req: Request, res: Response) => {
    try {
      const certificates = await storage.getFiscalCertificates();
      // Não retornar a senha do certificado
      const certificatesSemSenha = certificates.map(cert => {
        const { password, ...certSemSenha } = cert;
        return certSemSenha;
      });
      res.json(certificatesSemSenha);
    } catch (error) {
      console.error("Erro ao obter certificados fiscais:", error);
      res.status(500).json({ message: "Erro ao obter certificados fiscais" });
    }
  });

  router.get("/certificates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getFiscalCertificate(id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificado fiscal não encontrado" });
      }
      // Não retornar a senha do certificado
      const { password, ...certSemSenha } = certificate;
      res.json(certSemSenha);
    } catch (error) {
      console.error("Erro ao obter certificado fiscal:", error);
      res.status(500).json({ message: "Erro ao obter certificado fiscal" });
    }
  });

  router.post("/certificates", upload.single("certificate"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "O arquivo do certificado é obrigatório" });
      }

      const certificateData = insertFiscalCertificateSchema.parse({
        ...req.body,
        pfxFilePath: req.file.path
      });

      const certificate = await storage.createFiscalCertificate(certificateData);
      
      // Não retornar a senha do certificado
      const { password, ...certSemSenha } = certificate;
      res.status(201).json(certSemSenha);
    } catch (error) {
      console.error("Erro ao criar certificado fiscal:", error);
      res.status(500).json({ message: "Erro ao criar certificado fiscal" });
    }
  });

  router.put("/certificates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getFiscalCertificate(id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificado fiscal não encontrado" });
      }

      // Não permitir alterar o arquivo do certificado via PUT
      const { pfxFilePath, ...dataToUpdate } = req.body;

      const updatedCertificate = await storage.updateFiscalCertificate(id, dataToUpdate);
      
      // Não retornar a senha do certificado
      const { password, ...certSemSenha } = updatedCertificate;
      res.json(certSemSenha);
    } catch (error) {
      console.error("Erro ao atualizar certificado fiscal:", error);
      res.status(500).json({ message: "Erro ao atualizar certificado fiscal" });
    }
  });

  router.delete("/certificates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getFiscalCertificate(id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificado fiscal não encontrado" });
      }

      // Excluir o arquivo do certificado
      if (certificate.pfxFilePath && fs.existsSync(certificate.pfxFilePath)) {
        fs.unlinkSync(certificate.pfxFilePath);
      }

      const success = await storage.deleteFiscalCertificate(id);
      if (success) {
        res.json({ message: "Certificado fiscal excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir certificado fiscal" });
      }
    } catch (error) {
      console.error("Erro ao excluir certificado fiscal:", error);
      res.status(500).json({ message: "Erro ao excluir certificado fiscal" });
    }
  });

  // Rotas para NCMs
  router.get("/ncms", async (req: Request, res: Response) => {
    try {
      const ncms = await storage.getFiscalNCMs();
      res.json(ncms);
    } catch (error) {
      console.error("Erro ao obter NCMs:", error);
      res.status(500).json({ message: "Erro ao obter NCMs" });
    }
  });

  router.get("/ncms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ncm = await storage.getFiscalNCM(id);
      if (!ncm) {
        return res.status(404).json({ message: "NCM não encontrado" });
      }
      res.json(ncm);
    } catch (error) {
      console.error("Erro ao obter NCM:", error);
      res.status(500).json({ message: "Erro ao obter NCM" });
    }
  });

  router.get("/ncms/code/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const ncm = await storage.getFiscalNCMByCode(code);
      if (!ncm) {
        return res.status(404).json({ message: "NCM não encontrado" });
      }
      res.json(ncm);
    } catch (error) {
      console.error("Erro ao obter NCM por código:", error);
      res.status(500).json({ message: "Erro ao obter NCM por código" });
    }
  });

  router.post("/ncms", async (req: Request, res: Response) => {
    try {
      const ncmData = insertFiscalNCMSchema.parse(req.body);
      const ncm = await storage.createFiscalNCM(ncmData);
      res.status(201).json(ncm);
    } catch (error) {
      console.error("Erro ao criar NCM:", error);
      res.status(500).json({ message: "Erro ao criar NCM" });
    }
  });

  router.put("/ncms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ncm = await storage.getFiscalNCM(id);
      if (!ncm) {
        return res.status(404).json({ message: "NCM não encontrado" });
      }
      
      const updatedNCM = await storage.updateFiscalNCM(id, req.body);
      res.json(updatedNCM);
    } catch (error) {
      console.error("Erro ao atualizar NCM:", error);
      res.status(500).json({ message: "Erro ao atualizar NCM" });
    }
  });

  router.delete("/ncms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ncm = await storage.getFiscalNCM(id);
      if (!ncm) {
        return res.status(404).json({ message: "NCM não encontrado" });
      }
      
      const success = await storage.deleteFiscalNCM(id);
      if (success) {
        res.json({ message: "NCM excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir NCM" });
      }
    } catch (error) {
      console.error("Erro ao excluir NCM:", error);
      res.status(500).json({ message: "Erro ao excluir NCM" });
    }
  });

  // Rotas para CFOPs
  router.get("/cfops", async (req: Request, res: Response) => {
    try {
      const cfops = await storage.getFiscalCFOPs();
      res.json(cfops);
    } catch (error) {
      console.error("Erro ao obter CFOPs:", error);
      res.status(500).json({ message: "Erro ao obter CFOPs" });
    }
  });

  router.get("/cfops/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cfop = await storage.getFiscalCFOP(id);
      if (!cfop) {
        return res.status(404).json({ message: "CFOP não encontrado" });
      }
      res.json(cfop);
    } catch (error) {
      console.error("Erro ao obter CFOP:", error);
      res.status(500).json({ message: "Erro ao obter CFOP" });
    }
  });

  router.get("/cfops/code/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const cfop = await storage.getFiscalCFOPByCode(code);
      if (!cfop) {
        return res.status(404).json({ message: "CFOP não encontrado" });
      }
      res.json(cfop);
    } catch (error) {
      console.error("Erro ao obter CFOP por código:", error);
      res.status(500).json({ message: "Erro ao obter CFOP por código" });
    }
  });

  router.post("/cfops", async (req: Request, res: Response) => {
    try {
      const cfopData = insertFiscalCFOPSchema.parse(req.body);
      const cfop = await storage.createFiscalCFOP(cfopData);
      res.status(201).json(cfop);
    } catch (error) {
      console.error("Erro ao criar CFOP:", error);
      res.status(500).json({ message: "Erro ao criar CFOP" });
    }
  });

  router.put("/cfops/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cfop = await storage.getFiscalCFOP(id);
      if (!cfop) {
        return res.status(404).json({ message: "CFOP não encontrado" });
      }
      
      const updatedCFOP = await storage.updateFiscalCFOP(id, req.body);
      res.json(updatedCFOP);
    } catch (error) {
      console.error("Erro ao atualizar CFOP:", error);
      res.status(500).json({ message: "Erro ao atualizar CFOP" });
    }
  });

  router.delete("/cfops/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cfop = await storage.getFiscalCFOP(id);
      if (!cfop) {
        return res.status(404).json({ message: "CFOP não encontrado" });
      }
      
      const success = await storage.deleteFiscalCFOP(id);
      if (success) {
        res.json({ message: "CFOP excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir CFOP" });
      }
    } catch (error) {
      console.error("Erro ao excluir CFOP:", error);
      res.status(500).json({ message: "Erro ao excluir CFOP" });
    }
  });

  // Rotas para CSTs
  router.get("/csts", async (req: Request, res: Response) => {
    try {
      const csts = await storage.getFiscalCSTs();
      res.json(csts);
    } catch (error) {
      console.error("Erro ao obter CSTs:", error);
      res.status(500).json({ message: "Erro ao obter CSTs" });
    }
  });

  router.get("/csts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cst = await storage.getFiscalCST(id);
      if (!cst) {
        return res.status(404).json({ message: "CST não encontrado" });
      }
      res.json(cst);
    } catch (error) {
      console.error("Erro ao obter CST:", error);
      res.status(500).json({ message: "Erro ao obter CST" });
    }
  });

  router.post("/csts", async (req: Request, res: Response) => {
    try {
      const cstData = insertFiscalCSTSchema.parse(req.body);
      const cst = await storage.createFiscalCST(cstData);
      res.status(201).json(cst);
    } catch (error) {
      console.error("Erro ao criar CST:", error);
      res.status(500).json({ message: "Erro ao criar CST" });
    }
  });

  router.put("/csts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cst = await storage.getFiscalCST(id);
      if (!cst) {
        return res.status(404).json({ message: "CST não encontrado" });
      }
      
      const updatedCST = await storage.updateFiscalCST(id, req.body);
      res.json(updatedCST);
    } catch (error) {
      console.error("Erro ao atualizar CST:", error);
      res.status(500).json({ message: "Erro ao atualizar CST" });
    }
  });

  router.delete("/csts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cst = await storage.getFiscalCST(id);
      if (!cst) {
        return res.status(404).json({ message: "CST não encontrado" });
      }
      
      const success = await storage.deleteFiscalCST(id);
      if (success) {
        res.json({ message: "CST excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir CST" });
      }
    } catch (error) {
      console.error("Erro ao excluir CST:", error);
      res.status(500).json({ message: "Erro ao excluir CST" });
    }
  });

  // Rotas para configuração fiscal
  router.get("/config", async (req: Request, res: Response) => {
    try {
      const config = await storage.getFiscalConfig();
      res.json(config || {});
    } catch (error) {
      console.error("Erro ao obter configuração fiscal:", error);
      res.status(500).json({ message: "Erro ao obter configuração fiscal" });
    }
  });

  router.post("/config", async (req: Request, res: Response) => {
    try {
      const configData = insertFiscalConfigSchema.parse(req.body);
      const config = await storage.createFiscalConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Erro ao criar configuração fiscal:", error);
      res.status(500).json({ message: "Erro ao criar configuração fiscal" });
    }
  });

  router.put("/config/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getFiscalConfig();
      if (!config) {
        return res.status(404).json({ message: "Configuração fiscal não encontrada" });
      }
      
      const updatedConfig = await storage.updateFiscalConfig(id, req.body);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Erro ao atualizar configuração fiscal:", error);
      res.status(500).json({ message: "Erro ao atualizar configuração fiscal" });
    }
  });

  // Rotas para produtos fiscais
  router.get("/produtos", async (req: Request, res: Response) => {
    try {
      const produtos = await storage.getProdutosFiscais();
      res.json(produtos);
    } catch (error) {
      console.error("Erro ao obter produtos fiscais:", error);
      res.status(500).json({ message: "Erro ao obter produtos fiscais" });
    }
  });

  router.get("/produtos/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const produto = await storage.getProdutoFiscal(id);
      if (!produto) {
        return res.status(404).json({ message: "Produto fiscal não encontrado" });
      }
      res.json(produto);
    } catch (error) {
      console.error("Erro ao obter produto fiscal:", error);
      res.status(500).json({ message: "Erro ao obter produto fiscal" });
    }
  });

  router.get("/produtos/produto/:produtoId", async (req: Request, res: Response) => {
    try {
      const produtoId = parseInt(req.params.produtoId);
      const produto = await storage.getProdutoFiscalByProdutoId(produtoId);
      if (!produto) {
        return res.status(404).json({ message: "Produto fiscal não encontrado" });
      }
      res.json(produto);
    } catch (error) {
      console.error("Erro ao obter produto fiscal por produtoId:", error);
      res.status(500).json({ message: "Erro ao obter produto fiscal por produtoId" });
    }
  });

  router.post("/produtos", async (req: Request, res: Response) => {
    try {
      const produtoData = insertProdutoFiscalSchema.parse(req.body);
      const produto = await storage.createProdutoFiscal(produtoData);
      res.status(201).json(produto);
    } catch (error) {
      console.error("Erro ao criar produto fiscal:", error);
      res.status(500).json({ message: "Erro ao criar produto fiscal" });
    }
  });

  router.put("/produtos/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const produto = await storage.getProdutoFiscal(id);
      if (!produto) {
        return res.status(404).json({ message: "Produto fiscal não encontrado" });
      }
      
      const updatedProduto = await storage.updateProdutoFiscal(id, req.body);
      res.json(updatedProduto);
    } catch (error) {
      console.error("Erro ao atualizar produto fiscal:", error);
      res.status(500).json({ message: "Erro ao atualizar produto fiscal" });
    }
  });

  router.delete("/produtos/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const produto = await storage.getProdutoFiscal(id);
      if (!produto) {
        return res.status(404).json({ message: "Produto fiscal não encontrado" });
      }
      
      const success = await storage.deleteProdutoFiscal(id);
      if (success) {
        res.json({ message: "Produto fiscal excluído com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir produto fiscal" });
      }
    } catch (error) {
      console.error("Erro ao excluir produto fiscal:", error);
      res.status(500).json({ message: "Erro ao excluir produto fiscal" });
    }
  });

  // Rotas para NF-e
  router.get("/nfe", async (req: Request, res: Response) => {
    try {
      const nfes = await storage.getNFes();
      res.json(nfes);
    } catch (error) {
      console.error("Erro ao obter NFes:", error);
      res.status(500).json({ message: "Erro ao obter NFes" });
    }
  });

  router.get("/nfe/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const nfe = await storage.getNFe(id);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      // Obter itens e eventos relacionados
      const itens = await storage.getNFeItens(id);
      const eventos = await storage.getNFeEventos(id);

      res.json({
        ...nfe,
        itens,
        eventos
      });
    } catch (error) {
      console.error("Erro ao obter NFe:", error);
      res.status(500).json({ message: "Erro ao obter NFe" });
    }
  });

  router.get("/nfe/chave/:chave", async (req: Request, res: Response) => {
    try {
      const chave = req.params.chave;
      const nfe = await storage.getNFeByChave(chave);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      // Obter itens e eventos relacionados
      const itens = await storage.getNFeItens(nfe.id);
      const eventos = await storage.getNFeEventos(nfe.id);

      res.json({
        ...nfe,
        itens,
        eventos
      });
    } catch (error) {
      console.error("Erro ao obter NFe por chave:", error);
      res.status(500).json({ message: "Erro ao obter NFe por chave" });
    }
  });

  router.post("/nfe", async (req: Request, res: Response) => {
    try {
      const nfeData = req.body;
      const { itens, ...nfeBasicData } = nfeData;

      // Validar NFe
      const validatedNfe = insertNFeSchema.parse(nfeBasicData);
      const nfe = await storage.createNFe(validatedNfe);

      // Adicionar itens à NFe
      if (itens && Array.isArray(itens)) {
        for (const item of itens) {
          const validatedItem = insertNFeItemSchema.parse({
            ...item,
            nfeId: nfe.id
          });
          await storage.createNFeItem(validatedItem);
        }
      }

      // Obter a NFe completa com itens
      const nfeCompleta = await storage.getNFe(nfe.id);
      const itensCompletos = await storage.getNFeItens(nfe.id);

      res.status(201).json({
        ...nfeCompleta,
        itens: itensCompletos
      });
    } catch (error) {
      console.error("Erro ao criar NFe:", error);
      res.status(500).json({ message: "Erro ao criar NFe" });
    }
  });

  router.put("/nfe/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const nfe = await storage.getNFe(id);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      // Não permitir atualização de NF-e já autorizada
      if (nfe.status === "autorizada") {
        return res.status(400).json({ message: "Não é possível atualizar uma NFe já autorizada" });
      }

      const { itens, ...nfeBasicData } = req.body;
      
      // Atualizar dados básicos da NFe
      const updatedNfe = await storage.updateNFe(id, nfeBasicData);

      // Atualizar itens se fornecidos
      if (itens && Array.isArray(itens)) {
        // Remover itens existentes
        const itensExistentes = await storage.getNFeItens(id);
        for (const item of itensExistentes) {
          await storage.deleteNFeItem(item.id);
        }

        // Adicionar novos itens
        for (const item of itens) {
          const validatedItem = insertNFeItemSchema.parse({
            ...item,
            nfeId: id
          });
          await storage.createNFeItem(validatedItem);
        }
      }

      // Obter a NFe completa com itens atualizados
      const nfeCompleta = await storage.getNFe(id);
      const itensCompletos = await storage.getNFeItens(id);

      res.json({
        ...nfeCompleta,
        itens: itensCompletos
      });
    } catch (error) {
      console.error("Erro ao atualizar NFe:", error);
      res.status(500).json({ message: "Erro ao atualizar NFe" });
    }
  });

  router.delete("/nfe/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const nfe = await storage.getNFe(id);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      // Não permitir exclusão de NF-e já autorizada
      if (nfe.status === "autorizada") {
        return res.status(400).json({ message: "Não é possível excluir uma NFe já autorizada" });
      }
      
      const success = await storage.deleteNFe(id);
      if (success) {
        res.json({ message: "NFe excluída com sucesso" });
      } else {
        res.status(500).json({ message: "Erro ao excluir NFe" });
      }
    } catch (error) {
      console.error("Erro ao excluir NFe:", error);
      res.status(500).json({ message: "Erro ao excluir NFe" });
    }
  });

  // Rota para incluir eventos na NF-e (cancelamento, carta de correção, etc.)
  router.post("/nfe/:id/eventos", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const nfe = await storage.getNFe(id);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      const eventoData = insertNFeEventoSchema.parse({
        ...req.body,
        nfeId: id
      });
      
      const evento = await storage.createNFeEvento(eventoData);

      // Se for um evento de cancelamento e for concluído, atualizar o status da NF-e
      if (evento.tipoEvento === "cancelamento" && evento.status === "concluido") {
        await storage.updateNFe(id, { status: "cancelada" });
      }

      res.status(201).json(evento);
    } catch (error) {
      console.error("Erro ao criar evento de NFe:", error);
      res.status(500).json({ message: "Erro ao criar evento de NFe" });
    }
  });

  router.get("/nfe/:id/eventos", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const nfe = await storage.getNFe(id);
      if (!nfe) {
        return res.status(404).json({ message: "NFe não encontrada" });
      }

      const eventos = await storage.getNFeEventos(id);
      res.json(eventos);
    } catch (error) {
      console.error("Erro ao obter eventos de NFe:", error);
      res.status(500).json({ message: "Erro ao obter eventos de NFe" });
    }
  });

  // Associar as rotas ao caminho /api/fiscal
  app.use("/api/fiscal", router);
}