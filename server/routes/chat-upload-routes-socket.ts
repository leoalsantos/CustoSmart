import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { IStorage } from '../storage';
import { ensureAuthenticated } from '../middlewares/auth';
import sharp from 'sharp';
import { UploadedFile } from 'express-fileupload';

// Configurar o diretório de uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const CHAT_UPLOADS_DIR = path.join(UPLOADS_DIR, 'chat');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Verificar e criar diretórios se necessário
[UPLOADS_DIR, CHAT_UPLOADS_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório ${dir} criado com sucesso.`);
    } catch (error) {
      console.error(`Erro ao criar diretório ${dir}:`, error);
    }
  }
});

// Verificar permissões de escrita
[UPLOADS_DIR, CHAT_UPLOADS_DIR, THUMBNAILS_DIR].forEach(dir => {
  try {
    const testPath = path.join(dir, '.write-test');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    console.log(`Diretório com permissão de escrita: ${dir}`);
  } catch (error) {
    console.error(`Erro ao verificar permissões de escrita em ${dir}:`, error);
  }
});

// Função para gerar um nome de arquivo único com timestamp
function generateUniqueFileName(originalName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  return `chat-${timestamp}-${randomString}${ext}`;
}

// Garantir que os diretórios de upload existam
function ensureUploadDirectories() {
  // Verificação da existência dos diretórios
  [UPLOADS_DIR, CHAT_UPLOADS_DIR, THUMBNAILS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Diretório ${dir} criado com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar diretório ${dir}:`, error);
      }
    }
  });
}

// Gerar thumbnail para imagens
async function generateThumbnail(filePath: string): Promise<string | null> {
  try {
    // Verificar se o diretório de thumbnails existe
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      try {
        fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
        console.log(`Diretório ${THUMBNAILS_DIR} criado para thumbnails`);
      } catch (error) {
        console.error(`Erro ao criar diretório ${THUMBNAILS_DIR}:`, error);
        return null;
      }
    }
    
    // Verificar se o arquivo original existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo original não encontrado: ${filePath}`);
      return null;
    }
    
    const fileName = path.basename(filePath);
    const thumbnailPath = path.join(THUMBNAILS_DIR, `thumb_${fileName}`);
    
    console.log(`Gerando thumbnail de ${filePath} para ${thumbnailPath}`);
    
    // Redimensionar imagem para thumbnail com tratamento de erro melhorado
    try {
      await sharp(filePath)
        .resize({ width: 200, height: 200, fit: 'inside' })
        .toFile(thumbnailPath);
        
      console.log(`Thumbnail gerado com sucesso: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (sharpError) {
      console.error(`Erro ao processar imagem com sharp: ${sharpError.message}`);
      return null;
    }
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    return null;
  }
}

// Configurar rotas para upload de arquivos
export function setupChatUploadRoutesSocket(app: express.Express, storage: IStorage) {
  // Verificar diretórios
  app.get('/api/chat/check-upload-dirs', ensureAuthenticated, (req: Request, res: Response) => {
    try {
      const dirs = [
        { name: 'uploads', path: UPLOADS_DIR },
        { name: 'chat_uploads', path: CHAT_UPLOADS_DIR },
        { name: 'thumbnails', path: THUMBNAILS_DIR }
      ];
      
      const result: Record<string, boolean> = {};
      
      // Verificar e criar diretórios se necessário
      dirs.forEach(dir => {
        const exists = fs.existsSync(dir.path);
        result[dir.name] = exists;
        
        if (!exists) {
          try {
            fs.mkdirSync(dir.path, { recursive: true });
            result[`${dir.name}_created`] = true;
          } catch (error) {
            result[`${dir.name}_error`] = true;
          }
        }
      });
      
      // Verificar permissões de escrita
      dirs.forEach(dir => {
        try {
          const testFile = path.join(dir.path, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          result[`${dir.name}_writable`] = true;
        } catch (error) {
          result[`${dir.name}_writable`] = false;
        }
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para upload de arquivos do chat com express-fileupload
  app.post('/api/chat/upload', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Iniciando processamento de upload de arquivo com express-fileupload");
      console.log("Headers:", req.headers);
      console.log("Corpo da requisição:", req.body ? Object.keys(req.body) : "Sem corpo");
      
      // Verificar se temos arquivos na requisição
      console.log("req.files:", req.files ? "Presente" : "Ausente");
      if (req.files) {
        console.log("Chaves de req.files:", Object.keys(req.files));
      }
      
      if (!req.files || Object.keys(req.files).length === 0) {
        console.log("Nenhum arquivo recebido na requisição");
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      // Verificar se o diretório de destino existe
      ensureUploadDirectories();
      
      // Extrair arquivo enviado
      let uploadedFile: UploadedFile;
      
      try {
        if (req.files.file) {
          if (Array.isArray(req.files.file)) {
            // Se for um array, usar o primeiro arquivo
            uploadedFile = req.files.file[0] as UploadedFile;
            console.log("Arquivo recebido como array, usando o primeiro");
          } else {
            // Se for um objeto único
            uploadedFile = req.files.file as UploadedFile;
            console.log("Arquivo recebido como objeto único");
          }
        } else {
          // Tentar encontrar qualquer arquivo (primeiro encontrado)
          const fileKeys = Object.keys(req.files) as string[];
          if (fileKeys.length > 0) {
            const firstKey = fileKeys[0];
            // Acesso seguro com verificação de tipo
            const fileEntry = req.files[firstKey];
            
            if (Array.isArray(fileEntry)) {
              uploadedFile = fileEntry[0] as UploadedFile;
              console.log(`Usando arquivo de chave alternativa: ${firstKey} (array)`);
            } else {
              uploadedFile = fileEntry as UploadedFile;
              console.log(`Usando arquivo de chave alternativa: ${firstKey} (objeto)`);
            }
          } else {
            console.log("Nenhum arquivo utilizável encontrado");
            return res.status(400).json({ message: 'Formato de arquivo inválido' });
          }
        }
      } catch (err) {
        console.error("Erro ao processar arquivo enviado:", err);
        return res.status(500).json({ message: 'Erro interno ao processar arquivo' });
      }
      
      console.log(`Arquivo recebido: ${uploadedFile.name} (${uploadedFile.mimetype}, ${uploadedFile.size} bytes)`);
      
      // Extrair informações do request
      const userId = (req.user as Express.User).id;
      const roomId = parseInt(req.body.roomId || '0');
      
      if (!roomId) {
        console.log("ID da sala não fornecido");
        return res.status(400).json({ message: 'ID da sala é obrigatório' });
      }
      
      console.log(`Verificando participação do usuário ${userId} na sala ${roomId}`);
      
      // Verificar se o usuário é participante da sala
      const isParticipant = await storage.isChatRoomParticipant(roomId, userId);
      if (!isParticipant) {
        console.log(`Usuário ${userId} não é participante da sala ${roomId}`);
        return res.status(403).json({ message: 'Você não é participante desta sala' });
      }
      
      console.log(`Usuário ${userId} autorizado, processando arquivo...`);
      
      // Gerar um nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = path.extname(uploadedFile.name);
      const fileName = `chat-${timestamp}-${randomString}${fileExt}`;
      const filePath = path.join(CHAT_UPLOADS_DIR, fileName);
      
      console.log(`Salvando arquivo como: ${filePath}`);
      
      // Mover o arquivo para o diretório de destino
      await uploadedFile.mv(filePath);
      console.log(`Arquivo salvo com sucesso`);
      
      // Processar thumbnail se for uma imagem
      let thumbnailPath: string | null = null;
      
      if (uploadedFile.mimetype.startsWith('image/')) {
        console.log(`Arquivo é uma imagem, gerando thumbnail...`);
        
        try {
          const thumbPath = await generateThumbnail(filePath);
          if (thumbPath) {
            thumbnailPath = path.basename(thumbPath);
            console.log(`Thumbnail gerado com sucesso: ${thumbnailPath}`);
          } else {
            console.log(`Não foi possível gerar thumbnail`);
          }
        } catch (error: any) {
          console.error(`Erro ao gerar thumbnail: ${error.message}`);
        }
      }
      
      // Gerar URLs para acesso ao arquivo
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/chat-uploads/${fileName}`;
      const thumbnailUrl = thumbnailPath ? `${baseUrl}/thumbnails/${thumbnailPath}` : null;
      
      console.log(`URLs geradas: 
        - Arquivo: ${fileUrl}
        - Thumbnail: ${thumbnailUrl || 'Nenhum'}`);
      
      // Salvar informações do upload no banco de dados
      console.log(`Salvando informações no banco de dados...`);
      
      const upload = await storage.createChatUpload({
        userId,
        roomId,
        fileName: fileName,
        originalName: uploadedFile.name,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        thumbnailPath: thumbnailPath,
        fileUrl: fileUrl,
        thumbnailUrl: thumbnailUrl,
        createdAt: new Date()
      });
      
      console.log(`Upload salvo no banco de dados com sucesso: ID ${upload.id}`);
      
      return res.status(201).json(upload);
      
    } catch (error: any) {
      console.error('Erro no processamento do upload:', error);
      return res.status(500).json({ 
        message: `Erro no processamento do upload: ${error.message}`,
        error: error.name || 'UnknownError'
      });
    }
  });
  
  // Rota para listar uploads de uma sala
  app.get('/api/chat/:roomId/uploads', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = (req.user as Express.User).id;
      
      // Verificar se o usuário é participante da sala
      const isParticipant = await storage.isChatRoomParticipant(roomId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'Você não é participante desta sala' });
      }
      
      const uploads = await storage.getChatUploads(roomId);
      
      // Adicionar URLs para acesso aos arquivos
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const uploadsWithUrls = uploads.map(upload => {
        // Verificar se já tem URLs definidas
        if (upload.fileUrl && upload.fileUrl.startsWith('http')) {
          return upload;
        }
        
        // Caso contrário, adicionar as URLs
        const fileUrl = `${baseUrl}/chat-uploads/${upload.fileName}`;
        const thumbnailUrl = upload.thumbnailPath 
          ? `${baseUrl}/thumbnails/${upload.thumbnailPath}` 
          : null;
          
        return {
          ...upload,
          fileUrl,
          thumbnailUrl
        };
      });
      
      res.json(uploadsWithUrls);
      
    } catch (error: any) {
      console.error('Erro ao obter uploads:', error);
      res.status(500).json({ message: `Erro ao obter uploads: ${error.message}` });
    }
  });
  
  // Rota para excluir um upload
  app.delete('/api/chat/upload/:id', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      // Obter informações do upload
      const upload = await storage.getChatUpload(uploadId);
      
      if (!upload) {
        return res.status(404).json({ message: 'Upload não encontrado' });
      }
      
      // Verificar se o usuário é o proprietário do upload ou um administrador
      if (upload.userId !== userId && (req.user as Express.User).role !== 'admin') {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este arquivo' });
      }
      
      // Excluir arquivo físico
      const filePath = path.join(CHAT_UPLOADS_DIR, upload.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Excluir thumbnail se existir
      if (upload.thumbnailPath) {
        const thumbnailPath = path.join(THUMBNAILS_DIR, upload.thumbnailPath);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      // Excluir do banco de dados
      const success = await storage.deleteChatUpload(uploadId);
      
      if (success) {
        res.status(200).json({ message: 'Upload excluído com sucesso' });
      } else {
        res.status(500).json({ message: 'Erro ao excluir upload do banco de dados' });
      }
      
    } catch (error: any) {
      console.error('Erro ao excluir upload:', error);
      res.status(500).json({ message: `Erro ao excluir upload: ${error.message}` });
    }
  });
}