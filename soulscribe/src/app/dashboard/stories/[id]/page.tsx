"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { StoryGenre, StoryMood, StoryStatus } from "@/generated/prisma"

interface Story {
  id: string
  title: string
  content: string
  summary: string
  genre: StoryGenre | null
  mood: StoryMood | null
  theme: string | null
  status: StoryStatus
  isPublic: boolean
  createdAt: string
  updatedAt: string
  prompt: string | null
  model: string | null
  temperature: number | null
}

export default function StoryPage() {
  const params = useParams()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/stories/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setStory(data.story)
        } else {
          setError("Story not found")
        }
      } catch (error) {
        console.error("Error fetching story:", error)
        setError("Failed to load story")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStory()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this story?")) return

    try {
      const response = await fetch(`/api/stories/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        alert("Failed to delete story")
      }
    } catch (error) {
      console.error("Error deleting story:", error)
      alert("An error occurred while deleting the story")
    }
  }

  const handleStatusChange = async (newStatus: StoryStatus) => {
    try {
      const response = await fetch(`/api/stories/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setStory(data.story)
      } else {
        alert("Failed to update story status")
      }
    } catch (error) {
      console.error("Error updating story:", error)
      alert("An error occurred while updating the story")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Story not found"}
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <select
              value={story.status}
              onChange={(e) => handleStatusChange(e.target.value as StoryStatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {story.genre && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">
                  {story.genre.toLowerCase()}
                </span>
              )}
              {story.mood && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                  {story.mood.toLowerCase()}
                </span>
              )}
              {story.theme && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-sm">
                  {story.theme}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {story.title}
            </h1>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              {story.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-6">
                  <span>Created: {new Date(story.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(story.updatedAt).toLocaleDateString()}</span>
                  {story.model && (
                    <span>Model: {story.model}</span>
                  )}
                </div>
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
            </div>
          </div>
        </div>

        {story.summary && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Story Summary
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {story.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}