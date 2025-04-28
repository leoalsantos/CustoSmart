import { XMLParser } from 'fast-xml-parser';

/**
 * Analisador de XML para notas fiscais eletrônicas
 */
export class XMLParserService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => {
        return ['det', 'dup', 'pag'].includes(name);
      }
    });
  }

  /**
   * Analisa o XML da NFe e extrai os dados importantes
   */
  parseNFeXML(xmlContent: string) {
    try {
      const parsed = this.parser.parse(xmlContent);
      
      // Verifica se é uma NFe válida
      if (!parsed.nfeProc && !parsed.NFe) {
        console.error("XML não parece ser uma NFe válida");
        return null;
      }
      
      // Tenta obter o objeto NFe, que pode estar em diferentes caminhos dependendo do tipo de XML
      const nfe = parsed.nfeProc?.NFe || parsed.NFe;
      
      if (!nfe) {
        console.error("Estrutura NFe não encontrada no XML");
        return null;
      }
      
      const infNFe = nfe.infNFe;
      
      if (!infNFe) {
        console.error("Estrutura infNFe não encontrada no XML");
        return null;
      }
      
      // Extrai as informações do emitente
      const emitente = this.parseEmitente(infNFe.emit);
      
      // Extrai as informações do destinatário
      const destinatario = this.parseDestinatario(infNFe.dest);
      
      // Extrai as informações principais da nota
      const ide = infNFe.ide;
      const total = infNFe.total?.ICMSTot;
      
      // Chave de acesso pode estar em diferentes locais dependendo do tipo de XML
      const chaveAcesso = parsed.nfeProc?.['@_Id']?.replace('NFe', '') || 
                          infNFe?.['@_Id']?.replace('NFe', '') || 
                          '';
      
      // Dados básicos da nota
      const notaFiscal = {
        chave: chaveAcesso,
        numero: parseInt(ide?.nNF || '0'),
        serie: parseInt(ide?.serie || '0'),
        dataEmissao: this.parseData(ide?.dhEmi),
        naturezaOperacao: ide?.natOp || '',
        tipoOperacao: ide?.tpNF || '', // 0=entrada, 1=saída
        finalidade: ide?.finNFe || '1',
        modeloDocumento: ide?.mod || '55',
        valorTotal: this.parseValor(total?.vNF),
        valorProdutos: this.parseValor(total?.vProd),
        valorFrete: this.parseValor(total?.vFrete),
        valorSeguro: this.parseValor(total?.vSeg),
        valorDesconto: this.parseValor(total?.vDesc),
        valorOutrasDespesas: this.parseValor(total?.vOutro),
        valorICMS: this.parseValor(total?.vICMS),
        valorICMSST: this.parseValor(total?.vST),
        valorIPI: this.parseValor(total?.vIPI),
        valorPIS: this.parseValor(total?.vPIS),
        valorCOFINS: this.parseValor(total?.vCOFINS),
        informacoesAdicionais: infNFe.infAdic?.infCpl || ''
      };
      
      // Extrai os itens da nota
      const itens = this.parseItens(infNFe.det);
      
      return {
        nota: notaFiscal,
        emitente,
        destinatario,
        itens
      };
      
    } catch (error) {
      console.error("Erro ao analisar XML:", error);
      return null;
    }
  }
  
  /**
   * Converte string de data para objeto Date
   */
  private parseData(dataString?: string): Date {
    if (!dataString) return new Date();
    
    // Remove o timezone se existir
    const data = dataString.split('T')[0];
    const [ano, mes, dia] = data.split('-').map(Number);
    
    return new Date(ano, mes - 1, dia);
  }
  
  /**
   * Converte string de valor para número
   */
  private parseValor(valorString?: string): number {
    if (!valorString) return 0;
    return parseFloat(valorString.replace(',', '.'));
  }
  
  /**
   * Extrai informações do emitente
   */
  private parseEmitente(emit: any) {
    if (!emit) return null;
    
    return {
      nome: emit.xNome,
      fantasia: emit.xFant,
      cnpj: emit.CNPJ,
      cpf: emit.CPF,
      inscricaoEstadual: emit.IE,
      endereco: {
        logradouro: emit.enderEmit?.xLgr,
        numero: emit.enderEmit?.nro,
        complemento: emit.enderEmit?.xCpl,
        bairro: emit.enderEmit?.xBairro,
        codigoMunicipio: emit.enderEmit?.cMun,
        municipio: emit.enderEmit?.xMun,
        uf: emit.enderEmit?.UF,
        cep: emit.enderEmit?.CEP,
        codigoPais: emit.enderEmit?.cPais,
        pais: emit.enderEmit?.xPais,
        telefone: emit.enderEmit?.fone
      }
    };
  }
  
  /**
   * Extrai informações do destinatário
   */
  private parseDestinatario(dest: any) {
    if (!dest) return null;
    
    return {
      nome: dest.xNome,
      cnpj: dest.CNPJ,
      cpf: dest.CPF,
      inscricaoEstadual: dest.IE,
      email: dest.email,
      endereco: {
        logradouro: dest.enderDest?.xLgr,
        numero: dest.enderDest?.nro,
        complemento: dest.enderDest?.xCpl,
        bairro: dest.enderDest?.xBairro,
        codigoMunicipio: dest.enderDest?.cMun,
        municipio: dest.enderDest?.xMun,
        uf: dest.enderDest?.UF,
        cep: dest.enderDest?.CEP,
        codigoPais: dest.enderDest?.cPais,
        pais: dest.enderDest?.xPais,
        telefone: dest.enderDest?.fone
      }
    };
  }
  
  /**
   * Extrai informações dos itens da nota
   */
  private parseItens(itens: any[]): any[] {
    if (!itens || !Array.isArray(itens)) {
      return [];
    }
    
    return itens.map((item) => {
      const prod = item.prod;
      const imposto = item.imposto;
      
      // Extrai informações de impostos
      const icms = this.extraiICMS(imposto?.ICMS);
      const pis = this.extraiPIS(imposto?.PIS);
      const cofins = this.extraiCOFINS(imposto?.COFINS);
      const ipi = this.extraiIPI(imposto?.IPI);
      
      return {
        numero: parseInt(item['@_nItem'] || '0'),
        codigo: prod.cProd,
        codigoBarras: prod.cEAN,
        descricao: prod.xProd,
        ncm: prod.NCM,
        cfop: prod.CFOP,
        unidade: prod.uCom,
        quantidade: this.parseValor(prod.qCom),
        valorUnitario: this.parseValor(prod.vUnCom),
        valorTotal: this.parseValor(prod.vProd),
        valorDesconto: this.parseValor(prod.vDesc),
        ...icms,
        ...pis,
        ...cofins,
        ...ipi
      };
    });
  }
  
  /**
   * Extrai informações de ICMS
   */
  private extraiICMS(icms: any) {
    if (!icms) return {};
    
    // O ICMS pode estar em diferentes grupos dependendo do CST
    const icmsInfo = Object.values(icms)[0] as any;
    
    if (!icmsInfo) return {};
    
    return {
      cstICMS: icmsInfo.CST || icmsInfo.CSOSN,
      baseCalculoICMS: this.parseValor(icmsInfo.vBC),
      aliquotaICMS: this.parseValor(icmsInfo.pICMS),
      valorICMS: this.parseValor(icmsInfo.vICMS)
    };
  }
  
  /**
   * Extrai informações de PIS
   */
  private extraiPIS(pis: any) {
    if (!pis) return {};
    
    // O PIS pode estar em diferentes grupos dependendo do CST
    const pisInfo = Object.values(pis)[0] as any;
    
    if (!pisInfo) return {};
    
    return {
      cstPIS: pisInfo.CST,
      baseCalculoPIS: this.parseValor(pisInfo.vBC),
      aliquotaPIS: this.parseValor(pisInfo.pPIS),
      valorPIS: this.parseValor(pisInfo.vPIS)
    };
  }
  
  /**
   * Extrai informações de COFINS
   */
  private extraiCOFINS(cofins: any) {
    if (!cofins) return {};
    
    // O COFINS pode estar em diferentes grupos dependendo do CST
    const cofinsInfo = Object.values(cofins)[0] as any;
    
    if (!cofinsInfo) return {};
    
    return {
      cstCOFINS: cofinsInfo.CST,
      baseCalculoCOFINS: this.parseValor(cofinsInfo.vBC),
      aliquotaCOFINS: this.parseValor(cofinsInfo.pCOFINS),
      valorCOFINS: this.parseValor(cofinsInfo.vCOFINS)
    };
  }
  
  /**
   * Extrai informações de IPI
   */
  private extraiIPI(ipi: any) {
    if (!ipi) return {};
    
    // O IPI pode ter diferentes estruturas
    const ipiInfo = ipi.IPITrib;
    
    if (!ipiInfo) return {};
    
    return {
      cstIPI: ipiInfo.CST,
      baseCalculoIPI: this.parseValor(ipiInfo.vBC),
      aliquotaIPI: this.parseValor(ipiInfo.pIPI),
      valorIPI: this.parseValor(ipiInfo.vIPI)
    };
  }
}