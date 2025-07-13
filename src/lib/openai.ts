import OpenAI from 'openai'
import { SOULSCRIBE_SYSTEM_PROMPT, AGENT_PROMPTS } from './soulscribe-prompt'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type AgentType = 'soulscribe' | 'wisdom_weaver' | 'metaphor_architect' | 'character_soul' | 'learning_synthesis' | 'quality_guardian'

export interface AgentRequest {
  agentType: AgentType
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
  temperature?: number
  maxTokens?: number
}

export interface AgentResponse {
  content: string
  tokensUsed: number
  agentType: AgentType
}

export async function callAgent({
  agentType,
  messages,
  temperature = 0.8,
  maxTokens = 2000
}: AgentRequest): Promise<AgentResponse> {
  const systemPrompt = agentType === 'soulscribe' 
    ? SOULSCRIBE_SYSTEM_PROMPT 
    : AGENT_PROMPTS[agentType.toUpperCase() as keyof typeof AGENT_PROMPTS]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature,
    max_tokens: maxTokens,
  })

  const content = completion.choices[0]?.message?.content || ''
  const tokensUsed = completion.usage?.total_tokens || 0

  return {
    content,
    tokensUsed,
    agentType
  }
}

export async function generateStoryOutline(questionnaire: any): Promise<string> {
  const prompt = `Based on this story questionnaire, create a detailed story outline:

Genre: ${questionnaire.genre}
Target Age: ${questionnaire.targetAge}
Chapters: ${questionnaire.chapterCount}
Primary Theme: ${questionnaire.primaryTheme}
Life Lesson: ${questionnaire.lifeLesson}
Spiritual Elements: ${questionnaire.spiritualElements.join(', ')}
Writing Style: ${questionnaire.writingStyle}

Create an outline that includes:
1. Story premise and central conflict
2. Character introductions and arcs
3. Chapter-by-chapter breakdown
4. Key spiritual/metaphorical elements
5. The learning journey and resolution

Make it engaging, meaningful, and true to the SoulScribe vision.`

  const response = await callAgent({
    agentType: 'soulscribe',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    maxTokens: 3000
  })

  return response.content
}

export async function generateChapter(
  storyContext: string,
  chapterNumber: number,
  chapterTitle: string,
  previousChapterSummary?: string
): Promise<{ content: string; summary: string; keyLessons: string[] }> {
  const prompt = `Generate Chapter ${chapterNumber}: "${chapterTitle}"

Story Context:
${storyContext}

${previousChapterSummary ? `Previous Chapter Summary: ${previousChapterSummary}` : ''}

Write a complete chapter that:
1. Advances the story naturally
2. Contains rich, sensory descriptions
3. Includes meaningful dialogue
4. Weaves in spiritual themes naturally
5. Maintains the SoulScribe tone and style

After the chapter content, provide:
- A brief summary (2-3 sentences)
- Key lessons/insights from this chapter (2-3 bullet points)`

  const response = await callAgent({
    agentType: 'soulscribe',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    maxTokens: 4000
  })

  // Parse the response to extract content, summary, and lessons
  const content = response.content
  // This would need more sophisticated parsing in a real implementation
  
  return {
    content,
    summary: "Chapter summary would be extracted here",
    keyLessons: ["Lesson 1", "Lesson 2"]
  }
}