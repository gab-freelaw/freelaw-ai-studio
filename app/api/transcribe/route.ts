import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TranscriptionService } from '@/lib/services/TranscriptionService'

// POST - Transcrever áudio
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const messageId = formData.get('messageId') as string
    const delegationId = formData.get('delegationId') as string
    const contextPrompt = formData.get('contextPrompt') as string || undefined

    if (!audioFile || !messageId || !delegationId) {
      return NextResponse.json(
        { error: 'Arquivo de áudio, messageId e delegationId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo (máx 25MB do Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 25MB.' },
        { status: 400 }
      )
    }

    // Verificar tipo do arquivo
    const allowedTypes = [
      'audio/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a'
    ]
    
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const userOfficeId = userData?.metadata?.organization_id
    const hasAccess = userOfficeId === delegation.office_id || user.id === delegation.provider_id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verificar se a mensagem existe e pertence ao usuário ou à delegação
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('id, sender_id, delegation_id, message_type')
      .eq('id', messageId)
      .eq('delegation_id', delegationId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      )
    }

    if (message.message_type !== 'audio') {
      return NextResponse.json(
        { error: 'Mensagem não é do tipo áudio' },
        { status: 400 }
      )
    }

    // Converter arquivo para buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Transcrever áudio
    const transcriptionService = new TranscriptionService()
    
    let transcriptionResult
    try {
      if (contextPrompt) {
        transcriptionResult = await transcriptionService.transcribeWithLegalContext(
          audioBuffer,
          audioFile.name,
          contextPrompt
        )
      } else {
        transcriptionResult = await transcriptionService.transcribeWithLegalContext(
          audioBuffer,
          audioFile.name
        )
      }
    } catch (transcriptionError: any) {
      console.error('Transcription service error:', transcriptionError)
      return NextResponse.json(
        { error: transcriptionError.message || 'Erro na transcrição' },
        { status: 500 }
      )
    }

    // Validar qualidade da transcrição
    const validation = transcriptionService.validateTranscription(transcriptionResult)
    
    // Formatar texto
    const formattedText = transcriptionService.formatTranscription(transcriptionResult)
    
    // Gerar resumo
    const summary = transcriptionService.generateSummary(transcriptionResult)

    // Salvar transcrição no banco
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({
        audio_transcription: formattedText,
        transcription_confidence: transcriptionResult.confidence,
        transcription_language: transcriptionResult.language,
        metadata: {
          transcription: {
            segments: transcriptionResult.segments,
            validation,
            summary,
            transcribed_at: new Date().toISOString(),
            transcribed_by: user.id
          }
        }
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Update message error:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar transcrição' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transcription: {
        text: formattedText,
        confidence: transcriptionResult.confidence,
        language: transcriptionResult.language,
        validation,
        summary,
        segments: transcriptionResult.segments
      }
    })
    
  } catch (error: any) {
    console.error('Transcribe API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar transcrições de uma delegação
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const delegationId = searchParams.get('delegationId')

    if (!delegationId) {
      return NextResponse.json(
        { error: 'delegationId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar acesso à delegação
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .select('id, office_id, provider_id')
      .eq('id', delegationId)
      .single()

    if (delegationError || !delegation) {
      return NextResponse.json(
        { error: 'Delegação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const { data: userData } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const userOfficeId = userData?.metadata?.organization_id
    const hasAccess = userOfficeId === delegation.office_id || user.id === delegation.provider_id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar mensagens de áudio com transcrição
    const { data: audioMessages, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        audio_transcription,
        transcription_confidence,
        transcription_language,
        audio_duration,
        sender_id,
        sender_type,
        created_at,
        metadata,
        sender:users(full_name, email)
      `)
      .eq('delegation_id', delegationId)
      .eq('message_type', 'audio')
      .not('audio_transcription', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get transcriptions error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar transcrições' },
        { status: 500 }
      )
    }

    const transcriptions = audioMessages.map(msg => ({
      messageId: msg.id,
      text: msg.audio_transcription,
      confidence: msg.transcription_confidence,
      language: msg.transcription_language,
      duration: msg.audio_duration,
      senderName: 'Usuário',
      senderType: msg.sender_type,
      createdAt: msg.created_at,
      summary: msg.metadata?.transcription?.summary,
      validation: msg.metadata?.transcription?.validation
    }))

    return NextResponse.json({
      transcriptions,
      total: transcriptions.length
    })
    
  } catch (error: any) {
    console.error('Get transcriptions API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


