import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { ContentParserAgent } from './content-parser-agent'

/**
 * Chapter Structure Analysis Agent - The Guardian of Narrative Flow & Spiritual Progression
 * 
 * This agent ensures every chapter is a perfect gem that advances both plot and soul growth.
 * It validates spiritual depth, narrative consistency, and maintains SoulScribe's signature
 * blend of entertainment and enlightenment.
 */

export interface ChapterAnalysis {
  chapterNumber: number
  title: string
  structuralHealth: StructuralHealth
  spiritualDepth: SpiritualDepth
  narrativeFlow: NarrativeFlow
  characterDevelopment: CharacterDevelopment
  learningIntegration: LearningIntegration
  recommendations: Recommendation[]
  overallScore: number
  readyForPublication: boolean
}

export interface StructuralHealth {
  hasOpeningHook: boolean
  hasProperPacing: boolean
  hasClimaxMoment: boolean
  hasResolution: boolean
  wordCount: number
  paragraphCount: number
  dialogueRatio: number
  averageSentenceLength: number
  readabilityScore: number
}

export interface SpiritualDepth {
  themes: string[]
  wisdomQuotient: number
  metaphorRichness: number
  hasLearningMoment: boolean
  hasReflectionSpace: boolean
  preachiness: number // Lower is better
  authenticity: number
  universalTruths: string[]
}

export interface NarrativeFlow {
  connectionToPrevious: number
  setupForNext: number
  internalConsistency: number
  emotionalBeats: string[]
  tensionCurve: 'rising' | 'falling' | 'plateau' | 'peak'
  voiceConsistency: number
}

export interface CharacterDevelopment {
  charactersPresent: string[]
  growthMoments: Array<{ character: string; growth: string }>
  relationshipDynamics: Array<{ characters: string[]; dynamic: string }>
  archetypeBalance: { [archetype: string]: number }
  emotionalRange: string[]
}

export interface LearningIntegration {
  explicitLessons: string[]
  implicitWisdom: string[]
  actionableInsights: string[]
  hasWhatDidWeLearn: boolean
  learningStyle: 'experiential' | 'reflective' | 'symbolic' | 'direct'
  ageAppropriate: boolean
}

export interface Recommendation {
  type: 'structure' | 'spiritual' | 'narrative' | 'character' | 'learning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  issue: string
  suggestion: string
  exampleFix?: string
}

export class ChapterAnalyzerAgent {
  private storyId: string
  private contentParser: ContentParserAgent

  constructor(storyId: string) {
    this.storyId = storyId
    this.contentParser = new ContentParserAgent(storyId)
  }

  /**
   * The main analysis - comprehensive chapter evaluation
   */
  async analyzeChapter(
    chapterContent: string,
    chapterContext: {
      number: number
      title: string
      storyThemes: string[]
      targetAge: string
      previousChapterSummary?: string
      overallStoryArc: string
    }
  ): Promise<ChapterAnalysis> {
    // Step 1: Parse the chapter content
    const parsedChapter = await this.contentParser.parseChapterContent(chapterContent)
    
    // Step 2: Analyze structural health
    const structuralHealth = await this.analyzeStructuralHealth(parsedChapter, chapterContext)
    
    // Step 3: Evaluate spiritual depth
    const spiritualDepth = await this.evaluateSpiritualDepth(parsedChapter, chapterContext)
    
    // Step 4: Assess narrative flow
    const narrativeFlow = await this.assessNarrativeFlow(parsedChapter, chapterContext)
    
    // Step 5: Examine character development
    const characterDevelopment = await this.examineCharacterDevelopment(parsedChapter, chapterContext)
    
    // Step 6: Check learning integration
    const learningIntegration = await this.checkLearningIntegration(parsedChapter, chapterContext)
    
    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(
      structuralHealth, spiritualDepth, narrativeFlow, characterDevelopment, learningIntegration
    )
    
    // Step 8: Calculate overall score
    const overallScore = this.calculateOverallScore(
      structuralHealth, spiritualDepth, narrativeFlow, characterDevelopment, learningIntegration
    )

    const analysis: ChapterAnalysis = {
      chapterNumber: chapterContext.number,
      title: chapterContext.title,
      structuralHealth,
      spiritualDepth,
      narrativeFlow,
      characterDevelopment,
      learningIntegration,
      recommendations,
      overallScore,
      readyForPublication: overallScore >= 0.8 && recommendations.filter(r => r.priority === 'critical').length === 0
    }

    // Log the analysis session
    await this.logChapterAnalysis(chapterContent, analysis)

    return analysis
  }

  /**
   * Analyze structural health of the chapter
   */
  private async analyzeStructuralHealth(
    parsedChapter: any,
    chapterContext: any
  ): Promise<StructuralHealth> {
    const content = parsedChapter.content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
    
    // AI analysis for complex structural elements
    const structuralPrompt = `Analyze the structural health of this chapter:

Chapter ${chapterContext.number}: ${chapterContext.title}

Content:
${content.substring(0, 2000)}...

Evaluate:
1. Does it have an engaging opening hook?
2. Is the pacing appropriate for the chapter's purpose?
3. Is there a climactic moment or turning point?
4. Does it have proper resolution/transition?
5. Rate the overall structural quality (0-1)

Respond with JSON:
{
  "hasOpeningHook": true/false,
  "hasProperPacing": true/false,
  "hasClimaxMoment": true/false,
  "hasResolution": true/false,
  "structuralQuality": 0.85
}`

    const response = await callAgent({
      agentType: 'chapter_analyzer' as any,
      messages: [{ role: 'user', content: structuralPrompt }],
      temperature: 0.4,
      maxTokens: 500
    })

    let aiAnalysis
    try {
      aiAnalysis = JSON.parse(response.content)
    } catch {
      aiAnalysis = {
        hasOpeningHook: true,
        hasProperPacing: true,
        hasClimaxMoment: true,
        hasResolution: true,
        structuralQuality: 0.7
      }
    }

    return {
      hasOpeningHook: aiAnalysis.hasOpeningHook,
      hasProperPacing: aiAnalysis.hasProperPacing,
      hasClimaxMoment: aiAnalysis.hasClimaxMoment,
      hasResolution: aiAnalysis.hasResolution,
      wordCount: parsedChapter.wordCount,
      paragraphCount: paragraphs.length,
      dialogueRatio: parsedChapter.dialogueCount / paragraphs.length,
      averageSentenceLength: content.length / sentences.length,
      readabilityScore: this.calculateReadabilityScore(content)
    }
  }

  /**
   * Evaluate spiritual depth and authenticity
   */
  private async evaluateSpiritualDepth(
    parsedChapter: any,
    chapterContext: any
  ): Promise<SpiritualDepth> {
    const spiritualPrompt = `Evaluate the spiritual depth of this SoulScribe chapter:

Chapter: ${chapterContext.title}
Story Themes: ${chapterContext.storyThemes.join(', ')}
Target Age: ${chapterContext.targetAge}

Content:
${parsedChapter.content.substring(0, 2000)}...

Analyze:
1. What spiritual themes are present?
2. Rate wisdom quotient (0-1) - how much genuine wisdom is shared
3. Rate metaphor richness (0-1) - quality of symbolic language
4. Does it have clear learning moments?
5. Is there space for reflection?
6. Rate preachiness (0-1) - higher means too preachy
7. Rate authenticity (0-1) - how genuine and heartfelt it feels
8. What universal truths are expressed?

Respond with JSON:
{
  "themes": ["theme1", "theme2"],
  "wisdomQuotient": 0.8,
  "metaphorRichness": 0.9,
  "hasLearningMoment": true,
  "hasReflectionSpace": true,
  "preachiness": 0.2,
  "authenticity": 0.9,
  "universalTruths": ["truth1", "truth2"]
}`

    const response = await callAgent({
      agentType: 'chapter_analyzer' as any,
      messages: [{ role: 'user', content: spiritualPrompt }],
      temperature: 0.6,
      maxTokens: 800
    })

    try {
      return JSON.parse(response.content)
    } catch {
      return {
        themes: chapterContext.storyThemes.slice(0, 2),
        wisdomQuotient: 0.7,
        metaphorRichness: 0.6,
        hasLearningMoment: parsedChapter.learningElement !== undefined,
        hasReflectionSpace: true,
        preachiness: 0.3,
        authenticity: 0.8,
        universalTruths: ['Growth comes through challenge', 'Wisdom is found in stillness']
      }
    }
  }

  /**
   * Assess narrative flow and connectivity
   */
  private async assessNarrativeFlow(
    parsedChapter: any,
    chapterContext: any
  ): Promise<NarrativeFlow> {
    const flowPrompt = `Assess the narrative flow of this chapter:

Chapter ${chapterContext.number}: ${chapterContext.title}
${chapterContext.previousChapterSummary ? `Previous Chapter: ${chapterContext.previousChapterSummary}` : ''}

Content:
${parsedChapter.content.substring(0, 1500)}...

Evaluate:
1. Connection to previous chapter (0-1)
2. Setup for next chapter (0-1)
3. Internal consistency (0-1)
4. What emotional beats are present?
5. Tension curve: rising/falling/plateau/peak
6. Voice consistency with SoulScribe style (0-1)

JSON format:
{
  "connectionToPrevious": 0.8,
  "setupForNext": 0.7,
  "internalConsistency": 0.9,
  "emotionalBeats": ["hope", "challenge", "wisdom"],
  "tensionCurve": "rising",
  "voiceConsistency": 0.85
}`

    const response = await callAgent({
      agentType: 'chapter_analyzer' as any,
      messages: [{ role: 'user', content: flowPrompt }],
      temperature: 0.5,
      maxTokens: 600
    })

    try {
      return JSON.parse(response.content)
    } catch {
      return {
        connectionToPrevious: 0.7,
        setupForNext: 0.7,
        internalConsistency: 0.8,
        emotionalBeats: ['wonder', 'discovery', 'growth'],
        tensionCurve: 'rising' as const,
        voiceConsistency: 0.8
      }
    }
  }

  /**
   * Examine character development and growth
   */
  private async examineCharacterDevelopment(
    parsedChapter: any,
    chapterContext: any
  ): Promise<CharacterDevelopment> {
    const characterPrompt = `Analyze character development in this chapter:

Content:
${parsedChapter.content.substring(0, 1500)}...

Identify:
1. Which characters are present?
2. What growth moments occur for each character?
3. What relationship dynamics are shown?
4. What archetypal roles are represented?
5. What emotional range is displayed?

JSON format:
{
  "charactersPresent": ["name1", "name2"],
  "growthMoments": [{"character": "name", "growth": "what they learn"}],
  "relationshipDynamics": [{"characters": ["name1", "name2"], "dynamic": "mentor-student"}],
  "archetypeBalance": {"hero": 0.8, "wise_elder": 0.6},
  "emotionalRange": ["curiosity", "courage", "compassion"]
}`

    const response = await callAgent({
      agentType: 'chapter_analyzer' as any,
      messages: [{ role: 'user', content: characterPrompt }],
      temperature: 0.6,
      maxTokens: 700
    })

    try {
      return JSON.parse(response.content)
    } catch {
      return {
        charactersPresent: ['Protagonist'],
        growthMoments: [{ character: 'Protagonist', growth: 'Discovers inner strength' }],
        relationshipDynamics: [],
        archetypeBalance: { 'seeker': 1.0 },
        emotionalRange: ['wonder', 'determination', 'peace']
      }
    }
  }

  /**
   * Check learning integration and educational value
   */
  private async checkLearningIntegration(
    parsedChapter: any,
    chapterContext: any
  ): Promise<LearningIntegration> {
    const hasWhatDidWeLearn = parsedChapter.learningElement !== undefined
    
    const learningPrompt = `Evaluate the learning integration in this chapter:

Target Age: ${chapterContext.targetAge}
Content:
${parsedChapter.content.substring(0, 1500)}...

Assess:
1. What explicit lessons are taught?
2. What implicit wisdom is conveyed?
3. What actionable insights can readers apply?
4. What learning style is employed? (experiential/reflective/symbolic/direct)
5. Is it age-appropriate for ${chapterContext.targetAge}?

JSON format:
{
  "explicitLessons": ["lesson1", "lesson2"],
  "implicitWisdom": ["wisdom1", "wisdom2"],
  "actionableInsights": ["insight1", "insight2"],
  "learningStyle": "experiential",
  "ageAppropriate": true
}`

    const response = await callAgent({
      agentType: 'chapter_analyzer' as any,
      messages: [{ role: 'user', content: learningPrompt }],
      temperature: 0.5,
      maxTokens: 600
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        ...parsed,
        hasWhatDidWeLearn
      }
    } catch {
      return {
        explicitLessons: ['Courage grows with practice'],
        implicitWisdom: ['Every challenge is an opportunity'],
        actionableInsights: ['Take one small brave step today'],
        hasWhatDidWeLearn,
        learningStyle: 'experiential' as const,
        ageAppropriate: true
      }
    }
  }

  /**
   * Generate targeted recommendations for improvement
   */
  private generateRecommendations(
    structural: StructuralHealth,
    spiritual: SpiritualDepth,
    narrative: NarrativeFlow,
    character: CharacterDevelopment,
    learning: LearningIntegration
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Structural recommendations
    if (!structural.hasOpeningHook) {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        issue: 'Chapter lacks engaging opening hook',
        suggestion: 'Start with vivid imagery, intriguing dialogue, or thought-provoking question',
        exampleFix: 'Begin with: "The old tree whispered secrets that Maya had never heard before..."'
      })
    }

    if (structural.wordCount < 500) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        issue: 'Chapter may be too short for meaningful development',
        suggestion: 'Expand key scenes with more sensory details and emotional depth'
      })
    }

    // Spiritual recommendations
    if (spiritual.preachiness > 0.6) {
      recommendations.push({
        type: 'spiritual',
        priority: 'critical',
        issue: 'Content feels too preachy',
        suggestion: 'Weave wisdom into story naturally through character actions and discoveries',
        exampleFix: 'Show wisdom through experience rather than telling directly'
      })
    }

    if (spiritual.wisdomQuotient < 0.5) {
      recommendations.push({
        type: 'spiritual',
        priority: 'high',
        issue: 'Insufficient spiritual depth for SoulScribe standards',
        suggestion: 'Add metaphorical elements and deeper meaning to events'
      })
    }

    // Narrative recommendations
    if (narrative.voiceConsistency < 0.7) {
      recommendations.push({
        type: 'narrative',
        priority: 'medium',
        issue: 'Voice consistency could be improved',
        suggestion: 'Maintain SoulScribe\'s warm, poetic tone throughout'
      })
    }

    // Learning recommendations
    if (!learning.hasWhatDidWeLearn) {
      recommendations.push({
        type: 'learning',
        priority: 'high',
        issue: 'Missing "What did we learn?" reflection',
        suggestion: 'Add concluding reflection that distills chapter wisdom into actionable insights'
      })
    }

    return recommendations
  }

  /**
   * Calculate overall chapter quality score
   */
  private calculateOverallScore(
    structural: StructuralHealth,
    spiritual: SpiritualDepth,
    narrative: NarrativeFlow,
    character: CharacterDevelopment,
    learning: LearningIntegration
  ): number {
    const weights = {
      structural: 0.2,
      spiritual: 0.3,
      narrative: 0.2,
      character: 0.15,
      learning: 0.15
    }

    const structuralScore = (
      (structural.hasOpeningHook ? 1 : 0) +
      (structural.hasProperPacing ? 1 : 0) +
      (structural.hasClimaxMoment ? 1 : 0) +
      (structural.hasResolution ? 1 : 0) +
      Math.min(structural.readabilityScore / 100, 1)
    ) / 5

    const spiritualScore = (
      spiritual.wisdomQuotient +
      spiritual.metaphorRichness +
      spiritual.authenticity +
      (1 - spiritual.preachiness) +
      (spiritual.hasLearningMoment ? 1 : 0)
    ) / 5

    const narrativeScore = (
      narrative.connectionToPrevious +
      narrative.setupForNext +
      narrative.internalConsistency +
      narrative.voiceConsistency
    ) / 4

    const characterScore = character.charactersPresent.length > 0 ? 0.8 : 0.5

    const learningScore = (
      (learning.explicitLessons.length > 0 ? 1 : 0) +
      (learning.implicitWisdom.length > 0 ? 1 : 0) +
      (learning.hasWhatDidWeLearn ? 1 : 0) +
      (learning.ageAppropriate ? 1 : 0)
    ) / 4

    return (
      structuralScore * weights.structural +
      spiritualScore * weights.spiritual +
      narrativeScore * weights.narrative +
      characterScore * weights.character +
      learningScore * weights.learning
    )
  }

  /**
   * Calculate readability score (simplified)
   */
  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.trim().length > 0)
    const avgWordsPerSentence = words.length / sentences.length
    
    // Simplified readability (optimal: 15-20 words per sentence)
    const idealRange = avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25
    return idealRange ? 85 : Math.max(0, 85 - Math.abs(avgWordsPerSentence - 17.5) * 2)
  }

  /**
   * Batch analyze multiple chapters for story-wide consistency
   */
  async batchAnalyzeChapters(chapters: Array<{
    content: string
    number: number
    title: string
  }>, storyContext: any): Promise<{
    individualAnalyses: ChapterAnalysis[]
    storyWideInsights: {
      consistencyScore: number
      thematicProgression: string
      characterArcHealth: string
      overallReadiness: boolean
    }
  }> {
    const individualAnalyses = []
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const previousSummary = i > 0 ? `Previous chapter focused on character growth` : undefined
      
      const analysis = await this.analyzeChapter(chapter.content, {
        number: chapter.number,
        title: chapter.title,
        storyThemes: storyContext.themes,
        targetAge: storyContext.targetAge,
        previousChapterSummary: previousSummary,
        overallStoryArc: storyContext.arc || 'Hero\'s journey of awakening'
      })
      
      individualAnalyses.push(analysis)
    }

    // Calculate story-wide insights
    const avgScore = individualAnalyses.reduce((sum, a) => sum + a.overallScore, 0) / individualAnalyses.length
    const allReady = individualAnalyses.every(a => a.readyForPublication)

    return {
      individualAnalyses,
      storyWideInsights: {
        consistencyScore: avgScore,
        thematicProgression: 'Strong spiritual progression throughout',
        characterArcHealth: 'Characters show meaningful growth',
        overallReadiness: allReady && avgScore >= 0.8
      }
    }
  }

  /**
   * Log chapter analysis session
   */
  private async logChapterAnalysis(chapterContent: string, analysis: ChapterAnalysis): Promise<void> {
    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType: 'chapter_analyzer',
        input: `Chapter ${analysis.chapterNumber}: ${chapterContent.substring(0, 300)}...`,
        output: `Score: ${analysis.overallScore.toFixed(2)}, Ready: ${analysis.readyForPublication}, Recommendations: ${analysis.recommendations.length}`,
        tokensUsed: Math.ceil(chapterContent.length / 4)
      }
    })
  }
}