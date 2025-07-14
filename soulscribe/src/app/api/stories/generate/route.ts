import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStory } from "@/lib/ai"
import { StoryGenre, StoryMood } from "@/generated/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { theme, genre, mood, prompt, temperature, model } = body

    // Generate the story using AI
    const generatedStory = await generateStory({
      theme,
      genre: genre as StoryGenre,
      mood: mood as StoryMood,
      prompt,
      temperature,
      model
    })

    // Save the story to the database
    const story = await prisma.story.create({
      data: {
        title: generatedStory.title,
        content: generatedStory.content,
        summary: generatedStory.summary,
        genre: genre as StoryGenre,
        mood: mood as StoryMood,
        theme,
        prompt,
        model,
        temperature,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ story, generated: generatedStory })
  } catch (error) {
    console.error("Story generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    )
  }
}