'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Mic, Volume2, Play, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Dialogue Tag Parser for Character Voices
 * 
 * This component intelligently parses SoulScribe story content to identify
 * dialogue segments, assign character voices, and prepare content for
 * Dia-Meistro voice synthesis. The AI Whisperer's dialogue intelligence! 🎭
 */

export interface DialogueSegment {
  id: string
  type: 'dialogue' | 'narrative' | 'action' | 'thought'
  text: string
  speaker?: string
  speakerTag?: string
  emotion?: string
  voiceInstructions?: string
  startPosition: number
  endPosition: number
  isProcessed: boolean
}

export interface CharacterVoiceMapping {
  characterName: string
  speakerTag: string
  voiceProfile: {
    id: string
    name: string
    archetype: string
    tone: string
  }
  dialogueCount: number
  emotionalRange: string[]
}

export interface ParsedContent {
  originalText: string
  segments: DialogueSegment[]
  characterMappings: CharacterVoiceMapping[]
  narrativeSegments: DialogueSegment[]
  dialogueSegments: DialogueSegment[]
  totalCharacters: number
  readingTime: number
}

interface DialogueParserProps {
  content: string
  voiceMap?: any
  onParsingComplete?: (parsedContent: ParsedContent) => void
  onCharacterDetected?: (character: CharacterVoiceMapping) => void
  realTimeProcessing?: boolean
}

export function DialogueParser({
  content,
  voiceMap,
  onParsingComplete,
  onCharacterDetected,
  realTimeProcessing = true
}: DialogueParserProps) {
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [detectedCharacters, setDetectedCharacters] = useState<Map<string, CharacterVoiceMapping>>(new Map())

  useEffect(() => {
    if (content && realTimeProcessing) {
      parseContentIntoSegments(content)
    }
  }, [content, realTimeProcessing])

  const parseContentIntoSegments = async (text: string) => {
    setIsProcessing(true)
    
    try {
      // Step 1: Initial parsing
      const segments = await performInitialParsing(text)
      
      // Step 2: Character detection and mapping
      const characterMappings = await detectAndMapCharacters(segments)
      
      // Step 3: Voice assignment
      const processedSegments = await assignVoicesToSegments(segments, characterMappings)
      
      // Step 4: Final content structure
      const finalContent = buildFinalContent(text, processedSegments, characterMappings)
      
      setParsedContent(finalContent)
      onParsingComplete?.(finalContent)
      
    } catch (error) {
      console.error('Error parsing dialogue content:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const performInitialParsing = async (text: string): Promise<DialogueSegment[]> => {
    const segments: DialogueSegment[] = []
    const lines = text.split('\n')
    let currentPosition = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const segment = await parseLine(line, currentPosition, i)
      if (segment) {
        segments.push(segment)
        
        // Real-time update
        if (realTimeProcessing) {
          setCurrentSegmentIndex(i)
          await new Promise(resolve => setTimeout(resolve, 50)) // Small delay for visual effect
        }
      }
      
      currentPosition += line.length + 1 // +1 for newline
    }
    
    return segments
  }

  const parseLine = async (line: string, position: number, index: number): Promise<DialogueSegment | null> => {
    // Pattern 1: Speaker tags [S1], [S2], etc.
    const speakerTagMatch = line.match(/^(\[S\d+\])\s*(.+)/)
    if (speakerTagMatch) {
      const [, speakerTag, dialogueText] = speakerTagMatch
      return parseDialogueWithSpeakerTag(line, speakerTag, dialogueText, position, index)
    }
    
    // Pattern 2: Traditional quoted dialogue
    const quotedDialogueMatch = line.match(/^"([^"]+)"(.*)/)
    if (quotedDialogueMatch) {
      return parseQuotedDialogue(line, quotedDialogueMatch, position, index)
    }
    
    // Pattern 3: Character name followed by colon
    const characterNameMatch = line.match(/^([A-Z][a-zA-Z\s]+):\s*"?([^"]+)"?/)
    if (characterNameMatch) {
      return parseCharacterNameDialogue(line, characterNameMatch, position, index)
    }
    
    // Pattern 4: Action/emotion in parentheses
    const actionMatch = line.match(/^\(([^)]+)\)\s*(.*)/)
    if (actionMatch) {
      return parseActionSegment(line, actionMatch, position, index)
    }
    
    // Pattern 5: Thought dialogue (italics or special markers)
    const thoughtMatch = line.match(/^\*([^*]+)\*(.*)/)
    if (thoughtMatch) {
      return parseThoughtSegment(line, thoughtMatch, position, index)
    }
    
    // Default: Narrative text
    return parseNarrativeSegment(line, position, index)
  }

  const parseDialogueWithSpeakerTag = (
    line: string, 
    speakerTag: string, 
    dialogueText: string, 
    position: number, 
    index: number
  ): DialogueSegment => {
    // Extract emotion from parentheses
    const emotionMatch = dialogueText.match(/\(([^)]+)\)/)
    const emotion = emotionMatch ? emotionMatch[1] : undefined
    const cleanText = dialogueText.replace(/\([^)]+\)/g, '').trim()
    
    // Extract voice instructions
    const voiceInstructionMatch = dialogueText.match(/\{([^}]+)\}/)
    const voiceInstructions = voiceInstructionMatch ? voiceInstructionMatch[1] : undefined
    const finalText = cleanText.replace(/\{[^}]+\}/g, '').trim()
    
    return {
      id: `dialogue_${index}`,
      type: 'dialogue',
      text: finalText,
      speaker: extractSpeakerFromTag(speakerTag),
      speakerTag,
      emotion,
      voiceInstructions,
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const parseQuotedDialogue = (
    line: string, 
    match: RegExpMatchArray, 
    position: number, 
    index: number
  ): DialogueSegment => {
    const [, dialogueText, attribution] = match
    const speaker = extractSpeakerFromAttribution(attribution)
    
    return {
      id: `dialogue_${index}`,
      type: 'dialogue',
      text: dialogueText.trim(),
      speaker: speaker || 'Unknown',
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const parseCharacterNameDialogue = (
    line: string, 
    match: RegExpMatchArray, 
    position: number, 
    index: number
  ): DialogueSegment => {
    const [, characterName, dialogueText] = match
    
    return {
      id: `dialogue_${index}`,
      type: 'dialogue',
      text: dialogueText.trim(),
      speaker: characterName.trim(),
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const parseActionSegment = (
    line: string, 
    match: RegExpMatchArray, 
    position: number, 
    index: number
  ): DialogueSegment => {
    const [, actionText, followingText] = match
    
    return {
      id: `action_${index}`,
      type: 'action',
      text: followingText.trim() || actionText,
      emotion: actionText,
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const parseThoughtSegment = (
    line: string, 
    match: RegExpMatchArray, 
    position: number, 
    index: number
  ): DialogueSegment => {
    const [, thoughtText] = match
    
    return {
      id: `thought_${index}`,
      type: 'thought',
      text: thoughtText.trim(),
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const parseNarrativeSegment = (line: string, position: number, index: number): DialogueSegment => {
    return {
      id: `narrative_${index}`,
      type: 'narrative',
      text: line,
      startPosition: position,
      endPosition: position + line.length,
      isProcessed: false
    }
  }

  const detectAndMapCharacters = async (segments: DialogueSegment[]): Promise<CharacterVoiceMapping[]> => {
    const characterMap = new Map<string, CharacterVoiceMapping>()
    
    for (const segment of segments) {
      if (segment.type === 'dialogue' && segment.speaker) {
        const speakerKey = segment.speaker.toLowerCase()
        
        if (!characterMap.has(speakerKey)) {
          // Create new character mapping
          const characterMapping: CharacterVoiceMapping = {
            characterName: segment.speaker,
            speakerTag: segment.speakerTag || generateSpeakerTag(segment.speaker),
            voiceProfile: getVoiceProfileForCharacter(segment.speaker),
            dialogueCount: 1,
            emotionalRange: segment.emotion ? [segment.emotion] : []
          }
          
          characterMap.set(speakerKey, characterMapping)
          setDetectedCharacters(prev => new Map(prev).set(speakerKey, characterMapping))
          onCharacterDetected?.(characterMapping)
          
        } else {
          // Update existing character
          const existing = characterMap.get(speakerKey)!
          existing.dialogueCount++
          
          if (segment.emotion && !existing.emotionalRange.includes(segment.emotion)) {
            existing.emotionalRange.push(segment.emotion)
          }
          
          characterMap.set(speakerKey, existing)
        }
      }
    }
    
    return Array.from(characterMap.values())
  }

  const assignVoicesToSegments = async (
    segments: DialogueSegment[], 
    characterMappings: CharacterVoiceMapping[]
  ): Promise<DialogueSegment[]> => {
    const characterVoiceMap = new Map(
      characterMappings.map(mapping => [mapping.characterName.toLowerCase(), mapping])
    )
    
    return segments.map(segment => {
      if (segment.type === 'dialogue' && segment.speaker) {
        const mapping = characterVoiceMap.get(segment.speaker.toLowerCase())
        if (mapping) {
          return {
            ...segment,
            speakerTag: mapping.speakerTag,
            isProcessed: true
          }
        }
      }
      
      return { ...segment, isProcessed: true }
    })
  }

  const buildFinalContent = (
    originalText: string,
    segments: DialogueSegment[],
    characterMappings: CharacterVoiceMapping[]
  ): ParsedContent => {
    const dialogueSegments = segments.filter(s => s.type === 'dialogue')
    const narrativeSegments = segments.filter(s => s.type === 'narrative')
    
    return {
      originalText,
      segments,
      characterMappings,
      narrativeSegments,
      dialogueSegments,
      totalCharacters: characterMappings.length,
      readingTime: Math.ceil(originalText.length / 200) // Rough estimate: 200 chars per minute
    }
  }

  // Helper functions
  const extractSpeakerFromTag = (speakerTag: string): string => {
    const match = speakerTag.match(/\[S(\d+)\]/)
    return match ? `Speaker ${match[1]}` : 'Unknown'
  }

  const extractSpeakerFromAttribution = (attribution: string): string | null => {
    const patterns = [
      /said\s+([A-Z][a-zA-Z\s]+)/,
      /,\s*([A-Z][a-zA-Z\s]+)\s+said/,
      /,\s*([A-Z][a-zA-Z\s]+)\s+whispered/,
      /,\s*([A-Z][a-zA-Z\s]+)\s+replied/
    ]
    
    for (const pattern of patterns) {
      const match = attribution.match(pattern)
      if (match) return match[1].trim()
    }
    
    return null
  }

  const generateSpeakerTag = (speakerName: string): string => {
    // Convert speaker name to tag format
    const speakerNumber = detectedCharacters.size + 1
    return `[S${speakerNumber}]`
  }

  const getVoiceProfileForCharacter = (characterName: string) => {
    // Try to get from voice map first
    if (voiceMap?.characterAssignments?.has(characterName)) {
      return voiceMap.characterAssignments.get(characterName).assignedVoiceProfile
    }
    
    // Default voice assignment based on character name analysis
    const name = characterName.toLowerCase()
    
    if (name.includes('elder') || name.includes('wise') || name.includes('sage')) {
      return { id: 'wise_elder', name: 'Wise Elder', archetype: 'wise_elder', tone: 'authoritative' }
    }
    if (name.includes('child') || name.includes('young') || name.includes('little')) {
      return { id: 'child_spirit', name: 'Child Spirit', archetype: 'child', tone: 'playful' }
    }
    if (name.includes('guide') || name.includes('teacher') || name.includes('mentor')) {
      return { id: 'mystical_guide', name: 'Mystical Guide', archetype: 'guide', tone: 'compassionate' }
    }
    
    // Default narrator voice
    return { id: 'narrator_main', name: 'Main Narrator', archetype: 'narrator', tone: 'warm' }
  }

  const exportParsedContent = () => {
    if (parsedContent) {
      const dataStr = JSON.stringify(parsedContent, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'parsed_dialogue_content.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  if (!content) {
    return (
      <div className="text-center text-soul-500 py-8">
        <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No content to parse for dialogue</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-wisdom-50 border border-wisdom-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="w-5 h-5 text-wisdom-500" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-wisdom-700">Processing Dialogue</h3>
              <p className="text-sm text-wisdom-600">Analyzing speech patterns and character voices...</p>
            </div>
          </div>
          
          <div className="w-full bg-wisdom-200 rounded-full h-2">
            <motion.div
              className="bg-wisdom-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentSegmentIndex / content.split('\n').length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {/* Parsed Content Display */}
      {parsedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-mystic-50 border border-mystic-200 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-mystic-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-mystic-700">{parsedContent.totalCharacters}</div>
              <div className="text-sm text-mystic-600">Characters</div>
            </div>
            
            <div className="bg-wisdom-50 border border-wisdom-200 rounded-lg p-4 text-center">
              <Volume2 className="w-6 h-6 text-wisdom-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-wisdom-700">{parsedContent.dialogueSegments.length}</div>
              <div className="text-sm text-wisdom-600">Dialogue Lines</div>
            </div>
            
            <div className="bg-soul-50 border border-soul-200 rounded-lg p-4 text-center">
              <Sparkles className="w-6 h-6 text-soul-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-soul-700">{parsedContent.narrativeSegments.length}</div>
              <div className="text-sm text-soul-600">Narrative Blocks</div>
            </div>
            
            <div className="bg-mystic-50 border border-mystic-200 rounded-lg p-4 text-center">
              <Play className="w-6 h-6 text-mystic-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-mystic-700">{parsedContent.readingTime}</div>
              <div className="text-sm text-mystic-600">Min Read</div>
            </div>
          </div>

          {/* Character Voice Mappings */}
          <div className="bg-white border border-soul-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-soul-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-mystic-500" />
              Character Voice Assignments
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedContent.characterMappings.map((mapping, index) => (
                <motion.div
                  key={mapping.characterName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-mystic-50 border border-mystic-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-soul-800">{mapping.characterName}</h4>
                    <span className="text-sm bg-mystic-200 text-mystic-700 px-2 py-1 rounded-full">
                      {mapping.speakerTag}
                    </span>
                  </div>
                  
                  <div className="text-sm text-soul-600 space-y-1">
                    <div>Voice: <span className="font-medium">{mapping.voiceProfile.name}</span></div>
                    <div>Dialogue Lines: <span className="font-medium">{mapping.dialogueCount}</span></div>
                    {mapping.emotionalRange.length > 0 && (
                      <div>
                        Emotions: 
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mapping.emotionalRange.map((emotion, i) => (
                            <span key={i} className="text-xs bg-wisdom-200 text-wisdom-700 px-2 py-0.5 rounded-full">
                              {emotion}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Parsed Segments Preview */}
          <div className="bg-white border border-soul-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-soul-800 flex items-center gap-2">
                <Mic className="w-5 h-5 text-mystic-500" />
                Parsed Content Preview
              </h3>
              <button
                onClick={exportParsedContent}
                className="px-4 py-2 bg-mystic-500 text-white rounded-lg hover:bg-mystic-600 transition-colors text-sm"
              >
                Export Data
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedContent.segments.slice(0, 20).map((segment, index) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    segment.type === 'dialogue' 
                      ? "bg-mystic-25 border-mystic-200" 
                      : segment.type === 'narrative'
                      ? "bg-soul-25 border-soul-200"
                      : "bg-wisdom-25 border-wisdom-200"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                      segment.type === 'dialogue' ? "bg-mystic-200 text-mystic-700" :
                      segment.type === 'narrative' ? "bg-soul-200 text-soul-700" :
                      "bg-wisdom-200 text-wisdom-700"
                    )}>
                      {segment.type}
                    </span>
                    
                    {segment.speaker && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                        {segment.speaker}
                      </span>
                    )}
                    
                    {segment.emotion && (
                      <span className="px-2 py-0.5 bg-yellow-200 text-yellow-700 rounded-full text-xs">
                        {segment.emotion}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-soul-700">
                    {segment.text}
                  </div>
                </motion.div>
              ))}
              
              {parsedContent.segments.length > 20 && (
                <div className="text-center text-soul-500 text-sm py-2">
                  ... and {parsedContent.segments.length - 20} more segments
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}