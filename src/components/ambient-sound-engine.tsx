'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, VolumeX, Settings, Play, Pause, Wind, 
  Waves, Zap, Heart, Sparkles, Music, TreePine,
  CloudRain, Sun, Moon, Bell, Bird
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Ambient Sound Engine - The Soul of Immersion
 * 
 * This magical component analyzes story content in real-time and generates
 * contextual ambient sounds that perfectly complement the narrative.
 * The AI Whisperer's secret sauce for emotional immersion! 🎵✨
 */

export interface SoundEffect {
  id: string
  name: string
  category: 'nature' | 'mystical' | 'emotional' | 'ambient' | 'spiritual'
  audioUrl: string
  volume: number
  loop: boolean
  fadeIn: number
  fadeOut: number
  duration?: number
  triggers: string[] // Keywords that trigger this sound
  emotion?: string
  chakra?: string // For spiritual sounds
}

export interface SoundLayer {
  id: string
  soundEffect: SoundEffect
  audioElement: HTMLAudioElement
  currentVolume: number
  targetVolume: number
  isPlaying: boolean
  fadeDirection: 'in' | 'out' | 'none'
}

export interface SoundScene {
  id: string
  name: string
  description: string
  layers: SoundEffect[]
  masterVolume: number
  mood: string
  triggers: string[]
}

interface AmbientSoundEngineProps {
  content: string
  isReading: boolean
  currentChapter?: number
  readingSpeed?: number
  onSoundChange?: (activeSounds: string[]) => void
  userPreferences?: {
    enableAmbientSounds: boolean
    masterVolume: number
    preferredCategories: string[]
  }
}

export function AmbientSoundEngine({
  content,
  isReading,
  currentChapter,
  readingSpeed = 1.0,
  onSoundChange,
  userPreferences = {
    enableAmbientSounds: true,
    masterVolume: 0.3,
    preferredCategories: ['nature', 'mystical', 'spiritual']
  }
}: AmbientSoundEngineProps) {
  const [activeLayers, setActiveLayers] = useState<Map<string, SoundLayer>>(new Map())
  const [currentScene, setCurrentScene] = useState<SoundScene | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [masterVolume, setMasterVolume] = useState(userPreferences.masterVolume)
  const [showControls, setShowControls] = useState(false)
  const [detectedMood, setDetectedMood] = useState<string>('')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const contentAnalysisRef = useRef<string>('')

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && userPreferences.enableAmbientSounds) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyzerRef.current = audioContextRef.current.createAnalyser()
      analyzerRef.current.connect(audioContextRef.current.destination)
    }
    
    return () => {
      audioContextRef.current?.close()
    }
  }, [userPreferences.enableAmbientSounds])

  // Analyze content and trigger appropriate sounds
  useEffect(() => {
    if (content && content !== contentAnalysisRef.current) {
      contentAnalysisRef.current = content
      analyzeContentForSounds(content)
    }
  }, [content])

  // Manage reading state
  useEffect(() => {
    if (isReading) {
      resumeAmbientSounds()
    } else {
      pauseAmbientSounds()
    }
  }, [isReading])

  const analyzeContentForSounds = async (text: string) => {
    setIsAnalyzing(true)
    
    try {
      // AI-powered content analysis for sound context
      const analysis = await analyzeTextForAudioContext(text)
      
      // Detect emotional and atmospheric cues
      const soundCues = extractSoundCues(text)
      
      // Generate appropriate sound scene
      const scene = await generateSoundScene(analysis, soundCues)
      
      if (scene) {
        await transitionToScene(scene)
        setDetectedMood(scene.mood)
      }
      
    } catch (error) {
      console.error('Error analyzing content for sounds:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeTextForAudioContext = async (text: string) => {
    // Extract key atmospheric and emotional indicators
    const lowerText = text.toLowerCase()
    
    const analysis = {
      setting: detectSetting(lowerText),
      mood: detectMood(lowerText),
      timeOfDay: detectTimeOfDay(lowerText),
      weather: detectWeather(lowerText),
      spiritualElements: detectSpiritualElements(lowerText),
      emotionalIntensity: detectEmotionalIntensity(lowerText),
      actionLevel: detectActionLevel(lowerText)
    }
    
    return analysis
  }

  const detectSetting = (text: string): string => {
    const settingKeywords = {
      forest: ['forest', 'trees', 'woods', 'branches', 'leaves', 'canopy'],
      ocean: ['ocean', 'sea', 'waves', 'beach', 'shore', 'tide'],
      mountain: ['mountain', 'peak', 'summit', 'cliff', 'valley'],
      city: ['city', 'street', 'building', 'traffic', 'urban'],
      temple: ['temple', 'shrine', 'sacred', 'altar', 'monastery'],
      home: ['home', 'house', 'room', 'kitchen', 'bedroom'],
      garden: ['garden', 'flowers', 'bloom', 'petals', 'greenhouse']
    }
    
    for (const [setting, keywords] of Object.entries(settingKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return setting
      }
    }
    
    return 'neutral'
  }

  const detectMood = (text: string): string => {
    const moodKeywords = {
      peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'quiet', 'gentle'],
      mysterious: ['mysterious', 'hidden', 'secret', 'shadow', 'whisper'],
      joyful: ['happy', 'joy', 'laughter', 'celebration', 'delight'],
      contemplative: ['thoughtful', 'reflection', 'meditation', 'pondering'],
      magical: ['magic', 'sparkle', 'enchanted', 'mystical', 'wonder'],
      sad: ['sad', 'tears', 'sorrow', 'grief', 'melancholy'],
      intense: ['intense', 'powerful', 'strong', 'overwhelming']
    }
    
    let highestScore = 0
    let detectedMood = 'neutral'
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const score = keywords.reduce((count, keyword) => 
        count + (text.split(keyword).length - 1), 0)
      if (score > highestScore) {
        highestScore = score
        detectedMood = mood
      }
    }
    
    return detectedMood
  }

  const detectTimeOfDay = (text: string): string => {
    if (text.includes('dawn') || text.includes('sunrise') || text.includes('morning')) return 'dawn'
    if (text.includes('noon') || text.includes('midday')) return 'day'
    if (text.includes('sunset') || text.includes('evening') || text.includes('dusk')) return 'sunset'
    if (text.includes('night') || text.includes('darkness') || text.includes('moon')) return 'night'
    return 'day'
  }

  const detectWeather = (text: string): string => {
    if (text.includes('rain') || text.includes('storm')) return 'rain'
    if (text.includes('wind') || text.includes('breeze')) return 'wind'
    if (text.includes('snow') || text.includes('winter')) return 'snow'
    if (text.includes('thunder') || text.includes('lightning')) return 'storm'
    return 'clear'
  }

  const detectSpiritualElements = (text: string): string[] => {
    const elements = []
    if (text.includes('meditation') || text.includes('mindful')) elements.push('meditation')
    if (text.includes('chakra') || text.includes('energy')) elements.push('energy')
    if (text.includes('healing') || text.includes('balance')) elements.push('healing')
    if (text.includes('wisdom') || text.includes('enlighten')) elements.push('wisdom')
    if (text.includes('sacred') || text.includes('divine')) elements.push('sacred')
    return elements
  }

  const detectEmotionalIntensity = (text: string): number => {
    const intensityWords = ['deeply', 'profoundly', 'overwhelming', 'intense', 'powerful', 'strong']
    return intensityWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0) / text.length * 1000
  }

  const detectActionLevel = (text: string): number => {
    const actionWords = ['ran', 'jumped', 'rushed', 'quickly', 'suddenly', 'burst', 'exploded']
    return actionWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0) / text.length * 1000
  }

  const extractSoundCues = (text: string) => {
    const soundKeywords = {
      wind: ['wind', 'breeze', 'gust', 'whisper'],
      water: ['water', 'stream', 'river', 'drops', 'splash'],
      birds: ['birds', 'chirping', 'singing', 'tweet'],
      bells: ['bell', 'chime', 'ring', 'gong'],
      heartbeat: ['heart', 'pulse', 'beat', 'rhythm'],
      mystical: ['magic', 'sparkle', 'shimmer', 'glow'],
      footsteps: ['steps', 'walking', 'footsteps', 'pace']
    }
    
    const detectedCues = []
    for (const [sound, keywords] of Object.entries(soundKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        detectedCues.push(sound)
      }
    }
    
    return detectedCues
  }

  const generateSoundScene = async (analysis: any, soundCues: string[]): Promise<SoundScene | null> => {
    const soundEffects = getSoundLibrary()
    const sceneLayers: SoundEffect[] = []
    
    // Base ambient layer based on setting
    const baseSounds = getBaseSoundsForSetting(analysis.setting, soundEffects)
    sceneLayers.push(...baseSounds)
    
    // Weather layer
    if (analysis.weather !== 'clear') {
      const weatherSound = getWeatherSound(analysis.weather, soundEffects)
      if (weatherSound) sceneLayers.push(weatherSound)
    }
    
    // Mood enhancement layer
    const moodSounds = getMoodSounds(analysis.mood, soundEffects)
    sceneLayers.push(...moodSounds)
    
    // Spiritual enhancement
    if (analysis.spiritualElements.length > 0) {
      const spiritualSounds = getSpiritualSounds(analysis.spiritualElements, soundEffects)
      sceneLayers.push(...spiritualSounds)
    }
    
    // Dynamic sound cues
    for (const cue of soundCues) {
      const cueSound = getCueSound(cue, soundEffects)
      if (cueSound) sceneLayers.push(cueSound)
    }
    
    if (sceneLayers.length === 0) return null
    
    return {
      id: `scene_${Date.now()}`,
      name: `${analysis.setting}_${analysis.mood}`,
      description: `${analysis.setting} scene with ${analysis.mood} mood`,
      layers: sceneLayers,
      masterVolume: calculateSceneVolume(analysis),
      mood: analysis.mood,
      triggers: soundCues
    }
  }

  const transitionToScene = async (newScene: SoundScene) => {
    // Fade out current sounds
    await fadeOutAllLayers()
    
    // Clear current layers
    setActiveLayers(new Map())
    
    // Start new scene
    const newLayers = new Map<string, SoundLayer>()
    
    for (const soundEffect of newScene.layers) {
      const audio = new Audio(soundEffect.audioUrl)
      audio.loop = soundEffect.loop
      audio.volume = 0
      
      const layer: SoundLayer = {
        id: soundEffect.id,
        soundEffect,
        audioElement: audio,
        currentVolume: 0,
        targetVolume: soundEffect.volume * masterVolume,
        isPlaying: false,
        fadeDirection: 'in'
      }
      
      newLayers.set(soundEffect.id, layer)
      
      // Start playing and fade in
      try {
        await audio.play()
        layer.isPlaying = true
        fadeInLayer(layer)
      } catch (error) {
        console.warn('Could not play sound:', soundEffect.name, error)
      }
    }
    
    setActiveLayers(newLayers)
    setCurrentScene(newScene)
    
    // Notify parent component
    onSoundChange?.(newScene.layers.map(s => s.name))
  }

  const fadeInLayer = (layer: SoundLayer) => {
    const fadeSteps = 50
    const fadeInterval = layer.soundEffect.fadeIn / fadeSteps
    const volumeStep = layer.targetVolume / fadeSteps
    
    let currentStep = 0
    const fadeTimer = setInterval(() => {
      currentStep++
      const newVolume = volumeStep * currentStep
      layer.audioElement.volume = Math.min(newVolume, layer.targetVolume)
      layer.currentVolume = layer.audioElement.volume
      
      if (currentStep >= fadeSteps) {
        clearInterval(fadeTimer)
        layer.fadeDirection = 'none'
      }
    }, fadeInterval)
  }

  const fadeOutAllLayers = async (): Promise<void> => {
    const fadePromises = Array.from(activeLayers.values()).map(layer => fadeOutLayer(layer))
    await Promise.all(fadePromises)
  }

  const fadeOutLayer = (layer: SoundLayer): Promise<void> => {
    return new Promise((resolve) => {
      const fadeSteps = 30
      const fadeInterval = layer.soundEffect.fadeOut / fadeSteps
      const volumeStep = layer.currentVolume / fadeSteps
      
      let currentStep = 0
      const fadeTimer = setInterval(() => {
        currentStep++
        const newVolume = layer.currentVolume - (volumeStep * currentStep)
        layer.audioElement.volume = Math.max(newVolume, 0)
        layer.currentVolume = layer.audioElement.volume
        
        if (currentStep >= fadeSteps) {
          clearInterval(fadeTimer)
          layer.audioElement.pause()
          layer.isPlaying = false
          layer.fadeDirection = 'none'
          resolve()
        }
      }, fadeInterval)
    })
  }

  const resumeAmbientSounds = () => {
    activeLayers.forEach(layer => {
      if (!layer.isPlaying) {
        layer.audioElement.play().catch(console.warn)
        layer.isPlaying = true
      }
    })
  }

  const pauseAmbientSounds = () => {
    activeLayers.forEach(layer => {
      if (layer.isPlaying) {
        layer.audioElement.pause()
        layer.isPlaying = false
      }
    })
  }

  const adjustMasterVolume = (newVolume: number) => {
    setMasterVolume(newVolume)
    activeLayers.forEach(layer => {
      const targetVolume = layer.soundEffect.volume * newVolume
      layer.targetVolume = targetVolume
      layer.audioElement.volume = targetVolume
      layer.currentVolume = targetVolume
    })
  }

  // Sound Library - Pre-generated or sourced ambient sounds
  const getSoundLibrary = (): SoundEffect[] => [
    {
      id: 'forest_ambience',
      name: 'Forest Ambience',
      category: 'nature',
      audioUrl: '/sounds/ambient/forest_base.mp3',
      volume: 0.4,
      loop: true,
      fadeIn: 2000,
      fadeOut: 1500,
      triggers: ['forest', 'trees', 'nature'],
      emotion: 'peaceful'
    },
    {
      id: 'gentle_wind',
      name: 'Gentle Wind',
      category: 'nature', 
      audioUrl: '/sounds/ambient/wind_gentle.mp3',
      volume: 0.3,
      loop: true,
      fadeIn: 3000,
      fadeOut: 2000,
      triggers: ['wind', 'breeze'],
      emotion: 'calm'
    },
    {
      id: 'mystical_chimes',
      name: 'Mystical Chimes',
      category: 'mystical',
      audioUrl: '/sounds/ambient/chimes_mystical.mp3',
      volume: 0.2,
      loop: false,
      fadeIn: 1000,
      fadeOut: 3000,
      duration: 8000,
      triggers: ['magic', 'mystical', 'wonder'],
      emotion: 'mysterious',
      chakra: 'crown'
    },
    {
      id: 'healing_hum',
      name: 'Healing Hum',
      category: 'spiritual',
      audioUrl: '/sounds/ambient/healing_om.mp3',
      volume: 0.25,
      loop: true,
      fadeIn: 4000,
      fadeOut: 4000,
      triggers: ['healing', 'meditation', 'peace'],
      emotion: 'serene',
      chakra: 'heart'
    },
    {
      id: 'soft_rain',
      name: 'Soft Rain',
      category: 'nature',
      audioUrl: '/sounds/ambient/rain_soft.mp3',
      volume: 0.35,
      loop: true,
      fadeIn: 2500,
      fadeOut: 2000,
      triggers: ['rain', 'water', 'drops'],
      emotion: 'contemplative'
    },
    {
      id: 'heartbeat_rhythm',
      name: 'Heartbeat Rhythm',
      category: 'emotional',
      audioUrl: '/sounds/ambient/heartbeat_calm.mp3',
      volume: 0.15,
      loop: true,
      fadeIn: 1500,
      fadeOut: 1500,
      triggers: ['heart', 'emotion', 'love'],
      emotion: 'intimate'
    },
    {
      id: 'temple_bells',
      name: 'Temple Bells',
      category: 'spiritual',
      audioUrl: '/sounds/ambient/temple_bells.mp3',
      volume: 0.2,
      loop: false,
      fadeIn: 500,
      fadeOut: 3000,
      duration: 6000,
      triggers: ['sacred', 'temple', 'wisdom'],
      emotion: 'reverent',
      chakra: 'third_eye'
    },
    {
      id: 'ocean_waves',
      name: 'Ocean Waves',
      category: 'nature',
      audioUrl: '/sounds/ambient/ocean_gentle.mp3',
      volume: 0.3,
      loop: true,
      fadeIn: 3000,
      fadeOut: 2500,
      triggers: ['ocean', 'waves', 'sea'],
      emotion: 'flowing'
    }
  ]

  const getBaseSoundsForSetting = (setting: string, soundLibrary: SoundEffect[]): SoundEffect[] => {
    const settingMap: Record<string, string[]> = {
      forest: ['forest_ambience'],
      ocean: ['ocean_waves'],
      temple: ['temple_bells', 'healing_hum'],
      garden: ['gentle_wind'],
      neutral: []
    }
    
    const soundIds = settingMap[setting] || []
    return soundLibrary.filter(sound => soundIds.includes(sound.id))
  }

  const getWeatherSound = (weather: string, soundLibrary: SoundEffect[]): SoundEffect | null => {
    const weatherMap: Record<string, string> = {
      rain: 'soft_rain',
      wind: 'gentle_wind'
    }
    
    const soundId = weatherMap[weather]
    return soundLibrary.find(sound => sound.id === soundId) || null
  }

  const getMoodSounds = (mood: string, soundLibrary: SoundEffect[]): SoundEffect[] => {
    const moodMap: Record<string, string[]> = {
      peaceful: ['healing_hum'],
      mysterious: ['mystical_chimes'],
      contemplative: ['soft_rain'],
      magical: ['mystical_chimes'],
      intense: ['heartbeat_rhythm']
    }
    
    const soundIds = moodMap[mood] || []
    return soundLibrary.filter(sound => soundIds.includes(sound.id))
  }

  const getSpiritualSounds = (elements: string[], soundLibrary: SoundEffect[]): SoundEffect[] => {
    const spiritualMap: Record<string, string[]> = {
      meditation: ['healing_hum'],
      sacred: ['temple_bells'],
      energy: ['mystical_chimes'],
      healing: ['healing_hum']
    }
    
    const soundIds = elements.flatMap(element => spiritualMap[element] || [])
    return soundLibrary.filter(sound => soundIds.includes(sound.id))
  }

  const getCueSound = (cue: string, soundLibrary: SoundEffect[]): SoundEffect | null => {
    const cueMap: Record<string, string> = {
      wind: 'gentle_wind',
      water: 'soft_rain',
      bells: 'temple_bells',
      heartbeat: 'heartbeat_rhythm',
      mystical: 'mystical_chimes'
    }
    
    const soundId = cueMap[cue]
    return soundLibrary.find(sound => sound.id === soundId) || null
  }

  const calculateSceneVolume = (analysis: any): number => {
    let volume = 0.3 // Base volume
    
    // Adjust based on emotional intensity
    if (analysis.emotionalIntensity > 0.5) volume += 0.1
    if (analysis.actionLevel > 0.3) volume += 0.1
    
    return Math.min(volume, 0.6) // Cap at 60%
  }

  if (!userPreferences.enableAmbientSounds) {
    return null
  }

  return (
    <div className="relative">
      {/* Ambient Sound Indicator */}
      <AnimatePresence>
        {currentScene && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white z-40"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Waves className="w-4 h-4 text-mystic-300" />
              </motion.div>
              <div className="text-sm">
                <div className="font-medium">{currentScene.name}</div>
                <div className="text-xs text-gray-300 capitalize">{detectedMood} ambience</div>
              </div>
              <button
                onClick={() => setShowControls(!showControls)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Sound Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 bg-white rounded-xl shadow-2xl border border-soul-200 p-4 z-50 min-w-[280px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-soul-800">Ambient Controls</h3>
              <button
                onClick={() => setShowControls(false)}
                className="p-1 hover:bg-soul-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Volume */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-soul-700 mb-2">
                Master Volume
              </label>
              <div className="flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-soul-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={masterVolume}
                  onChange={(e) => adjustMasterVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-soul-200 rounded-lg appearance-none"
                />
                <Volume2 className="w-4 h-4 text-soul-400" />
              </div>
            </div>

            {/* Active Layers */}
            {activeLayers.size > 0 && (
              <div>
                <label className="block text-sm font-medium text-soul-700 mb-2">
                  Active Sounds
                </label>
                <div className="space-y-2">
                  {Array.from(activeLayers.values()).map(layer => (
                    <div key={layer.id} className="flex items-center justify-between text-sm">
                      <span className="text-soul-600">{layer.soundEffect.name}</span>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          layer.isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-300"
                        )} />
                        <span className="text-xs text-soul-500">
                          {Math.round(layer.currentVolume * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center gap-2 mt-4 text-sm text-wisdom-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Analyzing content for audio cues...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}