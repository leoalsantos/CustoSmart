import { Request, Response } from 'express';
import { IStorage } from '../storage';
import { XMLParserService } from './xml-parser';
import { insertNFeSchema, insertNFeItemSchema } from '@shared/schema';

export class InvoiceEntryController {
  private storage: IStorage;
  private xmlParser: XMLParserService;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.xmlParser = new XMLParserService();
  }

  /**
   * Importa XML de NF-e e cadastra no sistema com atualização de estoque
   */
  async importXml(req: Request, res: Response) {
    try {
      const { xml, tipoEntrada } = req.body;
      
      if (!xml) {
        return res.status(400).json({ 
          success: false, 
          message: 'XML não fornecido'
        });
      }
      
      // Analisar o XML da NF-e
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
      let idFornecedor = 0;
      
      if (tipoEntrada === 'entrada') {
        // Para notas de entrada, o emitente é o fornecedor
        // Procurar fornecedor por CNPJ ou CPF
        let fornecedor = null;
        
        if (dadosNFe.emitente.cnpj) {
          fornecedor = await this.storage.getSupplierByTaxId(dadosNFe.emitente.cnpj);
        } else if (dadosNFe.emitente.cpf) {
          fornecedor = await this.storage.getSupplierByTaxId(dadosNFe.emitente.cpf);
        }
        
        if (fornecedor) {
          idFornecedor = fornecedor.id;
        } else {
          // Criar novo fornecedor
          const novoFornecedor = await this.storage.createSupplier({
            name: dadosNFe.emitente.nome,
            taxId: dadosNFe.emitente.cnpj || dadosNFe.emitente.cpf || '',
            contactName: '',
            email: '',
            phone: dadosNFe.emitente.endereco?.telefone || '',
            address: this.formatarEndereco(dadosNFe.emitente.endereco),
            createdBy: (req.user as any)?.id || 1
          });
          
          idFornecedor = novoFornecedor.id;
        }
      }
      
      // Criar a NF-e no sistema
      const nfe = await this.storage.createNFe({
        numero: dadosNFe.nota.numero,
        serie: dadosNFe.nota.serie,
        chave: dadosNFe.nota.chave,
        dataEmissao: dadosNFe.nota.dataEmissao,
        status: 'importada',
        modeloDocumento: dadosNFe.nota.modeloDocumento,
        naturezaOperacao: dadosNFe.nota.naturezaOperacao,
        tipoOperacao: tipoEntrada === 'entrada' ? '0' : '1', // 0=entrada, 1=saída
        finalidade: dadosNFe.nota.finalidade || '1',
        destinatarioId: idFornecedor,
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
      const itensProcessados = [];
      
      for (const item of dadosNFe.itens) {
        // Verificar se o produto existe por código ou descrição
        let rawMaterialId = null;
        
        // Caso seja entrada, precisamos cadastrar no estoque de matérias-primas
        if (tipoEntrada === 'entrada') {
          // Verificar se a matéria-prima existe
          let materia = await this.storage.getRawMaterialByCode(item.codigo);
          
          if (!materia) {
            // Tentar encontrar por nome
            materia = await this.storage.getRawMaterialByName(item.descricao);
          }
          
          if (materia) {
            rawMaterialId = materia.id;
            
            // Atualizar estoque
            await this.storage.updateRawMaterialStock(
              materia.id, 
              item.quantidade
            );
            
            // Registrar entrada no inventário
            await this.storage.addInventoryTransaction({
              materialId: materia.id,
              quantity: item.quantidade,
              transactionType: 'in',
              referenceType: 'nfe',
              referenceId: nfe.id,
              notes: `Entrada via NF-e ${nfe.numero} - ${nfe.serie}`,
              createdBy: (req.user as any)?.id || 1
            });
          } else {
            // Criar nova matéria-prima
            const novaMateria = await this.storage.createRawMaterial({
              name: item.descricao,
              code: item.codigo,
              unit: item.unidade,
              currentStock: item.quantidade,
              minimumStock: 0,
              locationInWarehouse: '',
              createdBy: (req.user as any)?.id || 1
            });
            
            rawMaterialId = novaMateria.id;
            
            // Registrar entrada no inventário
            await this.storage.addInventoryTransaction({
              materialId: novaMateria.id,
              quantity: item.quantidade,
              transactionType: 'in',
              referenceType: 'nfe',
              referenceId: nfe.id,
              notes: `Entrada inicial via NF-e ${nfe.numero} - ${nfe.serie}`,
              createdBy: (req.user as any)?.id || 1
            });
          }
          
          // Adicionar o item à NF-e
          const nfeItem = await this.storage.createNFeItem({
            nfeId: nfe.id,
            produtoId: rawMaterialId,
            codigo: item.codigo,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            valorDesconto: item.valorDesconto,
            cstICMS: item.cstICMS,
            baseCalculoICMS: item.baseCalculoICMS,
            aliquotaICMS: item.aliquotaICMS,
            valorICMS: item.valorICMS,
            cstPIS: item.cstPIS,
            baseCalculoPIS: item.baseCalculoPIS,
            aliquotaPIS: item.aliquotaPIS,
            valorPIS: item.valorPIS,
            cstCOFINS: item.cstCOFINS,
            baseCalculoCOFINS: item.baseCalculoCOFINS,
            aliquotaCOFINS: item.aliquotaCOFINS,
            valorCOFINS: item.valorCOFINS,
            cstIPI: item.cstIPI,
            baseCalculoIPI: item.baseCalculoIPI,
            aliquotaIPI: item.aliquotaIPI,
            valorIPI: item.valorIPI,
            informacoesAdicionais: ''
          });
          
          itensProcessados.push({
            ...nfeItem,
            materialName: item.descricao,
            materialCode: item.codigo
          });
        }
      }
      
      return res.status(201).json({
        success: true,
        message: 'NF-e importada com sucesso',
        data: {
          nfe,
          itens: itensProcessados,
          fornecedor: idFornecedor
        }
      });
      
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      return res.status(500).json({
        success: false,
        message: `Erro ao importar XML: ${(error as Error).message}`
      });
    }
  }
  
  /**
   * Busca todas as NF-e de entrada
   */
  async getInvoiceEntries(req: Request, res: Response) {
    try {
      const tipo = req.query.tipo as string;
      const nfes = await this.storage.getNFesByTipo(tipo === '0' ? '0' : '1');
      
      // Obter fornecedores para notas de entrada
      const fornecedoresMap = new Map();
      
      if (tipo === '0') {
        const fornecedoresIds = nfes.map(nfe => nfe.destinatarioId).filter(id => id > 0);
        const fornecedores = await this.storage.getSuppliersByIds(fornecedoresIds);
        
        fornecedores.forEach(fornecedor => {
          fornecedoresMap.set(fornecedor.id, fornecedor);
        });
      }
      
      // Formatar resposta
      const response = nfes.map(nfe => ({
        ...nfe,
        fornecedor: fornecedoresMap.get(nfe.destinatarioId) || null
      }));
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }
  
  /**
   * Formata endereço para exibição
   */
  private formatarEndereco(endereco: any): string {
    if (!endereco) return '';
    
    const partes = [
      endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.municipio,
      endereco.uf,
      endereco.cep
    ];
    
    return partes.filter(p => p).join(', ');
  }
}