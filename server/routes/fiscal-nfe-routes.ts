import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { AdvancedNFeProcessor } from '../fiscal/advanced-nfe-processor';
import { XMLParserService } from '../fiscal/xml-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar o upload de arquivos XML
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'xml');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const xmlUpload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    // Aceitar apenas arquivos XML
    if (path.extname(file.originalname).toLowerCase() !== '.xml') {
      return cb(new Error('Apenas arquivos XML são permitidos'));
    }
    cb(null, true);
  }
});

/**
 * Configura as rotas para o módulo fiscal avançado de NFe
 */
export function setupFiscalNFeRoutes(app: Express, storage: IStorage, middlewares: any) {
  const { ensureAuthenticated, ensurePermission } = middlewares;
  const xmlParser = new XMLParserService();
  const nfeProcessor = new AdvancedNFeProcessor(storage);

  // Rota para importar XML de NFe
  app.post('/api/fiscal/nfe/import', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    xmlUpload.single('xml'), 
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            message: 'Nenhum arquivo XML enviado' 
          });
        }
        
        // Ler o conteúdo do arquivo XML
        const xmlFilePath = req.file.path;
        const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
        
        // Importar o XML
        const tipoEntrada = req.body.tipoEntrada || 'compra';
        const result = await nfeProcessor.importNFeXml(xmlContent, tipoEntrada);
        
        // Limpar o arquivo temporário
        fs.unlinkSync(xmlFilePath);
        
        res.json(result);
      } catch (error: any) {
        console.error('Erro ao importar XML:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao importar XML: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para gerar XML de NFe
  app.get('/api/fiscal/nfe/:id/xml', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar a NFe no banco
        const nfe = await storage.getNFe(id);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Se a NFe já tiver XML armazenado, retornar
        if (nfe.xml) {
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename="nfe-${nfe.numero}.xml"`);
          return res.send(nfe.xml);
        }
        
        // Gerar o XML da NFe
        const xml = await nfeProcessor.generateNFeXml(id);
        
        // Salvar o XML gerado no banco
        await storage.updateNFe(id, { xml });
        
        // Enviar como download
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="nfe-${nfe.numero}.xml"`);
        res.send(xml);
      } catch (error: any) {
        console.error('Erro ao gerar XML:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao gerar XML: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para enviar NFe para SEFAZ
  app.post('/api/fiscal/nfe/:id/send', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Enviar a NFe para a SEFAZ
        const result = await nfeProcessor.sendNFeToSefaz(id);
        
        res.json(result);
      } catch (error: any) {
        console.error('Erro ao enviar NFe para SEFAZ:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao enviar NFe para SEFAZ: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para consultar NFe na SEFAZ
  app.get('/api/fiscal/nfe/:id/consult', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Consultar a NFe na SEFAZ
        const result = await nfeProcessor.consultarNFe(id);
        
        res.json(result);
      } catch (error: any) {
        console.error('Erro ao consultar NFe na SEFAZ:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao consultar NFe na SEFAZ: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para cancelar NFe
  app.post('/api/fiscal/nfe/:id/cancel', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { justificativa } = req.body;
        
        if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
          return res.status(400).json({ 
            success: false, 
            message: 'A justificativa é obrigatória e deve ter entre 15 e 255 caracteres' 
          });
        }
        
        // Cancelar a NFe
        const result = await nfeProcessor.cancelNFe(id, justificativa);
        
        res.json(result);
      } catch (error: any) {
        console.error('Erro ao cancelar NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao cancelar NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para gerar DANFE em PDF
  app.get('/api/fiscal/nfe/:id/danfe', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar a NFe no banco
        const nfe = await storage.getNFe(id);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Gerar o PDF DANFE
        const pdfBuffer = await nfeProcessor.gerarDANFE(id);
        
        // Enviar como download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="danfe-${nfe.numero}.pdf"`);
        res.send(pdfBuffer);
      } catch (error: any) {
        console.error('Erro ao gerar DANFE:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao gerar DANFE: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para listar NFes com paginação, filtros e ordenação
  app.get('/api/fiscal/nfe', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const { 
          page = 1, 
          limit = 10, 
          status,
          startDate,
          endDate,
          numero,
          chaveAcesso,
          destinatarioId,
          emitenteId
        } = req.query;
        
        // Construir filtros
        const filters: any = {};
        
        if (status) filters.status = status;
        if (destinatarioId) filters.destinatarioId = parseInt(destinatarioId as string);
        if (emitenteId) filters.emitenteId = parseInt(emitenteId as string);
        if (numero) filters.numero = numero;
        if (chaveAcesso) filters.chaveAcesso = chaveAcesso;
        
        // Converter datas
        if (startDate) {
          filters.dataEmissaoStart = new Date(startDate as string);
        }
        
        if (endDate) {
          filters.dataEmissaoEnd = new Date(endDate as string);
        }
        
        // Buscar as NFes com os filtros aplicados
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        const nfes = await storage.getNFes(
          parseInt(limit as string),
          offset,
          filters
        );
        
        // Contar o total de registros para paginação
        const total = await storage.countNFes(filters);
        
        res.json({
          success: true,
          data: nfes,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string))
          }
        });
      } catch (error: any) {
        console.error('Erro ao listar NFes:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao listar NFes: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para obter detalhes de uma NFe
  app.get('/api/fiscal/nfe/:id', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar a NFe no banco
        const nfe = await storage.getNFe(id);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Buscar itens da NFe
        const itens = await storage.getNFeItens(id);
        
        // Buscar eventos da NFe
        const eventos = await storage.getNFeEventos(id);
        
        // Buscar informações do emitente/destinatário
        let emitente = null;
        let destinatario = null;
        
        if (nfe.emitenteId) {
          // Tentar buscar como fornecedor
          emitente = await storage.getSupplier(nfe.emitenteId);
          
          // Se não encontrar, tentar buscar como a própria empresa
          if (!emitente && nfe.tipoOperacao === '1') {
            emitente = await storage.getCompany();
          }
        }
        
        if (nfe.destinatarioId) {
          if (nfe.tipoOperacao === '1') {
            // Para saída, o destinatário é um cliente
            destinatario = await storage.getCustomer(nfe.destinatarioId);
          } else {
            // Para entrada, o destinatário é um fornecedor
            destinatario = await storage.getSupplier(nfe.destinatarioId);
          }
        }
        
        res.json({
          success: true,
          data: {
            nfe,
            itens,
            eventos,
            emitente,
            destinatario
          }
        });
      } catch (error: any) {
        console.error('Erro ao obter detalhes da NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao obter detalhes da NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para criar nova NFe
  app.post('/api/fiscal/nfe', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        const nfeData = req.body;
        
        // Adicionar campos padrão
        nfeData.status = 'em_digitacao';
        nfeData.xml = null;
        nfeData.mensagemSefaz = null;
        nfeData.numeroProtocolo = null;
        
        // Criar a NFe no banco
        const nfe = await storage.createNFe(nfeData);
        
        // Registrar o evento de criação
        await storage.createNFeEvento({
          nfeId: nfe.id,
          tipo: 'criacao',
          data: new Date(),
          status: 'sucesso',
          mensagem: 'NFe criada com sucesso',
          xml: null
        });
        
        res.status(201).json({
          success: true,
          data: nfe,
          message: 'NFe criada com sucesso'
        });
      } catch (error: any) {
        console.error('Erro ao criar NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao criar NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para atualizar NFe
  app.patch('/api/fiscal/nfe/:id', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const nfeData = req.body;
        
        // Buscar a NFe no banco
        const nfe = await storage.getNFe(id);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Verificar se a NFe pode ser atualizada
        if (['autorizada', 'cancelada', 'denegada'].includes(nfe.status)) {
          return res.status(400).json({ 
            success: false, 
            message: `NFe não pode ser atualizada pois está com status '${nfe.status}'` 
          });
        }
        
        // Atualizar a NFe no banco
        const updatedNfe = await storage.updateNFe(id, nfeData);
        
        // Registrar o evento de atualização
        await storage.createNFeEvento({
          nfeId: id,
          tipo: 'atualizacao',
          data: new Date(),
          status: 'sucesso',
          mensagem: 'NFe atualizada com sucesso',
          xml: null
        });
        
        res.json({
          success: true,
          data: updatedNfe,
          message: 'NFe atualizada com sucesso'
        });
      } catch (error: any) {
        console.error('Erro ao atualizar NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao atualizar NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para adicionar item à NFe
  app.post('/api/fiscal/nfe/:id/item', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const nfeId = parseInt(req.params.id);
        const itemData = req.body;
        
        // Buscar a NFe no banco
        const nfe = await storage.getNFe(nfeId);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Verificar se a NFe pode ser atualizada
        if (['autorizada', 'cancelada', 'denegada'].includes(nfe.status)) {
          return res.status(400).json({ 
            success: false, 
            message: `NFe não pode ser atualizada pois está com status '${nfe.status}'` 
          });
        }
        
        // Adicionar o nfeId ao item
        itemData.nfeId = nfeId;
        
        // Buscar o número do próximo item
        const itens = await storage.getNFeItens(nfeId);
        itemData.numeroItem = (itens.length + 1).toString();
        
        // Criar o item no banco
        const item = await storage.createNFeItem(itemData);
        
        // Atualizar o valor total da NFe
        const totalItens = itens.reduce(
          (total, item) => total + parseFloat(item.valorTotal.toString()), 
          parseFloat(itemData.valorTotal)
        );
        
        await storage.updateNFe(nfeId, { valorTotal: totalItens });
        
        res.status(201).json({
          success: true,
          data: item,
          message: 'Item adicionado com sucesso'
        });
      } catch (error: any) {
        console.error('Erro ao adicionar item à NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao adicionar item à NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para atualizar item da NFe
  app.patch('/api/fiscal/nfe/item/:id', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const itemData = req.body;
        
        // Buscar o item no banco
        const item = await storage.getNFeItem(id);
        if (!item) {
          return res.status(404).json({ 
            success: false, 
            message: 'Item não encontrado' 
          });
        }
        
        // Buscar a NFe para verificar se pode ser atualizada
        const nfe = await storage.getNFe(item.nfeId);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Verificar se a NFe pode ser atualizada
        if (['autorizada', 'cancelada', 'denegada'].includes(nfe.status)) {
          return res.status(400).json({ 
            success: false, 
            message: `NFe não pode ser atualizada pois está com status '${nfe.status}'` 
          });
        }
        
        // Atualizar o item no banco
        const updatedItem = await storage.updateNFeItem(id, itemData);
        
        // Recalcular o valor total da NFe
        const itens = await storage.getNFeItens(item.nfeId);
        const totalItens = itens.reduce(
          (total, item) => total + parseFloat(item.valorTotal.toString()), 
          0
        );
        
        await storage.updateNFe(item.nfeId, { valorTotal: totalItens });
        
        res.json({
          success: true,
          data: updatedItem,
          message: 'Item atualizado com sucesso'
        });
      } catch (error: any) {
        console.error('Erro ao atualizar item da NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao atualizar item da NFe: ${error.message}` 
        });
      }
    }
  );
  
  // Rota para remover item da NFe
  app.delete('/api/fiscal/nfe/item/:id', 
    ensureAuthenticated, 
    ensurePermission('fiscal'), 
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar o item no banco
        const item = await storage.getNFeItem(id);
        if (!item) {
          return res.status(404).json({ 
            success: false, 
            message: 'Item não encontrado' 
          });
        }
        
        // Buscar a NFe para verificar se pode ser atualizada
        const nfe = await storage.getNFe(item.nfeId);
        if (!nfe) {
          return res.status(404).json({ 
            success: false, 
            message: 'NFe não encontrada' 
          });
        }
        
        // Verificar se a NFe pode ser atualizada
        if (['autorizada', 'cancelada', 'denegada'].includes(nfe.status)) {
          return res.status(400).json({ 
            success: false, 
            message: `NFe não pode ser atualizada pois está com status '${nfe.status}'` 
          });
        }
        
        // Remover o item do banco
        const success = await storage.deleteNFeItem(id);
        
        if (!success) {
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao remover item' 
          });
        }
        
        // Recalcular o valor total da NFe
        const itens = await storage.getNFeItens(item.nfeId);
        const totalItens = itens.reduce(
          (total, item) => total + parseFloat(item.valorTotal.toString()), 
          0
        );
        
        await storage.updateNFe(item.nfeId, { valorTotal: totalItens });
        
        res.json({
          success: true,
          message: 'Item removido com sucesso'
        });
      } catch (error: any) {
        console.error('Erro ao remover item da NFe:', error);
        res.status(500).json({ 
          success: false, 
          message: `Erro ao remover item da NFe: ${error.message}` 
        });
      }
    }
  );
}