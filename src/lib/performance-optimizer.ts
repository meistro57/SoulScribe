/**
 * SoulScribe Performance Optimizer
 * 
 * The AI Whisperer's efficiency engine that ensures magical story creation
 * happens at lightning speed without sacrificing quality. Because awakening
 * souls shouldn't have to wait for their inspiration! ⚡✨
 */

import { LRUCache } from 'lru-cache'
import { compress, decompress } from 'lz-string'

// Cache configurations for different data types
const CACHE_CONFIGS = {
  // Agent responses cache (short-term for avoiding duplicate calls)
  agentResponses: new LRUCache<string, any>({
    max: 100,
    ttl: 1000 * 60 * 15, // 15 minutes
    sizeCalculation: (value) => JSON.stringify(value).length
  }),
  
  // Voice synthesis cache (longer-term for expensive audio generation)
  voiceSynthesis: new LRUCache<string, string>({
    max: 50,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    sizeCalculation: (value) => value.length
  }),
  
  // Story fragments cache (medium-term for reusable content)
  storyFragments: new LRUCache<string, any>({
    max: 200,
    ttl: 1000 * 60 * 60, // 1 hour
    sizeCalculation: (value) => JSON.stringify(value).length
  }),
  
  // Content parsing cache (persistent for expensive parsing operations)
  contentParsing: new LRUCache<string, any>({
    max: 300,
    ttl: 1000 * 60 * 60 * 6, // 6 hours
    sizeCalculation: (value) => JSON.stringify(value).length
  })
}

export class PerformanceOptimizer {
  private metricsCollector: MetricsCollector
  private requestBatcher: RequestBatcher
  private contentCompressor: ContentCompressor
  
  constructor() {
    this.metricsCollector = new MetricsCollector()
    this.requestBatcher = new RequestBatcher()
    this.contentCompressor = new ContentCompressor()
  }

  /**
   * Optimized agent call with intelligent caching and batching
   */
  async optimizedAgentCall(
    agentType: string,
    prompt: string,
    options: any = {}
  ): Promise<any> {
    const startTime = performance.now()
    
    // Create cache key from agent type, prompt hash, and options
    const cacheKey = this.createCacheKey(agentType, prompt, options)
    
    // Check cache first
    const cached = CACHE_CONFIGS.agentResponses.get(cacheKey)
    if (cached && !options.bypassCache) {
      this.metricsCollector.recordCacheHit(agentType, performance.now() - startTime)
      return cached
    }
    
    // Batch similar requests if possible
    if (options.enableBatching) {
      const batchResult = await this.requestBatcher.addToBatch(agentType, prompt, options)
      if (batchResult) {
        this.metricsCollector.recordBatchHit(agentType, performance.now() - startTime)
        return batchResult
      }
    }
    
    // Make the actual API call
    const result = await this.executeAgentCall(agentType, prompt, options)
    
    // Cache the result
    CACHE_CONFIGS.agentResponses.set(cacheKey, result)
    
    // Record metrics
    this.metricsCollector.recordApiCall(agentType, performance.now() - startTime, result)
    
    return result
  }

  /**
   * Parallel processing for chapter generation with intelligent load balancing
   */
  async optimizeParallelGeneration(
    chapters: Array<{ title: string; context: string; difficulty: number }>,
    maxConcurrency: number = 3
  ): Promise<any[]> {
    const results: any[] = []
    
    // Sort chapters by difficulty (easiest first for faster completion feedback)
    const sortedChapters = chapters.sort((a, b) => a.difficulty - b.difficulty)
    
    // Create processing queues with different strategies
    const quickQueue = sortedChapters.filter(c => c.difficulty < 0.3)
    const mediumQueue = sortedChapters.filter(c => c.difficulty >= 0.3 && c.difficulty < 0.7)
    const complexQueue = sortedChapters.filter(c => c.difficulty >= 0.7)
    
    // Process quick chapters first (higher concurrency)
    if (quickQueue.length > 0) {
      const quickResults = await this.processConcurrentChapters(quickQueue, maxConcurrency + 2)
      results.push(...quickResults)
    }
    
    // Process medium chapters (normal concurrency)
    if (mediumQueue.length > 0) {
      const mediumResults = await this.processConcurrentChapters(mediumQueue, maxConcurrency)
      results.push(...mediumResults)
    }
    
    // Process complex chapters (lower concurrency for better quality)
    if (complexQueue.length > 0) {
      const complexResults = await this.processConcurrentChapters(complexQueue, Math.max(1, maxConcurrency - 1))
      results.push(...complexResults)
    }
    
    // Restore original order
    return results.sort((a, b) => a.originalIndex - b.originalIndex)
  }

  /**
   * Memory-efficient content streaming for large stories
   */
  async *streamStoryGeneration(
    storyConfig: any,
    onProgressUpdate?: (progress: { phase: string; completion: number }) => void
  ): AsyncGenerator<{ type: string; content: any; metadata: any }, void, unknown> {
    const phases = ['outline', 'toc', 'chapters', 'synthesis', 'audio']
    
    for (const [index, phase] of phases.entries()) {
      onProgressUpdate?.({
        phase,
        completion: index / phases.length
      })
      
      switch (phase) {
        case 'outline':
          const outline = await this.optimizedAgentCall('soulscribe', storyConfig.outlinePrompt)
          yield {
            type: 'outline',
            content: outline,
            metadata: { timestamp: Date.now(), phase }
          }
          break
          
        case 'toc':
          const toc = await this.optimizedAgentCall('toc_processor', outline)
          yield {
            type: 'toc',
            content: toc,
            metadata: { timestamp: Date.now(), phase }
          }
          break
          
        case 'chapters':
          const chapterStream = this.streamChapterGeneration(toc, storyConfig)
          for await (const chapter of chapterStream) {
            yield chapter
          }
          break
          
        case 'synthesis':
          const synthesis = await this.optimizedAgentCall('learning_synthesis', 'complete_story')
          yield {
            type: 'synthesis',
            content: synthesis,
            metadata: { timestamp: Date.now(), phase }
          }
          break
          
        case 'audio':
          const audioStream = this.streamAudioGeneration()
          for await (const audio of audioStream) {
            yield audio
          }
          break
      }
    }
  }

  /**
   * Intelligent content compression for storage and transfer optimization
   */
  async compressStoryData(story: any): Promise<string> {
    return this.contentCompressor.compress(story)
  }

  async decompressStoryData(compressedData: string): Promise<any> {
    return this.contentCompressor.decompress(compressedData)
  }

  /**
   * Preload and warm up caches for better user experience
   */
  async warmUpCaches(userProfile: any): Promise<void> {
    // Preload common voice profiles
    const commonVoices = ['narrator_main', 'child_spirit', 'wise_elder']
    for (const voice of commonVoices) {
      this.preloadVoiceProfile(voice)
    }
    
    // Preload user's preferred story templates
    if (userProfile.preferredGenres) {
      for (const genre of userProfile.preferredGenres) {
        this.preloadStoryTemplates(genre)
      }
    }
    
    // Preload content parsing models
    this.preloadParsingCache()
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics(): {
    cacheStats: any
    apiCallStats: any
    memoryUsage: any
    recommendations: string[]
  } {
    return {
      cacheStats: this.getCacheStatistics(),
      apiCallStats: this.metricsCollector.getStats(),
      memoryUsage: this.getMemoryUsage(),
      recommendations: this.generateOptimizationRecommendations()
    }
  }

  // Private helper methods

  private createCacheKey(agentType: string, prompt: string, options: any): string {
    const promptHash = this.hashString(prompt)
    const optionsHash = this.hashString(JSON.stringify(options))
    return `${agentType}:${promptHash}:${optionsHash}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private async executeAgentCall(agentType: string, prompt: string, options: any): Promise<any> {
    // This would make the actual API call to OpenAI
    // Simulated for now
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          content: `Generated content for ${agentType}`,
          tokensUsed: prompt.length / 4,
          metadata: { timestamp: Date.now() }
        })
      }, Math.random() * 1000 + 500) // Simulate API latency
    })
  }

  private async processConcurrentChapters(chapters: any[], concurrency: number): Promise<any[]> {
    const results = []
    
    for (let i = 0; i < chapters.length; i += concurrency) {
      const batch = chapters.slice(i, i + concurrency)
      const batchPromises = batch.map(async (chapter, batchIndex) => ({
        ...await this.optimizedAgentCall('soulscribe', chapter.context),
        originalIndex: i + batchIndex
      }))
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  private async *streamChapterGeneration(toc: any, config: any): AsyncGenerator<any, void, unknown> {
    for (const chapter of toc.chapters) {
      const chapterContent = await this.optimizedAgentCall('soulscribe', chapter.prompt)
      yield {
        type: 'chapter',
        content: chapterContent,
        metadata: { 
          chapterNumber: chapter.number,
          timestamp: Date.now() 
        }
      }
    }
  }

  private async *streamAudioGeneration(): AsyncGenerator<any, void, unknown> {
    // Simulate audio generation streaming
    yield {
      type: 'audio_progress',
      content: 'Starting audio generation...',
      metadata: { progress: 0 }
    }
  }

  private preloadVoiceProfile(voiceId: string): void {
    // Preload voice synthesis data
    setTimeout(() => {
      CACHE_CONFIGS.voiceSynthesis.set(`voice_${voiceId}`, `cached_voice_data_${voiceId}`)
    }, 100)
  }

  private preloadStoryTemplates(genre: string): void {
    // Preload story templates for genre
    setTimeout(() => {
      CACHE_CONFIGS.storyFragments.set(`template_${genre}`, {
        outline: `Template outline for ${genre}`,
        characters: [`Character template for ${genre}`]
      })
    }, 200)
  }

  private preloadParsingCache(): void {
    // Preload common parsing patterns
    const commonPatterns = ['dialogue_tags', 'chapter_structure', 'learning_synthesis']
    commonPatterns.forEach(pattern => {
      CACHE_CONFIGS.contentParsing.set(`pattern_${pattern}`, `cached_${pattern}_data`)
    })
  }

  private getCacheStatistics(): any {
    return {
      agentResponses: {
        size: CACHE_CONFIGS.agentResponses.size,
        hitRate: this.metricsCollector.getCacheHitRate('agentResponses')
      },
      voiceSynthesis: {
        size: CACHE_CONFIGS.voiceSynthesis.size,
        hitRate: this.metricsCollector.getCacheHitRate('voiceSynthesis')
      },
      storyFragments: {
        size: CACHE_CONFIGS.storyFragments.size,
        hitRate: this.metricsCollector.getCacheHitRate('storyFragments')
      },
      contentParsing: {
        size: CACHE_CONFIGS.contentParsing.size,
        hitRate: this.metricsCollector.getCacheHitRate('contentParsing')
      }
    }
  }

  private getMemoryUsage(): any {
    // In a real implementation, this would use process.memoryUsage()
    return {
      heapUsed: 50 * 1024 * 1024, // Simulated
      heapTotal: 100 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      rss: 80 * 1024 * 1024
    }
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations = []
    const stats = this.getCacheStatistics()
    
    if (stats.agentResponses.hitRate < 0.6) {
      recommendations.push("Consider increasing agent response cache TTL for better hit rates")
    }
    
    if (stats.voiceSynthesis.size < 20) {
      recommendations.push("Preload more voice profiles during user idle time")
    }
    
    if (this.metricsCollector.getAverageResponseTime() > 2000) {
      recommendations.push("Consider reducing model complexity or increasing parallel processing")
    }
    
    return recommendations
  }
}

// Supporting classes

class MetricsCollector {
  private metrics: Map<string, any[]> = new Map()
  private cacheHits: Map<string, number> = new Map()
  private cacheMisses: Map<string, number> = new Map()

  recordApiCall(agentType: string, duration: number, result: any): void {
    if (!this.metrics.has(agentType)) {
      this.metrics.set(agentType, [])
    }
    this.metrics.get(agentType)!.push({
      duration,
      tokensUsed: result.tokensUsed || 0,
      timestamp: Date.now()
    })
  }

  recordCacheHit(agentType: string, duration: number): void {
    const key = `${agentType}_cache`
    this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1)
  }

  recordBatchHit(agentType: string, duration: number): void {
    const key = `${agentType}_batch`
    this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1)
  }

  getCacheHitRate(cacheType: string): number {
    const hits = this.cacheHits.get(cacheType) || 0
    const misses = this.cacheMisses.get(cacheType) || 0
    const total = hits + misses
    return total > 0 ? hits / total : 0
  }

  getAverageResponseTime(): number {
    let total = 0
    let count = 0
    
    for (const agentMetrics of this.metrics.values()) {
      for (const metric of agentMetrics) {
        total += metric.duration
        count++
      }
    }
    
    return count > 0 ? total / count : 0
  }

  getStats(): any {
    return {
      totalCalls: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0),
      averageResponseTime: this.getAverageResponseTime(),
      cacheHitRates: Object.fromEntries(
        Array.from(this.cacheHits.keys()).map(key => [key, this.getCacheHitRate(key)])
      )
    }
  }
}

class RequestBatcher {
  private batches: Map<string, any[]> = new Map()
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly BATCH_DELAY = 100 // ms
  private readonly MAX_BATCH_SIZE = 5

  async addToBatch(agentType: string, prompt: string, options: any): Promise<any | null> {
    const batchKey = `${agentType}_${options.batchGroup || 'default'}`
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, [])
    }
    
    const batch = this.batches.get(batchKey)!
    batch.push({ prompt, options, resolve: null, reject: null })
    
    // Set up batch processing timer
    if (!this.batchTimers.has(batchKey)) {
      const timer = setTimeout(() => {
        this.processBatch(batchKey)
      }, this.BATCH_DELAY)
      this.batchTimers.set(batchKey, timer)
    }
    
    // Process immediately if batch is full
    if (batch.length >= this.MAX_BATCH_SIZE) {
      clearTimeout(this.batchTimers.get(batchKey)!)
      this.batchTimers.delete(batchKey)
      return this.processBatch(batchKey)
    }
    
    return null
  }

  private async processBatch(batchKey: string): Promise<any> {
    const batch = this.batches.get(batchKey)
    if (!batch || batch.length === 0) return null
    
    this.batches.delete(batchKey)
    this.batchTimers.delete(batchKey)
    
    // Process batch (simplified - would combine prompts intelligently)
    const combinedPrompt = batch.map(item => item.prompt).join('\n---\n')
    // Return first item's result for now
    return { content: `Batched result for ${batchKey}`, tokensUsed: 100 }
  }
}

class ContentCompressor {
  compress(data: any): string {
    const jsonString = JSON.stringify(data)
    return compress(jsonString)
  }

  decompress(compressedData: string): any {
    const jsonString = decompress(compressedData)
    return JSON.parse(jsonString)
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// Performance monitoring utilities
export const PerformanceMonitor = {
  startTimer: (label: string): () => number => {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`)
      return duration
    }
  },

  measureAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const endTimer = PerformanceMonitor.startTimer(label)
    try {
      const result = await fn()
      endTimer()
      return result
    } catch (error) {
      endTimer()
      throw error
    }
  },

  measureMemoryUsage: (label: string): void => {
    if (typeof window === 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      console.log(`🧠 ${label} Memory:`, {
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }
}

export default PerformanceOptimizer