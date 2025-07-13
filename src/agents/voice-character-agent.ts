import { callAgent } from '@/lib/openai'
import { DiaMetistroVoiceBackend, VoiceProfile } from './dia-meistro-backend'
import { prisma } from '@/lib/prisma'

/**
 * Voice Character Assignment Agent - The Master Voice Matchmaker
 * 
 * This agent intelligently assigns character voices based on spiritual archetypes,
 * personality traits, and story context. It creates the perfect sonic identity for
 * each character in the SoulScribe universe! 🎭
 */

export interface CharacterProfile {
  name: string
  role: 'protagonist' | 'antagonist' | 'guide' | 'supporting' | 'wise_elder' | 'child' | 'trickster'
  archetype: string
  personality: string[]
  age: 'child' | 'young' | 'adult' | 'elder'
  gender: 'male' | 'female' | 'neutral' | 'fluid'
  spiritualRole: 'seeker' | 'teacher' | 'guardian' | 'challenger' | 'healer' | 'mystic'
  emotionalRange: string[]
  keyDialogueExamples: string[]
}

export interface VoiceAssignment {
  characterName: string
  assignedVoiceProfile: VoiceProfile
  confidence: number
  reasoning: string
  alternativeVoices: VoiceProfile[]
  emotionalModifiers: {
    [emotion: string]: {
      speed: number
      tone: string
      nonVerbalSounds: string[]
    }
  }
}

export interface StoryVoiceMap {
  storyId: string
  narratorVoice: VoiceProfile
  characterAssignments: Map<string, VoiceAssignment>
  voiceConsistencyRules: VoiceConsistencyRule[]
  adaptiveSettings: {
    allowEmotionalVariation: boolean
    useContextualSpeed: boolean
    enableCharacterGrowthVoices: boolean
  }
}

export interface VoiceConsistencyRule {
  characterName: string
  rule: string
  context: string
  voiceModification: Partial<VoiceProfile>
}

export class VoiceCharacterAssignmentAgent {
  private storyId: string
  private voiceBackend: DiaMetistroVoiceBackend
  private availableVoices: VoiceProfile[]

  constructor(storyId: string, voiceBackend: DiaMetistroVoiceBackend) {
    this.storyId = storyId
    this.voiceBackend = voiceBackend
    this.availableVoices = voiceBackend.getVoiceProfiles()
  }

  /**
   * THE MAIN MAGIC - Assign perfect voices to all story characters
   */
  async assignVoicesToStory(
    storyContext: {
      title: string
      genre: string
      targetAge: string
      themes: string[]
      characters: CharacterProfile[]
      narrativeStyle: string
    }
  ): Promise<StoryVoiceMap> {
    console.log(`🎭 Assigning voices for "${storyContext.title}" with ${storyContext.characters.length} characters`)

    // Step 1: Analyze story context for voice strategy
    const voiceStrategy = await this.analyzeVoiceStrategy(storyContext)
    
    // Step 2: Select optimal narrator voice
    const narratorVoice = await this.selectNarratorVoice(storyContext, voiceStrategy)
    
    // Step 3: Assign voices to each character
    const characterAssignments = new Map<string, VoiceAssignment>()
    
    for (const character of storyContext.characters) {
      const assignment = await this.assignCharacterVoice(character, storyContext, voiceStrategy)
      characterAssignments.set(character.name, assignment)
      
      console.log(`🎪 ${character.name} → ${assignment.assignedVoiceProfile.name} (${(assignment.confidence * 100).toFixed(0)}% confidence)`)
    }
    
    // Step 4: Create voice consistency rules
    const consistencyRules = await this.createVoiceConsistencyRules(storyContext.characters, characterAssignments)
    
    // Step 5: Set up adaptive settings
    const adaptiveSettings = this.configureAdaptiveSettings(storyContext)

    const storyVoiceMap: StoryVoiceMap = {
      storyId: this.storyId,
      narratorVoice,
      characterAssignments,
      voiceConsistencyRules: consistencyRules,
      adaptiveSettings
    }

    // Step 6: Log the voice assignment session
    await this.logVoiceAssignments(storyVoiceMap)

    return storyVoiceMap
  }

  /**
   * Analyze story context to determine voice assignment strategy
   */
  private async analyzeVoiceStrategy(storyContext: any): Promise<{
    overallTone: string
    voiceDistribution: string
    specialConsiderations: string[]
    targetEmotionalRange: string[]
  }> {
    const strategyPrompt = `Analyze this SoulScribe story for optimal voice assignment strategy:

Title: ${storyContext.title}
Genre: ${storyContext.genre}
Target Age: ${storyContext.targetAge}
Themes: ${storyContext.themes.join(', ')}
Narrative Style: ${storyContext.narrativeStyle}

Characters:
${storyContext.characters.map(ch => `- ${ch.name}: ${ch.role}, ${ch.archetype}, ${ch.spiritualRole}`).join('\n')}

Determine:
1. Overall tone for voice selection (warm/authoritative/mystical/playful)
2. Voice distribution strategy (diverse/harmonious/contrasting)
3. Special considerations for this story type
4. Target emotional range for voices

Respond with JSON:
{
  "overallTone": "warm",
  "voiceDistribution": "harmonious",
  "specialConsiderations": ["spiritual depth", "age appropriate"],
  "targetEmotionalRange": ["wonder", "wisdom", "compassion"]
}`

    const response = await callAgent({
      agentType: 'voice_character_agent' as any,
      messages: [{ role: 'user', content: strategyPrompt }],
      temperature: 0.6,
      maxTokens: 800
    })

    try {
      return JSON.parse(response.content)
    } catch {
      return {
        overallTone: 'warm',
        voiceDistribution: 'harmonious',
        specialConsiderations: ['spiritual depth', 'age appropriate'],
        targetEmotionalRange: ['wonder', 'wisdom', 'compassion']
      }
    }
  }

  /**
   * Select the perfect narrator voice for the story
   */
  private async selectNarratorVoice(storyContext: any, voiceStrategy: any): Promise<VoiceProfile> {
    const narratorPrompt = `Select the ideal narrator voice for this SoulScribe story:

Story Context:
- Title: ${storyContext.title}
- Genre: ${storyContext.genre}
- Target Age: ${storyContext.targetAge}
- Overall Tone: ${voiceStrategy.overallTone}
- Themes: ${storyContext.themes.join(', ')}

Available Voice Profiles:
${this.availableVoices.map(v => `- ${v.id}: ${v.name} (${v.archetype}, ${v.tone}, ${v.age})`).join('\n')}

Consider:
- The narrator should embody the story's spiritual essence
- Voice should be appropriate for target age
- Tone should match the overall story mood
- Should complement character voices without overwhelming

Respond with the voice profile ID that best fits.`

    const response = await callAgent({
      agentType: 'voice_character_agent' as any,
      messages: [{ role: 'user', content: narratorPrompt }],
      temperature: 0.4,
      maxTokens: 200
    })

    // Extract voice ID from response
    const selectedVoiceId = this.extractVoiceIdFromResponse(response.content)
    return this.availableVoices.find(v => v.id === selectedVoiceId) || 
           this.availableVoices.find(v => v.isDefault) || 
           this.availableVoices[0]
  }

  /**
   * Assign the perfect voice to a character
   */
  private async assignCharacterVoice(
    character: CharacterProfile,
    storyContext: any,
    voiceStrategy: any
  ): Promise<VoiceAssignment> {
    const assignmentPrompt = `Assign the perfect voice to this SoulScribe character:

Character Profile:
- Name: ${character.name}
- Role: ${character.role}
- Archetype: ${character.archetype}
- Spiritual Role: ${character.spiritualRole}
- Age: ${character.age}
- Gender: ${character.gender}
- Personality: ${character.personality.join(', ')}
- Emotional Range: ${character.emotionalRange.join(', ')}

Story Context:
- Genre: ${storyContext.genre}
- Target Age: ${storyContext.targetAge}
- Overall Tone: ${voiceStrategy.overallTone}

Available Voices:
${this.availableVoices.map(v => `- ${v.id}: ${v.name} (${v.archetype}, ${v.tone}, ${v.age}, ${v.gender})`).join('\n')}

Dialogue Examples:
${character.keyDialogueExamples.slice(0, 2).join('\n')}

Select the voice that best matches this character's essence and provide:
1. Primary voice choice with confidence (0-1)
2. Reasoning for the choice
3. 2 alternative voices
4. Emotional modifiers for different moods

Respond with JSON:
{
  "primaryVoiceId": "voice_id",
  "confidence": 0.85,
  "reasoning": "explanation of why this voice fits",
  "alternativeVoiceIds": ["alt1", "alt2"],
  "emotionalModifiers": {
    "sad": {"speed": 0.8, "tone": "gentle", "nonVerbalSounds": ["sighs"]},
    "excited": {"speed": 1.2, "tone": "energetic", "nonVerbalSounds": ["laughs"]}
  }
}`

    const response = await callAgent({
      agentType: 'voice_character_agent' as any,
      messages: [{ role: 'user', content: assignmentPrompt }],
      temperature: 0.7,
      maxTokens: 1000
    })

    try {
      const parsed = JSON.parse(response.content)
      
      const assignedVoice = this.availableVoices.find(v => v.id === parsed.primaryVoiceId) || this.availableVoices[0]
      const alternativeVoices = parsed.alternativeVoiceIds
        .map((id: string) => this.availableVoices.find(v => v.id === id))
        .filter(Boolean)

      return {
        characterName: character.name,
        assignedVoiceProfile: assignedVoice,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Voice matches character archetype',
        alternativeVoices,
        emotionalModifiers: parsed.emotionalModifiers || {}
      }
    } catch {
      // Fallback assignment based on archetype matching
      return this.fallbackVoiceAssignment(character)
    }
  }

  /**
   * Create voice consistency rules for character development
   */
  private async createVoiceConsistencyRules(
    characters: CharacterProfile[],
    assignments: Map<string, VoiceAssignment>
  ): Promise<VoiceConsistencyRule[]> {
    const rules: VoiceConsistencyRule[] = []

    for (const character of characters) {
      const assignment = assignments.get(character.name)
      if (!assignment) continue

      // Rule for character growth/transformation
      if (character.spiritualRole === 'seeker') {
        rules.push({
          characterName: character.name,
          rule: 'Voice gains confidence as character grows',
          context: 'Character development arc',
          voiceModification: { tone: 'authoritative' }
        })
      }

      // Rule for emotional moments
      if (character.emotionalRange.includes('vulnerable')) {
        rules.push({
          characterName: character.name,
          rule: 'Voice softens during vulnerable moments',
          context: 'Emotional revelation scenes',
          voiceModification: { tone: 'gentle' }
        })
      }

      // Rule for wisdom sharing
      if (character.spiritualRole === 'teacher' || character.role === 'wise_elder') {
        rules.push({
          characterName: character.name,
          rule: 'Voice becomes more resonant when sharing wisdom',
          context: 'Teaching or guidance moments',
          voiceModification: { tone: 'wise' }
        })
      }
    }

    return rules
  }

  /**
   * Configure adaptive settings based on story characteristics
   */
  private configureAdaptiveSettings(storyContext: any): StoryVoiceMap['adaptiveSettings'] {
    return {
      allowEmotionalVariation: true,
      useContextualSpeed: storyContext.targetAge === 'child', // Slower for children
      enableCharacterGrowthVoices: storyContext.themes.includes('transformation') || storyContext.themes.includes('growth')
    }
  }

  /**
   * Apply voice assignment to chapter content
   */
  async applyVoiceAssignments(
    chapterContent: string,
    storyVoiceMap: StoryVoiceMap,
    chapterContext: {
      number: number
      emotionalTone: string
      keyCharacters: string[]
    }
  ): Promise<{
    voiceSegments: Array<{
      text: string
      voiceProfile: VoiceProfile
      speaker: string
      emotionalModifiers?: any
    }>
    narratorSegments: Array<{
      text: string
      voiceProfile: VoiceProfile
    }>
  }> {
    const voiceSegments = []
    const narratorSegments = []
    
    // Parse chapter into segments
    const segments = this.parseContentIntoVoiceSegments(chapterContent)
    
    for (const segment of segments) {
      if (segment.type === 'dialogue' && segment.speaker) {
        const assignment = storyVoiceMap.characterAssignments.get(segment.speaker)
        if (assignment) {
          // Apply emotional modifiers if available
          const emotionalMod = assignment.emotionalModifiers[chapterContext.emotionalTone] || {}
          
          voiceSegments.push({
            text: segment.text,
            voiceProfile: assignment.assignedVoiceProfile,
            speaker: segment.speaker,
            emotionalModifiers: emotionalMod
          })
        }
      } else {
        // Narrative segment
        narratorSegments.push({
          text: segment.text,
          voiceProfile: storyVoiceMap.narratorVoice
        })
      }
    }
    
    return { voiceSegments, narratorSegments }
  }

  /**
   * Generate character voice preview
   */
  async generateCharacterVoicePreviews(
    storyVoiceMap: StoryVoiceMap,
    previewTexts: { [characterName: string]: string }
  ): Promise<{ [characterName: string]: string }> {
    const previews: { [characterName: string]: string } = {}
    
    for (const [characterName, previewText] of Object.entries(previewTexts)) {
      const assignment = storyVoiceMap.characterAssignments.get(characterName)
      if (assignment) {
        try {
          const audioResult = await this.voiceBackend.generateAudio({
            text: previewText,
            voiceProfile: assignment.assignedVoiceProfile,
            outputPath: `/tmp/preview_${characterName}_${Date.now()}.wav`
          })
          
          if (audioResult.success && audioResult.audioPath) {
            previews[characterName] = audioResult.audioPath
          }
        } catch (error) {
          console.warn(`Failed to generate preview for ${characterName}:`, error)
        }
      }
    }
    
    return previews
  }

  /**
   * Optimize voice assignments based on user feedback
   */
  async optimizeVoiceAssignments(
    storyVoiceMap: StoryVoiceMap,
    feedback: Array<{
      characterName: string
      issue: string
      suggestedImprovement: string
    }>
  ): Promise<StoryVoiceMap> {
    const optimizedMap = { ...storyVoiceMap }
    
    for (const fb of feedback) {
      const currentAssignment = optimizedMap.characterAssignments.get(fb.characterName)
      if (currentAssignment && currentAssignment.alternativeVoices.length > 0) {
        // Try the first alternative voice
        const newAssignment = {
          ...currentAssignment,
          assignedVoiceProfile: currentAssignment.alternativeVoices[0],
          reasoning: `Optimized based on feedback: ${fb.suggestedImprovement}`
        }
        
        optimizedMap.characterAssignments.set(fb.characterName, newAssignment)
        console.log(`🔄 Optimized voice for ${fb.characterName}: ${newAssignment.assignedVoiceProfile.name}`)
      }
    }
    
    return optimizedMap
  }

  /**
   * Parse content into voice-assignable segments
   */
  private parseContentIntoVoiceSegments(content: string): Array<{
    type: 'dialogue' | 'narrative'
    text: string
    speaker?: string
    emotion?: string
  }> {
    const segments = []
    const lines = content.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for speaker tags [S1], [S2]
      const speakerMatch = trimmedLine.match(/^\[S(\d+)\]\s*(.+)/)
      if (speakerMatch) {
        segments.push({
          type: 'dialogue' as const,
          text: speakerMatch[2],
          speaker: `Speaker${speakerMatch[1]}`
        })
      } else if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
        // Regular dialogue
        segments.push({
          type: 'dialogue' as const,
          text: trimmedLine.slice(1, -1),
          speaker: 'Character'
        })
      } else if (trimmedLine.length > 0) {
        // Narrative
        segments.push({
          type: 'narrative' as const,
          text: trimmedLine
        })
      }
    }
    
    return segments
  }

  /**
   * Extract voice ID from AI response
   */
  private extractVoiceIdFromResponse(response: string): string {
    const idMatch = response.match(/([a-z_]+(?:_[a-z]+)*)/i)
    return idMatch ? idMatch[1] : 'narrator_main'
  }

  /**
   * Fallback voice assignment based on simple archetype matching
   */
  private fallbackVoiceAssignment(character: CharacterProfile): VoiceAssignment {
    let matchedVoice = this.availableVoices[0]
    
    // Simple archetype to voice mapping
    const archetypeMap = {
      'wise_elder': 'wise_elder',
      'child': 'child_spirit',
      'guide': 'mystical_guide',
      'teacher': 'compassionate_teacher',
      'narrator': 'narrator_main'
    }
    
    const targetArchetype = archetypeMap[character.role as keyof typeof archetypeMap] || 
                           archetypeMap[character.spiritualRole as keyof typeof archetypeMap]
    
    if (targetArchetype) {
      matchedVoice = this.availableVoices.find(v => v.id === targetArchetype) || matchedVoice
    }
    
    return {
      characterName: character.name,
      assignedVoiceProfile: matchedVoice,
      confidence: 0.6,
      reasoning: 'Fallback assignment based on archetype matching',
      alternativeVoices: this.availableVoices.filter(v => v.id !== matchedVoice.id).slice(0, 2),
      emotionalModifiers: {}
    }
  }

  /**
   * Log voice assignments to database
   */
  private async logVoiceAssignments(storyVoiceMap: StoryVoiceMap): Promise<void> {
    const assignmentSummary = Array.from(storyVoiceMap.characterAssignments.entries())
      .map(([char, assignment]) => `${char}: ${assignment.assignedVoiceProfile.name}`)
      .join(', ')
    
    await prisma.agentSession.create({
      data: {
        storyId: this.storyId,
        agentType: 'voice_character_agent',
        input: `Voice assignment for ${storyVoiceMap.characterAssignments.size} characters`,
        output: `Narrator: ${storyVoiceMap.narratorVoice.name}, Characters: ${assignmentSummary}`,
        tokensUsed: 0
      }
    })
  }

  /**
   * Get voice assignment statistics
   */
  async getVoiceAssignmentStats(storyVoiceMap: StoryVoiceMap): Promise<{
    totalCharacters: number
    voiceProfileUsage: { [profileId: string]: number }
    averageConfidence: number
    archetypeDistribution: { [archetype: string]: number }
  }> {
    const assignments = Array.from(storyVoiceMap.characterAssignments.values())
    
    const voiceProfileUsage: { [profileId: string]: number } = {}
    const archetypeDistribution: { [archetype: string]: number } = {}
    let totalConfidence = 0
    
    for (const assignment of assignments) {
      const profileId = assignment.assignedVoiceProfile.id
      voiceProfileUsage[profileId] = (voiceProfileUsage[profileId] || 0) + 1
      
      const archetype = assignment.assignedVoiceProfile.archetype
      archetypeDistribution[archetype] = (archetypeDistribution[archetype] || 0) + 1
      
      totalConfidence += assignment.confidence
    }
    
    return {
      totalCharacters: assignments.length,
      voiceProfileUsage,
      averageConfidence: assignments.length > 0 ? totalConfidence / assignments.length : 0,
      archetypeDistribution
    }
  }
}