"use client";

import { CornerRightUp, Mic, MicOff, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AIInputProps {
  id?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onSubmit?: (value: string) => void
  className?: string
}

export function AIInput({
  id = "ai-input",
  placeholder = "Type your message...",
  minHeight = 52,
  maxHeight = 200,
  onSubmit,
  className
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleReset = () => {
    if (!inputValue.trim()) return;
    onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription failed');
          
          const data = await response.json();
          if (data.text) {
            setInputValue((prev) => prev ? `${prev} ${data.text}` : data.text);
            adjustHeight();
          }
        } catch (error) {
          console.error('Transcription error:', error);
          alert('Failed to transcribe audio. Please try again.');
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full">
        <Textarea
          id={id}
          placeholder={placeholder}
          className={cn(
            "w-full bg-muted/50 rounded-xl pl-4 pr-16",
            "placeholder:text-muted-foreground",
            "border border-border/50 hover:border-border",
            "text-foreground text-wrap",
            "overflow-y-auto resize-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-all duration-200",
            "leading-[1.5] py-3",
            `min-h-[${minHeight}px]`,
            `max-h-[${maxHeight}px]`,
            "[&::-webkit-resizer]:hidden"
          )}
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleReset();
            }
          }}
        />

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-lg bg-muted hover:bg-muted/80 p-2 transition-all duration-200",
            inputValue ? "right-12" : "right-2",
            isRecording && "bg-red-500/20 hover:bg-red-500/30"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isRecording ? (
            <>
              <MicOff className="w-4 h-4 text-red-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            </>
          ) : (
            <Mic className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={handleReset}
          type="button"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-2",
            "rounded-lg bg-primary hover:bg-primary/90 p-2",
            "transition-all duration-200",
            inputValue 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-95 pointer-events-none"
          )}
        >
          <CornerRightUp className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}