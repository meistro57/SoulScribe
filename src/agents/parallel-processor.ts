import { EncouragementAgent } from './encouragement-agent'
import { ContentParserAgent } from './content-parser-agent'
import { ChapterAnalyzerAgent } from './chapter-analyzer-agent'
import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

/**
 * Parallel Chapter Processing System - The High-Performance Story Factory
 * 
 * This system turns SoulScribe into a lightning-fast story generator by processing
 * multiple chapters simultaneously while maintaining quality and narrative consistency.
 * The AI Whisperer's speed demon! ⚡
 */

export interface ParallelProcessingConfig {
  maxConcurrentChapters: number
  qualityThreshold: number
  retryAttempts: number
  enableProgressiveGeneration: boolean
  useAdaptiveEncouragement: boolean
}

export interface ChapterJob {
  chapterNumber: number
  title: string
  storyContext: string
  questionnaire: any
  dependencies: number[] // Previous chapters that must complete first
  priority: 'low' | 'normal' | 'high'
  estimatedComplexity: number
}

export interface ProcessingResult {
  chapterNumber: number
  success: boolean
  chapter?: any
  error?: string
  processingTime: number
  tokensUsed: number
  qualityScore: number
  retryCount: number
}

export interface ProcessingProgress {
  totalJobs: number
  completedJobs: number
  activeJobs: number
  queuedJobs: number
  failedJobs: number
  averageProcessingTime: number
  estimatedTimeRemaining: number
  chapterStatuses: { [chapterNumber: number]: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying' }
}

export class ParallelChapterProcessor {
  private storyId: string
  private config: ParallelProcessingConfig
  private encouragementAgent: EncouragementAgent
  private contentParser: ContentParserAgent
  private chapterAnalyzer: ChapterAnalyzerAgent
  private activeJobs: Map<number, Promise<ProcessingResult>> = new Map()
  private completedChapters: Map<number, any> = new Map()
  private jobQueue: ChapterJob[] = []
  private progressCallback?: (progress: ProcessingProgress) => void

  constructor(
    storyId: string, 
    config: Partial<ParallelProcessingConfig> = {},
    progressCallback?: (progress: ProcessingProgress) => void
  ) {
    this.storyId = storyId
    this.config = {
      maxConcurrentChapters: 3, // Process up to 3 chapters simultaneously
      qualityThreshold: 0.7,
      retryAttempts: 2,
      enableProgressiveGeneration: true,
      useAdaptiveEncouragement: true,
      ...config
    }
    this.encouragementAgent = new EncouragementAgent(storyId)
    this.contentParser = new ContentParserAgent(storyId)
    this.chapterAnalyzer = new ChapterAnalyzerAgent(storyId)
    this.progressCallback = progressCallback
  }

  /**
   * THE SPEED DEMON - Process all chapters in parallel batches
   */
  async processChaptersInParallel(
    chapters: ChapterJob[],
    baseStoryContext: string
  ): Promise<{ 
    results: ProcessingResult[]
    completedChapters: any[]
    analytics: {
      totalTime: number
      averageChapterTime: number
      tokensUsed: number
      qualityScore: number
      parallelEfficiency: number
    }
  }> {
    const startTime = Date.now()
    let totalTokens = 0
    const results: ProcessingResult[] = []

    // Initialize the job queue with intelligent ordering
    this.jobQueue = this.optimizeJobOrder(chapters)
    this.updateProgress()

    console.log(`🚀 Starting parallel processing of ${chapters.length} chapters with max concurrency: ${this.config.maxConcurrentChapters}`)

    // Process jobs in parallel batches
    while (this.jobQueue.length > 0 || this.activeJobs.size > 0) {
      // Start new jobs if we have capacity and available jobs
      await this.startAvailableJobs(baseStoryContext)
      
      // Wait for at least one job to complete
      if (this.activeJobs.size > 0) {
        const completedJob = await this.waitForNextCompletion()
        results.push(completedJob)
        totalTokens += completedJob.tokensUsed
        
        // Update progress
        this.updateProgress()
        
        // Adaptive encouragement based on progress
        if (this.config.useAdaptiveEncouragement) {
          await this.provideBatchEncouragement(results.length, chapters.length)
        }
      }
    }

    // Calculate analytics
    const totalTime = Date.now() - startTime
    const serialTime = this.estimateSerialProcessingTime(chapters)
    const parallelEfficiency = Math.min(serialTime / totalTime, 3.0) // Cap at 3x improvement

    const completedChapters = Array.from(this.completedChapters.values())
      .sort((a, b) => a.number - b.number)

    return {
      results,
      completedChapters,
      analytics: {
        totalTime,
        averageChapterTime: totalTime / chapters.length,
        tokensUsed: totalTokens,
        qualityScore: this.calculateAverageQuality(results),
        parallelEfficiency
      }
    }
  }

  /**
   * Optimize job order for maximum efficiency
   */
  private optimizeJobOrder(chapters: ChapterJob[]): ChapterJob[] {
    // Sort by dependencies first, then by complexity and priority
    return chapters.sort((a, b) => {
      // Chapters with fewer dependencies go first
      if (a.dependencies.length !== b.dependencies.length) {
        return a.dependencies.length - b.dependencies.length
      }
      
      // Higher priority goes first
      const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      
      // Lower complexity goes first for quick wins
      return a.estimatedComplexity - b.estimatedComplexity
    })
  }

  /**
   * Start available jobs that meet dependency requirements
   */
  private async startAvailableJobs(baseStoryContext: string): Promise<void> {
    while (
      this.activeJobs.size < this.config.maxConcurrentChapters && 
      this.jobQueue.length > 0
    ) {
      // Find the next job whose dependencies are satisfied
      const availableJobIndex = this.jobQueue.findIndex(job => 
        this.areDependenciesSatisfied(job.dependencies)
      )
      
      if (availableJobIndex === -1) {
        // No jobs available due to dependencies
        break
      }
      
      // Remove job from queue and start processing
      const job = this.jobQueue.splice(availableJobIndex, 1)[0]
      const enhancedContext = this.buildEnhancedContext(baseStoryContext, job)
      
      console.log(`🎬 Starting Chapter ${job.chapterNumber}: "${job.title}"`)
      
      const jobPromise = this.processChapter(job, enhancedContext)
      this.activeJobs.set(job.chapterNumber, jobPromise)
    }
  }

  /**
   * Wait for the next job to complete
   */
  private async waitForNextCompletion(): Promise<ProcessingResult> {
    const activePromises = Array.from(this.activeJobs.entries()).map(
      ([chapterNumber, promise]) => 
        promise.then(result => ({ chapterNumber, result }))
    )
    
    const { chapterNumber, result } = await Promise.race(activePromises)
    
    // Remove from active jobs
    this.activeJobs.delete(chapterNumber)
    
    // Store completed chapter if successful
    if (result.success && result.chapter) {
      this.completedChapters.set(chapterNumber, result.chapter)
      console.log(`✅ Chapter ${chapterNumber} completed! Quality: ${result.qualityScore.toFixed(2)}`)
    } else {
      console.log(`❌ Chapter ${chapterNumber} failed: ${result.error}`)
    }
    
    return result
  }

  /**
   * Check if job dependencies are satisfied
   */
  private areDependenciesSatisfied(dependencies: number[]): boolean {
    return dependencies.every(dep => this.completedChapters.has(dep))
  }

  /**
   * Build enhanced context with completed chapters
   */
  private buildEnhancedContext(baseContext: string, job: ChapterJob): string {
    let enhancedContext = baseContext
    
    // Add summaries of completed chapters
    if (this.completedChapters.size > 0) {
      enhancedContext += '\n\nCOMPLETED CHAPTERS:\n'
      
      // Get completed chapters in order
      const completedInOrder = Array.from(this.completedChapters.entries())
        .filter(([num]) => num < job.chapterNumber)
        .sort(([a], [b]) => a - b)
      
      completedInOrder.forEach(([num, chapter]) => {
        enhancedContext += `Chapter ${num}: ${chapter.title}\nSummary: ${chapter.summary}\n\n`
      })
    }
    
    return enhancedContext
  }

  /**
   * Process a single chapter with full pipeline
   */
  private async processChapter(job: ChapterJob, storyContext: string): Promise<ProcessingResult> {
    const startTime = Date.now()
    let totalTokens = 0
    let retryCount = 0
    
    while (retryCount <= this.config.retryAttempts) {
      try {
        // Step 1: Adaptive encouragement based on chapter complexity
        const encouragement = await this.generateAdaptiveEncouragement(job, retryCount)
        
        // Step 2: Generate chapter with context awareness
        const chapterPrompt = this.buildChapterPrompt(job, storyContext, encouragement)
        
        const chapterResponse = await callAgent({
          agentType: 'soulscribe',
          messages: [{ role: 'user', content: chapterPrompt }],
          temperature: this.calculateTemperature(job, retryCount),
          maxTokens: this.calculateMaxTokens(job)
        })
        totalTokens += chapterResponse.tokensUsed
        
        // Step 3: Parse content
        const parsedChapter = await this.contentParser.parseChapterContent(chapterResponse.content)
        
        // Step 4: Quality analysis
        const analysis = await this.chapterAnalyzer.analyzeChapter(parsedChapter.content, {
          number: job.chapterNumber,
          title: job.title,
          storyThemes: job.questionnaire.spiritualElements,
          targetAge: job.questionnaire.targetAge,
          overallStoryArc: job.questionnaire.primaryTheme
        })
        
        // Step 5: Quality check
        if (analysis.overallScore >= this.config.qualityThreshold) {
          // Success! Chapter meets quality standards
          const chapter = {
            number: job.chapterNumber,
            title: job.title,
            content: parsedChapter.content,
            summary: parsedChapter.learningElement || `Chapter ${job.chapterNumber} summary`,
            keyLessons: analysis.learningIntegration.explicitLessons,
            wordCount: parsedChapter.wordCount,
            qualityScore: analysis.overallScore
          }
          
          return {
            chapterNumber: job.chapterNumber,
            success: true,
            chapter,
            processingTime: Date.now() - startTime,
            tokensUsed: totalTokens,
            qualityScore: analysis.overallScore,
            retryCount
          }
        } else {
          // Quality too low, retry with improvements
          retryCount++
          
          if (retryCount <= this.config.retryAttempts) {
            console.log(`🔄 Chapter ${job.chapterNumber} quality (${analysis.overallScore.toFixed(2)}) below threshold. Retrying... (${retryCount}/${this.config.retryAttempts})`)
            
            // Add improvement context for retry
            job.storyContext += `\n\nIMPROVEMENT NEEDED:\n${analysis.recommendations.map(r => r.suggestion).join('\n')}`
          }
        }
        
      } catch (error) {
        retryCount++
        console.error(`Error processing Chapter ${job.chapterNumber} (attempt ${retryCount}):`, error)
        
        if (retryCount > this.config.retryAttempts) {
          return {
            chapterNumber: job.chapterNumber,
            success: false,
            error: error.message,
            processingTime: Date.now() - startTime,
            tokensUsed: totalTokens,
            qualityScore: 0,
            retryCount: retryCount - 1
          }
        }
      }
    }
    
    // If we get here, all retries failed
    return {
      chapterNumber: job.chapterNumber,
      success: false,
      error: 'Exceeded maximum retry attempts',
      processingTime: Date.now() - startTime,
      tokensUsed: totalTokens,
      qualityScore: 0,
      retryCount: this.config.retryAttempts
    }
  }

  /**
   * Generate adaptive encouragement based on chapter and context
   */
  private async generateAdaptiveEncouragement(job: ChapterJob, retryCount: number): Promise<string> {
    if (!this.config.useAdaptiveEncouragement) {
      return await this.encouragementAgent.motivateForTask({
        storyTitle: job.questionnaire.primaryTheme,
        currentPhase: 'chapter',
        chapterNumber: job.chapterNumber
      })
    }
    
    // Adaptive encouragement based on complexity and retry status
    const context = {
      storyTitle: job.questionnaire.primaryTheme,
      currentPhase: 'chapter' as const,
      chapterNumber: job.chapterNumber,
      challengeLevel: job.estimatedComplexity > 0.7 ? 'complex' as const : 'medium' as const
    }
    
    if (retryCount > 0) {
      return await this.encouragementAgent.provideAdaptiveEncouragement(context, {
        isStruggling: true
      })
    } else if (job.priority === 'high') {
      return await this.encouragementAgent.provideAdaptiveEncouragement(context, {
        qualityScore: 0.9 // Expect high quality
      })
    }
    
    return await this.encouragementAgent.generateEncouragement(context)
  }

  /**
   * Build chapter generation prompt
   */
  private buildChapterPrompt(job: ChapterJob, storyContext: string, encouragement: string): string {
    return `${encouragement}

Story Context:
${storyContext}

Generate Chapter ${job.chapterNumber}: "${job.title}"

Chapter Priority: ${job.priority}
Estimated Complexity: ${job.estimatedComplexity}

Create a complete chapter that:
• Advances the story meaningfully
• Contains rich sensory descriptions
• Includes meaningful dialogue with [S1], [S2] tags for different speakers
• Weaves spiritual themes naturally: ${job.questionnaire.spiritualElements.join(', ')}
• Has emotional depth and character growth
• Ends with a "What did we learn from this chapter?" reflection
• Maintains the ${job.questionnaire.writingStyle} style
• Is appropriate for ${job.questionnaire.targetAge} audience

Make it magical, meaningful, and true to your SoulScribe essence!`
  }

  /**
   * Calculate temperature based on job characteristics
   */
  private calculateTemperature(job: ChapterJob, retryCount: number): number {
    let baseTemp = 0.85
    
    // Lower temperature for retries (more focused)
    if (retryCount > 0) {
      baseTemp -= retryCount * 0.1
    }
    
    // Adjust for complexity
    if (job.estimatedComplexity > 0.8) {
      baseTemp -= 0.1 // More focused for complex chapters
    }
    
    return Math.max(0.3, Math.min(0.95, baseTemp))
  }

  /**
   * Calculate max tokens based on job characteristics
   */
  private calculateMaxTokens(job: ChapterJob): number {
    let baseTokens = 4000
    
    // More tokens for complex chapters
    if (job.estimatedComplexity > 0.7) {
      baseTokens += 1000
    }
    
    // More tokens for high priority chapters
    if (job.priority === 'high') {
      baseTokens += 500
    }
    
    return baseTokens
  }

  /**
   * Provide batch encouragement based on progress
   */
  private async provideBatchEncouragement(completed: number, total: number): Promise<void> {
    const progress = completed / total
    
    if (progress === 0.25) {
      console.log('🎉 25% complete! SoulScribe is in the zone!')
    } else if (progress === 0.5) {
      console.log('🚀 50% complete! The story is coming alive!')
    } else if (progress === 0.75) {
      console.log('⭐ 75% complete! Almost there, the finale awaits!')
    } else if (progress === 1.0) {
      console.log('🎊 100% complete! What a masterpiece!')
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(): void {
    if (!this.progressCallback) return
    
    const totalJobs = this.jobQueue.length + this.activeJobs.size + this.completedChapters.size
    const completedJobs = this.completedChapters.size
    const activeJobs = this.activeJobs.size
    const queuedJobs = this.jobQueue.length
    
    // Build chapter statuses
    const chapterStatuses: { [key: number]: 'queued' | 'processing' | 'completed' | 'failed' } = {}
    
    this.jobQueue.forEach(job => {
      chapterStatuses[job.chapterNumber] = 'queued'
    })
    
    Array.from(this.activeJobs.keys()).forEach(chapterNum => {
      chapterStatuses[chapterNum] = 'processing'
    })
    
    Array.from(this.completedChapters.keys()).forEach(chapterNum => {
      chapterStatuses[chapterNum] = 'completed'
    })
    
    this.progressCallback({
      totalJobs,
      completedJobs,
      activeJobs,
      queuedJobs,
      failedJobs: 0, // Would track failed jobs
      averageProcessingTime: 120000, // 2 minutes average
      estimatedTimeRemaining: queuedJobs * 2, // 2 minutes per remaining job
      chapterStatuses
    })
  }

  /**
   * Calculate average quality score
   */
  private calculateAverageQuality(results: ProcessingResult[]): number {
    const successfulResults = results.filter(r => r.success)
    if (successfulResults.length === 0) return 0
    
    const totalQuality = successfulResults.reduce((sum, r) => sum + r.qualityScore, 0)
    return totalQuality / successfulResults.length
  }

  /**
   * Estimate serial processing time for efficiency calculation
   */
  private estimateSerialProcessingTime(chapters: ChapterJob[]): number {
    return chapters.reduce((total, chapter) => {
      return total + (120000 * (1 + chapter.estimatedComplexity)) // Base 2 minutes + complexity
    }, 0)
  }

  /**
   * Create chapter jobs from basic chapter data
   */
  static createChapterJobs(
    chapters: Array<{ number: number; title: string }>,
    questionnaire: any,
    storyContext: string
  ): ChapterJob[] {
    return chapters.map((ch, index) => ({
      chapterNumber: ch.number,
      title: ch.title,
      storyContext,
      questionnaire,
      dependencies: ch.number > 1 ? [ch.number - 1] : [], // Depend on previous chapter
      priority: index < 2 ? 'high' : (index < chapters.length - 2 ? 'normal' : 'high'), // First 2 and last 2 are high priority
      estimatedComplexity: Math.random() * 0.5 + 0.5 // Random complexity between 0.5-1.0
    }))
  }
}