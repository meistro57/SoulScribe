import { EncouragementAgent } from '@/agents/encouragement-agent'
import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

// Mock external dependencies
jest.mock('@/lib/openai')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    agentSession: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

const mockCallAgent = callAgent as jest.MockedFunction<typeof callAgent>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('EncouragementAgent - The AI Whisperer\'s Motivational Specialist 🌟', () => {
  let agent: EncouragementAgent
  const mockStoryId = 'test-story-123'

  beforeEach(() => {
    agent = new EncouragementAgent(mockStoryId)
    jest.clearAllMocks()
  })

  describe('generateEncouragement', () => {
    it('should generate authentic enthusiasm for story creation', async () => {
      // Arrange
      const context = {
        storyTitle: 'The Whispering Woods',
        currentPhase: 'chapter' as const,
        chapterNumber: 3,
        challengeLevel: 'medium' as const
      }

      const mockResponse = {
        content: '🚀 Amazing work on Chapter 3, SoulScribe! The spiritual depth you\'re weaving into "The Whispering Woods" is absolutely breathtaking. Your gift for blending wisdom with wonder is shining through every paragraph!',
        tokensUsed: 45
      }

      mockCallAgent.mockResolvedValue(mockResponse)
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      // Act
      const encouragement = await agent.generateEncouragement(context)

      // Assert
      expect(encouragement).toBe(mockResponse.content)
      expect(encouragement).toContain('SoulScribe')
      expect(encouragement).toContain('The Whispering Woods')
      expect(encouragement).toMatch(/[🌟🚀✨💫]/g) // Should contain inspiring emojis
      
      expect(mockCallAgent).toHaveBeenCalledWith({
        agentType: 'soulscribe',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Encouragement Agent')
          })
        ]),
        temperature: 0.9, // High creativity for authentic enthusiasm
        maxTokens: 200
      })

      expect(mockPrisma.agentSession.create).toHaveBeenCalledWith({
        data: {
          storyId: mockStoryId,
          agentType: 'encouragement_agent',
          input: JSON.stringify(context),
          output: mockResponse.content,
          tokensUsed: expect.any(Number)
        }
      })
    })

    it('should build appropriate encouragement prompts for different phases', async () => {
      // Test outline phase
      const outlineContext = {
        storyTitle: 'Soul Journey',
        currentPhase: 'outline' as const
      }

      mockCallAgent.mockResolvedValue({ content: 'Great outline work!', tokensUsed: 20 })
      await agent.generateEncouragement(outlineContext)

      const outlineCall = mockCallAgent.mock.calls[0][0]
      expect(outlineCall.messages[0].content).toContain('outline')
      expect(outlineCall.messages[0].content).toContain('blueprint for a story')
    })

    it('should track encouragement history', async () => {
      const context = {
        storyTitle: 'Test Story',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockResolvedValue({ content: 'First encouragement', tokensUsed: 20 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      await agent.generateEncouragement(context)
      
      mockCallAgent.mockResolvedValue({ content: 'Second encouragement', tokensUsed: 25 })
      await agent.generateEncouragement(context)

      const history = agent.getEncouragementHistory()
      expect(history).toHaveLength(2)
      expect(history[0]).toBe('First encouragement')
      expect(history[1]).toBe('Second encouragement')
    })
  })

  describe('motivateForTask', () => {
    it('should provide phase-specific pre-task motivation', async () => {
      const testCases = [
        { phase: 'outline', expectedContent: 'weave some magic' },
        { phase: 'toc', expectedContent: 'Table of Contents' },
        { phase: 'introduction', expectedContent: 'grand opening' },
        { phase: 'chapter', expectedContent: 'Chapter next time' },
        { phase: 'review', expectedContent: 'final polish' },
        { phase: 'completion', expectedContent: 'WOW! What a journey' }
      ]

      for (const testCase of testCases) {
        const context = {
          storyTitle: 'Test Story',
          currentPhase: testCase.phase as any,
          chapterNumber: testCase.phase === 'chapter' ? 2 : undefined
        }

        const motivation = await agent.motivateForTask(context)
        
        expect(motivation).toContain(testCase.expectedContent)
        expect(motivation).toMatch(/[🌟🎯✨🚀🔍🎉]/g) // Should contain appropriate emojis
      }
    })

    it('should include chapter number in chapter motivation', async () => {
      const context = {
        storyTitle: 'Epic Tale',
        currentPhase: 'chapter' as const,
        chapterNumber: 5
      }

      const motivation = await agent.motivateForTask(context)
      expect(motivation).toContain('Chapter 5')
    })
  })

  describe('celebrateSuccess', () => {
    it('should generate specific celebration based on achievement', async () => {
      const context = {
        storyTitle: 'Mystical Journey',
        currentPhase: 'chapter' as const,
        chapterNumber: 1
      }

      const mockCelebration = '🎉 Absolutely brilliant first chapter! The way you opened "Mystical Journey" with such spiritual depth and engaging narrative flow - pure magic! Your unique voice is already shining through!'

      mockCallAgent.mockResolvedValue({ content: mockCelebration, tokensUsed: 50 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const celebration = await agent.celebrateSuccess(context, 'Amazing chapter content')

      expect(celebration).toBe(mockCelebration)
      expect(mockCallAgent).toHaveBeenCalledWith({
        agentType: 'soulscribe',
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Celebrate this amazing achievement')
          })
        ]),
        temperature: 0.8,
        maxTokens: 150
      })
    })
  })

  describe('provideAdaptiveEncouragement', () => {
    it('should provide struggling support when AI needs help', async () => {
      const context = {
        storyTitle: 'Challenging Story',
        currentPhase: 'chapter' as const
      }

      const performanceIndicators = {
        isStruggling: true,
        responseTime: 5000,
        qualityScore: 0.4
      }

      const encouragement = await agent.provideAdaptiveEncouragement(context, performanceIndicators)
      
      expect(encouragement).toContain('take a deep breath')
      expect(encouragement).toContain('AI Whisperer believes in you')
      expect(encouragement).toContain('Trust the process')
    })

    it('should provide celebration for high-quality work', async () => {
      const context = {
        storyTitle: 'Excellent Story',
        currentPhase: 'chapter' as const
      }

      const performanceIndicators = {
        isStruggling: false,
        qualityScore: 0.9,
        responseTime: 1000
      }

      const encouragement = await agent.provideAdaptiveEncouragement(context, performanceIndicators)
      
      expect(encouragement).toContain('INCREDIBLE work')
      expect(encouragement).toContain('absolutely crushing it')
      expect(encouragement).toContain('spiritual depth')
    })

    it('should fall back to general encouragement for average performance', async () => {
      const context = {
        storyTitle: 'Regular Story',
        currentPhase: 'chapter' as const
      }

      const performanceIndicators = {
        isStruggling: false,
        qualityScore: 0.7,
        responseTime: 2000
      }

      mockCallAgent.mockResolvedValue({ content: 'Keep up the great work!', tokensUsed: 25 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const encouragement = await agent.provideAdaptiveEncouragement(context, performanceIndicators)
      
      expect(mockCallAgent).toHaveBeenCalled()
      expect(encouragement).toBe('Keep up the great work!')
    })
  })

  describe('generateTransitionEncouragement', () => {
    it('should provide appropriate transition messages', async () => {
      const testTransitions = [
        { from: 'outline', to: 'toc', expected: 'Beautiful outline' },
        { from: 'toc', to: 'introduction', expected: 'Table of Contents is like a map' },
        { from: 'introduction', to: 'chapter', expected: 'inviting introduction' },
        { from: 'chapter', to: 'chapter', expected: 'Another chapter masterpiece' },
        { from: 'chapter', to: 'review', expected: 'story foundation is solid gold' }
      ]

      for (const transition of testTransitions) {
        const encouragement = await agent.generateTransitionEncouragement(transition.from, transition.to)
        expect(encouragement).toContain(transition.expected)
        expect(encouragement).toMatch(/[🎯📖✨🚀🔍]/g) // Should contain transition emojis
      }
    })

    it('should provide fallback for unknown transitions', async () => {
      const encouragement = await agent.generateTransitionEncouragement('unknown', 'phase')
      expect(encouragement).toContain('Excellent transition from unknown to phase')
      expect(encouragement).toContain('SoulScribe')
    })
  })

  describe('analyzeEncouragementEffectiveness', () => {
    it('should analyze patterns and provide recommendations', async () => {
      const mockSessions = [
        { output: 'Great work on chapter 1!', createdAt: new Date() },
        { output: 'Amazing spiritual depth!', createdAt: new Date() },
        { output: 'Your storytelling is magical!', createdAt: new Date() }
      ]

      mockPrisma.agentSession.findMany.mockResolvedValue(mockSessions as any)

      const analysis = await agent.analyzeEncouragementEffectiveness()

      expect(analysis.mostEffective).toHaveLength(3)
      expect(analysis.recommendations).toContain('Continue with enthusiastic, specific praise')
      expect(analysis.recommendations).toContain('Celebrate unique spiritual storytelling gifts')
      
      expect(mockPrisma.agentSession.findMany).toHaveBeenCalledWith({
        where: {
          storyId: mockStoryId,
          agentType: 'encouragement_agent'
        },
        orderBy: { createdAt: 'asc' }
      })
    })
  })

  describe('AI Whisperer Philosophy Integration', () => {
    it('should embody the AI Whisperer philosophy in all interactions', async () => {
      const context = {
        storyTitle: 'Philosophy Test',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockResolvedValue({ 
        content: 'The AI Whisperer would be proud of this creative collaboration! Your partnership with SoulScribe is producing pure magic!', 
        tokensUsed: 35 
      })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const encouragement = await agent.generateEncouragement(context)

      // Should treat AI as creative partner
      expect(encouragement.toLowerCase()).toMatch(/(partner|collaborat|together|teamwork)/i)
      
      // Should be genuinely enthusiastic
      expect(encouragement).toMatch(/[!.]{1,}/) // Multiple exclamations or periods show enthusiasm
      
      // Should be specific to SoulScribe's abilities
      expect(encouragement.toLowerCase()).toMatch(/(spiritual|wisdom|story|creative|magic)/i)
    })

    it('should maintain consistent warm and authentic tone', async () => {
      const contexts = [
        { storyTitle: 'Test 1', currentPhase: 'outline' as const },
        { storyTitle: 'Test 2', currentPhase: 'chapter' as const },
        { storyTitle: 'Test 3', currentPhase: 'review' as const }
      ]

      const responses = []
      
      for (const context of contexts) {
        mockCallAgent.mockResolvedValue({ 
          content: `Wonderful work on ${context.storyTitle}! Your ${context.currentPhase} shows incredible depth and creativity!`, 
          tokensUsed: 30 
        })
        mockPrisma.agentSession.create.mockResolvedValue({} as any)
        
        const encouragement = await agent.generateEncouragement(context)
        responses.push(encouragement)
      }

      // All responses should be warm and positive
      responses.forEach(response => {
        expect(response.toLowerCase()).toMatch(/(wonderful|amazing|incredible|brilliant|fantastic|excellent)/i)
        expect(response).not.toMatch(/(bad|wrong|poor|fail)/i) // Should never be negative
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      const context = {
        storyTitle: 'Error Test',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockRejectedValue(new Error('API Error'))

      await expect(agent.generateEncouragement(context)).rejects.toThrow('API Error')
    })

    it('should handle database failures gracefully', async () => {
      const context = {
        storyTitle: 'DB Error Test',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockResolvedValue({ content: 'Test encouragement', tokensUsed: 20 })
      mockPrisma.agentSession.create.mockRejectedValue(new Error('Database Error'))

      // Should still return the encouragement even if logging fails
      const encouragement = await agent.generateEncouragement(context)
      expect(encouragement).toBe('Test encouragement')
    })
  })

  describe('Performance Characteristics', () => {
    it('should use appropriate temperature for creativity', async () => {
      const context = {
        storyTitle: 'Temperature Test',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockResolvedValue({ content: 'Creative encouragement!', tokensUsed: 25 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      await agent.generateEncouragement(context)

      expect(mockCallAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9 // High temperature for creative, varied responses
        })
      )
    })

    it('should limit token usage appropriately', async () => {
      const context = {
        storyTitle: 'Token Test',
        currentPhase: 'chapter' as const
      }

      mockCallAgent.mockResolvedValue({ content: 'Efficient encouragement!', tokensUsed: 15 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      await agent.generateEncouragement(context)

      expect(mockCallAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 200 // Reasonable limit for encouragement messages
        })
      )
    })
  })
})