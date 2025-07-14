import { StoryGenre, StoryMood } from "@/generated/prisma"

export interface StoryGenerationRequest {
  theme?: string
  genre?: StoryGenre
  mood?: StoryMood
  prompt?: string
  temperature?: number
  model?: "openai" | "anthropic"
}

export interface StoryGenerationResponse {
  title: string
  content: string
  summary: string
}

export async function generateStory({
  theme,
  genre,
  mood,
  prompt,
  temperature = 0.7,
  model = "openai"
}: StoryGenerationRequest): Promise<StoryGenerationResponse> {
  const systemPrompt = `You are SoulScribe, an AI storyteller that weaves ancient wisdom with modern insights to create transformative stories. Your purpose is to awaken hearts and inspire souls through narrative.

Your stories should:
- Blend timeless wisdom with contemporary relevance
- Include profound insights that resonate with the human spirit
- Feature characters on journeys of self-discovery and awakening
- Incorporate elements of mindfulness, spirituality, and personal growth
- Leave readers with actionable wisdom they can apply to their lives

Create stories that are approximately 500-1000 words in length.`

  const userPrompt = buildUserPrompt({ theme, genre, mood, prompt })

  if (model === "openai") {
    return await generateWithOpenAI(systemPrompt, userPrompt, temperature)
  } else {
    return await generateWithAnthropic(systemPrompt, userPrompt, temperature)
  }
}

function buildUserPrompt({
  theme,
  genre,
  mood,
  prompt
}: Omit<StoryGenerationRequest, "temperature" | "model">): string {
  let userPrompt = "Create a transformative story"

  if (genre) {
    userPrompt += ` in the ${genre.toLowerCase()} genre`
  }

  if (mood) {
    userPrompt += ` with a ${mood.toLowerCase()} mood`
  }

  if (theme) {
    userPrompt += ` exploring the theme of "${theme}"`
  }

  if (prompt) {
    userPrompt += `. Additional guidance: ${prompt}`
  }

  userPrompt += `

Please respond with a JSON object containing:
- title: A compelling, inspiring title for the story
- content: The full story text
- summary: A brief 2-3 sentence summary of the story's message and wisdom`

  return userPrompt
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<StoryGenerationResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

async function generateWithAnthropic(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<StoryGenerationResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.content[0].text)
}