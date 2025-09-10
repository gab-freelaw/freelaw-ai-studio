export interface ImageAnalysisOptions {
  detail?: 'low' | 'high' | 'auto';
  maxTokens?: number;
  analysisType?: 'general' | 'legal_document' | 'evidence' | 'signature';
}

export class VisionService {
  private static instance: VisionService;

  private constructor() {}

  static getInstance(): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService();
    }
    return VisionService.instance;
  }

  /**
   * Analyze image using GPT-4 Vision
   */
  async analyzeImage(
    imageUrl: string | File | Blob,
    prompt: string,
    options: ImageAnalysisOptions = {}
  ): Promise<string> {
    try {
      let imageData: string;

      if (typeof imageUrl === 'string') {
        imageData = imageUrl;
      } else {
        // Convert file to base64
        imageData = await this.fileToBase64(imageUrl);
      }

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`,
                detail: options.detail || 'auto',
              },
            },
          ],
        },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: 'gpt-4o',
          max_tokens: options.maxTokens || 4096,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.text();
      return result;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze legal document image
   */
  async analyzeLegalDocument(imageFile: File | Blob | string): Promise<{
    type: string;
    content: string;
    extractedText: string;
    keyInformation: Record<string, any>;
  }> {
    const prompt = `Analise esta imagem de documento jurídico e forneça:
    1. Tipo de documento (petição, contrato, sentença, etc.)
    2. Texto extraído do documento
    3. Informações-chave (partes, datas, valores, etc.)
    4. Qualquer assinatura ou carimbo visível
    5. Observações relevantes para uso jurídico
    
    Responda em formato JSON estruturado.`;

    const analysis = await this.analyzeImage(imageFile, prompt, {
      detail: 'high',
      analysisType: 'legal_document',
    });

    try {
      return JSON.parse(analysis);
    } catch {
      return {
        type: 'unknown',
        content: analysis,
        extractedText: analysis,
        keyInformation: {},
      };
    }
  }

  /**
   * Extract text from document image using OCR
   */
  async extractTextFromImage(imageFile: File | Blob | string): Promise<string> {
    const prompt = `Extraia TODO o texto visível nesta imagem. 
    Mantenha a formatação original o máximo possível.
    Se houver tabelas, preserve sua estrutura.
    Não adicione comentários ou explicações, apenas o texto extraído.`;

    return await this.analyzeImage(imageFile, prompt, {
      detail: 'high',
    });
  }

  /**
   * Analyze evidence images (photos, screenshots, etc.)
   */
  async analyzeEvidence(
    imageFile: File | Blob | string,
    context: string = ''
  ): Promise<{
    description: string;
    relevantDetails: string[];
    legalImplications: string;
    authenticityConcerns: string[];
  }> {
    const prompt = `Analise esta imagem como evidência legal.
    ${context ? `Contexto: ${context}` : ''}
    
    Forneça:
    1. Descrição detalhada do que é visível
    2. Detalhes relevantes para uso como prova
    3. Possíveis implicações legais
    4. Preocupações sobre autenticidade ou manipulação
    
    Responda em formato JSON.`;

    const analysis = await this.analyzeImage(imageFile, prompt, {
      detail: 'high',
      analysisType: 'evidence',
    });

    try {
      return JSON.parse(analysis);
    } catch {
      return {
        description: analysis,
        relevantDetails: [],
        legalImplications: '',
        authenticityConcerns: [],
      };
    }
  }

  /**
   * Verify and analyze signatures in documents
   */
  async analyzeSignature(imageFile: File | Blob | string): Promise<{
    hasSignature: boolean;
    numberOfSignatures: number;
    locations: string[];
    observations: string;
  }> {
    const prompt = `Analise esta imagem em busca de assinaturas.
    Identifique:
    1. Se há assinaturas presentes
    2. Quantas assinaturas existem
    3. Localização das assinaturas no documento
    4. Observações sobre as assinaturas (clareza, completude, etc.)
    
    Responda em formato JSON.`;

    const analysis = await this.analyzeImage(imageFile, prompt, {
      detail: 'high',
      analysisType: 'signature',
    });

    try {
      return JSON.parse(analysis);
    } catch {
      return {
        hasSignature: false,
        numberOfSignatures: 0,
        locations: [],
        observations: analysis,
      };
    }
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyzeImages(
    images: Array<{ file: File | Blob | string; prompt?: string }>,
    defaultPrompt: string = 'Descreva esta imagem em detalhes.'
  ): Promise<string[]> {
    const analyses = await Promise.all(
      images.map(({ file, prompt }) =>
        this.analyzeImage(file, prompt || defaultPrompt)
      )
    );

    return analyses;
  }

  /**
   * Compare two document images
   */
  async compareDocuments(
    image1: File | Blob | string,
    image2: File | Blob | string
  ): Promise<{
    similarities: string[];
    differences: string[];
    recommendation: string;
  }> {
    const base64Image1 = await this.ensureBase64(image1);
    const base64Image2 = await this.ensureBase64(image2);

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Compare estes dois documentos e identifique:
            1. Similaridades principais
            2. Diferenças importantes
            3. Recomendação sobre qual versão usar ou se há inconsistências
            
            Responda em formato JSON.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image1}`,
              detail: 'high',
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image2}`,
              detail: 'high',
            },
          },
        ],
      },
    ];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-4o',
        max_tokens: 4096,
      }),
    });

    const result = await response.text();

    try {
      return JSON.parse(result);
    } catch {
      return {
        similarities: [],
        differences: [],
        recommendation: result,
      };
    }
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  /**
   * Ensure image is in base64 format
   */
  private async ensureBase64(image: File | Blob | string): Promise<string> {
    if (typeof image === 'string') {
      if (image.startsWith('data:')) {
        return image.split(',')[1];
      }
      return image;
    }
    return await this.fileToBase64(image);
  }
}

export const visionService = VisionService.getInstance();