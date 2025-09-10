import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDocumentProcessor } from '@/lib/document-processing/processor';
import { ServiceType, LegalArea } from '@/lib/document-processing/types';
import { extractTextFromFile } from '@/lib/document-processing/text-extractor';
import { transcriptionService } from '@/lib/multimedia/transcription-service';
import { visionService } from '@/lib/multimedia/vision-service';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceType = formData.get('serviceType') as ServiceType;
    const legalArea = formData.get('legalArea') as LegalArea;
    const organizationId = formData.get('organizationId') as string;
    
    if (!file || !serviceType || !legalArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate file type - expanded to include multimedia
    const isDocument = ['application/pdf', 'text/plain', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isDocument && !isImage && !isAudio && !isVideo) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido' },
        { status: 400 }
      );
    }
    
    // Check file size (500MB max for legal documents)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 500MB' },
        { status: 400 }
      );
    }
    
    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    
    // Create document record in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId || null,
        uploaded_by: user.id,
        title: file.name,
        type: serviceType === ServiceType.CONTRATO ? 'contract' : 'other',
        category: legalArea,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        tags: [serviceType, legalArea],
        is_public: false,
        is_archived: false
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      );
    }
    
    // Start async processing (don't wait for it)
    processDocumentAsync(document.id, serviceType, legalArea, uint8Array, file.type);
    
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        status: 'processing',
        fileUrl: publicUrl
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Async document processing with multimedia support
async function processDocumentAsync(
  documentId: string,
  serviceType: ServiceType,
  legalArea: LegalArea,
  fileBuffer: Uint8Array,
  mimeType: string
) {
  try {
    let extractedText = '';
    let additionalData: any = {};
    
    // Process based on file type
    if (mimeType.startsWith('image/')) {
      // Process image with vision
      console.log('Processing image with Vision API...');
      const imageBlob = new Blob([Buffer.from(fileBuffer)], { type: mimeType });
      
      // Extract text from image
      extractedText = await visionService.extractTextFromImage(imageBlob);
      
      // Also analyze as legal document
      const analysis = await visionService.analyzeLegalDocument(imageBlob);
      additionalData = analysis;
      
    } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
      // Process audio/video with transcription
      console.log('Processing audio/video with Whisper API...');
      const mediaBlob = new Blob([Buffer.from(fileBuffer)], { type: mimeType });
      
      // Transcribe audio
      extractedText = await transcriptionService.transcribeAudio(mediaBlob, {
        language: 'pt',
        responseFormat: 'text'
      });
      
      additionalData = {
        type: 'transcription',
        duration: 'unknown',
        language: 'pt'
      };
      
    } else {
      // Process regular document
      extractedText = await extractTextFromFile(fileBuffer, mimeType);
    }
    
    // Save extracted text and metadata
    const supabase = await createClient();
    await supabase
      .from('documents')
      .update({
        extracted_text: extractedText,
        metadata: additionalData,
        processing_status: 'completed'
      })
      .eq('id', documentId);
    
    // Process with AI if text was extracted
    if (extractedText) {
      const processor = createDocumentProcessor(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        process.env.GEMINI_API_KEY!
      );
      
      const result = await processor.processDocument(
        documentId,
        serviceType,
        legalArea,
        extractedText
      );
      
      console.log('Document processed:', {
        documentId,
        success: result.success,
        processingTime: result.processingTime,
        chunksProcessed: result.chunksProcessed,
        fileType: mimeType.split('/')[0]
      });
    }
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update document status to failed
    const supabase = await createClient();
    await supabase
      .from('documents')
      .update({
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', documentId);
  }
}