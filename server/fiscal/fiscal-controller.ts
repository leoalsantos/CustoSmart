import { Express, Request, Response } from 'express';
import { NFe, NFeItem, FiscalConfig, FiscalCertificate } from '@shared/schema';
import sefazService from './sefaz-service';
import { IStorage } from '../storage';
import { XMLParserService } from './xml-parser';

/**
 * Controlador para o módulo fiscal
 */
export class FiscalController {
  private storage: IStorage;
  private xmlParser: XMLParserService;
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.xmlParser = new XMLParserService();
  }
  
  /**
   * Configura as rotas do módulo fiscal
   */
  configureRoutes(app: Express) {
    // Rota para enviar NF-e para a SEFAZ
    app.post('/api/fiscal/nfes/:id/enviar', async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar a NF-e, itens, configuração e certificado
        const nfe = await this.storage.getNFeById(id);
        if (!nfe) {
          return res.status(404).json({ success: false, message: 'NF-e não encontrada' });
        }
        
        // Verificar se a NF-e já foi autorizada ou está em processo de autorização
        if (nfe.status === 'autorizada' || nfe.status === 'enviada') {
          return res.status(400).json({ 
            success: false, 
            message: `NF-e já ${nfe.status === 'autorizada' ? 'autorizada' : 'enviada'}` 
          });
        }
        
        // Buscar itens da NF-e
        const itens = await this.storage.getNFeItems(id);
        if (!itens || itens.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'NF-e não possui itens. Adicione pelo menos um item antes de enviar.'
          });
        }
        
        // Buscar configuração fiscal e certificado
        const config = await this.storage.getFiscalConfig();
        if (!config) {
          return res.status(400).json({ 
            success: false, 
            message: 'Configuração fiscal não encontrada. Configure o módulo fiscal primeiro.'
          });
        }
        
        if (!config.certificadoId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não configurado. Adicione um certificado nas configurações fiscais.'
          });
        }
        
        const certificado = await this.storage.getFiscalCertificateById(config.certificadoId);
        if (!certificado) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não encontrado. Verifique a configuração fiscal.'
          });
        }
        
        // Buscar dados da empresa
        const company = await this.storage.getCompany();
        if (!company || !company.cnpj) {
          return res.status(400).json({ 
            success: false, 
            message: 'Dados da empresa não configurados. Configure o cadastro da empresa.'
          });
        }
        
        // Buscar dados do destinatário
        const destinatario = await this.storage.getCustomer(nfe.destinatarioId);
        if (!destinatario) {
          return res.status(400).json({ 
            success: false, 
            message: 'Destinatário não encontrado.'
          });
        }
        
        // Atualizar status da NF-e para 'enviada'
        await this.storage.updateNFe(id, { status: 'enviada' });
        
        // Criar evento de envio
        await this.storage.createNFeEvent({
          nfeId: id,
          tipo: 'envio',
          status: 'em_processamento',
          dataEvento: new Date(),
          mensagem: 'Enviando NFe para SEFAZ...'
        });
        
        // Gerar XML da NF-e
        const xml = await sefazService.gerarXmlNFe(
          nfe, 
          itens, 
          config, 
          certificado, 
          company, 
          destinatario
        );
        
        // Carregar certificado
        const certData = await sefazService.loadCertificate(certificado);
        
        // Assinar XML
        const xmlAssinado = await sefazService.assinarXml(xml, certData);
        
        // Salvar XML assinado na NF-e
        await this.storage.updateNFe(id, { xmlEnvio: xmlAssinado });
        
        // Enviar para a SEFAZ
        const resultadoEnvio = await sefazService.enviarNFe(xmlAssinado, config, certificado);
        
        // Criar evento com o resultado do envio
        await this.storage.createNFeEvent({
          nfeId: id,
          tipo: 'retorno',
          status: resultadoEnvio.success ? 'sucesso' : 'erro',
          dataEvento: new Date(),
          mensagem: resultadoEnvio.mensagem,
          xml: resultadoEnvio.xml
        });
        
        // Atualizar NF-e com base no resultado
        if (resultadoEnvio.success) {
          await this.storage.updateNFe(id, {
            status: 'autorizada',
            chave: sefazService.extrairChaveNFe(resultadoEnvio.xml || ''),
            xmlRetorno: resultadoEnvio.xml
          });
        } else {
          await this.storage.updateNFe(id, { status: 'rejeitada' });
        }
        
        return res.json({ 
          success: resultadoEnvio.success, 
          message: resultadoEnvio.mensagem,
          protocolo: resultadoEnvio.protocolo
        });
      } catch (error) {
        console.error('Erro ao enviar NF-e:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao processar envio: ${(error as Error).message}`
        });
      }
    });
    
    // Rota para cancelar NF-e
    app.post('/api/fiscal/nfes/:id/cancelar', async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { justificativa, protocolo } = req.body;
        
        if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
          return res.status(400).json({ 
            success: false, 
            message: 'A justificativa deve ter entre 15 e 255 caracteres'
          });
        }
        
        if (!protocolo) {
          return res.status(400).json({ 
            success: false, 
            message: 'Protocolo de autorização é obrigatório'
          });
        }
        
        // Buscar a NF-e, configuração e certificado
        const nfe = await this.storage.getNFeById(id);
        if (!nfe) {
          return res.status(404).json({ success: false, message: 'NF-e não encontrada' });
        }
        
        // Verificar se a NF-e está em estado que permita cancelamento
        if (nfe.status !== 'autorizada') {
          return res.status(400).json({ 
            success: false, 
            message: 'Apenas NF-e autorizada pode ser cancelada'
          });
        }
        
        // Buscar configuração fiscal e certificado
        const config = await this.storage.getFiscalConfig();
        if (!config || !config.certificadoId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não configurado'
          });
        }
        
        const certificado = await this.storage.getFiscalCertificateById(config.certificadoId);
        if (!certificado) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não encontrado'
          });
        }
        
        // Cancelar na SEFAZ
        const resultadoCancelamento = await sefazService.cancelarNFe(
          nfe.chave,
          protocolo,
          justificativa,
          config,
          certificado
        );
        
        // Criar evento com o resultado do cancelamento
        await this.storage.createNFeEvent({
          nfeId: id,
          tipo: 'cancelamento',
          status: resultadoCancelamento.success ? 'sucesso' : 'erro',
          dataEvento: new Date(),
          mensagem: resultadoCancelamento.mensagem,
          xml: resultadoCancelamento.xml
        });
        
        // Atualizar NF-e com base no resultado
        if (resultadoCancelamento.success) {
          await this.storage.updateNFe(id, {
            status: 'cancelada',
            motivoCancelamento: justificativa,
            dataCancelamento: new Date(),
            xmlCancelamento: resultadoCancelamento.xml
          });
        }
        
        return res.json({ 
          success: resultadoCancelamento.success, 
          message: resultadoCancelamento.mensagem,
          protocolo: resultadoCancelamento.protocolo
        });
      } catch (error) {
        console.error('Erro ao cancelar NF-e:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao processar cancelamento: ${(error as Error).message}`
        });
      }
    });
    
    // Rota para consultar status do serviço
    app.get('/api/fiscal/status-servico', async (req: Request, res: Response) => {
      try {
        const uf = req.query.uf as string || 'MG';
        
        // Buscar configuração fiscal e certificado
        const config = await this.storage.getFiscalConfig();
        if (!config || !config.certificadoId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não configurado'
          });
        }
        
        const certificado = await this.storage.getFiscalCertificateById(config.certificadoId);
        if (!certificado) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não encontrado'
          });
        }
        
        // Consultar status
        const resultado = await sefazService.consultarStatusServico(uf, config, certificado);
        
        return res.json(resultado);
      } catch (error) {
        console.error('Erro ao consultar status do serviço:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao consultar: ${(error as Error).message}`
        });
      }
    });
    
    // Rota para gerar DANFE
    app.get('/api/fiscal/nfes/:id/danfe', async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        
        // Buscar a NF-e
        const nfe = await this.storage.getNFeById(id);
        if (!nfe) {
          return res.status(404).json({ success: false, message: 'NF-e não encontrada' });
        }
        
        // Verificar se a NF-e está autorizada
        if (nfe.status !== 'autorizada') {
          return res.status(400).json({ 
            success: false, 
            message: 'Apenas NF-e autorizada possui DANFE'
          });
        }
        
        // Verificar se o XML da NF-e autorizada existe
        if (!nfe.xmlRetorno) {
          return res.status(400).json({ 
            success: false, 
            message: 'XML da NF-e autorizada não encontrado'
          });
        }
        
        // Gerar DANFE
        const danfePdf = await sefazService.gerarDANFE(nfe.xmlRetorno);
        
        // Enviar como anexo PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="NFe-${nfe.numero}.pdf"`);
        return res.send(danfePdf);
      } catch (error) {
        console.error('Erro ao gerar DANFE:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao gerar DANFE: ${(error as Error).message}`
        });
      }
    });
    
    // Rota para inutilizar numeração
    app.post('/api/fiscal/inutilizar', async (req: Request, res: Response) => {
      try {
        const { ano, serie, numeroInicial, numeroFinal, justificativa } = req.body;
        
        if (!ano || !serie || !numeroInicial || !numeroFinal || !justificativa) {
          return res.status(400).json({ 
            success: false, 
            message: 'Dados incompletos para inutilização'
          });
        }
        
        if (justificativa.length < 15 || justificativa.length > 255) {
          return res.status(400).json({ 
            success: false, 
            message: 'A justificativa deve ter entre 15 e 255 caracteres'
          });
        }
        
        if (numeroFinal < numeroInicial) {
          return res.status(400).json({ 
            success: false, 
            message: 'Número final deve ser maior ou igual ao inicial'
          });
        }
        
        // Buscar configuração fiscal e certificado
        const config = await this.storage.getFiscalConfig();
        if (!config || !config.certificadoId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não configurado'
          });
        }
        
        const certificado = await this.storage.getFiscalCertificateById(config.certificadoId);
        if (!certificado) {
          return res.status(400).json({ 
            success: false, 
            message: 'Certificado digital não encontrado'
          });
        }
        
        // Inutilizar numeração
        const resultado = await sefazService.inutilizarNumeracao(
          ano,
          serie,
          numeroInicial,
          numeroFinal,
          justificativa,
          config,
          certificado
        );
        
        return res.json({ 
          success: resultado.success, 
          message: resultado.mensagem,
          protocolo: resultado.protocolo
        });
      } catch (error) {
        console.error('Erro ao inutilizar numeração:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao inutilizar: ${(error as Error).message}`
        });
      }
    });
    
    // Rota para importar NF-e via XML
    app.post('/api/fiscal/importar-xml', async (req: Request, res: Response) => {
      try {
        const { xml, tipoEntrada } = req.body;
        
        if (!xml) {
          return res.status(400).json({ 
            success: false, 
            message: 'XML não fornecido'
          });
        }
        
        // Analisar o XML da NF-e usando o mesmo parser utilizado no invoice-entry-controller
        const dadosNFe = this.xmlParser.parseNFeXML(xml);
        
        if (!dadosNFe) {
          return res.status(400).json({ 
            success: false, 
            message: 'Falha ao analisar o XML da NF-e'
          });
        }
        
        // Verificar se a NF-e já existe
        const nfeExistente = await this.storage.getNFeByChave(dadosNFe.nota.chave);
        if (nfeExistente) {
          return res.status(400).json({ 
            success: false, 
            message: 'Esta NF-e já foi importada anteriormente'
          });
        }
        
        // Verificar e/ou cadastrar o fornecedor/cliente
        let idDestinatario = 0;
        
        if (tipoEntrada === 'entrada') {
          // Para notas de entrada, o emitente é o fornecedor
          // Procurar fornecedor por CNPJ ou CPF
          let fornecedor = null;
          
          if (dadosNFe.emitente.cnpj) {
            fornecedor = await this.storage.getSupplierByCnpj(dadosNFe.emitente.cnpj);
          } else if (dadosNFe.emitente.cpf) {
            fornecedor = await this.storage.getSupplierByCpf(dadosNFe.emitente.cpf);
          }
          
          if (fornecedor) {
            idDestinatario = fornecedor.id;
          } else {
            // Criar novo fornecedor
            const novoFornecedor = await this.storage.createSupplier({
              name: dadosNFe.emitente.nome,
              contactName: '',
              cnpj: dadosNFe.emitente.cnpj || '',
              cpf: dadosNFe.emitente.cpf || '',
              inscricaoEstadual: dadosNFe.emitente.inscricaoEstadual || '',
              phone: dadosNFe.emitente.endereco?.telefone || '',
              email: '',
              address: {
                street: dadosNFe.emitente.endereco?.logradouro || '',
                number: dadosNFe.emitente.endereco?.numero || '',
                complement: dadosNFe.emitente.endereco?.complemento || '',
                district: dadosNFe.emitente.endereco?.bairro || '',
                city: dadosNFe.emitente.endereco?.municipio || '',
                state: dadosNFe.emitente.endereco?.uf || '',
                zipCode: dadosNFe.emitente.endereco?.cep || '',
                country: 'Brasil'
              }
            });
            
            idDestinatario = novoFornecedor.id;
          }
        } else {
          // Para notas de saída, o destinatário é o cliente
          // Procurar cliente por CNPJ ou CPF
          let cliente = null;
          
          if (dadosNFe.destinatario.cnpj) {
            cliente = await this.storage.getCustomerByCnpj(dadosNFe.destinatario.cnpj);
          } else if (dadosNFe.destinatario.cpf) {
            cliente = await this.storage.getCustomerByCpf(dadosNFe.destinatario.cpf);
          }
          
          if (cliente) {
            idDestinatario = cliente.id;
          } else {
            // Criar novo cliente
            const novoCliente = await this.storage.createCustomer({
              name: dadosNFe.destinatario.nome,
              contactName: '',
              cnpj: dadosNFe.destinatario.cnpj || '',
              cpf: dadosNFe.destinatario.cpf || '',
              inscricaoEstadual: dadosNFe.destinatario.inscricaoEstadual || '',
              phone: dadosNFe.destinatario.endereco?.telefone || '',
              email: dadosNFe.destinatario.email || '',
              address: {
                street: dadosNFe.destinatario.endereco?.logradouro || '',
                number: dadosNFe.destinatario.endereco?.numero || '',
                complement: dadosNFe.destinatario.endereco?.complemento || '',
                district: dadosNFe.destinatario.endereco?.bairro || '',
                city: dadosNFe.destinatario.endereco?.municipio || '',
                state: dadosNFe.destinatario.endereco?.uf || '',
                zipCode: dadosNFe.destinatario.endereco?.cep || '',
                country: 'Brasil'
              }
            });
            
            idDestinatario = novoCliente.id;
          }
        }
        
        // Criar a NF-e no sistema
        const novaNFe = await this.storage.createNFe({
          numero: dadosNFe.nota.numero,
          serie: dadosNFe.nota.serie,
          dataEmissao: new Date(dadosNFe.nota.dataEmissao),
          status: 'autorizada',
          modeloDocumento: '55', // NFe
          naturezaOperacao: dadosNFe.nota.naturezaOperacao,
          tipoOperacao: tipoEntrada === 'entrada' ? '0' : '1', // 0=entrada, 1=saída
          finalidade: dadosNFe.nota.finalidade || '1',
          destinatarioId: idDestinatario,
          valorTotal: dadosNFe.nota.valorTotal,
          valorProdutos: dadosNFe.nota.valorProdutos,
          valorFrete: dadosNFe.nota.valorFrete,
          valorSeguro: dadosNFe.nota.valorSeguro,
          valorDesconto: dadosNFe.nota.valorDesconto,
          valorOutrasDespesas: dadosNFe.nota.valorOutrasDespesas,
          valorICMS: dadosNFe.nota.valorICMS,
          valorICMSST: dadosNFe.nota.valorICMSST,
          valorIPI: dadosNFe.nota.valorIPI,
          valorPIS: dadosNFe.nota.valorPIS,
          valorCOFINS: dadosNFe.nota.valorCOFINS,
          informacoesAdicionais: dadosNFe.nota.informacoesAdicionais,
          xmlEnvio: xml,
          createdBy: (req.user as any)?.id || 1
        });
        
        // Importar os itens da NFe
        for (const item of dadosNFe.itens) {
          // Verificar se o produto existe por código ou descrição
          let produtoId = null;
          
          // Caso seja entrada, precisamos cadastrar no estoque de matérias-primas
          if (tipoEntrada === 'entrada') {
            // Verificar se a matéria-prima existe
            let materia = await this.storage.getRawMaterialByCode(item.codigo);
            
            if (!materia) {
              // Tentar encontrar por nome
              materia = await this.storage.getRawMaterialByName(item.descricao);
            }
            
            if (materia) {
              produtoId = materia.id;
              
              // Atualizar estoque
              await this.storage.updateRawMaterialStock(
                materia.id, 
                item.quantidade
              );
            } else {
              // Criar nova matéria-prima
              const novaMateria = await this.storage.createRawMaterial({
                name: item.descricao,
                code: item.codigo,
                unit: item.unidade,
                price: item.valorUnitario,
                stockQuantity: item.quantidade,
                ncm: item.ncm,
                barcode: item.codigoBarras || '',
                minStockQuantity: 0
              });
              
              produtoId = novaMateria.id;
            }
          } else {
            // Para notas de saída, o produto deve existir
            const produto = await this.storage.getProductByCode(item.codigo);
            
            if (produto) {
              produtoId = produto.id;
            } else {
              // Neste caso, não devemos criar o produto automaticamente
              // pois precisamos de mais informações como fórmula, etc.
              console.warn(`Produto não encontrado: ${item.codigo} - ${item.descricao}`);
            }
          }
          
          // Adicionar o item à NF-e
          if (produtoId) {
            await this.storage.createNFeItem({
              nfeId: novaNFe.id,
              produtoId,
              codigo: item.codigo,
              descricao: item.descricao,
              ncm: item.ncm,
              cfop: item.cfop,
              unidade: item.unidade,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              valorTotal: item.valorTotal,
              cstICMS: item.cstICMS || '',
              baseCalculoICMS: item.baseCalculoICMS || 0,
              aliquotaICMS: item.aliquotaICMS || 0,
              valorICMS: item.valorICMS || 0,
              cstPIS: item.cstPIS || '',
              baseCalculoPIS: item.baseCalculoPIS || 0,
              aliquotaPIS: item.aliquotaPIS || 0,
              valorPIS: item.valorPIS || 0,
              cstCOFINS: item.cstCOFINS || '',
              baseCalculoCOFINS: item.baseCalculoCOFINS || 0,
              aliquotaCOFINS: item.aliquotaCOFINS || 0,
              valorCOFINS: item.valorCOFINS || 0,
              cstIPI: item.cstIPI || '',
              baseCalculoIPI: item.baseCalculoIPI || 0,
              aliquotaIPI: item.aliquotaIPI || 0,
              valorIPI: item.valorIPI || 0
            });
          }
        }
        
        // Criar evento de importação
        await this.storage.createNFeEvent({
          nfeId: novaNFe.id,
          tipo: 'importacao',
          status: 'sucesso',
          dataEvento: new Date(),
          mensagem: `NF-e importada com sucesso (${tipoEntrada})`,
          xml
        });
        
        return res.status(201).json({
          success: true,
          message: 'NF-e importada com sucesso',
          nfeId: novaNFe.id,
          itensImportados: dadosNFe.itens.length
        });
      } catch (error) {
        console.error('Erro ao importar NF-e:', error);
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao importar NF-e: ${(error as Error).message}`
        });
      }
    });
  }
}

export default (storage: IStorage) => new FiscalController(storage);