import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StoryStatus, StoryGenre, StoryMood } from "@/generated/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const genre = searchParams.get("genre")
    const mood = searchParams.get("mood")

    const where = {
      userId: session.user.id,
      ...(status && { status: status as StoryStatus }),
      ...(genre && { genre: genre as StoryGenre }),
      ...(mood && { mood: mood as StoryMood }),
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          genre: true,
          mood: true,
          theme: true,
          status: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.story.count({ where }),
    ])

    return NextResponse.json({
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    )
  }
}