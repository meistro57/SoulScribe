'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Play, Pause, Upload, Download, Trash2, 
  Volume2, Settings, Sparkles, User, Heart, Zap,
  FileAudio, Clock, CheckCircle, AlertCircle, Wand2,
  RefreshCw, Copy, Share2, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Voice Cloning Studio - The AI Whisperer's Voice Magic Lab
 * 
 * This incredible component allows users to create custom character voices
 * from their own recordings or uploads. Using advanced voice cloning technology,
 * it captures the essence of any voice and makes it available for storytelling! 🎭✨
 */

export interface VoiceProfile {
  id: string
  name: string
  description: string
  category: 'character' | 'narrator' | 'custom'
  sourceType: 'recorded' | 'uploaded' | 'cloned'
  
  // Voice characteristics
  characteristics: {
    age: 'child' | 'young_adult' | 'adult' | 'elder'
    gender: 'masculine' | 'feminine' | 'neutral'
    accent: string
    emotion: string
    energy: 'low' | 'medium' | 'high'
    pace: 'slow' | 'normal' | 'fast'
  }
  
  // Technical data
  sampleAudioUrl?: string
  modelId?: string
  trainingData: {
    audioSamples: string[]
    totalDuration: number
    qualityScore: number
    trainingComplete: boolean
  }
  
  // Metadata
  createdAt: Date
  lastUsed?: Date
  useCount: number
  isPublic: boolean
  createdBy: string
}

export interface RecordingSession {
  id: string
  chunks: Blob[]
  duration: number
  isRecording: boolean
  isProcessing: boolean
  transcription?: string
  qualityMetrics?: {
    noiseLevel: number
    clarity: number
    consistency: number
  }
}

interface VoiceCloningStudioProps {
  onVoiceCreated?: (profile: VoiceProfile) => void
  onVoiceSelected?: (profile: VoiceProfile) => void
  existingProfiles?: VoiceProfile[]
  maxRecordingTime?: number
  requiredSampleDuration?: number
}

export function VoiceCloningStudio({
  onVoiceCreated,
  onVoiceSelected,
  existingProfiles = [],
  maxRecordingTime = 300, // 5 minutes
  requiredSampleDuration = 30 // 30 seconds minimum
}: VoiceCloningStudioProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'samples'>('create')
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>(existingProfiles)
  const [currentRecording, setCurrentRecording] = useState<RecordingSession | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null)
  
  // Voice creation state
  const [voiceForm, setVoiceForm] = useState({
    name: '',
    description: '',
    category: 'character' as const,
    characteristics: {
      age: 'adult' as const,
      gender: 'neutral' as const,
      accent: 'neutral',
      emotion: 'calm',
      energy: 'medium' as const,
      pace: 'normal' as const
    }
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      audioContextRef.current?.close()
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      // Set up audio analysis
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        source.connect(analyserRef.current)
        startVisualization()
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        setCurrentRecording(prev => prev ? {
          ...prev,
          chunks,
          isRecording: false,
          isProcessing: true
        } : null)
        
        processRecording(chunks)
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder

      const session: RecordingSession = {
        id: `recording_${Date.now()}`,
        chunks: [],
        duration: 0,
        isRecording: true,
        isProcessing: false
      }

      setCurrentRecording(session)
      
      // Auto-stop after max time
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, maxRecordingTime * 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const startVisualization = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      analyser.getByteFrequencyData(dataArray)
      
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        
        const hue = (i / bufferLength) * 360
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
      
      animationFrameRef.current = requestAnimationFrame(draw)
    }
    
    draw()
  }

  const processRecording = async (chunks: Blob[]) => {
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Analyze audio quality
      const qualityMetrics = await analyzeAudioQuality(audioBlob)
      
      // Get transcription for quality assessment
      const transcription = await getAudioTranscription(audioBlob)
      
      setCurrentRecording(prev => prev ? {
        ...prev,
        isProcessing: false,
        transcription,
        qualityMetrics
      } : null)

    } catch (error) {
      console.error('Error processing recording:', error)
      setCurrentRecording(prev => prev ? {
        ...prev,
        isProcessing: false
      } : null)
    }
  }

  const analyzeAudioQuality = async (audioBlob: Blob) => {
    // Simulate audio analysis - in real implementation, this would use audio processing libraries
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          noiseLevel: Math.random() * 0.3, // 0-1, lower is better
          clarity: 0.7 + Math.random() * 0.3, // 0-1, higher is better
          consistency: 0.6 + Math.random() * 0.4 // 0-1, higher is better
        })
      }, 2000)
    })
  }

  const getAudioTranscription = async (audioBlob: Blob): Promise<string> => {
    // This would integrate with speech-to-text service
    const sampleTranscriptions = [
      "Hello, this is a sample recording for voice cloning.",
      "I hope this voice sounds clear and natural for storytelling.",
      "The quick brown fox jumps over the lazy dog. This pangram helps test voice quality.",
      "Welcome to SoulScribe, where stories come alive with personalized voices."
    ]
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)])
      }, 1500)
    })
  }

  const createVoiceProfile = async () => {
    if (!currentRecording || !voiceForm.name.trim()) return

    setIsAnalyzing(true)

    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(currentRecording.chunks, { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)

      // Train voice model (this would call your voice cloning API)
      const modelId = await trainVoiceModel(audioBlob, voiceForm)

      const newProfile: VoiceProfile = {
        id: `voice_${Date.now()}`,
        name: voiceForm.name,
        description: voiceForm.description,
        category: voiceForm.category,
        sourceType: 'recorded',
        characteristics: voiceForm.characteristics,
        sampleAudioUrl: audioUrl,
        modelId,
        trainingData: {
          audioSamples: [audioUrl],
          totalDuration: currentRecording.duration,
          qualityScore: calculateQualityScore(currentRecording.qualityMetrics),
          trainingComplete: true
        },
        createdAt: new Date(),
        useCount: 0,
        isPublic: false,
        createdBy: 'current_user'
      }

      setVoiceProfiles(prev => [...prev, newProfile])
      onVoiceCreated?.(newProfile)

      // Reset form
      setVoiceForm({
        name: '',
        description: '',
        category: 'character',
        characteristics: {
          age: 'adult',
          gender: 'neutral',
          accent: 'neutral',
          emotion: 'calm',
          energy: 'medium',
          pace: 'normal'
        }
      })
      setCurrentRecording(null)

    } catch (error) {
      console.error('Error creating voice profile:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const trainVoiceModel = async (audioBlob: Blob, formData: any): Promise<string> => {
    // This would integrate with your voice cloning service (e.g., ElevenLabs, Coqui TTS, etc.)
    const formDataObj = new FormData()
    formDataObj.append('audio', audioBlob)
    formDataObj.append('characteristics', JSON.stringify(formData.characteristics))
    formDataObj.append('name', formData.name)

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }, 3000)
    })
  }

  const calculateQualityScore = (metrics: any): number => {
    if (!metrics) return 0.5
    
    const noiseScore = 1 - metrics.noiseLevel
    const clarityScore = metrics.clarity
    const consistencyScore = metrics.consistency
    
    return (noiseScore + clarityScore + consistencyScore) / 3
  }

  const uploadAudioFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file')
      return
    }

    const audioUrl = URL.createObjectURL(file)
    
    // Process uploaded file similar to recording
    setCurrentRecording({
      id: `upload_${Date.now()}`,
      chunks: [file],
      duration: 0, // Would be calculated from file
      isRecording: false,
      isProcessing: true
    })

    // Simulate processing
    setTimeout(async () => {
      const qualityMetrics = await analyzeAudioQuality(file)
      const transcription = await getAudioTranscription(file)
      
      setCurrentRecording(prev => prev ? {
        ...prev,
        isProcessing: false,
        transcription,
        qualityMetrics
      } : null)
    }, 2000)
  }

  const playVoiceSample = async (profile: VoiceProfile) => {
    if (profile.sampleAudioUrl) {
      const audio = new Audio(profile.sampleAudioUrl)
      await audio.play()
    }
  }

  const testVoiceGeneration = async (profile: VoiceProfile, testText: string) => {
    // This would generate speech using the cloned voice
    console.log(`Testing voice ${profile.name} with text: "${testText}"`)
    
    // Simulate voice generation API call
    const response = await fetch('/api/generate-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: profile.modelId,
        text: testText,
        characteristics: profile.characteristics
      })
    })
    
    const result = await response.json()
    
    if (result.audioUrl) {
      const audio = new Audio(result.audioUrl)
      await audio.play()
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <Wand2 className="w-8 h-8 text-mystic-500" />
          <h1 className="text-3xl font-bold font-mystic text-soul-800">
            Voice Cloning Studio
          </h1>
          <Sparkles className="w-6 h-6 text-wisdom-500" />
        </motion.div>
        <p className="text-soul-600 max-w-2xl mx-auto">
          Create custom character voices from your own recordings. Give your stories 
          the perfect voice that matches your imagination!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl border border-soul-200 p-1 flex">
          {[
            { id: 'create', label: 'Create Voice', icon: Mic },
            { id: 'library', label: 'Voice Library', icon: FileAudio },
            { id: 'samples', label: 'Sample Packs', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                activeTab === id
                  ? "bg-mystic-500 text-white shadow-lg"
                  : "text-soul-600 hover:text-mystic-600 hover:bg-mystic-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Create Voice Tab */}
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Voice Information Form */}
            <div className="bg-white rounded-xl border border-soul-200 p-6">
              <h3 className="text-lg font-semibold text-soul-800 mb-4">Voice Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-soul-700 mb-2">
                    Voice Name *
                  </label>
                  <input
                    type="text"
                    value={voiceForm.name}
                    onChange={(e) => setVoiceForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Wise Elder, Playful Child"
                    className="w-full px-3 py-2 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-soul-700 mb-2">
                    Category
                  </label>
                  <select
                    value={voiceForm.category}
                    onChange={(e) => setVoiceForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200"
                  >
                    <option value="character">Character Voice</option>
                    <option value="narrator">Narrator Voice</option>
                    <option value="custom">Custom Voice</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-soul-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={voiceForm.description}
                    onChange={(e) => setVoiceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the voice characteristics and personality..."
                    rows={3}
                    className="w-full px-3 py-2 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200"
                  />
                </div>
              </div>

              {/* Voice Characteristics */}
              <div className="mt-6">
                <h4 className="font-medium text-soul-800 mb-4">Voice Characteristics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries({
                    age: { label: 'Age', options: ['child', 'young_adult', 'adult', 'elder'] },
                    gender: { label: 'Gender', options: ['masculine', 'feminine', 'neutral'] },
                    emotion: { label: 'Emotion', options: ['calm', 'joyful', 'wise', 'mysterious', 'playful'] },
                    energy: { label: 'Energy', options: ['low', 'medium', 'high'] },
                    pace: { label: 'Pace', options: ['slow', 'normal', 'fast'] }
                  }).map(([key, { label, options }]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-soul-700 mb-1">
                        {label}
                      </label>
                      <select
                        value={voiceForm.characteristics[key as keyof typeof voiceForm.characteristics]}
                        onChange={(e) => setVoiceForm(prev => ({
                          ...prev,
                          characteristics: {
                            ...prev.characteristics,
                            [key]: e.target.value
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-soul-200 rounded focus:border-mystic-500"
                      >
                        {options.map(option => (
                          <option key={option} value={option}>
                            {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recording Interface */}
            <div className="bg-white rounded-xl border border-soul-200 p-6">
              <h3 className="text-lg font-semibold text-soul-800 mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-mystic-500" />
                Voice Recording
              </h3>

              {!currentRecording ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <motion.button
                      onClick={startRecording}
                      className="mx-auto flex items-center justify-center w-20 h-20 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mic className="w-8 h-8" />
                    </motion.button>
                  </div>
                  
                  <p className="text-soul-600 mb-4">
                    Click to start recording your voice sample
                  </p>
                  
                  <div className="text-sm text-soul-500 space-y-1">
                    <p>• Speak clearly and naturally</p>
                    <p>• Record for at least {requiredSampleDuration} seconds</p>
                    <p>• Use a quiet environment for best results</p>
                  </div>

                  {/* File Upload Alternative */}
                  <div className="mt-6 pt-6 border-t border-soul-200">
                    <p className="text-sm text-soul-600 mb-3">Or upload an audio file:</p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => e.target.files?.[0] && uploadAudioFile(e.target.files[0])}
                      className="block mx-auto text-sm text-soul-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mystic-50 file:text-mystic-700 hover:file:bg-mystic-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Recording Visualizer */}
                  {currentRecording.isRecording && (
                    <div className="text-center">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={100}
                        className="mx-auto rounded-lg border border-soul-200"
                      />
                      <div className="mt-4">
                        <motion.button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MicOff className="w-4 h-4" />
                          Stop Recording
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Processing State */}
                  {currentRecording.isProcessing && (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="mx-auto w-12 h-12 mb-4"
                      >
                        <RefreshCw className="w-12 h-12 text-mystic-500" />
                      </motion.div>
                      <p className="text-soul-600">Processing your recording...</p>
                    </div>
                  )}

                  {/* Recording Results */}
                  {!currentRecording.isRecording && !currentRecording.isProcessing && (
                    <div className="space-y-4">
                      {/* Quality Metrics */}
                      {currentRecording.qualityMetrics && (
                        <div className="bg-soul-50 rounded-lg p-4">
                          <h4 className="font-medium text-soul-800 mb-3">Quality Analysis</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries({
                              'Noise Level': Math.round((1 - currentRecording.qualityMetrics.noiseLevel) * 100),
                              'Clarity': Math.round(currentRecording.qualityMetrics.clarity * 100),
                              'Consistency': Math.round(currentRecording.qualityMetrics.consistency * 100)
                            }).map(([metric, score]) => (
                              <div key={metric} className="text-center">
                                <div className="text-2xl font-bold text-mystic-600">{score}%</div>
                                <div className="text-sm text-soul-600">{metric}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transcription */}
                      {currentRecording.transcription && (
                        <div className="bg-wisdom-50 rounded-lg p-4">
                          <h4 className="font-medium text-soul-800 mb-2">Detected Speech</h4>
                          <p className="text-soul-700 italic">"{currentRecording.transcription}"</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setCurrentRecording(null)}
                          className="px-4 py-2 border border-soul-300 text-soul-700 rounded-lg hover:bg-soul-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline mr-2" />
                          Discard
                        </button>
                        
                        <motion.button
                          onClick={createVoiceProfile}
                          disabled={!voiceForm.name.trim() || isAnalyzing}
                          className="px-6 py-2 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Creating Voice...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Create Voice Profile
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Voice Library Tab */}
        {activeTab === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voiceProfiles.map((profile) => (
                <VoiceProfileCard
                  key={profile.id}
                  profile={profile}
                  onPlay={() => playVoiceSample(profile)}
                  onSelect={() => {
                    setSelectedProfile(profile)
                    onVoiceSelected?.(profile)
                  }}
                  onTest={(text) => testVoiceGeneration(profile, text)}
                  isSelected={selectedProfile?.id === profile.id}
                />
              ))}
              
              {voiceProfiles.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FileAudio className="w-16 h-16 text-soul-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-soul-600 mb-2">No voices yet</h3>
                  <p className="text-soul-500 mb-4">Create your first custom voice to get started!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-mystic-500 text-white rounded-lg hover:bg-mystic-600 transition-colors"
                  >
                    Create Voice
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Sample Packs Tab */}
        {activeTab === 'samples' && (
          <motion.div
            key="samples"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <Download className="w-16 h-16 text-soul-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-soul-600 mb-2">Sample Voice Packs</h3>
            <p className="text-soul-500 mb-4">Coming soon! Download pre-made voice collections for various character archetypes.</p>
            <div className="bg-wisdom-50 border border-wisdom-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-wisdom-700">
                🚧 Feature in development - Premium voice packs, character archetypes, and community-shared voices!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Voice Profile Card Component
function VoiceProfileCard({
  profile,
  onPlay,
  onSelect,
  onTest,
  isSelected
}: {
  profile: VoiceProfile
  onPlay: () => void
  onSelect: () => void
  onTest: (text: string) => void
  isSelected: boolean
}) {
  const [showTest, setShowTest] = useState(false)
  const [testText, setTestText] = useState("Hello, this is a test of my custom voice!")

  const qualityScore = Math.round(profile.trainingData.qualityScore * 100)
  
  return (
    <motion.div
      className={cn(
        "bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all duration-200",
        isSelected ? "border-mystic-500 shadow-lg" : "border-soul-200"
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-soul-800">{profile.name}</h3>
          <p className="text-sm text-soul-600 capitalize">{profile.category} • {profile.characteristics.age}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            qualityScore >= 80 ? "bg-green-100 text-green-700" :
            qualityScore >= 60 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          )}>
            {qualityScore}%
          </div>
        </div>
      </div>

      {profile.description && (
        <p className="text-sm text-soul-600 mb-4">{profile.description}</p>
      )}

      {/* Characteristics */}
      <div className="flex flex-wrap gap-1 mb-4">
        {Object.entries(profile.characteristics).slice(0, 3).map(([key, value]) => (
          <span
            key={key}
            className="px-2 py-1 bg-mystic-100 text-mystic-700 rounded-full text-xs"
          >
            {value.toString().replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onPlay}
            className="flex-1 px-3 py-2 bg-soul-100 text-soul-700 rounded-lg hover:bg-soul-200 transition-colors flex items-center justify-center gap-1"
          >
            <Play className="w-4 h-4" />
            Play Sample
          </button>
          <button
            onClick={() => setShowTest(!showTest)}
            className="px-3 py-2 bg-wisdom-100 text-wisdom-700 rounded-lg hover:bg-wisdom-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showTest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter test text..."
                className="w-full px-2 py-1 text-sm border border-soul-200 rounded focus:border-mystic-500"
              />
              <button
                onClick={() => onTest(testText)}
                className="w-full px-3 py-2 bg-mystic-500 text-white rounded-lg hover:bg-mystic-600 transition-colors text-sm"
              >
                Test Voice
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onSelect}
          className={cn(
            "w-full px-3 py-2 rounded-lg font-medium transition-colors",
            isSelected
              ? "bg-mystic-500 text-white"
              : "bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white hover:shadow-lg"
          )}
        >
          {isSelected ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Selected
            </>
          ) : (
            'Select Voice'
          )}
        </button>
      </div>
    </motion.div>
  )
}