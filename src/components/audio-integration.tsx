'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Headphones, Mic, Settings, Download, Share2, 
  Loader2, Sparkles, Users, Music, Waves
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Real-time Audio Generation & Flipbook Integration
 * 
 * The sonic masterpiece that brings SoulScribe stories to life with dynamic
 * voice synthesis, character voices, and immersive audio experiences! 🎵
 */

export interface AudioSegment {
  id: string
  text: string
  speaker: string
  voiceProfile: string
  startTime: number
  duration: number
  audioUrl: string
  isGenerating?: boolean
  isComplete?: boolean
  emotion?: string
}

export interface ChapterAudio {
  chapterNumber: number
  segments: AudioSegment[]
  fullAudioUrl?: string
  totalDuration: number
  isGenerating: boolean
  isComplete: boolean
  progress: number
}

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  currentSegment?: AudioSegment
  currentChapter?: number
}

interface AudioIntegrationProps {
  storyId: string
  chapters: any[]
  voiceMap: any
  onAudioProgress?: (progress: any) => void
  onChapterAudioComplete?: (chapterNumber: number) => void
  realTimeGeneration?: boolean
}

export function AudioIntegration({ 
  storyId, 
  chapters, 
  voiceMap,
  onAudioProgress,
  onChapterAudioComplete,
  realTimeGeneration = true
}: AudioIntegrationProps) {
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    playbackRate: 1.0
  })
  
  const [chapterAudios, setChapterAudios] = useState<Map<number, ChapterAudio>>(new Map())
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [currentAudioQueue, setCurrentAudioQueue] = useState<AudioSegment[]>([])
  const [showAudioControls, setShowAudioControls] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }
    
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Real-time audio generation for chapters
  useEffect(() => {
    if (realTimeGeneration && chapters.length > 0) {
      generateChapterAudiosInParallel()
    }
  }, [chapters, realTimeGeneration])

  const generateChapterAudiosInParallel = async () => {
    setIsGeneratingAudio(true)
    
    // Generate audio for up to 3 chapters simultaneously
    const concurrentLimit = 3
    const processingPromises = []
    
    for (let i = 0; i < Math.min(chapters.length, concurrentLimit); i++) {
      const chapter = chapters[i]
      if (chapter && !chapterAudios.has(chapter.number)) {
        processingPromises.push(generateChapterAudio(chapter))
      }
    }
    
    // Process in batches
    while (processingPromises.length > 0) {
      const batch = processingPromises.splice(0, concurrentLimit)
      await Promise.allSettled(batch)
    }
    
    setIsGeneratingAudio(false)
  }

  const generateChapterAudio = async (chapter: any): Promise<void> => {
    const chapterNumber = chapter.number
    
    // Initialize chapter audio state
    const chapterAudio: ChapterAudio = {
      chapterNumber,
      segments: [],
      totalDuration: 0,
      isGenerating: true,
      isComplete: false,
      progress: 0
    }
    
    setChapterAudios(prev => new Map(prev).set(chapterNumber, chapterAudio))
    
    try {
      // Parse chapter content into voice segments
      const segments = parseChapterIntoVoiceSegments(chapter.content, voiceMap)
      
      // Generate audio for each segment
      const audioSegments: AudioSegment[] = []
      let currentTime = 0
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        
        // Update progress
        const progress = (i / segments.length) * 100
        setChapterAudios(prev => {
          const updated = new Map(prev)
          const current = updated.get(chapterNumber)
          if (current) {
            updated.set(chapterNumber, { ...current, progress })
          }
          return updated
        })
        
        // Generate audio for this segment
        const audioUrl = await generateSegmentAudio(segment, storyId, chapterNumber, i)
        const duration = await getAudioDuration(audioUrl)
        
        const audioSegment: AudioSegment = {
          id: `${chapterNumber}_${i}`,
          text: segment.text,
          speaker: segment.speaker,
          voiceProfile: segment.voiceProfile,
          startTime: currentTime,
          duration,
          audioUrl,
          isComplete: true,
          emotion: segment.emotion
        }
        
        audioSegments.push(audioSegment)
        currentTime += duration
        
        // Update chapter audio with new segment
        setChapterAudios(prev => {
          const updated = new Map(prev)
          const current = updated.get(chapterNumber)
          if (current) {
            updated.set(chapterNumber, {
              ...current,
              segments: [...current.segments, audioSegment]
            })
          }
          return updated
        })
      }
      
      // Combine all segments into full chapter audio
      const fullAudioUrl = await combineAudioSegments(audioSegments.map(s => s.audioUrl))
      
      // Mark chapter as complete
      setChapterAudios(prev => {
        const updated = new Map(prev)
        updated.set(chapterNumber, {
          chapterNumber,
          segments: audioSegments,
          fullAudioUrl,
          totalDuration: currentTime,
          isGenerating: false,
          isComplete: true,
          progress: 100
        })
        return updated
      })
      
      onChapterAudioComplete?.(chapterNumber)
      
    } catch (error) {
      console.error(`Failed to generate audio for chapter ${chapterNumber}:`, error)
      
      // Mark as failed
      setChapterAudios(prev => {
        const updated = new Map(prev)
        const current = updated.get(chapterNumber)
        if (current) {
          updated.set(chapterNumber, {
            ...current,
            isGenerating: false,
            isComplete: false
          })
        }
        return updated
      })
    }
  }

  const parseChapterIntoVoiceSegments = (content: string, voiceMap: any) => {
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
          voiceProfile: voiceMap?.characterAssignments?.get(`Speaker${speakerNum}`)?.assignedVoiceProfile?.id || 'narrator_main',
          emotion
        })
      } else if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
        // Regular quoted dialogue
        segments.push({
          type: 'dialogue',
          text: trimmedLine.slice(1, -1),
          speaker: 'Character',
          voiceProfile: voiceMap?.characterAssignments?.get('Character')?.assignedVoiceProfile?.id || 'narrator_main'
        })
      } else if (trimmedLine.length > 0) {
        // Narrative text
        segments.push({
          type: 'narrative',
          text: trimmedLine,
          speaker: 'Narrator',
          voiceProfile: voiceMap?.narratorVoice?.id || 'narrator_main'
        })
      }
    }
    
    return segments
  }

  const generateSegmentAudio = async (segment: any, storyId: string, chapterNumber: number, segmentIndex: number): Promise<string> => {
    // This would call the Dia-Meistro backend
    const response = await fetch('/api/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: segment.text,
        voiceProfile: segment.voiceProfile,
        emotion: segment.emotion,
        speaker: segment.speaker,
        outputPath: `/audio/${storyId}/chapter_${chapterNumber}/segment_${segmentIndex}.wav`
      })
    })
    
    const result = await response.json()
    return result.audioUrl
  }

  const combineAudioSegments = async (audioUrls: string[]): Promise<string> => {
    // This would combine audio segments using FFmpeg
    const response = await fetch('/api/combine-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrls })
    })
    
    const result = await response.json()
    return result.combinedAudioUrl
  }

  const getAudioDuration = async (audioUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl)
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration * 1000) // Convert to milliseconds
      })
      audio.addEventListener('error', () => {
        resolve(5000) // Default 5 seconds if error
      })
    })
  }

  const playChapterAudio = (chapterNumber: number) => {
    const chapterAudio = chapterAudios.get(chapterNumber)
    if (chapterAudio?.fullAudioUrl && audioRef.current) {
      audioRef.current.src = chapterAudio.fullAudioUrl
      audioRef.current.play()
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: true,
        currentChapter: chapterNumber 
      }))
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioState.isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
    }
  }

  const handleVolumeChange = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      setAudioState(prev => ({ ...prev, volume }))
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioState.isMuted
      setAudioState(prev => ({ ...prev, isMuted: !prev.isMuted }))
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
      setAudioState(prev => ({ ...prev, playbackRate: rate }))
    }
  }

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioState(prev => ({
        ...prev,
        currentTime: audioRef.current!.currentTime,
        duration: audioRef.current!.duration
      }))
    }
  }

  const skipToChapter = (chapterNumber: number) => {
    playChapterAudio(chapterNumber)
  }

  const downloadChapterAudio = (chapterNumber: number) => {
    const chapterAudio = chapterAudios.get(chapterNumber)
    if (chapterAudio?.fullAudioUrl) {
      const link = document.createElement('a')
      link.href = chapterAudio.fullAudioUrl
      link.download = `chapter_${chapterNumber}_audio.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="relative">
      {/* Audio Generation Progress */}
      <AnimatePresence>
        {isGeneratingAudio && (
          <AudioGenerationProgress 
            chapters={chapters}
            chapterAudios={chapterAudios}
          />
        )}
      </AnimatePresence>

      {/* Floating Audio Controls */}
      <AnimatePresence>
        {showAudioControls && (
          <FloatingAudioControls
            audioState={audioState}
            onTogglePlayPause={togglePlayPause}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            onPlaybackRateChange={changePlaybackRate}
            onClose={() => setShowAudioControls(false)}
          />
        )}
      </AnimatePresence>

      {/* Chapter Audio Controls */}
      <ChapterAudioControls
        chapters={chapters}
        chapterAudios={chapterAudios}
        currentChapter={audioState.currentChapter}
        onPlayChapter={playChapterAudio}
        onDownloadChapter={downloadChapterAudio}
        onShowFullControls={() => setShowAudioControls(true)}
      />

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioTimeUpdate}
        onEnded={() => setAudioState(prev => ({ ...prev, isPlaying: false }))}
        preload="metadata"
      />
    </div>
  )
}

// Audio Generation Progress Component
function AudioGenerationProgress({ 
  chapters, 
  chapterAudios 
}: { 
  chapters: any[]
  chapterAudios: Map<number, ChapterAudio>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-soul-200 p-6 max-w-sm z-50"
    >
      <div className="flex items-center gap-3 mb-4">
        <Waves className="w-6 h-6 text-mystic-500 animate-pulse" />
        <div>
          <h3 className="font-semibold text-soul-800">Generating Audio</h3>
          <p className="text-sm text-soul-600">Creating voice narration...</p>
        </div>
      </div>

      <div className="space-y-3">
        {chapters.map((chapter) => {
          const chapterAudio = chapterAudios.get(chapter.number)
          return (
            <div key={chapter.number} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mystic-100 flex items-center justify-center">
                {chapterAudio?.isComplete ? (
                  <div className="w-3 h-3 bg-mystic-500 rounded-full" />
                ) : chapterAudio?.isGenerating ? (
                  <Loader2 className="w-4 h-4 text-mystic-500 animate-spin" />
                ) : (
                  <span className="text-xs font-bold text-soul-500">{chapter.number}</span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-soul-800">{chapter.title}</div>
                {chapterAudio?.isGenerating && (
                  <div className="w-full bg-soul-200 rounded-full h-1.5 mt-1">
                    <motion.div
                      className="bg-mystic-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${chapterAudio.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
                {chapterAudio?.isComplete && (
                  <div className="text-xs text-mystic-600 mt-1">
                    {Math.ceil(chapterAudio.totalDuration / 1000 / 60)} min audio
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// Floating Audio Controls
function FloatingAudioControls({
  audioState,
  onTogglePlayPause,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onClose
}: {
  audioState: AudioPlayerState
  onTogglePlayPause: () => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onPlaybackRateChange: (rate: number) => void
  onClose: () => void
}) {
  const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-lg rounded-2xl p-6 z-50 text-white min-w-[400px]"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Audio Controls</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
          ×
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={onTogglePlayPause}
          className="p-4 bg-mystic-500 rounded-full hover:bg-mystic-600 transition-colors"
        >
          {audioState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>{formatTime(audioState.currentTime)}</span>
          <span>{formatTime(audioState.duration)}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-mystic-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${(audioState.currentTime / audioState.duration) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onToggleMute}>
          {audioState.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={audioState.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-white/20 rounded-full appearance-none"
        />
        <span className="text-sm w-8">{Math.round(audioState.volume * 100)}</span>
      </div>

      {/* Playback Speed */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Speed:</span>
        {playbackRates.map((rate) => (
          <button
            key={rate}
            onClick={() => onPlaybackRateChange(rate)}
            className={cn(
              "px-3 py-1 rounded-full text-sm transition-colors",
              audioState.playbackRate === rate 
                ? "bg-mystic-500 text-white" 
                : "bg-white/10 hover:bg-white/20"
            )}
          >
            {rate}×
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// Chapter Audio Controls
function ChapterAudioControls({
  chapters,
  chapterAudios,
  currentChapter,
  onPlayChapter,
  onDownloadChapter,
  onShowFullControls
}: {
  chapters: any[]
  chapterAudios: Map<number, ChapterAudio>
  currentChapter?: number
  onPlayChapter: (chapterNumber: number) => void
  onDownloadChapter: (chapterNumber: number) => void
  onShowFullControls: () => void
}) {
  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const chapterAudio = chapterAudios.get(chapter.number)
        const isCurrentChapter = currentChapter === chapter.number
        
        return (
          <motion.div
            key={chapter.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
              isCurrentChapter 
                ? "bg-mystic-50 border-mystic-300" 
                : "bg-white border-soul-200 hover:border-mystic-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-mystic-100 flex items-center justify-center">
                <span className="font-bold text-mystic-700">{chapter.number}</span>
              </div>
              <div>
                <h4 className="font-medium text-soul-800">{chapter.title}</h4>
                {chapterAudio?.isComplete && (
                  <p className="text-sm text-soul-600">
                    {Math.ceil(chapterAudio.totalDuration / 1000 / 60)} min • {chapterAudio.segments.length} segments
                  </p>
                )}
                {chapterAudio?.isGenerating && (
                  <p className="text-sm text-wisdom-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating audio... {Math.round(chapterAudio.progress)}%
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {chapterAudio?.isComplete && (
                <>
                  <button
                    onClick={() => onPlayChapter(chapter.number)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isCurrentChapter 
                        ? "bg-mystic-500 text-white" 
                        : "bg-mystic-100 text-mystic-700 hover:bg-mystic-200"
                    )}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDownloadChapter(chapter.number)}
                    className="p-2 rounded-lg bg-soul-100 text-soul-700 hover:bg-soul-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {chapterAudio?.isGenerating && (
                <div className="w-20 bg-soul-200 rounded-full h-2">
                  <motion.div
                    className="bg-wisdom-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${chapterAudio.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Show Full Controls Button */}
      <motion.button
        onClick={onShowFullControls}
        className="w-full p-3 border-2 border-dashed border-soul-300 rounded-lg text-soul-600 hover:border-mystic-300 hover:text-mystic-600 transition-colors flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Settings className="w-4 h-4" />
        Advanced Audio Controls
      </motion.button>
    </div>
  )
}

// Utility Functions
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Audio Context Hook for advanced features
export function useAudioContext() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      setIsInitialized(true)
    }
  }, [])

  const createAnalyzer = useCallback(() => {
    if (!audioContextRef.current) return null
    return audioContextRef.current.createAnalyser()
  }, [])

  const createGainNode = useCallback(() => {
    if (!audioContextRef.current) return null
    return audioContextRef.current.createGain()
  }, [])

  return {
    audioContext: audioContextRef.current,
    isInitialized,
    initializeAudioContext,
    createAnalyzer,
    createGainNode
  }
}