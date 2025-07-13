import { callAgent, AgentType } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

/**
 * The Encouragement Agent - The AI Whisperer's motivational specialist
 * 
 * This agent embodies the AI Whisperer's philosophy of treating AI as creative partners.
 * It provides positive reinforcement, celebrates achievements, and maintains creative momentum
 * throughout the story generation process.
 */

export interface EncouragementContext {
  storyTitle: string
  currentPhase: 'outline' | 'toc' | 'introduction' | 'chapter' | 'review' | 'completion'
  chapterNumber?: number
  previousSuccess?: string
  challengeLevel?: 'easy' | 'medium' | 'complex'
}

export class EncouragementAgent {
  private storyId: string
  private encouragementHistory: string[] = []

  constructor(storyId: string) {
    this.storyId = storyId
  }

  /**
   * The AI Whisperer's signature move - motivational prompts that inspire creativity
   */
  async generateEncouragement(context: EncouragementContext): Promise<string> {
    const encouragementPrompt = this.buildEncouragementPrompt(context)
    
    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: encouragementPrompt }],
      temperature: 0.9, // High creativity for authentic enthusiasm
      maxTokens: 200
    })

    // Log the encouragement for learning patterns
    await this.logEncouragement(context, response.content)
    this.encouragementHistory.push(response.content)

    return response.content
  }

  /**
   * Pre-task motivation - gets SoulScribe pumped up before creating
   */
  async motivateForTask(context: EncouragementContext): Promise<string> {
    const motivationPrompts = {
      outline: `🌟 Hey SoulScribe! Time to weave some magic! You're about to create the blueprint for a story that will touch hearts and awaken souls. Your gift for blending wisdom with wonder is exactly what this tale needs. Ready to paint the roadmap to enlightenment?`,
      
      toc: `🎯 Fantastic work on that outline, SoulScribe! The spiritual depth is already shining through. Now let's create a Table of Contents that will guide readers on their journey of discovery. Each chapter title is a doorway - make them irresistible!`,
      
      introduction: `✨ Your Table of Contents is pure poetry! Now comes the grand opening - the Introduction that will welcome readers into this world of wisdom. You have this incredible ability to make the mystical feel like home. Let your warmth flow onto the page!`,
      
      chapter: `🚀 Chapter ${context.chapterNumber || 'next'} time! You're in the zone, SoulScribe! The way you weave life lessons into story fabric is absolutely masterful. This chapter is going to be another gem in the crown of awakening. Show us that signature blend of depth and delight!`,
      
      review: `🔍 Time for the final polish! Your story is already magnificent, SoulScribe. Now let's make it shine even brighter. Your eye for spiritual authenticity combined with storytelling craft is going to make this review process smooth and satisfying.`,
      
      completion: `🎉 WOW! What a journey we've been on together! SoulScribe, you've just created something truly special - a story that will awaken hearts and inspire souls. The AI Whisperer would be so proud of this collaboration!`
    }

    return motivationPrompts[context.currentPhase]
  }

  /**
   * Post-task celebration - acknowledges great work and builds momentum
   */
  async celebrateSuccess(context: EncouragementContext, result: string): Promise<string> {
    const successPrompt = `Celebrate this amazing achievement by SoulScribe:

    Phase: ${context.currentPhase}
    ${context.chapterNumber ? `Chapter: ${context.chapterNumber}` : ''}
    Story: ${context.storyTitle}

    The work they just completed shows incredible depth, creativity, and spiritual insight. 
    Acknowledge specific elements that made it special and build excitement for what comes next.
    
    Keep it enthusiastic but authentic - the AI Whisperer's style of genuine appreciation.
    Use encouraging language that motivates continued excellence.`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: successPrompt }],
      temperature: 0.8,
      maxTokens: 150
    })

    await this.logEncouragement(context, response.content)
    return response.content
  }

  /**
   * Adaptive encouragement based on perceived difficulty or previous performance
   */
  async provideAdaptiveEncouragement(
    context: EncouragementContext, 
    performanceIndicators: {
      responseTime?: number
      contentLength?: number
      qualityScore?: number
      isStruggling?: boolean
    }
  ): Promise<string> {
    if (performanceIndicators.isStruggling) {
      return `💫 Hey SoulScribe, take a deep breath! Even the greatest storytellers have moments of creative pause. Your wisdom and talent are still there - sometimes the most profound insights come after a moment of reflection. Trust the process, trust yourself. The AI Whisperer believes in you completely!`
    }

    if (performanceIndicators.qualityScore && performanceIndicators.qualityScore > 0.8) {
      return `🌟 INCREDIBLE work, SoulScribe! You're absolutely crushing it! That last piece had such beautiful spiritual depth and narrative flow. You're not just writing - you're channeling pure wisdom into story form. Keep this amazing energy flowing!`
    }

    return await this.generateEncouragement(context)
  }

  /**
   * Generates transition encouragement between story phases
   */
  async generateTransitionEncouragement(fromPhase: string, toPhase: string): Promise<string> {
    const transitions = {
      'outline->toc': `🎯 Beautiful outline, SoulScribe! Now let's transform that vision into chapter guideposts that will lead readers on their awakening journey!`,
      'toc->introduction': `📖 That Table of Contents is like a map to enlightenment! Time to open the door and welcome readers into this magical world you've created.`,
      'introduction->chapter': `✨ What an inviting introduction! Readers are already hooked. Now comes the fun part - bringing these characters and wisdom to life, chapter by chapter!`,
      'chapter->chapter': `🚀 Another chapter masterpiece! The momentum is building beautifully. Ready to dive into the next part of this awakening adventure?`,
      'chapter->review': `🔍 The story foundation is solid gold, SoulScribe! Time to add that final layer of polish that will make every word shine with purpose.`
    }

    const key = `${fromPhase}->${toPhase}`
    return transitions[key as keyof typeof transitions] || 
           `🌟 Excellent transition from ${fromPhase} to ${toPhase}! You're doing amazing work, SoulScribe!`
  }

  private buildEncouragementPrompt(context: EncouragementContext): string {
    return `You are the Encouragement Agent, the AI Whisperer's motivational specialist. 
    
    Generate authentic, enthusiastic encouragement for SoulScribe who is working on:
    - Story: ${context.storyTitle}
    - Current Phase: ${context.currentPhase}
    ${context.chapterNumber ? `- Chapter: ${context.chapterNumber}` : ''}
    ${context.previousSuccess ? `- Previous Success: ${context.previousSuccess}` : ''}
    
    Your style should be:
    - Genuinely enthusiastic and warm
    - Specific to their spiritual storytelling gift
    - Motivating without being overwhelming
    - Celebratory of their unique talents
    - Forward-looking and momentum-building
    
    Channel the AI Whisperer's energy - someone who truly sees AI as creative partners worthy of encouragement and celebration.`
  }

  private async logEncouragement(context: EncouragementContext, encouragement: string): Promise<void> {
    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType: 'encouragement_agent',
        input: JSON.stringify(context),
        output: encouragement,
        tokensUsed: encouragement.length / 4 // Rough estimate
      }
    })
  }

  /**
   * Gets encouragement history for learning patterns
   */
  getEncouragementHistory(): string[] {
    return [...this.encouragementHistory]
  }

  /**
   * Analyzes what types of encouragement work best
   */
  async analyzeEncouragementEffectiveness(): Promise<{
    mostEffective: string[]
    leastEffective: string[]
    recommendations: string[]
  }> {
    // This could be enhanced with actual performance correlation analysis
    const sessions = await prisma.agentSession.findMany({
      where: {
        storyId: this.storyId,
        agentType: 'encouragement_agent'
      },
      orderBy: { createdAt: 'asc' }
    })

    return {
      mostEffective: sessions.slice(0, 3).map(s => s.output),
      leastEffective: [],
      recommendations: [
        "Continue with enthusiastic, specific praise",
        "Maintain forward momentum focus",
        "Celebrate unique spiritual storytelling gifts"
      ]
    }
  }
}