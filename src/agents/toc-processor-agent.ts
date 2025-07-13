import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { ContentParserAgent } from './content-parser-agent'

/**
 * Table of Contents Processing Agent - The Master Organizer of Spiritual Journeys
 * 
 * This agent transforms raw TOC content into beautiful, structured navigation that guides
 * readers through their awakening experience. It's the architect of the reader's journey!
 */

export interface ProcessedTOC {
  chapters: ChapterOutline[]
  totalChapters: number
  storyStructure: 'linear' | 'episodic' | 'cyclical' | 'spiral'
  thematicArcs: ThematicArc[]
  navigationData: NavigationStructure
  spiritualProgression: SpiritualProgression
}

export interface ChapterOutline {
  number: number
  title: string
  subtitle?: string
  description?: string
  estimatedReadTime: number
  spiritualThemes: string[]
  characterFocus: string[]
  learningObjectives: string[]
  difficulty: 'gentle' | 'moderate' | 'deep' | 'profound'
}

export interface ThematicArc {
  name: string
  chapters: number[]
  centralLesson: string
  arcType: 'introduction' | 'exploration' | 'challenge' | 'revelation' | 'integration'
}

export interface NavigationStructure {
  previousNext: Array<{ chapter: number; prev?: number; next?: number }>
  jumpPoints: Array<{ chapter: number; description: string; isKeyMoment: boolean }>
  bookmarks: Array<{ chapter: number; reason: string; icon: string }>
}

export interface SpiritualProgression {
  startingPoint: string
  endingPoint: string
  keyTransformations: Array<{ atChapter: number; transformation: string }>
  wisdomMilestones: Array<{ atChapter: number; wisdom: string }>
}

export class TOCProcessorAgent {
  private storyId: string
  private contentParser: ContentParserAgent

  constructor(storyId: string) {
    this.storyId = storyId
    this.contentParser = new ContentParserAgent(storyId)
  }

  /**
   * The main magic - transform raw TOC into a spiritual journey roadmap
   */
  async processTableOfContents(
    rawTOC: string,
    storyContext: {
      genre: string
      targetAge: string
      themes: string[]
      learningObjectives: string[]
    }
  ): Promise<ProcessedTOC> {
    // Step 1: Parse and clean the raw TOC
    const parsedTOC = await this.contentParser.parseTableOfContents(rawTOC)
    
    // Step 2: Enhance chapters with AI analysis
    const enhancedChapters = await this.enhanceChapters(parsedTOC.chapters, storyContext)
    
    // Step 3: Identify thematic arcs
    const thematicArcs = await this.identifyThematicArcs(enhancedChapters, storyContext)
    
    // Step 4: Create navigation structure
    const navigationData = this.createNavigationStructure(enhancedChapters, thematicArcs)
    
    // Step 5: Map spiritual progression
    const spiritualProgression = await this.mapSpiritualProgression(enhancedChapters, storyContext)
    
    // Step 6: Determine overall story structure
    const storyStructure = this.determineStoryStructure(enhancedChapters, thematicArcs)

    const processedTOC: ProcessedTOC = {
      chapters: enhancedChapters,
      totalChapters: enhancedChapters.length,
      storyStructure,
      thematicArcs,
      navigationData,
      spiritualProgression
    }

    // Log the processing session
    await this.logTOCProcessing(rawTOC, processedTOC)

    return processedTOC
  }

  /**
   * Enhance chapter outlines with AI-powered analysis
   */
  private async enhanceChapters(
    basicChapters: Array<{ number: number; title: string }>,
    storyContext: any
  ): Promise<ChapterOutline[]> {
    const enhancementPrompt = `Analyze these chapter titles in the context of a SoulScribe story and provide detailed insights:

Story Context:
- Genre: ${storyContext.genre}
- Target Age: ${storyContext.targetAge}
- Themes: ${storyContext.themes.join(', ')}
- Learning Objectives: ${storyContext.learningObjectives.join(', ')}

Chapter Titles:
${basicChapters.map(ch => `${ch.number}. ${ch.title}`).join('\n')}

For each chapter, provide:
1. A meaningful subtitle that hints at the spiritual journey
2. 2-3 sentence description of what happens
3. Estimated reading time (5-15 minutes)
4. 2-3 spiritual themes explored
5. Main characters featured
6. 1-2 key learning objectives
7. Difficulty level (gentle/moderate/deep/profound)

Format as JSON array with this structure:
{
  "chapters": [
    {
      "number": 1,
      "title": "original title",
      "subtitle": "meaningful subtitle",
      "description": "what happens in this chapter",
      "estimatedReadTime": 8,
      "spiritualThemes": ["theme1", "theme2"],
      "characterFocus": ["character1"],
      "learningObjectives": ["objective1"],
      "difficulty": "gentle"
    }
  ]
}`

    const response = await callAgent({
      agentType: 'toc_processor' as any,
      messages: [{ role: 'user', content: enhancementPrompt }],
      temperature: 0.7,
      maxTokens: 3000
    })

    try {
      const parsed = JSON.parse(response.content)
      return parsed.chapters
    } catch (error) {
      // Fallback if JSON parsing fails
      return basicChapters.map(ch => ({
        number: ch.number,
        title: ch.title,
        subtitle: undefined,
        description: 'A chapter in the spiritual journey',
        estimatedReadTime: 10,
        spiritualThemes: storyContext.themes.slice(0, 2),
        characterFocus: ['Protagonist'],
        learningObjectives: storyContext.learningObjectives.slice(0, 1),
        difficulty: 'moderate' as const
      }))
    }
  }

  /**
   * Identify thematic arcs across the story
   */
  private async identifyThematicArcs(
    chapters: ChapterOutline[],
    storyContext: any
  ): Promise<ThematicArc[]> {
    const arcPrompt = `Analyze this chapter structure and identify 3-5 thematic arcs that span across multiple chapters:

Chapters:
${chapters.map(ch => `${ch.number}. ${ch.title} - Themes: ${ch.spiritualThemes.join(', ')}`).join('\n')}

Story Themes: ${storyContext.themes.join(', ')}

Identify thematic arcs such as:
- Character growth journeys
- Spiritual awakening progressions  
- Challenge and resolution cycles
- Wisdom accumulation phases
- Relationship developments

For each arc, specify:
- Name of the arc
- Which chapters it spans
- Central lesson or transformation
- Arc type (introduction/exploration/challenge/revelation/integration)

Format as JSON:
{
  "arcs": [
    {
      "name": "Arc Name",
      "chapters": [1, 2, 3],
      "centralLesson": "Key lesson learned",
      "arcType": "exploration"
    }
  ]
}`

    const response = await callAgent({
      agentType: 'toc_processor' as any,
      messages: [{ role: 'user', content: arcPrompt }],
      temperature: 0.6,
      maxTokens: 2000
    })

    try {
      const parsed = JSON.parse(response.content)
      return parsed.arcs
    } catch (error) {
      // Fallback arcs based on chapter distribution
      const totalChapters = chapters.length
      return [
        {
          name: 'The Awakening',
          chapters: chapters.slice(0, Math.ceil(totalChapters * 0.3)).map(ch => ch.number),
          centralLesson: 'Opening to new possibilities',
          arcType: 'introduction' as const
        },
        {
          name: 'The Journey',
          chapters: chapters.slice(Math.ceil(totalChapters * 0.3), Math.ceil(totalChapters * 0.7)).map(ch => ch.number),
          centralLesson: 'Learning through experience',
          arcType: 'exploration' as const
        },
        {
          name: 'The Transformation',
          chapters: chapters.slice(Math.ceil(totalChapters * 0.7)).map(ch => ch.number),
          centralLesson: 'Integration and wisdom',
          arcType: 'integration' as const
        }
      ]
    }
  }

  /**
   * Create enhanced navigation structure
   */
  private createNavigationStructure(
    chapters: ChapterOutline[],
    thematicArcs: ThematicArc[]
  ): NavigationStructure {
    // Build previous/next chain
    const previousNext = chapters.map(ch => ({
      chapter: ch.number,
      prev: ch.number > 1 ? ch.number - 1 : undefined,
      next: ch.number < chapters.length ? ch.number + 1 : undefined
    }))

    // Identify key jump points (arc beginnings, high-difficulty chapters, etc.)
    const jumpPoints = []
    
    // Add arc starting points
    thematicArcs.forEach(arc => {
      if (arc.chapters.length > 0) {
        jumpPoints.push({
          chapter: arc.chapters[0],
          description: `Beginning of "${arc.name}"`,
          isKeyMoment: true
        })
      }
    })

    // Add profound chapters as jump points
    chapters.filter(ch => ch.difficulty === 'profound').forEach(ch => {
      jumpPoints.push({
        chapter: ch.number,
        description: `Deep wisdom in "${ch.title}"`,
        isKeyMoment: true
      })
    })

    // Create bookmark suggestions
    const bookmarks = [
      { chapter: 1, reason: 'Story beginning', icon: '🌅' },
      ...chapters
        .filter(ch => ch.difficulty === 'profound')
        .map(ch => ({ chapter: ch.number, reason: 'Deep wisdom', icon: '💎' })),
      { chapter: chapters.length, reason: 'Story completion', icon: '🎉' }
    ]

    return {
      previousNext,
      jumpPoints,
      bookmarks
    }
  }

  /**
   * Map the spiritual progression throughout the story
   */
  private async mapSpiritualProgression(
    chapters: ChapterOutline[],
    storyContext: any
  ): Promise<SpiritualProgression> {
    const progressionPrompt = `Map the spiritual progression for this story:

Chapters and Themes:
${chapters.map(ch => `${ch.number}. ${ch.title} - ${ch.spiritualThemes.join(', ')}`).join('\n')}

Story Learning Objectives: ${storyContext.learningObjectives.join(', ')}

Identify:
1. Starting spiritual/emotional state of the protagonist/reader
2. Ending state after the journey
3. Key transformation moments (2-3 major shifts)
4. Wisdom milestones (specific insights gained)

Format as JSON:
{
  "startingPoint": "Initial state description",
  "endingPoint": "Final transformed state",
  "keyTransformations": [
    {"atChapter": 3, "transformation": "What changes"},
    {"atChapter": 7, "transformation": "Another shift"}
  ],
  "wisdomMilestones": [
    {"atChapter": 2, "wisdom": "First major insight"},
    {"atChapter": 5, "wisdom": "Second insight"}
  ]
}`

    const response = await callAgent({
      agentType: 'toc_processor' as any,
      messages: [{ role: 'user', content: progressionPrompt }],
      temperature: 0.7,
      maxTokens: 1500
    })

    try {
      return JSON.parse(response.content)
    } catch (error) {
      // Fallback progression
      return {
        startingPoint: 'A seeker beginning their journey',
        endingPoint: 'An awakened soul, wise and compassionate',
        keyTransformations: [
          { atChapter: Math.ceil(chapters.length * 0.3), transformation: 'First awakening to deeper truth' },
          { atChapter: Math.ceil(chapters.length * 0.7), transformation: 'Facing and overcoming inner challenges' }
        ],
        wisdomMilestones: [
          { atChapter: Math.ceil(chapters.length * 0.2), wisdom: 'Understanding the power of perspective' },
          { atChapter: Math.ceil(chapters.length * 0.5), wisdom: 'Discovering inner strength and resilience' },
          { atChapter: Math.ceil(chapters.length * 0.8), wisdom: 'Learning the art of compassionate living' }
        ]
      }
    }
  }

  /**
   * Determine the overall story structure pattern
   */
  private determineStoryStructure(
    chapters: ChapterOutline[],
    thematicArcs: ThematicArc[]
  ): 'linear' | 'episodic' | 'cyclical' | 'spiral' {
    // Analyze chapter titles and themes for patterns
    const titles = chapters.map(ch => ch.title.toLowerCase())
    const themes = chapters.flatMap(ch => ch.spiritualThemes)

    // Check for cyclical patterns (return, circle, beginning/end similarities)
    if (titles.some(title => title.includes('return') || title.includes('circle')) ||
        (chapters.length > 1 && this.similarity(titles[0], titles[titles.length - 1]) > 0.5)) {
      return 'cyclical'
    }

    // Check for spiral patterns (repeating themes with increasing depth)
    const themeRepetition = this.analyzeThemeRepetition(themes)
    if (themeRepetition.hasProgressiveDepth) {
      return 'spiral'
    }

    // Check for episodic patterns (standalone adventures)
    if (titles.some(title => title.includes('tale of') || title.includes('story of'))) {
      return 'episodic'
    }

    // Default to linear progression
    return 'linear'
  }

  /**
   * Analyze theme repetition patterns
   */
  private analyzeThemeRepetition(themes: string[]): { hasProgressiveDepth: boolean } {
    const themeCount = themes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const repeatedThemes = Object.values(themeCount).filter(count => count > 1)
    return { hasProgressiveDepth: repeatedThemes.length >= 2 }
  }

  /**
   * Calculate similarity between two strings
   */
  private similarity(str1: string, str2: string): number {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    const intersection = words1.filter(word => words2.includes(word))
    return intersection.length / Math.max(words1.length, words2.length)
  }

  /**
   * Generate beautiful chapter navigation for flipbook UI
   */
  async generateFlipbookNavigation(processedTOC: ProcessedTOC): Promise<{
    navigationCards: Array<{
      chapter: number
      title: string
      subtitle?: string
      estimatedTime: string
      difficulty: string
      themes: string[]
      arcPosition: string
      icon: string
    }>
    progressIndicators: Array<{
      chapter: number
      isCompleted: boolean
      isCurrent: boolean
      isKeyMoment: boolean
    }>
  }> {
    const navigationCards = processedTOC.chapters.map(ch => {
      const arc = processedTOC.thematicArcs.find(arc => arc.chapters.includes(ch.number))
      const difficultyIcons = {
        gentle: '🌱',
        moderate: '🌿',
        deep: '🌳',
        profound: '🏔️'
      }

      return {
        chapter: ch.number,
        title: ch.title,
        subtitle: ch.subtitle,
        estimatedTime: `${ch.estimatedReadTime} min`,
        difficulty: ch.difficulty,
        themes: ch.spiritualThemes,
        arcPosition: arc ? `${arc.name} Arc` : 'Journey',
        icon: difficultyIcons[ch.difficulty]
      }
    })

    const progressIndicators = processedTOC.chapters.map(ch => ({
      chapter: ch.number,
      isCompleted: false, // This would be determined by user progress
      isCurrent: false,   // This would be determined by current reading position
      isKeyMoment: processedTOC.navigationData.jumpPoints.some(jp => jp.chapter === ch.number && jp.isKeyMoment)
    }))

    return { navigationCards, progressIndicators }
  }

  /**
   * Log TOC processing session
   */
  private async logTOCProcessing(rawTOC: string, processedTOC: ProcessedTOC): Promise<void> {
    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType: 'toc_processor',
        input: `Raw TOC: ${rawTOC.substring(0, 500)}...`,
        output: `Processed: ${processedTOC.totalChapters} chapters, ${processedTOC.thematicArcs.length} arcs, ${processedTOC.storyStructure} structure`,
        tokensUsed: Math.ceil(rawTOC.length / 4)
      }
    })
  }

  /**
   * Get TOC processing statistics
   */
  async getTOCStats(): Promise<{
    averageChaptersPerStory: number
    mostCommonStructure: string
    averageArcsPerStory: number
    popularThemes: string[]
  }> {
    // This would aggregate data from multiple processed TOCs
    return {
      averageChaptersPerStory: 8,
      mostCommonStructure: 'linear',
      averageArcsPerStory: 3,
      popularThemes: ['awakening', 'courage', 'wisdom', 'compassion']
    }
  }
}