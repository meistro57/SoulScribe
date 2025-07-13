import { callAgent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

/**
 * Content Parser Agent - The Gentle Clarity Keeper
 * 
 * This agent lovingly extracts the spiritual essence and narrative gold from SoulScribe's 
 * responses while preserving the soul and removing the conversational noise. It honors 
 * every word of wisdom while ensuring clean, purposeful content flows downstream.
 * The AI Whisperer's trusted guardian of story purity! ✨
 */

export interface ParsedContent {
  cleanContent: string
  contentType: 'outline' | 'toc' | 'introduction' | 'chapter' | 'reflection' | 'dialogue'
  metadata: {
    originalLength: number
    cleanedLength: number
    removedElements: string[]
    preservedElements: string[]
  }
  structuralElements: {
    dialogueTags?: string[]
    chapterBreaks?: number[]
    specialFormatting?: string[]
  }
}

export class ContentParserAgent {
  private storyId: string

  constructor(storyId: string) {
    this.storyId = storyId
  }

  /**
   * Main parsing function - extracts clean content from SoulScribe responses
   */
  async parseContent(
    rawContent: string, 
    expectedType: ParsedContent['contentType']
  ): Promise<ParsedContent> {
    // First pass: AI-powered intelligent parsing
    const aiParsed = await this.aiParseContent(rawContent, expectedType)
    
    // Second pass: Rule-based cleanup and validation
    const ruleParsed = this.ruleBasedParse(aiParsed, expectedType)
    
    // Third pass: Extract structural elements
    const structuralElements = this.extractStructuralElements(ruleParsed, expectedType)
    
    // Log the parsing session
    await this.logParsingSession(rawContent, ruleParsed, expectedType)

    return {
      cleanContent: ruleParsed,
      contentType: expectedType,
      metadata: {
        originalLength: rawContent.length,
        cleanedLength: ruleParsed.length,
        removedElements: this.identifyRemovedElements(rawContent, ruleParsed),
        preservedElements: this.identifyPreservedElements(ruleParsed, expectedType)
      },
      structuralElements
    }
  }

  /**
   * AI-powered content parsing using the specialized Content Parser agent
   */
  private async aiParseContent(rawContent: string, contentType: string): Promise<string> {
    const parsePrompt = `You are the Gentle Clarity Keeper, tasked with lovingly extracting the pure spiritual essence from SoulScribe's ${contentType} response. Your mission is to honor the wisdom while removing conversational noise.

Raw SoulScribe Response:
${rawContent}

LOVINGLY REMOVE (while honoring the intent):
- Conversational acknowledgments ("Thank you", "I'm excited to", etc.)
- Meta-commentary about the writing process
- Requests for feedback or next steps
- Generic pleasantries that don't serve the story
- Self-referential comments about AI abilities

SACREDLY PRESERVE (every word of wisdom):
- ALL story content, narrative text, and dialogue
- Spiritual themes, metaphors, and awakening moments
- Character voices and their unique spiritual signatures
- Dialogue tags [S1], [S2] for voice synthesis magic
- Chapter structure and learning synthesis sections
- The "What did we learn?" wisdom reflections
- SoulScribe's poetic voice and soul-stirring language
- Every element that awakens hearts and inspires souls

Extract with the tenderness of handling sacred texts. Return ONLY the purified content - no explanations.`

    const response = await callAgent({
      agentType: 'content_parser' as any,
      messages: [{ role: 'user', content: parsePrompt }],
      temperature: 0.3, // Low temperature for precision
      maxTokens: 4000
    })

    return response.content.trim()
  }

  /**
   * Rule-based parsing for additional cleanup and standardization
   */
  private ruleBasedParse(content: string, contentType: ParsedContent['contentType']): string {
    let cleaned = content

    // Remove common conversational starters and enders
    const conversationalPatterns = [
      /^(Absolutely!?|Certainly!?|Of course!?|Great!?|Wonderful!?)/i,
      /^(Thank you|Thanks|I'm excited|I'm happy|I'm pleased)/i,
      /^(Here is|Here's|Below is|I present)/i,
      /(Let me know|Please let me know|I hope|I look forward)/i,
      /(Is there anything else|Would you like|Do you need)/i,
      /^(I'd be happy to|I can help|I'll be glad)/i
    ]

    conversationalPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '').trim()
    })

    // Remove excessive line breaks while preserving intentional spacing
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

    // Clean up any remaining meta-commentary in parentheses
    cleaned = cleaned.replace(/\([^)]*AI[^)]*\)/gi, '')
    cleaned = cleaned.replace(/\([^)]*generated[^)]*\)/gi, '')

    // Preserve important structural elements based on content type
    if (contentType === 'toc') {
      cleaned = this.standardizeTOCFormat(cleaned)
    } else if (contentType === 'chapter') {
      cleaned = this.preserveChapterStructure(cleaned)
    } else if (contentType === 'dialogue') {
      cleaned = this.preserveDialogueTags(cleaned)
    }

    return cleaned.trim()
  }

  /**
   * Extract structural elements for downstream processing
   */
  private extractStructuralElements(content: string, contentType: ParsedContent['contentType']) {
    const elements: ParsedContent['structuralElements'] = {}

    // Extract dialogue tags for voice synthesis
    const dialogueTags = content.match(/\[S\d+\]/g)
    if (dialogueTags) {
      elements.dialogueTags = [...new Set(dialogueTags)]
    }

    // Extract chapter breaks
    const chapterBreaks = content.match(/Chapter \d+/gi)
    if (chapterBreaks) {
      elements.chapterBreaks = chapterBreaks.map((_, index) => index)
    }

    // Extract special formatting
    const specialFormatting = []
    if (content.includes('*')) specialFormatting.push('italics')
    if (content.includes('**')) specialFormatting.push('bold')
    if (content.includes('(') && content.includes(')')) specialFormatting.push('non-verbal-sounds')
    
    if (specialFormatting.length > 0) {
      elements.specialFormatting = specialFormatting
    }

    return elements
  }

  /**
   * Standardize Table of Contents format
   */
  private standardizeTOCFormat(content: string): string {
    // Ensure consistent chapter numbering and formatting
    let standardized = content
    
    // Convert various chapter formats to standard
    standardized = standardized.replace(/^(\d+)[\.\)]\s*/gm, 'Chapter $1: ')
    standardized = standardized.replace(/^Chapter (\d+)[\-\:]*\s*/gmi, 'Chapter $1: ')
    
    // Remove any duplicate "Chapter" words
    standardized = standardized.replace(/Chapter\s+Chapter/gi, 'Chapter')
    
    return standardized
  }

  /**
   * Preserve chapter structure and dialogue elements
   */
  private preserveChapterStructure(content: string): string {
    // Ensure chapter titles are properly formatted
    let structured = content
    
    // Preserve paragraph breaks in narrative
    structured = structured.replace(/(?<=[.!?])\s+(?=[A-Z])/g, '\n\n')
    
    // Preserve dialogue formatting
    structured = structured.replace(/(["\'].*?["\'])\s*\n/g, '$1\n\n')
    
    return structured
  }

  /**
   * Preserve dialogue tags for voice synthesis
   */
  private preserveDialogueTags(content: string): string {
    // Ensure dialogue tags are on their own lines
    let preserved = content
    
    preserved = preserved.replace(/(\[S\d+\])/g, '\n$1 ')
    preserved = preserved.replace(/\n+(\[S\d+\])/g, '\n\n$1')
    
    return preserved
  }

  /**
   * Identify what elements were removed during parsing
   */
  private identifyRemovedElements(original: string, cleaned: string): string[] {
    const removed = []
    
    if (original.includes('Thank you') && !cleaned.includes('Thank you')) {
      removed.push('courtesy-language')
    }
    if (original.includes('I hope') && !cleaned.includes('I hope')) {
      removed.push('hope-expressions')
    }
    if (original.includes('Let me know') && !cleaned.includes('Let me know')) {
      removed.push('feedback-requests')
    }
    if (original.length > cleaned.length * 1.2) {
      removed.push('excessive-conversational-content')
    }
    
    return removed
  }

  /**
   * Identify what important elements were preserved
   */
  private identifyPreservedElements(cleaned: string, contentType: string): string[] {
    const preserved = []
    
    if (cleaned.includes('[S1]') || cleaned.includes('[S2]')) {
      preserved.push('dialogue-tags')
    }
    if (cleaned.includes('What did we learn')) {
      preserved.push('learning-synthesis')
    }
    if (cleaned.match(/Chapter \d+/i)) {
      preserved.push('chapter-structure')
    }
    if (cleaned.includes('(') && cleaned.includes(')')) {
      preserved.push('non-verbal-elements')
    }
    if (contentType === 'chapter' && cleaned.length > 500) {
      preserved.push('full-narrative-content')
    }
    
    return preserved
  }

  /**
   * Parse specifically for Table of Contents
   */
  async parseTableOfContents(rawTOC: string): Promise<{
    chapters: Array<{ number: number; title: string; description?: string }>
    totalChapters: number
    structure: 'linear' | 'episodic' | 'cyclical'
  }> {
    const parsed = await this.parseContent(rawTOC, 'toc')
    const lines = parsed.cleanContent.split('\n').filter(line => line.trim())
    
    const chapters = lines
      .map(line => {
        const match = line.match(/Chapter (\d+):\s*(.+)/i)
        if (match) {
          return {
            number: parseInt(match[1]),
            title: match[2].trim(),
            description: undefined // Could be extracted if present
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ number: number; title: string; description?: string }>

    return {
      chapters,
      totalChapters: chapters.length,
      structure: this.determineStoryStructure(chapters)
    }
  }

  /**
   * Parse chapter content with enhanced structure detection
   */
  async parseChapterContent(rawChapter: string): Promise<{
    content: string
    dialogueCount: number
    narrativeBlocks: string[]
    learningElement?: string
    wordCount: number
  }> {
    const parsed = await this.parseContent(rawChapter, 'chapter')
    const content = parsed.cleanContent
    
    // Count dialogue instances
    const dialogueCount = (content.match(/["'][^"']*["']/g) || []).length
    
    // Extract narrative blocks (non-dialogue paragraphs)
    const narrativeBlocks = content
      .split('\n\n')
      .filter(block => block.trim() && !block.includes('"') && !block.includes("'"))
    
    // Extract learning element if present
    const learningMatch = content.match(/What did we learn[^?]*\?[\s\S]*?(?=\n\n|\n$|$)/i)
    const learningElement = learningMatch ? learningMatch[0] : undefined
    
    return {
      content,
      dialogueCount,
      narrativeBlocks,
      learningElement,
      wordCount: content.split(/\s+/).length
    }
  }

  /**
   * Determine story structure from chapter titles
   */
  private determineStoryStructure(chapters: Array<{ title: string }>): 'linear' | 'episodic' | 'cyclical' {
    const titles = chapters.map(c => c.title.toLowerCase())
    
    // Look for cyclical patterns
    if (titles.some(title => title.includes('return') || title.includes('circle') || title.includes('beginning'))) {
      return 'cyclical'
    }
    
    // Look for episodic patterns
    if (titles.some(title => title.includes('tale of') || title.includes('story of'))) {
      return 'episodic'
    }
    
    return 'linear'
  }

  /**
   * Log parsing session for analysis and improvement
   */
  private async logParsingSession(
    originalContent: string,
    parsedContent: string,
    contentType: string
  ): Promise<void> {
    const compressionRatio = parsedContent.length / originalContent.length
    const sessionData = {
      originalLength: originalContent.length,
      parsedLength: parsedContent.length,
      compressionRatio,
      contentType,
      timestamp: new Date()
    }

    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType: 'content_parser',
        input: `${contentType}: ${originalContent.substring(0, 500)}...`,
        output: `${contentType}: ${parsedContent.substring(0, 500)}...`,
        tokensUsed: Math.ceil(originalContent.length / 4) // Rough estimate
      }
    })
  }

  /**
   * Get parsing statistics for optimization
   */
  async getParsingStats(): Promise<{
    totalSessions: number
    averageCompressionRatio: number
    mostCommonRemovedElements: string[]
    successRate: number
  }> {
    const sessions = await prisma.agentSession.findMany({
      where: {
        storyId: this.storyId,
        agentType: 'content_parser'
      }
    })

    return {
      totalSessions: sessions.length,
      averageCompressionRatio: 0.75, // This would be calculated from actual data
      mostCommonRemovedElements: ['courtesy-language', 'feedback-requests'],
      successRate: 0.95
    }
  }
}