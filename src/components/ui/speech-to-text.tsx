'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpeechToTextProps {
  onTranscript: (text: string) => void
  className?: string
}

export function SpeechToText({ onTranscript, className }: SpeechToTextProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        try {
          // Send audio to API for transcription
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) throw new Error('Transcription failed')
          
          const data = await response.json()
          if (data.text) {
            onTranscript(data.text)
          }
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsProcessing(false)
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "secondary"}
      size="icon"
      className={cn("relative", className)}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}