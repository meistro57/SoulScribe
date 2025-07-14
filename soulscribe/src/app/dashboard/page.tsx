"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { StoryGenre, StoryMood, StoryStatus } from "@/generated/prisma"

interface Story {
  id: string
  title: string
  summary: string
  genre: StoryGenre | null
  mood: StoryMood | null
  theme: string | null
  status: StoryStatus
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchStories()
    }
  }, [status])

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories")
      if (response.ok) {
        const data = await response.json()
        setStories(data.stories)
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Link
            href="/api/auth/signin"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your journey of storytelling and awakening continues
            </p>
          </div>
          <Link
            href="/dashboard/create"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
          >
            ✨ Create New Story
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No stories yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start your journey by creating your first transformative story
            </p>
            <Link
              href="/dashboard/create"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              Create Your First Story
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {story.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    story.status === "PUBLISHED" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : story.status === "DRAFT"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}>
                    {story.status.toLowerCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {story.summary}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {story.genre && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs">
                      {story.genre.toLowerCase()}
                    </span>
                  )}
                  {story.mood && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                      {story.mood.toLowerCase()}
                    </span>
                  )}
                  {story.theme && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-xs">
                      {story.theme}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/dashboard/stories/${story.id}`}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}