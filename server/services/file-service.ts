import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Diretório para os uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const CHAT_UPLOADS_DIR = path.join(UPLOADS_DIR, 'chat');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Garantir que os diretórios existam com tratamento de erros
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Diretório criado: ${UPLOADS_DIR}`);
  }
  
  if (!fs.existsSync(CHAT_UPLOADS_DIR)) {
    fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });
    console.log(`Diretório criado: ${CHAT_UPLOADS_DIR}`);
  }
  
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    console.log(`Diretório criado: ${THUMBNAILS_DIR}`);
  }
  
  // Verificar permissões de escrita
  const testPaths = [UPLOADS_DIR, CHAT_UPLOADS_DIR, THUMBNAILS_DIR];
  for (const testPath of testPaths) {
    const testFile = path.join(testPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`Diretório com permissão de escrita: ${testPath}`);
  }
} catch (error) {
  console.error('Erro ao criar ou verificar diretórios de upload:', error);
  // Não interromper execução, o middleware Multer tratará os erros quando necessário
}

// Configuração de armazenamento para o multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, CHAT_UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Gerar nome único baseado em timestamp + uuid para evitar colisões
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para permitir apenas certos tipos de arquivos
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Outros tipos comuns
    'application/zip', 'application/x-zip-compressed'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Configuração do multer
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Aumentado para 50MB para compatibilidade com express-fileupload
  }
});

/**
 * Comprime imagem e retorna o caminho da imagem comprimida
 * @param imagePath Caminho para a imagem original
 * @returns Caminho para a imagem comprimida
 */
export async function compressImage(imagePath: string): Promise<string> {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    const basename = path.basename(imagePath, ext);
    const compressedPath = path.join(UPLOADS_DIR, `${basename}-compressed${ext}`);
    
    await sharp(imagePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(compressedPath);
    
    return compressedPath;
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    return imagePath; // Retorna o caminho original em caso de erro
  }
}

/**
 * Gera thumbnail para uma imagem
 * @param imagePath Caminho para a imagem original
 * @returns Caminho para o thumbnail ou null se falhar
 */
export async function generateThumbnail(imagePath: string): Promise<string | null> {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    const basename = path.basename(imagePath, ext);
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${basename}-thumbnail${ext}`);
    
    await sharp(imagePath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    return null;
  }
}

/**
 * Configura o express para servir arquivos estáticos
 */
export function serveStaticFiles(app: express.Express) {
  // Servir uploads diretamente
  app.use('/uploads', express.static(UPLOADS_DIR));
  
  // Rota para acessar thumbnails
  app.use('/thumbnails', express.static(THUMBNAILS_DIR));
  
  // Rota para acessar uploads do chat
  app.use('/chat-uploads', express.static(CHAT_UPLOADS_DIR));
}