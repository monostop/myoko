export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed'

export type TerrainPreference = 'groomed' | 'powder' | 'tree-runs'

export type ResortVisitCounts = Record<string, number>

export interface RecommendationPreferences {
  skillLevel: SkillLevel
  terrainPreferences: TerrainPreference[]
  maxDriveMinutes: number
  familyFriendly: boolean
}

export interface ScoreBreakdown {
  terrain: number
  conditions: number
  convenience: number
  features: number
  novelty: number
  total: number
}

export interface RecommendationResult {
  resortId: string
  score: ScoreBreakdown
  rank: number
  explanations: string[]
  highlights: string[]
  warnings: string[]
}

export const DEFAULT_PREFERENCES: RecommendationPreferences = {
  skillLevel: 'intermediate',
  terrainPreferences: ['groomed'],
  maxDriveMinutes: 60,
  familyFriendly: false,
}
