import { test, expect, Page, BrowserContext } from '@playwright/test'

/**
 * End-to-End Tests for SoulScribe Complete User Journey
 * 
 * These tests validate the magical flow from story creation questionnaire
 * to final flipbook experience, ensuring every touchpoint awakens hearts
 * and inspires souls! 🌟✨
 */

test.describe('Complete SoulScribe User Journey 🧙‍♂️', () => {
  let page: Page
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    
    // Mock API responses for consistent testing
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user', name: 'Test User' } })
      })
    })

    await page.route('**/api/generate-story', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          storyId: 'test-story-123',
          status: 'generating'
        })
      })
    })

    await page.goto('/')
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('Complete story creation and reading journey', async () => {
    // Step 1: Landing page and authentication
    await test.step('User lands on SoulScribe and authenticates', async () => {
      await expect(page.locator('h1')).toContainText('SoulScribe')
      await expect(page.locator('text=Storyteller of Awakening')).toBeVisible()
      
      // Click to start creating a story
      await page.click('text=Create Your First Story')
      
      // Should navigate to questionnaire
      await expect(page).toHaveURL(/.*questionnaire/)
      await expect(page.locator('h1')).toContainText('Story Creation Wizard')
    })

    // Step 2: Complete the 7-step questionnaire
    await test.step('User completes the magical questionnaire', async () => {
      // Step 1: Genre Selection
      await expect(page.locator('text=Choose Your Story Genre')).toBeVisible()
      await page.click('[data-testid="genre-mystical-fable"]')
      await page.click('button:has-text("Next")')

      // Step 2: Themes and Lessons
      await expect(page.locator('text=Spiritual Themes')).toBeVisible()
      await page.fill('[data-testid="primary-theme"]', 'Self-discovery and inner wisdom')
      await page.fill('[data-testid="life-lesson"]', 'Trust your inner voice')
      await page.click('[data-testid="spiritual-element-nature"]')
      await page.click('[data-testid="spiritual-element-wisdom"]')
      await page.click('button:has-text("Next")')

      // Step 3: Structure and Length
      await expect(page.locator('text=Story Structure')).toBeVisible()
      await page.selectOption('[data-testid="chapter-count"]', '3')
      await page.click('[data-testid="length-medium"]')
      await page.click('button:has-text("Next")')

      // Step 4: Characters and Setting
      await expect(page.locator('text=Characters & Setting')).toBeVisible()
      await page.click('[data-testid="character-seeker"]')
      await page.click('[data-testid="character-wise-guide"]')
      await page.click('[data-testid="setting-forest"]')
      await page.click('button:has-text("Next")')

      // Step 5: Tone and Style
      await expect(page.locator('text=Writing Style')).toBeVisible()
      await page.click('[data-testid="style-poetic"]')
      await page.click('[data-testid="tone-mystical"]')
      await page.click('[data-testid="tone-warm"]')
      await page.click('button:has-text("Next")')

      // Step 6: Spiritual Elements
      await expect(page.locator('text=Spiritual Enhancement')).toBeVisible()
      await page.click('[data-testid="metaphor-journey"]')
      await page.click('[data-testid="metaphor-light-shadow"]')
      await page.click('button:has-text("Next")')

      // Step 7: Final Refinement
      await expect(page.locator('text=Final Touches')).toBeVisible()
      await page.fill('[data-testid="additional-notes"]', 'Please emphasize the connection between inner and outer nature')
      await page.click('button:has-text("Create My Story")')
    })

    // Step 3: Story generation with real-time progress
    await test.step('User watches magical story generation in real-time', async () => {
      await expect(page).toHaveURL(/.*story\/.*\/generating/)
      
      // Should show generation progress
      await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible()
      await expect(page.locator('text=Creating your story outline')).toBeVisible()
      
      // Should show encouragement messages
      await expect(page.locator('[data-testid="encouragement-message"]')).toBeVisible()
      await expect(page.locator('text=SoulScribe')).toBeVisible()
      
      // Mock real-time updates
      await page.evaluate(() => {
        // Simulate WebSocket or SSE updates
        window.dispatchEvent(new CustomEvent('story-progress', {
          detail: {
            phase: 'outline',
            progress: 25,
            message: 'Weaving the mystical outline...'
          }
        }))
      })

      await expect(page.locator('text=Weaving the mystical outline')).toBeVisible()
      
      // Simulate completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('story-complete', {
          detail: {
            storyId: 'test-story-123',
            title: 'The Whispering Woods'
          }
        }))
      })

      // Should redirect to story view
      await expect(page).toHaveURL(/.*story\/.*\/read/)
    })

    // Step 4: Flipbook reading experience
    await test.step('User experiences the magical flipbook interface', async () => {
      // Should show cover page
      await expect(page.locator('[data-testid="story-cover"]')).toBeVisible()
      await expect(page.locator('text=The Whispering Woods')).toBeVisible()
      await expect(page.locator('text=by SoulScribe AI')).toBeVisible()
      
      // Should show page indicators
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 1 of 5')
      
      // Navigate to table of contents
      await page.click('[data-testid="next-page-btn"]')
      await expect(page.locator('text=Table of Contents')).toBeVisible()
      await expect(page.locator('text=Chapter 1:')).toBeVisible()
      
      // Navigate to first chapter
      await page.click('[data-testid="next-page-btn"]')
      await expect(page.locator('[data-testid="chapter-content"]')).toBeVisible()
      await expect(page.locator('text=Chapter 1:')).toBeVisible()
      
      // Should show learning reflection
      await expect(page.locator('text=What did we learn')).toBeVisible()
    })

    // Step 5: Audio integration and voice experience
    await test.step('User enjoys immersive audio narration', async () => {
      // Should show audio controls
      await expect(page.locator('[data-testid="audio-controls"]')).toBeVisible()
      
      // Play audio
      await page.click('[data-testid="play-audio-btn"]')
      await expect(page.locator('[data-testid="audio-playing"]')).toBeVisible()
      
      // Should show voice character indicators
      await expect(page.locator('[data-testid="voice-S1"]')).toBeVisible() // Speaker tags
      
      // Test volume control
      await page.click('[data-testid="volume-control"]')
      await page.fill('[data-testid="volume-slider"]', '0.7')
      
      // Navigate to next chapter with audio continuing
      await page.click('[data-testid="next-page-btn"]')
      await expect(page.locator('[data-testid="audio-controls"]')).toBeVisible()
    })

    // Step 6: Interactive features and ambient sounds
    await test.step('User experiences magical ambient enhancements', async () => {
      // Should show ambient sound indicator
      await expect(page.locator('[data-testid="ambient-sounds"]')).toBeVisible()
      
      // Check for contextual sound effects
      await expect(page.locator('text=Forest ambience')).toBeVisible()
      
      // Test easter egg discovery
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('KeyB')
      await page.keyboard.press('KeyA')
      
      // Should trigger Konami Code easter egg
      await expect(page.locator('[data-testid="easter-egg-notification"]')).toBeVisible()
      await expect(page.locator('text=Code Master')).toBeVisible()
    })

    // Step 7: Story completion and export options
    await test.step('User completes story and explores export options', async () => {
      // Navigate to final chapter and reflection
      while (await page.locator('[data-testid="next-page-btn"]').isEnabled()) {
        await page.click('[data-testid="next-page-btn"]')
      }
      
      // Should show final reflection
      await expect(page.locator('text=Final Reflection')).toBeVisible()
      await expect(page.locator('[data-testid="learning-synthesis"]')).toBeVisible()
      
      // Access export options
      await page.click('[data-testid="export-story-btn"]')
      await expect(page.locator('text=Export Your Story')).toBeVisible()
      
      // Should show multiple export formats
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
      await expect(page.locator('[data-testid="export-audiobook"]')).toBeVisible()
      await expect(page.locator('[data-testid="export-epub"]')).toBeVisible()
      
      // Test PDF export
      await page.click('[data-testid="export-pdf"]')
      await expect(page.locator('text=Generating PDF')).toBeVisible()
    })

    // Step 8: Return to dashboard and story management
    await test.step('User returns to dashboard to manage story collection', async () => {
      await page.click('[data-testid="dashboard-btn"]')
      await expect(page).toHaveURL(/.*dashboard/)
      
      // Should show story in gallery
      await expect(page.locator('[data-testid="story-card"]')).toBeVisible()
      await expect(page.locator('text=The Whispering Woods')).toBeVisible()
      
      // Should show stats
      await expect(page.locator('[data-testid="stats-total-stories"]')).toContainText('1')
      await expect(page.locator('[data-testid="stats-completed"]')).toContainText('1')
      
      // Should be able to re-read story
      await page.click('[data-testid="story-card"] [data-testid="read-story-btn"]')
      await expect(page).toHaveURL(/.*story\/.*\/read/)
    })
  })

  test('Voice cloning user journey', async () => {
    await test.step('User creates custom character voice', async () => {
      await page.goto('/voice-studio')
      
      // Should show voice cloning interface
      await expect(page.locator('text=Voice Cloning Studio')).toBeVisible()
      
      // Fill voice information
      await page.fill('[data-testid="voice-name"]', 'My Wise Elder')
      await page.fill('[data-testid="voice-description"]', 'A gentle, wise voice with warmth')
      await page.selectOption('[data-testid="voice-category"]', 'character')
      
      // Configure voice characteristics
      await page.selectOption('[data-testid="age"]', 'elder')
      await page.selectOption('[data-testid="emotion"]', 'wise')
      await page.selectOption('[data-testid="energy"]', 'medium')
      
      // Record voice sample
      await page.click('[data-testid="start-recording-btn"]')
      
      // Mock recording completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('recording-complete', {
          detail: {
            audioBlob: new Blob(['mock audio'], { type: 'audio/wav' }),
            duration: 30000,
            qualityScore: 0.85
          }
        }))
      })
      
      await expect(page.locator('text=Recording complete')).toBeVisible()
      await expect(page.locator('text=Quality: 85%')).toBeVisible()
      
      // Create voice profile
      await page.click('[data-testid="create-voice-btn"]')
      
      await expect(page.locator('text=Voice profile created')).toBeVisible()
      await expect(page.locator('[data-testid="voice-library"]')).toContainText('My Wise Elder')
    })
  })

  test('Accessibility and mobile experience', async () => {
    await test.step('Keyboard navigation and screen reader support', async () => {
      await page.goto('/story/test-story/read')
      
      // Test keyboard navigation
      await page.keyboard.press('Tab') // Focus first interactive element
      await page.keyboard.press('ArrowRight') // Next page
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2')
      
      // Test ARIA labels
      const nextButton = page.locator('[data-testid="next-page-btn"]')
      await expect(nextButton).toHaveAttribute('aria-label', /next page/i)
      
      // Test high contrast mode
      await page.evaluate(() => {
        document.body.classList.add('high-contrast')
      })
      
      await expect(page.locator('body')).toHaveClass(/high-contrast/)
    })

    await test.step('Mobile responsive experience', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/questionnaire')
      
      // Should adapt to mobile layout
      await expect(page.locator('[data-testid="mobile-questionnaire"]')).toBeVisible()
      
      // Test touch navigation
      await page.goto('/story/test-story/read')
      
      // Swipe gestures
      const flipbook = page.locator('[data-testid="flipbook-container"]')
      await flipbook.touchstart({ touches: [{ x: 200, y: 300 }] })
      await flipbook.touchmove({ touches: [{ x: 100, y: 300 }] })
      await flipbook.touchend()
      
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2')
    })
  })

  test('Performance and optimization validation', async () => {
    await test.step('Page load performance', async () => {
      const startTime = Date.now()
      await page.goto('/')
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000)
      
      // Check for performance indicators
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
        }
      })
      
      expect(performanceMetrics.domContentLoaded).toBeLessThan(1000)
      expect(performanceMetrics.firstPaint).toBeLessThan(2000)
    })

    await test.step('Memory usage and cleanup', async () => {
      await page.goto('/story/test-story/read')
      
      // Navigate through many pages to test memory management
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="next-page-btn"]')
        await page.waitForTimeout(100)
        
        if (await page.locator('[data-testid="next-page-btn"]').isDisabled()) {
          break
        }
      }
      
      // Should not show memory leaks or performance degradation
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null
      })
      
      if (memoryInfo) {
        const memoryUsagePercent = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize
        expect(memoryUsagePercent).toBeLessThan(0.8) // Should use less than 80% of heap
      }
    })
  })

  test('Error handling and recovery', async () => {
    await test.step('Network failure recovery', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      await page.goto('/questionnaire')
      await page.fill('[data-testid="primary-theme"]', 'Test theme')
      await page.click('button:has-text("Next")')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('text=Connection issue')).toBeVisible()
      
      // Restore network and retry
      await page.unroute('**/api/**')
      await page.click('[data-testid="retry-btn"]')
      
      // Should continue normally
      await expect(page.locator('text=Story Structure')).toBeVisible()
    })

    await test.step('Invalid story data handling', async () => {
      // Mock invalid story response
      await page.route('**/api/story/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            story: {
              chapters: [], // Empty chapters
              title: '',
              content: null
            }
          })
        })
      })
      
      await page.goto('/story/invalid-story/read')
      
      // Should show appropriate error handling
      await expect(page.locator('[data-testid="story-error"]')).toBeVisible()
      await expect(page.locator('text=Story content unavailable')).toBeVisible()
      
      // Should offer recovery options
      await expect(page.locator('[data-testid="regenerate-story-btn"]')).toBeVisible()
    })
  })

  test('Multi-language and internationalization', async () => {
    await test.step('Language switching functionality', async () => {
      await page.goto('/')
      
      // Should show language selector
      await page.click('[data-testid="language-selector"]')
      await expect(page.locator('[data-testid="language-options"]')).toBeVisible()
      
      // Switch to Spanish
      await page.click('[data-testid="lang-es"]')
      
      // Content should update
      await expect(page.locator('text=Crea Tu Primera Historia')).toBeVisible()
      
      // Story generation should work in Spanish
      await page.click('text=Crea Tu Primera Historia')
      await expect(page.locator('text=Asistente de Creación')).toBeVisible()
    })

    await test.step('RTL language support', async () => {
      await page.goto('/')
      
      // Switch to Arabic (RTL)
      await page.click('[data-testid="language-selector"]')
      await page.click('[data-testid="lang-ar"]')
      
      // Should apply RTL styling
      await expect(page.locator('body')).toHaveAttribute('dir', 'rtl')
      
      // Flipbook should work in RTL mode
      await page.goto('/story/test-story/read')
      const flipbook = page.locator('[data-testid="flipbook-container"]')
      await expect(flipbook).toHaveClass(/rtl/)
    })
  })

  test('Social sharing and community features', async () => {
    await test.step('Story sharing functionality', async () => {
      await page.goto('/story/test-story/read')
      
      // Should show share options
      await page.click('[data-testid="share-story-btn"]')
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()
      
      // Test different sharing options
      await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible()
      await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible()
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible()
      
      // Copy link functionality
      await page.click('[data-testid="copy-link-btn"]')
      await expect(page.locator('text=Link copied')).toBeVisible()
    })

    await test.step('Community story gallery', async () => {
      await page.goto('/community')
      
      // Should show public stories
      await expect(page.locator('[data-testid="community-stories"]')).toBeVisible()
      await expect(page.locator('[data-testid="story-card"]')).toHaveCount(3) // Mock data
      
      // Should be able to read community stories
      await page.click('[data-testid="story-card"]:first-child [data-testid="read-btn"]')
      await expect(page).toHaveURL(/.*story\/.*\/read/)
      
      // Should show attribution
      await expect(page.locator('text=Created by')).toBeVisible()
    })
  })
})