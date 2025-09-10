'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Send,
  Trash2,
  Volume2,
  Loader2
} from 'lucide-react'

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, duration: number, waveform: number[]) => Promise<void>
  onCancel: () => void
  maxDuration?: number // segundos
}

export default function AudioRecorder({ 
  onSendAudio, 
  onCancel, 
  maxDuration = 300 // 5 minutos
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [isSending, setIsSending] = useState(false)
  const [volume, setVolume] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })

      // Setup audio context para análise da forma de onda
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(100) // Coletar dados a cada 100ms
      setIsRecording(true)
      setDuration(0)

      // Timer para duração
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

      // Análise da forma de onda
      updateWaveform()

    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const updateWaveform = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const analyze = () => {
      if (!isRecording && !isPaused) return

      analyserRef.current!.getByteFrequencyData(dataArray)
      
      // Calcular amplitude média
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      const normalizedVolume = average / 255
      
      setVolume(normalizedVolume)
      setWaveformData(prev => [...prev.slice(-50), normalizedVolume]) // Manter últimos 50 pontos

      animationRef.current = requestAnimationFrame(analyze)
    }

    analyze()
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      // Retomar timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

      updateWaveform()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }

  const playAudio = () => {
    if (audioUrl && audioElementRef.current) {
      audioElementRef.current.currentTime = playbackTime
      audioElementRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setDuration(0)
    setPlaybackTime(0)
    setWaveformData([])
    setVolume(0)
  }

  const sendAudio = async () => {
    if (!audioBlob) return

    try {
      setIsSending(true)
      await onSendAudio(audioBlob, duration, waveformData)
      deleteRecording()
      onCancel()
    } catch (error) {
      console.error('Erro ao enviar áudio:', error)
      alert('Erro ao enviar áudio')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRecordingStateIcon = () => {
    if (isRecording && !isPaused) {
      return <Mic className="w-5 h-5 text-red-500 animate-pulse" />
    }
    if (isPaused) {
      return <MicOff className="w-5 h-5 text-yellow-500" />
    }
    return <Mic className="w-5 h-5" />
  }

  return (
    <Card className="p-4 border-2 border-freelaw-purple/20 bg-gradient-to-r from-freelaw-purple/5 to-tech-blue/5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-freelaw-purple" />
            <span className="font-medium text-freelaw-black">
              {isRecording ? 'Gravando áudio...' : audioBlob ? 'Áudio gravado' : 'Gravar mensagem de áudio'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="h-16 bg-gray-100 rounded-lg p-2 flex items-end justify-center space-x-1">
          {waveformData.length > 0 ? (
            waveformData.slice(-40).map((amplitude, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-freelaw-purple to-tech-blue rounded-sm w-1 transition-all duration-150"
                style={{
                  height: `${Math.max(amplitude * 100, 4)}%`,
                  opacity: isRecording && !isPaused ? 0.8 : 0.4
                }}
              />
            ))
          ) : (
            <div className="text-gray-500 text-sm">
              {isRecording ? 'Analisando áudio...' : 'Pressione gravar para começar'}
            </div>
          )}
        </div>

        {/* Volume Indicator */}
        {isRecording && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <Progress 
              value={volume * 100} 
              className="h-1"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Mic className="w-4 h-4 mr-2" />
                Gravar
              </Button>
            )}

            {isRecording && !isPaused && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </>
            )}

            {isPaused && (
              <>
                <Button
                  onClick={resumeRecording}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}

            {audioBlob && (
              <>
                <Button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
                <Button
                  onClick={deleteRecording}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-gray-600"
            >
              Cancelar
            </Button>

            {audioBlob && (
              <Button
                onClick={sendAudio}
                disabled={isSending}
                className="bg-gradient-to-r from-freelaw-purple to-tech-blue hover:from-freelaw-purple/90 hover:to-tech-blue/90 text-white"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Áudio
              </Button>
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onTimeUpdate={(e) => {
              const target = e.target as HTMLAudioElement
              setPlaybackTime(target.currentTime)
            }}
            onEnded={() => {
              setIsPlaying(false)
              setPlaybackTime(0)
            }}
            className="hidden"
          />
        )}

        {/* Progress Indicator */}
        <div className="space-y-1">
          <Progress 
            value={(duration / maxDuration) * 100} 
            className="h-1"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progresso da gravação</span>
            <span>{Math.round((duration / maxDuration) * 100)}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}



