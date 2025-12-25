import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  RecommendationPreferences,
  SkillLevel,
  TerrainPreference,
} from '@/types/recommendation'

interface PreferencesFormProps {
  preferences: RecommendationPreferences
  onPreferencesChange: (preferences: RecommendationPreferences) => void
}

const SKILL_LEVELS: { value: SkillLevel; label: string; icon: string }[] = [
  { value: 'beginner', label: 'Beginner', icon: '●' },
  { value: 'intermediate', label: 'Intermediate', icon: '■' },
  { value: 'advanced', label: 'Advanced', icon: '◆' },
  { value: 'mixed', label: 'Mixed Group', icon: '◐' },
]

const TERRAIN_OPTIONS: {
  value: TerrainPreference
  label: string
  icon: React.ReactNode
}[] = [
  {
    value: 'groomed',
    label: 'Groomed',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20h16M4 16h16M4 12h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'powder',
    label: 'Powder',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12 2L9.5 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5 6-4.5h-7.5L12 2z" />
      </svg>
    ),
  },
  {
    value: 'tree-runs',
    label: 'Tree Runs',
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12 2L7 9h3v3H7l5 7 5-7h-3V9h3L12 2zM11 17v5h2v-5h-2z" />
      </svg>
    ),
  },
]

export function PreferencesForm({
  preferences,
  onPreferencesChange,
}: PreferencesFormProps) {
  const toggleTerrain = (terrain: TerrainPreference) => {
    const current = preferences.terrainPreferences
    const updated = current.includes(terrain)
      ? current.filter((t) => t !== terrain)
      : [...current, terrain]
    onPreferencesChange({ ...preferences, terrainPreferences: updated })
  }

  const driveTimeMarks = [15, 30, 45, 60, 90, 120]

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* Skill Level */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium block">
          Skill Level
        </label>
        <Select
          value={preferences.skillLevel}
          onValueChange={(v) =>
            onPreferencesChange({ ...preferences, skillLevel: v as SkillLevel })
          }
        >
          <SelectTrigger className="w-full h-11 bg-background/50 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'text-xs',
                      level.value === 'beginner' && 'text-emerald-500',
                      level.value === 'intermediate' && 'text-sky-500',
                      level.value === 'advanced' && 'text-zinc-900 dark:text-zinc-100',
                      level.value === 'mixed' && 'text-amber-500'
                    )}
                  >
                    {level.icon}
                  </span>
                  <span>{level.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Terrain Type */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium block">
          Terrain
        </label>
        <div className="flex gap-1.5">
          {TERRAIN_OPTIONS.map((option) => {
            const isSelected = preferences.terrainPreferences.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => toggleTerrain(option.value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border transition-all duration-200',
                  'hover:border-foreground/20',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-background/50 backdrop-blur-sm border-border/50 text-muted-foreground'
                )}
              >
                <span className={cn('transition-transform', isSelected && 'scale-110')}>
                  {option.icon}
                </span>
                <span className="text-[10px] font-medium tracking-wide">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Max Drive Time */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium block">
          Max Drive
        </label>
        <div className="space-y-2">
          <div className="relative pt-1">
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={preferences.maxDriveMinutes}
              onChange={(e) =>
                onPreferencesChange({
                  ...preferences,
                  maxDriveMinutes: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-foreground
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-foreground
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
            {/* Track marks */}
            <div className="absolute top-0 left-0 right-0 flex justify-between px-[6px] pointer-events-none">
              {driveTimeMarks.map((mark) => (
                <div
                  key={mark}
                  className={cn(
                    'w-0.5 h-1.5 rounded-full transition-colors',
                    preferences.maxDriveMinutes >= mark
                      ? 'bg-foreground/30'
                      : 'bg-border'
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/50">10 min</span>
            <span className="text-sm font-light tabular-nums">
              {preferences.maxDriveMinutes} min
            </span>
            <span className="text-[10px] text-muted-foreground/50">120 min</span>
          </div>
        </div>
      </div>

      {/* Family Friendly */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium block">
          Options
        </label>
        <button
          onClick={() =>
            onPreferencesChange({
              ...preferences,
              familyFriendly: !preferences.familyFriendly,
            })
          }
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200',
            'hover:border-foreground/20',
            preferences.familyFriendly
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : 'bg-background/50 backdrop-blur-sm border-border/50'
          )}
        >
          <span className="text-lg">
            {preferences.familyFriendly ? '✓' : '○'}
          </span>
          <div className="text-left">
            <div className="text-sm font-medium">Family Friendly</div>
            <div
              className={cn(
                'text-[10px]',
                preferences.familyFriendly
                  ? 'text-background/70'
                  : 'text-muted-foreground/60'
              )}
            >
              Kid-focused amenities
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
