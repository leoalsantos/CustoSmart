import fs from 'fs';
import path from 'path';
import { DatabaseStorage } from '../database-storage';
import { FiscalConfig, NFe, FiscalCertificate, NFeItem } from '@shared/schema';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { createHash, createSign } from 'crypto';
import axios from 'axios';
import https from 'https';

// URLs dos serviços SEFAZ por UF para ambiente de homologação
const URLS_HOMOLOGACAO: Record<string, Record<string, string>> = {
  "MG": {
    NFeAutorizacao: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4",
    NFeRetAutorizacao: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4",
    NFeConsultaProtocolo: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4",
    NFeInutilizacao: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4",
    NFeStatusServico: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4",
    RecepcaoEvento: "https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4"
  }
};

// URLs dos serviços SEFAZ por UF para ambiente de produção
const URLS_PRODUCAO: Record<string, Record<string, string>> = {
  "MG": {
    NFeAutorizacao: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4",
    NFeRetAutorizacao: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4",
    NFeConsultaProtocolo: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4",
    NFeInutilizacao: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4",
    NFeStatusServico: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4",
    RecepcaoEvento: "https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4"
  }
};

export class FiscalService {
  private storage: DatabaseStorage;
  private config: FiscalConfig | null = null;
  private certificate: FiscalCertificate | null = null;
  private pfx: Buffer | null = null;
  private password: string = '';

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async initialize(): Promise<boolean> {
    try {
      this.config = await this.storage.getFiscalConfig() || null;
      if (!this.config) {
        console.error("Configuração fiscal não encontrada");
        return false;
      }

      if (!this.config.certificadoId) {
        console.error("Certificado não configurado");
        return false;
      }

      this.certificate = await this.storage.getFiscalCertificate(this.config.certificadoId);
      if (!this.certificate) {
        console.error("Certificado não encontrado");
        return false;
      }

      // Carregar certificado PFX
      if (!fs.existsSync(this.certificate.pfxFilePath)) {
        console.error("Arquivo do certificado não encontrado");
        return false;
      }

      this.pfx = fs.readFileSync(this.certificate.pfxFilePath);
      this.password = this.certificate.password;

      return true;
    } catch (error) {
      console.error("Erro ao inicializar serviço fiscal:", error);
      return false;
    }
  }

  private getUrl(servico: string): string {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    const ambiente = this.config.ambiente === "1" ? URLS_PRODUCAO : URLS_HOMOLOGACAO;
    const uf = this.config.webserviceUF || this.config.uf;
    
    if (!ambiente[uf] || !ambiente[uf][servico]) {
      throw new Error(`URL do serviço ${servico} não encontrada para UF ${uf}`);
    }

    return ambiente[uf][servico];
  }

  private async request(url: string, xml: string, soapAction: string): Promise<string> {
    if (!this.pfx || !this.password) {
      throw new Error("Certificado não carregado");
    }

    // Montar envelope SOAP
    const soapEnvelope = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header/>
        <soap:Body>
          ${xml}
        </soap:Body>
      </soap:Envelope>
    `;

    // Configurar agente HTTPS com certificado
    const agent = new https.Agent({
      pfx: this.pfx,
      passphrase: this.password,
      rejectUnauthorized: false // Usar true em produção
    });

    try {
      const response = await axios.post(url, soapEnvelope, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/soap+xml;charset=utf-8',
          'SOAPAction': soapAction
        }
      });

      return response.data;
    } catch (error) {
      console.error("Erro na requisição SEFAZ:", error);
      throw error;
    }
  }

  async statusServico(): Promise<any> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    try {
      // Criar XML de consulta status serviço
      const xml = `
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">
          <consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <tpAmb>${this.config.ambiente}</tpAmb>
            <cUF>${this.config.cUF}</cUF>
            <xServ>STATUS</xServ>
          </consStatServ>
        </nfeDadosMsg>
      `;

      const url = this.getUrl("NFeStatusServico");
      const response = await this.request(url, xml, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF");

      // Parsear resposta XML
      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(response);

      return result;
    } catch (error) {
      console.error("Erro ao consultar status do serviço:", error);
      throw error;
    }
  }

  private async gerarChaveAcesso(nfe: NFe): Promise<string> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    const dataEmissao = new Date(nfe.dataEmissao);
    const anoMes = `${dataEmissao.getFullYear().toString().slice(2)}${(dataEmissao.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Obter CNPJ do emitente
    const emitente = typeof nfe.emitente === 'string' ? JSON.parse(nfe.emitente) : nfe.emitente;
    const cnpj = emitente.CNPJ || emitente.cnpj || '';
    if (!cnpj) {
      throw new Error("CNPJ do emitente não encontrado");
    }

    // Construir chave: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8)
    const cUF = this.config.cUF;
    const modelo = nfe.tipoDocumento.padStart(2, '0');
    const serie = nfe.serie.toString().padStart(3, '0');
    const nNF = nfe.numeroNota.toString().padStart(9, '0');
    const tpEmis = "1"; // Emissão normal
    
    // Código numérico aleatório
    const cNF = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    
    // Construir a chave sem o DV
    const chave = `${cUF}${anoMes}${cnpj}${modelo}${serie}${nNF}${tpEmis}${cNF}`;
    
    // Calcular DV
    const pesosDV = [2, 3, 4, 5, 6, 7, 8, 9];
    let soma = 0;
    let peso = 2;
    
    for (let i = chave.length - 1; i >= 0; i--) {
      soma += parseInt(chave[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto = soma % 11;
    const dv = resto === 0 || resto === 1 ? 0 : 11 - resto;
    
    return `${chave}${dv}`;
  }

  private async gerarXmlNFe(nfe: NFe, itens: NFeItem[]): Promise<string> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    if (!nfe.chaveAcesso) {
      nfe.chaveAcesso = await this.gerarChaveAcesso(nfe);
    }

    // Calcular total da NF-e a partir dos itens
    let valorTotal = 0;
    for (const item of itens) {
      valorTotal += item.valorTotal;
    }
    nfe.valorTotal = valorTotal;

    // Emitente e destinatário (converter de JSON para objeto se necessário)
    const emitente = typeof nfe.emitente === 'string' ? JSON.parse(nfe.emitente) : nfe.emitente;
    const destinatario = typeof nfe.destinatario === 'string' ? JSON.parse(nfe.destinatario) : nfe.destinatario;

    // Criar estrutura da NFe
    const dataNF = new Date(nfe.dataEmissao).toISOString().split('T')[0];
    
    // Montar XML da NFe
    const nfeObj = {
      "NFe": {
        "@xmlns": "http://www.portalfiscal.inf.br/nfe",
        "infNFe": {
          "@Id": `NFe${nfe.chaveAcesso}`,
          "@versao": "4.00",
          "ide": {
            "cUF": this.config.cUF,
            "cNF": nfe.chaveAcesso.substring(35, 43),
            "natOp": nfe.naturezaOperacao,
            "mod": nfe.tipoDocumento,
            "serie": nfe.serie,
            "nNF": nfe.numeroNota,
            "dhEmi": new Date(nfe.dataEmissao).toISOString(),
            "tpNF": nfe.tipoOperacao,
            "idDest": "1", // Operação interna
            "cMunFG": emitente.cMunFG || "3100104", // Código do município
            "tpImp": "1", // DANFE normal
            "tpEmis": "1", // Emissão normal
            "cDV": nfe.chaveAcesso.substring(43, 44),
            "tpAmb": this.config.ambiente,
            "finNFe": nfe.finalidadeEmissao,
            "indFinal": "1", // Consumidor final
            "indPres": nfe.indicadorPresenca,
            "procEmi": "0", // Emissão normal
            "verProc": "CustoSmart 1.0"
          },
          "emit": {
            "CNPJ": emitente.CNPJ,
            "xNome": emitente.xNome,
            "xFant": emitente.xFant,
            "enderEmit": {
              "xLgr": emitente.enderEmit.xLgr,
              "nro": emitente.enderEmit.nro,
              "xBairro": emitente.enderEmit.xBairro,
              "cMun": emitente.enderEmit.cMun,
              "xMun": emitente.enderEmit.xMun,
              "UF": emitente.enderEmit.UF,
              "CEP": emitente.enderEmit.CEP,
              "cPais": "1058",
              "xPais": "BRASIL",
              "fone": emitente.enderEmit.fone
            },
            "IE": emitente.IE,
            "CRT": emitente.CRT // Código de Regime Tributário
          },
          "dest": {
            [destinatario.CPF ? "CPF" : "CNPJ"]: destinatario.CPF || destinatario.CNPJ,
            "xNome": destinatario.xNome,
            "enderDest": {
              "xLgr": destinatario.enderDest.xLgr,
              "nro": destinatario.enderDest.nro,
              "xBairro": destinatario.enderDest.xBairro,
              "cMun": destinatario.enderDest.cMun,
              "xMun": destinatario.enderDest.xMun,
              "UF": destinatario.enderDest.UF,
              "CEP": destinatario.enderDest.CEP,
              "cPais": "1058",
              "xPais": "BRASIL",
              "fone": destinatario.enderDest.fone
            },
            "indIEDest": destinatario.indIEDest || "9", // 9=Não contribuinte
            "email": destinatario.email
          },
          "det": itens.map((item, index) => ({
            "@nItem": index + 1,
            "prod": {
              "cProd": item.codigoProduto,
              "cEAN": "SEM GTIN",
              "xProd": item.descricao,
              "NCM": item.ncm,
              "CFOP": item.cfop,
              "uCom": item.unidade,
              "qCom": item.quantidade,
              "vUnCom": item.valorUnitario.toFixed(4),
              "vProd": item.valorTotal.toFixed(2),
              "cEANTrib": "SEM GTIN",
              "uTrib": item.unidade,
              "qTrib": item.quantidade,
              "vUnTrib": item.valorUnitario.toFixed(4),
              "indTot": "1"
            },
            "imposto": {
              "ICMS": {
                [`ICMS${item.cstICMS?.substring(0, 2) || "00"}`]: {
                  "orig": "0",
                  "CST": item.cstICMS || "00",
                  "modBC": "0",
                  "vBC": item.valorBaseCalculoICMS?.toFixed(2) || "0.00",
                  "pICMS": item.aliquotaICMS?.toFixed(2) || "0.00",
                  "vICMS": item.valorICMS?.toFixed(2) || "0.00"
                }
              },
              "PIS": {
                [`PIS${item.cstPIS?.substring(0, 2) || "07"}`]: {
                  "CST": item.cstPIS || "07",
                  "vBC": item.valorBaseCalculoPIS?.toFixed(2) || "0.00",
                  "pPIS": item.aliquotaPIS?.toFixed(2) || "0.00",
                  "vPIS": item.valorPIS?.toFixed(2) || "0.00"
                }
              },
              "COFINS": {
                [`COFINS${item.cstCOFINS?.substring(0, 2) || "07"}`]: {
                  "CST": item.cstCOFINS || "07",
                  "vBC": item.valorBaseCalculoCOFINS?.toFixed(2) || "0.00",
                  "pCOFINS": item.aliquotaCOFINS?.toFixed(2) || "0.00",
                  "vCOFINS": item.valorCOFINS?.toFixed(2) || "0.00"
                }
              }
            }
          })),
          "total": {
            "ICMSTot": {
              "vBC": itens.reduce((sum, item) => sum + (item.valorBaseCalculoICMS || 0), 0).toFixed(2),
              "vICMS": itens.reduce((sum, item) => sum + (item.valorICMS || 0), 0).toFixed(2),
              "vICMSDeson": "0.00",
              "vFCPUFDest": "0.00",
              "vICMSUFDest": "0.00",
              "vICMSUFRemet": "0.00",
              "vFCP": "0.00",
              "vBCST": "0.00",
              "vST": "0.00",
              "vFCPST": "0.00",
              "vFCPSTRet": "0.00",
              "vProd": itens.reduce((sum, item) => sum + item.valorTotal, 0).toFixed(2),
              "vFrete": "0.00",
              "vSeg": "0.00",
              "vDesc": "0.00",
              "vII": "0.00",
              "vIPI": "0.00",
              "vIPIDevol": "0.00",
              "vPIS": itens.reduce((sum, item) => sum + (item.valorPIS || 0), 0).toFixed(2),
              "vCOFINS": itens.reduce((sum, item) => sum + (item.valorCOFINS || 0), 0).toFixed(2),
              "vOutro": "0.00",
              "vNF": nfe.valorTotal.toFixed(2)
            }
          },
          "transp": {
            "modFrete": "9" // 9=Sem frete
          },
          "pag": {
            "detPag": {
              "tPag": "90", // 90=Sem pagamento
              "vPag": "0.00"
            }
          },
          "infAdic": {
            "infCpl": nfe.informacoesAdicionais || ""
          }
        }
      }
    };

    // Adicionar informações do responsável técnico se houver
    if (nfe.responsavelTecnico) {
      const respTec = typeof nfe.responsavelTecnico === 'string' 
        ? JSON.parse(nfe.responsavelTecnico) 
        : nfe.responsavelTecnico;
      
      nfeObj.NFe.infNFe.infRespTec = {
        "CNPJ": respTec.CNPJ,
        "xContato": respTec.xContato,
        "email": respTec.email,
        "fone": respTec.fone
      };
    }

    // Converter objeto para XML
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      attributeNamePrefix: "@",
      suppressEmptyNode: true
    });
    
    return builder.build(nfeObj);
  }

  async enviarNFe(nfeId: number): Promise<any> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    try {
      // Obter NF-e e seus itens
      const nfe = await this.storage.getNFe(nfeId);
      if (!nfe) {
        throw new Error("NF-e não encontrada");
      }

      const itens = await this.storage.getNFeItens(nfeId);
      if (itens.length === 0) {
        throw new Error("NF-e sem itens");
      }

      // Gerar XML da NF-e
      const xmlNFe = await this.gerarXmlNFe(nfe, itens);
      
      // Criar lote de envio
      const idLote = new Date().getTime().toString();
      const xmlEnvio = `
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
          <enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <idLote>${idLote}</idLote>
            <indSinc>1</indSinc>
            ${xmlNFe}
          </enviNFe>
        </nfeDadosMsg>
      `;

      // Enviar para SEFAZ
      const url = this.getUrl("NFeAutorizacao");
      const response = await this.request(url, xmlEnvio, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote");

      // Parsear resposta XML
      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(response);

      // Atualizar NF-e com resultado
      const retorno = result?.['soap:Envelope']?.['soap:Body']?.['nfeResultMsg']?.['retEnviNFe'];
      
      if (retorno?.protNFe?.infProt) {
        const infProt = retorno.protNFe.infProt;
        
        // Atualizar status da NF-e baseado no retorno
        const status = infProt.cStat === "100" ? "autorizada" : "rejeitada";
        
        await this.storage.updateNFe(nfeId, {
          status,
          xmlAutorizacao: response,
          protocolo: infProt.nProt,
          motivoRejeicao: infProt.cStat !== "100" ? infProt.xMotivo : null
        });
      }

      return result;
    } catch (error) {
      console.error("Erro ao enviar NF-e:", error);
      throw error;
    }
  }

  async consultarNFe(chaveAcesso: string): Promise<any> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    try {
      // Criar XML de consulta
      const xml = `
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
          <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <tpAmb>${this.config.ambiente}</tpAmb>
            <xServ>CONSULTAR</xServ>
            <chNFe>${chaveAcesso}</chNFe>
          </consSitNFe>
        </nfeDadosMsg>
      `;

      // Enviar para SEFAZ
      const url = this.getUrl("NFeConsultaProtocolo");
      const response = await this.request(url, xml, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF");

      // Parsear resposta XML
      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(response);

      return result;
    } catch (error) {
      console.error("Erro ao consultar NF-e:", error);
      throw error;
    }
  }

  async cancelarNFe(nfeId: number, justificativa: string): Promise<any> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    try {
      // Obter NF-e
      const nfe = await this.storage.getNFe(nfeId);
      if (!nfe) {
        throw new Error("NF-e não encontrada");
      }

      if (!nfe.chaveAcesso) {
        throw new Error("NF-e sem chave de acesso");
      }

      if (nfe.status !== "autorizada") {
        throw new Error("Apenas NF-e autorizadas podem ser canceladas");
      }

      // Validar justificativa (mínimo 15 caracteres)
      if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
        throw new Error("Justificativa deve ter entre 15 e 255 caracteres");
      }

      // Criar XML de cancelamento
      const dataEvento = new Date().toISOString();
      const sequencia = "1"; // Sequencial do evento
      const tipoEvento = "110111"; // Cancelamento
      
      // ID do evento: ID + chave + sequencial do evento
      const idEvento = `ID${tipoEvento}${nfe.chaveAcesso}${sequencia.padStart(2, '0')}`;
      
      const xml = `
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">
          <envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
            <idLote>1</idLote>
            <evento versao="1.00">
              <infEvento Id="${idEvento}">
                <cOrgao>${this.config.cUF}</cOrgao>
                <tpAmb>${this.config.ambiente}</tpAmb>
                <CNPJ>${JSON.parse(nfe.emitente.toString()).CNPJ}</CNPJ>
                <chNFe>${nfe.chaveAcesso}</chNFe>
                <dhEvento>${dataEvento}</dhEvento>
                <tpEvento>${tipoEvento}</tpEvento>
                <nSeqEvento>${sequencia}</nSeqEvento>
                <verEvento>1.00</verEvento>
                <detEvento versao="1.00">
                  <descEvento>Cancelamento</descEvento>
                  <nProt>${nfe.protocolo}</nProt>
                  <xJust>${justificativa}</xJust>
                </detEvento>
              </infEvento>
            </evento>
          </envEvento>
        </nfeDadosMsg>
      `;

      // Enviar para SEFAZ
      const url = this.getUrl("RecepcaoEvento");
      const response = await this.request(url, xml, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento");

      // Parsear resposta XML
      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(response);

      // Processar retorno
      const retorno = result?.['soap:Envelope']?.['soap:Body']?.['nfeResultMsg']?.['retEnvEvento'];
      
      if (retorno?.retEvento?.infEvento) {
        const infEvento = retorno.retEvento.infEvento;
        const statusEvento = infEvento.cStat === "135" || infEvento.cStat === "155" ? "concluido" : "rejeitado";
        
        // Registrar evento de cancelamento
        await this.storage.createNFeEvento({
          nfeId,
          tipoEvento: "cancelamento",
          status: statusEvento,
          xml: response,
          protocolo: infEvento.nProt,
          dataEvento: new Date(),
          motivo: justificativa,
          createdAt: new Date(),
          createdBy: 1 // ID do usuário logado
        });

        // Se cancelamento foi aceito, atualizar status da NF-e
        if (statusEvento === "concluido") {
          await this.storage.updateNFe(nfeId, {
            status: "cancelada",
            xmlCancelamento: response
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Erro ao cancelar NF-e:", error);
      throw error;
    }
  }

  async cartaCorrecaoNFe(nfeId: number, correcao: string): Promise<any> {
    if (!this.config) {
      throw new Error("Serviço fiscal não inicializado");
    }

    try {
      // Obter NF-e
      const nfe = await this.storage.getNFe(nfeId);
      if (!nfe) {
        throw new Error("NF-e não encontrada");
      }

      if (!nfe.chaveAcesso) {
        throw new Error("NF-e sem chave de acesso");
      }

      if (nfe.status !== "autorizada") {
        throw new Error("Apenas NF-e autorizadas podem receber carta de correção");
      }

      // Validar correção (mínimo 15 caracteres)
      if (!correcao || correcao.length < 15 || correcao.length > 1000) {
        throw new Error("Correção deve ter entre 15 e 1000 caracteres");
      }

      // Obter eventos anteriores para determinar sequência
      const eventos = await this.storage.getNFeEventos(nfeId);
      const cartasCorrecao = eventos.filter(e => e.tipoEvento === "carta_correcao");
      const sequencia = (cartasCorrecao.length + 1).toString();
      
      // Criar XML de carta de correção
      const dataEvento = new Date().toISOString();
      const tipoEvento = "110110"; // Carta de Correção
      
      // ID do evento: ID + chave + sequencial do evento
      const idEvento = `ID${tipoEvento}${nfe.chaveAcesso}${sequencia.padStart(2, '0')}`;
      
      const xml = `
        <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">
          <envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
            <idLote>1</idLote>
            <evento versao="1.00">
              <infEvento Id="${idEvento}">
                <cOrgao>${this.config.cUF}</cOrgao>
                <tpAmb>${this.config.ambiente}</tpAmb>
                <CNPJ>${JSON.parse(nfe.emitente.toString()).CNPJ}</CNPJ>
                <chNFe>${nfe.chaveAcesso}</chNFe>
                <dhEvento>${dataEvento}</dhEvento>
                <tpEvento>${tipoEvento}</tpEvento>
                <nSeqEvento>${sequencia}</nSeqEvento>
                <verEvento>1.00</verEvento>
                <detEvento versao="1.00">
                  <descEvento>Carta de Correcao</descEvento>
                  <xCorrecao>${correcao}</xCorrecao>
                  <xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso>
                </detEvento>
              </infEvento>
            </evento>
          </envEvento>
        </nfeDadosMsg>
      `;

      // Enviar para SEFAZ
      const url = this.getUrl("RecepcaoEvento");
      const response = await this.request(url, xml, "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento");

      // Parsear resposta XML
      const parser = new XMLParser({ ignoreAttributes: false });
      const result = parser.parse(response);

      // Processar retorno
      const retorno = result?.['soap:Envelope']?.['soap:Body']?.['nfeResultMsg']?.['retEnvEvento'];
      
      if (retorno?.retEvento?.infEvento) {
        const infEvento = retorno.retEvento.infEvento;
        const statusEvento = infEvento.cStat === "135" ? "concluido" : "rejeitado";
        
        // Registrar evento de carta de correção
        await this.storage.createNFeEvento({
          nfeId,
          tipoEvento: "carta_correcao",
          status: statusEvento,
          xml: response,
          protocolo: infEvento.nProt,
          dataEvento: new Date(),
          textoCorrecao: correcao,
          createdAt: new Date(),
          createdBy: 1 // ID do usuário logado
        });
      }

      return result;
    } catch (error) {
      console.error("Erro ao enviar carta de correção:", error);
      throw error;
    }
  }

  async gerarDANFE(nfeId: number): Promise<string> {
    try {
      // Obter NF-e e seus itens
      const nfe = await this.storage.getNFe(nfeId);
      if (!nfe) {
        throw new Error("NF-e não encontrada");
      }

      const itens = await this.storage.getNFeItens(nfeId);
      
      // Aqui seria implementada a geração do PDF do DANFE
      // Normalmente usaria uma biblioteca como pdfmake ou puppeteer
      
      // Este é apenas um exemplo simplificado
      const danfePath = path.join('./uploads/danfe', `danfe_${nfe.chaveAcesso}.pdf`);
      
      // Garantir que o diretório existe
      const dir = path.dirname(danfePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Neste ponto, normalmente geraria o PDF e o salvaria
      // Como é apenas um exemplo, simulamos a criação do arquivo
      fs.writeFileSync(danfePath, "DANFE Simulado");
      
      return danfePath;
    } catch (error) {
      console.error("Erro ao gerar DANFE:", error);
      throw error;
    }
  }
}