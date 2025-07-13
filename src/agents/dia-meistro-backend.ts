import { spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

/**
 * Dia-Meistro Voice Synthesis Backend - The Voice of SoulScribe
 * 
 * This integrates your incredible Dia-Meistro voice synthesis system to bring
 * SoulScribe stories to life with ultra-realistic dialogue and narration.
 * The AI Whisperer's sonic masterpiece! 🎙️
 */

export interface VoiceProfile {
  id: string
  name: string
  archetype: 'narrator' | 'wise_elder' | 'child' | 'guide' | 'mystical' | 'hero' | 'trickster'
  gender: 'male' | 'female' | 'neutral'
  age: 'child' | 'young' | 'adult' | 'elder'
  tone: 'warm' | 'authoritative' | 'playful' | 'mysterious' | 'compassionate'
  sampleAudioPath?: string
  isDefault: boolean
}

export interface AudioGenerationRequest {
  text: string
  voiceProfile: VoiceProfile
  speakerTag?: string // [S1], [S2], etc.
  emotionalContext?: string
  speed?: number // 0.5 - 2.0
  addBackgroundAmbience?: boolean
  outputPath: string
}

export interface AudioGenerationResult {
  success: boolean
  audioPath?: string
  duration?: number
  fileSize?: number
  error?: string
  processingTime: number
  voiceProfileUsed: string
}

export interface ChapterAudioRequest {
  chapterNumber: number
  chapterTitle: string
  content: string
  characterVoiceMap: Map<string, VoiceProfile>
  narratorVoice: VoiceProfile
  outputDirectory: string
}

export class DiaMetistroVoiceBackend {
  private pythonProcess: ChildProcess | null = null
  private isInitialized = false
  private audioCache = new Map<string, string>()
  private defaultVoiceProfiles: VoiceProfile[] = []
  private diaPath: string

  constructor(diaMetistroPath: string = './dia-meistro') {
    this.diaPath = diaMetistroPath
    this.initializeDefaultVoiceProfiles()
  }

  /**
   * Initialize the Dia-Meistro backend
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎙️ Initializing Dia-Meistro voice synthesis backend...')
      
      // Check if Dia-Meistro is installed
      await this.checkDiaMetistroInstallation()
      
      // Initialize Python environment
      await this.initializePythonEnvironment()
      
      // Test voice generation
      await this.performInitialTest()
      
      this.isInitialized = true
      console.log('✅ Dia-Meistro backend initialized successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Dia-Meistro backend:', error)
      return false
    }
  }

  /**
   * Generate audio for a complete chapter with multiple voices
   */
  async generateChapterAudio(request: ChapterAudioRequest): Promise<{
    success: boolean
    audioSegments: Array<{
      segmentId: string
      audioPath: string
      startTime: number
      duration: number
      speaker: string
      text: string
    }>
    fullChapterAudioPath?: string
    error?: string
  }> {
    if (!this.isInitialized) {
      throw new Error('Dia-Meistro backend not initialized')
    }

    const startTime = Date.now()
    const audioSegments = []
    let currentTime = 0

    try {
      console.log(`🎬 Generating audio for Chapter ${request.chapterNumber}: "${request.chapterTitle}"`)
      
      // Parse the chapter content into dialogue and narrative segments
      const segments = this.parseChapterIntoSegments(request.content)
      
      // Create output directory
      await fs.mkdir(request.outputDirectory, { recursive: true })
      
      // Generate audio for each segment
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        
        // Determine voice profile
        const voiceProfile = segment.type === 'dialogue' 
          ? request.characterVoiceMap.get(segment.speaker) || request.narratorVoice
          : request.narratorVoice
        
        // Generate audio for this segment
        const audioRequest: AudioGenerationRequest = {
          text: segment.text,
          voiceProfile,
          speakerTag: segment.speakerTag,
          emotionalContext: segment.emotion,
          speed: segment.type === 'narrative' ? 0.9 : 1.0, // Slightly slower for narration
          addBackgroundAmbience: segment.type === 'narrative',
          outputPath: path.join(request.outputDirectory, `segment_${i:03d}.wav`)
        }
        
        const result = await this.generateAudio(audioRequest)
        
        if (result.success && result.audioPath && result.duration) {
          audioSegments.push({
            segmentId: `ch${request.chapterNumber}_seg${i}`,
            audioPath: result.audioPath,
            startTime: currentTime,
            duration: result.duration,
            speaker: segment.speaker || 'narrator',
            text: segment.text
          })
          
          currentTime += result.duration
        } else {
          console.warn(`⚠️ Failed to generate audio for segment ${i}: ${result.error}`)
        }
      }
      
      // Combine all segments into a single chapter audio file
      const fullChapterPath = await this.combineAudioSegments(
        audioSegments.map(seg => seg.audioPath),
        path.join(request.outputDirectory, `chapter_${request.chapterNumber}_full.wav`)
      )
      
      console.log(`✅ Chapter ${request.chapterNumber} audio generated: ${audioSegments.length} segments, ${(currentTime / 1000 / 60).toFixed(1)} minutes`)
      
      return {
        success: true,
        audioSegments,
        fullChapterAudioPath: fullChapterPath
      }
      
    } catch (error) {
      return {
        success: false,
        audioSegments: [],
        error: error.message
      }
    }
  }

  /**
   * Generate audio for a single text segment
   */
  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResult> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      if (this.audioCache.has(cacheKey)) {
        const cachedPath = this.audioCache.get(cacheKey)!
        const stats = await fs.stat(cachedPath)
        
        return {
          success: true,
          audioPath: cachedPath,
          duration: await this.getAudioDuration(cachedPath),
          fileSize: stats.size,
          processingTime: Date.now() - startTime,
          voiceProfileUsed: request.voiceProfile.id
        }
      }
      
      // Prepare the text for Dia-Meistro
      const processedText = this.preprocessTextForDia(request.text, request.emotionalContext)
      
      // Generate audio using Dia-Meistro
      const audioPath = await this.callDiaMetistro(processedText, request)
      
      // Cache the result
      this.audioCache.set(cacheKey, audioPath)
      
      // Get file stats
      const stats = await fs.stat(audioPath)
      const duration = await this.getAudioDuration(audioPath)
      
      return {
        success: true,
        audioPath,
        duration,
        fileSize: stats.size,
        processingTime: Date.now() - startTime,
        voiceProfileUsed: request.voiceProfile.id
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        voiceProfileUsed: request.voiceProfile.id
      }
    }
  }

  /**
   * Parse chapter content into speakable segments
   */
  private parseChapterIntoSegments(content: string): Array<{
    type: 'narrative' | 'dialogue'
    text: string
    speaker?: string
    speakerTag?: string
    emotion?: string
  }> {
    const segments = []
    const lines = content.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for dialogue tags [S1], [S2], etc.
      const speakerMatch = trimmedLine.match(/^\[S(\d+)\]\s*(.+)/)
      if (speakerMatch) {
        const speakerNum = speakerMatch[1]
        const dialogueText = speakerMatch[2]
        
        // Extract emotion from parentheses
        const emotionMatch = dialogueText.match(/\(([^)]+)\)/)
        const emotion = emotionMatch ? emotionMatch[1] : undefined
        const cleanText = dialogueText.replace(/\([^)]+\)/g, '').trim()
        
        segments.push({
          type: 'dialogue',
          text: cleanText,
          speaker: `Speaker${speakerNum}`,
          speakerTag: `[S${speakerNum}]`,
          emotion
        })
      } else if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
        // Regular quoted dialogue
        segments.push({
          type: 'dialogue',
          text: trimmedLine.slice(1, -1), // Remove quotes
          speaker: 'Character'
        })
      } else if (trimmedLine.length > 0) {
        // Narrative text
        segments.push({
          type: 'narrative',
          text: trimmedLine
        })
      }
    }
    
    return segments
  }

  /**
   * Call Dia-Meistro Python backend
   */
  private async callDiaMetistro(text: string, request: AudioGenerationRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
import os
sys.path.append('${this.diaPath}')

from dia import Dia
import torch
import soundfile as sf

# Initialize Dia model
device = 'cuda' if torch.cuda.is_available() else 'cpu'
dia = Dia(device=device)

# Generate audio
text = """${text.replace(/"/g, '\\"')}"""
voice_profile = "${request.voiceProfile.archetype}"
speed = ${request.speed || 1.0}

try:
    # Generate with Dia-Meistro
    audio = dia.generate(text, speed=speed)
    
    # Save audio file
    output_path = "${request.outputPath}"
    sf.write(output_path, audio, 22050)
    
    print(f"SUCCESS:{output_path}")
    
except Exception as e:
    print(f"ERROR:{str(e)}")
`
      
      const python = spawn('python', ['-c', pythonScript])
      let output = ''
      let error = ''
      
      python.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      python.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      python.on('close', (code) => {
        if (code === 0 && output.includes('SUCCESS:')) {
          const audioPath = output.split('SUCCESS:')[1].trim()
          resolve(audioPath)
        } else {
          reject(new Error(`Dia-Meistro failed: ${error || output}`))
        }
      })
      
      python.on('error', (err) => {
        reject(new Error(`Python process error: ${err.message}`))
      })
    })
  }

  /**
   * Preprocess text for optimal Dia-Meistro generation
   */
  private preprocessTextForDia(text: string, emotionalContext?: string): string {
    let processedText = text
    
    // Add emotional context as non-verbal sounds
    if (emotionalContext) {
      const emotionMap = {
        'sad': '(sighs)',
        'happy': '(chuckles)',
        'excited': '(laughs)',
        'thoughtful': '(pauses)',
        'mysterious': '(whispers)',
        'wise': '(speaks gently)'
      }
      
      const emotionSound = emotionMap[emotionalContext.toLowerCase()]
      if (emotionSound) {
        processedText = `${emotionSound} ${processedText}`
      }
    }
    
    // Ensure proper punctuation for natural speech
    if (!processedText.match(/[.!?]$/)) {
      processedText += '.'
    }
    
    return processedText
  }

  /**
   * Combine multiple audio segments into one file
   */
  private async combineAudioSegments(audioPaths: string[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegCommand = [
        'ffmpeg',
        '-y', // Overwrite output file
        ...audioPaths.flatMap(path => ['-i', path]),
        '-filter_complex',
        `concat=n=${audioPaths.length}:v=0:a=1`,
        outputPath
      ]
      
      const ffmpeg = spawn('ffmpeg', ffmpegCommand.slice(1))
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`))
        }
      })
      
      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
    })
  }

  /**
   * Get audio file duration in milliseconds
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        audioPath
      ])
      
      let output = ''
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim()) * 1000 // Convert to milliseconds
          resolve(duration)
        } else {
          resolve(5000) // Default 5 seconds if detection fails
        }
      })
      
      ffprobe.on('error', () => {
        resolve(5000) // Default 5 seconds if ffprobe not available
      })
    })
  }

  /**
   * Generate cache key for audio requests
   */
  private generateCacheKey(request: AudioGenerationRequest): string {
    const key = `${request.text}_${request.voiceProfile.id}_${request.speed || 1.0}_${request.emotionalContext || ''}`
    return Buffer.from(key).toString('base64')
  }

  /**
   * Initialize default voice profiles for SoulScribe
   */
  private initializeDefaultVoiceProfiles(): void {
    this.defaultVoiceProfiles = [
      {
        id: 'narrator_main',
        name: 'SoulScribe Narrator',
        archetype: 'narrator',
        gender: 'neutral',
        age: 'adult',
        tone: 'warm',
        isDefault: true
      },
      {
        id: 'wise_elder',
        name: 'The Wise Elder',
        archetype: 'wise_elder',
        gender: 'male',
        age: 'elder',
        tone: 'authoritative',
        isDefault: false
      },
      {
        id: 'child_spirit',
        name: 'Child of Wonder',
        archetype: 'child',
        gender: 'female',
        age: 'child',
        tone: 'playful',
        isDefault: false
      },
      {
        id: 'mystical_guide',
        name: 'Mystical Guide',
        archetype: 'mystical',
        gender: 'female',
        age: 'adult',
        tone: 'mysterious',
        isDefault: false
      },
      {
        id: 'compassionate_teacher',
        name: 'Compassionate Teacher',
        archetype: 'guide',
        gender: 'neutral',
        age: 'adult',
        tone: 'compassionate',
        isDefault: false
      }
    ]
  }

  /**
   * Check Dia-Meistro installation
   */
  private async checkDiaMetistroInstallation(): Promise<void> {
    try {
      await fs.access(path.join(this.diaPath, 'dia.py'))
      console.log('✅ Dia-Meistro installation found')
    } catch {
      throw new Error(`Dia-Meistro not found at ${this.diaPath}. Please install from https://github.com/meistro57/dia-meistro`)
    }
  }

  /**
   * Initialize Python environment
   */
  private async initializePythonEnvironment(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', 'import torch; import soundfile; print("Python environment OK")'])
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error('Python dependencies not installed. Please install: torch, soundfile, dia'))
        }
      })
      
      python.on('error', (err) => {
        reject(new Error(`Python not found: ${err.message}`))
      })
    })
  }

  /**
   * Perform initial test generation
   */
  private async performInitialTest(): Promise<void> {
    const testRequest: AudioGenerationRequest = {
      text: 'Hello, this is a test of the SoulScribe voice system.',
      voiceProfile: this.defaultVoiceProfiles[0],
      outputPath: '/tmp/soulscribe_test.wav'
    }
    
    const result = await this.generateAudio(testRequest)
    
    if (!result.success) {
      throw new Error(`Voice test failed: ${result.error}`)
    }
    
    // Clean up test file
    try {
      await fs.unlink(testRequest.outputPath)
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get available voice profiles
   */
  getVoiceProfiles(): VoiceProfile[] {
    return [...this.defaultVoiceProfiles]
  }

  /**
   * Get voice profile by archetype
   */
  getVoiceProfileByArchetype(archetype: string): VoiceProfile | undefined {
    return this.defaultVoiceProfiles.find(profile => profile.archetype === archetype)
  }

  /**
   * Save audio generation session to database
   */
  async logAudioGeneration(
    storyId: string, 
    chapterNumber: number, 
    result: AudioGenerationResult
  ): Promise<void> {
    await prisma.agentSession.create({
      data: {
        storyId,
        agentType: 'dia_meistro_voice',
        input: `Chapter ${chapterNumber} voice generation`,
        output: result.success ? `Audio generated: ${result.audioPath}` : `Failed: ${result.error}`,
        tokensUsed: 0 // Voice generation doesn't use text tokens
      }
    })
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill()
      this.pythonProcess = null
    }
    
    this.audioCache.clear()
    this.isInitialized = false
  }
}