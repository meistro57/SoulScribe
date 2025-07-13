'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Heart, Star, Smile, Zap, Gift, Wand2, 
  Coffee, Moon, Sun, Music, Rainbow, Butterfly, 
  Crown, Magic, PartyPopper, Lightbulb, Rocket,
  Cat, Dog, Rabbit, Bird, Fish, Flower2, TreePine
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Easter Egg System & Humor Agents
 * 
 * The AI Whisperer's secret sauce for delightful surprises! This system
 * monitors user interactions and triggers magical moments, humor, and
 * hidden features that make SoulScribe an absolute joy to use! 🎉✨
 */

export interface EasterEgg {
  id: string
  name: string
  category: 'humor' | 'magical' | 'interactive' | 'seasonal' | 'achievement'
  trigger: {
    type: 'click_sequence' | 'time_based' | 'word_count' | 'story_milestone' | 'konami_code' | 'random'
    conditions: any
  }
  
  effect: {
    type: 'visual' | 'audio' | 'text' | 'ui_change' | 'special_feature'
    animation?: string
    sound?: string
    message?: string
    duration?: number
    special?: any
  }
  
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  discoveredBy: string[]
  firstDiscoveredAt?: Date
  totalDiscoveries: number
  isActive: boolean
}

export interface HumorAgent {
  id: string
  name: string
  personality: 'witty' | 'punny' | 'wholesome' | 'cheeky' | 'wise_cracker'
  specialties: string[]
  
  responsePatterns: {
    encouragement: string[]
    celebrations: string[]
    gentle_teasing: string[]
    motivational: string[]
    story_comments: string[]
  }
  
  triggerConditions: {
    userMood: string[]
    storyContext: string[]
    timeOfDay: string[]
    achievements: string[]
  }
}

interface EasterEggSystemProps {
  userId: string
  currentStory?: any
  userActivity?: any
  onEggDiscovered?: (egg: EasterEgg) => void
  enableHumor?: boolean
  userPreferences?: {
    humorLevel: 'subtle' | 'moderate' | 'full_chaos'
    preferredAgents: string[]
    enableAnimations: boolean
  }
}

export function EasterEggSystem({
  userId,
  currentStory,
  userActivity,
  onEggDiscovered,
  enableHumor = true,
  userPreferences = {
    humorLevel: 'moderate',
    preferredAgents: ['witty', 'wholesome'],
    enableAnimations: true
  }
}: EasterEggSystemProps) {
  const [discoveredEggs, setDiscoveredEggs] = useState<Set<string>>(new Set())
  const [activeEffects, setActiveEffects] = useState<Map<string, any>>(new Map())
  const [clickSequence, setClickSequence] = useState<string[]>([])
  const [showHumorAgent, setShowHumorAgent] = useState(false)
  const [currentHumorMessage, setCurrentHumorMessage] = useState<any>(null)
  const [konami, setKonami] = useState<string[]>([])
  
  // Fun counters and trackers
  const [sparkleCount, setSparkleCount] = useState(0)
  const [lastEggTime, setLastEggTime] = useState<Date | null>(null)
  const [achievementStreak, setAchievementStreak] = useState(0)

  const clickTimeoutRef = useRef<NodeJS.Timeout>()
  const humorTimeoutRef = useRef<NodeJS.Timeout>()
  const konamiTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Easter eggs
  const easterEggs = useRef<EasterEgg[]>(createEasterEggDatabase())
  const humorAgents = useRef<HumorAgent[]>(createHumorAgents())

  // Konami Code sequence
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']

  useEffect(() => {
    // Load discovered eggs from storage
    const stored = localStorage.getItem(`soulscribe_eggs_${userId}`)
    if (stored) {
      setDiscoveredEggs(new Set(JSON.parse(stored)))
    }

    // Set up global event listeners
    document.addEventListener('keydown', handleKeyPress)
    document.addEventListener('click', handleGlobalClick)
    
    // Random egg trigger timer
    const randomTrigger = setInterval(triggerRandomEgg, 300000) // Every 5 minutes

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('click', handleGlobalClick)
      clearInterval(randomTrigger)
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
      if (humorTimeoutRef.current) clearTimeout(humorTimeoutRef.current)
      if (konamiTimeoutRef.current) clearTimeout(konamiTimeoutRef.current)
    }
  }, [userId])

  // Monitor story progress for milestone eggs
  useEffect(() => {
    if (currentStory) {
      checkStoryMilestones(currentStory)
    }
  }, [currentStory])

  // Monitor user activity for contextual humor
  useEffect(() => {
    if (userActivity && enableHumor) {
      const shouldTriggerHumor = Math.random() < 0.15 // 15% chance
      if (shouldTriggerHumor) {
        triggerContextualHumor(userActivity)
      }
    }
  }, [userActivity, enableHumor])

  const handleKeyPress = (event: KeyboardEvent) => {
    // Konami Code detection
    setKonami(prev => {
      const newSequence = [...prev, event.code].slice(-konamiCode.length)
      
      if (konamiTimeoutRef.current) clearTimeout(konamiTimeoutRef.current)
      konamiTimeoutRef.current = setTimeout(() => setKonami([]), 5000) // Reset after 5 seconds
      
      if (newSequence.length === konamiCode.length && 
          newSequence.every((key, index) => key === konamiCode[index])) {
        triggerKonamiEgg()
        return []
      }
      
      return newSequence
    })
  }

  const handleGlobalClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const elementType = target.tagName.toLowerCase()
    
    // Track click sequence for pattern eggs
    setClickSequence(prev => {
      const newSequence = [...prev, elementType].slice(-10) // Keep last 10 clicks
      
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = setTimeout(() => setClickSequence([]), 30000) // Reset after 30 seconds
      
      checkClickPatterns(newSequence)
      return newSequence
    })

    // Sparkle trail effect (fun visual feedback)
    if (userPreferences.enableAnimations && Math.random() < 0.05) { // 5% chance
      createSparkleEffect(event.clientX, event.clientY)
    }
  }

  const checkClickPatterns = (sequence: string[]) => {
    // Pattern: Clicking 5 buttons in a row
    if (sequence.slice(-5).every(click => click === 'button')) {
      triggerEgg('button_masher')
    }
    
    // Pattern: Spelling "SOUL" with clicks (s-o-u-l elements)
    const soulPattern = ['span', 'object', 'ul', 'li'] // Creative interpretation!
    if (sequence.slice(-4).join('') === soulPattern.join('')) {
      triggerEgg('soul_speller')
    }
  }

  const triggerKonamiEgg = () => {
    triggerEgg('konami_master')
  }

  const triggerRandomEgg = () => {
    const availableEggs = easterEggs.current.filter(egg => 
      egg.trigger.type === 'random' && 
      !discoveredEggs.has(egg.id) &&
      egg.isActive
    )
    
    if (availableEggs.length > 0 && Math.random() < 0.3) { // 30% chance
      const randomEgg = availableEggs[Math.floor(Math.random() * availableEggs.length)]
      triggerEgg(randomEgg.id)
    }
  }

  const checkStoryMilestones = (story: any) => {
    const completedChapters = story.chapters?.filter((c: any) => c.isComplete).length || 0
    const totalWords = story.chapters?.reduce((sum: number, c: any) => sum + (c.content?.length || 0), 0) || 0
    
    // Milestone eggs
    if (completedChapters === 1 && !discoveredEggs.has('first_chapter')) {
      triggerEgg('first_chapter')
    }
    
    if (completedChapters === 5 && !discoveredEggs.has('chapter_hero')) {
      triggerEgg('chapter_hero')
    }
    
    if (totalWords > 10000 && !discoveredEggs.has('word_wizard')) {
      triggerEgg('word_wizard')
    }
    
    if (story.isGenerating && !discoveredEggs.has('patience_monk')) {
      setTimeout(() => triggerEgg('patience_monk'), 60000) // After 1 minute of generation
    }
  }

  const triggerContextualHumor = (activity: any) => {
    const availableAgents = humorAgents.current.filter(agent => 
      userPreferences.preferredAgents.includes(agent.personality)
    )
    
    if (availableAgents.length === 0) return
    
    const agent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
    const context = determineContext(activity)
    
    let message = ''
    let category = 'encouragement'
    
    if (activity.strugglingWith === 'writing') {
      category = 'gentle_teasing'
      message = getRandomFromArray(agent.responsePatterns.gentle_teasing)
    } else if (activity.achievedSomething) {
      category = 'celebrations'
      message = getRandomFromArray(agent.responsePatterns.celebrations)
    } else if (activity.needsMotivation) {
      category = 'motivational'
      message = getRandomFromArray(agent.responsePatterns.motivational)
    } else {
      message = getRandomFromArray(agent.responsePatterns.encouragement)
    }
    
    showHumorMessage({
      agent: agent.name,
      message,
      category,
      personality: agent.personality
    })
  }

  const triggerEgg = (eggId: string) => {
    const egg = easterEggs.current.find(e => e.id === eggId)
    if (!egg || discoveredEggs.has(eggId)) return
    
    // Mark as discovered
    setDiscoveredEggs(prev => {
      const newSet = new Set(prev).add(eggId)
      localStorage.setItem(`soulscribe_eggs_${userId}`, JSON.stringify([...newSet]))
      return newSet
    })
    
    // Update egg stats
    egg.totalDiscoveries++
    if (!egg.firstDiscoveredAt) {
      egg.firstDiscoveredAt = new Date()
    }
    
    // Trigger effect
    executeEggEffect(egg)
    
    // Notify parent
    onEggDiscovered?.(egg)
    
    setLastEggTime(new Date())
  }

  const executeEggEffect = (egg: EasterEgg) => {
    const effectId = `effect_${Date.now()}`
    
    switch (egg.effect.type) {
      case 'visual':
        if (egg.effect.animation === 'rainbow_explosion') {
          createRainbowExplosion()
        } else if (egg.effect.animation === 'sparkle_storm') {
          createSparkleStorm()
        } else if (egg.effect.animation === 'floating_hearts') {
          createFloatingHearts()
        }
        break
        
      case 'audio':
        playEggSound(egg.effect.sound!)
        break
        
      case 'text':
        showEggMessage(egg)
        break
        
      case 'ui_change':
        applyTemporaryUIChange(egg)
        break
        
      case 'special_feature':
        activateSpecialFeature(egg)
        break
    }
    
    // Auto-cleanup
    setTimeout(() => {
      setActiveEffects(prev => {
        const newMap = new Map(prev)
        newMap.delete(effectId)
        return newMap
      })
    }, egg.effect.duration || 5000)
  }

  const createSparkleEffect = (x: number, y: number) => {
    setSparkleCount(prev => prev + 1)
    
    // Create temporary sparkle element
    const sparkle = document.createElement('div')
    sparkle.className = 'fixed pointer-events-none z-50'
    sparkle.style.left = `${x - 10}px`
    sparkle.style.top = `${y - 10}px`
    sparkle.innerHTML = '✨'
    
    document.body.appendChild(sparkle)
    
    // Animate
    sparkle.animate([
      { transform: 'scale(0) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.5) rotate(180deg)', opacity: 0.8 },
      { transform: 'scale(0) rotate(360deg)', opacity: 0 }
    ], {
      duration: 1500,
      easing: 'ease-out'
    }).onfinish = () => {
      document.body.removeChild(sparkle)
    }
  }

  const createRainbowExplosion = () => {
    const colors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff']
    
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const element = document.createElement('div')
        element.className = 'fixed pointer-events-none z-50 w-4 h-4 rounded-full'
        element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
        element.style.left = '50%'
        element.style.top = '50%'
        
        document.body.appendChild(element)
        
        const angle = (i / 20) * 360
        const distance = 200 + Math.random() * 100
        const endX = Math.cos(angle * Math.PI / 180) * distance
        const endY = Math.sin(angle * Math.PI / 180) * distance
        
        element.animate([
          { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
          { transform: `translate(${endX}px, ${endY}px) scale(1)`, opacity: 0.8 },
          { transform: `translate(${endX * 1.5}px, ${endY * 1.5}px) scale(0)`, opacity: 0 }
        ], {
          duration: 2000,
          easing: 'ease-out'
        }).onfinish = () => {
          document.body.removeChild(element)
        }
      }, i * 50)
    }
  }

  const createSparkleStorm = () => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createSparkleEffect(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight
        )
      }, i * 100)
    }
  }

  const createFloatingHearts = () => {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const heart = document.createElement('div')
        heart.className = 'fixed pointer-events-none z-50 text-2xl'
        heart.innerHTML = '💖'
        heart.style.left = `${Math.random() * (window.innerWidth - 50)}px`
        heart.style.top = `${window.innerHeight}px`
        
        document.body.appendChild(heart)
        
        heart.animate([
          { transform: 'translateY(0) scale(0)', opacity: 1 },
          { transform: 'translateY(-200px) scale(1)', opacity: 0.8 },
          { transform: `translateY(-${window.innerHeight + 100}px) scale(0)`, opacity: 0 }
        ], {
          duration: 4000,
          easing: 'ease-out'
        }).onfinish = () => {
          document.body.removeChild(heart)
        }
      }, i * 200)
    }
  }

  const showEggMessage = (egg: EasterEgg) => {
    setActiveEffects(prev => new Map(prev).set(egg.id, {
      type: 'message',
      message: egg.effect.message,
      egg
    }))
  }

  const showHumorMessage = (humorData: any) => {
    setCurrentHumorMessage(humorData)
    setShowHumorAgent(true)
    
    if (humorTimeoutRef.current) clearTimeout(humorTimeoutRef.current)
    humorTimeoutRef.current = setTimeout(() => {
      setShowHumorAgent(false)
    }, 5000)
  }

  const playEggSound = (soundName: string) => {
    // Would play audio file - for now, just console log
    console.log(`🔊 Playing easter egg sound: ${soundName}`)
  }

  const applyTemporaryUIChange = (egg: EasterEgg) => {
    // Example: Change theme temporarily, add special effects, etc.
    document.body.classList.add(`easter-egg-${egg.id}`)
    setTimeout(() => {
      document.body.classList.remove(`easter-egg-${egg.id}`)
    }, egg.effect.duration || 10000)
  }

  const activateSpecialFeature = (egg: EasterEgg) => {
    // Example special features
    if (egg.id === 'ai_whisperer_mode') {
      // Activate special AI mode with enhanced responses
      console.log('🧙‍♂️ AI Whisperer mode activated!')
    } else if (egg.id === 'rainbow_theme') {
      // Activate rainbow theme
      document.body.style.filter = 'hue-rotate(0deg)'
      let hue = 0
      const interval = setInterval(() => {
        hue = (hue + 1) % 360
        document.body.style.filter = `hue-rotate(${hue}deg)`
      }, 50)
      
      setTimeout(() => {
        clearInterval(interval)
        document.body.style.filter = ''
      }, 10000)
    }
  }

  const determineContext = (activity: any) => {
    // Analyze user activity to provide contextual responses
    return {
      mood: activity.mood || 'neutral',
      progress: activity.progress || 'steady',
      timeSpent: activity.timeSpent || 0,
      lastAction: activity.lastAction || 'unknown'
    }
  }

  const getRandomFromArray = (array: string[]) => {
    return array[Math.floor(Math.random() * array.length)]
  }

  // Easter Egg Database
  function createEasterEggDatabase(): EasterEgg[] {
    return [
      {
        id: 'first_chapter',
        name: 'Chapter One Hero',
        category: 'achievement',
        trigger: { type: 'story_milestone', conditions: { chapters: 1 } },
        effect: { 
          type: 'visual', 
          animation: 'floating_hearts',
          message: "🎉 Your first chapter is complete! Every great story begins with a single step.",
          duration: 3000
        },
        rarity: 'common',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'konami_master',
        name: 'Code Master',
        category: 'interactive',
        trigger: { type: 'konami_code', conditions: {} },
        effect: { 
          type: 'special_feature',
          message: "🕹️ Konami Code master! You've unlocked the secret AI Whisperer mode!",
          special: 'ai_whisperer_mode',
          duration: 30000
        },
        rarity: 'legendary',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'button_masher',
        name: 'Button Enthusiast',
        category: 'humor',
        trigger: { type: 'click_sequence', conditions: { pattern: 'button_spam' } },
        effect: { 
          type: 'text',
          message: "🤔 Someone really likes clicking buttons! Have you considered a career in software testing?",
          duration: 4000
        },
        rarity: 'uncommon',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'patience_monk',
        name: 'Patience Monk',
        category: 'achievement',
        trigger: { type: 'time_based', conditions: { waitTime: 60000 } },
        effect: { 
          type: 'visual',
          animation: 'sparkle_storm',
          message: "🧘‍♀️ Your patience is truly admirable! Good things come to those who wait.",
          duration: 5000
        },
        rarity: 'rare',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'word_wizard',
        name: 'Word Wizard',
        category: 'achievement',
        trigger: { type: 'word_count', conditions: { count: 10000 } },
        effect: { 
          type: 'visual',
          animation: 'rainbow_explosion',
          message: "📚 10,000 words! You're officially a Word Wizard! ✨",
          duration: 6000
        },
        rarity: 'rare',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'midnight_writer',
        name: 'Midnight Writer',
        category: 'seasonal',
        trigger: { type: 'time_based', conditions: { hour: 0 } },
        effect: { 
          type: 'text',
          message: "🌙 Writing at midnight? You're truly dedicated to your craft!",
          duration: 4000
        },
        rarity: 'uncommon',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      },
      {
        id: 'coffee_break',
        name: 'Coffee Break Master',
        category: 'humor',
        trigger: { type: 'random', conditions: {} },
        effect: { 
          type: 'text',
          message: "☕ Time for a coffee break? Even AI Whisperers need caffeine!",
          duration: 3000
        },
        rarity: 'common',
        discoveredBy: [],
        totalDiscoveries: 0,
        isActive: true
      }
    ]
  }

  // Humor Agents Database
  function createHumorAgents(): HumorAgent[] {
    return [
      {
        id: 'witty_sage',
        name: 'The Witty Sage',
        personality: 'witty',
        specialties: ['clever_observations', 'wordplay', 'gentle_sarcasm'],
        responsePatterns: {
          encouragement: [
            "Your creativity is more powerful than you realize! 🧙‍♂️",
            "I see greatness brewing in this story...",
            "Plot twist: You're actually amazing at this! 📖"
          ],
          celebrations: [
            "🎉 Another chapter conquered! Shakespeare is taking notes.",
            "That chapter was so good, even the AI agents are jealous! ✨",
            "Achievement unlocked: Story Wizard Level Up! 🏆"
          ],
          gentle_teasing: [
            "Writer's block, or are you just giving your keyboard a rest? 😏",
            "I see you staring at the screen... The cursor is staring back! 👁️",
            "Fun fact: Stories write themselves... when you write them! 📝"
          ],
          motivational: [
            "Every word you write is a step toward your masterpiece! 🚀",
            "Remember: Even the greatest authors had rough drafts! 💪",
            "Your story wants to be told - and you're the perfect person to tell it! ⭐"
          ],
          story_comments: [
            "Ooh, plot thickens! 🤔",
            "Did not see that character development coming! 📈",
            "This story has more layers than an onion... but way less crying! 🧅"
          ]
        },
        triggerConditions: {
          userMood: ['contemplative', 'stuck', 'excited'],
          storyContext: ['plot_twist', 'character_development', 'world_building'],
          timeOfDay: ['morning', 'afternoon', 'evening'],
          achievements: ['first_chapter', 'milestone_reached']
        }
      },
      {
        id: 'wholesome_cheerleader',
        name: 'The Wholesome Cheerleader',
        personality: 'wholesome',
        specialties: ['encouragement', 'positivity', 'celebration'],
        responsePatterns: {
          encouragement: [
            "You're doing amazing! Keep that beautiful creativity flowing! 🌟",
            "Every word you write makes the world a little more magical! ✨",
            "Your story is going to touch hearts and inspire souls! 💖"
          ],
          celebrations: [
            "🎊 YES! Another beautiful chapter complete! So proud of you!",
            "You're not just writing a story, you're creating magic! 🪄",
            "Every chapter is a gift to the world! Thank you for sharing your light! 🌈"
          ],
          gentle_teasing: [
            "Taking a little break? That's okay, inspiration comes in waves! 🌊",
            "Sometimes the best ideas come when we're not trying so hard! 🌸",
            "Your creative mind is just gathering more beautiful thoughts! 💭"
          ],
          motivational: [
            "You have such a unique voice - the world needs your stories! 🗣️",
            "Believe in yourself as much as I believe in you! 💪💕",
            "Your creativity is a superpower! Use it to change the world! 🦸‍♀️"
          ],
          story_comments: [
            "This story is pure magic! ✨",
            "Your characters feel so real and lovable! 💝",
            "I can't wait to see where this beautiful journey goes! 🛤️"
          ]
        },
        triggerConditions: {
          userMood: ['happy', 'motivated', 'peaceful'],
          storyContext: ['heartwarming_moment', 'character_growth', 'resolution'],
          timeOfDay: ['morning', 'afternoon'],
          achievements: ['consistency', 'breakthrough']
        }
      }
    ]
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Easter Egg Messages */}
      <AnimatePresence>
        {Array.from(activeEffects.entries()).map(([id, effect]) => (
          effect.type === 'message' && (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-2xl max-w-md text-center pointer-events-auto"
            >
              <div className="flex items-center gap-2 justify-center mb-1">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">Easter Egg Discovered!</span>
                <Gift className="w-5 h-5" />
              </div>
              <p className="text-sm">{effect.message}</p>
              <div className="text-xs mt-1 opacity-80">
                Rarity: {effect.egg.rarity} • {effect.egg.name}
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Humor Agent Messages */}
      <AnimatePresence>
        {showHumorAgent && currentHumorMessage && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-20 right-4 bg-white rounded-xl shadow-2xl border border-soul-200 p-4 max-w-sm pointer-events-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-mystic-500 to-wisdom-500 rounded-full flex items-center justify-center flex-shrink-0">
                {currentHumorMessage.personality === 'witty' ? (
                  <Wand2 className="w-5 h-5 text-white" />
                ) : (
                  <Heart className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-soul-800 text-sm mb-1">
                  {currentHumorMessage.agent}
                </div>
                <p className="text-soul-700 text-sm">
                  {currentHumorMessage.message}
                </p>
              </div>
              <button
                onClick={() => setShowHumorAgent(false)}
                className="text-soul-400 hover:text-soul-600 transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Stats (Debug/Dev Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono pointer-events-auto">
          <div>Eggs Discovered: {discoveredEggs.size}</div>
          <div>Sparkles Created: {sparkleCount}</div>
          <div>Click Sequence: {clickSequence.slice(-5).join(' → ')}</div>
          <div>Konami Progress: {konami.length}/{konamiCode.length}</div>
        </div>
      )}
    </div>
  )
}