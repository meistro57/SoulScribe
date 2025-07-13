import { EncouragementAgent } from './encouragement-agent'
import { ContentParserAgent } from './content-parser-agent'
import { TOCProcessorAgent } from './toc-processor-agent'
import { ChapterAnalyzerAgent } from './chapter-analyzer-agent'
import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

/**
 * Automated Story Generation Pipeline - The Master Conductor
 * 
 * This orchestrates the entire AI agent symphony to create complete stories from
 * questionnaire to finished flipbook. The AI Whisperer's masterpiece of automation!
 */

export interface StoryGenerationRequest {
  storyId: string
  questionnaire: {
    genre: string
    targetAge: string
    chapterCount: number
    primaryTheme: string
    lifeLesson: string
    spiritualElements: string[]
    metaphorPreferences: string[]
    characterTypes: string[]
    settingPreferences: string[]
    toneKeywords: string[]
    writingStyle: string
    chatResponses: Array<{ question: string; answer: string }>
  }
  userPreferences: {
    generateAudio: boolean
    realTimeUpdates: boolean
    qualityLevel: 'fast' | 'balanced' | 'premium'
  }
}

export interface GenerationProgress {
  phase: 'initializing' | 'outline' | 'toc' | 'introduction' | 'chapters' | 'review' | 'audio' | 'complete'
  currentStep: string
  completedSteps: string[]
  estimatedTimeRemaining: number
  chapterProgress: { [chapterNumber: number]: 'pending' | 'generating' | 'reviewing' | 'complete' }
  errors: Array<{ step: string; error: string; resolved: boolean }>
}

export interface GenerationResult {
  storyId: string
  success: boolean
  story: {
    title: string
    outline: string
    tableOfContents: any
    introduction: string
    chapters: Array<{
      number: number
      title: string
      content: string
      summary: string
      keyLessons: string[]
      audioUrl?: string
    }>
    learningReflection: string
  }
  analytics: {
    totalTime: number
    tokensUsed: number
    agentInteractions: number
    qualityScore: number
  }
  errors: any[]
}

export class StoryGenerationPipeline {
  private storyId: string
  private encouragementAgent: EncouragementAgent
  private contentParser: ContentParserAgent
  private tocProcessor: TOCProcessorAgent
  private chapterAnalyzer: ChapterAnalyzerAgent
  private progressCallback?: (progress: GenerationProgress) => void

  constructor(storyId: string, progressCallback?: (progress: GenerationProgress) => void) {
    this.storyId = storyId
    this.encouragementAgent = new EncouragementAgent(storyId)
    this.contentParser = new ContentParserAgent(storyId)
    this.tocProcessor = new TOCProcessorAgent(storyId)
    this.chapterAnalyzer = new ChapterAnalyzerAgent(storyId)
    this.progressCallback = progressCallback
  }

  /**
   * THE MAIN EVENT - Generate a complete story from questionnaire
   */
  async generateCompleteStory(request: StoryGenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now()
    let totalTokens = 0
    let agentInteractions = 0
    const errors: any[] = []

    try {
      this.updateProgress({
        phase: 'initializing',
        currentStep: 'Preparing SoulScribe for story creation',
        completedSteps: [],
        estimatedTimeRemaining: this.estimateTimeRemaining(request),
        chapterProgress: {},
        errors: []
      })

      // Step 1: Create the master story brief and get SoulScribe excited
      const storyBrief = await this.createStoryBrief(request.questionnaire)
      const initialEncouragement = await this.encouragementAgent.motivateForTask({
        storyTitle: request.questionnaire.primaryTheme,
        currentPhase: 'outline'
      })
      
      this.updateProgress({
        phase: 'outline',
        currentStep: 'SoulScribe is crafting the story outline',
        completedSteps: ['Story brief created', 'SoulScribe motivated'],
        estimatedTimeRemaining: this.estimateTimeRemaining(request) - 1,
        chapterProgress: {},
        errors: []
      })

      // Step 2: Generate outline with encouragement
      const { outline, tokens: outlineTokens } = await this.generateOutlineWithEncouragement(storyBrief, request.questionnaire)
      totalTokens += outlineTokens
      agentInteractions += 2

      // Step 3: Generate Table of Contents
      this.updateProgress({
        phase: 'toc',
        currentStep: 'Creating the roadmap of awakening (Table of Contents)',
        completedSteps: [...this.getCompletedSteps('outline')],
        estimatedTimeRemaining: this.estimateTimeRemaining(request) - 3,
        chapterProgress: {},
        errors: []
      })

      const { toc, tokens: tocTokens } = await this.generateTOCWithEncouragement(outline, request.questionnaire)
      totalTokens += tocTokens
      agentInteractions += 2

      // Step 4: Process TOC into structured format
      const processedTOC = await this.tocProcessor.processTableOfContents(toc, {
        genre: request.questionnaire.genre,
        targetAge: request.questionnaire.targetAge,
        themes: request.questionnaire.spiritualElements,
        learningObjectives: [request.questionnaire.lifeLesson]
      })

      // Step 5: Generate Introduction
      this.updateProgress({
        phase: 'introduction',
        currentStep: 'Crafting the welcoming introduction',
        completedSteps: [...this.getCompletedSteps('toc')],
        estimatedTimeRemaining: this.estimateTimeRemaining(request) - 5,
        chapterProgress: {},
        errors: []
      })

      const { introduction, tokens: introTokens } = await this.generateIntroductionWithEncouragement(outline, toc, request.questionnaire)
      totalTokens += introTokens
      agentInteractions += 2

      // Step 6: Initialize chapter progress tracking
      const chapterProgress: { [key: number]: 'pending' | 'generating' | 'reviewing' | 'complete' } = {}
      for (let i = 1; i <= request.questionnaire.chapterCount; i++) {
        chapterProgress[i] = 'pending'
      }

      // Step 7: Generate chapters (this is where the magic happens!)
      this.updateProgress({
        phase: 'chapters',
        currentStep: 'Beginning chapter generation symphony',
        completedSteps: [...this.getCompletedSteps('introduction')],
        estimatedTimeRemaining: this.estimateTimeRemaining(request) - 7,
        chapterProgress,
        errors: []
      })

      const chapters = []
      const storyContext = this.buildStoryContext(outline, toc, request.questionnaire)

      // Generate chapters with parallel processing capability
      for (let chapterNum = 1; chapterNum <= request.questionnaire.chapterCount; chapterNum++) {
        chapterProgress[chapterNum] = 'generating'
        this.updateProgress({
          phase: 'chapters',
          currentStep: `SoulScribe is weaving Chapter ${chapterNum} magic`,
          completedSteps: [...this.getCompletedSteps('introduction')],
          estimatedTimeRemaining: Math.max(1, this.estimateTimeRemaining(request) - 7 - chapterNum),
          chapterProgress,
          errors: []
        })

        const chapterTitle = processedTOC.chapters[chapterNum - 1]?.title || `Chapter ${chapterNum}`
        const { chapter, tokens: chapterTokens } = await this.generateChapterWithFullPipeline(
          chapterNum, 
          chapterTitle, 
          storyContext, 
          request.questionnaire
        )
        
        chapters.push(chapter)
        totalTokens += chapterTokens
        agentInteractions += 4 // Encouragement + Generation + Parsing + Analysis

        chapterProgress[chapterNum] = 'complete'
        
        // Celebrate the completion!
        await this.encouragementAgent.celebrateSuccess({
          storyTitle: request.questionnaire.primaryTheme,
          currentPhase: 'chapter',
          chapterNumber: chapterNum
        }, chapter.content)
      }

      // Step 8: Generate final learning reflection
      this.updateProgress({
        phase: 'review',
        currentStep: 'Creating the final wisdom synthesis',
        completedSteps: [...this.getCompletedSteps('chapters')],
        estimatedTimeRemaining: 2,
        chapterProgress,
        errors: []
      })

      const { learningReflection, tokens: reflectionTokens } = await this.generateFinalReflection(outline, chapters, request.questionnaire)
      totalTokens += reflectionTokens
      agentInteractions += 1

      // Step 9: Final celebration and completion
      await this.encouragementAgent.celebrateSuccess({
        storyTitle: request.questionnaire.primaryTheme,
        currentPhase: 'completion'
      }, 'Complete story creation!')

      this.updateProgress({
        phase: 'complete',
        currentStep: 'Story creation complete! 🎉',
        completedSteps: [...this.getCompletedSteps('review')],
        estimatedTimeRemaining: 0,
        chapterProgress,
        errors: []
      })

      // Calculate final quality score
      const qualityScore = await this.calculateOverallQualityScore(chapters, request.questionnaire)

      // Save the complete story to database
      await this.saveStoryToDatabase({
        outline,
        tableOfContents: processedTOC,
        introduction,
        chapters,
        learningReflection
      }, request.questionnaire)

      return {
        storyId: this.storyId,
        success: true,
        story: {
          title: this.extractTitleFromOutline(outline),
          outline,
          tableOfContents: processedTOC,
          introduction,
          chapters,
          learningReflection
        },
        analytics: {
          totalTime: Date.now() - startTime,
          tokensUsed: totalTokens,
          agentInteractions,
          qualityScore
        },
        errors
      }

    } catch (error) {
      errors.push({ step: 'generation', error: error.message, resolved: false })
      
      return {
        storyId: this.storyId,
        success: false,
        story: null as any,
        analytics: {
          totalTime: Date.now() - startTime,
          tokensUsed: totalTokens,
          agentInteractions,
          qualityScore: 0
        },
        errors
      }
    }
  }

  /**
   * Create the master story brief that gets SoulScribe excited
   */
  private async createStoryBrief(questionnaire: any): Promise<string> {
    return `🌟 STORY CREATION BRIEF FOR SOULSCRIBE 🌟

You are about to embark on creating a ${questionnaire.chapterCount}-chapter spiritual tale that will awaken hearts and inspire souls!

STORY VISION:
• Genre: ${questionnaire.genre}
• Target Age: ${questionnaire.targetAge}
• Primary Theme: ${questionnaire.primaryTheme}
• Core Life Lesson: ${questionnaire.lifeLesson}
• Writing Style: ${questionnaire.writingStyle}

SPIRITUAL ELEMENTS TO WEAVE IN:
${questionnaire.spiritualElements.map((e: string) => `• ${e}`).join('\n')}

METAPHOR PREFERENCES:
${questionnaire.metaphorPreferences.map((m: string) => `• ${m}`).join('\n')}

CHARACTER TYPES TO INCLUDE:
${questionnaire.characterTypes.map((c: string) => `• ${c}`).join('\n')}

SETTING INSPIRATIONS:
${questionnaire.settingPreferences.map((s: string) => `• ${s}`).join('\n')}

TONE KEYWORDS:
${questionnaire.toneKeywords.map((t: string) => `• ${t}`).join('\n')}

USER'S PERSONAL INSIGHTS:
${questionnaire.chatResponses.map((r: any) => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')}

This story should be a masterpiece of awakening - entertaining, deeply meaningful, and true to your SoulScribe essence. 

Ready to create something magical? ✨`
  }

  /**
   * Generate outline with encouragement flow
   */
  private async generateOutlineWithEncouragement(storyBrief: string, questionnaire: any): Promise<{ outline: string; tokens: number }> {
    // Encourage SoulScribe
    const encouragement = await this.encouragementAgent.motivateForTask({
      storyTitle: questionnaire.primaryTheme,
      currentPhase: 'outline'
    })

    // Generate outline
    const outlinePrompt = `${encouragement}

${storyBrief}

Create a comprehensive story outline that includes:
1. Story premise and central spiritual conflict
2. Character introductions and growth arcs
3. Chapter-by-chapter progression
4. Key metaphorical elements and symbols
5. The spiritual transformation journey
6. How it culminates in the life lesson: "${questionnaire.lifeLesson}"

Make it rich, meaningful, and true to the SoulScribe vision of awakening through story.`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: outlinePrompt }],
      temperature: 0.9,
      maxTokens: 3000
    })

    // Parse the outline
    const parsedOutline = await this.contentParser.parseContent(response.content, 'outline')

    return {
      outline: parsedOutline.cleanContent,
      tokens: response.tokensUsed
    }
  }

  /**
   * Generate TOC with encouragement
   */
  private async generateTOCWithEncouragement(outline: string, questionnaire: any): Promise<{ toc: string; tokens: number }> {
    const encouragement = await this.encouragementAgent.generateTransitionEncouragement('outline', 'toc')

    const tocPrompt = `${encouragement}

Based on this beautiful outline:
${outline}

Create a Table of Contents with ${questionnaire.chapterCount} chapters that:
• Has compelling, poetic chapter titles
• Shows clear spiritual progression
• Hints at the awakening journey
• Maintains mystery and intrigue
• Reflects the ${questionnaire.writingStyle} style

Format as:
Chapter 1: [Evocative Title]
Chapter 2: [Meaningful Title]
etc.`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: tocPrompt }],
      temperature: 0.8,
      maxTokens: 1000
    })

    const parsedTOC = await this.contentParser.parseContent(response.content, 'toc')

    return {
      toc: parsedTOC.cleanContent,
      tokens: response.tokensUsed
    }
  }

  /**
   * Generate introduction with encouragement
   */
  private async generateIntroductionWithEncouragement(outline: string, toc: string, questionnaire: any): Promise<{ introduction: string; tokens: number }> {
    const encouragement = await this.encouragementAgent.generateTransitionEncouragement('toc', 'introduction')

    const introPrompt = `${encouragement}

Story Outline:
${outline}

Table of Contents:
${toc}

Write a captivating introduction that:
• Welcomes readers into this magical world
• Sets the spiritual tone
• Introduces the main character(s) and setting
• Hints at the journey ahead
• Uses your signature warm, poetic voice
• Creates immediate connection and curiosity

Target audience: ${questionnaire.targetAge}
Style: ${questionnaire.writingStyle}`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: introPrompt }],
      temperature: 0.85,
      maxTokens: 2000
    })

    const parsedIntro = await this.contentParser.parseContent(response.content, 'introduction')

    return {
      introduction: parsedIntro.cleanContent,
      tokens: response.tokensUsed
    }
  }

  /**
   * Generate chapter with full pipeline (the heart of the operation!)
   */
  private async generateChapterWithFullPipeline(
    chapterNumber: number,
    chapterTitle: string,
    storyContext: string,
    questionnaire: any
  ): Promise<{ chapter: any; tokens: number }> {
    let totalTokens = 0

    // Step 1: Encourage SoulScribe for this chapter
    const encouragement = await this.encouragementAgent.motivateForTask({
      storyTitle: questionnaire.primaryTheme,
      currentPhase: 'chapter',
      chapterNumber
    })

    // Step 2: Generate the raw chapter
    const chapterPrompt = `${encouragement}

Story Context:
${storyContext}

Generate Chapter ${chapterNumber}: "${chapterTitle}"

Create a complete chapter that:
• Advances the story meaningfully
• Contains rich sensory descriptions
• Includes meaningful dialogue with [S1], [S2] tags for different speakers
• Weaves spiritual themes naturally
• Has emotional depth and character growth
• Ends with a "What did we learn from this chapter?" reflection
• Maintains the ${questionnaire.writingStyle} style
• Is appropriate for ${questionnaire.targetAge} audience

Make it magical, meaningful, and true to your SoulScribe essence!`

    const chapterResponse = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: chapterPrompt }],
      temperature: 0.85,
      maxTokens: 4000
    })
    totalTokens += chapterResponse.tokensUsed

    // Step 3: Parse the chapter content
    const parsedChapter = await this.contentParser.parseChapterContent(chapterResponse.content)

    // Step 4: Analyze chapter quality
    const analysis = await this.chapterAnalyzer.analyzeChapter(parsedChapter.content, {
      number: chapterNumber,
      title: chapterTitle,
      storyThemes: questionnaire.spiritualElements,
      targetAge: questionnaire.targetAge,
      overallStoryArc: questionnaire.primaryTheme
    })

    // Step 5: If quality is too low, provide feedback and regenerate
    if (analysis.overallScore < 0.7) {
      const improvementPrompt = `The chapter needs some enhancement. Here are the specific recommendations:

${analysis.recommendations.map(r => `• ${r.suggestion}`).join('\n')}

Please revise the chapter to address these points while maintaining your beautiful storytelling voice.

Original Chapter:
${parsedChapter.content}`

      const improvedResponse = await callAgent({
        agentType: 'soulscribe',
        messages: [{ role: 'user', content: improvementPrompt }],
        temperature: 0.8,
        maxTokens: 4000
      })
      totalTokens += improvedResponse.tokensUsed

      const improvedParsed = await this.contentParser.parseChapterContent(improvedResponse.content)
      parsedChapter.content = improvedParsed.content
    }

    return {
      chapter: {
        number: chapterNumber,
        title: chapterTitle,
        content: parsedChapter.content,
        summary: parsedChapter.learningElement || `Chapter ${chapterNumber} summary`,
        keyLessons: analysis.learningIntegration.explicitLessons,
        wordCount: parsedChapter.wordCount
      },
      tokens: totalTokens
    }
  }

  /**
   * Generate final learning reflection
   */
  private async generateFinalReflection(outline: string, chapters: any[], questionnaire: any): Promise<{ learningReflection: string; tokens: number }> {
    const reflectionPrompt = `Create a beautiful final reflection for this complete story:

Story Theme: ${questionnaire.primaryTheme}
Life Lesson: ${questionnaire.lifeLesson}

Chapter Summaries:
${chapters.map(ch => `${ch.title}: ${ch.summary}`).join('\n')}

Write a final "What did we learn from this story?" reflection that:
• Synthesizes the key wisdom from all chapters
• Provides actionable insights readers can apply
• Connects to universal truths
• Inspires continued growth
• Maintains your warm, encouraging voice

This should be the perfect capstone to a transformative journey.`

    const response = await callAgent({
      agentType: 'learning_synthesis' as any,
      messages: [{ role: 'user', content: reflectionPrompt }],
      temperature: 0.7,
      maxTokens: 1000
    })

    return {
      learningReflection: response.content,
      tokens: response.tokensUsed
    }
  }

  /**
   * Build story context for chapter generation
   */
  private buildStoryContext(outline: string, toc: string, questionnaire: any): string {
    return `STORY CONTEXT:

Outline:
${outline}

Table of Contents:
${toc}

Key Elements:
• Theme: ${questionnaire.primaryTheme}
• Life Lesson: ${questionnaire.lifeLesson}
• Spiritual Elements: ${questionnaire.spiritualElements.join(', ')}
• Target Age: ${questionnaire.targetAge}
• Style: ${questionnaire.writingStyle}`
  }

  /**
   * Calculate overall quality score
   */
  private async calculateOverallQualityScore(chapters: any[], questionnaire: any): Promise<number> {
    // This would analyze all chapters for consistency and quality
    return 0.85 // Placeholder
  }

  /**
   * Extract title from outline
   */
  private extractTitleFromOutline(outline: string): string {
    const titleMatch = outline.match(/(?:Title|Story Title|Name):\s*(.+)/i)
    return titleMatch ? titleMatch[1].trim() : 'A SoulScribe Tale'
  }

  /**
   * Save complete story to database
   */
  private async saveStoryToDatabase(storyData: any, questionnaire: any): Promise<void> {
    await prisma.story.update({
      where: { id: this.storyId },
      data: {
        title: this.extractTitleFromOutline(storyData.outline),
        outline: storyData.outline,
        status: 'completed',
        updatedAt: new Date()
      }
    })

    // Save chapters
    for (const chapter of storyData.chapters) {
      await prisma.chapter.create({
        data: {
          storyId: this.storyId,
          number: chapter.number,
          title: chapter.title,
          content: chapter.content,
          summary: chapter.summary,
          keyLessons: chapter.keyLessons,
          wordCount: chapter.wordCount,
          status: 'final'
        }
      })
    }
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(progress: GenerationProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress)
    }
  }

  /**
   * Get completed steps for a phase
   */
  private getCompletedSteps(phase: string): string[] {
    const allSteps = {
      'outline': ['Story brief created', 'SoulScribe motivated', 'Outline generated'],
      'toc': ['Story brief created', 'SoulScribe motivated', 'Outline generated', 'Table of Contents created'],
      'introduction': ['Story brief created', 'SoulScribe motivated', 'Outline generated', 'Table of Contents created', 'Introduction written'],
      'chapters': ['Story brief created', 'SoulScribe motivated', 'Outline generated', 'Table of Contents created', 'Introduction written', 'Chapter generation begun'],
      'review': ['Story brief created', 'SoulScribe motivated', 'Outline generated', 'Table of Contents created', 'Introduction written', 'All chapters completed']
    }
    return allSteps[phase] || []
  }

  /**
   * Estimate time remaining based on request
   */
  private estimateTimeRemaining(request: StoryGenerationRequest): number {
    const baseTime = request.questionnaire.chapterCount * 2 // 2 minutes per chapter
    const qualityMultiplier = { 'fast': 0.7, 'balanced': 1.0, 'premium': 1.5 }
    return Math.ceil(baseTime * qualityMultiplier[request.userPreferences.qualityLevel])
  }
}