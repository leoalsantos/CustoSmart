import fs from 'fs';
import path from 'path';
import { FiscalConfig, FiscalCertificate, NFe, NFeItem } from '@shared/schema';
import { xml2js, js2xml } from 'xml-js';
import { format } from 'date-fns';
import crypto from 'crypto';

// Interface para armazenar o certificado digital na memória
interface CertificateData {
  pfx: Buffer;
  password: string;
  serialNumber: string;
}

/**
 * Serviço para comunicação com a SEFAZ
 */
export class SefazService {
  private certificateCache: Map<number, CertificateData> = new Map();
  
  /**
   * Carrega o certificado digital
   */
  async loadCertificate(certificate: FiscalCertificate): Promise<CertificateData> {
    // Verifica se já está em cache
    if (this.certificateCache.has(certificate.id)) {
      return this.certificateCache.get(certificate.id)!;
    }
    
    // Decodifica o certificado da base64
    const pfxBuffer = Buffer.from(certificate.certificateData, 'base64');
    
    // Armazena no cache
    const certData = {
      pfx: pfxBuffer,
      password: certificate.password,
      serialNumber: certificate.serialNumber
    };
    
    this.certificateCache.set(certificate.id, certData);
    return certData;
  }
  
  /**
   * Calcula o dígito verificador do código da chave de acesso
   */
  private calcularDigitoVerificador(chave: string): string {
    // Pesos para cálculo do DV
    const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
    
    let soma = 0;
    let peso = 0;
    
    // Percorrer os caracteres da chave
    for (let i = chave.length - 1; i >= 0; i--) {
      const digito = parseInt(chave[i]);
      peso = pesos[soma % 8];
      soma += digito * peso;
    }
    
    const resto = soma % 11;
    const dv = resto <= 1 ? 0 : 11 - resto;
    
    return dv.toString();
  }
  
  /**
   * Gera a chave de acesso da NFe
   */
  gerarChaveAcesso(
    uf: string, 
    dataEmissao: Date, 
    cnpj: string, 
    modelo: string, 
    serie: number, 
    numero: number, 
    tipoEmissao: string, 
    codigoNumerico: string
  ): string {
    // Código da UF
    const codigoUF = this.getCodigoUF(uf);
    
    // Ano e mês de emissão
    const anoMes = format(dataEmissao, 'yyMM');
    
    // Formatar valores numéricos com zeros à esquerda
    const serieFormatada = serie.toString().padStart(3, '0');
    const numeroFormatado = numero.toString().padStart(9, '0');
    
    // Montar chave sem dígito verificador
    const chave = `${codigoUF}${anoMes}${cnpj}${modelo}${serieFormatada}${numeroFormatado}${tipoEmissao}${codigoNumerico}`;
    
    // Calcular dígito verificador
    const dv = this.calcularDigitoVerificador(chave);
    
    // Retornar chave completa
    return `${chave}${dv}`;
  }
  
  /**
   * Retorna o código numérico da UF
   */
  private getCodigoUF(uf: string): string {
    const ufCodes: Record<string, string> = {
      'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
      'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
      'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
      'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
      'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
      'SE': '28', 'TO': '17'
    };
    
    return ufCodes[uf.toUpperCase()] || '00';
  }
  
  /**
   * Gera o XML da NFe
   */
  async gerarXmlNFe(
    nfe: NFe, 
    itens: NFeItem[], 
    config: FiscalConfig, 
    certificate: FiscalCertificate, 
    company: any, 
    destinatario: any
  ): Promise<string> {
    // Geração de código numérico aleatório de 8 dígitos
    const codigoNumerico = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Tipo de emissão normal = '1'
    const tipoEmissao = '1';
    
    // Gerar chave de acesso
    const chaveAcesso = this.gerarChaveAcesso(
      config.ufEmissor,
      new Date(nfe.dataEmissao),
      company.cnpj.replace(/\D/g, ''), // Remove caracteres não numéricos
      nfe.modeloDocumento,
      nfe.serie,
      nfe.numero,
      tipoEmissao,
      codigoNumerico
    );
    
    // Data de emissão no formato ISO
    const dataEmissao = format(new Date(nfe.dataEmissao), "yyyy-MM-dd'T'HH:mm:ssxxx");
    
    // Determinar o código do modelo de documento fiscal
    const ambiente = config.ambiente === 'producao' ? '1' : '2';
    
    // Construir o XML da NFe
    const xmlObj = {
      _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
      NFe: {
        _attributes: { xmlns: 'http://www.portalfiscal.inf.br/nfe' },
        infNFe: {
          _attributes: { Id: `NFe${chaveAcesso}`, versao: '4.00' },
          ide: {
            cUF: this.getCodigoUF(config.ufEmissor),
            cNF: codigoNumerico,
            natOp: nfe.naturezaOperacao,
            mod: nfe.modeloDocumento,
            serie: nfe.serie,
            nNF: nfe.numero,
            dhEmi: dataEmissao,
            tpNF: nfe.tipoOperacao, // 0=Entrada, 1=Saída
            idDest: '1', // 1=Operação interna, 2=Interestadual, 3=Exterior
            cMunFG: '3170206', // Código IBGE do município (seria dinâmico na implementação real)
            tpImp: '1', // 1=DANFE Retrato, 2=DANFE Paisagem, etc.
            tpEmis: tipoEmissao,
            cDV: chaveAcesso.substring(43), // Dígito verificador
            tpAmb: ambiente, // 1=Produção, 2=Homologação
            finNFe: nfe.finalidade,
            indFinal: '1', // 0=Normal, 1=Consumidor final
            indPres: '1', // 0=Não se aplica, 1=Presencial, etc.
            procEmi: '0', // 0=Emissão por aplicativo próprio
            verProc: '1.0.0' // Versão do aplicativo
          },
          emit: {
            CNPJ: company.cnpj.replace(/\D/g, ''),
            xNome: company.name,
            xFant: company.tradingName,
            enderEmit: {
              xLgr: company.address.street,
              nro: company.address.number,
              xCpl: company.address.complement,
              xBairro: company.address.district,
              cMun: '3170206', // Código IBGE (seria dinâmico)
              xMun: company.address.city,
              UF: company.address.state,
              CEP: company.address.zipCode.replace(/\D/g, ''),
              cPais: '1058', // Brasil
              xPais: 'BRASIL',
              fone: company.phone?.replace(/\D/g, '')
            },
            IE: config.inscricaoEstadual.replace(/\D/g, ''),
            IM: config.inscricaoMunicipal?.replace(/\D/g, ''),
            CNAE: config.cnae?.replace(/\D/g, ''),
            CRT: this.getCodigoRegimeTributario(config.regimeTributario)
          },
          dest: {
            // CPF ou CNPJ dependendo do tipo de cliente
            ...(destinatario.cpf 
              ? { CPF: destinatario.cpf.replace(/\D/g, '') } 
              : { CNPJ: destinatario.cnpj.replace(/\D/g, '') }
            ),
            xNome: destinatario.name,
            enderDest: {
              xLgr: destinatario.address.street,
              nro: destinatario.address.number,
              xCpl: destinatario.address.complement,
              xBairro: destinatario.address.district,
              cMun: '3170206', // Código IBGE (seria dinâmico)
              xMun: destinatario.address.city,
              UF: destinatario.address.state,
              CEP: destinatario.address.zipCode.replace(/\D/g, ''),
              cPais: '1058', // Brasil
              xPais: 'BRASIL',
              fone: destinatario.phone?.replace(/\D/g, '')
            },
            indIEDest: '9', // 1=Contribuinte ICMS, 2=Contribuinte isento, 9=Não Contribuinte
            email: destinatario.email
          },
          det: itens.map((item, index) => ({
            _attributes: { nItem: index + 1 },
            prod: {
              cProd: item.codigo,
              cEAN: item.codigoBarras || 'SEM GTIN',
              xProd: item.descricao,
              NCM: item.ncm,
              CFOP: item.cfop,
              uCom: item.unidade,
              qCom: item.quantidade.toFixed(4),
              vUnCom: item.valorUnitario.toFixed(4),
              vProd: item.valorTotal.toFixed(2),
              cEANTrib: item.codigoBarras || 'SEM GTIN',
              uTrib: item.unidade,
              qTrib: item.quantidade.toFixed(4),
              vUnTrib: item.valorUnitario.toFixed(4),
              indTot: '1', // 1=Valor compõe total da NF-e
              xPed: nfe.pedidoId ? nfe.pedidoId.toString() : undefined
            },
            imposto: {
              ICMS: this.gerarXmlICMS(item, config.regimeTributario),
              PIS: this.gerarXmlPIS(item, config.regimeTributario),
              COFINS: this.gerarXmlCOFINS(item, config.regimeTributario),
              ...(item.cstIPI && { IPI: this.gerarXmlIPI(item) })
            }
          })),
          total: {
            ICMSTot: {
              vBC: nfe.valorICMS > 0 ? nfe.valorTotal.toFixed(2) : '0.00',
              vICMS: nfe.valorICMS.toFixed(2),
              vICMSDeson: '0.00',
              vFCPUFDest: '0.00',
              vICMSUFDest: '0.00',
              vICMSUFRemet: '0.00',
              vFCP: '0.00',
              vBCST: '0.00',
              vST: '0.00',
              vFCPST: '0.00',
              vFCPSTRet: '0.00',
              vProd: nfe.valorProdutos.toFixed(2),
              vFrete: nfe.valorFrete.toFixed(2),
              vSeg: nfe.valorSeguro.toFixed(2),
              vDesc: nfe.valorDesconto.toFixed(2),
              vII: '0.00',
              vIPI: nfe.valorIPI.toFixed(2),
              vIPIDevol: '0.00',
              vPIS: nfe.valorPIS.toFixed(2),
              vCOFINS: nfe.valorCOFINS.toFixed(2),
              vOutro: nfe.valorOutrasDespesas.toFixed(2),
              vNF: nfe.valorTotal.toFixed(2),
              vTotTrib: '0.00'
            }
          },
          transp: {
            modFrete: '9' // 0=Emitente, 1=Destinatário, 9=Sem frete
          },
          pag: {
            detPag: {
              indPag: '0', // 0=Pagamento à vista, 1=Prazo
              tPag: '90', // 01=Dinheiro, 03=Cartão de Crédito, etc., 90=Sem pagamento
              vPag: '0.00'
            }
          },
          infAdic: {
            infCpl: nfe.informacoesAdicionais
          }
        }
      }
    };
    
    return js2xml(xmlObj, { compact: true, ignoreComment: true, spaces: 2 });
  }
  
  /**
   * Gera a seção XML para o ICMS com base no regime tributário
   */
  private gerarXmlICMS(item: NFeItem, regimeTributario: string): any {
    if (regimeTributario === 'simples') {
      // Simples Nacional - CSOSN
      return {
        ICMSSN102: {
          orig: '0', // 0=Nacional
          CSOSN: item.cstICMS || '102' // 102=Tributação do ICMS sem permissão de crédito
        }
      };
    } else if (regimeTributario === 'simples_excesso') {
      // Simples Nacional em sublimite excedido - tratamento especial
      return {
        ICMS00: {
          orig: '0', // 0=Nacional
          CST: item.cstICMS || '00', // 00=Tributado integralmente
          modBC: '0', // 0=Margem Valor Agregado
          vBC: item.baseCalculoICMS.toFixed(2),
          pICMS: item.aliquotaICMS.toFixed(2),
          vICMS: item.valorICMS.toFixed(2)
        }
      };
    } else {
      // Regime normal (Lucro Presumido/Real)
      return {
        ICMS00: {
          orig: '0', // 0=Nacional
          CST: item.cstICMS || '00', // 00=Tributado integralmente
          modBC: '0', // 0=Margem Valor Agregado
          vBC: item.baseCalculoICMS.toFixed(2),
          pICMS: item.aliquotaICMS.toFixed(2),
          vICMS: item.valorICMS.toFixed(2)
        }
      };
    }
  }
  
  /**
   * Gera a seção XML para o PIS
   */
  private gerarXmlPIS(item: NFeItem, regimeTributario: string): any {
    if (regimeTributario === 'simples') {
      // No Simples, geralmente não destaca PIS
      return {
        PISOutr: {
          CST: '99', // 99=Outras operações
          vBC: '0.00',
          pPIS: '0.00',
          vPIS: '0.00'
        }
      };
    } else {
      // Regime normal com alíquota básica
      return {
        PISAliq: {
          CST: item.cstPIS || '01', // 01=Operação Tributável (alíquota normal)
          vBC: item.baseCalculoPIS.toFixed(2),
          pPIS: item.aliquotaPIS.toFixed(2),
          vPIS: item.valorPIS.toFixed(2)
        }
      };
    }
  }
  
  /**
   * Gera a seção XML para o COFINS
   */
  private gerarXmlCOFINS(item: NFeItem, regimeTributario: string): any {
    if (regimeTributario === 'simples') {
      // No Simples, geralmente não destaca COFINS
      return {
        COFINSOutr: {
          CST: '99', // 99=Outras operações
          vBC: '0.00',
          pCOFINS: '0.00',
          vCOFINS: '0.00'
        }
      };
    } else {
      // Regime normal com alíquota básica
      return {
        COFINSAliq: {
          CST: item.cstCOFINS || '01', // 01=Operação Tributável (alíquota normal)
          vBC: item.baseCalculoCOFINS.toFixed(2),
          pCOFINS: item.aliquotaCOFINS.toFixed(2),
          vCOFINS: item.valorCOFINS.toFixed(2)
        }
      };
    }
  }
  
  /**
   * Gera a seção XML para o IPI
   */
  private gerarXmlIPI(item: NFeItem): any {
    return {
      cEnq: '999', // 999=Código padrão conforme tabela
      IPINT: {
        CST: item.cstIPI || '53' // 53=Saída Não Tributada
      }
    };
  }
  
  /**
   * Converte o regime tributário para o código CRT
   */
  private getCodigoRegimeTributario(regime: string): string {
    switch (regime) {
      case 'simples':
        return '1'; // 1=Simples Nacional
      case 'simples_excesso':
        return '1'; // 1=Simples Nacional (mas com tratamento diferenciado)
      case 'presumido':
        return '3'; // 3=Regime Normal (Lucro Presumido ou Arbitrado)
      case 'real':
        return '3'; // 3=Regime Normal (Lucro Real)
      default:
        return '1'; // Padrão: Simples Nacional
    }
  }
  
  /**
   * Assinar o XML com o certificado digital
   */
  async assinarXml(xml: string, certData: CertificateData): Promise<string> {
    // Na implementação real, usaria bibliotecas como xml-crypto e libxmljs
    // para assinar o XML conforme os padrões da SEFAZ
    // Esta é uma simulação simplificada
    
    // Em uma implementação real, você deve:
    // 1. Localizar os elementos que precisam ser assinados
    // 2. Calcular o hash desses elementos
    // 3. Assinar o hash com a chave privada do certificado
    // 4. Adicionar a assinatura no XML no local apropriado
    
    // Simulação de assinatura (não usar em produção)
    const xmlObj = xml2js(xml, { compact: true });
    
    // Adicionar elemento de assinatura
    if (!xmlObj.NFe.Signature) {
      const timestamp = new Date().toISOString();
      xmlObj.NFe.Signature = {
        _attributes: { xmlns: "http://www.w3.org/2000/09/xmldsig#" },
        SignedInfo: {
          CanonicalizationMethod: { _attributes: { Algorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315" } },
          SignatureMethod: { _attributes: { Algorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1" } },
          Reference: {
            _attributes: { URI: `#${xmlObj.NFe.infNFe._attributes.Id}` },
            Transforms: {
              Transform: [
                { _attributes: { Algorithm: "http://www.w3.org/2000/09/xmldsig#enveloped-signature" } },
                { _attributes: { Algorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315" } }
              ]
            },
            DigestMethod: { _attributes: { Algorithm: "http://www.w3.org/2000/09/xmldsig#sha1" } },
            DigestValue: "DIGEST_PLACEHOLDER" // Em uma implementação real, este valor seria calculado
          }
        },
        SignatureValue: "SIGNATURE_PLACEHOLDER", // Em uma implementação real, este valor seria calculado
        KeyInfo: {
          X509Data: {
            X509Certificate: certData.serialNumber
          }
        }
      };
    }
    
    return js2xml(xmlObj, { compact: true, ignoreComment: true, spaces: 2 });
  }

  /**
   * Simula o envio de uma NF-e para a SEFAZ
   * Em uma implementação real, isso faria requisições SOAP para os webservices da SEFAZ
   */
  async enviarNFe(
    xmlAssinado: string, 
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ success: boolean; protocolo?: string; mensagem: string; xml?: string }> {
    try {
      // Em ambiente de produção, faria uma chamada SOAP para o webservice
      // Simulando resposta da SEFAZ
      
      // Gerar um protocolo de autorização aleatório
      const protocolo = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      
      // Simular resposta de sucesso ou erro com base em probabilidade
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        // Simular resposta de sucesso
        const xmlRetorno = `
          <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            ${xmlAssinado}
            <protNFe versao="4.00">
              <infProt>
                <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
                <verAplic>SVRS_AP_A4_11</verAplic>
                <chNFe>${this.extrairChaveNFe(xmlAssinado)}</chNFe>
                <dhRecbto>${new Date().toISOString()}</dhRecbto>
                <nProt>${protocolo}</nProt>
                <digVal>BASE64_DIGEST_VALUE</digVal>
                <cStat>100</cStat>
                <xMotivo>Autorizado o uso da NF-e</xMotivo>
              </infProt>
            </protNFe>
          </nfeProc>
        `;
        
        return {
          success: true,
          protocolo,
          mensagem: "Autorizado o uso da NF-e",
          xml: xmlRetorno
        };
      } else {
        // Simular resposta de erro
        return {
          success: false,
          mensagem: "Rejeição: CPF do destinatário inválido",
        };
      }
    } catch (error) {
      console.error("Erro ao enviar NF-e:", error);
      return {
        success: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`,
      };
    }
  }
  
  /**
   * Extrair a chave da NF-e do XML
   */
  extrairChaveNFe(xml: string): string {
    const match = xml.match(/Id="NFe(\d{44})"/);
    return match ? match[1] : "0".repeat(44);
  }
  
  /**
   * Simula o cancelamento de uma NF-e na SEFAZ
   */
  async cancelarNFe(
    chaveNFe: string, 
    protocolo: string, 
    justificativa: string,
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ success: boolean; protocolo?: string; mensagem: string; xml?: string }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      
      // Gerar um protocolo de cancelamento aleatório
      const protocoloCancelamento = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      
      // Simular resposta de sucesso ou erro com base em probabilidade
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        // Criar XML de cancelamento
        const xmlCancelamento = `
          <procCancNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <cancNFe>
              <infCanc>
                <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
                <xServ>CANCELAR</xServ>
                <chNFe>${chaveNFe}</chNFe>
                <nProt>${protocolo}</nProt>
                <xJust>${justificativa}</xJust>
              </infCanc>
            </cancNFe>
            <retCancNFe>
              <infCanc>
                <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
                <verAplic>SVRS_AP_A4_11</verAplic>
                <chNFe>${chaveNFe}</chNFe>
                <dhRecbto>${new Date().toISOString()}</dhRecbto>
                <nProt>${protocoloCancelamento}</nProt>
                <cStat>101</cStat>
                <xMotivo>Cancelamento de NF-e homologado</xMotivo>
              </infCanc>
            </retCancNFe>
          </procCancNFe>
        `;
        
        return {
          success: true,
          protocolo: protocoloCancelamento,
          mensagem: "Cancelamento de NF-e homologado",
          xml: xmlCancelamento
        };
      } else {
        // Simular resposta de erro
        return {
          success: false,
          mensagem: "Rejeição: NF-e já está cancelada",
        };
      }
    } catch (error) {
      console.error("Erro ao cancelar NF-e:", error);
      return {
        success: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`,
      };
    }
  }
  
  /**
   * Gera o DANFE em formato PDF
   * Em uma implementação real, usaria uma biblioteca como PDFKit ou pdfmake
   */
  async gerarDANFE(xml: string): Promise<Buffer> {
    // Simulação - em uma implementação real, usaria uma biblioteca como PDFKit
    // para gerar o PDF do DANFE com todas as informações da NF-e formatadas
    
    // Por enquanto, estamos apenas retornando um Buffer vazio
    // que seria substituído pelo conteúdo real do PDF
    return Buffer.from("PDF_DANFE_PLACEHOLDER");
  }
  
  /**
   * Simula a consulta de status do serviço na SEFAZ
   */
  async consultarStatusServico(uf: string, config: FiscalConfig, certificado: FiscalCertificate): Promise<{ 
    online: boolean; 
    mensagem: string; 
    tempoMedio?: number 
  }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      const online = Math.random() > 0.1; // 90% de chance de estar online
      
      if (online) {
        return {
          online: true,
          mensagem: "Serviço em operação",
          tempoMedio: Math.floor(Math.random() * 500) // Tempo médio de resposta em ms
        };
      } else {
        return {
          online: false,
          mensagem: "Serviço paralisado momentaneamente"
        };
      }
    } catch (error) {
      console.error("Erro ao consultar status do serviço:", error);
      return {
        online: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Simula a consulta de uma NF-e na SEFAZ
   */
  async consultarNFe(
    chaveNFe: string, 
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ 
    encontrada: boolean; 
    situacao?: string; 
    mensagem: string; 
    protocolo?: string;
    xml?: string;
  }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      const encontrada = Math.random() > 0.1; // 90% de chance de encontrar
      
      if (encontrada) {
        // Simular situação da NF-e
        const situacoes = ["autorizada", "cancelada", "denegada"];
        const situacao = situacoes[Math.floor(Math.random() * situacoes.length)];
        const protocolo = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        
        return {
          encontrada: true,
          situacao,
          mensagem: situacao === "autorizada" 
            ? "NF-e Autorizada" 
            : (situacao === "cancelada" ? "NF-e Cancelada" : "NF-e Denegada"),
          protocolo,
          xml: `<xml>Representação da NF-e ${chaveNFe}</xml>` // Simplificado para exemplo
        };
      } else {
        return {
          encontrada: false,
          mensagem: "NF-e não encontrada"
        };
      }
    } catch (error) {
      console.error("Erro ao consultar NF-e:", error);
      return {
        encontrada: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Simula a inutilização de numeração de NF-e
   */
  async inutilizarNumeracao(
    ano: number, 
    serie: number, 
    numeroInicial: number, 
    numeroFinal: number,
    justificativa: string,
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ 
    success: boolean; 
    protocolo?: string; 
    mensagem: string; 
    xml?: string;
  }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        const protocolo = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        
        // Criar XML de inutilização
        const xmlInutilizacao = `
          <procInutNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <inutNFe>
              <infInut>
                <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
                <cUF>${this.getCodigoUF(config.ufEmissor)}</cUF>
                <ano>${ano.toString().slice(-2)}</ano>
                <CNPJ>00000000000000</CNPJ>
                <mod>55</mod>
                <serie>${serie}</serie>
                <nNFIni>${numeroInicial}</nNFIni>
                <nNFFin>${numeroFinal}</nNFFin>
                <xJust>${justificativa}</xJust>
              </infInut>
            </inutNFe>
            <retInutNFe>
              <infInut>
                <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
                <cUF>${this.getCodigoUF(config.ufEmissor)}</cUF>
                <ano>${ano.toString().slice(-2)}</ano>
                <CNPJ>00000000000000</CNPJ>
                <mod>55</mod>
                <serie>${serie}</serie>
                <nNFIni>${numeroInicial}</nNFIni>
                <nNFFin>${numeroFinal}</nNFFin>
                <dhRecbto>${new Date().toISOString()}</dhRecbto>
                <nProt>${protocolo}</nProt>
                <cStat>102</cStat>
                <xMotivo>Inutilização de número homologado</xMotivo>
              </infInut>
            </retInutNFe>
          </procInutNFe>
        `;
        
        return {
          success: true,
          protocolo,
          mensagem: "Inutilização de número homologado",
          xml: xmlInutilizacao
        };
      } else {
        return {
          success: false,
          mensagem: "Rejeição: Numeração já utilizada"
        };
      }
    } catch (error) {
      console.error("Erro ao inutilizar numeração:", error);
      return {
        success: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Simula o download de uma NF-e pelo destinatário (Manifesto do Destinatário)
   */
  async downloadNFe(
    chaveNFe: string, 
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ 
    success: boolean; 
    mensagem: string; 
    xml?: string;
  }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        return {
          success: true,
          mensagem: "NF-e encontrada",
          xml: `<xml>Representação da NF-e ${chaveNFe}</xml>` // Simplificado para exemplo
        };
      } else {
        return {
          success: false,
          mensagem: "NF-e não encontrada ou acesso não autorizado"
        };
      }
    } catch (error) {
      console.error("Erro ao fazer download da NF-e:", error);
      return {
        success: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Simula a manifestação do destinatário da NF-e
   */
  async manifestarDestinatario(
    chaveNFe: string,
    tipoManifestacao: string, // 210200=Confirmação, 210210=Ciência, 210220=Desconhecimento, 210240=Operação não Realizada
    justificativa: string | undefined,
    config: FiscalConfig, 
    certificado: FiscalCertificate
  ): Promise<{ 
    success: boolean; 
    mensagem: string; 
    protocolo?: string;
  }> {
    try {
      // Em produção, faria uma chamada SOAP para o webservice
      // Simulando resposta
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      if (success) {
        const protocolo = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        
        return {
          success: true,
          mensagem: "Evento registrado e vinculado a NF-e",
          protocolo
        };
      } else {
        return {
          success: false,
          mensagem: "Rejeição: Chave de Acesso inexistente"
        };
      }
    } catch (error) {
      console.error("Erro ao manifestar destinatário:", error);
      return {
        success: false,
        mensagem: `Erro ao comunicar com a SEFAZ: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Parser XML para importar NF-e
   */
  parseXmlNFe(xmlString: string): any {
    try {
      const xmlObj = xml2js(xmlString, { compact: true });
      
      // Determinar se é um XML de NFe ou nfeProc
      const nfeObj = xmlObj.nfeProc ? xmlObj.nfeProc.NFe : xmlObj.NFe;
      
      if (!nfeObj) {
        throw new Error("XML não contém uma NFe válida");
      }
      
      const infNFe = nfeObj.infNFe;
      const emit = infNFe.emit;
      const dest = infNFe.dest;
      const ide = infNFe.ide;
      
      // Extrair informações básicas
      const chaveNFe = infNFe._attributes.Id?.replace(/^NFe/, '') || '';
      
      // Extrair itens da nota
      const itens = Array.isArray(infNFe.det) 
        ? infNFe.det.map(this.parseDet)
        : [this.parseDet(infNFe.det)];
      
      // Extrair informações de pagamento
      const pagamento = this.parsePagamento(infNFe.pag);
      
      // Extrair informações de emitente e destinatário
      const emitente = this.parseEmitente(emit);
      const destinatario = this.parseDestinatario(dest);
      
      // Extrair informações gerais da nota
      const nota = {
        chave: chaveNFe,
        numero: parseInt(ide.nNF._text || '0'),
        serie: parseInt(ide.serie._text || '0'),
        dataEmissao: ide.dhEmi._text,
        naturezaOperacao: ide.natOp._text,
        tipoOperacao: ide.tpNF._text, // 0=Entrada, 1=Saída
        finalidade: ide.finNFe._text,
        valorTotal: parseFloat(infNFe.total.ICMSTot.vNF._text || '0'),
        valorProdutos: parseFloat(infNFe.total.ICMSTot.vProd._text || '0'),
        valorFrete: parseFloat(infNFe.total.ICMSTot.vFrete._text || '0'),
        valorSeguro: parseFloat(infNFe.total.ICMSTot.vSeg._text || '0'),
        valorDesconto: parseFloat(infNFe.total.ICMSTot.vDesc._text || '0'),
        valorOutrasDespesas: parseFloat(infNFe.total.ICMSTot.vOutro._text || '0'),
        valorICMS: parseFloat(infNFe.total.ICMSTot.vICMS._text || '0'),
        valorICMSST: parseFloat(infNFe.total.ICMSTot.vST._text || '0'),
        valorIPI: parseFloat(infNFe.total.ICMSTot.vIPI._text || '0'),
        valorPIS: parseFloat(infNFe.total.ICMSTot.vPIS._text || '0'),
        valorCOFINS: parseFloat(infNFe.total.ICMSTot.vCOFINS._text || '0'),
        informacoesAdicionais: infNFe.infAdic?.infCpl?._text || ''
      };
      
      return {
        nota,
        emitente,
        destinatario,
        itens,
        pagamento
      };
    } catch (error) {
      console.error("Erro ao fazer parse do XML:", error);
      throw new Error(`Falha ao processar XML: ${(error as Error).message}`);
    }
  }
  
  /**
   * Parser para os itens da NF-e
   */
  private parseDet(det: any): any {
    const item = det?.prod;
    if (!item) return null;
    
    // Extrair informações do item
    const imposto = det.imposto;
    const icms = this.findICMS(imposto?.ICMS);
    const pis = this.findPIS(imposto?.PIS);
    const cofins = this.findCOFINS(imposto?.COFINS);
    const ipi = imposto?.IPI;
    
    return {
      nItem: parseInt(det._attributes?.nItem || '0'),
      codigo: item.cProd._text,
      descricao: item.xProd._text,
      ncm: item.NCM._text,
      cfop: item.CFOP._text,
      unidade: item.uCom._text,
      quantidade: parseFloat(item.qCom._text || '0'),
      valorUnitario: parseFloat(item.vUnCom._text || '0'),
      valorTotal: parseFloat(item.vProd._text || '0'),
      codigoBarras: item.cEAN._text === 'SEM GTIN' ? null : item.cEAN._text,
      // Impostos
      cstICMS: icms?.CST?._text || icms?.CSOSN?._text,
      baseCalculoICMS: parseFloat(icms?.vBC?._text || '0'),
      aliquotaICMS: parseFloat(icms?.pICMS?._text || '0'),
      valorICMS: parseFloat(icms?.vICMS?._text || '0'),
      cstPIS: pis?.CST?._text,
      baseCalculoPIS: parseFloat(pis?.vBC?._text || '0'),
      aliquotaPIS: parseFloat(pis?.pPIS?._text || '0'),
      valorPIS: parseFloat(pis?.vPIS?._text || '0'),
      cstCOFINS: cofins?.CST?._text,
      baseCalculoCOFINS: parseFloat(cofins?.vBC?._text || '0'),
      aliquotaCOFINS: parseFloat(cofins?.pCOFINS?._text || '0'),
      valorCOFINS: parseFloat(cofins?.vCOFINS?._text || '0'),
      cstIPI: ipi?.IPITrib?.CST?._text || ipi?.IPINT?.CST?._text,
      baseCalculoIPI: parseFloat(ipi?.IPITrib?.vBC?._text || '0'),
      aliquotaIPI: parseFloat(ipi?.IPITrib?.pIPI?._text || '0'),
      valorIPI: parseFloat(ipi?.IPITrib?.vIPI?._text || '0')
    };
  }
  
  /**
   * Encontra o objeto ICMS na estrutura do imposto
   */
  private findICMS(icms: any): any {
    if (!icms) return null;
    
    // Verificar diferentes tipos de tributação ICMS
    return icms.ICMS00 || icms.ICMS10 || icms.ICMS20 || icms.ICMS30 || 
           icms.ICMS40 || icms.ICMS51 || icms.ICMS60 || icms.ICMS70 || 
           icms.ICMS90 || icms.ICMSSN101 || icms.ICMSSN102 || icms.ICMSSN201 || 
           icms.ICMSSN202 || icms.ICMSSN500 || icms.ICMSSN900;
  }
  
  /**
   * Encontra o objeto PIS na estrutura do imposto
   */
  private findPIS(pis: any): any {
    if (!pis) return null;
    
    // Verificar diferentes tipos de tributação PIS
    return pis.PISAliq || pis.PISQtde || pis.PISOutr || pis.PISNT || pis.PISSN;
  }
  
  /**
   * Encontra o objeto COFINS na estrutura do imposto
   */
  private findCOFINS(cofins: any): any {
    if (!cofins) return null;
    
    // Verificar diferentes tipos de tributação COFINS
    return cofins.COFINSAliq || cofins.COFINSQtde || cofins.COFINSOutr || 
           cofins.COFINSNT || cofins.COFINSSN;
  }
  
  /**
   * Parser para informações de pagamento
   */
  private parsePagamento(pag: any): any {
    if (!pag) return { formaPagamento: '90', valor: 0 }; // 90=Sem pagamento
    
    // Extrair informações de pagamento
    const detPag = Array.isArray(pag.detPag) ? pag.detPag[0] : pag.detPag;
    
    return {
      formaPagamento: detPag?.tPag?._text || '90',
      valor: parseFloat(detPag?.vPag?._text || '0')
    };
  }
  
  /**
   * Parser para informações do emitente
   */
  private parseEmitente(emit: any): any {
    if (!emit) return null;
    
    // Extrair informações do endereço
    const enderEmit = emit.enderEmit;
    
    return {
      cnpj: emit.CNPJ?._text,
      cpf: emit.CPF?._text,
      nome: emit.xNome?._text,
      nomeFantasia: emit.xFant?._text,
      inscricaoEstadual: emit.IE?._text,
      inscricaoMunicipal: emit.IM?._text,
      cnae: emit.CNAE?._text,
      regimeTributario: emit.CRT?._text,
      endereco: {
        logradouro: enderEmit?.xLgr?._text,
        numero: enderEmit?.nro?._text,
        complemento: enderEmit?.xCpl?._text,
        bairro: enderEmit?.xBairro?._text,
        codigoMunicipio: enderEmit?.cMun?._text,
        municipio: enderEmit?.xMun?._text,
        uf: enderEmit?.UF?._text,
        cep: enderEmit?.CEP?._text,
        codigoPais: enderEmit?.cPais?._text,
        pais: enderEmit?.xPais?._text,
        telefone: enderEmit?.fone?._text
      }
    };
  }
  
  /**
   * Parser para informações do destinatário
   */
  private parseDestinatario(dest: any): any {
    if (!dest) return null;
    
    // Extrair informações do endereço
    const enderDest = dest.enderDest;
    
    return {
      cnpj: dest.CNPJ?._text,
      cpf: dest.CPF?._text,
      nome: dest.xNome?._text,
      indicadorIE: dest.indIEDest?._text,
      inscricaoEstadual: dest.IE?._text,
      email: dest.email?._text,
      endereco: {
        logradouro: enderDest?.xLgr?._text,
        numero: enderDest?.nro?._text,
        complemento: enderDest?.xCpl?._text,
        bairro: enderDest?.xBairro?._text,
        codigoMunicipio: enderDest?.cMun?._text,
        municipio: enderDest?.xMun?._text,
        uf: enderDest?.UF?._text,
        cep: enderDest?.CEP?._text,
        codigoPais: enderDest?.cPais?._text,
        pais: enderDest?.xPais?._text,
        telefone: enderDest?.fone?._text
      }
    };
  }
}

export default new SefazService();