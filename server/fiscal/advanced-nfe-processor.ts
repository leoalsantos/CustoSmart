import { FiscalConfig, NFe, NFeItem, NFeEvento, FiscalCertificate } from '@shared/schema';
import { XMLParserService } from './xml-parser';
import sefazWebService from './sefaz-webservice';
import { IStorage } from '../storage';
import { js2xml, xml2js } from 'xml-js';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';

/**
 * Classe para processamento avançado de NFe
 * Implementa recursos para comunicação com a SEFAZ, geração de XML, validação, etc.
 */
export class AdvancedNFeProcessor {
  private storage: IStorage;
  private xmlParser: XMLParserService;
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.xmlParser = new XMLParserService();
  }
  
  /**
   * Gera o XML de uma NFe com base nos dados do banco
   */
  async generateNFeXml(nfeId: number): Promise<string> {
    // Buscar dados da NFe e seus itens
    const nfe = await this.storage.getNFe(nfeId);
    if (!nfe) {
      throw new Error('NFe não encontrada');
    }
    
    const itens = await this.storage.getNFeItens(nfeId);
    if (!itens || itens.length === 0) {
      throw new Error('NFe não possui itens');
    }
    
    // Buscar dados fiscais relacionados
    const config = await this.storage.getFiscalConfig();
    if (!config) {
      throw new Error('Configuração fiscal não encontrada');
    }
    
    // Montar o objeto XML da NFe
    const dataNow = new Date();
    const dataEmissao = nfe.dataEmissao || dataNow;
    const dataEmissaoStr = format(dataEmissao, 'yyyy-MM-dd\'T\'HH:mm:ssxxx');
    
    // Determinar o tipo de operação (entrada/saída)
    const tipoOperacao = nfe.tipoOperacao || '1'; // 1=Saída, 0=Entrada
    
    // Informações do emissor (empresa)
    const empresa = await this.storage.getCompany();
    if (!empresa) {
      throw new Error('Dados da empresa não encontrados');
    }
    
    // Informações do destinatário (cliente/fornecedor)
    let destinatario: any = null;
    if (nfe.destinatarioId) {
      if (tipoOperacao === '1') {
        // Para saída, o destinatário é um cliente
        destinatario = await this.storage.getCustomer(nfe.destinatarioId);
      } else {
        // Para entrada, o destinatário é um fornecedor
        destinatario = await this.storage.getSupplier(nfe.destinatarioId);
      }
      
      if (!destinatario) {
        throw new Error('Destinatário não encontrado');
      }
    }
    
    // Calcular valores totais
    let valorTotal = 0;
    let baseCalculoIcms = 0;
    let valorIcms = 0;
    let valorProdutos = 0;
    
    itens.forEach(item => {
      valorProdutos += parseFloat(item.valorTotal.toString());
      
      if (item.baseCalculoIcms) {
        baseCalculoIcms += parseFloat(item.baseCalculoIcms.toString());
      }
      
      if (item.valorIcms) {
        valorIcms += parseFloat(item.valorIcms.toString());
      }
    });
    
    valorTotal = valorProdutos;
    
    // Gerar chave de acesso se ainda não existir
    let chaveAcesso = nfe.chaveAcesso;
    if (!chaveAcesso) {
      chaveAcesso = this.generateAccessKey(nfe, config);
    }
    
    // Construir o XML da NFe
    const nfeXml = {
      "NFe": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe"
        },
        "infNFe": {
          "_attributes": {
            "Id": `NFe${chaveAcesso}`,
            "versao": "4.00"
          },
          "ide": {
            "cUF": { "_text": this.getUFCode(config.uf) },
            "cNF": { "_text": chaveAcesso.substring(35, 43) },
            "natOp": { "_text": nfe.naturezaOperacao },
            "mod": { "_text": "55" }, // 55 = NFe
            "serie": { "_text": nfe.serie.toString() },
            "nNF": { "_text": nfe.numero.toString() },
            "dhEmi": { "_text": dataEmissaoStr },
            "dhSaiEnt": { "_text": dataEmissaoStr },
            "tpNF": { "_text": tipoOperacao },
            "idDest": { "_text": "1" }, // 1 = Operação interna
            "cMunFG": { "_text": empresa.codigoMunicipio || "3106200" }, // Belo Horizonte por padrão
            "tpImp": { "_text": "1" }, // 1 = DANFE normal, retrato
            "tpEmis": { "_text": "1" }, // 1 = Emissão normal
            "cDV": { "_text": chaveAcesso.substring(43) },
            "tpAmb": { "_text": config.ambiente },
            "finNFe": { "_text": "1" }, // 1 = NF-e normal
            "indFinal": { "_text": "1" }, // 1 = Consumidor final
            "indPres": { "_text": "1" }, // 1 = Operação presencial
            "procEmi": { "_text": "0" }, // 0 = Emissão de NF-e com aplicativo do contribuinte
            "verProc": { "_text": "CustoSmart 1.0" }
          },
          "emit": {
            "CNPJ": { "_text": empresa.cnpj.replace(/\D/g, '') },
            "xNome": { "_text": empresa.razaoSocial },
            "xFant": { "_text": empresa.nomeFantasia || empresa.razaoSocial },
            "enderEmit": {
              "xLgr": { "_text": empresa.endereco || "Endereço não informado" },
              "nro": { "_text": empresa.numero || "S/N" },
              "xBairro": { "_text": empresa.bairro || "Bairro não informado" },
              "cMun": { "_text": empresa.codigoMunicipio || "3106200" },
              "xMun": { "_text": empresa.cidade || "BELO HORIZONTE" },
              "UF": { "_text": empresa.uf || "MG" },
              "CEP": { "_text": empresa.cep ? empresa.cep.replace(/\D/g, '') : "30000000" },
              "cPais": { "_text": "1058" },
              "xPais": { "_text": "BRASIL" },
              "fone": { "_text": empresa.telefone ? empresa.telefone.replace(/\D/g, '') : "" }
            },
            "IE": { "_text": empresa.inscricaoEstadual ? empresa.inscricaoEstadual.replace(/\D/g, '') : "" },
            "CRT": { "_text": empresa.regimeTributario || "3" } // 3 = Regime Normal
          },
          "dest": this.buildDestElement(destinatario, tipoOperacao),
          "det": this.buildDetElements(itens),
          "total": {
            "ICMSTot": {
              "vBC": { "_text": baseCalculoIcms.toFixed(2) },
              "vICMS": { "_text": valorIcms.toFixed(2) },
              "vICMSDeson": { "_text": "0.00" },
              "vFCPUFDest": { "_text": "0.00" },
              "vICMSUFDest": { "_text": "0.00" },
              "vICMSUFRemet": { "_text": "0.00" },
              "vFCP": { "_text": "0.00" },
              "vBCST": { "_text": "0.00" },
              "vST": { "_text": "0.00" },
              "vFCPST": { "_text": "0.00" },
              "vFCPSTRet": { "_text": "0.00" },
              "vProd": { "_text": valorProdutos.toFixed(2) },
              "vFrete": { "_text": "0.00" },
              "vSeg": { "_text": "0.00" },
              "vDesc": { "_text": "0.00" },
              "vII": { "_text": "0.00" },
              "vIPI": { "_text": "0.00" },
              "vIPIDevol": { "_text": "0.00" },
              "vPIS": { "_text": "0.00" },
              "vCOFINS": { "_text": "0.00" },
              "vOutro": { "_text": "0.00" },
              "vNF": { "_text": valorTotal.toFixed(2) },
              "vTotTrib": { "_text": "0.00" }
            }
          },
          "transp": {
            "modFrete": { "_text": "9" } // 9 = Sem transporte
          },
          "pag": {
            "detPag": {
              "tPag": { "_text": "90" }, // 90 = Sem pagamento
              "vPag": { "_text": valorTotal.toFixed(2) }
            }
          },
          "infAdic": {
            "infCpl": { "_text": nfe.informacoesAdicionais || "" }
          }
        }
      }
    };
    
    // Converter o objeto JSON para XML
    const xml = js2xml(nfeXml, { compact: true, spaces: 2 });
    return xml;
  }
  
  /**
   * Constrói o elemento destinatário para o XML da NFe
   */
  private buildDestElement(destinatario: any, tipoOperacao: string): any {
    if (!destinatario) {
      return {
        "CNPJ": { "_text": "00000000000000" },
        "xNome": { "_text": "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" },
        "enderDest": {
          "xLgr": { "_text": "RUA SEM DESTINATARIO" },
          "nro": { "_text": "S/N" },
          "xBairro": { "_text": "BAIRRO NAO INFORMADO" },
          "cMun": { "_text": "3106200" }, // Belo Horizonte
          "xMun": { "_text": "BELO HORIZONTE" },
          "UF": { "_text": "MG" },
          "CEP": { "_text": "30000000" },
          "cPais": { "_text": "1058" },
          "xPais": { "_text": "BRASIL" }
        },
        "indIEDest": { "_text": "9" }, // 9 = Não contribuinte
        "email": { "_text": "" }
      };
    }
    
    const dest: any = {};
    
    // Definir CPF ou CNPJ
    if (destinatario.cpf && destinatario.cpf.replace(/\D/g, '').length === 11) {
      dest["CPF"] = { "_text": destinatario.cpf.replace(/\D/g, '') };
    } else if (destinatario.cnpj && destinatario.cnpj.replace(/\D/g, '').length === 14) {
      dest["CNPJ"] = { "_text": destinatario.cnpj.replace(/\D/g, '') };
    } else {
      dest["CNPJ"] = { "_text": "00000000000000" }; // CNPJ inválido para homologação
    }
    
    // Nome do destinatário
    dest["xNome"] = { "_text": destinatario.razaoSocial || destinatario.nome || "DESTINATARIO NAO INFORMADO" };
    
    // Endereço
    dest["enderDest"] = {
      "xLgr": { "_text": destinatario.endereco || "ENDERECO NAO INFORMADO" },
      "nro": { "_text": destinatario.numero || "S/N" },
      "xBairro": { "_text": destinatario.bairro || "BAIRRO NAO INFORMADO" },
      "cMun": { "_text": destinatario.codigoMunicipio || "3106200" }, // Belo Horizonte por padrão
      "xMun": { "_text": destinatario.cidade || "BELO HORIZONTE" },
      "UF": { "_text": destinatario.uf || "MG" },
      "CEP": { "_text": destinatario.cep ? destinatario.cep.replace(/\D/g, '') : "30000000" },
      "cPais": { "_text": "1058" },
      "xPais": { "_text": "BRASIL" },
      "fone": { "_text": destinatario.telefone ? destinatario.telefone.replace(/\D/g, '') : "" }
    };
    
    // Inscrição Estadual
    if (destinatario.inscricaoEstadual && destinatario.inscricaoEstadual !== 'ISENTO') {
      dest["IE"] = { "_text": destinatario.inscricaoEstadual.replace(/\D/g, '') };
      dest["indIEDest"] = { "_text": "1" }; // 1 = Contribuinte ICMS
    } else {
      dest["indIEDest"] = { "_text": "9" }; // 9 = Não contribuinte
    }
    
    // Email
    if (destinatario.email) {
      dest["email"] = { "_text": destinatario.email };
    }
    
    return dest;
  }
  
  /**
   * Constrói os elementos de detalhamento de itens para o XML da NFe
   */
  private buildDetElements(itens: NFeItem[]): any[] {
    return itens.map((item, index) => {
      const nItem = index + 1;
      
      const det: any = {
        "_attributes": {
          "nItem": nItem
        },
        "prod": {
          "cProd": { "_text": item.codigoProduto || `ITEM${nItem}` },
          "cEAN": { "_text": item.ean || "SEM GTIN" },
          "xProd": { "_text": item.descricao },
          "NCM": { "_text": item.ncm || "00000000" },
          "CFOP": { "_text": item.cfop || "5102" },
          "uCom": { "_text": item.unidadeComercial || "UN" },
          "qCom": { "_text": item.quantidade.toFixed(4) },
          "vUnCom": { "_text": item.valorUnitario.toFixed(4) },
          "vProd": { "_text": item.valorTotal.toFixed(2) },
          "cEANTrib": { "_text": item.ean || "SEM GTIN" },
          "uTrib": { "_text": item.unidadeTributavel || item.unidadeComercial || "UN" },
          "qTrib": { "_text": item.quantidadeTributavel ? item.quantidadeTributavel.toFixed(4) : item.quantidade.toFixed(4) },
          "vUnTrib": { "_text": item.valorUnitarioTributavel ? item.valorUnitarioTributavel.toFixed(4) : item.valorUnitario.toFixed(4) },
          "indTot": { "_text": "1" } // 1 = Valor do item compõe o total da NF-e
        },
        "imposto": this.buildImpostoElement(item)
      };
      
      if (item.numeroFci) {
        det.prod["nFCI"] = { "_text": item.numeroFci };
      }
      
      if (item.codigoBarras) {
        det.prod["cBarra"] = { "_text": item.codigoBarras };
      }
      
      return det;
    });
  }
  
  /**
   * Constrói o elemento de imposto para um item da NFe
   */
  private buildImpostoElement(item: NFeItem): any {
    const imposto: any = {
      "ICMS": {},
      "PIS": {
        "PISAliq": {
          "CST": { "_text": "01" }, // 01 = Operação Tributável (base de cálculo = valor da operação alíquota normal)
          "vBC": { "_text": item.valorTotal.toFixed(2) },
          "pPIS": { "_text": "1.65" },
          "vPIS": { "_text": (item.valorTotal * 0.0165).toFixed(2) }
        }
      },
      "COFINS": {
        "COFINSAliq": {
          "CST": { "_text": "01" }, // 01 = Operação Tributável (base de cálculo = valor da operação alíquota normal)
          "vBC": { "_text": item.valorTotal.toFixed(2) },
          "pCOFINS": { "_text": "7.60" },
          "vCOFINS": { "_text": (item.valorTotal * 0.076).toFixed(2) }
        }
      }
    };
    
    // Definir o elemento ICMS com base no CST
    const cst = item.cst || "00";
    
    if (cst === "00") { // Tributado integralmente
      imposto.ICMS["ICMS00"] = {
        "orig": { "_text": item.origem || "0" }, // 0 = Nacional
        "CST": { "_text": "00" },
        "modBC": { "_text": "3" }, // 3 = Valor da operação
        "vBC": { "_text": (item.baseCalculoIcms || item.valorTotal).toFixed(2) },
        "pICMS": { "_text": (item.aliquotaIcms || 18).toFixed(2) },
        "vICMS": { "_text": (item.valorIcms || (item.valorTotal * 0.18)).toFixed(2) }
      };
    } else if (cst === "40" || cst === "41" || cst === "50") { // Isento, não tributado ou suspenso
      imposto.ICMS["ICMS40"] = {
        "orig": { "_text": item.origem || "0" }, // 0 = Nacional
        "CST": { "_text": cst }
      };
    } else if (cst === "60") { // ICMS cobrado anteriormente por substituição tributária
      imposto.ICMS["ICMS60"] = {
        "orig": { "_text": item.origem || "0" }, // 0 = Nacional
        "CST": { "_text": "60" },
        "vBCSTRet": { "_text": "0.00" },
        "vICMSSTRet": { "_text": "0.00" }
      };
    } else { // Outros CSTs
      imposto.ICMS["ICMS90"] = {
        "orig": { "_text": item.origem || "0" }, // 0 = Nacional
        "CST": { "_text": "90" },
        "modBC": { "_text": "3" }, // 3 = Valor da operação
        "vBC": { "_text": "0.00" },
        "pICMS": { "_text": "0.00" },
        "vICMS": { "_text": "0.00" }
      };
    }
    
    return imposto;
  }
  
  /**
   * Gera uma chave de acesso para a NFe
   */
  private generateAccessKey(nfe: NFe, config: FiscalConfig): string {
    const uf = this.getUFCode(config.uf);
    const dataEmissao = nfe.dataEmissao || new Date();
    const anoMes = format(dataEmissao, 'yyMM');
    const cnpj = config.cnpj.replace(/\D/g, '');
    const modelo = '55'; // NFe = 55
    const serie = nfe.serie.toString().padStart(3, '0');
    const numero = nfe.numero.toString().padStart(9, '0');
    const tipoEmissao = '1'; // Normal
    const codigoNumerico = this.generateRandomNumber(8);
    
    const chaveBase = `${uf}${anoMes}${cnpj}${modelo}${serie}${numero}${tipoEmissao}${codigoNumerico}`;
    const dv = this.calculateCheckDigit(chaveBase);
    
    return `${chaveBase}${dv}`;
  }
  
  /**
   * Gera um número aleatório com o número especificado de dígitos
   */
  private generateRandomNumber(digits: number): string {
    const max = parseInt('9'.repeat(digits), 10);
    const randomNumber = Math.floor(Math.random() * max);
    return randomNumber.toString().padStart(digits, '0');
  }
  
  /**
   * Calcula o dígito verificador da chave de acesso
   */
  private calculateCheckDigit(chave: string): string {
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    
    for (let i = 0; i < chave.length; i++) {
      const digit = parseInt(chave[chave.length - 1 - i], 10);
      const weight = weights[i % weights.length];
      sum += digit * weight;
    }
    
    const remainder = sum % 11;
    const dv = remainder < 2 ? 0 : 11 - remainder;
    
    return dv.toString();
  }
  
  /**
   * Obtém o código da UF a partir da sigla
   */
  private getUFCode(uf: string): string {
    const codigosUF: Record<string, string> = {
      'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
      'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
      'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
      'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
      'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
      'SE': '28', 'TO': '17'
    };
    
    return codigosUF[uf] || '31'; // Default para MG
  }
  
  /**
   * Envia uma NFe para a SEFAZ
   */
  async sendNFeToSefaz(nfeId: number): Promise<any> {
    // Buscar dados da NFe e configuração fiscal
    const nfe = await this.storage.getNFe(nfeId);
    if (!nfe) {
      throw new Error('NFe não encontrada');
    }
    
    const config = await this.storage.getFiscalConfig();
    if (!config) {
      throw new Error('Configuração fiscal não encontrada');
    }
    
    if (!config.certificadoId) {
      throw new Error('Certificado digital não configurado');
    }
    
    // Buscar o certificado digital
    const certificate = await this.storage.getFiscalCertificate(config.certificadoId);
    if (!certificate) {
      throw new Error('Certificado digital não encontrado');
    }
    
    // Carregar o certificado no serviço SEFAZ
    const certificateInfo = await sefazWebService.loadCertificate(certificate);
    
    // Gerar o XML da NFe
    const nfeXml = await this.generateNFeXml(nfeId);
    
    // Enviar para a SEFAZ
    const response = await sefazWebService.autorizarNFe(nfeXml, config, certificateInfo);
    
    // Processar a resposta
    const result = this.processAuthorizationResponse(response, nfe);
    
    // Atualizar o status da NFe no banco
    await this.storage.updateNFe(nfeId, {
      status: result.status,
      mensagemSefaz: result.mensagem,
      numeroProtocolo: result.protocolo
    });
    
    // Registrar o evento no histórico
    await this.storage.createNFeEvento({
      nfeId: nfeId,
      tipo: 'envio',
      data: new Date(),
      status: result.status,
      mensagem: result.mensagem,
      xml: nfeXml
    });
    
    return result;
  }
  
  /**
   * Processa a resposta da autorização da NFe
   */
  private processAuthorizationResponse(response: any, nfe: NFe): any {
    let status = 'erro';
    let mensagem = 'Erro ao processar resposta da SEFAZ';
    let protocolo = '';
    
    try {
      // Extrair os dados relevantes da resposta
      const envelope = response['soap:Envelope'];
      const body = envelope['soap:Body'];
      const nfeResultado = body.nfeResultadoLote;
      const retorno = nfeResultado.retEnviNFe;
      
      const cStat = retorno.cStat._text;
      const xMotivo = retorno.xMotivo._text;
      
      if (cStat === '104') { // Lote processado
        const protNFe = retorno.protNFe;
        const infProt = protNFe.infProt;
        
        const protcStat = infProt.cStat._text;
        const protxMotivo = infProt.xMotivo._text;
        
        if (protcStat === '100') { // Autorizado o uso da NF-e
          status = 'autorizada';
          protocolo = infProt.nProt._text;
        } else {
          status = 'rejeitada';
        }
        
        mensagem = protxMotivo;
      } else {
        mensagem = xMotivo;
      }
    } catch (error) {
      console.error('Erro ao processar resposta da SEFAZ:', error);
    }
    
    return {
      status,
      mensagem,
      protocolo
    };
  }
  
  /**
   * Cancelar uma NFe
   */
  async cancelNFe(nfeId: number, justificativa: string): Promise<any> {
    // Buscar dados da NFe e configuração fiscal
    const nfe = await this.storage.getNFe(nfeId);
    if (!nfe) {
      throw new Error('NFe não encontrada');
    }
    
    if (nfe.status !== 'autorizada') {
      throw new Error('Somente NFes autorizadas podem ser canceladas');
    }
    
    if (!nfe.chaveAcesso) {
      throw new Error('NFe não possui chave de acesso');
    }
    
    if (!nfe.numeroProtocolo) {
      throw new Error('NFe não possui número de protocolo');
    }
    
    const config = await this.storage.getFiscalConfig();
    if (!config) {
      throw new Error('Configuração fiscal não encontrada');
    }
    
    if (!config.certificadoId) {
      throw new Error('Certificado digital não configurado');
    }
    
    // Buscar o certificado digital
    const certificate = await this.storage.getFiscalCertificate(config.certificadoId);
    if (!certificate) {
      throw new Error('Certificado digital não encontrado');
    }
    
    // Carregar o certificado no serviço SEFAZ
    const certificateInfo = await sefazWebService.loadCertificate(certificate);
    
    // Enviar o evento de cancelamento
    const response = await sefazWebService.cancelarNFe(
      nfe.chaveAcesso,
      nfe.numeroProtocolo,
      justificativa,
      config,
      certificateInfo
    );
    
    // Processar a resposta
    const result = this.processCancellationResponse(response);
    
    // Atualizar o status da NFe no banco
    await this.storage.updateNFe(nfeId, {
      status: result.success ? 'cancelada' : nfe.status,
      mensagemSefaz: result.mensagem
    });
    
    // Registrar o evento no histórico
    await this.storage.createNFeEvento({
      nfeId: nfeId,
      tipo: 'cancelamento',
      data: new Date(),
      status: result.success ? 'sucesso' : 'erro',
      mensagem: result.mensagem,
      xml: JSON.stringify(response)
    });
    
    return result;
  }
  
  /**
   * Processa a resposta do cancelamento da NFe
   */
  private processCancellationResponse(response: any): any {
    let success = false;
    let mensagem = 'Erro ao processar resposta da SEFAZ';
    
    try {
      // Extrair os dados relevantes da resposta
      const envelope = response['soap:Envelope'];
      const body = envelope['soap:Body'];
      const nfeResultado = body.nfeRecepcaoEventoResult;
      const retorno = nfeResultado.retEnvEvento;
      
      const cStat = retorno.cStat._text;
      const xMotivo = retorno.xMotivo._text;
      
      if (cStat === '128') { // Lote de evento processado
        const retEvento = retorno.retEvento;
        const infEvento = retEvento.infEvento;
        
        const eventcStat = infEvento.cStat._text;
        const eventxMotivo = infEvento.xMotivo._text;
        
        if (eventcStat === '135' || eventcStat === '155') { // Evento registrado e vinculado a NF-e
          success = true;
        }
        
        mensagem = eventxMotivo;
      } else {
        mensagem = xMotivo;
      }
    } catch (error) {
      console.error('Erro ao processar resposta do cancelamento:', error);
    }
    
    return {
      success,
      mensagem
    };
  }
  
  /**
   * Importa um XML de NFe e cadastra no sistema
   */
  async importNFeXml(xmlContent: string, tipoEntrada: string = 'compra'): Promise<any> {
    // Analisar o XML
    const dadosNFe = this.xmlParser.parseNFeXML(xmlContent);
    if (!dadosNFe) {
      throw new Error('Falha ao analisar o XML da NFe');
    }
    
    // Verificar se a NFe já existe
    const nfeExistente = await this.storage.getNFeByChave(dadosNFe.nota.chave);
    if (nfeExistente) {
      throw new Error('Esta NFe já foi importada anteriormente');
    }
    
    // Buscar ou cadastrar o fornecedor/emitente
    let fornecedorId = 0;
    if (dadosNFe.emitente.cnpj) {
      const fornecedor = await this.storage.getSupplierByCnpj(dadosNFe.emitente.cnpj);
      if (fornecedor) {
        fornecedorId = fornecedor.id;
      } else {
        // Cadastrar novo fornecedor
        const novoFornecedor = await this.storage.createSupplier({
          nomeFantasia: dadosNFe.emitente.fantasia || dadosNFe.emitente.nome,
          razaoSocial: dadosNFe.emitente.nome,
          cnpj: dadosNFe.emitente.cnpj,
          inscricaoEstadual: dadosNFe.emitente.ie,
          endereco: dadosNFe.emitente.endereco,
          numero: dadosNFe.emitente.numero,
          bairro: dadosNFe.emitente.bairro,
          cidade: dadosNFe.emitente.cidade,
          uf: dadosNFe.emitente.uf,
          cep: dadosNFe.emitente.cep,
          telefone: dadosNFe.emitente.fone,
          email: dadosNFe.emitente.email || '',
          contato: '',
          status: 'ativo',
          createdAt: new Date()
        });
        fornecedorId = novoFornecedor.id;
      }
    }
    
    // Cadastrar a NFe
    const novaNfe = await this.storage.createNFe({
      chaveAcesso: dadosNFe.nota.chave,
      numero: dadosNFe.nota.numero,
      serie: dadosNFe.nota.serie,
      dataEmissao: new Date(dadosNFe.nota.dataEmissao),
      valorTotal: dadosNFe.nota.valorTotal,
      naturezaOperacao: dadosNFe.nota.naturezaOperacao,
      tipoOperacao: '0', // Entrada
      status: 'importada',
      destinatarioId: null, // Empresa é o destinatário
      emitenteId: fornecedorId,
      xml: xmlContent,
      tipoDocumento: 'nfe',
      mensagemSefaz: '',
      numeroProtocolo: dadosNFe.nota.protocolo,
      dataEntradaSaida: new Date(),
      informacoesAdicionais: dadosNFe.nota.informacoesComplementares || ''
    });
    
    // Cadastrar os itens da NFe
    if (dadosNFe.itens && dadosNFe.itens.length > 0) {
      for (const item of dadosNFe.itens) {
        // Buscar o produto pelo código
        let produtoId = null;
        const produto = await this.storage.getProductByCode(item.codigo);
        if (produto) {
          produtoId = produto.id;
        }
        
        // Buscar o NCM
        let ncmId = null;
        if (item.ncm) {
          const ncm = await this.storage.getFiscalNCMByCode(item.ncm);
          if (ncm) {
            ncmId = ncm.id;
          }
        }
        
        // Buscar o CFOP
        let cfopId = null;
        if (item.cfop) {
          const cfop = await this.storage.getFiscalCFOPByCode(item.cfop);
          if (cfop) {
            cfopId = cfop.id;
          }
        }
        
        // Cadastrar o item
        await this.storage.createNFeItem({
          nfeId: novaNfe.id,
          numeroItem: item.numeroItem,
          codigoProduto: item.codigo,
          descricao: item.descricao,
          ncm: item.ncm || '',
          cfop: item.cfop || '',
          unidadeComercial: item.unidadeComercial,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          baseCalculoIcms: item.baseCalculoIcms || 0,
          aliquotaIcms: item.aliquotaIcms || 0,
          valorIcms: item.valorIcms || 0,
          cst: item.cst || '',
          origem: item.origem || '0',
          produtoId: produtoId,
          ncmId: ncmId,
          cfopId: cfopId,
          ean: item.ean || '',
          unidadeTributavel: item.unidadeTributavel || item.unidadeComercial,
          quantidadeTributavel: item.quantidadeTributavel || item.quantidade,
          valorUnitarioTributavel: item.valorUnitarioTributavel || item.valorUnitario
        });
        
        // Atualizar o estoque se for entrada de mercadoria
        if (tipoEntrada === 'compra' && produtoId) {
          // Implementar lógica para atualizar estoque
          // Depende da estrutura do sistema de estoque
        }
      }
    }
    
    // Registrar o evento de importação
    await this.storage.createNFeEvento({
      nfeId: novaNfe.id,
      tipo: 'importacao',
      data: new Date(),
      status: 'sucesso',
      mensagem: 'NFe importada com sucesso',
      xml: xmlContent
    });
    
    return {
      success: true,
      nfeId: novaNfe.id,
      mensagem: 'NFe importada com sucesso'
    };
  }
  
  /**
   * Consulta uma NFe na SEFAZ
   */
  async consultarNFe(nfeId: number): Promise<any> {
    // Buscar dados da NFe e configuração fiscal
    const nfe = await this.storage.getNFe(nfeId);
    if (!nfe) {
      throw new Error('NFe não encontrada');
    }
    
    if (!nfe.chaveAcesso) {
      throw new Error('NFe não possui chave de acesso');
    }
    
    const config = await this.storage.getFiscalConfig();
    if (!config) {
      throw new Error('Configuração fiscal não encontrada');
    }
    
    if (!config.certificadoId) {
      throw new Error('Certificado digital não configurado');
    }
    
    // Buscar o certificado digital
    const certificate = await this.storage.getFiscalCertificate(config.certificadoId);
    if (!certificate) {
      throw new Error('Certificado digital não encontrado');
    }
    
    // Carregar o certificado no serviço SEFAZ
    const certificateInfo = await sefazWebService.loadCertificate(certificate);
    
    // Consultar a NFe na SEFAZ
    const response = await sefazWebService.consultarProcessamentoNFe(
      nfe.chaveAcesso,
      config,
      certificateInfo
    );
    
    // Processar a resposta
    const result = this.processConsultationResponse(response, nfe);
    
    // Atualizar o status da NFe no banco se necessário
    if (result.status !== nfe.status) {
      await this.storage.updateNFe(nfeId, {
        status: result.status,
        mensagemSefaz: result.mensagem,
        numeroProtocolo: result.protocolo || nfe.numeroProtocolo
      });
      
      // Registrar o evento no histórico
      await this.storage.createNFeEvento({
        nfeId: nfeId,
        tipo: 'consulta',
        data: new Date(),
        status: 'sucesso',
        mensagem: result.mensagem,
        xml: JSON.stringify(response)
      });
    }
    
    return result;
  }
  
  /**
   * Processa a resposta da consulta da NFe
   */
  private processConsultationResponse(response: any, nfe: NFe): any {
    let status = nfe.status;
    let mensagem = 'Erro ao processar resposta da consulta SEFAZ';
    let protocolo = nfe.numeroProtocolo;
    
    try {
      // Extrair os dados relevantes da resposta
      const envelope = response['soap:Envelope'];
      const body = envelope['soap:Body'];
      const nfeResultado = body.nfeConsultaNFResult;
      const retorno = nfeResultado.retConsSitNFe;
      
      const cStat = retorno.cStat._text;
      const xMotivo = retorno.xMotivo._text;
      
      if (cStat === '100') { // Autorizado o uso da NF-e
        status = 'autorizada';
        mensagem = xMotivo;
        
        // Extrair o protocolo
        if (retorno.protNFe && retorno.protNFe.infProt) {
          protocolo = retorno.protNFe.infProt.nProt._text;
        }
      } else if (cStat === '101') { // NFe cancelada
        status = 'cancelada';
        mensagem = xMotivo;
      } else if (cStat === '110') { // Uso denegado
        status = 'denegada';
        mensagem = xMotivo;
      } else {
        mensagem = xMotivo;
      }
    } catch (error) {
      console.error('Erro ao processar resposta da consulta:', error);
    }
    
    return {
      status,
      mensagem,
      protocolo
    };
  }
  
  /**
   * Gera o DANFE (PDF) de uma NFe
   */
  async gerarDANFE(nfeId: number): Promise<Buffer> {
    // Esta função precisa ser implementada com uma biblioteca de geração de PDF
    // Aqui está apenas um esboço da implementação
    
    // Buscar dados da NFe e seus itens
    const nfe = await this.storage.getNFe(nfeId);
    if (!nfe) {
      throw new Error('NFe não encontrada');
    }
    
    const itens = await this.storage.getNFeItens(nfeId);
    
    // A implementação real utilizaria uma biblioteca como PDFKit para gerar o PDF
    // Aqui estamos apenas retornando um buffer vazio como exemplo
    
    // Futura implementação:
    // const pdfDoc = new PDFDocument();
    // const buffers: Buffer[] = [];
    
    // pdfDoc.on('data', (chunk) => buffers.push(chunk));
    // pdfDoc.on('end', () => Buffer.concat(buffers));
    
    // // Gerar o conteúdo do PDF...
    
    // pdfDoc.end();
    
    // Retorno simplificado para ilustração
    return Buffer.from('DANFE PDF');
  }
}

// Exportar uma instância singleton
const advancedNFeProcessor = new AdvancedNFeProcessor(null as any);
export default advancedNFeProcessor;