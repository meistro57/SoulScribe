'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, FileText, BookOpen, Headphones, Image, 
  Settings, Palette, Type, Volume2, Eye, Share2,
  Loader2, CheckCircle, AlertCircle, Sparkles, 
  File, Music, Video, Zap, Crown, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'

/**
 * Story Export Studio - The AI Whisperer's Publishing House
 * 
 * This comprehensive export system allows users to transform their SoulScribe
 * stories into beautiful, shareable formats. From elegant PDFs to immersive
 * audiobooks, every story becomes a treasured artifact! 📚✨
 */

export interface ExportFormat {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'document' | 'ebook' | 'audio' | 'interactive' | 'social'
  
  features: {
    includeAudio: boolean
    customStyling: boolean
    interactiveElements: boolean
    socialSharing: boolean
  }
  
  options: {
    [key: string]: {
      label: string
      type: 'select' | 'checkbox' | 'color' | 'number' | 'text'
      default: any
      options?: string[] | number[]
    }
  }
  
  requirements: string[]
  estimatedSize: string
  processingTime: string
}

export interface ExportJob {
  id: string
  format: ExportFormat
  story: any
  options: Record<string, any>
  status: 'preparing' | 'processing' | 'complete' | 'error'
  progress: number
  startTime: Date
  estimatedCompletion?: Date
  downloadUrl?: string
  errorMessage?: string
  fileSize?: string
}

interface StoryExportStudioProps {
  story: any
  voiceMap?: any
  onExportComplete?: (job: ExportJob) => void
  onExportError?: (error: string) => void
}

export function StoryExportStudio({
  story,
  voiceMap,
  onExportComplete,
  onExportError
}: StoryExportStudioProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  const [exportOptions, setExportOptions] = useState<Record<string, any>>({})
  const [activeJobs, setActiveJobs] = useState<Map<string, ExportJob>>(new Map())
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState<string>('')

  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

  // Export format definitions
  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf_elegant',
      name: 'Elegant PDF',
      description: 'Beautiful, print-ready PDF with custom typography and illustrations',
      icon: <FileText className="w-6 h-6" />,
      category: 'document',
      features: {
        includeAudio: false,
        customStyling: true,
        interactiveElements: false,
        socialSharing: true
      },
      options: {
        pageSize: {
          label: 'Page Size',
          type: 'select',
          default: 'A4',
          options: ['A4', 'A5', 'Letter', '6x9']
        },
        fontSize: {
          label: 'Font Size',
          type: 'number',
          default: 12,
          options: [10, 11, 12, 14, 16, 18]
        },
        fontFamily: {
          label: 'Font Family',
          type: 'select',
          default: 'serif',
          options: ['serif', 'sans-serif', 'fantasy', 'monospace']
        },
        colorTheme: {
          label: 'Color Theme',
          type: 'select',
          default: 'classic',
          options: ['classic', 'mystical', 'warm', 'cool', 'monochrome']
        },
        includeCover: {
          label: 'Include Cover Page',
          type: 'checkbox',
          default: true
        },
        includeTableOfContents: {
          label: 'Include Table of Contents',
          type: 'checkbox',
          default: true
        },
        chapterBreaks: {
          label: 'Chapter Page Breaks',
          type: 'checkbox',
          default: true
        },
        margins: {
          label: 'Page Margins',
          type: 'select',
          default: 'normal',
          options: ['narrow', 'normal', 'wide']
        }
      },
      requirements: ['story content', 'chapter structure'],
      estimatedSize: '2-5 MB',
      processingTime: '30-60 seconds'
    },
    {
      id: 'epub_reader',
      name: 'EPUB E-book',
      description: 'Compatible with all major e-readers and reading apps',
      icon: <BookOpen className="w-6 h-6" />,
      category: 'ebook',
      features: {
        includeAudio: false,
        customStyling: true,
        interactiveElements: false,
        socialSharing: true
      },
      options: {
        includeMetadata: {
          label: 'Include Metadata',
          type: 'checkbox',
          default: true
        },
        chapterNavigation: {
          label: 'Chapter Navigation',
          type: 'checkbox',
          default: true
        },
        customCSS: {
          label: 'Custom Styling',
          type: 'checkbox',
          default: true
        },
        embedFonts: {
          label: 'Embed Custom Fonts',
          type: 'checkbox',
          default: false
        }
      },
      requirements: ['story content', 'chapter structure'],
      estimatedSize: '1-3 MB',
      processingTime: '20-40 seconds'
    },
    {
      id: 'audiobook_complete',
      name: 'Complete Audiobook',
      description: 'Full narrated audiobook with chapter markers and metadata',
      icon: <Headphones className="w-6 h-6" />,
      category: 'audio',
      features: {
        includeAudio: true,
        customStyling: false,
        interactiveElements: false,
        socialSharing: true
      },
      options: {
        audioQuality: {
          label: 'Audio Quality',
          type: 'select',
          default: 'high',
          options: ['standard', 'high', 'studio']
        },
        includeMusic: {
          label: 'Background Music',
          type: 'checkbox',
          default: false
        },
        chapterMarkers: {
          label: 'Chapter Markers',
          type: 'checkbox',
          default: true
        },
        normalizeAudio: {
          label: 'Normalize Audio Levels',
          type: 'checkbox',
          default: true
        },
        compressionLevel: {
          label: 'Compression',
          type: 'select',
          default: 'balanced',
          options: ['minimal', 'balanced', 'maximum']
        }
      },
      requirements: ['story content', 'voice synthesis', 'audio generation'],
      estimatedSize: '50-200 MB',
      processingTime: '5-15 minutes'
    },
    {
      id: 'interactive_web',
      name: 'Interactive Web Story',
      description: 'Immersive web experience with animations and interactivity',
      icon: <Zap className="w-6 h-6" />,
      category: 'interactive',
      features: {
        includeAudio: true,
        customStyling: true,
        interactiveElements: true,
        socialSharing: true
      },
      options: {
        animationLevel: {
          label: 'Animation Level',
          type: 'select',
          default: 'moderate',
          options: ['minimal', 'moderate', 'rich', 'cinematic']
        },
        includeAudio: {
          label: 'Include Audio Narration',
          type: 'checkbox',
          default: true
        },
        autoplay: {
          label: 'Auto-play Audio',
          type: 'checkbox',
          default: false
        },
        backgroundEffects: {
          label: 'Background Effects',
          type: 'checkbox',
          default: true
        },
        mobileOptimized: {
          label: 'Mobile Optimized',
          type: 'checkbox',
          default: true
        }
      },
      requirements: ['story content', 'web hosting capability'],
      estimatedSize: '10-50 MB',
      processingTime: '2-5 minutes'
    },
    {
      id: 'social_carousel',
      name: 'Social Media Carousel',
      description: 'Story snippets formatted for Instagram, LinkedIn, and Facebook',
      icon: <Share2 className="w-6 h-6" />,
      category: 'social',
      features: {
        includeAudio: false,
        customStyling: true,
        interactiveElements: false,
        socialSharing: true
      },
      options: {
        platform: {
          label: 'Target Platform',
          type: 'select',
          default: 'instagram',
          options: ['instagram', 'linkedin', 'facebook', 'twitter', 'all']
        },
        slideCount: {
          label: 'Number of Slides',
          type: 'number',
          default: 10,
          options: [5, 10, 15, 20]
        },
        includeQuotes: {
          label: 'Include Key Quotes',
          type: 'checkbox',
          default: true
        },
        brandingLevel: {
          label: 'SoulScribe Branding',
          type: 'select',
          default: 'subtle',
          options: ['none', 'subtle', 'moderate', 'prominent']
        }
      },
      requirements: ['story content', 'key themes'],
      estimatedSize: '5-15 MB',
      processingTime: '1-3 minutes'
    },
    {
      id: 'podcast_episode',
      name: 'Podcast Episode',
      description: 'Professionally formatted podcast with intro, outro, and chapters',
      icon: <Music className="w-6 h-6" />,
      category: 'audio',
      features: {
        includeAudio: true,
        customStyling: false,
        interactiveElements: false,
        socialSharing: true
      },
      options: {
        includeIntro: {
          label: 'Include Intro Music',
          type: 'checkbox',
          default: true
        },
        includeOutro: {
          label: 'Include Outro',
          type: 'checkbox',
          default: true
        },
        episodeMetadata: {
          label: 'Episode Metadata',
          type: 'checkbox',
          default: true
        },
        podcastFormat: {
          label: 'Podcast Format',
          type: 'select',
          default: 'narrative',
          options: ['narrative', 'storytelling', 'educational', 'meditative']
        }
      },
      requirements: ['story content', 'voice synthesis'],
      estimatedSize: '30-100 MB',
      processingTime: '3-8 minutes'
    }
  ]

  const startExport = async () => {
    if (!selectedFormat) return

    const jobId = `export_${Date.now()}`
    const job: ExportJob = {
      id: jobId,
      format: selectedFormat,
      story,
      options: exportOptions,
      status: 'preparing',
      progress: 0,
      startTime: new Date()
    }

    setActiveJobs(prev => new Map(prev).set(jobId, job))

    try {
      await processExport(job)
    } catch (error) {
      console.error('Export failed:', error)
      setActiveJobs(prev => {
        const updated = new Map(prev)
        const currentJob = updated.get(jobId)
        if (currentJob) {
          updated.set(jobId, {
            ...currentJob,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        return updated
      })
      onExportError?.(error instanceof Error ? error.message : 'Export failed')
    }
  }

  const processExport = async (job: ExportJob) => {
    const updateProgress = (progress: number, status?: ExportJob['status']) => {
      setActiveJobs(prev => {
        const updated = new Map(prev)
        const currentJob = updated.get(job.id)
        if (currentJob) {
          updated.set(job.id, {
            ...currentJob,
            progress,
            status: status || currentJob.status,
            estimatedCompletion: new Date(Date.now() + (100 - progress) * 1000)
          })
        }
        return updated
      })
    }

    updateProgress(10, 'processing')

    switch (job.format.id) {
      case 'pdf_elegant':
        await generateElegantPDF(job, updateProgress)
        break
      case 'epub_reader':
        await generateEPUB(job, updateProgress)
        break
      case 'audiobook_complete':
        await generateAudiobook(job, updateProgress)
        break
      case 'interactive_web':
        await generateInteractiveWeb(job, updateProgress)
        break
      case 'social_carousel':
        await generateSocialCarousel(job, updateProgress)
        break
      case 'podcast_episode':
        await generatePodcastEpisode(job, updateProgress)
        break
      default:
        throw new Error('Unsupported export format')
    }

    updateProgress(100, 'complete')
    onExportComplete?.(job)
  }

  const generateElegantPDF = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(20)
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: job.options.pageSize || 'a4'
    })

    const margin = getMarginSize(job.options.margins)
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const textWidth = pageWidth - (margin * 2)

    // Set font
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(job.options.fontSize || 12)

    updateProgress(30)

    // Cover page
    if (job.options.includeCover) {
      pdf.setFontSize(24)
      pdf.text(job.story.title, pageWidth / 2, 60, { align: 'center' })
      
      pdf.setFontSize(16)
      pdf.text(`by ${job.story.author || 'SoulScribe Author'}`, pageWidth / 2, 80, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text('Created with SoulScribe', pageWidth / 2, pageHeight - 30, { align: 'center' })
      
      pdf.addPage()
    }

    updateProgress(40)

    // Table of contents
    if (job.options.includeTableOfContents && job.story.chapters) {
      pdf.setFontSize(18)
      pdf.text('Table of Contents', margin, 30)
      
      let yPos = 50
      pdf.setFontSize(12)
      
      job.story.chapters.forEach((chapter: any, index: number) => {
        pdf.text(`Chapter ${index + 1}: ${chapter.title}`, margin, yPos)
        yPos += 10
      })
      
      pdf.addPage()
    }

    updateProgress(50)

    // Story content
    if (job.story.chapters) {
      for (let i = 0; i < job.story.chapters.length; i++) {
        const chapter = job.story.chapters[i]
        
        if (job.options.chapterBreaks && i > 0) {
          pdf.addPage()
        }
        
        // Chapter title
        pdf.setFontSize(16)
        pdf.text(`Chapter ${i + 1}: ${chapter.title}`, margin, 30)
        
        // Chapter content
        pdf.setFontSize(job.options.fontSize || 12)
        const lines = pdf.splitTextToSize(chapter.content, textWidth)
        pdf.text(lines, margin, 50)
        
        updateProgress(50 + (i / job.story.chapters.length) * 40)
      }
    }

    updateProgress(90)

    // Generate blob and download URL
    const pdfBlob = pdf.output('blob')
    const downloadUrl = URL.createObjectURL(pdfBlob)
    
    setActiveJobs(prev => {
      const updated = new Map(prev)
      const currentJob = updated.get(job.id)
      if (currentJob) {
        updated.set(job.id, {
          ...currentJob,
          downloadUrl,
          fileSize: formatFileSize(pdfBlob.size)
        })
      }
      return updated
    })

    updateProgress(100)
  }

  const generateEPUB = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(20)
    
    // EPUB generation would use a library like epub-gen
    // For now, simulate the process
    await simulateProcessing(job, updateProgress, 'epub')
  }

  const generateAudiobook = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(10)
    
    // This would combine all chapter audio files into a single audiobook
    // with proper metadata and chapter markers
    
    if (!job.story.chapters) {
      throw new Error('No chapters found for audiobook generation')
    }

    const audioSegments = []
    
    for (let i = 0; i < job.story.chapters.length; i++) {
      const chapter = job.story.chapters[i]
      
      // Generate or retrieve chapter audio
      if (chapter.audioUrl) {
        audioSegments.push(chapter.audioUrl)
      } else {
        // Generate audio for this chapter
        const audioUrl = await generateChapterAudio(chapter, job.options)
        audioSegments.push(audioUrl)
      }
      
      updateProgress(20 + (i / job.story.chapters.length) * 60)
    }

    // Combine audio segments
    updateProgress(80)
    const combinedAudioUrl = await combineAudioSegments(audioSegments, job.options)
    
    setActiveJobs(prev => {
      const updated = new Map(prev)
      const currentJob = updated.get(job.id)
      if (currentJob) {
        updated.set(job.id, {
          ...currentJob,
          downloadUrl: combinedAudioUrl,
          fileSize: '~150 MB' // Estimated
        })
      }
      return updated
    })

    updateProgress(100)
  }

  const generateInteractiveWeb = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(20)
    
    // Generate HTML/CSS/JS for interactive story
    await simulateProcessing(job, updateProgress, 'zip')
  }

  const generateSocialCarousel = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(20)
    
    // Generate social media images
    await simulateProcessing(job, updateProgress, 'zip')
  }

  const generatePodcastEpisode = async (job: ExportJob, updateProgress: Function) => {
    updateProgress(20)
    
    // Generate podcast-formatted audio with intro/outro
    await simulateProcessing(job, updateProgress, 'mp3')
  }

  const simulateProcessing = async (job: ExportJob, updateProgress: Function, fileType: string) => {
    // Simulate processing time
    for (let i = 30; i <= 90; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      updateProgress(i)
    }
    
    // Create mock download URL
    const mockUrl = `#${job.format.id}_${Date.now()}.${fileType}`
    
    setActiveJobs(prev => {
      const updated = new Map(prev)
      const currentJob = updated.get(job.id)
      if (currentJob) {
        updated.set(job.id, {
          ...currentJob,
          downloadUrl: mockUrl,
          fileSize: job.format.estimatedSize
        })
      }
      return updated
    })
  }

  const generateChapterAudio = async (chapter: any, options: any): Promise<string> => {
    // This would call the voice synthesis API
    const response = await fetch('/api/generate-chapter-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: chapter.content,
        title: chapter.title,
        options
      })
    })
    
    const result = await response.json()
    return result.audioUrl
  }

  const combineAudioSegments = async (audioUrls: string[], options: any): Promise<string> => {
    // This would use FFmpeg to combine audio files
    const response = await fetch('/api/combine-audiobook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioUrls,
        options
      })
    })
    
    const result = await response.json()
    return result.downloadUrl
  }

  const getMarginSize = (marginType: string): number => {
    switch (marginType) {
      case 'narrow': return 15
      case 'wide': return 30
      default: return 20
    }
  }

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const downloadFile = (job: ExportJob) => {
    if (job.downloadUrl && downloadLinkRef.current) {
      downloadLinkRef.current.href = job.downloadUrl
      downloadLinkRef.current.download = `${job.story.title}_${job.format.name}.${getFileExtension(job.format.id)}`
      downloadLinkRef.current.click()
    }
  }

  const getFileExtension = (formatId: string): string => {
    const extensions: Record<string, string> = {
      'pdf_elegant': 'pdf',
      'epub_reader': 'epub',
      'audiobook_complete': 'mp3',
      'interactive_web': 'zip',
      'social_carousel': 'zip',
      'podcast_episode': 'mp3'
    }
    return extensions[formatId] || 'zip'
  }

  const generatePreview = async () => {
    if (!selectedFormat) return
    
    setShowPreview(true)
    
    // Generate preview content based on format
    let preview = ''
    
    switch (selectedFormat.id) {
      case 'pdf_elegant':
        preview = generatePDFPreview()
        break
      case 'epub_reader':
        preview = generateEPUBPreview()
        break
      case 'audiobook_complete':
        preview = generateAudiobookPreview()
        break
      default:
        preview = `Preview for ${selectedFormat.name} format`
    }
    
    setPreviewContent(preview)
  }

  const generatePDFPreview = (): string => {
    return `
# ${story.title}
*by ${story.author || 'SoulScribe Author'}*

## Chapter 1: ${story.chapters?.[0]?.title || 'Introduction'}

${story.chapters?.[0]?.content?.substring(0, 500) || 'Story content preview...'}...

---
*This is a preview of how your PDF export will look with the selected options.*
    `.trim()
  }

  const generateEPUBPreview = (): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${story.title}</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 2rem; }
    h1 { color: #6366f1; border-bottom: 2px solid #e5e7eb; }
    h2 { color: #4f46e5; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>${story.title}</h1>
  <p><em>by ${story.author || 'SoulScribe Author'}</em></p>
  
  <h2>Chapter 1: ${story.chapters?.[0]?.title || 'Introduction'}</h2>
  <p>${story.chapters?.[0]?.content?.substring(0, 300) || 'Story content preview...'}...</p>
</body>
</html>
    `.trim()
  }

  const generateAudiobookPreview = (): string => {
    return `
🎧 Audiobook Preview

Title: ${story.title}
Author: ${story.author || 'SoulScribe Author'}
Duration: ~${Math.ceil((story.chapters?.length || 1) * 15)} minutes
Chapters: ${story.chapters?.length || 0}

Chapter 1: ${story.chapters?.[0]?.title || 'Introduction'}
Voice: ${voiceMap?.narratorVoice?.name || 'Default Narrator'}
Preview: "${story.chapters?.[0]?.content?.substring(0, 200) || 'Story content preview...'}..."

Quality Settings:
• Audio Quality: ${exportOptions.audioQuality || 'High'}
• Chapter Markers: ${exportOptions.chapterMarkers ? 'Enabled' : 'Disabled'}
• Background Music: ${exportOptions.includeMusic ? 'Enabled' : 'Disabled'}
    `.trim()
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
          <Gift className="w-8 h-8 text-mystic-500" />
          <h1 className="text-3xl font-bold font-mystic text-soul-800">
            Story Export Studio
          </h1>
          <Sparkles className="w-6 h-6 text-wisdom-500" />
        </motion.div>
        <p className="text-soul-600 max-w-2xl mx-auto">
          Transform your SoulScribe story into beautiful, shareable formats. 
          From elegant PDFs to immersive audiobooks - your story, your way!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Format Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-soul-800 mb-4">Choose Export Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map((format) => (
                <motion.div
                  key={format.id}
                  onClick={() => {
                    setSelectedFormat(format)
                    setExportOptions(Object.fromEntries(
                      Object.entries(format.options).map(([key, option]) => [key, option.default])
                    ))
                  }}
                  className={cn(
                    "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg",
                    selectedFormat?.id === format.id
                      ? "border-mystic-500 bg-mystic-50 shadow-lg"
                      : "border-soul-200 hover:border-mystic-300"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedFormat?.id === format.id ? "bg-mystic-500 text-white" : "bg-soul-100 text-soul-600"
                    )}>
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-soul-800 mb-1">{format.name}</h3>
                      <p className="text-sm text-soul-600 mb-3">{format.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {format.features.includeAudio && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Audio</span>
                        )}
                        {format.features.customStyling && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Styling</span>
                        )}
                        {format.features.interactiveElements && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Interactive</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-soul-500">
                        <div>Size: {format.estimatedSize}</div>
                        <div>Time: {format.processingTime}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Format Options */}
          {selectedFormat && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-soul-200 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-soul-800 mb-4">Export Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedFormat.options).map(([key, option]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-soul-700 mb-2">
                      {option.label}
                    </label>
                    
                    {option.type === 'select' && (
                      <select
                        value={exportOptions[key] || option.default}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {typeof opt === 'string' ? opt.replace('_', ' ').toUpperCase() : opt}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {option.type === 'checkbox' && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportOptions[key] || option.default}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="rounded border-soul-300 text-mystic-500 focus:ring-mystic-500"
                        />
                        <span className="text-sm text-soul-600">Enable this option</span>
                      </label>
                    )}
                    
                    {option.type === 'number' && (
                      <select
                        value={exportOptions[key] || option.default}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-soul-200 rounded-lg focus:border-mystic-500 focus:ring-2 focus:ring-mystic-200"
                      >
                        {option.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={generatePreview}
                  className="px-4 py-2 border border-soul-300 text-soul-700 rounded-lg hover:bg-soul-50 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                
                <motion.button
                  onClick={startExport}
                  disabled={activeJobs.size > 0}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-mystic-500 to-wisdom-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Export {selectedFormat.name}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Export Queue & Status */}
        <div className="space-y-6">
          <div className="bg-white border border-soul-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-soul-800 mb-4">Export Queue</h3>
            
            {activeJobs.size === 0 ? (
              <div className="text-center py-8 text-soul-500">
                <Download className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active exports</p>
                <p className="text-sm">Select a format to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(activeJobs.values()).map((job) => (
                  <ExportJobCard
                    key={job.id}
                    job={job}
                    onDownload={() => downloadFile(job)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Story Info */}
          <div className="bg-gradient-to-br from-mystic-50 to-wisdom-50 border border-soul-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-soul-800 mb-4">Story Information</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-soul-700">Title:</span>
                <span className="ml-2 text-soul-600">{story.title}</span>
              </div>
              <div>
                <span className="font-medium text-soul-700">Author:</span>
                <span className="ml-2 text-soul-600">{story.author || 'SoulScribe Author'}</span>
              </div>
              <div>
                <span className="font-medium text-soul-700">Chapters:</span>
                <span className="ml-2 text-soul-600">{story.chapters?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-soul-700">Word Count:</span>
                <span className="ml-2 text-soul-600">
                  {story.chapters?.reduce((sum: number, c: any) => sum + (c.content?.split(' ').length || 0), 0) || 0}
                </span>
              </div>
              <div>
                <span className="font-medium text-soul-700">Audio Available:</span>
                <span className="ml-2 text-soul-600">
                  {story.chapters?.some((c: any) => c.audioUrl) ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-soul-800">Export Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-soul-100 rounded transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="border border-soul-200 rounded-lg p-4 bg-soul-50">
                <pre className="whitespace-pre-wrap text-sm text-soul-700 font-mono">
                  {previewContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </div>
  )
}

// Export Job Card Component
function ExportJobCard({ 
  job, 
  onDownload 
}: { 
  job: ExportJob
  onDownload: () => void 
}) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'preparing':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'preparing':
      case 'processing':
        return 'text-blue-600'
      case 'complete':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-soul-200 rounded-lg p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-soul-800">{job.format.name}</h4>
          <p className={cn("text-sm capitalize", getStatusColor())}>
            {job.status === 'processing' ? `Processing... ${job.progress}%` : job.status}
          </p>
        </div>
      </div>

      {job.status === 'processing' && (
        <div className="w-full bg-soul-200 rounded-full h-2 mb-3">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {job.status === 'complete' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-soul-600">
            {job.fileSize} • Ready for download
          </span>
          <button
            onClick={onDownload}
            className="px-3 py-1 bg-mystic-500 text-white rounded hover:bg-mystic-600 transition-colors text-sm flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      )}

      {job.status === 'error' && (
        <div className="text-sm text-red-600">
          {job.errorMessage || 'Export failed'}
        </div>
      )}
    </motion.div>
  )
}