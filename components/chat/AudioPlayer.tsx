'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AudioPlayerProps {
  audioUrl: string
  duration: number // em segundos
  waveform?: number[]
  senderName: string
  timestamp: string
  isOwn?: boolean
  transcription?: string
  transcriptionConfidence?: number
  messageId?: string
  delegationId?: string
  onTranscribeRequest?: (messageId: string) => void
}

export default function AudioPlayer({
  audioUrl,
  duration,
  waveform = [],
  senderName,
  timestamp,
  isOwn = false,
  transcription,
  transcriptionConfidence,
  messageId,
  delegationId,
  onTranscribeRequest
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showTranscription, setShowTranscription] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
      audioRef.current.playbackRate = playbackRate
    }
  }, [volume, isMuted, playbackRate])

  const togglePlay = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (percentage: number) => {
    if (audioRef.current) {
      const newTime = (percentage / 100) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
  }

  const downloadAudio = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `audio-${senderName}-${new Date().getTime()}.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR
    })
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }

  return (
    <div className={`max-w-sm p-3 rounded-2xl ${
      isOwn 
        ? 'bg-gradient-to-r from-freelaw-purple to-tech-blue text-white ml-12' 
        : 'bg-gray-100 text-gray-900 mr-12'
    }`}>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        preload="metadata"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <Volume2 className="w-3 h-3" />
          <span className="text-xs font-medium">Áudio</span>
        </div>
        <span className="text-xs opacity-75">
          {formatTime(duration)}
        </span>
      </div>

      {/* Waveform Visualization */}
      <div className="h-8 mb-2 flex items-end justify-center space-x-px cursor-pointer" 
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect()
             const percentage = ((e.clientX - rect.left) / rect.width) * 100
             handleSeek(percentage)
           }}>
        {waveform.length > 0 ? (
          waveform.map((amplitude, index) => {
            const isPlayed = (index / waveform.length) * 100 <= progress
            return (
              <div
                key={index}
                className={`w-0.5 rounded-sm transition-all duration-150 ${
                  isOwn
                    ? isPlayed 
                      ? 'bg-white' 
                      : 'bg-white/40'
                    : isPlayed 
                      ? 'bg-freelaw-purple' 
                      : 'bg-gray-400'
                }`}
                style={{
                  height: `${Math.max(amplitude * 100, 8)}%`
                }}
              />
            )
          })
        ) : (
          // Fallback: barra de progresso simples
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <Progress 
          value={progress} 
          className={`h-1 ${isOwn ? 'bg-white/20' : 'bg-gray-300'}`}
        />
        <div className="flex justify-between text-xs opacity-75 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{playbackRate}x</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            disabled={isLoading}
            className={`h-7 w-7 p-0 ${
              isOwn 
                ? 'text-white hover:bg-white/20' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={changePlaybackRate}
            className={`h-6 px-1 text-xs ${
              isOwn 
                ? 'text-white hover:bg-white/20' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {playbackRate}x
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            className={`h-7 w-7 p-0 ${
              isOwn 
                ? 'text-white hover:bg-white/20' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          {/* Botão de transcrição */}
          {transcription ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTranscription(!showTranscription)}
              className={`h-7 w-7 p-0 ${
                isOwn 
                  ? 'text-white hover:bg-white/20' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title={showTranscription ? "Ocultar transcrição" : "Mostrar transcrição"}
            >
              {showTranscription ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          ) : messageId && onTranscribeRequest && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTranscribeRequest(messageId)}
              className={`h-7 w-7 p-0 ${
                isOwn 
                  ? 'text-white hover:bg-white/20' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title="Transcrever áudio"
            >
              <FileText className="w-3 h-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={downloadAudio}
            className={`h-7 w-7 p-0 ${
              isOwn 
                ? 'text-white hover:bg-white/20' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Baixar áudio"
          >
            <Download className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSeek(0)}
            className={`h-7 w-7 p-0 ${
              isOwn 
                ? 'text-white hover:bg-white/20' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title="Reiniciar"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Transcrição */}
      {showTranscription && transcription && (
        <div className={`mt-3 p-2 rounded text-xs border-t ${
          isOwn 
            ? 'border-white/20 bg-white/10' 
            : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              Transcrição
            </span>
            {transcriptionConfidence && (
              <span className={`text-xs ${getConfidenceColor(transcriptionConfidence)}`}>
                {getConfidenceText(transcriptionConfidence)} confiança
              </span>
            )}
          </div>
          <p className={`${isOwn ? 'text-white/90' : 'text-gray-700'} leading-relaxed`}>
            {transcription}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 text-xs opacity-75">
        <span>{senderName}</span>
        <span>{formatTimestamp(timestamp)}</span>
      </div>
    </div>
  )
}
