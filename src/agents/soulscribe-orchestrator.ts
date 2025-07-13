import { callAgent, AgentType } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import type { Story, Chapter, AgentSession } from '@/types/story'

export class SoulScribeOrchestrator {
  private storyId: string

  constructor(storyId: string) {
    this.storyId = storyId
  }

  async logAgentSession(
    agentType: AgentType,
    input: string,
    output: string,
    tokensUsed: number
  ): Promise<void> {
    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType,
        input,
        output,
        tokensUsed,
      }
    })
  }

  async generateStoryOutline(questionnaireData: any): Promise<string> {
    const prompt = `Create a comprehensive story outline based on this questionnaire data:
    ${JSON.stringify(questionnaireData, null, 2)}
    
    Include:
    1. Story premise and central spiritual theme
    2. Character archetypes and growth journeys
    3. Setting symbolism and atmosphere
    4. Chapter-by-chapter progression
    5. Key metaphors and spiritual lessons
    6. The final awakening/resolution`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      maxTokens: 3000
    })

    await this.logAgentSession('soulscribe', prompt, response.content, response.tokensUsed)
    return response.content
  }

  async generateChapter(chapterNumber: number, chapterTitle: string, context: string): Promise<{
    content: string
    summary: string
    keyLessons: string[]
  }> {
    // Step 1: Generate initial chapter content
    const initialContent = await this.generateInitialChapter(chapterNumber, chapterTitle, context)
    
    // Step 2: Review and enhance with specialized agents
    const enhancedContent = await this.enhanceChapter(initialContent, context)
    
    // Step 3: Quality check and finalize
    const finalContent = await this.qualityCheckChapter(enhancedContent)
    
    // Step 4: Generate learning synthesis
    const learningSynthesis = await this.generateLearningSynthesis(finalContent)

    return {
      content: finalContent,
      summary: learningSynthesis.summary,
      keyLessons: learningSynthesis.lessons
    }
  }

  private async generateInitialChapter(chapterNumber: number, title: string, context: string): Promise<string> {
    const prompt = `Generate Chapter ${chapterNumber}: "${title}"

    Story Context:
    ${context}

    Write a complete chapter following the SoulScribe style:
    - Rich, evocative imagery
    - Natural spiritual themes
    - Character development
    - Meaningful dialogue
    - Mystical yet grounded tone`

    const response = await callAgent({
      agentType: 'soulscribe',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      maxTokens: 4000
    })

    await this.logAgentSession('soulscribe', prompt, response.content, response.tokensUsed)
    return response.content
  }

  private async enhanceChapter(content: string, context: string): Promise<string> {
    // Metaphor enhancement
    const metaphorPrompt = `Review and enhance the metaphorical depth of this chapter:
    
    Context: ${context}
    Chapter: ${content}
    
    Strengthen symbolic language and archetypal elements while maintaining natural flow.`

    const metaphorResponse = await callAgent({
      agentType: 'metaphor_architect',
      messages: [{ role: 'user', content: metaphorPrompt }],
      temperature: 0.7,
      maxTokens: 4000
    })

    await this.logAgentSession('metaphor_architect', metaphorPrompt, metaphorResponse.content, metaphorResponse.tokensUsed)

    // Wisdom weaving
    const wisdomPrompt = `Ensure this chapter carries meaningful spiritual lessons naturally:
    
    Enhanced Chapter: ${metaphorResponse.content}
    
    Verify that wisdom is woven organically into the narrative without being preachy.`

    const wisdomResponse = await callAgent({
      agentType: 'wisdom_weaver',
      messages: [{ role: 'user', content: wisdomPrompt }],
      temperature: 0.6,
      maxTokens: 4000
    })

    await this.logAgentSession('wisdom_weaver', wisdomPrompt, wisdomResponse.content, wisdomResponse.tokensUsed)
    return wisdomResponse.content
  }

  private async qualityCheckChapter(content: string): Promise<string> {
    const prompt = `Perform a final quality review of this chapter:
    
    ${content}
    
    Check for:
    - Narrative consistency
    - Character voice authenticity
    - Spiritual theme integration
    - Readability and flow
    - SoulScribe tone adherence`

    const response = await callAgent({
      agentType: 'quality_guardian',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      maxTokens: 4000
    })

    await this.logAgentSession('quality_guardian', prompt, response.content, response.tokensUsed)
    return response.content
  }

  private async generateLearningSynthesis(content: string): Promise<{
    summary: string
    lessons: string[]
  }> {
    const prompt = `Create a learning synthesis for this chapter:
    
    ${content}
    
    Provide:
    1. A brief summary (2-3 sentences)
    2. Key lessons/insights (3-4 actionable points)
    
    Format as JSON: {"summary": "...", "lessons": ["...", "..."]}`

    const response = await callAgent({
      agentType: 'learning_synthesis',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 1000
    })

    await this.logAgentSession('learning_synthesis', prompt, response.content, response.tokensUsed)

    try {
      return JSON.parse(response.content)
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        summary: "Chapter summary processing error",
        lessons: ["Key insights from this chapter"]
      }
    }
  }

  async continueStory(fromChapter: number): Promise<void> {
    const story = await prisma.story.findUnique({
      where: { id: this.storyId },
      include: {
        chapters: {
          orderBy: { number: 'asc' }
        },
        questionnaire: true
      }
    })

    if (!story) throw new Error('Story not found')

    // Build context from existing chapters
    const context = this.buildStoryContext(story)

    // Generate remaining chapters
    for (let i = fromChapter; i <= story.chapterCount; i++) {
      const chapterTitle = `Chapter ${i}` // This could be generated by an agent
      const chapterData = await this.generateChapter(i, chapterTitle, context)

      await prisma.chapter.create({
        data: {
          storyId: this.storyId,
          number: i,
          title: chapterTitle,
          content: chapterData.content,
          summary: chapterData.summary,
          keyLessons: chapterData.keyLessons,
          wordCount: chapterData.content.split(' ').length,
          status: 'draft'
        }
      })

      // Update context for next chapter
      context += `\n\nChapter ${i} Summary: ${chapterData.summary}`
    }

    // Update story status
    await prisma.story.update({
      where: { id: this.storyId },
      data: { status: 'reviewing' }
    })
  }

  private buildStoryContext(story: any): string {
    let context = `Title: ${story.title}\n`
    context += `Genre: ${story.genre}\n`
    context += `Themes: ${story.themes.join(', ')}\n`
    context += `Learning Objectives: ${story.learningObjectives.join(', ')}\n\n`
    
    if (story.outline) {
      context += `Outline:\n${story.outline}\n\n`
    }

    // Add existing chapters
    story.chapters.forEach((chapter: any) => {
      context += `Chapter ${chapter.number} Summary: ${chapter.summary}\n`
    })

    return context
  }
}