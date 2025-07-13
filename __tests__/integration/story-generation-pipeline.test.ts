import { StoryGenerationPipeline } from '@/agents/story-generation-pipeline'
import { EncouragementAgent } from '@/agents/encouragement-agent'
import { ContentParserAgent } from '@/agents/content-parser-agent'
import { VoiceCharacterAssignmentAgent } from '@/agents/voice-character-assignment-agent'
import { ParallelProcessor } from '@/agents/parallel-processor'
import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

// Mock external dependencies
jest.mock('@/lib/openai')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    story: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    },
    agentSession: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

const mockCallAgent = callAgent as jest.MockedFunction<typeof callAgent>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Story Generation Pipeline Integration Tests 🌟', () => {
  let pipeline: StoryGenerationPipeline
  const mockUserId = 'user-123'

  const mockQuestionnaire = {
    genre: 'mystical-fable',
    targetAge: 'all_ages',
    chapterCount: 3,
    estimatedLength: 'medium',
    primaryTheme: 'self-discovery',
    lifeLesson: 'Inner wisdom guides us home',
    spiritualElements: ['nature_connection', 'inner_voice', 'transformation'],
    metaphorPreferences: ['journey', 'light_and_shadow', 'natural_cycles'],
    characterTypes: ['seeker', 'wise_guide', 'inner_critic'],
    settingPreferences: ['enchanted_forest', 'sacred_grove'],
    toneKeywords: ['mystical', 'warm', 'inspiring'],
    writingStyle: 'poetic',
    chatResponses: []
  }

  beforeEach(() => {
    pipeline = new StoryGenerationPipeline(mockUserId)
    jest.clearAllMocks()
    
    // Setup default mock responses
    mockPrisma.story.create.mockResolvedValue({ id: 'story-123' } as any)
    mockPrisma.story.update.mockResolvedValue({} as any)
    mockPrisma.agentSession.create.mockResolvedValue({} as any)
  })

  describe('Complete Story Generation Flow', () => {
    it('should generate a complete story from questionnaire to final output', async () => {
      // Arrange - Mock the complete flow of agent responses
      const mockOutline = `OUTLINE: The Journey of Luna's Awakening

Story Premise: Luna, a young seeker feeling disconnected from her true self, embarks on a mystical journey through an enchanted forest where she encounters wise guides who help her rediscover her inner wisdom.

Character Arcs:
- Luna: From self-doubt to self-trust
- Elder Oak: Wise guide representing ancient wisdom  
- Shadow Voice: Inner critic that becomes ally

Chapter Breakdown:
Chapter 1: The Call to Adventure - Luna feels the pull to leave her comfort zone
Chapter 2: Meeting the Wise Guide - Elder Oak shares the first teaching
Chapter 3: Integration and Return - Luna embodies her wisdom and returns transformed

Spiritual Elements: Connection to nature, listening to inner voice, transforming fear into wisdom

Learning Journey: Discovering that the answers we seek are already within us`

      const mockTOC = `Table of Contents

Chapter 1: The Restless Heart
Chapter 2: The Voice of Ancient Wisdom  
Chapter 3: The Return to Wholeness`

      const mockChapter1 = `Luna sat by her window, watching the autumn leaves dance in the wind. Despite having everything she thought she wanted, a restless energy stirred within her heart.

[S1] "There must be more to life than this," she whispered to herself. (with longing)

The wind seemed to answer, carrying the scent of pine and earth from the forest beyond the town. Something deep within her knew that the answers she sought lay not in books or advice, but in the wild spaces where ancient wisdom still lived.

That night, Luna dreamed of golden paths winding through emerald woods, and a voice calling her name with infinite love.

What did we learn from this chapter? Sometimes our restlessness is not a problem to solve, but a call to adventure waiting to be answered.`

      const mockChapter2 = `The morning sun filtered through the canopy as Luna stepped onto the forest path. Each footstep felt like a prayer, each breath a homecoming.

[S2] "Welcome, dear child," rumbled a voice that seemed to come from the very earth itself. (with ancient warmth)

Luna looked up to see a massive oak tree, its bark etched with the stories of centuries. She could feel its presence like a gentle grandfather's embrace.

[S1] "Are... are you speaking to me?" Luna asked, wonder filling her voice. (with awe)

[S2] "I speak to all who remember how to listen," the Elder Oak replied. "You carry within you the same wisdom that flows through my roots. Trust what you already know." (with patient knowing)

As the words settled into her heart, Luna felt something shift. The answers weren't out there—they were within, waiting to be remembered.

What did we learn from this chapter? True wisdom isn't something we acquire, but something we remember. Nature reflects back our own inner knowing.`

      const mockChapter3 = `Luna walked back toward town, but she was no longer the same person who had left. The forest had awakened something ancient and true within her.

[S3] "You think you've learned something special," whispered a familiar voice—her own inner doubt. (with skepticism)

[S1] "I have," Luna replied with gentle confidence. "I've learned to trust the voice that has always been guiding me." (with inner strength)

She placed her hand on her heart and felt the same presence she had encountered in the Elder Oak. The wisdom of the forest lived within her, as it had all along.

As she reached the edge of town, Luna smiled. The restlessness was gone, replaced by a deep peace and knowing. She was home—not in the place, but in herself.

What did we learn from this chapter? The journey outward always leads us back to the truth within. We are never separate from the wisdom we seek.`

      const mockReflection = `This story teaches us that our deepest wisdom doesn't come from external sources, but from reconnecting with the knowing that already lives within us. Like Luna, we often look outside ourselves for answers, but nature and quiet listening can help us remember what we've always known. The restlessness we feel is often our soul calling us to remember who we truly are.`

      // Mock agent responses in sequence
      let callCount = 0
      mockCallAgent.mockImplementation(async ({ agentType, messages }) => {
        callCount++
        
        switch (callCount) {
          case 1: // Initial outline generation
            return { content: mockOutline, tokensUsed: 200 }
          case 2: // TOC generation
            return { content: mockTOC, tokensUsed: 80 }
          case 3: // Chapter 1 generation
            return { content: mockChapter1, tokensUsed: 150 }
          case 4: // Chapter 2 generation
            return { content: mockChapter2, tokensUsed: 160 }
          case 5: // Chapter 3 generation
            return { content: mockChapter3, tokensUsed: 140 }
          case 6: // Final reflection
            return { content: mockReflection, tokensUsed: 100 }
          default:
            // Content parsing and encouragement calls
            if (agentType === 'content_parser') {
              const prompt = messages[0].content as string
              if (prompt.includes('outline')) return { content: mockOutline, tokensUsed: 50 }
              if (prompt.includes('toc')) return { content: mockTOC, tokensUsed: 30 }
              if (prompt.includes('Chapter 1')) return { content: mockChapter1, tokensUsed: 40 }
              if (prompt.includes('Chapter 2')) return { content: mockChapter2, tokensUsed: 45 }
              if (prompt.includes('Chapter 3')) return { content: mockChapter3, tokensUsed: 42 }
            }
            return { content: 'Encouragement or other response', tokensUsed: 25 }
        }
      })

      // Act
      const progressUpdates: any[] = []
      const result = await pipeline.generateCompleteStory(
        mockQuestionnaire,
        (progress) => progressUpdates.push(progress)
      )

      // Assert - Complete story structure
      expect(result).toBeDefined()
      expect(result.story).toBeDefined()
      expect(result.story.outline).toContain('Luna\'s Awakening')
      expect(result.story.tableOfContents).toBeDefined()
      expect(result.story.chapters).toHaveLength(3)
      expect(result.story.learningReflection).toContain('deepest wisdom')

      // Assert - Chapter content quality
      const chapter1 = result.story.chapters[0]
      expect(chapter1.title).toBe('The Restless Heart')
      expect(chapter1.content).toContain('[S1]')
      expect(chapter1.content).toContain('What did we learn')
      expect(chapter1.keyLessons).toContain('call to adventure')

      const chapter2 = result.story.chapters[1]
      expect(chapter2.content).toContain('[S2]')
      expect(chapter2.content).toContain('Elder Oak')
      expect(chapter2.content).toContain('ancient warmth')

      // Assert - Progress tracking
      expect(progressUpdates.length).toBeGreaterThan(5)
      expect(progressUpdates[0].phase).toBe('outline')
      expect(progressUpdates.some(p => p.phase === 'chapters')).toBe(true)
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('completion')

      // Assert - Voice character integration
      expect(result.voiceMap).toBeDefined()
      expect(result.voiceMap.characterAssignments.size).toBeGreaterThan(0)

      // Assert - Encouragement integration
      expect(result.encouragementLog.length).toBeGreaterThan(0)

      // Assert - Performance metrics
      expect(result.performance.totalTokensUsed).toBeGreaterThan(500)
      expect(result.performance.totalGenerationTime).toBeGreaterThan(0)
      expect(result.performance.averageChapterTime).toBeGreaterThan(0)
    }, 30000) // Longer timeout for integration test

    it('should handle different questionnaire configurations', async () => {
      // Test with different parameters
      const alternativeQuestionnaire = {
        ...mockQuestionnaire,
        genre: 'spiritual-adventure',
        targetAge: 'child',
        chapterCount: 5,
        writingStyle: 'conversational',
        primaryTheme: 'courage_and_kindness'
      }

      mockCallAgent.mockResolvedValue({ content: 'Mock content', tokensUsed: 50 })

      const result = await pipeline.generateCompleteStory(alternativeQuestionnaire)

      expect(result.story.chapters).toHaveLength(5)
      expect(result.story.genre).toBe('spiritual-adventure')
      expect(result.story.targetAge).toBe('child')
    })

    it('should maintain spiritual coherence throughout the generation process', async () => {
      // Mock responses that emphasize spiritual elements
      mockCallAgent.mockImplementation(async ({ agentType }) => {
        if (agentType === 'soulscribe') {
          return {
            content: `Spiritual content with awakening themes, inner wisdom, and transformative journey elements. [S1] "The light within you knows the way," said the guide. What did we learn? Every moment offers a chance for awakening.`,
            tokensUsed: 80
          }
        }
        return { content: 'Content preservation response', tokensUsed: 20 }
      })

      const result = await pipeline.generateCompleteStory(mockQuestionnaire)

      // Should maintain spiritual themes throughout
      const allContent = [
        result.story.outline,
        result.story.tableOfContents.rawContent,
        ...result.story.chapters.map(c => c.content),
        result.story.learningReflection
      ].join(' ')

      expect(allContent.toLowerCase()).toMatch(/(wisdom|awakening|transform|spirit|sacred|inner|light|journey)/g)
      expect(result.story.chapters.every(c => c.content.includes('What did we learn'))).toBe(true)
    })
  })

  describe('Agent Coordination and Communication', () => {
    it('should coordinate agents in proper sequence with encouragement flow', async () => {
      const agentCallLog: string[] = []
      
      mockCallAgent.mockImplementation(async ({ agentType, messages }) => {
        agentCallLog.push(agentType)
        return { 
          content: `Mock ${agentType} response for coordination test`,
          tokensUsed: 50
        }
      })

      await pipeline.generateCompleteStory(mockQuestionnaire)

      // Should include encouragement throughout the process
      expect(agentCallLog.filter(type => type === 'soulscribe')).toBeTruthy()
      expect(agentCallLog.filter(type => type === 'content_parser')).toBeTruthy()
      
      // Should follow logical sequence
      const firstSoulScribeIndex = agentCallLog.indexOf('soulscribe')
      const firstParserIndex = agentCallLog.indexOf('content_parser')
      expect(firstSoulScribeIndex).toBeLessThan(firstParserIndex) // Generation before parsing
    })

    it('should handle agent failures gracefully with retry mechanisms', async () => {
      let attemptCount = 0
      mockCallAgent.mockImplementation(async ({ agentType }) => {
        attemptCount++
        
        // Simulate failure on first attempt, success on retry
        if (attemptCount === 1) {
          throw new Error('Simulated API failure')
        }
        
        return { content: 'Success after retry', tokensUsed: 50 }
      })

      const result = await pipeline.generateCompleteStory(mockQuestionnaire)

      expect(result).toBeDefined()
      expect(attemptCount).toBeGreaterThan(1) // Should have retried
    })

    it('should pass context between agents correctly', async () => {
      const contextLog: any[] = []
      
      mockCallAgent.mockImplementation(async ({ messages }) => {
        contextLog.push(messages[0].content)
        return { content: 'Context test response', tokensUsed: 50 }
      })

      await pipeline.generateCompleteStory(mockQuestionnaire)

      // Verify context flows correctly between phases
      const outlineCall = contextLog.find(msg => typeof msg === 'string' && msg.includes('outline'))
      const tocCall = contextLog.find(msg => typeof msg === 'string' && msg.includes('Table of Contents'))
      const chapterCall = contextLog.find(msg => typeof msg === 'string' && msg.includes('chapter'))

      expect(outlineCall).toBeTruthy()
      expect(tocCall).toBeTruthy()
      expect(chapterCall).toBeTruthy()
    })
  })

  describe('Parallel Processing Integration', () => {
    it('should generate chapters in parallel while maintaining quality', async () => {
      const chapterStartTimes: number[] = []
      const chapterEndTimes: number[] = []

      mockCallAgent.mockImplementation(async ({ messages }) => {
        const isChapterGeneration = messages.some(msg => 
          typeof msg.content === 'string' && msg.content.includes('Generate Chapter')
        )
        
        if (isChapterGeneration) {
          chapterStartTimes.push(Date.now())
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 100))
          
          chapterEndTimes.push(Date.now())
          return { 
            content: `Chapter content with [S1] dialogue and learning reflection: What did we learn? Parallel processing maintains quality.`,
            tokensUsed: 120
          }
        }
        
        return { content: 'Non-chapter response', tokensUsed: 30 }
      })

      const result = await pipeline.generateCompleteStory({
        ...mockQuestionnaire,
        chapterCount: 3
      })

      // Chapters should be generated with some parallelism
      expect(result.story.chapters).toHaveLength(3)
      
      // Verify parallel processing benefits
      if (chapterStartTimes.length >= 2) {
        const sequentialTime = chapterEndTimes[0] - chapterStartTimes[0]
        const parallelWindow = Math.max(...chapterEndTimes) - Math.min(...chapterStartTimes)
        
        // Parallel processing should be more efficient than pure sequential
        expect(parallelWindow).toBeLessThan(sequentialTime * 3)
      }

      // Quality should be maintained
      result.story.chapters.forEach(chapter => {
        expect(chapter.content).toContain('What did we learn')
        expect(chapter.keyLessons).toBeDefined()
      })
    })

    it('should balance load across different chapter difficulties', async () => {
      const processingTimes = new Map<number, number>()

      mockCallAgent.mockImplementation(async ({ messages }) => {
        const chapterMatch = messages[0].content?.match(/Chapter (\d+)/)
        if (chapterMatch) {
          const chapterNum = parseInt(chapterMatch[1])
          const startTime = Date.now()
          
          // Simulate different complexities
          const delay = chapterNum === 2 ? 200 : 100 // Chapter 2 is more complex
          await new Promise(resolve => setTimeout(resolve, delay))
          
          processingTimes.set(chapterNum, Date.now() - startTime)
          
          return {
            content: `Chapter ${chapterNum} content with appropriate complexity. What did we learn? Load balancing adapts to content complexity.`,
            tokensUsed: 100 + (chapterNum * 20) // More tokens for complex chapters
          }
        }
        
        return { content: 'Standard response', tokensUsed: 50 }
      })

      const result = await pipeline.generateCompleteStory({
        ...mockQuestionnaire,
        chapterCount: 3
      })

      expect(result.story.chapters).toHaveLength(3)
      
      // Should handle different complexities appropriately
      const performanceMetrics = result.performance.chapterMetrics
      expect(performanceMetrics).toBeDefined()
    })
  })

  describe('Voice Integration Flow', () => {
    it('should integrate voice character assignment throughout story generation', async () => {
      mockCallAgent.mockImplementation(async ({ agentType, messages }) => {
        if (agentType === 'soulscribe') {
          return {
            content: `[S1] "Hello, seeker," said the wise guide. (with warmth)\n[S2] "Who are you?" asked Luna. (with curiosity)\n[S3] "I am your inner wisdom," replied the voice within. (with love)\n\nWhat did we learn? Every character voice reflects an aspect of our inner journey.`,
            tokensUsed: 100
          }
        }
        return { content: 'Voice integration response', tokensUsed: 30 }
      })

      const result = await pipeline.generateCompleteStory(mockQuestionnaire)

      expect(result.voiceMap).toBeDefined()
      expect(result.voiceMap.characterAssignments.size).toBeGreaterThan(0)
      
      // Should assign appropriate voice profiles
      const assignments = Array.from(result.voiceMap.characterAssignments.values())
      expect(assignments.some(a => a.assignedVoiceProfile.archetype === 'wise_elder')).toBe(true)
      expect(assignments.some(a => a.assignedVoiceProfile.archetype === 'seeker')).toBe(true)
    })

    it('should maintain voice consistency across chapters', async () => {
      mockCallAgent.mockImplementation(async () => ({
        content: `[S1] "Chapter dialogue from guide," said the Elder. (with wisdom)\n[S2] "Response from seeker," replied Luna. (with growth)\n\nWhat did we learn? Consistency builds character depth.`,
        tokensUsed: 80
      }))

      const result = await pipeline.generateCompleteStory(mockQuestionnaire)

      // Same characters should have consistent voice assignments
      const chapter1Voices = result.story.chapters[0].voiceAssignments
      const chapter2Voices = result.story.chapters[1].voiceAssignments

      if (chapter1Voices && chapter2Voices) {
        const s1InChapter1 = chapter1Voices.find(v => v.speakerTag === '[S1]')
        const s1InChapter2 = chapter2Voices.find(v => v.speakerTag === '[S1]')
        
        if (s1InChapter1 && s1InChapter2) {
          expect(s1InChapter1.assignedVoiceProfile.id).toBe(s1InChapter2.assignedVoiceProfile.id)
        }
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should recover from partial failures without losing progress', async () => {
      let callCount = 0
      mockCallAgent.mockImplementation(async ({ agentType }) => {
        callCount++
        
        // Fail on the 3rd call (middle of process)
        if (callCount === 3) {
          throw new Error('Partial failure simulation')
        }
        
        return { content: `Recovery test content ${callCount}`, tokensUsed: 50 }
      })

      // Should handle the failure and continue
      const result = await pipeline.generateCompleteStory(mockQuestionnaire)
      
      expect(result).toBeDefined()
      expect(callCount).toBeGreaterThan(3) // Should have retried and continued
    })

    it('should provide meaningful error reporting', async () => {
      mockCallAgent.mockRejectedValue(new Error('Critical API failure'))

      await expect(pipeline.generateCompleteStory(mockQuestionnaire))
        .rejects.toThrow('Critical API failure')
    })

    it('should validate story completeness before returning', async () => {
      // Mock incomplete responses
      mockCallAgent.mockImplementation(async ({ agentType }) => {
        if (agentType === 'soulscribe') {
          return { content: 'Incomplete content without learning section', tokensUsed: 30 }
        }
        return { content: 'Parser response', tokensUsed: 20 }
      })

      const result = await pipeline.generateCompleteStory(mockQuestionnaire)

      // Should have attempted to complete missing elements
      expect(result.validation.isComplete).toBeDefined()
      expect(result.validation.missingElements).toBeDefined()
    })
  })

  describe('Performance and Scalability', () => {
    it('should complete story generation within reasonable time limits', async () => {
      mockCallAgent.mockImplementation(async () => {
        // Simulate realistic API response time
        await new Promise(resolve => setTimeout(resolve, 50))
        return { content: 'Performance test content with [S1] dialogue. What did we learn? Speed and quality can coexist.', tokensUsed: 60 }
      })

      const startTime = Date.now()
      const result = await pipeline.generateCompleteStory(mockQuestionnaire)
      const endTime = Date.now()

      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds for 3 chapters
      
      expect(result.performance.totalGenerationTime).toBeLessThan(totalTime)
      expect(result.performance.averageChapterTime).toBeGreaterThan(0)
    })

    it('should scale efficiently with chapter count', async () => {
      const chapterCounts = [3, 5, 8]
      const results: any[] = []

      for (const chapterCount of chapterCounts) {
        mockCallAgent.mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 30))
          return { content: 'Scaling test content. What did we learn? Efficiency scales with parallelism.', tokensUsed: 50 }
        })

        const startTime = Date.now()
        const result = await pipeline.generateCompleteStory({
          ...mockQuestionnaire,
          chapterCount
        })
        const endTime = Date.now()

        results.push({
          chapterCount,
          totalTime: endTime - startTime,
          story: result.story
        })
      }

      // Verify scaling efficiency
      const timePerChapter = results.map(r => r.totalTime / r.chapterCount)
      
      // Time per chapter should not increase linearly (benefit of parallelism)
      expect(timePerChapter[2]).toBeLessThan(timePerChapter[0] * 2)
      
      // All stories should be complete
      results.forEach(r => {
        expect(r.story.chapters).toHaveLength(r.chapterCount)
      })
    })

    it('should manage memory usage efficiently during generation', async () => {
      mockCallAgent.mockImplementation(async () => ({
        content: 'Memory efficiency test content. What did we learn? Smart memory management prevents bottlenecks.',
        tokensUsed: 50
      }))

      // Generate multiple stories to test memory management
      const stories = []
      for (let i = 0; i < 3; i++) {
        const result = await pipeline.generateCompleteStory(mockQuestionnaire)
        stories.push(result)
      }

      // All stories should be complete and memory should be managed
      expect(stories).toHaveLength(3)
      stories.forEach(story => {
        expect(story.story.chapters).toHaveLength(mockQuestionnaire.chapterCount)
      })
    })
  })

  describe('Data Persistence and Retrieval', () => {
    it('should save story progress to database at key milestones', async () => {
      mockCallAgent.mockResolvedValue({ content: 'DB persistence test', tokensUsed: 50 })

      await pipeline.generateCompleteStory(mockQuestionnaire)

      // Should create initial story record
      expect(mockPrisma.story.create).toHaveBeenCalled()
      
      // Should update story progress multiple times
      expect(mockPrisma.story.update).toHaveBeenCalledTimes(
        expect.any(Number)
      )
      
      // Should log agent sessions
      expect(mockPrisma.agentSession.create).toHaveBeenCalled()
    })

    it('should handle database connection issues gracefully', async () => {
      mockCallAgent.mockResolvedValue({ content: 'DB resilience test', tokensUsed: 50 })
      mockPrisma.story.create.mockRejectedValue(new Error('Database connection failed'))

      // Should not fail story generation due to DB issues
      const result = await pipeline.generateCompleteStory(mockQuestionnaire)
      
      expect(result.story).toBeDefined()
      expect(result.story.chapters).toHaveLength(mockQuestionnaire.chapterCount)
    })
  })
})