/**
 * Escavador API Provider Implementation
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
  ProcessMovement as Movement,
  ProcessAttachment,
} from '../types';
import { API_PROVIDER_CONFIGS } from '../config';

export class EscavadorProvider extends BaseApiProvider {
  readonly name = ApiProvider.ESCAVADOR;
  readonly config: ApiProviderConfig;
  
  constructor() {
    const config = API_PROVIDER_CONFIGS[ApiProvider.ESCAVADOR];
    super(config);
    this.config = config;
  }
  
  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Only add Authorization header if API key is available
    if (this.config?.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }
  
  /**
   * Search for a legal process by number
   */
  async searchProcess(processNumber: string, options?: SearchOptions): Promise<ProcessSearchResult> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get('/processos/buscar', {
        params: {
          numero: this.normalizeProcessNumber(processNumber),
          completo: true,
        },
      });
      
      return this.transformProcessResult(response.data);
    });
  }
  
  /**
   * Search for a person by document (CPF/CNPJ)
   */
  async searchPerson(document: string, options?: SearchOptions): Promise<PersonSearchResult> {
    return this.retryWithBackoff(async () => {
      const cleanDoc = this.cleanDocument(document);
      const endpoint = cleanDoc.length === 11 ? '/pessoas/cpf' : '/pessoas/cnpj';
      
      const response = await this.client.get(endpoint, {
        params: {
          documento: cleanDoc,
          incluir_processos: true,
        },
      });
      
      return this.transformPersonResult(response.data);
    });
  }
  
  /**
   * Get a legal document by ID
   */
  async getDocument(documentId: string, options?: SearchOptions): Promise<LegalDocument> {
    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/documentos/${documentId}`);
      
      return this.transformDocumentResult(response.data);
    });
  }
  
  /**
   * Track movements for a process
   */
  async trackMovements(processId: string, since?: Date): Promise<ProcessMovement[]> {
    return this.retryWithBackoff(async () => {
      const params: any = {
        processo_id: processId,
        ordenar: 'data_desc',
      };
      
      if (since) {
        params.data_inicio = since.toISOString().split('T')[0];
      }
      
      const response = await this.client.get('/movimentacoes', { params });
      
      return this.transformMovements(response.data.movimentacoes || []);
    });
  }
  
  /**
   * Get remaining API credits
   */
  async getRemainingCredits(): Promise<number> {
    try {
      const response = await this.client.get('/conta/creditos');
      return response.data.creditos_disponiveis || 0;
    } catch (error) {
      console.error('Failed to get Escavador credits:', error);
      return 0;
    }
  }
  
  /**
   * Normalize process number to Escavador format
   */
  private normalizeProcessNumber(processNumber: string): string {
    // Remove all non-numeric characters
    const numbers = processNumber.replace(/\D/g, '');
    
    // Escavador expects format: NNNNNNN-DD.AAAA.J.TT.OOOO
    if (numbers.length === 20) {
      return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14, 16)}.${numbers.slice(16, 20)}`;
    }
    
    return processNumber;
  }
  
  /**
   * Clean document number (CPF/CNPJ)
   */
  private cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
  }
  
  /**
   * Transform Escavador process result to standard format
   */
  private transformProcessResult(data: any): ProcessSearchResult {
    return {
      id: data.id || data.processo_id,
      number: data.numero_processo,
      court: data.tribunal || data.vara,
      status: this.mapProcessStatus(data.situacao),
      parties: {
        plaintiff: this.extractParties(data.partes, 'autor'),
        defendant: this.extractParties(data.partes, 'reu'),
      },
      movements: this.transformMovements(data.movimentacoes || []),
      lastUpdate: new Date(data.ultima_atualizacao || data.data_ultima_movimentacao),
      value: data.valor_causa,
      subject: data.assunto || data.classe,
      rawData: data,
    };
  }
  
  /**
   * Transform Escavador person result to standard format
   */
  private transformPersonResult(data: any): PersonSearchResult {
    const isCPF = data.documento?.length === 11;
    
    return {
      id: data.id || data.pessoa_id,
      name: data.nome,
      document: data.documento,
      documentType: isCPF ? 'CPF' : 'CNPJ',
      processes: (data.processos || []).map((proc: any) => ({
        id: proc.id,
        number: proc.numero,
        court: proc.tribunal,
        role: this.mapPartyRole(proc.tipo_parte),
        status: this.mapProcessStatus(proc.situacao),
        lastMovement: proc.data_ultima_movimentacao ? new Date(proc.data_ultima_movimentacao) : undefined,
      })),
      addresses: this.transformAddresses(data.enderecos),
      phones: data.telefones || [],
      emails: data.emails || [],
    };
  }
  
  /**
   * Transform Escavador document result to standard format
   */
  private transformDocumentResult(data: any): LegalDocument {
    return {
      id: data.id || data.documento_id,
      type: this.mapDocumentType(data.tipo),
      title: data.titulo || data.nome,
      content: data.conteudo || data.texto,
      date: new Date(data.data || data.data_publicacao),
      processId: data.processo_id,
      author: data.autor || data.magistrado,
      url: data.url || data.link_download,
    };
  }
  
  /**
   * Transform Escavador movements to standard format
   */
  private transformMovements(movements: any[]): ProcessMovement[] {
    return movements.map(mov => ({
      id: mov.id || String(mov.codigo),
      date: new Date(mov.data || mov.data_movimentacao),
      type: mov.tipo || mov.categoria,
      description: mov.descricao || mov.titulo,
      content: mov.conteudo || mov.texto,
      attachments: this.transformAttachments(mov.anexos || mov.documentos),
    }));
  }
  
  /**
   * Transform attachments
   */
  private transformAttachments(attachments: any[]): ProcessAttachment[] {
    if (!attachments || !Array.isArray(attachments)) return [];
    
    return attachments.map(att => ({
      id: att.id || String(att.codigo),
      name: att.nome || att.titulo,
      url: att.url || att.link,
      type: att.tipo || 'document',
      size: att.tamanho,
    }));
  }
  
  /**
   * Transform addresses
   */
  private transformAddresses(addresses: any[]): any[] {
    if (!addresses || !Array.isArray(addresses)) return [];
    
    return addresses.map(addr => ({
      street: addr.logradouro,
      number: addr.numero,
      complement: addr.complemento,
      neighborhood: addr.bairro,
      city: addr.cidade,
      state: addr.estado || addr.uf,
      zipCode: addr.cep,
      country: 'Brasil',
    }));
  }
  
  /**
   * Extract parties by type
   */
  private extractParties(parties: any[], type: string): string[] {
    if (!parties || !Array.isArray(parties)) return [];
    
    return parties
      .filter(p => p.tipo === type || p.polo === type)
      .map(p => p.nome);
  }
  
  /**
   * Map process status
   */
  private mapProcessStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ativo': 'active',
      'arquivado': 'archived',
      'suspenso': 'suspended',
      'baixado': 'closed',
      'em_andamento': 'active',
      'finalizado': 'closed',
    };
    
    return statusMap[status?.toLowerCase()] || status || 'unknown';
  }
  
  /**
   * Map party role
   */
  private mapPartyRole(role: string): 'plaintiff' | 'defendant' | 'lawyer' | 'other' {
    const roleMap: Record<string, 'plaintiff' | 'defendant' | 'lawyer' | 'other'> = {
      'autor': 'plaintiff',
      'reu': 'defendant',
      'advogado': 'lawyer',
      'requerente': 'plaintiff',
      'requerido': 'defendant',
      'exequente': 'plaintiff',
      'executado': 'defendant',
    };
    
    return roleMap[role?.toLowerCase()] || 'other';
  }
  
  /**
   * Map document type
   */
  private mapDocumentType(type: string): 'petition' | 'sentence' | 'decision' | 'order' | 'other' {
    const typeMap: Record<string, 'petition' | 'sentence' | 'decision' | 'order' | 'other'> = {
      'peticao': 'petition',
      'sentenca': 'sentence',
      'decisao': 'decision',
      'despacho': 'order',
      'acordao': 'decision',
    };
    
    return typeMap[type?.toLowerCase()] || 'other';
  }
}