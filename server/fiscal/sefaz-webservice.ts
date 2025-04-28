import axios from 'axios';
import { js2xml, xml2js } from 'xml-js';
import fs from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import forge from 'node-forge';
import { FiscalConfig, FiscalCertificate } from '@shared/schema';

/**
 * Endpoints dos webservices da SEFAZ por UF e ambiente
 */
const SEFAZ_ENDPOINTS = {
  // Ambiente de produção
  '1': {
    'MG': {
      'NFeAutorizacao': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      'NFeConsultaProtocolo': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      'NFeStatusServico': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      'NFeRetAutorizacao': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      'NFeInutilizacao': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
      'NFeRecepcaoEvento': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4'
    }
  },
  // Ambiente de homologação (testes)
  '2': {
    'MG': {
      'NFeAutorizacao': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      'NFeConsultaProtocolo': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      'NFeStatusServico': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      'NFeRetAutorizacao': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      'NFeInutilizacao': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
      'NFeRecepcaoEvento': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4'
    }
  }
};

/**
 * Interface para representar um certificado digital
 */
interface ICertificateInfo {
  pfx: Buffer;
  password: string;
  serialNumber: string;
  privateKey?: forge.pki.PrivateKey;
  publicKey?: forge.pki.Certificate;
}

/**
 * Classe para comunicação com webservices da SEFAZ
 */
export class SefazWebService {
  private certificateCache: Map<number, ICertificateInfo> = new Map();
  private soapEnvelopeTemplate: string;
  
  constructor() {
    // Template SOAP para envio de mensagens
    const projectRoot = process.cwd();
    this.soapEnvelopeTemplate = fs.readFileSync(
      join(projectRoot, 'server/templates/soap-envelope.xml'), 
      'utf8'
    );
  }
  
  /**
   * Carrega um certificado digital
   */
  async loadCertificate(certificate: FiscalCertificate): Promise<ICertificateInfo> {
    if (this.certificateCache.has(certificate.id)) {
      return this.certificateCache.get(certificate.id)!;
    }
    
    const pfxBuffer = Buffer.from(certificate.certificateData, 'base64');
    
    // Extrair chave privada e certificado usando node-forge
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificate.password);
    
    // Obter chaves, certificados e cadeia de certificados
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]![0];
    
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]![0];
    
    const privateKey = keyBag.key;
    const certObject = certBag.cert;
    
    const certInfo = {
      pfx: pfxBuffer,
      password: certificate.password,
      serialNumber: certificate.serialNumber,
      privateKey: privateKey,
      publicKey: certObject
    };
    
    this.certificateCache.set(certificate.id, certInfo);
    return certInfo;
  }
  
  /**
   * Assina um XML usando o certificado digital
   */
  async signXml(xml: string, certificateInfo: ICertificateInfo, signatureLocation: string): Promise<string> {
    // Implementação de assinatura digital do XML
    // Esta é uma implementação simplificada, a real precisaria seguir os padrões da SEFAZ
    
    // 1. Obter o nó que deve ser assinado
    const xmlObj = xml2js(xml, { compact: true, spaces: 2 });
    
    // 2. Calcular o digest (SHA-1)
    const canonicalXml = this.getCanonicalXml(xml, signatureLocation);
    const digestValue = crypto.createHash('sha1').update(canonicalXml).digest('base64');
    
    // 3. Criar elemento SignedInfo
    const signedInfo = {
      "SignedInfo": {
        "CanonicalizationMethod": {
          "_attributes": {
            "Algorithm": "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
          }
        },
        "SignatureMethod": {
          "_attributes": {
            "Algorithm": "http://www.w3.org/2000/09/xmldsig#rsa-sha1"
          }
        },
        "Reference": {
          "_attributes": {
            "URI": `#${signatureLocation}`
          },
          "Transforms": {
            "Transform": {
              "_attributes": {
                "Algorithm": "http://www.w3.org/2000/09/xmldsig#enveloped-signature"
              }
            }
          },
          "DigestMethod": {
            "_attributes": {
              "Algorithm": "http://www.w3.org/2000/09/xmldsig#sha1"
            }
          },
          "DigestValue": {
            "_text": digestValue
          }
        }
      }
    };
    
    // 4. Assinar o SignedInfo
    const signedInfoXml = js2xml(signedInfo, { compact: true });
    const signedInfoCanonical = this.getCanonicalXml(signedInfoXml, "");
    
    // 5. Assinar usando a chave privada (RSA-SHA1)
    const md = forge.md.sha1.create();
    md.update(signedInfoCanonical);
    
    const signature = certificateInfo.privateKey!.sign(md);
    const signatureValue = forge.util.encode64(signature);
    
    // 6. Certificado em base64
    const certData = forge.util.encode64(
      forge.asn1.toDer(certificateInfo.publicKey!.toAsn1()).getBytes()
    );
    
    // 7. Montar a assinatura completa
    const signatureObj = {
      "Signature": {
        "_attributes": {
          "xmlns": "http://www.w3.org/2000/09/xmldsig#"
        },
        "SignedInfo": signedInfo.SignedInfo,
        "SignatureValue": {
          "_text": signatureValue
        },
        "KeyInfo": {
          "X509Data": {
            "X509Certificate": {
              "_text": certData
            }
          }
        }
      }
    };
    
    // 8. Adicionar a assinatura no local apropriado do XML
    // Esta parte depende da estrutura do XML e varia conforme o tipo de documento
    
    // Retornar o XML assinado (simplificação)
    return xml;
  }
  
  /**
   * Obtém a versão canônica de um XML para assinatura
   */
  private getCanonicalXml(xml: string, signatureLocation: string): string {
    // Implementação simplificada
    // Na prática, é necessário usar uma biblioteca específica para canonicalização XML
    return xml;
  }
  
  /**
   * Consulta status do serviço SEFAZ
   */
  async consultarStatusServico(config: FiscalConfig, certificateInfo: ICertificateInfo): Promise<any> {
    const uf = config.uf;
    const ambiente = config.ambiente;
    
    // Montar XML da requisição
    const mensagem = {
      "consStatServ": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe",
          "versao": "4.00"
        },
        "tpAmb": { "_text": ambiente },
        "cUF": { "_text": this.getCodigoUF(uf) },
        "xServ": { "_text": "STATUS" }
      }
    };
    
    const xml = js2xml(mensagem, { compact: true });
    const xmlAssinado = await this.signXml(xml, certificateInfo, "consStatServ");
    
    // Enviar para o webservice
    const endpoint = SEFAZ_ENDPOINTS[ambiente][uf]['NFeStatusServico'];
    const response = await this.enviarParaSefaz(xmlAssinado, endpoint, certificateInfo, 'nfeStatusServicoNF');
    
    return response;
  }
  
  /**
   * Autoriza uma NFe
   */
  async autorizarNFe(xml: string, config: FiscalConfig, certificateInfo: ICertificateInfo): Promise<any> {
    const uf = config.uf;
    const ambiente = config.ambiente;
    
    // Assinar o XML da NFe
    const xmlAssinado = await this.signXml(xml, certificateInfo, "infNFe");
    
    // Montar o envelope de requisição
    const envelope = {
      "enviNFe": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe",
          "versao": "4.00"
        },
        "idLote": { "_text": this.gerarIdLote() },
        "indSinc": { "_text": "1" }, // 1 = Síncrono, 0 = Assíncrono
        "NFe": xmlAssinado
      }
    };
    
    const xmlEnvio = js2xml(envelope, { compact: true });
    
    // Enviar para o webservice
    const endpoint = SEFAZ_ENDPOINTS[ambiente][uf]['NFeAutorizacao'];
    const response = await this.enviarParaSefaz(xmlEnvio, endpoint, certificateInfo, 'nfeAutorizacaoLote');
    
    return response;
  }
  
  /**
   * Consulta o resultado do processamento de uma NFe
   */
  async consultarProcessamentoNFe(chaveAcesso: string, config: FiscalConfig, certificateInfo: ICertificateInfo): Promise<any> {
    const uf = config.uf;
    const ambiente = config.ambiente;
    
    // Montar XML da requisição
    const mensagem = {
      "consSitNFe": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe",
          "versao": "4.00"
        },
        "tpAmb": { "_text": ambiente },
        "xServ": { "_text": "CONSULTAR" },
        "chNFe": { "_text": chaveAcesso }
      }
    };
    
    const xml = js2xml(mensagem, { compact: true });
    const xmlAssinado = await this.signXml(xml, certificateInfo, "consSitNFe");
    
    // Enviar para o webservice
    const endpoint = SEFAZ_ENDPOINTS[ambiente][uf]['NFeConsultaProtocolo'];
    const response = await this.enviarParaSefaz(xmlAssinado, endpoint, certificateInfo, 'nfeConsultaNF');
    
    return response;
  }
  
  /**
   * Envia um evento de NFe (cancelamento, etc)
   */
  async enviarEventoNFe(
    chaveAcesso: string, 
    tipoEvento: string, 
    nSeqEvento: number,
    justificativa: string,
    config: FiscalConfig, 
    certificateInfo: ICertificateInfo
  ): Promise<any> {
    const uf = config.uf;
    const ambiente = config.ambiente;
    const dataHora = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const idEvento = `ID${tipoEvento}${chaveAcesso}${nSeqEvento.toString().padStart(2, '0')}`;
    
    // Montar XML da requisição
    const mensagem = {
      "envEvento": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe",
          "versao": "1.00"
        },
        "idLote": { "_text": this.gerarIdLote() },
        "evento": {
          "_attributes": {
            "versao": "1.00"
          },
          "infEvento": {
            "_attributes": {
              "Id": idEvento
            },
            "cOrgao": { "_text": this.getCodigoUF(uf) },
            "tpAmb": { "_text": ambiente },
            "CNPJ": { "_text": config.cnpj.replace(/[^\d]/g, '') },
            "chNFe": { "_text": chaveAcesso },
            "dhEvento": { "_text": dataHora },
            "tpEvento": { "_text": tipoEvento },
            "nSeqEvento": { "_text": nSeqEvento },
            "verEvento": { "_text": "1.00" },
            "detEvento": {
              "_attributes": {
                "versao": "1.00"
              },
              "descEvento": { "_text": this.getDescricaoEvento(tipoEvento) },
              "nProt": { "_text": "" }, // Protocolo de autorização, se necessário
              "xJust": { "_text": justificativa }
            }
          }
        }
      }
    };
    
    const xml = js2xml(mensagem, { compact: true });
    const xmlAssinado = await this.signXml(xml, certificateInfo, "infEvento");
    
    // Enviar para o webservice
    const endpoint = SEFAZ_ENDPOINTS[ambiente][uf]['NFeRecepcaoEvento'];
    const response = await this.enviarParaSefaz(xmlAssinado, endpoint, certificateInfo, 'nfeRecepcaoEvento');
    
    return response;
  }
  
  /**
   * Cancela uma NFe
   */
  async cancelarNFe(
    chaveAcesso: string, 
    protocolo: string,
    justificativa: string,
    config: FiscalConfig, 
    certificateInfo: ICertificateInfo
  ): Promise<any> {
    // O tipo de evento de cancelamento é 110111
    return this.enviarEventoNFe(chaveAcesso, '110111', 1, justificativa, config, certificateInfo);
  }
  
  /**
   * Inutiliza uma numeração de NFe
   */
  async inutilizarNumeracao(
    ano: number,
    modelo: string,
    serie: number,
    numeroInicial: number,
    numeroFinal: number,
    justificativa: string,
    config: FiscalConfig,
    certificateInfo: ICertificateInfo
  ): Promise<any> {
    const uf = config.uf;
    const ambiente = config.ambiente;
    const cnpj = config.cnpj.replace(/[^\d]/g, '');
    
    // Identificador da inutilização
    const id = `ID${this.getCodigoUF(uf)}${ano.toString().substring(2)}${modelo}${serie.toString().padStart(3, '0')}${numeroInicial.toString().padStart(9, '0')}${numeroFinal.toString().padStart(9, '0')}`;
    
    // Montar XML da requisição
    const mensagem = {
      "inutNFe": {
        "_attributes": {
          "xmlns": "http://www.portalfiscal.inf.br/nfe",
          "versao": "4.00"
        },
        "infInut": {
          "_attributes": {
            "Id": id
          },
          "tpAmb": { "_text": ambiente },
          "xServ": { "_text": "INUTILIZAR" },
          "cUF": { "_text": this.getCodigoUF(uf) },
          "ano": { "_text": ano.toString().substring(2) },
          "CNPJ": { "_text": cnpj },
          "mod": { "_text": modelo },
          "serie": { "_text": serie },
          "nNFIni": { "_text": numeroInicial },
          "nNFFin": { "_text": numeroFinal },
          "xJust": { "_text": justificativa }
        }
      }
    };
    
    const xml = js2xml(mensagem, { compact: true });
    const xmlAssinado = await this.signXml(xml, certificateInfo, "infInut");
    
    // Enviar para o webservice
    const endpoint = SEFAZ_ENDPOINTS[ambiente][uf]['NFeInutilizacao'];
    const response = await this.enviarParaSefaz(xmlAssinado, endpoint, certificateInfo, 'nfeInutilizacaoNF');
    
    return response;
  }
  
  /**
   * Gera um ID de lote único
   */
  private gerarIdLote(): string {
    return Date.now().toString();
  }
  
  /**
   * Obtém o código da UF a partir da sigla
   */
  private getCodigoUF(uf: string): string {
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
   * Obtém a descrição do evento a partir do código
   */
  private getDescricaoEvento(tipoEvento: string): string {
    const descricoes: Record<string, string> = {
      '110110': 'Carta de Correção',
      '110111': 'Cancelamento',
      '210200': 'Confirmação da Operação',
      '210210': 'Ciência da Operação',
      '210220': 'Desconhecimento da Operação',
      '210240': 'Operação não Realizada'
    };
    
    return descricoes[tipoEvento] || 'Evento desconhecido';
  }
  
  /**
   * Envia uma requisição SOAP para o webservice da SEFAZ
   */
  private async enviarParaSefaz(
    xml: string, 
    endpoint: string, 
    certificateInfo: ICertificateInfo,
    soapAction: string
  ): Promise<any> {
    // Montar o envelope SOAP
    const soapEnvelope = this.soapEnvelopeTemplate
      .replace('{{SOAP_ACTION}}', soapAction)
      .replace('{{XML_CONTENT}}', xml);
    
    // Configurações para requisição HTTPS com certificado digital
    const axiosConfig = {
      httpsAgent: {
        pfx: certificateInfo.pfx,
        passphrase: certificateInfo.password,
        rejectUnauthorized: false
      },
      headers: {
        'Content-Type': 'application/soap+xml;charset=utf-8;',
        'SOAPAction': soapAction
      }
    };
    
    try {
      // Enviar requisição para o webservice
      const response = await axios.post(endpoint, soapEnvelope, axiosConfig);
      
      // Processar resposta SOAP
      const responseXml = response.data;
      const responseObj = xml2js(responseXml, { compact: true });
      
      return responseObj;
    } catch (error) {
      console.error('Erro ao enviar requisição para SEFAZ:', error);
      throw error;
    }
  }
}

// Exportar uma instância singleton
export default new SefazWebService();