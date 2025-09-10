import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simular info geral do chat
    const chatInfo = {
      status: 'online',
      activeUsers: 42,
      totalRooms: 15,
      totalMessages: 1250,
      features: {
        fileUpload: true,
        audioRecording: true,
        transcription: true,
        realtime: true
      },
      supportedFormats: ['text', 'file', 'audio'],
      maxFileSize: '10MB',
      maxMessageLength: 5000
    }
    
    return NextResponse.json(chatInfo)

  } catch (error: any) {
    console.error('Erro ao obter info do chat:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Simular criação de nova sala de chat
    const newRoom = {
      id: 'room-' + Date.now(),
      name: body.name || 'Nova Sala',
      participants: body.participants || [],
      createdAt: new Date().toISOString(),
      type: body.type || 'delegation'
    }
    
    return NextResponse.json({
      message: 'Sala de chat criada com sucesso',
      room: newRoom
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar sala de chat:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}