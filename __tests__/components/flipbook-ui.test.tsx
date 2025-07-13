import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlipbookUI } from '@/components/flipbook-ui'
import { StoryData } from '@/components/flipbook-ui'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock audio elements
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 100,
  volume: 0.8,
  muted: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
})

describe('FlipbookUI - The Magical Story Experience 📚✨', () => {
  const mockStory: StoryData = {
    id: 'story-123',
    title: 'The Whispering Woods',
    author: 'SoulScribe AI',
    coverImage: '/images/whispering-woods-cover.jpg',
    chapters: [
      {
        number: 1,
        title: 'The Call to Adventure',
        content: `Luna sat by her window, feeling a restless energy stirring within her heart.

[S1] "There must be more to life than this," she whispered to herself. (with longing)

The wind seemed to answer, carrying whispers from the ancient forest beyond the town.

What did we learn from this chapter? Sometimes our restlessness is not a problem to solve, but a call to adventure waiting to be answered.`,
        summary: 'Luna feels the call to begin her spiritual journey',
        keyLessons: ['Following inner guidance', 'Recognizing spiritual restlessness'],
        audioUrl: '/audio/chapter1.mp3',
        isGenerating: false,
        isComplete: true,
        estimatedReadTime: 5
      },
      {
        number: 2,
        title: 'Meeting the Wise Elder',
        content: `[S2] "Welcome, dear child," rumbled a voice from the ancient oak. (with warmth)

[S1] "Are you... speaking to me?" Luna asked in wonder. (with awe)

[S2] "I speak to all who remember how to listen," the Elder Oak replied gently.

What did we learn from this chapter? Nature has always been speaking to us; we just need to remember how to listen.`,
        summary: 'Luna encounters her first spiritual teacher',
        keyLessons: ['Learning to listen to nature', 'Opening to mystical experiences'],
        audioUrl: '/audio/chapter2.mp3',
        isGenerating: false,
        isComplete: true,
        estimatedReadTime: 6
      },
      {
        number: 3,
        title: 'The Return Home',
        content: `Luna walked back toward town, forever changed by her journey.

[S1] "I understand now," she said to herself with quiet confidence. (with inner knowing)

The same restlessness was gone, replaced by a deep sense of peace and purpose.

What did we learn from this chapter? True journeys lead us not to new places, but to new understanding of ourselves.`,
        summary: 'Luna integrates her wisdom and returns transformed',
        keyLessons: ['Integration of spiritual insights', 'Finding peace within'],
        isGenerating: false,
        isComplete: true,
        estimatedReadTime: 4
      }
    ],
    tableOfContents: {
      chapters: [
        { number: 1, title: 'The Call to Adventure' },
        { number: 2, title: 'Meeting the Wise Elder' },
        { number: 3, title: 'The Return Home' }
      ]
    },
    introduction: 'Welcome to the mystical journey of Luna, a young seeker who discovers that the greatest adventures happen within.',
    learningReflection: 'This story reminds us that spiritual awakening often begins with restlessness and leads us back to the wisdom that was always within us.',
    totalReadTime: 15,
    isGenerating: false,
    generationProgress: {
      phase: 'completed',
      currentStep: 'All chapters complete',
      completedSteps: ['outline', 'toc', 'chapters', 'reflection'],
      estimatedTimeRemaining: 0
    }
  }

  const defaultProps = {
    story: mockStory,
    onPageChange: jest.fn(),
    onAudioToggle: jest.fn(),
    onChapterComplete: jest.fn(),
    realTimeUpdates: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Story Display and Navigation', () => {
    it('should render the story cover page initially', () => {
      render(<FlipbookUI {...defaultProps} />)

      expect(screen.getByText('The Whispering Woods')).toBeInTheDocument()
      expect(screen.getByText('by SoulScribe AI')).toBeInTheDocument()
      expect(screen.getByText('15 min read')).toBeInTheDocument()
      
      // Should show cover image if provided
      const coverImage = screen.getByAltText('The Whispering Woods cover')
      expect(coverImage).toBeInTheDocument()
      expect(coverImage).toHaveAttribute('src', '/images/whispering-woods-cover.jpg')
    })

    it('should navigate between pages using flip controls', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      // Start on cover (page 0)
      expect(screen.getByText('The Whispering Woods')).toBeInTheDocument()

      // Navigate to table of contents (page 1)
      const nextButton = screen.getByLabelText(/next page/i)
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Table of Contents')).toBeInTheDocument()
        expect(screen.getByText('1. The Call to Adventure')).toBeInTheDocument()
      })

      // Navigate to first chapter (page 2)
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Chapter 1: The Call to Adventure')).toBeInTheDocument()
        expect(screen.getByText(/Luna sat by her window/)).toBeInTheDocument()
      })

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2)
    })

    it('should disable navigation buttons appropriately', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      // Previous button should be disabled on cover page
      const prevButton = screen.getByLabelText(/previous page/i)
      expect(prevButton).toBeDisabled()

      // Navigate to last page
      const nextButton = screen.getByLabelText(/next page/i)
      
      // Go through all pages to reach the end
      for (let i = 0; i < 4; i++) { // Cover, TOC, 3 chapters
        await user.click(nextButton)
        await waitFor(() => {}) // Wait for navigation
      }

      // Next button should be disabled on last page
      expect(nextButton).toBeDisabled()
    })

    it('should display chapter content with proper formatting', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to first chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Should display chapter title
      expect(screen.getByText('Chapter 1: The Call to Adventure')).toBeInTheDocument()

      // Should display dialogue with speaker tags
      expect(screen.getByText(/There must be more to life than this/)).toBeInTheDocument()
      expect(screen.getByText(/\[S1\]/)).toBeInTheDocument()

      // Should display learning reflection
      expect(screen.getByText(/What did we learn from this chapter\?/)).toBeInTheDocument()
      expect(screen.getByText(/call to adventure waiting to be answered/)).toBeInTheDocument()

      // Should display reading time
      expect(screen.getByText('5 min read')).toBeInTheDocument()
    })
  })

  describe('Audio Integration', () => {
    it('should display audio controls when chapter has audio', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to first chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelLabel(/next page/i))

      // Should show audio controls
      expect(screen.getByLabelText(/play audio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/volume control/i)).toBeInTheDocument()
    })

    it('should play and pause audio correctly', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to chapter with audio
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Click play button
      const playButton = screen.getByLabelText(/play audio/i)
      await user.click(playButton)

      expect(mockAudio.play).toHaveBeenCalled()
      expect(defaultProps.onAudioToggle).toHaveBeenCalledWith(true)

      // Should change to pause button
      const pauseButton = screen.getByLabelText(/pause audio/i)
      await user.click(pauseButton)

      expect(mockAudio.pause).toHaveBeenCalled()
      expect(defaultProps.onAudioToggle).toHaveBeenCalledWith(false)
    })

    it('should auto-play audio when navigating if already playing', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to first chapter and start audio
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))
      
      const playButton = screen.getByLabelText(/play audio/i)
      await user.click(playButton)

      // Navigate to next chapter
      const nextButton = screen.getByLabelText(/next page/i)
      await user.click(nextButton)

      // Should automatically load and play next chapter's audio
      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalledTimes(2) // Once for first chapter, once for second
      })
    })

    it('should control volume and mute correctly', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to chapter with audio
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Test volume control
      const volumeSlider = screen.getByRole('slider', { name: /volume/i })
      fireEvent.change(volumeSlider, { target: { value: '0.5' } })

      expect(mockAudio.volume).toBe(0.5)

      // Test mute button
      const muteButton = screen.getByLabelText(/mute/i)
      await user.click(muteButton)

      expect(mockAudio.muted).toBe(true)
    })
  })

  describe('Real-time Generation Display', () => {
    it('should show generation progress for incomplete chapters', () => {
      const storyWithGenerating = {
        ...mockStory,
        chapters: [
          {
            ...mockStory.chapters[0],
            isGenerating: true,
            isComplete: false
          },
          ...mockStory.chapters.slice(1)
        ],
        isGenerating: true,
        generationProgress: {
          phase: 'chapters',
          currentStep: 'Generating Chapter 1',
          completedSteps: ['outline', 'toc'],
          estimatedTimeRemaining: 120
        }
      }

      render(<FlipbookUI story={storyWithGenerating} />)

      // Should show generation progress
      expect(screen.getByText(/Generating Chapter 1/)).toBeInTheDocument()
      expect(screen.getByText(/2 min remaining/)).toBeInTheDocument()
      
      // Should show loading state for incomplete chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))
      
      expect(screen.getByText(/Chapter being written.../)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should update content in real-time as chapters complete', async () => {
      const { rerender } = render(<FlipbookUI {...defaultProps} />)

      // Start with incomplete chapter
      const incompleteStory = {
        ...mockStory,
        chapters: [
          {
            ...mockStory.chapters[0],
            isGenerating: true,
            isComplete: false,
            content: ''
          }
        ]
      }

      rerender(<FlipbookUI story={incompleteStory} />)

      // Navigate to the generating chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      expect(screen.getByText(/Chapter being written.../)).toBeInTheDocument()

      // Update with completed chapter
      const completedStory = {
        ...mockStory,
        chapters: [mockStory.chapters[0]] // First chapter now complete
      }

      rerender(<FlipbookUI story={completedStory} />)

      await waitFor(() => {
        expect(screen.getByText(/Luna sat by her window/)).toBeInTheDocument()
        expect(screen.queryByText(/Chapter being written.../)).not.toBeInTheDocument()
      })

      expect(defaultProps.onChapterComplete).toHaveBeenCalledWith(1)
    })

    it('should show appropriate loading animations and progress indicators', () => {
      const generatingStory = {
        ...mockStory,
        isGenerating: true,
        generationProgress: {
          phase: 'chapters',
          currentStep: 'Creating mystical dialogue',
          completedSteps: ['outline', 'toc'],
          estimatedTimeRemaining: 90
        }
      }

      render(<FlipbookUI story={generatingStory} />)

      // Should show global progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/Creating mystical dialogue/)).toBeInTheDocument()
      
      // Should show spinning/loading animations
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('3D Flip Animation and Gestures', () => {
    it('should respond to swipe gestures for page navigation', async () => {
      render(<FlipbookUI {...defaultProps} />)

      const flipbook = screen.getByTestId('flipbook-container')

      // Simulate swipe left (next page)
      fireEvent.touchStart(flipbook, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchMove(flipbook, {
        touches: [{ clientX: 50, clientY: 100 }]
      })
      fireEvent.touchEnd(flipbook)

      await waitFor(() => {
        expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)
      })

      // Simulate swipe right (previous page)
      fireEvent.touchStart(flipbook, {
        touches: [{ clientX: 50, clientY: 100 }]
      })
      fireEvent.touchMove(flipbook, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchEnd(flipbook)

      await waitFor(() => {
        expect(defaultProps.onPageChange).toHaveBeenCalledWith(0)
      })
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      const flipbook = screen.getByTestId('flipbook-container')
      flipbook.focus()

      // Arrow right should go to next page
      await user.keyboard('{ArrowRight}')
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)

      // Arrow left should go to previous page
      await user.keyboard('{ArrowLeft}')
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(0)

      // Space should toggle audio if on a chapter page
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))
      
      await user.keyboard(' ')
      expect(defaultProps.onAudioToggle).toHaveBeenCalled()
    })

    it('should prevent navigation during flip animation', async () => {
      const user = userEvent.setup()
      render(<FlipbookUI {...defaultProps} />)

      const nextButton = screen.getByLabelText(/next page/i)

      // Click rapidly multiple times
      await user.click(nextButton)
      await user.click(nextButton)
      await user.click(nextButton)

      // Should only register one navigation due to animation lock
      await waitFor(() => {
        expect(defaultProps.onPageChange).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Navigation buttons should have proper labels
      expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/next page/i)).toBeInTheDocument()

      // Should have proper page indicators
      expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument()

      // Should have landmark roles
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should support screen reader navigation', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Should announce page changes
      fireEvent.click(screen.getByLabelText(/next page/i))
      
      expect(screen.getByLabelText(/current page: table of contents/i)).toBeInTheDocument()

      // Chapter content should be readable by screen readers
      fireEvent.click(screen.getByLabelText(/next page/i))
      
      const chapterContent = screen.getByRole('article')
      expect(chapterContent).toHaveAttribute('aria-label', 'Chapter 1: The Call to Adventure')
    })

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<FlipbookUI {...defaultProps} />)

      // Should use simpler transitions instead of 3D flips
      const flipbook = screen.getByTestId('flipbook-container')
      expect(flipbook).toHaveClass('reduced-motion')
    })

    it('should display estimated reading times accurately', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to first chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      expect(screen.getByText('5 min read')).toBeInTheDocument()

      // Navigate to second chapter
      fireEvent.click(screen.getByLabelText(/next page/i))

      expect(screen.getByText('6 min read')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing audio gracefully', () => {
      const storyWithoutAudio = {
        ...mockStory,
        chapters: [
          {
            ...mockStory.chapters[0],
            audioUrl: undefined
          }
        ]
      }

      render(<FlipbookUI story={storyWithoutAudio} />)

      // Navigate to chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Should not show audio controls
      expect(screen.queryByLabelText(/play audio/i)).not.toBeInTheDocument()
      
      // Should show text-only indicator
      expect(screen.getByText(/Text only/i)).toBeInTheDocument()
    })

    it('should handle empty or malformed chapter content', () => {
      const storyWithEmptyChapter = {
        ...mockStory,
        chapters: [
          {
            ...mockStory.chapters[0],
            content: '',
            title: '',
            summary: ''
          }
        ]
      }

      render(<FlipbookUI story={storyWithEmptyChapter} />)

      // Navigate to empty chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Should show placeholder content
      expect(screen.getByText(/Chapter content loading.../)).toBeInTheDocument()
    })

    it('should handle audio loading failures', async () => {
      const user = userEvent.setup()
      
      // Mock audio error
      mockAudio.play.mockRejectedValue(new Error('Audio failed to load'))

      render(<FlipbookUI {...defaultProps} />)

      // Navigate to chapter and try to play audio
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      const playButton = screen.getByLabelText(/play audio/i)
      await user.click(playButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Audio unavailable/i)).toBeInTheDocument()
      })

      // Should not crash the component
      expect(screen.getByText('Chapter 1: The Call to Adventure')).toBeInTheDocument()
    })
  })

  describe('Performance and Optimization', () => {
    it('should lazy load chapter content and images', () => {
      render(<FlipbookUI {...defaultProps} />)

      // Initially only cover page content should be in DOM
      expect(screen.getByText('The Whispering Woods')).toBeInTheDocument()
      expect(screen.queryByText(/Luna sat by her window/)).not.toBeInTheDocument()

      // Navigate to load chapter content
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      expect(screen.getByText(/Luna sat by her window/)).toBeInTheDocument()
    })

    it('should preload adjacent pages for smooth navigation', async () => {
      render(<FlipbookUI {...defaultProps} />)

      // Navigate to a middle chapter
      fireEvent.click(screen.getByLabelText(/next page/i))
      fireEvent.click(screen.getByLabelText(/next page/i))

      // Both previous and next chapter content should be preloaded
      await waitFor(() => {
        expect(screen.getByTestId('preloaded-prev-page')).toBeInTheDocument()
        expect(screen.getByTestId('preloaded-next-page')).toBeInTheDocument()
      })
    })

    it('should maintain smooth performance with many chapters', () => {
      const largeStory = {
        ...mockStory,
        chapters: Array.from({ length: 20 }, (_, i) => ({
          ...mockStory.chapters[0],
          number: i + 1,
          title: `Chapter ${i + 1}`,
          content: `Content for chapter ${i + 1}`
        }))
      }

      const { rerender } = render(<FlipbookUI story={largeStory} />)

      // Should render without performance issues
      expect(screen.getByText('The Whispering Woods')).toBeInTheDocument()

      // Navigation should remain responsive
      fireEvent.click(screen.getByLabelText(/next page/i))
      expect(screen.getByText('Table of Contents')).toBeInTheDocument()

      // Re-rendering should be efficient
      const startTime = performance.now()
      rerender(<FlipbookUI story={largeStory} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should re-render quickly
    })
  })
})