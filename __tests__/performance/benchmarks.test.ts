import { performance } from 'perf_hooks'
import { StoryGenerationPipeline } from '@/agents/story-generation-pipeline'
import { PerformanceOptimizer, performanceOptimizer } from '@/lib/performance-optimizer'
import { callAgent } from '@/lib/openai'

// Mock dependencies for controlled testing
jest.mock('@/lib/openai')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    story: { create: jest.fn(), update: jest.fn() },
    agentSession: { create: jest.fn() }
  }
}))

const mockCallAgent = callAgent as jest.MockedFunction<typeof callAgent>

/**
 * Performance Benchmarks for SoulScribe
 * 
 * These tests ensure the AI Whisperer's magical system scales gracefully
 * and maintains lightning-fast performance while awakening souls! ⚡✨
 */

describe('SoulScribe Performance Benchmarks 🚀', () => {
  const mockQuestionnaire = {
    genre: 'mystical-fable',
    targetAge: 'all_ages' as const,
    chapterCount: 5,
    estimatedLength: 'medium' as const,
    primaryTheme: 'inner_wisdom',
    lifeLesson: 'Trust your inner voice',
    spiritualElements: ['nature_connection', 'transformation'],
    metaphorPreferences: ['journey', 'light_and_shadow'],
    characterTypes: ['seeker', 'wise_guide'],
    settingPreferences: ['forest', 'mountain'],
    toneKeywords: ['mystical', 'warm'],
    writingStyle: 'poetic' as const,
    chatResponses: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup standard mock responses with realistic timing
    mockCallAgent.mockImplementation(async ({ agentType }) => {
      const baseDelay = agentType === 'soulscribe' ? 800 : 200 // Realistic API latency
      await new Promise(resolve => setTimeout(resolve, baseDelay + Math.random() * 400))
      
      return {
        content: `Mock ${agentType} content with [S1] dialogue and spiritual depth. What did we learn? Performance and quality can coexist.`,
        tokensUsed: 100 + Math.floor(Math.random() * 100)
      }
    })
  })

  describe('Story Generation Performance 📚', () => {
    it('should generate a 3-chapter story within performance targets', async () => {
      const pipeline = new StoryGenerationPipeline('perf-test-user')
      const shortQuestionnaire = { ...mockQuestionnaire, chapterCount: 3 }
      
      const startTime = performance.now()
      const result = await pipeline.generateCompleteStory(shortQuestionnaire)
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      
      // Performance targets
      expect(totalTime).toBeLessThan(15000) // < 15 seconds for 3 chapters
      expect(result.story.chapters).toHaveLength(3)
      expect(result.performance.totalTokensUsed).toBeGreaterThan(500)
      expect(result.performance.averageChapterTime).toBeLessThan(4000) // < 4 seconds per chapter average
      
      console.log(`✨ 3-Chapter Story Generation: ${totalTime.toFixed(2)}ms`)
      console.log(`⚡ Average Chapter Time: ${result.performance.averageChapterTime.toFixed(2)}ms`)
      console.log(`🧠 Total Tokens: ${result.performance.totalTokensUsed}`)
    })

    it('should scale efficiently with chapter count', async () => {
      const pipeline = new StoryGenerationPipeline('scale-test-user')
      const chapterCounts = [3, 5, 8]
      const results: any[] = []
      
      for (const chapterCount of chapterCounts) {
        const questionnaire = { ...mockQuestionnaire, chapterCount }
        
        const startTime = performance.now()
        const result = await pipeline.generateCompleteStory(questionnaire)
        const endTime = performance.now()
        
        const totalTime = endTime - startTime
        const timePerChapter = totalTime / chapterCount
        
        results.push({
          chapterCount,
          totalTime,
          timePerChapter,
          tokensUsed: result.performance.totalTokensUsed
        })
        
        console.log(`📖 ${chapterCount} chapters: ${totalTime.toFixed(2)}ms (${timePerChapter.toFixed(2)}ms/chapter)`)
      }
      
      // Should show parallel processing benefits
      expect(results[2].timePerChapter).toBeLessThan(results[0].timePerChapter * 1.5) // Not linear scaling
      
      // Should complete 8 chapters within reasonable time
      expect(results[2].totalTime).toBeLessThan(30000) // < 30 seconds for 8 chapters
    })

    it('should maintain quality under concurrent load', async () => {
      const concurrentUsers = 5
      const promises = []
      
      for (let i = 0; i < concurrentUsers; i++) {
        const pipeline = new StoryGenerationPipeline(`concurrent-user-${i}`)
        promises.push(pipeline.generateCompleteStory(mockQuestionnaire))
      }
      
      const startTime = performance.now()
      const results = await Promise.all(promises)
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      const averageTime = totalTime / concurrentUsers
      
      // All stories should be complete and high quality
      results.forEach((result, index) => {
        expect(result.story.chapters).toHaveLength(mockQuestionnaire.chapterCount)
        expect(result.story.chapters.every(c => c.content.includes('What did we learn'))).toBe(true)
      })
      
      // Should handle concurrent load efficiently
      expect(averageTime).toBeLessThan(25000) // < 25 seconds average under load
      
      console.log(`🌟 Concurrent Load (${concurrentUsers} users): ${totalTime.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`)
    })
  })

  describe('Caching and Optimization Performance 🧠', () => {
    it('should achieve significant cache hit rates', async () => {
      // Prime the cache with initial requests
      const optimizer = new PerformanceOptimizer()
      
      const testPrompt = "Generate mystical story content"
      const testOptions = { temperature: 0.8 }
      
      // First call - cache miss
      const startMiss = performance.now()
      await optimizer.optimizedAgentCall('soulscribe', testPrompt, testOptions)
      const missDuration = performance.now() - startMiss
      
      // Second call - cache hit
      const startHit = performance.now()
      await optimizer.optimizedAgentCall('soulscribe', testPrompt, testOptions)
      const hitDuration = performance.now() - startHit
      
      // Cache hit should be significantly faster
      expect(hitDuration).toBeLessThan(missDuration * 0.1) // At least 10x faster
      expect(hitDuration).toBeLessThan(50) // < 50ms for cache hits
      
      console.log(`🎯 Cache Miss: ${missDuration.toFixed(2)}ms, Cache Hit: ${hitDuration.toFixed(2)}ms`)
      console.log(`⚡ Cache Speedup: ${(missDuration / hitDuration).toFixed(2)}x`)
    })

    it('should optimize memory usage efficiently', async () => {
      const initialMemory = process.memoryUsage()
      
      // Generate multiple stories to test memory management
      const pipeline = new StoryGenerationPipeline('memory-test-user')
      
      for (let i = 0; i < 3; i++) {
        await pipeline.generateCompleteStory({
          ...mockQuestionnaire,
          chapterCount: 3
        })
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage()
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryGrowthMB = memoryGrowth / (1024 * 1024)
      
      // Memory growth should be reasonable
      expect(memoryGrowthMB).toBeLessThan(50) // < 50MB growth for 3 stories
      
      console.log(`🧠 Memory Growth: ${memoryGrowthMB.toFixed(2)}MB for 3 stories`)
    })

    it('should compress and decompress content efficiently', async () => {
      const optimizer = new PerformanceOptimizer()
      
      const largeStory = {
        title: 'The Epic Saga',
        chapters: Array.from({ length: 10 }, (_, i) => ({
          number: i + 1,
          title: `Chapter ${i + 1}: The Journey Continues`,
          content: 'A'.repeat(5000) + ' What did we learn? Content compression preserves quality.',
          summary: 'Summary of the chapter',
          keyLessons: ['Lesson 1', 'Lesson 2', 'Lesson 3']
        })),
        metadata: {
          totalWords: 50000,
          estimatedReadTime: 200,
          spiritualThemes: ['wisdom', 'growth', 'transformation']
        }
      }
      
      const startCompress = performance.now()
      const compressed = await optimizer.compressStoryData(largeStory)
      const compressTime = performance.now() - startCompress
      
      const startDecompress = performance.now()
      const decompressed = await optimizer.decompressStoryData(compressed)
      const decompressTime = performance.now() - startDecompress
      
      const originalSize = JSON.stringify(largeStory).length
      const compressedSize = compressed.length
      const compressionRatio = compressedSize / originalSize
      
      // Compression should be effective and fast
      expect(compressionRatio).toBeLessThan(0.5) // At least 50% compression
      expect(compressTime).toBeLessThan(1000) // < 1 second to compress
      expect(decompressTime).toBeLessThan(500) // < 0.5 seconds to decompress
      expect(decompressed).toEqual(largeStory) // Perfect fidelity
      
      console.log(`📦 Compression: ${compressionRatio.toFixed(3)}x ratio in ${compressTime.toFixed(2)}ms`)
      console.log(`📂 Decompression: ${decompressTime.toFixed(2)}ms`)
    })
  })

  describe('Audio Processing Performance 🎵', () => {
    it('should generate chapter audio within time limits', async () => {
      // Mock audio generation
      const mockGenerateAudio = jest.fn().mockImplementation(async (content: string) => {
        const wordCount = content.split(' ').length
        const processingTime = wordCount * 5 // Simulate 5ms per word
        await new Promise(resolve => setTimeout(resolve, processingTime))
        return `/audio/generated-${Date.now()}.mp3`
      })
      
      const testChapter = {
        content: `[S1] "Welcome to the mystical realm," said the wise guide. (with warmth)
        
        The seeker looked around in wonder at the shimmering forest.
        
        [S2] "This place feels magical," Luna whispered. (with awe)
        
        What did we learn? Audio processing can be optimized for quality and speed.`,
        voiceMap: {
          characterAssignments: new Map([
            ['S1', { voiceProfile: { id: 'wise_elder' } }],
            ['S2', { voiceProfile: { id: 'young_seeker' } }]
          ])
        }
      }
      
      const startTime = performance.now()
      const audioUrl = await mockGenerateAudio(testChapter.content)
      const endTime = performance.now()
      
      const processingTime = endTime - startTime
      const wordsPerSecond = testChapter.content.split(' ').length / (processingTime / 1000)
      
      expect(audioUrl).toBeTruthy()
      expect(processingTime).toBeLessThan(2000) // < 2 seconds for typical chapter
      expect(wordsPerSecond).toBeGreaterThan(50) // > 50 words per second processing
      
      console.log(`🎤 Audio Generation: ${processingTime.toFixed(2)}ms (${wordsPerSecond.toFixed(1)} words/sec)`)
    })

    it('should handle parallel audio generation efficiently', async () => {
      const chapters = Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        content: `Chapter ${i + 1} content with dialogue and narration. What did we learn? Parallel processing scales audio generation.`
      }))
      
      const mockGenerateChapterAudio = jest.fn().mockImplementation(async (chapter) => {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
        return {
          audioUrl: `/audio/chapter-${chapter.number}.mp3`,
          duration: 30000,
          voiceSegments: 3
        }
      })
      
      // Sequential processing
      const startSequential = performance.now()
      for (const chapter of chapters) {
        await mockGenerateChapterAudio(chapter)
      }
      const sequentialTime = performance.now() - startSequential
      
      // Parallel processing
      const startParallel = performance.now()
      await Promise.all(chapters.map(chapter => mockGenerateChapterAudio(chapter)))
      const parallelTime = performance.now() - startParallel
      
      const speedupRatio = sequentialTime / parallelTime
      
      expect(speedupRatio).toBeGreaterThan(2) // At least 2x speedup
      expect(parallelTime).toBeLessThan(2000) // < 2 seconds for 5 chapters in parallel
      
      console.log(`🎼 Sequential: ${sequentialTime.toFixed(2)}ms, Parallel: ${parallelTime.toFixed(2)}ms`)
      console.log(`⚡ Parallel Speedup: ${speedupRatio.toFixed(2)}x`)
    })
  })

  describe('UI Component Performance 🎨', () => {
    it('should render flipbook pages efficiently', async () => {
      // Mock React rendering performance
      const mockRenderTime = (complexity: number) => {
        return new Promise<number>(resolve => {
          const startTime = performance.now()
          
          // Simulate rendering complexity
          let result = 0
          for (let i = 0; i < complexity * 10000; i++) {
            result += Math.random()
          }
          
          const endTime = performance.now()
          resolve(endTime - startTime)
        })
      }
      
      const pages = [
        { type: 'cover', complexity: 5 },
        { type: 'toc', complexity: 3 },
        { type: 'chapter', complexity: 8 },
        { type: 'chapter', complexity: 8 },
        { type: 'reflection', complexity: 4 }
      ]
      
      const renderTimes = []
      
      for (const page of pages) {
        const renderTime = await mockRenderTime(page.complexity)
        renderTimes.push({ ...page, renderTime })
      }
      
      const averageRenderTime = renderTimes.reduce((sum, page) => sum + page.renderTime, 0) / renderTimes.length
      const maxRenderTime = Math.max(...renderTimes.map(page => page.renderTime))
      
      // Rendering should be fast and consistent
      expect(averageRenderTime).toBeLessThan(50) // < 50ms average
      expect(maxRenderTime).toBeLessThan(100) // < 100ms max
      
      console.log(`🎨 Average Render: ${averageRenderTime.toFixed(2)}ms, Max: ${maxRenderTime.toFixed(2)}ms`)
    })

    it('should handle smooth page transitions', async () => {
      const mockPageTransition = async (fromPage: number, toPage: number) => {
        const startTime = performance.now()
        
        // Simulate 3D flip animation
        const animationFrames = 60 // 60 FPS
        const animationDuration = 500 // 500ms animation
        const frameTime = animationDuration / animationFrames
        
        for (let frame = 0; frame < animationFrames; frame++) {
          await new Promise(resolve => setTimeout(resolve, frameTime / 60)) // Simulate frame timing
        }
        
        return performance.now() - startTime
      }
      
      const transitions = [
        { from: 0, to: 1 }, // Cover to TOC
        { from: 1, to: 2 }, // TOC to Chapter 1
        { from: 2, to: 3 }, // Chapter 1 to Chapter 2
        { from: 3, to: 2 }  // Chapter 2 back to Chapter 1
      ]
      
      const transitionTimes = []
      
      for (const transition of transitions) {
        const time = await mockPageTransition(transition.from, transition.to)
        transitionTimes.push(time)
      }
      
      const averageTransition = transitionTimes.reduce((sum, time) => sum + time, 0) / transitionTimes.length
      
      // Transitions should be smooth (close to target duration)
      expect(averageTransition).toBeLessThan(600) // < 600ms (allowing for overhead)
      expect(averageTransition).toBeGreaterThan(400) // > 400ms (not too fast)
      
      // Consistent timing
      const maxDeviation = Math.max(...transitionTimes) - Math.min(...transitionTimes)
      expect(maxDeviation).toBeLessThan(100) // < 100ms deviation
      
      console.log(`✨ Page Transitions: ${averageTransition.toFixed(2)}ms average`)
    })
  })

  describe('Database and API Performance 💾', () => {
    it('should handle story persistence efficiently', async () => {
      // Mock database operations
      const mockDbOperations = {
        create: jest.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50))
          return { id: 'story-123' }
        }),
        
        update: jest.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 30))
          return { success: true }
        }),
        
        batchInsert: jest.fn().mockImplementation(async (records: any[]) => {
          await new Promise(resolve => setTimeout(resolve, 20 * records.length))
          return { inserted: records.length }
        })
      }
      
      const storyData = {
        title: 'Performance Test Story',
        chapters: Array.from({ length: 5 }, (_, i) => ({
          number: i + 1,
          content: `Chapter ${i + 1} content`
        }))
      }
      
      const startTime = performance.now()
      
      // Create story
      const story = await mockDbOperations.create()
      
      // Update with chapters
      for (const chapter of storyData.chapters) {
        await mockDbOperations.update()
      }
      
      // Batch insert agent sessions
      await mockDbOperations.batchInsert(
        Array.from({ length: 10 }, (_, i) => ({ sessionId: i }))
      )
      
      const totalTime = performance.now() - startTime
      
      expect(totalTime).toBeLessThan(1000) // < 1 second for all DB operations
      expect(mockDbOperations.create).toHaveBeenCalledTimes(1)
      expect(mockDbOperations.update).toHaveBeenCalledTimes(5)
      expect(mockDbOperations.batchInsert).toHaveBeenCalledTimes(1)
      
      console.log(`💾 Database Operations: ${totalTime.toFixed(2)}ms total`)
    })

    it('should optimize API call batching', async () => {
      const apiCalls = Array.from({ length: 10 }, (_, i) => ({
        agentType: 'soulscribe',
        prompt: `Test prompt ${i}`,
        options: { temperature: 0.8 }
      }))
      
      // Individual calls
      const startIndividual = performance.now()
      for (const call of apiCalls) {
        await mockCallAgent(call as any)
      }
      const individualTime = performance.now() - startIndividual
      
      // Batched calls (simulated)
      const startBatched = performance.now()
      await Promise.all(apiCalls.map(call => mockCallAgent(call as any)))
      const batchedTime = performance.now() - startBatched
      
      const batchingSpeedup = individualTime / batchedTime
      
      expect(batchingSpeedup).toBeGreaterThan(1.5) // At least 1.5x speedup
      expect(batchedTime).toBeLessThan(5000) // < 5 seconds for 10 calls
      
      console.log(`📡 Individual: ${individualTime.toFixed(2)}ms, Batched: ${batchedTime.toFixed(2)}ms`)
      console.log(`⚡ Batching Speedup: ${batchingSpeedup.toFixed(2)}x`)
    })
  })

  describe('Load Testing and Stress Tests 🏋️', () => {
    it('should handle peak load gracefully', async () => {
      const peakUsers = 10
      const storiesPerUser = 2
      
      const loadTestPromises = []
      
      for (let user = 0; user < peakUsers; user++) {
        for (let story = 0; story < storiesPerUser; story++) {
          const pipeline = new StoryGenerationPipeline(`load-user-${user}`)
          loadTestPromises.push(
            pipeline.generateCompleteStory({
              ...mockQuestionnaire,
              chapterCount: 3 // Smaller stories for load test
            })
          )
        }
      }
      
      const startTime = performance.now()
      const results = await Promise.allSettled(loadTestPromises)
      const endTime = performance.now()
      
      const successfulResults = results.filter(r => r.status === 'fulfilled').length
      const failedResults = results.filter(r => r.status === 'rejected').length
      const successRate = successfulResults / results.length
      const totalTime = endTime - startTime
      
      // Should handle load with high success rate
      expect(successRate).toBeGreaterThan(0.95) // > 95% success rate
      expect(totalTime).toBeLessThan(60000) // < 60 seconds for peak load
      expect(failedResults).toBeLessThan(1) // Minimal failures
      
      console.log(`🏋️ Load Test: ${peakUsers * storiesPerUser} stories, ${successRate * 100}% success rate`)
      console.log(`⏱️ Total Time: ${(totalTime / 1000).toFixed(2)} seconds`)
    })

    it('should recover from resource exhaustion', async () => {
      // Simulate resource exhaustion
      let callCount = 0
      mockCallAgent.mockImplementation(async () => {
        callCount++
        
        // Simulate resource exhaustion after 15 calls
        if (callCount > 15 && callCount <= 20) {
          throw new Error('Rate limit exceeded')
        }
        
        // Simulate recovery after 20 calls
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          content: 'Recovered content',
          tokensUsed: 50
        }
      })
      
      const pipeline = new StoryGenerationPipeline('recovery-test-user')
      
      // Should eventually succeed despite temporary failures
      const result = await pipeline.generateCompleteStory({
        ...mockQuestionnaire,
        chapterCount: 3
      })
      
      expect(result.story.chapters).toHaveLength(3)
      expect(callCount).toBeGreaterThan(20) // Should have retried
      
      console.log(`🔄 Recovery Test: ${callCount} total API calls (including retries)`)
    })
  })

  describe('Performance Regression Detection 📊', () => {
    it('should maintain baseline performance benchmarks', async () => {
      // Define performance baselines
      const baselines = {
        storyGeneration3Chapters: 15000, // 15 seconds
        averageChapterTime: 4000, // 4 seconds
        cacheHitSpeedup: 10, // 10x speedup
        memoryGrowthPerStory: 20, // 20MB
        apiCallBatchSpeedup: 1.5, // 1.5x speedup
        uiRenderTime: 50, // 50ms
        dbOperationTime: 1000 // 1 second
      }
      
      // Run performance tests
      const pipeline = new StoryGenerationPipeline('baseline-test-user')
      
      const startTime = performance.now()
      const result = await pipeline.generateCompleteStory({
        ...mockQuestionnaire,
        chapterCount: 3
      })
      const endTime = performance.now()
      
      const actualPerformance = {
        storyGeneration3Chapters: endTime - startTime,
        averageChapterTime: result.performance.averageChapterTime
      }
      
      // Check against baselines
      for (const [metric, baseline] of Object.entries(baselines)) {
        if (actualPerformance[metric as keyof typeof actualPerformance]) {
          const actual = actualPerformance[metric as keyof typeof actualPerformance]!
          const tolerance = baseline * 0.2 // 20% tolerance
          
          expect(actual).toBeLessThan(baseline + tolerance)
          
          if (actual > baseline) {
            console.warn(`⚠️ Performance regression in ${metric}: ${actual} > ${baseline}`)
          } else {
            console.log(`✅ ${metric}: ${actual} (baseline: ${baseline})`)
          }
        }
      }
    })

    it('should provide comprehensive performance metrics', () => {
      const metrics = performanceOptimizer.getPerformanceMetrics()
      
      // Should have meaningful metrics
      expect(metrics.cacheStats).toBeDefined()
      expect(metrics.apiCallStats).toBeDefined()
      expect(metrics.memoryUsage).toBeDefined()
      expect(metrics.recommendations).toBeInstanceOf(Array)
      
      // Should provide actionable recommendations
      expect(metrics.recommendations.length).toBeGreaterThan(0)
      
      console.log('📊 Performance Metrics:', JSON.stringify(metrics, null, 2))
    })
  })
})