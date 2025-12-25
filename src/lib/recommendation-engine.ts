import type { ResortState, ResortConfig } from '@/types'
import type {
  RecommendationPreferences,
  RecommendationResult,
  ResortVisitCounts,
  ScoreBreakdown,
  SkillLevel,
  TerrainPreference,
} from '@/types/recommendation'

interface ResortFeatures {
  hasFreeride: boolean
  hasTreeRuns: boolean
  hasLongRuns: boolean
  isFamilyFriendly: boolean
  isInterconnected: boolean
}

function parseResortFeatures(notes?: string): ResortFeatures {
  const n = (notes ?? '').toLowerCase()
  return {
    hasFreeride: n.includes('freeride') || n.includes('powder'),
    hasTreeRuns: n.includes('tree run'),
    hasLongRuns: n.includes('longest run'),
    isFamilyFriendly: n.includes('kids') || n.includes('family'),
    isInterconnected: n.includes('interconnected') || n.includes('connected'),
  }
}

function calculateSkillMatch(
  terrain: ResortConfig['terrain'],
  total: number,
  skill: SkillLevel
): { points: number; explanations: string[] } {
  const explanations: string[] = []
  let points = 0

  switch (skill) {
    case 'beginner': {
      const ratio = terrain.beginner / total
      points = ratio * 22
      if (ratio >= 0.4) {
        explanations.push(`${Math.round(ratio * 100)}% beginner terrain`)
      } else if (ratio >= 0.25) {
        explanations.push(`${terrain.beginner} beginner slopes available`)
      }
      break
    }
    case 'intermediate': {
      const ratio = terrain.intermediate / total
      points = ratio * 22
      if (ratio >= 0.4) {
        explanations.push(`${Math.round(ratio * 100)}% intermediate terrain`)
      }
      break
    }
    case 'advanced': {
      const ratio = terrain.advanced / total
      points = ratio * 22
      if (ratio >= 0.3) {
        explanations.push(`${Math.round(ratio * 100)}% advanced terrain`)
      }
      break
    }
    case 'mixed': {
      const variance =
        Math.abs(terrain.beginner - terrain.intermediate) +
        Math.abs(terrain.intermediate - terrain.advanced)
      const balance = 1 - variance / (total * 2)
      points = balance * 22
      if (balance >= 0.6) {
        explanations.push('Well-balanced terrain for all skill levels')
      }
      break
    }
  }

  return { points, explanations }
}

function calculateTerrainPreferenceMatch(
  preferences: TerrainPreference[],
  features: ResortFeatures,
  config: ResortConfig
): { points: number; explanations: string[] } {
  const explanations: string[] = []
  let points = 0
  const maxPerPref = 13 / Math.max(preferences.length, 1)

  for (const pref of preferences) {
    switch (pref) {
      case 'groomed':
        points += (config.slopesTotal / 84) * maxPerPref
        if (config.slopesTotal >= 20) {
          explanations.push(`${config.slopesTotal} slopes with groomed runs`)
        }
        break
      case 'powder':
        if (features.hasFreeride) {
          points += maxPerPref
          explanations.push('Known for powder and freeride terrain')
        } else {
          points += maxPerPref * 0.3
        }
        break
      case 'tree-runs':
        if (features.hasTreeRuns) {
          points += maxPerPref
          explanations.push('Excellent tree run terrain')
        } else {
          points += maxPerPref * 0.2
        }
        break
    }
  }

  return { points, explanations }
}

function calculateTerrainScore(
  config: ResortConfig,
  preferences: RecommendationPreferences
): { score: number; explanations: string[] } {
  const { terrain } = config
  const total = terrain.beginner + terrain.intermediate + terrain.advanced
  const explanations: string[] = []
  let score = 0

  const skillScore = calculateSkillMatch(terrain, total, preferences.skillLevel)
  score += skillScore.points
  explanations.push(...skillScore.explanations)

  const features = parseResortFeatures(config.notes)
  const prefScore = calculateTerrainPreferenceMatch(
    preferences.terrainPreferences,
    features,
    config
  )
  score += prefScore.points
  explanations.push(...prefScore.explanations)

  return { score: Math.min(35, score), explanations }
}

function calculateConditionsScore(resort: ResortState): {
  score: number
  explanations: string[]
  warnings: string[]
} {
  const explanations: string[] = []
  const warnings: string[] = []
  let score = 0

  switch (resort.manual.status) {
    case 'OPEN':
      score += 9
      explanations.push('Resort fully open')
      break
    case 'PARTIAL':
      score += 4
      warnings.push('Resort partially open')
      break
    case 'CLOSED':
      score += 0
      warnings.push('Resort currently closed')
      break
    case 'UNKNOWN':
      score += 3
      break
  }

  const snowfall = resort.weather?.snowfall24h ?? 0
  if (snowfall >= 30) {
    score += 13
    explanations.push(`${Math.round(snowfall)}cm fresh snow forecast`)
  } else if (snowfall >= 15) {
    score += 9
    explanations.push(`${Math.round(snowfall)}cm fresh snow expected`)
  } else if (snowfall >= 5) {
    score += 4
    explanations.push(`Light snow forecast (${Math.round(snowfall)}cm)`)
  }

  if (resort.manual.liftsOpen !== null && resort.config.liftsTotal > 0) {
    const liftRatio = resort.manual.liftsOpen / resort.config.liftsTotal
    if (liftRatio < 0.5) {
      warnings.push(
        `Only ${resort.manual.liftsOpen}/${resort.config.liftsTotal} lifts operating`
      )
    }
  }

  return { score: Math.min(22, score), explanations, warnings }
}

function calculateConvenienceScore(
  config: ResortConfig,
  maxDriveMinutes: number
): { score: number; explanations: string[]; warnings: string[] } {
  const explanations: string[] = []
  const warnings: string[] = []

  if (config.driveMinutes > maxDriveMinutes) {
    const overageRatio = (config.driveMinutes - maxDriveMinutes) / maxDriveMinutes
    const penalty = Math.min(18, overageRatio * 18)
    warnings.push(
      `${config.driveMinutes} min drive exceeds your ${maxDriveMinutes} min preference`
    )
    return { score: Math.max(0, 18 - penalty), explanations, warnings }
  }

  const efficiency = 1 - config.driveMinutes / maxDriveMinutes
  const score = 9 + efficiency * 9

  if (config.driveMinutes <= 10) {
    explanations.push(`Only ${config.driveMinutes} min drive`)
  } else if (config.driveMinutes <= 30) {
    explanations.push(`Short ${config.driveMinutes} min drive`)
  }

  return { score, explanations, warnings }
}

function calculateFeaturesScore(
  config: ResortConfig,
  preferences: RecommendationPreferences
): { score: number; explanations: string[]; highlights: string[] } {
  const explanations: string[] = []
  const highlights: string[] = []
  const features = parseResortFeatures(config.notes)
  let score = 0

  if (preferences.familyFriendly) {
    if (features.isFamilyFriendly) {
      score += 8
      explanations.push('Family-friendly amenities')
      highlights.push('Great for families')
    } else if (config.terrain.beginner >= 4) {
      score += 4
      explanations.push('Multiple beginner slopes for children')
    }
  }

  if (features.hasLongRuns) {
    score += 2
    highlights.push('Longest run in Japan (8.5km)')
  }
  if (features.isInterconnected) {
    score += 2
    highlights.push('21 interconnected resorts')
  }

  if (config.slopesTotal >= 30) {
    score += 1
    highlights.push(`${config.slopesTotal} slopes`)
  }

  return { score: Math.min(13, score), explanations, highlights }
}

const NOVELTY_MAX_POINTS = 12

function calculateNoveltyScore(
  config: ResortConfig,
  visitCounts: ResortVisitCounts
): { score: number; explanations: string[]; highlights: string[] } {
  const explanations: string[] = []
  const highlights: string[] = []

  const visits = visitCounts[config.id] ?? 0

  // Never visited = maximum novelty
  if (visits === 0) {
    highlights.push('Never visited')
    return { score: NOVELTY_MAX_POINTS, explanations, highlights }
  }

  // Resort size factor: more slopes = more to explore = slower novelty decay
  // slopeFactor = slopes / 10, so a 10-slope resort has factor 1, 80-slope has factor 8
  const slopeFactor = config.slopesTotal / 10

  // Exploration factor: how "explored" is this resort?
  // visits=2 at 10-slope resort: explorationFactor = 2/1 = 2.0 (fully explored)
  // visits=2 at 80-slope resort: explorationFactor = 2/8 = 0.25 (barely explored)
  const explorationFactor = visits / slopeFactor

  // Score decays as exploration increases, capped at 0
  const score = NOVELTY_MAX_POINTS * (1 - Math.min(1, explorationFactor))

  // Add explanatory text based on novelty level
  if (score >= NOVELTY_MAX_POINTS * 0.75) {
    explanations.push(
      `Only visited ${visits} time${visits > 1 ? 's' : ''} - still lots to explore`
    )
  } else if (score >= NOVELTY_MAX_POINTS * 0.5) {
    explanations.push(`Visited ${visits} times - some areas still unexplored`)
  } else if (score < NOVELTY_MAX_POINTS * 0.25 && visits >= 3) {
    explanations.push(`Familiar territory (${visits} visits)`)
  }

  return { score: Math.max(0, score), explanations, highlights }
}

export function calculateRecommendations(
  resorts: ResortState[],
  preferences: RecommendationPreferences,
  visitCounts: ResortVisitCounts = {}
): RecommendationResult[] {
  const results: RecommendationResult[] = resorts.map((resort) => {
    const isClosed = resort.manual.status === 'CLOSED'

    // Closed resorts get zero score
    if (isClosed) {
      return {
        resortId: resort.config.id,
        score: { terrain: 0, conditions: 0, convenience: 0, features: 0, novelty: 0, total: 0 },
        rank: 0,
        explanations: [],
        highlights: [],
        warnings: ['Resort is currently closed'],
      }
    }

    const terrain = calculateTerrainScore(resort.config, preferences)
    const conditions = calculateConditionsScore(resort)
    const convenience = calculateConvenienceScore(
      resort.config,
      preferences.maxDriveMinutes
    )
    const features = calculateFeaturesScore(resort.config, preferences)
    const novelty = calculateNoveltyScore(resort.config, visitCounts)

    let total =
      terrain.score +
      conditions.score +
      convenience.score +
      features.score +
      novelty.score

    // Apply severe penalty if drive time exceeds preference
    if (resort.config.driveMinutes > preferences.maxDriveMinutes) {
      const overageRatio = (resort.config.driveMinutes - preferences.maxDriveMinutes) / preferences.maxDriveMinutes
      const multiplier = 1 / (1 + overageRatio)
      total = total * multiplier
    }

    const score: ScoreBreakdown = {
      terrain: terrain.score,
      conditions: conditions.score,
      convenience: convenience.score,
      features: features.score,
      novelty: novelty.score,
      total,
    }

    return {
      resortId: resort.config.id,
      score,
      rank: 0,
      explanations: [
        ...terrain.explanations,
        ...conditions.explanations,
        ...convenience.explanations,
        ...features.explanations,
        ...novelty.explanations,
      ],
      highlights: [...features.highlights, ...novelty.highlights],
      warnings: [...conditions.warnings, ...convenience.warnings],
    }
  })

  results.sort((a, b) => b.score.total - a.score.total)
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return results
}
