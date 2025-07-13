'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  Play, Pause, Volume2, VolumeX, BookOpen, ChevronLeft, ChevronRight, 
  Loader2, Sparkles, Heart, Star, Menu, X, RotateCcw, Download,
  Clock, Users, Palette, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Flipbook UI with Real-time Generation Display
 * 
 * The visual masterpiece where users watch their SoulScribe story come to life!
 * Features 3D page flips, real-time progress, and integrated audio controls.
 * The AI Whisperer's crown jewel! 📚✨
 */

export interface Chapter {
  number: number
  title: string
  content: string
  summary: string
  keyLessons: string[]
  audioUrl?: string
  isGenerating?: boolean
  isComplete?: boolean
  estimatedReadTime?: number
}

export interface StoryData {
  id: string
  title: string
  author: string
  coverImage?: string
  chapters: Chapter[]
  tableOfContents: any
  introduction: string
  learningReflection: string
  totalReadTime: number
  isGenerating: boolean
  generationProgress: {
    phase: string
    currentStep: string
    completedSteps: string[]
    estimatedTimeRemaining: number
  }
}

interface FlipbookUIProps {
  story: StoryData
  onPageChange?: (pageNumber: number) => void
  onAudioToggle?: (isPlaying: boolean) => void
  onChapterComplete?: (chapterNumber: number) => void
  realTimeUpdates?: boolean
}

export function FlipbookUI({ 
  story, 
  onPageChange, 
  onAudioToggle,
  onChapterComplete,
  realTimeUpdates = true 
}: FlipbookUIProps) {
  const [currentPage, setCurrentPage] = useState(0) // 0 = cover, 1 = TOC, 2+ = chapters
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const flipbookRef = useRef<HTMLDivElement>(null)

  const totalPages = 2 + story.chapters.length + 1 // Cover + TOC + Chapters + Reflection
  const canFlipNext = currentPage < totalPages - 1
  const canFlipPrev = currentPage > 0

  // Page change handler
  useEffect(() => {
    onPageChange?.(currentPage)
  }, [currentPage, onPageChange])

  // Auto-play audio when page changes
  useEffect(() => {
    if (currentPage >= 2 && currentPage < totalPages - 1) {
      const chapterIndex = currentPage - 2
      const chapter = story.chapters[chapterIndex]
      if (chapter?.audioUrl && audioRef.current) {
        audioRef.current.src = chapter.audioUrl
        if (isPlaying) {
          audioRef.current.play()
        }
      }
    }
  }, [currentPage, isPlaying, story.chapters, totalPages])

  const flipToPage = (pageNumber: number) => {
    if (pageNumber >= 0 && pageNumber < totalPages && !isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(pageNumber)
        setIsFlipping(false)
      }, 300)
    }
  }

  const nextPage = () => canFlipNext && flipToPage(currentPage + 1)
  const prevPage = () => canFlipPrev && flipToPage(currentPage - 1)

  const toggleAudio = () => {
    const newIsPlaying = !isPlaying
    setIsPlaying(newIsPlaying)
    onAudioToggle?.(newIsPlaying)
    
    if (audioRef.current) {
      if (newIsPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && canFlipPrev) {
        prevPage()
      } else if (info.offset.x < 0 && canFlipNext) {
        nextPage()
      }
    }
    setDragDirection(null)
  }

  const getCurrentPageContent = () => {
    switch (currentPage) {
      case 0:
        return <CoverPage story={story} />
      case 1:
        return <TableOfContentsPage story={story} onChapterClick={flipToPage} />
      case totalPages - 1:
        return <ReflectionPage story={story} />
      default:
        const chapterIndex = currentPage - 2
        return <ChapterPage 
          chapter={story.chapters[chapterIndex]} 
          chapterNumber={chapterIndex + 1}
          onComplete={() => onChapterComplete?.(chapterIndex + 1)}
        />
    }
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-soul-900 via-mystic-900 to-wisdom-900 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-mystic-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-wisdom-500 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-soul-500 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Generation Progress Overlay */}
      <AnimatePresence>
        {story.isGenerating && (
          <GenerationProgressOverlay 
            progress={story.generationProgress}
            chapters={story.chapters}
          />
        )}
      </AnimatePresence>

      {/* Main Flipbook Container */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div 
          ref={flipbookRef}
          className="relative max-w-6xl w-full h-full flex items-center justify-center"
          style={{ perspective: '2000px' }}
        >
          {/* Left Page (Previous) */}
          <AnimatePresence mode="wait">
            {currentPage > 0 && (
              <motion.div
                key={`left-${currentPage - 1}`}
                className="absolute left-0 w-1/2 h-full max-h-[800px]"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 0.7 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ transformOrigin: 'right center' }}
              >
                <PageContent isLeft={true} dimmed={true}>
                  {/* Previous page preview */}
                </PageContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Page */}
          <motion.div
            className="relative w-full max-w-4xl h-full max-h-[800px] z-20"
            drag="x"
            dragConstraints={{ left: -50, right: 50 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            whileDrag={{ 
              scale: 0.95,
              rotateY: dragDirection === 'left' ? 5 : dragDirection === 'right' ? -5 : 0 
            }}
            animate={{ 
              rotateY: isFlipping ? (currentPage > 0 ? -10 : 10) : 0,
              scale: isFlipping ? 0.95 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            <PageContent>
              {getCurrentPageContent()}
            </PageContent>
          </motion.div>

          {/* Right Page (Next) */}
          <AnimatePresence mode="wait">
            {currentPage < totalPages - 1 && (
              <motion.div
                key={`right-${currentPage + 1}`}
                className="absolute right-0 w-1/2 h-full max-h-[800px]"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 0.7 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ transformOrigin: 'left center' }}
              >
                <PageContent isRight={true} dimmed={true}>
                  {/* Next page preview */}
                </PageContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-4 bg-black/20 backdrop-blur-lg rounded-full px-6 py-3 border border-white/10">
          {/* Previous Page */}
          <motion.button
            onClick={prevPage}
            disabled={!canFlipPrev}
            className={cn(
              "p-3 rounded-full transition-all duration-200",
              canFlipPrev 
                ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg" 
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            )}
            whileHover={canFlipPrev ? { scale: 1.1 } : {}}
            whileTap={canFlipPrev ? { scale: 0.9 } : {}}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* Page Indicator */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-white/80 text-sm">
              {currentPage + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    i === currentPage ? "bg-wisdom-400" : "bg-white/30"
                  )}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => flipToPage(i)}
                />
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleAudio}
              className="p-3 rounded-full bg-wisdom-500 text-white hover:bg-wisdom-600 shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              onClick={toggleMute}
              className="p-2 rounded-full bg-soul-500 text-white hover:bg-soul-600 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Next Page */}
          <motion.button
            onClick={nextPage}
            disabled={!canFlipNext}
            className={cn(
              "p-3 rounded-full transition-all duration-200",
              canFlipNext 
                ? "bg-mystic-500 text-white hover:bg-mystic-600 shadow-lg" 
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            )}
            whileHover={canFlipNext ? { scale: 1.1 } : {}}
            whileTap={canFlipNext ? { scale: 0.9 } : {}}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Side Navigation Toggle */}
      <motion.button
        onClick={() => setShowNavigation(!showNavigation)}
        className="absolute top-8 right-8 z-30 p-3 rounded-full bg-black/20 backdrop-blur-lg text-white border border-white/10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {showNavigation ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </motion.button>

      {/* Side Navigation Panel */}
      <AnimatePresence>
        {showNavigation && (
          <NavigationPanel 
            story={story}
            currentPage={currentPage}
            onPageSelect={flipToPage}
            onClose={() => setShowNavigation(false)}
          />
        )}
      </AnimatePresence>

      {/* Audio Element */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  )
}

// Page Content Wrapper
function PageContent({ 
  children, 
  isLeft = false, 
  isRight = false, 
  dimmed = false 
}: { 
  children: React.ReactNode
  isLeft?: boolean
  isRight?: boolean
  dimmed?: boolean 
}) {
  return (
    <div className={cn(
      "w-full h-full bg-gradient-to-br from-white via-mystic-25 to-wisdom-25 rounded-2xl shadow-2xl border border-soul-200 overflow-hidden",
      dimmed && "opacity-50",
      isLeft && "transform scale-95",
      isRight && "transform scale-95"
    )}>
      <div className="p-8 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// Cover Page Component
function CoverPage({ story }: { story: StoryData }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center relative">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <Sparkles className="absolute top-10 left-10 w-8 h-8 text-mystic-500 animate-pulse" />
        <Heart className="absolute top-20 right-16 w-6 h-6 text-wisdom-500 animate-pulse delay-1000" />
        <Star className="absolute bottom-20 left-20 w-7 h-7 text-soul-500 animate-pulse delay-2000" />
        <BookOpen className="absolute bottom-16 right-12 w-9 h-9 text-mystic-500 animate-pulse delay-500" />
      </div>

      {/* Cover Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-5xl font-bold font-mystic text-transparent bg-clip-text bg-gradient-to-br from-mystic-600 to-wisdom-600 mb-4">
            {story.title}
          </h1>
          <p className="text-xl text-soul-600 font-medium">by {story.author}</p>
        </div>

        {story.coverImage && (
          <div className="mb-8">
            <img 
              src={story.coverImage} 
              alt={story.title}
              className="w-64 h-64 object-cover rounded-2xl shadow-xl mx-auto"
            />
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-center gap-6 text-sm text-soul-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{story.totalReadTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{story.chapters.length} chapters</span>
            </div>
          </div>

          <motion.div
            className="text-mystic-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ A SoulScribe Tale of Awakening ✨
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// Table of Contents Page
function TableOfContentsPage({ 
  story, 
  onChapterClick 
}: { 
  story: StoryData
  onChapterClick: (pageNumber: number) => void 
}) {
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold font-mystic text-mystic-700 mb-8 text-center">
          Table of Contents
        </h2>

        <div className="space-y-4">
          {/* Introduction */}
          <motion.div
            className="p-4 rounded-lg bg-wisdom-50 border border-wisdom-200 cursor-pointer hover:bg-wisdom-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-soul-800">Introduction</h3>
                <p className="text-sm text-soul-600">The journey begins...</p>
              </div>
              <div className="text-sm text-soul-500">2 min</div>
            </div>
          </motion.div>

          {/* Chapters */}
          {story.chapters.map((chapter, index) => (
            <motion.div
              key={chapter.number}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                chapter.isComplete 
                  ? "bg-mystic-50 border-mystic-200 hover:bg-mystic-100" 
                  : chapter.isGenerating
                  ? "bg-wisdom-50 border-wisdom-200 animate-pulse"
                  : "bg-soul-50 border-soul-200 hover:bg-soul-100"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChapterClick(index + 2)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-mystic-500">
                      {chapter.number}
                    </span>
                    <div>
                      <h3 className="font-semibold text-soul-800">{chapter.title}</h3>
                      {chapter.summary && (
                        <p className="text-sm text-soul-600 mt-1">{chapter.summary}</p>
                      )}
                    </div>
                  </div>
                  
                  {chapter.keyLessons && chapter.keyLessons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chapter.keyLessons.slice(0, 2).map((lesson, i) => (
                        <span key={i} className="text-xs bg-wisdom-200 text-wisdom-700 px-2 py-1 rounded-full">
                          {lesson}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {chapter.estimatedReadTime && (
                    <span className="text-sm text-soul-500">
                      {chapter.estimatedReadTime} min
                    </span>
                  )}
                  
                  {chapter.isGenerating && (
                    <Loader2 className="w-4 h-4 text-wisdom-500 animate-spin" />
                  )}
                  
                  {chapter.isComplete && (
                    <div className="w-3 h-3 bg-mystic-500 rounded-full" />
                  )}
                  
                  {chapter.audioUrl && (
                    <Volume2 className="w-4 h-4 text-mystic-500" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Learning Reflection */}
          <motion.div
            className="p-4 rounded-lg bg-soul-50 border border-soul-200 cursor-pointer hover:bg-soul-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChapterClick(story.chapters.length + 2)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-soul-800">What Did We Learn?</h3>
                <p className="text-sm text-soul-600">Final wisdom and reflection</p>
              </div>
              <div className="text-sm text-soul-500">3 min</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// Chapter Page Component
function ChapterPage({ 
  chapter, 
  chapterNumber, 
  onComplete 
}: { 
  chapter: Chapter
  chapterNumber: number
  onComplete: () => void 
}) {
  const [hasStartedReading, setHasStartedReading] = useState(false)

  useEffect(() => {
    if (!hasStartedReading) {
      setHasStartedReading(true)
      // Simulate reading completion after some time
      const timer = setTimeout(() => {
        onComplete()
      }, 30000) // 30 seconds for demo
      
      return () => clearTimeout(timer)
    }
  }, [hasStartedReading, onComplete])

  if (chapter?.isGenerating) {
    return <ChapterGeneratingState chapterNumber={chapterNumber} />
  }

  if (!chapter) {
    return <ChapterEmptyState chapterNumber={chapterNumber} />
  }

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="h-full flex flex-col"
      >
        {/* Chapter Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl font-bold text-mystic-500">
              {chapterNumber}
            </span>
            <div>
              <h2 className="text-2xl font-bold font-mystic text-soul-800">
                {chapter.title}
              </h2>
              {chapter.estimatedReadTime && (
                <p className="text-sm text-soul-500">
                  {chapter.estimatedReadTime} minute read
                </p>
              )}
            </div>
          </div>
          
          {chapter.audioUrl && (
            <div className="flex items-center gap-2 text-sm text-mystic-600">
              <Volume2 className="w-4 h-4" />
              <span>Audio narration available</span>
            </div>
          )}
        </div>

        {/* Chapter Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-lg max-w-none text-soul-700 leading-relaxed">
            {chapter.content.split('\n\n').map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="mb-4"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
          
          {/* Key Lessons */}
          {chapter.keyLessons && chapter.keyLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 p-6 bg-wisdom-50 rounded-xl border border-wisdom-200"
            >
              <h3 className="text-lg font-semibold text-wisdom-700 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Chapter Insights
              </h3>
              <ul className="space-y-2">
                {chapter.keyLessons.map((lesson, index) => (
                  <li key={index} className="text-soul-700 flex items-start gap-2">
                    <Star className="w-4 h-4 text-wisdom-500 mt-0.5 flex-shrink-0" />
                    {lesson}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Chapter Generating State
function ChapterGeneratingState({ chapterNumber }: { chapterNumber: number }) {
  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <Loader2 className="w-16 h-16 text-mystic-500 animate-spin mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-soul-800 mb-2">
            Crafting Chapter {chapterNumber}
          </h3>
          <p className="text-soul-600">
            SoulScribe is weaving wisdom into words...
          </p>
        </div>
        
        <motion.div
          className="flex justify-center gap-2"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-mystic-400 rounded-full"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

// Chapter Empty State
function ChapterEmptyState({ chapterNumber }: { chapterNumber: number }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-soul-500">
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Chapter {chapterNumber}</h3>
        <p>Waiting to be created...</p>
      </div>
    </div>
  )
}

// Reflection Page
function ReflectionPage({ story }: { story: StoryData }) {
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="h-full flex flex-col"
      >
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-mystic text-mystic-700">
            What Did We Learn?
          </h2>
          <p className="text-soul-600 mt-2">Reflection and Integration</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-lg max-w-none text-soul-700 leading-relaxed">
            {story.learningReflection ? (
              story.learningReflection.split('\n\n').map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.3 }}
                  className="mb-4"
                >
                  {paragraph}
                </motion.p>
              ))
            ) : (
              <div className="text-center text-soul-500">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>The final wisdom is being woven...</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Generation Progress Overlay
function GenerationProgressOverlay({ 
  progress, 
  chapters 
}: { 
  progress: StoryData['generationProgress']
  chapters: Chapter[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <Sparkles className="w-12 h-12 text-mystic-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-soul-800 mb-2">
            Your Story is Coming to Life!
          </h3>
          <p className="text-soul-600">{progress.currentStep}</p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 mb-6">
          {progress.completedSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="w-5 h-5 bg-mystic-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-soul-700">{step}</span>
            </motion.div>
          ))}
        </div>

        {/* Chapter Progress */}
        {chapters.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-soul-700 mb-3">Chapter Progress</h4>
            <div className="grid grid-cols-5 gap-2">
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-bold",
                    chapter.isComplete 
                      ? "bg-mystic-500 border-mystic-500 text-white"
                      : chapter.isGenerating
                      ? "bg-wisdom-200 border-wisdom-400 text-wisdom-700 animate-pulse"
                      : "bg-soul-100 border-soul-200 text-soul-500"
                  )}
                >
                  {chapter.number}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Remaining */}
        <div className="text-center text-sm text-soul-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Estimated time remaining: {Math.ceil(progress.estimatedTimeRemaining)} minutes
        </div>
      </motion.div>
    </motion.div>
  )
}

// Navigation Panel
function NavigationPanel({ 
  story, 
  currentPage, 
  onPageSelect, 
  onClose 
}: {
  story: StoryData
  currentPage: number
  onPageSelect: (page: number) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-lg shadow-2xl z-40 border-l border-soul-200"
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-soul-800">Navigation</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-soul-100 transition-colors"
          >
            <X className="w-5 h-5 text-soul-600" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Cover */}
          <button
            onClick={() => { onPageSelect(0); onClose() }}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-colors",
              currentPage === 0 ? "bg-mystic-100 border border-mystic-300" : "hover:bg-soul-50"
            )}
          >
            <div className="font-medium text-soul-800">Cover</div>
          </button>

          {/* TOC */}
          <button
            onClick={() => { onPageSelect(1); onClose() }}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-colors",
              currentPage === 1 ? "bg-mystic-100 border border-mystic-300" : "hover:bg-soul-50"
            )}
          >
            <div className="font-medium text-soul-800">Table of Contents</div>
          </button>

          {/* Chapters */}
          {story.chapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => { onPageSelect(index + 2); onClose() }}
              className={cn(
                "w-full p-3 rounded-lg text-left transition-colors",
                currentPage === index + 2 ? "bg-mystic-100 border border-mystic-300" : "hover:bg-soul-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-mystic-500 font-bold">{chapter.number}</span>
                <div>
                  <div className="font-medium text-soul-800 text-sm">{chapter.title}</div>
                  {chapter.isGenerating && (
                    <div className="text-xs text-wisdom-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Reflection */}
          <button
            onClick={() => { onPageSelect(story.chapters.length + 2); onClose() }}
            className={cn(
              "w-full p-3 rounded-lg text-left transition-colors",
              currentPage === story.chapters.length + 2 ? "bg-mystic-100 border border-mystic-300" : "hover:bg-soul-50"
            )}
          >
            <div className="font-medium text-soul-800">What Did We Learn?</div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}