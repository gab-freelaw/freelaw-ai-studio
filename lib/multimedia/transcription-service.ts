// Transcription service using OpenAI Whisper API

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

export class TranscriptionService {
  private static instance: TranscriptionService;

  private constructor() {}

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  /**
   * Transcribe audio or video file using OpenAI Whisper API
   */
  async transcribeAudio(
    file: File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<string> {
    try {
      // Check file size (25MB limit for Whisper API)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        // For larger files, we need to split them
        return await this.transcribeLargeAudio(file, options);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }
      
      if (options.responseFormat) {
        formData.append('response_format', options.responseFormat);
      }
      
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Transcription failed: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.text();
      return result;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Handle large audio files by splitting them into chunks
   */
  private async transcribeLargeAudio(
    file: File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<string> {
    const chunks = await this.splitAudioFile(file);
    const transcriptions: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
      const transcription = await this.transcribeAudio(chunks[i], {
        ...options,
        prompt: i > 0 ? transcriptions.join(' ').slice(-200) : options.prompt,
      });
      transcriptions.push(transcription);
    }

    return transcriptions.join(' ');
  }

  /**
   * Split audio file into smaller chunks
   * Note: This is a simplified version. In production, you'd want to use
   * a proper audio processing library to split at silence points
   */
  private async splitAudioFile(file: File | Blob): Promise<Blob[]> {
    const chunkSize = 20 * 1024 * 1024; // 20MB chunks to be safe
    const chunks: Blob[] = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  }

  /**
   * Extract audio from video file
   * Note: This requires server-side processing with ffmpeg
   */
  async extractAudioFromVideo(videoFile: File): Promise<Blob> {
    // This would typically be handled server-side
    // For now, we'll return the video file itself as many video formats
    // are supported by Whisper API
    return videoFile;
  }

  /**
   * Detect language of audio
   */
  async detectLanguage(file: File | Blob): Promise<string> {
    const transcription = await this.transcribeAudio(file, {
      responseFormat: 'verbose_json',
    });
    
    try {
      const result = JSON.parse(transcription);
      return result.language || 'pt';
    } catch {
      return 'pt'; // Default to Portuguese
    }
  }

  /**
   * Generate subtitles for video
   */
  async generateSubtitles(
    file: File | Blob,
    format: 'srt' | 'vtt' = 'srt'
  ): Promise<string> {
    return await this.transcribeAudio(file, {
      responseFormat: format,
      language: 'pt',
    });
  }

  /**
   * Transcribe and translate audio to Portuguese
   */
  async transcribeAndTranslate(file: File | Blob): Promise<string> {
    // First transcribe in original language
    const transcription = await this.transcribeAudio(file, {
      responseFormat: 'verbose_json',
    });

    const result = JSON.parse(transcription);
    
    // If already in Portuguese, return as is
    if (result.language === 'pt' || result.language === 'portuguese') {
      return result.text;
    }

    // Translate to Portuguese using GPT-4
    const translationResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Você é um tradutor especializado. Traduza o seguinte texto para português brasileiro, mantendo o contexto e tom original.',
          },
          {
            role: 'user',
            content: result.text,
          },
        ],
        model: 'gpt-4o-mini',
      }),
    });

    const translation = await translationResponse.text();
    return translation;
  }
}

export const transcriptionService = TranscriptionService.getInstance();