'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Sparkles, Heart, BookOpen, Users, Palette, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Story Questionnaire - The Gateway to SoulScribe Magic
 * 
 * This beautiful, interactive questionnaire gathers the user's vision and transforms
 * it into the perfect input for the AI Whisperer's story generation pipeline! ✨
 */

export interface QuestionnaireData {
  // Basic Story Parameters
  genre: string
  targetAge: 'child' | 'teen' | 'adult' | 'all_ages'
  chapterCount: number
  estimatedLength: 'short' | 'medium' | 'long'
  
  // Spiritual & Thematic Elements
  primaryTheme: string
  lifeLesson: string
  spiritualElements: string[]
  metaphorPreferences: string[]
  
  // Character & Setting
  characterTypes: string[]
  settingPreferences: string[]
  
  // Tone & Style
  toneKeywords: string[]
  writingStyle: 'poetic' | 'conversational' | 'mystical' | 'playful'
  
  // Interactive Chat Responses
  chatResponses: Array<{ question: string; answer: string; timestamp: Date }>
}

interface StoryQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void
  onProgress?: (step: number, total: number) => void
}

export function StoryQuestionnaire({ onComplete, onProgress }: StoryQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<QuestionnaireData>>({
    chatResponses: []
  })
  const [isTransitioning, setIsTransitioning] = useState(false)

  const totalSteps = 7

  // Update progress
  React.useEffect(() => {
    onProgress?.(currentStep + 1, totalSteps)
  }, [currentStep, onProgress])

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const updateFormData = (updates: Partial<QuestionnaireData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleComplete = () => {
    onComplete(formData as QuestionnaireData)
  }

  const steps = [
    <StepGenreSelection key="genre" formData={formData} updateFormData={updateFormData} onNext={nextStep} />,
    <StepThemesAndLessons key="themes" formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />,
    <StepStructureAndLength key="structure" formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />,
    <StepCharactersAndSetting key="characters" formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />,
    <StepToneAndStyle key="tone" formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />,
    <StepSpiritualElements key="spiritual" formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />,
    <StepChatRefinement key="chat" formData={formData} updateFormData={updateFormData} onComplete={handleComplete} onPrev={prevStep} />
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-soul-50 via-mystic-50 to-wisdom-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 text-mystic-600 mb-4">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl font-bold font-mystic">SoulScribe Story Vision</h1>
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-soul-600 text-lg max-w-2xl mx-auto">
            Let's weave your vision into a tale that awakens hearts and inspires souls. 
            Every answer brings us closer to your perfect story.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-soul-600">Step {currentStep + 1} of {totalSteps}</span>
            <span className="text-sm text-soul-500">{Math.round(((currentStep + 1) / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-soul-200 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-mystic-500 to-wisdom-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: isTransitioning ? 50 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-soul-200"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step 1: Genre Selection
function StepGenreSelection({ formData, updateFormData, onNext }: StepProps) {
  const genres = [
    { id: 'spiritual-adventure', name: 'Spiritual Adventure', icon: '🏔️', description: 'A journey of discovery and growth' },
    { id: 'mystical-fable', name: 'Mystical Fable', icon: '🌟', description: 'Ancient wisdom in magical form' },
    { id: 'modern-parable', name: 'Modern Parable', icon: '🏙️', description: 'Contemporary lessons with timeless truths' },
    { id: 'nature-wisdom', name: 'Nature Wisdom', icon: '🌳', description: 'Learning from the natural world' },
    { id: 'cosmic-tale', name: 'Cosmic Tale', icon: '🌌', description: 'Universal themes across time and space' },
    { id: 'inner-journey', name: 'Inner Journey', icon: '🧘', description: 'Exploration of consciousness and soul' }
  ]

  const targetAges = [
    { id: 'child', name: 'Children (5-12)', icon: '🧸', description: 'Simple wisdom, magical wonder' },
    { id: 'teen', name: 'Teens (13-17)', icon: '🌱', description: 'Identity, purpose, and growth' },
    { id: 'adult', name: 'Adults (18+)', icon: '💼', description: 'Deep insights for life\'s complexities' },
    { id: 'all_ages', name: 'All Ages', icon: '👨‍👩‍👧‍👦', description: 'Universal wisdom for everyone' }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <BookOpen className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">What kind of story calls to your soul?</h2>
        <p className="text-soul-600">Choose the genre and audience that resonates with your vision.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Story Genre</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <motion.button
              key={genre.id}
              onClick={() => updateFormData({ genre: genre.id })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                formData.genre === genre.id 
                  ? "border-mystic-500 bg-mystic-50 shadow-lg" 
                  : "border-soul-200 hover:border-mystic-300 hover:bg-mystic-25"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-2">{genre.icon}</div>
              <h4 className="font-semibold text-soul-800">{genre.name}</h4>
              <p className="text-sm text-soul-600">{genre.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Target Audience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {targetAges.map((age) => (
            <motion.button
              key={age.id}
              onClick={() => updateFormData({ targetAge: age.id as any })}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all duration-200",
                formData.targetAge === age.id 
                  ? "border-wisdom-500 bg-wisdom-50 shadow-lg" 
                  : "border-soul-200 hover:border-wisdom-300 hover:bg-wisdom-25"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-2">{age.icon}</div>
              <h4 className="font-semibold text-soul-800">{age.name}</h4>
              <p className="text-sm text-soul-600">{age.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          onClick={onNext}
          disabled={!formData.genre || !formData.targetAge}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.genre && formData.targetAge
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.genre && formData.targetAge ? { scale: 1.05 } : {}}
          whileTap={formData.genre && formData.targetAge ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 2: Themes and Life Lessons
function StepThemesAndLessons({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const themes = [
    'Self-Discovery', 'Courage & Bravery', 'Love & Compassion', 'Wisdom & Growth',
    'Forgiveness & Healing', 'Purpose & Meaning', 'Connection & Unity', 'Transformation',
    'Inner Peace', 'Resilience', 'Gratitude', 'Mindfulness', 'Sacred Journey',
    'Ancient Wisdom', 'Divine Connection', 'Soul Awakening'
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Heart className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">What wisdom will your story carry?</h2>
        <p className="text-soul-600">Choose the themes and life lesson that will touch hearts.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Primary Theme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themes.map((theme) => (
            <motion.button
              key={theme}
              onClick={() => updateFormData({ primaryTheme: theme })}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                formData.primaryTheme === theme 
                  ? "border-mystic-500 bg-mystic-50 text-mystic-700" 
                  : "border-soul-200 hover:border-mystic-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {theme}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Core Life Lesson</h3>
        <textarea
          value={formData.lifeLesson || ''}
          onChange={(e) => updateFormData({ lifeLesson: e.target.value })}
          placeholder="What is the key insight or wisdom you want readers to discover? (e.g., 'True strength comes from vulnerability' or 'We find ourselves by serving others')"
          className="w-full h-24 p-4 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200 resize-none"
        />
      </div>

      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onNext}
          disabled={!formData.primaryTheme || !formData.lifeLesson}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.primaryTheme && formData.lifeLesson
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.primaryTheme && formData.lifeLesson ? { scale: 1.05 } : {}}
          whileTap={formData.primaryTheme && formData.lifeLesson ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 3: Structure and Length
function StepStructureAndLength({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const chapterOptions = [3, 5, 8, 12, 15]
  const lengthOptions = [
    { id: 'short', name: 'Short & Sweet', description: '5-10 min read per chapter', icon: '☕' },
    { id: 'medium', name: 'Thoughtful Journey', description: '10-20 min read per chapter', icon: '🌱' },
    { id: 'long', name: 'Deep Exploration', description: '20+ min read per chapter', icon: '🌳' }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <BookOpen className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">How shall we structure your tale?</h2>
        <p className="text-soul-600">Choose the length and pacing that feels right for your story.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Number of Chapters</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {chapterOptions.map((count) => (
            <motion.button
              key={count}
              onClick={() => updateFormData({ chapterCount: count })}
              className={cn(
                "w-16 h-16 rounded-full border-2 font-bold text-lg transition-all duration-200",
                formData.chapterCount === count 
                  ? "border-mystic-500 bg-mystic-50 text-mystic-700" 
                  : "border-soul-200 hover:border-mystic-300 text-soul-700"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {count}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Chapter Length</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lengthOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => updateFormData({ estimatedLength: option.id as any })}
              className={cn(
                "p-4 rounded-xl border-2 text-center transition-all duration-200",
                formData.estimatedLength === option.id 
                  ? "border-wisdom-500 bg-wisdom-50 shadow-lg" 
                  : "border-soul-200 hover:border-wisdom-300 hover:bg-wisdom-25"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <h4 className="font-semibold text-soul-800">{option.name}</h4>
              <p className="text-sm text-soul-600">{option.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onNext}
          disabled={!formData.chapterCount || !formData.estimatedLength}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.chapterCount && formData.estimatedLength
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.chapterCount && formData.estimatedLength ? { scale: 1.05 } : {}}
          whileTap={formData.chapterCount && formData.estimatedLength ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 4: Characters and Setting
function StepCharactersAndSetting({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const characterTypes = [
    'Wise Elder', 'Curious Child', 'Spiritual Guide', 'Brave Seeker', 'Gentle Healer',
    'Mystical Being', 'Animal Companion', 'Ancient Teacher', 'Fellow Traveler', 'Inner Voice'
  ]

  const settings = [
    'Enchanted Forest', 'Sacred Mountain', 'Peaceful Village', 'Mystical Garden',
    'Ancient Temple', 'Starlit Desert', 'Hidden Valley', 'Magical Library',
    'Cosmic Realm', 'Inner Landscape', 'Modern City', 'Timeless Sanctuary'
  ]

  const toggleSelection = (array: string[], item: string, key: keyof QuestionnaireData) => {
    const current = (formData[key] as string[]) || []
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item]
    updateFormData({ [key]: updated })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Users className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">Who will walk this journey?</h2>
        <p className="text-soul-600">Choose the characters and settings that will bring your story to life.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Character Types (Select 2-4)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {characterTypes.map((character) => (
            <motion.button
              key={character}
              onClick={() => toggleSelection(characterTypes, character, 'characterTypes')}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                (formData.characterTypes || []).includes(character)
                  ? "border-mystic-500 bg-mystic-50 text-mystic-700" 
                  : "border-soul-200 hover:border-mystic-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {character}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-soul-500 mt-2">
          Selected: {(formData.characterTypes || []).length} characters
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Setting Preferences (Select 1-3)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {settings.map((setting) => (
            <motion.button
              key={setting}
              onClick={() => toggleSelection(settings, setting, 'settingPreferences')}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                (formData.settingPreferences || []).includes(setting)
                  ? "border-wisdom-500 bg-wisdom-50 text-wisdom-700" 
                  : "border-soul-200 hover:border-wisdom-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {setting}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-soul-500 mt-2">
          Selected: {(formData.settingPreferences || []).length} settings
        </p>
      </div>

      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onNext}
          disabled={!formData.characterTypes?.length || !formData.settingPreferences?.length}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.characterTypes?.length && formData.settingPreferences?.length
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.characterTypes?.length && formData.settingPreferences?.length ? { scale: 1.05 } : {}}
          whileTap={formData.characterTypes?.length && formData.settingPreferences?.length ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 5: Tone and Style
function StepToneAndStyle({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const toneKeywords = [
    'Warm', 'Gentle', 'Mystical', 'Inspiring', 'Peaceful', 'Magical',
    'Profound', 'Playful', 'Wise', 'Uplifting', 'Dreamy', 'Sacred'
  ]

  const writingStyles = [
    { id: 'poetic', name: 'Poetic & Lyrical', description: 'Rich imagery and flowing language', icon: '🎭' },
    { id: 'conversational', name: 'Warm & Conversational', description: 'Like a friend sharing wisdom', icon: '💬' },
    { id: 'mystical', name: 'Mystical & Ethereal', description: 'Otherworldly and enchanting', icon: '✨' },
    { id: 'playful', name: 'Playful & Light', description: 'Joyful and accessible', icon: '🌈' }
  ]

  const toggleTone = (tone: string) => {
    const current = formData.toneKeywords || []
    const updated = current.includes(tone) 
      ? current.filter(t => t !== tone)
      : [...current, tone]
    updateFormData({ toneKeywords: updated })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Palette className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">What voice will tell your story?</h2>
        <p className="text-soul-600">Choose the tone and style that will carry your wisdom.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Tone Keywords (Select 3-6)</h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {toneKeywords.map((tone) => (
            <motion.button
              key={tone}
              onClick={() => toggleTone(tone)}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200",
                (formData.toneKeywords || []).includes(tone)
                  ? "border-mystic-500 bg-mystic-50 text-mystic-700" 
                  : "border-soul-200 hover:border-mystic-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tone}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-soul-500 mt-2">
          Selected: {(formData.toneKeywords || []).length} tones
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Writing Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {writingStyles.map((style) => (
            <motion.button
              key={style.id}
              onClick={() => updateFormData({ writingStyle: style.id as any })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                formData.writingStyle === style.id 
                  ? "border-wisdom-500 bg-wisdom-50 shadow-lg" 
                  : "border-soul-200 hover:border-wisdom-300 hover:bg-wisdom-25"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{style.icon}</span>
                <div>
                  <h4 className="font-semibold text-soul-800">{style.name}</h4>
                  <p className="text-sm text-soul-600">{style.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onNext}
          disabled={!formData.toneKeywords?.length || !formData.writingStyle}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.toneKeywords?.length && formData.writingStyle
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.toneKeywords?.length && formData.writingStyle ? { scale: 1.05 } : {}}
          whileTap={formData.toneKeywords?.length && formData.writingStyle ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 6: Spiritual Elements
function StepSpiritualElements({ formData, updateFormData, onNext, onPrev }: StepProps) {
  const spiritualElements = [
    'Meditation & Mindfulness', 'Sacred Symbols', 'Ancient Wisdom', 'Divine Connection',
    'Energy & Chakras', 'Dream Journeys', 'Nature Spirits', 'Angelic Guidance',
    'Ancestral Wisdom', 'Crystal Magic', 'Sacred Geometry', 'Universal Love'
  ]

  const metaphorTypes = [
    'Nature Metaphors', 'Light & Shadow', 'Journey & Path', 'Seeds & Growth',
    'Rivers & Flow', 'Mountains & Valleys', 'Bridges & Connections', 'Keys & Doors',
    'Mirrors & Reflection', 'Trees & Roots', 'Stars & Cosmos', 'Heart & Soul'
  ]

  const toggleElement = (array: string[], item: string, key: keyof QuestionnaireData) => {
    const current = (formData[key] as string[]) || []
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item]
    updateFormData({ [key]: updated })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">What spiritual magic will you weave?</h2>
        <p className="text-soul-600">Choose the elements and metaphors that will add depth to your tale.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Spiritual Elements (Select 2-5)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {spiritualElements.map((element) => (
            <motion.button
              key={element}
              onClick={() => toggleElement(spiritualElements, element, 'spiritualElements')}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200 text-center",
                (formData.spiritualElements || []).includes(element)
                  ? "border-mystic-500 bg-mystic-50 text-mystic-700" 
                  : "border-soul-200 hover:border-mystic-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {element}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-soul-500 mt-2">
          Selected: {(formData.spiritualElements || []).length} elements
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-soul-700 mb-4">Metaphor Preferences (Select 2-4)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {metaphorTypes.map((metaphor) => (
            <motion.button
              key={metaphor}
              onClick={() => toggleElement(metaphorTypes, metaphor, 'metaphorPreferences')}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-all duration-200 text-center",
                (formData.metaphorPreferences || []).includes(metaphor)
                  ? "border-wisdom-500 bg-wisdom-50 text-wisdom-700" 
                  : "border-soul-200 hover:border-wisdom-300 text-soul-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {metaphor}
            </motion.button>
          ))}
        </div>
        <p className="text-sm text-soul-500 mt-2">
          Selected: {(formData.metaphorPreferences || []).length} metaphors
        </p>
      </div>

      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onNext}
          disabled={!formData.spiritualElements?.length || !formData.metaphorPreferences?.length}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            formData.spiritualElements?.length && formData.metaphorPreferences?.length
              ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={formData.spiritualElements?.length && formData.metaphorPreferences?.length ? { scale: 1.05 } : {}}
          whileTap={formData.spiritualElements?.length && formData.metaphorPreferences?.length ? { scale: 0.95 } : {}}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

// Step 7: Chat Refinement
function StepChatRefinement({ formData, updateFormData, onComplete, onPrev }: Omit<StepProps, 'onNext'> & { onComplete: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userResponse, setUserResponse] = useState('')

  const questions = [
    "What inspired you to create this story? What personal experience or insight do you want to share?",
    "Who do you imagine as your ideal reader? What do you hope they'll feel or discover?",
    "Is there a particular moment of transformation or awakening you'd like to explore in your story?",
    "What makes this story uniquely yours? What personal touch will make it special?",
    "Any final details, characters, or magical elements you'd love to see included?"
  ]

  const addResponse = () => {
    if (userResponse.trim()) {
      const newResponse = {
        question: questions[currentQuestion],
        answer: userResponse.trim(),
        timestamp: new Date()
      }
      
      const updatedResponses = [...(formData.chatResponses || []), newResponse]
      updateFormData({ chatResponses: updatedResponses })
      
      setUserResponse('')
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      }
    }
  }

  const isComplete = (formData.chatResponses || []).length >= 3

  return (
    <div className="space-y-8">
      <div className="text-center">
        <MessageCircle className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-soul-800 mb-2">Let's refine your vision together</h2>
        <p className="text-soul-600">Share your thoughts to help us create the perfect story for you.</p>
      </div>

      {/* Previous Responses */}
      {(formData.chatResponses || []).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-soul-700">Your Story Vision:</h3>
          {(formData.chatResponses || []).map((response, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-mystic-50 rounded-lg p-4 border border-mystic-200"
            >
              <p className="font-medium text-mystic-700 mb-2">{response.question}</p>
              <p className="text-soul-700">{response.answer}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Current Question */}
      {currentQuestion < questions.length && (
        <div className="bg-wisdom-50 rounded-lg p-6 border border-wisdom-200">
          <h3 className="text-lg font-semibold text-wisdom-700 mb-4">
            Question {currentQuestion + 1} of {questions.length}
          </h3>
          <p className="text-soul-700 mb-4">{questions[currentQuestion]}</p>
          
          <div className="space-y-4">
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full h-24 p-4 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200 resize-none"
            />
            
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.min(currentQuestion + 1, questions.length))}
                className="text-sm text-soul-500 hover:text-soul-700"
              >
                Skip this question
              </button>
              
              <motion.button
                onClick={addResponse}
                disabled={!userResponse.trim()}
                className={cn(
                  "px-6 py-2 rounded-lg font-semibold transition-all duration-200",
                  userResponse.trim()
                    ? "bg-wisdom-500 text-white hover:bg-wisdom-600"
                    : "bg-soul-200 text-soul-400 cursor-not-allowed"
                )}
                whileHover={userResponse.trim() ? { scale: 1.05 } : {}}
                whileTap={userResponse.trim() ? { scale: 0.95 } : {}}
              >
                Add Response
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Completion */}
      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-soul-600 hover:text-soul-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </motion.button>
        
        <motion.button
          onClick={onComplete}
          disabled={!isComplete}
          className={cn(
            "px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200",
            isComplete
              ? "bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white hover:shadow-lg"
              : "bg-soul-200 text-soul-400 cursor-not-allowed"
          )}
          whileHover={isComplete ? { scale: 1.05 } : {}}
          whileTap={isComplete ? { scale: 0.95 } : {}}
        >
          <Sparkles className="w-4 h-4" />
          Create My Story
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </div>
      
      {!isComplete && (
        <p className="text-center text-sm text-soul-500">
          Answer at least 3 questions to create your story
        </p>
      )}
    </div>
  )
}

interface StepProps {
  formData: Partial<QuestionnaireData>
  updateFormData: (updates: Partial<QuestionnaireData>) => void
  onNext: () => void
  onPrev: () => void
}

// Add missing React import at the top
import React from 'react'