import { ContentParserAgent } from '@/agents/content-parser-agent'
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

describe('ContentParserAgent - The Gentle Clarity Keeper ✨', () => {
  let agent: ContentParserAgent
  const mockStoryId = 'test-story-456'

  beforeEach(() => {
    agent = new ContentParserAgent(mockStoryId)
    jest.clearAllMocks()
  })

  describe('parseContent', () => {
    it('should extract pure story content while preserving spiritual essence', async () => {
      // Arrange
      const rawContent = `Thank you so much! I'm excited to share this beautiful chapter with you.

[S1] "Welcome, dear traveler, to the Whispering Woods," said the ancient oak. (gently, with wisdom in his voice)

[S2] "I... I can hear you speak!" gasped Luna, her eyes wide with wonder.

The forest seemed to shimmer with an otherworldly light, as if the very air was infused with magic and possibility. Each step Luna took deeper into the woods brought new revelations about the connection between all living things.

What did we learn from this encounter? Sometimes the greatest wisdom comes from simply listening to the voices we've forgotten how to hear.

I hope this captures the mystical essence you're looking for! Let me know if you'd like me to adjust anything.`

      const expectedCleanContent = `[S1] "Welcome, dear traveler, to the Whispering Woods," said the ancient oak. (gently, with wisdom in his voice)

[S2] "I... I can hear you speak!" gasped Luna, her eyes wide with wonder.

The forest seemed to shimmer with an otherworldly light, as if the very air was infused with magic and possibility. Each step Luna took deeper into the woods brought new revelations about the connection between all living things.

What did we learn from this encounter? Sometimes the greatest wisdom comes from simply listening to the voices we've forgotten how to hear.`

      mockCallAgent.mockResolvedValue({ content: expectedCleanContent, tokensUsed: 120 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      // Act
      const result = await agent.parseContent(rawContent, 'chapter')

      // Assert
      expect(result.cleanContent).toBe(expectedCleanContent)
      expect(result.contentType).toBe('chapter')
      expect(result.metadata.originalLength).toBe(rawContent.length)
      expect(result.metadata.cleanedLength).toBe(expectedCleanContent.length)
      
      // Should preserve dialogue tags
      expect(result.structuralElements.dialogueTags).toEqual(['[S1]', '[S2]'])
      
      // Should remove conversational fluff
      expect(result.cleanContent).not.toContain('Thank you so much')
      expect(result.cleanContent).not.toContain('I hope this captures')
      expect(result.cleanContent).not.toContain('Let me know if')
      
      // Should preserve spiritual content
      expect(result.cleanContent).toContain('Whispering Woods')
      expect(result.cleanContent).toContain('What did we learn')
      expect(result.cleanContent).toContain('otherworldly light')
      
      expect(mockCallAgent).toHaveBeenCalledWith({
        agentType: 'content_parser',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Gentle Clarity Keeper')
          })
        ]),
        temperature: 0.3, // Low temperature for precision
        maxTokens: 4000
      })
    })

    it('should identify and preserve different structural elements', async () => {
      const tocContent = `I'm happy to present the Table of Contents for your story:

Chapter 1: The Call to Adventure
Chapter 2: Meeting the Mentor
Chapter 3: Crossing the Threshold
Chapter 4: The Heart of Wisdom

This structure follows the classic hero's journey while incorporating spiritual awakening elements.`

      const cleanedTOC = `Chapter 1: The Call to Adventure
Chapter 2: Meeting the Mentor  
Chapter 3: Crossing the Threshold
Chapter 4: The Heart of Wisdom`

      mockCallAgent.mockResolvedValue({ content: cleanedTOC, tokensUsed: 80 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(tocContent, 'toc')

      expect(result.contentType).toBe('toc')
      expect(result.cleanContent).not.toContain("I'm happy to present")
      expect(result.cleanContent).not.toContain('This structure follows')
      expect(result.structuralElements.chapterBreaks).toEqual([0, 1, 2, 3])
    })

    it('should handle dialogue content with speaker tags', async () => {
      const dialogueContent = `Here's the dialogue scene you requested:

[S1] "The path ahead is treacherous," warned the Guide. (with concern)

[S2] "I understand the risks," replied the Seeker. (with determination)

[S3] "Then let us begin this sacred journey together," said the Guide.

This dialogue establishes the relationship between the characters and sets up the spiritual quest.`

      const cleanedDialogue = `[S1] "The path ahead is treacherous," warned the Guide. (with concern)

[S2] "I understand the risks," replied the Seeker. (with determination)  

[S3] "Then let us begin this sacred journey together," said the Guide.`

      mockCallAgent.mockResolvedValue({ content: cleanedDialogue, tokensUsed: 90 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(dialogueContent, 'dialogue')

      expect(result.structuralElements.dialogueTags).toEqual(['[S1]', '[S2]', '[S3]'])
      expect(result.metadata.preservedElements).toContain('dialogue-tags')
      expect(result.metadata.preservedElements).toContain('non-verbal-elements')
    })
  })

  describe('parseTableOfContents', () => {
    it('should extract structured chapter information', async () => {
      const rawTOC = `Here's your Table of Contents:

Chapter 1: The Awakening Call
Chapter 2: Meeting the Wise Elder  
Chapter 3: The Journey Inward
Chapter 4: Facing the Shadow
Chapter 5: The Sacred Union
Chapter 6: Return to Wholeness

This creates a beautiful arc of spiritual transformation!`

      const cleanedTOC = `Chapter 1: The Awakening Call
Chapter 2: Meeting the Wise Elder
Chapter 3: The Journey Inward  
Chapter 4: Facing the Shadow
Chapter 5: The Sacred Union
Chapter 6: Return to Wholeness`

      mockCallAgent.mockResolvedValue({ content: cleanedTOC, tokensUsed: 100 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseTableOfContents(rawTOC)

      expect(result.totalChapters).toBe(6)
      expect(result.chapters).toHaveLength(6)
      expect(result.chapters[0]).toEqual({
        number: 1,
        title: 'The Awakening Call',
        description: undefined
      })
      expect(result.chapters[3]).toEqual({
        number: 4,
        title: 'Facing the Shadow',
        description: undefined
      })
      expect(result.structure).toBe('cyclical') // Should detect cyclical due to "Return"
    })

    it('should detect different story structures', async () => {
      // Test episodic structure
      const episodicTOC = `Chapter 1: Tale of the Wise Rabbit
Chapter 2: Story of the Dancing Tree
Chapter 3: Tale of the Singing River`

      mockCallAgent.mockResolvedValue({ content: episodicTOC, tokensUsed: 60 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const episodicResult = await agent.parseTableOfContents(episodicTOC)
      expect(episodicResult.structure).toBe('episodic')

      // Test linear structure  
      const linearTOC = `Chapter 1: The Beginning
Chapter 2: The Middle Journey
Chapter 3: The Final Destination`

      mockCallAgent.mockResolvedValue({ content: linearTOC, tokensUsed: 50 })
      const linearResult = await agent.parseTableOfContents(linearTOC)
      expect(linearResult.structure).toBe('linear')
    })
  })

  describe('parseChapterContent', () => {
    it('should analyze chapter structure and extract key elements', async () => {
      const rawChapter = `Great work! Here's Chapter 2:

The morning sun cast golden rays through the ancient forest as Luna stepped carefully along the moss-covered path. Each footfall seemed to awaken the woodland spirits around her.

"You walk with purpose, young seeker," whispered a voice from the oak tree.

"I... I'm looking for answers," Luna replied, her voice barely audible.

The wise oak rustled its leaves thoughtfully. "Perhaps the question you should ask is not 'what am I seeking?' but 'what is seeking me?'"

As Luna pondered these words, she felt a deep shift within her consciousness. The forest wasn't just around her—she was part of it, connected to every leaf, every root, every breath of wind.

What did we learn from this chapter? True wisdom often comes not from finding answers, but from learning to ask the right questions.

This chapter beautifully develops Luna's spiritual awakening! Let me know what you think.`

      const cleanedChapter = `The morning sun cast golden rays through the ancient forest as Luna stepped carefully along the moss-covered path. Each footfall seemed to awaken the woodland spirits around her.

"You walk with purpose, young seeker," whispered a voice from the oak tree.

"I... I'm looking for answers," Luna replied, her voice barely audible.

The wise oak rustled its leaves thoughtfully. "Perhaps the question you should ask is not 'what am I seeking?' but 'what is seeking me?'"

As Luna pondered these words, she felt a deep shift within her consciousness. The forest wasn't just around her—she was part of it, connected to every leaf, every root, every breath of wind.

What did we learn from this chapter? True wisdom often comes not from finding answers, but from learning to ask the right questions.`

      mockCallAgent.mockResolvedValue({ content: cleanedChapter, tokensUsed: 150 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseChapterContent(rawChapter)

      expect(result.content).toBe(cleanedChapter)
      expect(result.dialogueCount).toBe(3) // Three quoted dialogues
      expect(result.narrativeBlocks.length).toBeGreaterThan(0)
      expect(result.learningElement).toContain('What did we learn')
      expect(result.wordCount).toBeGreaterThan(50)
      
      // Should not contain meta-commentary
      expect(result.content).not.toContain('Great work!')
      expect(result.content).not.toContain('Let me know what you think')
    })

    it('should handle chapters without learning elements', async () => {
      const simpleChapter = `Luna walked through the forest. The trees swayed gently in the breeze.

"Hello," said a voice.

"Who's there?" Luna asked.

The voice chuckled softly but gave no answer.`

      mockCallAgent.mockResolvedValue({ content: simpleChapter, tokensUsed: 40 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseChapterContent(simpleChapter)

      expect(result.learningElement).toBeUndefined()
      expect(result.dialogueCount).toBe(2)
      expect(result.wordCount).toBeGreaterThan(0)
    })
  })

  describe('Rule-based Parsing', () => {
    it('should remove conversational patterns', async () => {
      const testPhrases = [
        'Absolutely! Here is your story:',
        'Certainly! I\'m excited to share:',
        'Thank you for this opportunity:',
        'I hope this meets your expectations.',
        'Please let me know if you need changes.',
        'I\'d be happy to help with revisions.'
      ]

      // Mock AI parsing to return content as-is for rule-based testing
      mockCallAgent.mockImplementation(async ({ messages }) => {
        const content = messages[0].content as string
        const rawContentMatch = content.match(/Raw SoulScribe Response:\n(.*?)\n\n/s)
        return { content: rawContentMatch?.[1] || '', tokensUsed: 50 }
      })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      for (const phrase of testPhrases) {
        const rawContent = `${phrase} This is the actual story content.`
        const result = await agent.parseContent(rawContent, 'chapter')
        
        expect(result.cleanContent).not.toContain(phrase.split(' ')[0]) // First word of each phrase
        expect(result.cleanContent).toContain('actual story content')
      }
    })

    it('should preserve important spiritual and structural elements', async () => {
      const spiritualContent = `Here's your content:

[S1] "Welcome to the sacred grove," whispered the ancient spirit.

The moonlight danced through the leaves, creating patterns of light and shadow that seemed to pulse with otherworldly energy.

What did we learn from this encounter? Every place holds its own sacred wisdom.

(gentle wind sounds)

Chapter 2: The Deeper Mystery

Hope this captures the essence you wanted!`

      mockCallAgent.mockImplementation(async ({ messages }) => {
        // Simulate AI cleaning while preserving key elements
        return { 
          content: `[S1] "Welcome to the sacred grove," whispered the ancient spirit.

The moonlight danced through the leaves, creating patterns of light and shadow that seemed to pulse with otherworldly energy.

What did we learn from this encounter? Every place holds its own sacred wisdom.

(gentle wind sounds)

Chapter 2: The Deeper Mystery`, 
          tokensUsed: 80 
        }
      })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(spiritualContent, 'chapter')

      expect(result.metadata.preservedElements).toContain('dialogue-tags')
      expect(result.metadata.preservedElements).toContain('learning-synthesis')
      expect(result.metadata.preservedElements).toContain('non-verbal-elements')
      expect(result.metadata.preservedElements).toContain('chapter-structure')
      
      expect(result.cleanContent).toContain('[S1]')
      expect(result.cleanContent).toContain('What did we learn')
      expect(result.cleanContent).toContain('(gentle wind sounds)')
      expect(result.cleanContent).toContain('Chapter 2')
    })
  })

  describe('Performance and Accuracy', () => {
    it('should achieve good compression ratios', async () => {
      const bloatedContent = `Thank you so much for this wonderful opportunity to create! I'm absolutely thrilled to present this chapter to you. I really hope you enjoy it and find it captures exactly what you're looking for.

The actual story content is quite brief.

I hope this meets your expectations! Please don't hesitate to let me know if you'd like any adjustments or if there's anything else I can help you with. I'm always here to support your creative vision!`

      const cleanContent = 'The actual story content is quite brief.'

      mockCallAgent.mockResolvedValue({ content: cleanContent, tokensUsed: 20 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(bloatedContent, 'chapter')

      const compressionRatio = result.metadata.cleanedLength / result.metadata.originalLength
      expect(compressionRatio).toBeLessThan(0.5) // Should compress significantly
      expect(result.metadata.removedElements).toContain('courtesy-language')
      expect(result.metadata.removedElements).toContain('feedback-requests')
    })

    it('should maintain quality with minimal loss of content value', async () => {
      const valuableContent = `[S1] "The journey of a thousand miles begins with understanding oneself," said the wise teacher.

As Luna reflected on these words, she felt the truth resonate deep within her soul. The path ahead was not just external—it was an inner transformation waiting to unfold.

What did we learn? Self-knowledge is the foundation of all wisdom.`

      mockCallAgent.mockResolvedValue({ content: valuableContent, tokensUsed: 70 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(valuableContent, 'chapter')

      // Should preserve all valuable content
      expect(result.cleanContent).toContain('journey of a thousand miles')
      expect(result.cleanContent).toContain('inner transformation')
      expect(result.cleanContent).toContain('What did we learn')
      
      const contentLoss = 1 - (result.metadata.cleanedLength / result.metadata.originalLength)
      expect(contentLoss).toBeLessThan(0.1) // Less than 10% content loss for valuable content
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or minimal content gracefully', async () => {
      const emptyContent = ''
      mockCallAgent.mockResolvedValue({ content: '', tokensUsed: 5 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(emptyContent, 'chapter')

      expect(result.cleanContent).toBe('')
      expect(result.metadata.originalLength).toBe(0)
      expect(result.metadata.cleanedLength).toBe(0)
    })

    it('should handle API failures with appropriate error handling', async () => {
      const content = 'Test content for error handling'
      mockCallAgent.mockRejectedValue(new Error('API Timeout'))

      await expect(agent.parseContent(content, 'chapter')).rejects.toThrow('API Timeout')
    })

    it('should handle malformed content structures', async () => {
      const malformedContent = `[S1 "Missing closing bracket
      [S2] Missing quotes in dialogue
      Chapter Missing colon and number
      What did we learn (missing question mark)`

      mockCallAgent.mockResolvedValue({ content: malformedContent, tokensUsed: 60 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(malformedContent, 'chapter')

      // Should not crash and should return a result
      expect(result.cleanContent).toBeDefined()
      expect(result.structuralElements).toBeDefined()
    })
  })

  describe('Caching and Performance', () => {
    it('should log parsing sessions for analysis', async () => {
      const content = 'Test content for logging'
      const cleanedContent = 'Test content'

      mockCallAgent.mockResolvedValue({ content: cleanedContent, tokensUsed: 30 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      await agent.parseContent(content, 'chapter')

      expect(mockPrisma.agentSession.create).toHaveBeenCalledWith({
        data: {
          storyId: mockStoryId,
          agentType: 'content_parser',
          input: expect.stringContaining('chapter: Test content'),
          output: expect.stringContaining('chapter: Test content'),
          tokensUsed: expect.any(Number)
        }
      })
    })

    it('should provide meaningful parsing statistics', async () => {
      const mockSessions = [
        { id: 1, agentType: 'content_parser', tokensUsed: 50 },
        { id: 2, agentType: 'content_parser', tokensUsed: 75 },
        { id: 3, agentType: 'content_parser', tokensUsed: 100 }
      ]

      mockPrisma.agentSession.findMany.mockResolvedValue(mockSessions as any)

      const stats = await agent.getParsingStats()

      expect(stats.totalSessions).toBe(3)
      expect(stats.averageCompressionRatio).toBeDefined()
      expect(stats.mostCommonRemovedElements).toContain('courtesy-language')
      expect(stats.successRate).toBeGreaterThan(0.9)
    })
  })

  describe('Spiritual Content Preservation', () => {
    it('should preserve the sacred essence of SoulScribe content', async () => {
      const sacredContent = `Thank you for this opportunity to create!

In the sacred grove, where ancient wisdom dwells, Luna discovered that every tree held memories of countless seekers who had walked this path before her.

[S1] "You are not the first to seek what cannot be grasped with the mind alone," whispered the Elder Oak. (with infinite patience)

The very air seemed to shimmer with golden light, and Luna felt her heart opening to truths that words could never contain.

What did we learn from this sacred encounter? True wisdom is not acquired—it is remembered.

I hope this captures the mystical depth you're seeking!`

      const preservedEssence = `In the sacred grove, where ancient wisdom dwells, Luna discovered that every tree held memories of countless seekers who had walked this path before her.

[S1] "You are not the first to seek what cannot be grasped with the mind alone," whispered the Elder Oak. (with infinite patience)

The very air seemed to shimmer with golden light, and Luna felt her heart opening to truths that words could never contain.

What did we learn from this sacred encounter? True wisdom is not acquired—it is remembered.`

      mockCallAgent.mockResolvedValue({ content: preservedEssence, tokensUsed: 100 })
      mockPrisma.agentSession.create.mockResolvedValue({} as any)

      const result = await agent.parseContent(sacredContent, 'chapter')

      // Should preserve all spiritual elements
      expect(result.cleanContent).toContain('sacred grove')
      expect(result.cleanContent).toContain('ancient wisdom')
      expect(result.cleanContent).toContain('infinite patience')
      expect(result.cleanContent).toContain('golden light')
      expect(result.cleanContent).toContain('What did we learn')
      
      // Should remove only conversational fluff
      expect(result.cleanContent).not.toContain('Thank you for this opportunity')
      expect(result.cleanContent).not.toContain('I hope this captures')
      
      expect(result.metadata.preservedElements).toContain('learning-synthesis')
      expect(result.metadata.preservedElements).toContain('dialogue-tags')
    })
  })
})