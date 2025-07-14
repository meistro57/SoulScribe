"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StoryGenre, StoryMood } from "@/generated/prisma"

export default function CreateStory() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    theme: "",
    genre: "" as StoryGenre | "",
    mood: "" as StoryMood | "",
    prompt: "",
    temperature: 0.7,
    model: "openai" as "openai" | "anthropic"
  })

  const genres = [
    { value: "FANTASY", label: "Fantasy" },
    { value: "SPIRITUAL", label: "Spiritual" },
    { value: "WISDOM", label: "Wisdom" },
    { value: "PARABLE", label: "Parable" },
    { value: "MEDITATION", label: "Meditation" },
    { value: "INSPIRATION", label: "Inspiration" },
    { value: "MYTHOLOGY", label: "Mythology" },
    { value: "PHILOSOPHY", label: "Philosophy" },
    { value: "MYSTICAL", label: "Mystical" },
    { value: "SELF_HELP", label: "Self Help" },
  ]

  const moods = [
    { value: "PEACEFUL", label: "Peaceful" },
    { value: "INSPIRING", label: "Inspiring" },
    { value: "CONTEMPLATIVE", label: "Contemplative" },
    { value: "UPLIFTING", label: "Uplifting" },
    { value: "TRANSFORMATIVE", label: "Transformative" },
    { value: "HEALING", label: "Healing" },
    { value: "GROUNDING", label: "Grounding" },
    { value: "AWAKENING", label: "Awakening" },
    { value: "ENLIGHTENING", label: "Enlightening" },
    { value: "COMFORTING", label: "Comforting" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          genre: formData.genre || undefined,
          mood: formData.mood || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/stories/${data.story.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate story")
      }
    } catch (error) {
      console.error("Error generating story:", error)
      alert("An error occurred while generating your story")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Story
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let AI help you craft a transformative story that blends ancient wisdom with modern insights
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="e.g., forgiveness, inner peace, courage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genre
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value as StoryGenre })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a genre</option>
                  {genres.map((genre) => (
                    <option key={genre.value} value={genre.value}>
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood
                </label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value as StoryMood })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a mood</option>
                  {moods.map((mood) => (
                    <option key={mood.value} value={mood.value}>
                      {mood.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value as "openai" | "anthropic" })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="openai">OpenAI GPT-4</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Guidance (Optional)
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={4}
                placeholder="Share any specific ideas, characters, or elements you'd like in your story..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creativity Level: {formData.temperature}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Story
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}