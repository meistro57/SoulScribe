'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Plus, Play, Clock, Users, Heart, Star, 
  Settings, Download, Share2, Search, Filter, 
  Sparkles, Volume2, Eye, MoreHorizontal, Trash2,
  Calendar, TrendingUp, Award, Zap, Mic
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * User Dashboard and Story Gallery
 * 
 * The beautiful homepage where users manage their SoulScribe story collection.
 * Features story cards, progress tracking, and quick access to creation tools.
 * The AI Whisperer's personal sanctuary! 🏠✨
 */

export interface UserStory {
  id: string
  title: string
  description?: string
  coverImage?: string
  genre: string
  targetAge: string
  status: 'planning' | 'writing' | 'reviewing' | 'completed'
  progress: number
  totalChapters: number
  completedChapters: number
  estimatedReadTime: number
  createdAt: Date
  updatedAt: Date
  
  // Audio info
  hasAudio: boolean
  audioProgress: number
  
  // Engagement stats
  timesRead: number
  averageRating?: number
  isFavorite: boolean
  
  // Quick preview
  firstChapterPreview?: string
  keyThemes: string[]
  learningObjective?: string
}

export interface DashboardStats {
  totalStories: number
  completedStories: number
  totalReadTime: number
  favoriteGenre: string
  streakDays: number
  storiesThisMonth: number
}

interface UserDashboardProps {
  userId: string
  onCreateNewStory?: () => void
  onOpenStory?: (storyId: string) => void
  onDeleteStory?: (storyId: string) => void
}

export function UserDashboard({ 
  userId, 
  onCreateNewStory, 
  onOpenStory,
  onDeleteStory 
}: UserDashboardProps) {
  const [stories, setStories] = useState<UserStory[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGenre, setFilterGenre] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      // This would fetch from your API
      const [storiesData, statsData] = await Promise.all([
        fetchUserStories(userId),
        fetchUserStats(userId)
      ])
      
      setStories(storiesData)
      setStats(statsData)
      setShowWelcome(storiesData.length === 0)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data functions (replace with real API calls)
  const fetchUserStories = async (userId: string): Promise<UserStory[]> => {
    // Mock data for demonstration
    return [
      {
        id: '1',
        title: 'The Whispering Woods',
        description: 'A young seeker discovers ancient wisdom in a magical forest',
        genre: 'mystical-fable',
        targetAge: 'all_ages',
        status: 'completed',
        progress: 100,
        totalChapters: 8,
        completedChapters: 8,
        estimatedReadTime: 45,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        hasAudio: true,
        audioProgress: 100,
        timesRead: 12,
        averageRating: 4.8,
        isFavorite: true,
        keyThemes: ['Self-Discovery', 'Nature Wisdom', 'Inner Peace'],
        learningObjective: 'Finding stillness in a chaotic world'
      },
      {
        id: '2',
        title: 'Luna\'s Courage Journey',
        description: 'A timid child learns to embrace her inner strength',
        genre: 'spiritual-adventure',
        targetAge: 'child',
        status: 'writing',
        progress: 65,
        totalChapters: 6,
        completedChapters: 4,
        estimatedReadTime: 30,
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-25'),
        hasAudio: true,
        audioProgress: 40,
        timesRead: 3,
        isFavorite: false,
        keyThemes: ['Courage', 'Self-Confidence', 'Growth'],
        learningObjective: 'Courage grows from within'
      },
      {
        id: '3',
        title: 'The Digital Sage',
        description: 'Modern wisdom for navigating technology mindfully',
        genre: 'modern-parable',
        targetAge: 'adult',
        status: 'planning',
        progress: 15,
        totalChapters: 10,
        completedChapters: 0,
        estimatedReadTime: 60,
        createdAt: new Date('2024-01-28'),
        updatedAt: new Date('2024-01-28'),
        hasAudio: false,
        audioProgress: 0,
        timesRead: 0,
        isFavorite: false,
        keyThemes: ['Mindfulness', 'Technology', 'Balance'],
        learningObjective: 'Finding presence in a digital world'
      }
    ]
  }

  const fetchUserStats = async (userId: string): Promise<DashboardStats> => {
    return {
      totalStories: 3,
      completedStories: 1,
      totalReadTime: 135,
      favoriteGenre: 'Mystical Fable',
      streakDays: 7,
      storiesThisMonth: 2
    }
  }

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.keyThemes.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || story.status === filterStatus
    const matchesGenre = filterGenre === 'all' || story.genre === filterGenre
    
    return matchesSearch && matchesStatus && matchesGenre
  })

  const genres = Array.from(new Set(stories.map(s => s.genre)))
  const statusOptions = ['all', 'planning', 'writing', 'reviewing', 'completed']

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (showWelcome) {
    return <WelcomeScreen onCreateFirst={onCreateNewStory} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soul-50 via-mystic-25 to-wisdom-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-soul-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-mystic-500" />
                <h1 className="text-2xl font-bold font-mystic text-soul-800">
                  SoulScribe Studio
                </h1>
              </div>
              
              {stats && (
                <div className="hidden md:flex items-center gap-6 text-sm text-soul-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{stats.totalStories} stories</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>{stats.streakDays} day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{stats.totalReadTime} min created</span>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              onClick={onCreateNewStory}
              className="flex items-center gap-2 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Create New Story
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <StatsCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Total Stories"
              value={stats.totalStories}
              subtitle={`${stats.completedStories} completed`}
              color="mystic"
            />
            <StatsCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="This Month"
              value={stats.storiesThisMonth}
              subtitle="stories created"
              color="wisdom"
            />
            <StatsCard
              icon={<Award className="w-6 h-6" />}
              title="Favorite Genre"
              value={stats.favoriteGenre}
              subtitle="most written"
              color="soul"
              isText
            />
            <StatsCard
              icon={<Zap className="w-6 h-6" />}
              title="Streak"
              value={stats.streakDays}
              subtitle="days of creativity"
              color="mystic"
            />
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl border border-soul-200 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-soul-400" />
              <input
                type="text"
                placeholder="Search stories, themes, or characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200 bg-white/80"
              />
            </div>

            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-soul-200 rounded-lg bg-white/80 text-soul-700"
              >
                <option value="all">All Status</option>
                {statusOptions.slice(1).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="px-3 py-2 border border-soul-200 rounded-lg bg-white/80 text-soul-700"
              >
                <option value="all">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>

              <div className="flex items-center border border-soul-200 rounded-lg bg-white/80">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid' ? "bg-mystic-100 text-mystic-700" : "text-soul-500"
                  )}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="bg-current rounded-sm" />
                    ))}
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list' ? "bg-mystic-100 text-mystic-700" : "text-soul-500"
                  )}
                >
                  <div className="w-4 h-4 flex flex-col gap-1">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="bg-current rounded-sm h-0.5" />
                    ))}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stories Grid/List */}
        <AnimatePresence mode="wait">
          {filteredStories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <BookOpen className="w-16 h-16 text-soul-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-soul-600 mb-2">No stories found</h3>
              <p className="text-soul-500 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterStatus('all')
                  setFilterGenre('all')
                }}
                className="px-4 py-2 bg-mystic-500 text-white rounded-lg hover:bg-mystic-600 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}
            >
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {viewMode === 'grid' ? (
                    <StoryCard 
                      story={story} 
                      onOpen={() => onOpenStory?.(story.id)}
                      onDelete={() => onDeleteStory?.(story.id)}
                    />
                  ) : (
                    <StoryListItem 
                      story={story} 
                      onOpen={() => onOpenStory?.(story.id)}
                      onDelete={() => onDeleteStory?.(story.id)}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color, 
  isText = false 
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: 'mystic' | 'wisdom' | 'soul'
  isText?: boolean
}) {
  const colorClasses = {
    mystic: 'bg-mystic-50 border-mystic-200 text-mystic-700',
    wisdom: 'bg-wisdom-50 border-wisdom-200 text-wisdom-700',
    soul: 'bg-soul-50 border-soul-200 text-soul-700'
  }

  return (
    <div className={cn("p-6 rounded-xl border", colorClasses[color])}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className={cn("text-2xl font-bold mb-1", isText ? "text-base" : "")}>
        {value}
      </div>
      <p className="text-sm opacity-80">{subtitle}</p>
    </div>
  )
}

// Story Card Component
function StoryCard({ 
  story, 
  onOpen, 
  onDelete 
}: { 
  story: UserStory
  onOpen: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const statusColors = {
    planning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    writing: 'bg-blue-100 text-blue-700 border-blue-200',
    reviewing: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-700 border-green-200'
  }

  const statusIcons = {
    planning: '📝',
    writing: '✍️',
    reviewing: '🔍',
    completed: '✅'
  }

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-soul-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
      whileHover={{ y: -4 }}
    >
      {/* Cover Image or Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-mystic-100 to-wisdom-100 overflow-hidden">
        {story.coverImage ? (
          <img 
            src={story.coverImage} 
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-mystic-400" />
          </div>
        )}
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <motion.button
              onClick={onOpen}
              className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Eye className="w-5 h-5 text-soul-700" />
            </motion.button>
            
            {story.hasAudio && (
              <motion.button
                className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Play className="w-5 h-5 text-mystic-700" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border",
            statusColors[story.status]
          )}>
            {statusIcons[story.status]} {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
          </span>
        </div>

        {/* Favorite Heart */}
        {story.isFavorite && (
          <div className="absolute top-3 right-3">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute bottom-3 right-3 relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-soul-700" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-soul-200 py-2 min-w-[120px] z-10"
              >
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-soul-50 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-soul-50 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={onDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-soul-800 mb-1">{story.title}</h3>
          {story.description && (
            <p className="text-sm text-soul-600 line-clamp-2">{story.description}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-soul-600 mb-2">
            <span>Progress</span>
            <span>{story.progress}%</span>
          </div>
          <div className="w-full bg-soul-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-mystic-500 to-wisdom-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${story.progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-soul-600 mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {story.completedChapters}/{story.totalChapters}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {story.estimatedReadTime}m
            </span>
            {story.hasAudio && (
              <span className="flex items-center gap-1">
                <Volume2 className="w-4 h-4" />
                Audio
              </span>
            )}
          </div>
        </div>

        {/* Themes */}
        <div className="flex flex-wrap gap-1 mb-4">
          {story.keyThemes.slice(0, 3).map((theme, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-mystic-100 text-mystic-700 rounded-full text-xs"
            >
              {theme}
            </span>
          ))}
          {story.keyThemes.length > 3 && (
            <span className="px-2 py-1 bg-soul-100 text-soul-600 rounded-full text-xs">
              +{story.keyThemes.length - 3}
            </span>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          onClick={onOpen}
          className="w-full py-3 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {story.status === 'completed' ? 'Read Story' : 'Continue Writing'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// Story List Item Component
function StoryListItem({ 
  story, 
  onOpen, 
  onDelete 
}: { 
  story: UserStory
  onOpen: () => void
  onDelete: () => void
}) {
  const statusColors = {
    planning: 'bg-yellow-100 text-yellow-700',
    writing: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700'
  }

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-soul-200 p-6 hover:shadow-lg transition-all duration-200"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-soul-800">{story.title}</h3>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[story.status])}>
              {story.status}
            </span>
            {story.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
          </div>
          
          {story.description && (
            <p className="text-soul-600 mb-3 line-clamp-1">{story.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-soul-500">
            <span>{story.completedChapters}/{story.totalChapters} chapters</span>
            <span>{story.estimatedReadTime} min read</span>
            <span>Updated {story.updatedAt.toLocaleDateString()}</span>
            {story.hasAudio && (
              <span className="flex items-center gap-1 text-mystic-600">
                <Mic className="w-4 h-4" />
                Audio available
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-mystic-600">{story.progress}%</div>
            <div className="text-xs text-soul-500">complete</div>
          </div>
          
          <motion.button
            onClick={onOpen}
            className="px-6 py-3 bg-mystic-500 text-white rounded-lg font-semibold hover:bg-mystic-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Open
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Welcome Screen for new users
function WelcomeScreen({ onCreateFirst }: { onCreateFirst?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soul-50 via-mystic-25 to-wisdom-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto px-6"
      >
        <div className="mb-8">
          <Sparkles className="w-20 h-20 text-mystic-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold font-mystic text-soul-800 mb-4">
            Welcome to SoulScribe
          </h1>
          <p className="text-xl text-soul-600 leading-relaxed">
            Transform your imagination into stories that awaken hearts and inspire souls. 
            Every tale you create becomes a journey of discovery and wisdom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-mystic-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-mystic-600" />
            </div>
            <h3 className="font-semibold text-soul-800 mb-2">AI-Powered Stories</h3>
            <p className="text-sm text-soul-600">Let our AI agents help craft meaningful tales</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-wisdom-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-wisdom-600" />
            </div>
            <h3 className="font-semibold text-soul-800 mb-2">Voice Narration</h3>
            <p className="text-sm text-soul-600">Every story comes alive with character voices</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-soul-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-soul-600" />
            </div>
            <h3 className="font-semibold text-soul-800 mb-2">Spiritual Wisdom</h3>
            <p className="text-sm text-soul-600">Stories that teach, heal, and inspire growth</p>
          </div>
        </div>

        <motion.button
          onClick={onCreateFirst}
          className="px-8 py-4 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Your First Story ✨
        </motion.button>
      </motion.div>
    </div>
  )
}

// Dashboard Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soul-50 via-mystic-25 to-wisdom-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="h-16 bg-white/60 rounded-xl mb-8" />
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white/60 rounded-xl" />
            ))}
          </div>
          
          {/* Stories Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-96 bg-white/60 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}