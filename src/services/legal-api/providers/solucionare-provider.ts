/**
 * Solucionare API Provider Implementation
 */

import { BaseApiProvider } from './base-provider';
import {
  ApiProvider,
  ApiProviderConfig,
  ProcessSearchResult,
  PersonSearchResult,
  LegalDocument,
  ProcessMovement,
  SearchOptions,
  ProcessAttachment,
} from '../types';
import { API_PROVIDER_CONFIGS } from '../config';
import * as crypto from 'crypto';

export class SolucionareProvider extends BaseApiProvider {
  readonly name = ApiProvider.SOLUCIONARE;
  readonly config: ApiProviderConfig;
  
  constructor() {
    const config = API_PROVIDER_CONFIGS[ApiProvider.SOLUCIONARE];
    super(config);
    this.config = config;
  }
  
  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Only add API headers if config is available
    if (this.config?.apiKey) {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(timestamp);
      
      headers['X-API-Key'] = this.config.apiKey;
      headers['X-API-Timestamp'] = timestamp;
      headers['X-API-Signature'] = signature;
    }
    
    return headers;
  }
  
  /**
   * Generate HMAC signature for Solucionare API
   */
  private generateSignature(timestamp: string): string {
    if (!this.config?.apiKey) {
      return '';
    }
    
    const data = `${this.config.apiKey}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.config.apiSecret || '')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Search for a legal process by number
   */
  async searchProcess(processNumber: string, options?: SearchOptions): Promise<ProcessSearchResult> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.post('/consulta/processo', {
        numeroProcesso: this.normalizeProcessNumber(processNumber),
        incluirMovimentacoes: true,
        incluirPartes: true,
        incluirDocumentos: false,
      });
      
      return this.transformProcessResult(response.data.processo);
    });
  }
  
  /**
   * Search for a person by document (CPF/CNPJ)
   */
  async searchPerson(document: string, options?: SearchOptions): Promise<PersonSearchResult> {
    return this.retryWithBackoff(async () => {
      const cleanDoc = this.cleanDocument(document);
      
      const response = await this.client.post('/consulta/parte', {
        documento: cleanDoc,
        tipoDocumento: cleanDoc.length === 11 ? 'CPF' : 'CNPJ',
        incluirProcessos: true,
        incluirEnderecos: true,
      });
      
      return this.transformPersonResult(response.data.parte);
    });
  }
  
  /**
   * Get a legal document by ID
   */
  async getDocument(documentId: string, options?: SearchOptions): Promise<LegalDocument> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/documento/${documentId}/conteudo`);
      
      return this.transformDocumentResult(response.data.documento);
    });
  }
  
  /**
   * Track movements for a process
   */
  async trackMovements(processId: string, since?: Date): Promise<ProcessMovement[]> {
    return this.retryWithBackoff(async () => {
      const body: any = {
        processoId: processId,
        ordem: 'DESC',
        limite: 100,
      };
      
      if (since) {
        body.dataInicio = since.toISOString();
      }
      
      const response = await this.client.post('/consulta/movimentacoes', body);
      
      return this.transformMovements(response.data.movimentacoes || []);
    });
  }
  
  /**
   * Get remaining API credits
   */
  async getRemainingCredits(): Promise<number> {
    try {
      const response = await this.client.get('/conta/saldo');
      return response.data.saldo?.creditosDisponiveis || 0;
    } catch (error) {
      console.error('Failed to get Solucionare credits:', error);
      return 0;
    }
  }
  
  /**
   * Subscribe to webhook for process updates
   */
  async subscribeToWebhook(processId: string, webhookUrl: string): Promise<void> {
    await this.client.post('/webhook/inscrever', {
      processoId: processId,
      url: webhookUrl,
      eventos: ['nova_movimentacao', 'mudanca_status', 'novo_documento'],
    });
  }
  
  /**
   * Unsubscribe from webhook
   */
  async unsubscribeFromWebhook(processId: string): Promise<void> {
    await this.client.delete(`/webhook/desinscrever/${processId}`);
  }
  
  /**
   * Normalize process number to Solucionare format
   */
  private normalizeProcessNumber(processNumber: string): string {
    // Solucionare accepts multiple formats, just clean it
    return processNumber.replace(/[^\d\-\.]/g, '');
  }
  
  /**
   * Clean document number (CPF/CNPJ)
   */
  private cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
  }
  
  /**
   * Transform Solucionare process result to standard format
   */
  private transformProcessResult(data: any): ProcessSearchResult {
    return {
      id: data.id || data.processoId,
      number: data.numeroProcesso || data.numero,
      court: data.orgaoJulgador || data.tribunal,
      status: this.mapProcessStatus(data.status || data.situacao),
      parties: {
        plaintiff: this.extractParties(data.partes, 'ATIVO'),
        defendant: this.extractParties(data.partes, 'PASSIVO'),
      },
      movements: this.transformMovements(data.movimentacoes || []),
      lastUpdate: new Date(data.dataUltimaAtualizacao || data.ultimaMovimentacao),
      value: data.valorCausa,
      subject: data.assuntoPrincipal || data.classe,
      rawData: data,
    };
  }
  
  /**
   * Transform Solucionare person result to standard format
   */
  private transformPersonResult(data: any): PersonSearchResult {
    return {
      id: data.id || data.parteId,
      name: data.nome || data.razaoSocial,
      document: data.documento,
      documentType: data.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ',
      processes: (data.processos || []).map((proc: any) => ({
        id: proc.id || proc.processoId,
        number: proc.numeroProcesso,
        court: proc.orgaoJulgador,
        role: this.mapPartyRole(proc.tipoParte || proc.polo),
        status: this.mapProcessStatus(proc.status),
        lastMovement: proc.dataUltimaMovimentacao ? new Date(proc.dataUltimaMovimentacao) : undefined,
      })),
      addresses: this.transformAddresses(data.enderecos),
      phones: data.telefones || [],
      emails: data.emails || [],
    };
  }
  
  /**
   * Transform Solucionare document result to standard format
   */
  private transformDocumentResult(data: any): LegalDocument {
    return {
      id: data.id || data.documentoId,
      type: this.mapDocumentType(data.tipoDocumento),
      title: data.titulo || data.descricao,
      content: data.conteudo || data.textoCompleto,
      date: new Date(data.dataDocumento || data.dataPublicacao),
      processId: data.processoId,
      author: data.emissor || data.autor,
      url: data.urlDownload || data.link,
    };
  }
  
  /**
   * Transform Solucionare movements to standard format
   */
  private transformMovements(movements: any[]): ProcessMovement[] {
    return movements.map(mov => ({
      id: mov.id || mov.movimentacaoId,
      date: new Date(mov.dataMovimentacao || mov.data),
      type: mov.tipoMovimentacao || mov.categoria,
      description: mov.descricao || mov.resumo,
      content: mov.integra || mov.textoCompleto,
      attachments: this.transformAttachments(mov.documentos || mov.anexos),
    }));
  }
  
  /**
   * Transform attachments
   */
  private transformAttachments(attachments: any[]): ProcessAttachment[] {
    if (!attachments || !Array.isArray(attachments)) return [];
    
    return attachments.map(att => ({
      id: att.id || att.documentoId,
      name: att.nomeArquivo || att.titulo,
      url: att.urlDownload || att.link,
      type: att.tipoArquivo || att.formato || 'pdf',
      size: att.tamanhoBytes || att.tamanho,
    }));
  }
  
  /**
   * Transform addresses
   */
  private transformAddresses(addresses: any[]): any[] {
    if (!addresses || !Array.isArray(addresses)) return [];
    
    return addresses.map(addr => ({
      street: addr.logradouro || addr.rua,
      number: addr.numero,
      complement: addr.complemento,
      neighborhood: addr.bairro,
      city: addr.cidade || addr.municipio,
      state: addr.estado || addr.uf,
      zipCode: addr.cep,
      country: addr.pais || 'Brasil',
    }));
  }
  
  /**
   * Extract parties by pole/type
   */
  private extractParties(parties: any[], pole: string): string[] {
    if (!parties || !Array.isArray(parties)) return [];
    
    return parties
      .filter(p => 
        p.polo === pole || 
        p.tipoPolo === pole || 
        (pole === 'ATIVO' && (p.tipo === 'autor' || p.tipo === 'requerente')) ||
        (pole === 'PASSIVO' && (p.tipo === 'reu' || p.tipo === 'requerido'))
      )
      .map(p => p.nome || p.razaoSocial);
  }
  
  /**
   * Map process status
   */
  private mapProcessStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ATIVO': 'active',
      'ARQUIVADO': 'archived',
      'SUSPENSO': 'suspended',
      'BAIXADO': 'closed',
      'EM_ANDAMENTO': 'active',
      'CONCLUSO': 'active',
      'ENCERRADO': 'closed',
    };
    
    return statusMap[status?.toUpperCase()] || status || 'unknown';
  }
  
  /**
   * Map party role
   */
  private mapPartyRole(role: string): 'plaintiff' | 'defendant' | 'lawyer' | 'other' {
    const roleMap: Record<string, 'plaintiff' | 'defendant' | 'lawyer' | 'other'> = {
      'AUTOR': 'plaintiff',
      'REU': 'defendant',
      'REQUERENTE': 'plaintiff',
      'REQUERIDO': 'defendant',
      'EXEQUENTE': 'plaintiff',
      'EXECUTADO': 'defendant',
      'ADVOGADO': 'lawyer',
      'ATIVO': 'plaintiff',
      'PASSIVO': 'defendant',
    };
    
    return roleMap[role?.toUpperCase()] || 'other';
  }
  
  /**
   * Map document type
   */
  private mapDocumentType(type: string): 'petition' | 'sentence' | 'decision' | 'order' | 'other' {
    const typeMap: Record<string, 'petition' | 'sentence' | 'decision' | 'order' | 'other'> = {
      'PETICAO': 'petition',
      'PETICAO_INICIAL': 'petition',
      'SENTENCA': 'sentence',
      'DECISAO': 'decision',
      'DECISAO_INTERLOCUTORIA': 'decision',
      'DESPACHO': 'order',
      'ACORDAO': 'decision',
    };
    
    return typeMap[type?.toUpperCase()] || 'other';
  }
}