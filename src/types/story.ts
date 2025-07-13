export interface Story {
  id: string;
  title: string;
  description?: string;
  genre: string;
  targetAge: 'child' | 'teen' | 'adult' | 'all_ages';
  tone: string[];
  chapterCount: number;
  status: 'planning' | 'writing' | 'reviewing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Story planning data from questionnaire
  themes: string[];
  characters: Character[];
  settings: Setting[];
  learningObjectives: string[];
  
  // Generated content
  outline: string;
  chapters: Chapter[];
  
  // Agent session tracking
  agentSessions: AgentSession[];
}

export interface Chapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  status: 'draft' | 'reviewed' | 'final';
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // AI-generated elements
  illustration?: string;
  summary: string;
  keyLessons: string[];
}

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'guide' | 'supporting';
  archetype: string;
  description: string;
  growthArc: string;
  symbolism: string;
}

export interface Setting {
  id: string;
  name: string;
  description: string;
  symbolism: string;
  mood: string;
}

export interface AgentSession {
  id: string;
  storyId: string;
  agentType: 'soulscribe' | 'wisdom_weaver' | 'metaphor_architect' | 'character_soul' | 'learning_synthesis' | 'quality_guardian';
  input: string;
  output: string;
  timestamp: Date;
  tokensUsed: number;
}

export interface StoryQuestionnaire {
  // Basic story parameters
  genre: string;
  targetAge: 'child' | 'teen' | 'adult' | 'all_ages';
  chapterCount: number;
  estimatedLength: 'short' | 'medium' | 'long';
  
  // Spiritual and thematic elements
  primaryTheme: string;
  lifeLesson: string;
  spiritualElements: string[];
  metaphorPreferences: string[];
  
  // Character and setting preferences
  characterTypes: string[];
  settingPreferences: string[];
  
  // Tone and style
  toneKeywords: string[];
  writingStyle: 'poetic' | 'conversational' | 'mystical' | 'playful';
  
  // Interactive chat responses
  chatResponses: ChatResponse[];
}

export interface ChatResponse {
  question: string;
  answer: string;
  timestamp: Date;
}