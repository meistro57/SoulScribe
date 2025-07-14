import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const story = await prisma.story.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error("Error fetching story:", error)
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, summary, genre, mood, theme, status, isPublic } = body

    const story = await prisma.story.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary && { summary }),
        ...(genre && { genre }),
        ...(mood && { mood }),
        ...(theme && { theme }),
        ...(status && { status }),
        ...(typeof isPublic === "boolean" && { isPublic }),
      },
    })

    if (story.count === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    const updatedStory = await prisma.story.findUnique({
      where: { id },
    })

    return NextResponse.json({ story: updatedStory })
  } catch (error) {
    console.error("Error updating story:", error)
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const result = await prisma.story.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Story deleted successfully" })
  } catch (error) {
    console.error("Error deleting story:", error)
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    )
  }
}