import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert webm to a format OpenAI accepts
    // OpenAI accepts: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}